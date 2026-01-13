import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Role } from '../entities/role.entity';
import {
  Permission,
  PermissionAction,
  PermissionSubject,
} from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Admin } from '../entities/admin.entity';
import { AdminRole } from '../entities/admin-role.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(AdminRole)
    private adminRoleRepository: Repository<AdminRole>,
  ) {}

  /**
   * Seed initial roles, permissions, and super admin
   */
  async seedInitialData(): Promise<void> {
    this.logger.log('Starting database seeding...');

    try {
      // 1. Create Permissions
      await this.createPermissions();

      // 2. Create Roles
      await this.createRoles();

      // 3. Assign Permissions to Roles
      await this.assignPermissionsToRoles();

      // 4. Create Super Admin (optional)
      await this.createSuperAdmin();

      this.logger.log('Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('Error during seeding:', error);
      throw error;
    }
  }

  private async createPermissions(): Promise<void> {
    this.logger.log('Creating permissions...');

    const permissions = [
      // Birth Registration
      {
        name: 'birth_registration',
        description: 'Permission to register births',
        actions: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
        ],
        subjects: [PermissionSubject.BIRTH],
      },
      // Death Registration
      {
        name: 'death_registration',
        description: 'Permission to register deaths',
        actions: [PermissionAction.CREATE, PermissionAction.READ],
        subjects: [PermissionSubject.BIRTH], // Using BIRTH as generic registry subject
      },
      // Update Information
      {
        name: 'update_information',
        description: 'Permission to update personal information',
        actions: [PermissionAction.UPDATE, PermissionAction.READ],
        subjects: [PermissionSubject.PERSON],
      },
      // Move In/Move Out
      {
        name: 'movein_moveout',
        description: 'Permission to register move in/move out',
        actions: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
        ],
        subjects: [PermissionSubject.HOUSEHOLD],
      },
      // Relationship Application
      {
        name: 'relationship_application',
        description: 'Permission to apply for relationship changes',
        actions: [PermissionAction.CREATE, PermissionAction.READ],
        subjects: [PermissionSubject.PERSON, PermissionSubject.HOUSEHOLD],
      },
      // Adoption Application
      {
        name: 'adoption_application',
        description: 'Permission to apply for adoption',
        actions: [PermissionAction.CREATE, PermissionAction.READ],
        subjects: [PermissionSubject.PERSON, PermissionSubject.HOUSEHOLD],
      },
      // CID Print Application
      {
        name: 'cid_print_application',
        description: 'Permission to apply for CID printing',
        actions: [PermissionAction.CREATE, PermissionAction.READ],
        subjects: [PermissionSubject.PERSON],
      },
      // Admin Full Access
      {
        name: 'admin_full_access',
        description: 'Full administrative access',
        actions: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.APPROVE,
        ],
        subjects: [
          PermissionSubject.BIRTH,
          PermissionSubject.PERSON,
          PermissionSubject.HOUSEHOLD,
          PermissionSubject.ADMIN,
          PermissionSubject.ROLE,
          PermissionSubject.PERMISSION,
        ],
      },
    ];

    for (const perm of permissions) {
      const existing = await this.permissionRepository.findOne({
        where: { name: perm.name },
      });

      if (!existing) {
        await this.permissionRepository.save(perm);
        this.logger.log(`Created permission: ${perm.name}`);
      } else {
        this.logger.log(`Permission already exists: ${perm.name}`);
      }
    }
  }

  private async createRoles(): Promise<void> {
    this.logger.log('Creating roles...');

    const roles = [
      {
        name: 'Super Admin',
        description: 'Super administrator with full access',
      },
      {
        name: 'Admin',
        description: 'Administrator with limited access',
      },
      {
        name: 'Dzongkhag Admin',
        description: 'District level administrator',
      },
      {
        name: 'Gewog Admin',
        description: 'Block level administrator',
      },
    ];

    for (const role of roles) {
      const existing = await this.roleRepository.findOne({
        where: { name: role.name },
      });

      if (!existing) {
        await this.roleRepository.save(role);
        this.logger.log(`Created role: ${role.name}`);
      } else {
        this.logger.log(`Role already exists: ${role.name}`);
      }
    }
  }

  private async assignPermissionsToRoles(): Promise<void> {
    this.logger.log('Assigning permissions to roles...');

    // Super Admin gets full access
    const superAdminRole = await this.roleRepository.findOne({
      where: { name: 'Super Admin' },
    });

    if (superAdminRole) {
      const adminPermission = await this.permissionRepository.findOne({
        where: { name: 'admin_full_access' },
      });

      if (adminPermission) {
        const existing = await this.rolePermissionRepository.findOne({
          where: {
            roleId: superAdminRole.id,
            permissionId: adminPermission.id,
          },
        });

        if (!existing) {
          await this.rolePermissionRepository.save({
            roleId: superAdminRole.id,
            permissionId: adminPermission.id,
          });
          this.logger.log('Assigned full access to Super Admin role');
        }
      }
    }
  }

  private async createSuperAdmin(): Promise<void> {
    this.logger.log('Creating super admin...');

    const superAdminCid = '11111111111111'; // Default super admin CID
    const existing = await this.adminRepository.findOne({
      where: { cidNo: superAdminCid },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('SuperAdmin@123', 12);

      const superAdmin = await this.adminRepository.save({
        cidNo: superAdminCid,
        password: hashedPassword,
        roleType: 'SUPER_ADMIN',
        email: 'superadmin@census.gov.bt',
        isActive: true,
      });

      // Assign Super Admin role
      const superAdminRole = await this.roleRepository.findOne({
        where: { name: 'Super Admin' },
      });

      if (superAdminRole) {
        await this.adminRoleRepository.save({
          adminId: superAdmin.id,
          roleId: superAdminRole.id,
        });
        this.logger.log('Super admin created successfully');
        this.logger.log(`CID: ${superAdminCid}, Password: SuperAdmin@123`);
      }
    } else {
      this.logger.log('Super admin already exists');
    }
  }

  /**
   * Get the default User role ID
   */
  async getDefaultUserRole(): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name: 'User' },
    });
  }
}
