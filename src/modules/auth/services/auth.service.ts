import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { Admin } from '../entities/admin.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AdminRole } from '../entities/admin-role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { OfficeLocation } from '../entities/office-location.entity';
import { Agency } from '../../agency/entities/agency.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TokenType } from '../../../constants/token-type.ts';
import type { UserLoginDto } from '../dto/user-login.dto';
import type { AdminLoginDto } from '../dto/admin-login.dto';
import type { CreateAdminDto } from '../dto/create-admin.dto';
import { randomBytes } from 'node:crypto';

const BCRYPT_ROUNDS = 12;

interface JwtPayload {
  userId: Uuid;
  cidNo: string;
  roleType: 'CITIZEN' | 'ADMIN' | 'SUPER_ADMIN';
  type: TokenType;
  roles?: string[];
  permissions?: Array<{ actions: string[]; subjects: string[] }>;
  officeLocationId?: Uuid;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    cidNo: string;
    roleType: string;
    roles?: string[];
  };
  ability?: Array<{
    name: string;
    description?: string;
    action: string | string[];
    subject: string | string[];
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    // @InjectRepository(Permission)
    // private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(AdminRole)
    private readonly adminRoleRepository: Repository<AdminRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(OfficeLocation)
    private readonly officeLocationRepository: Repository<OfficeLocation>,
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * CITIZEN LOGIN
   * Auto-creates user on first login
   * Citizens don't have roles/permissions - only store their data
   */
  async loginCitizen(
    loginDto: UserLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    const { cidNo, password, ndiDeeplink } = loginDto;

    // Validate that at least password or NDI deeplink is provided
    if (!password && !ndiDeeplink) {
      throw new BadRequestException(
        'Either password or NDI deeplink is required',
      );
    }

    // Check if user exists
    let user = await this.usersService.findByCidNo(cidNo);

    // First time login - auto-create user
    if (!user) {
      user = await this.createCitizenUser(cidNo, password, ndiDeeplink);
    } else {
      // Existing user - verify credentials
      if (password && user.password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }
      }

      // Update NDI deeplink if provided
      if (ndiDeeplink) {
        await this.usersService.update(user.id, { ndiDeeplink });
      }
    }

    // Generate access token (15 minutes)
    const accessToken = await this.generateAccessToken({
      userId: user.id,
      cidNo: user.cidNo,
      roleType: 'CITIZEN',
      type: TokenType.ACCESS_TOKEN,
    });

    // Generate refresh token (3 months)
    const refreshToken = await this.generateRefreshToken(user.id, 'CITIZEN');

    // Store refresh token
    await this.storeRefreshToken(
      refreshToken,
      user.id,
      'CITIZEN',
      ipAddress,
      userAgent,
    );

    return {
      message: 'Logged in successfully as Citizen',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        cidNo: user.cidNo,
        roleType: user.roleType,
      },
    };
  }

  /**
   * ADMIN LOGIN
   * Requires pre-registration by SUPER ADMIN
   */
  async loginAdmin(
    loginDto: AdminLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    const admin = await this.adminRepository.findOne({
      where: { cidNo: loginDto.cidNo },
      relations: [
        'adminRoles',
        'adminRoles.role',
        'adminRoles.role.rolePermissions',
        'adminRoles.role.rolePermissions.permission',
      ],
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found. Contact Super Admin.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      admin.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update ndiDeeplink if provided
    if (loginDto.ndiDeeplink !== undefined) {
      admin.ndiDeeplink = loginDto.ndiDeeplink;
      await this.adminRepository.save(admin);
    }

    // Check if SUPER_ADMIN (bypass role/permission checks)
    if (admin.roleType === 'SUPER_ADMIN') {
      // Generate access token (15 minutes)
      const accessToken = await this.generateAccessToken({
        userId: admin.id,
        cidNo: admin.cidNo,
        roleType: 'SUPER_ADMIN',
        type: TokenType.ACCESS_TOKEN,
        roles: [],
        permissions: [],
        officeLocationId: admin.officeLocationId as Uuid,
      });

      // Generate refresh token (3 months)
      const refreshToken = await this.generateRefreshToken(admin.id, 'ADMIN');

      // Store refresh token
      await this.storeRefreshToken(
        refreshToken,
        admin.id,
        'ADMIN',
        ipAddress,
        userAgent,
      );

      return {
        message: 'Logged in successfully as Super Admin',
        accessToken,
        refreshToken,
        user: {
          id: admin.id,
          cidNo: admin.cidNo,
          roleType: admin.roleType,
          roles: [],
        },
        ability: [], // SUPER_ADMIN has no restrictions, empty ability array
      };
    }

    // Regular ADMIN - Get roles and permissions
    const { roles, permissions, permissionDetails } =
      await this.getAdminRolesAndPermissions(admin.id);

    // Format ability array - flatten actions and subjects for each permission
    const ability = permissionDetails.map((perm) => {
      const action = perm.actions.length === 1 ? perm.actions[0] : perm.actions;
      const subject =
        perm.subjects.length === 1 ? perm.subjects[0] : perm.subjects;

      return {
        name: perm.name,
        action: action || [],
        subject: subject || [],
      };
    });

    // Generate access token (15 minutes)
    const accessToken = await this.generateAccessToken({
      userId: admin.id,
      cidNo: admin.cidNo,
      roleType: 'ADMIN',
      type: TokenType.ACCESS_TOKEN,
      roles,
      permissions,
      officeLocationId: admin.officeLocationId as Uuid,
    });

    // Generate refresh token (3 months)
    const refreshToken = await this.generateRefreshToken(admin.id, 'ADMIN');

    // Store refresh token
    await this.storeRefreshToken(
      refreshToken,
      admin.id,
      'ADMIN',
      ipAddress,
      userAgent,
    );

    return {
      message: 'Logged in successfully as Admin',
      accessToken,
      refreshToken,
      user: {
        id: admin.id,
        cidNo: admin.cidNo,
        roleType: admin.roleType,
        roles,
      },
      ability,
    };
  }

  /**
   * AUTO-CREATE CITIZEN USER
   * Called on first login - just stores user data
   */
  private async createCitizenUser(
    cidNo: string,
    password?: string,
    ndiDeeplink?: string,
  ): Promise<User> {
    // Hash password if provided
    const hashedPassword = password
      ? await bcrypt.hash(password, BCRYPT_ROUNDS)
      : null;

    // Create user
    const user = await this.usersService.create({
      cidNo,
      password: hashedPassword || undefined,
      ndiDeeplink: ndiDeeplink || undefined,
    });

    return user;
  }

  /**
   * GET ADMIN ROLES AND PERMISSIONS
   */
  private async getAdminRolesAndPermissions(adminId: string): Promise<{
    roles: string[];
    permissions: Array<{ actions: string[]; subjects: string[] }>;
    permissionDetails: Array<{
      name: string;
      description?: string;
      actions: string[];
      subjects: string[];
    }>;
  }> {
    const adminRoles = await this.adminRoleRepository.find({
      where: { adminId },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    const roles = adminRoles.map((ar) => ar.role.name);

    // Super Admin gets all permissions
    const isSuperAdmin = roles.some((role) =>
      role.toLowerCase().includes('super'),
    );

    if (isSuperAdmin) {
      // Return full CRUD access for all subjects
      return {
        roles,
        permissions: [
          {
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
            subjects: ['*'], // Wildcard for all subjects
          },
        ],
        permissionDetails: [
          {
            name: 'Super Admin',
            description: 'Full system access',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
            subjects: ['*'],
          },
        ],
      };
    }

    // Regular admin - get assigned permissions
    const permissionsMap = new Map<
      string,
      { actions: string[]; subjects: string[] }
    >();

    const permissionDetailsMap = new Map<
      string,
      {
        name: string;
        description?: string;
        actions: string[];
        subjects: string[];
      }
    >();

    adminRoles.forEach((ar) => {
      ar.role.rolePermissions?.forEach((rp) => {
        const key = rp.permission.name;
        if (!permissionsMap.has(key)) {
          permissionsMap.set(key, {
            actions: rp.permission.actions,
            subjects: rp.permission.subjects,
          });
          permissionDetailsMap.set(key, {
            name: rp.permission.name,
            description: rp.permission.description,
            actions: rp.permission.actions,
            subjects: rp.permission.subjects,
          });
        }
      });
    });

    return {
      roles,
      permissions: Array.from(permissionsMap.values()),
      permissionDetails: Array.from(permissionDetailsMap.values()),
    };
  }

  /**
   * GENERATE ACCESS TOKEN (JWT)
   */
  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '15m', // 15 minutes
    });
  }

  /**
   * CREATE ADMIN USER
   * Creates a new admin with office location, roles, and permissions
   */
  async createAdmin(createAdminDto: CreateAdminDto): Promise<{
    admin: Admin;
    assignedRoles: Role[];
    effectivePermissions: Permission[];
  }> {
    // 1. Check if admin with CID already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: { cidNo: createAdminDto.cidNo },
    });

    if (existingAdmin) {
      throw new ConflictException(
        `Admin with CID ${createAdminDto.cidNo} already exists`,
      );
    }

    // 2. Handle Office Location - use existing or create new
    let officeLocation: OfficeLocation;

    if (createAdminDto.officeLocationId) {
      // Use existing office location
      const existing = await this.officeLocationRepository.findOne({
        where: { id: createAdminDto.officeLocationId as any },
      });

      if (!existing) {
        throw new NotFoundException(
          `Office location with ID ${createAdminDto.officeLocationId} not found`,
        );
      }

      officeLocation = existing;
    } else if (createAdminDto.officeLocationName) {
      // Check if office with this name already exists
      const existingByName = await this.officeLocationRepository.findOne({
        where: { name: createAdminDto.officeLocationName },
      });

      if (existingByName) {
        officeLocation = existingByName;
      } else {
        // Create new office location
        officeLocation = await this.officeLocationRepository.save({
          name: createAdminDto.officeLocationName,
        });
      }
    } else {
      throw new BadRequestException(
        'Either officeLocationId or officeLocationName must be provided',
      );
    }

    // 2.5. Validate agency if provided
    if (createAdminDto.agencyId) {
      const agency = await this.agencyRepository.findOne({
        where: { id: createAdminDto.agencyId as any },
      });

      if (!agency) {
        throw new NotFoundException(
          `Agency with ID ${createAdminDto.agencyId} not found`,
        );
      }
    }

    // 3. Validate all role IDs exist
    const roles = await this.roleRepository.findByIds(createAdminDto.roleIds);

    if (roles.length !== createAdminDto.roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(
      createAdminDto.password,
      BCRYPT_ROUNDS,
    );

    // 5. Create Admin entity
    const admin = await this.adminRepository.save({
      cidNo: createAdminDto.cidNo,
      password: hashedPassword,
      email: createAdminDto.email,
      mobileNo: createAdminDto.mobileNo,
      agencyId: createAdminDto.agencyId,
      roleType: 'ADMIN', // Default role type
      officeLocationId: officeLocation.id,
    });

    // 6. Create AdminRole entries (assigns roles to admin)
    const adminRolePromises = roles.map((role) =>
      this.adminRoleRepository.save({
        adminId: admin.id,
        roleId: role.id,
      }),
    );

    await Promise.all(adminRolePromises);

    // 7. Get all permissions from assigned roles
    const rolePermissions = await this.rolePermissionRepository.find({
      where: roles.map((role) => ({ roleId: role.id })),
      relations: ['permission'],
    });

    const uniquePermissions = Array.from(
      new Map(
        rolePermissions.map((rp) => [rp.permission.id, rp.permission]),
      ).values(),
    );

    return {
      admin,
      assignedRoles: roles,
      effectivePermissions: uniquePermissions,
    };
  }

  /**
   * VALIDATE TOKEN AND GET USER
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * CHECK PERMISSION
   * Validates if user has required action on subject
   */
  hasPermission(
    userPermissions: Array<{ actions: string[]; subjects: string[] }>,
    requiredAction: string,
    requiredSubject: string,
  ): boolean {
    return userPermissions.some((perm) => {
      const hasWildcard = perm.subjects.includes('*');
      const hasSubject = hasWildcard || perm.subjects.includes(requiredSubject);
      const hasAction = perm.actions.includes(requiredAction);
      return hasSubject && hasAction;
    });
  }

  /**
   * GENERATE REFRESH TOKEN (3 months expiry)
   */
  private async generateRefreshToken(
    userId: Uuid,
    userType: 'CITIZEN' | 'ADMIN',
  ): Promise<string> {
    const jti = randomBytes(32).toString('hex');

    const payload = {
      userId,
      userType,
      type: TokenType.REFRESH_TOKEN,
      jti, // unique token ID
    };

    // 3 months = 90 days
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '90d',
    });

    return refreshToken;
  }

  /**
   * STORE REFRESH TOKEN
   */
  private async storeRefreshToken(
    token: string,
    userId: Uuid,
    userType: 'CITIZEN' | 'ADMIN',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 3 months

    await this.refreshTokenRepository.save({
      token,
      userId: userType === 'CITIZEN' ? userId : null,
      adminId: userType === 'ADMIN' ? userId : null,
      expiresAt,
      isRevoked: false,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  }

  /**
   * REFRESH ACCESS TOKEN (with rotation)
   * - Validates refresh token
   * - Generates new access token
   * - Generates new refresh token
   * - Revokes old refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Verify refresh token signature
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Check token type
    if (payload.type !== TokenType.REFRESH_TOKEN) {
      throw new UnauthorizedException('Invalid token type');
    }

    // 3. Check if token exists and is not revoked
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 4. Load fresh user data with latest permissions
    const { userId, userType } = payload;

    let accessTokenPayload: JwtPayload;
    let newAccessToken: string;

    if (userType === 'CITIZEN') {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      accessTokenPayload = {
        userId: user.id,
        cidNo: user.cidNo,
        roleType: 'CITIZEN',
        type: TokenType.ACCESS_TOKEN,
      };

      newAccessToken = await this.generateAccessToken(accessTokenPayload);
    } else {
      // ADMIN or SUPER_ADMIN
      const admin = await this.adminRepository.findOne({
        where: { id: userId },
        relations: [
          'adminRoles',
          'adminRoles.role',
          'adminRoles.role.rolePermissions',
          'adminRoles.role.rolePermissions.permission',
        ],
      });

      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      if (admin.roleType === 'SUPER_ADMIN') {
        accessTokenPayload = {
          userId: admin.id,
          cidNo: admin.cidNo,
          roleType: 'SUPER_ADMIN',
          type: TokenType.ACCESS_TOKEN,
          roles: [],
          permissions: [],
          officeLocationId: admin.officeLocationId as Uuid,
        };
      } else {
        const { roles, permissions } = await this.getAdminRolesAndPermissions(
          admin.id,
        );

        accessTokenPayload = {
          userId: admin.id,
          cidNo: admin.cidNo,
          roleType: 'ADMIN',
          type: TokenType.ACCESS_TOKEN,
          roles,
          permissions,
          officeLocationId: admin.officeLocationId as Uuid,
        };
      }

      newAccessToken = await this.generateAccessToken(accessTokenPayload);
    }

    // 5. Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(userId, userType);

    // 6. Store new refresh token
    await this.storeRefreshToken(
      newRefreshToken,
      userId,
      userType,
      ipAddress,
      userAgent,
    );

    // 7. Revoke old refresh token (rotation)
    await this.refreshTokenRepository.update(
      { token: refreshToken },
      { isRevoked: true },
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * LOGOUT (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new NotFoundException('Refresh token not found');
    }

    await this.refreshTokenRepository.update(
      { token: refreshToken },
      { isRevoked: true },
    );
  }

  /**
   * LOGOUT ALL DEVICES (revoke all user's refresh tokens)
   */
  async logoutAllDevices(
    userId: Uuid,
    userType: 'CITIZEN' | 'ADMIN',
  ): Promise<void> {
    const whereCondition =
      userType === 'CITIZEN'
        ? { userId, isRevoked: false }
        : { adminId: userId, isRevoked: false };

    await this.refreshTokenRepository.update(whereCondition, {
      isRevoked: true,
    });
  }
}
