import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { QueryAdminDto } from './dto/query-admin.dto';
import { FilterAdminDto } from './dto/filter-admin.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Admin } from './entities/admin.entity';
import { AdminRole } from './entities/admin-role.entity';
import { OfficeLocation } from '../office-location/entities/office-location.entity';
import { Agency } from '../agency/entities/agency.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(AdminRole)
    private readonly adminRoleRepository: Repository<AdminRole>,
    @InjectRepository(OfficeLocation)
    private readonly officeLocationRepository: Repository<OfficeLocation>,
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    // 1. Validate CID format (400 Bad Request)
    if (!/^\d{2,}$/.test(createAdminDto.cidNo)) {
      throw new BadRequestException('CID must be at least 2 digits');
    }

    // 3. Validate mobile number format if provided (400 Bad Request)
    if (
      createAdminDto.mobileNo &&
      !/^\+975\d{8}$/.test(createAdminDto.mobileNo)
    ) {
      throw new BadRequestException(
        'Mobile number must match format +975XXXXXXXX',
      );
    }

    // 4. Validate email format if provided (400 Bad Request)
    if (createAdminDto.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createAdminDto.email)) {
        throw new BadRequestException('Email must be a valid email address');
      }
    }

    // 5. Validate UUID format for officeLocationId if provided (400 Bad Request)
    if (createAdminDto.officeLocationId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(createAdminDto.officeLocationId)) {
        throw new BadRequestException(
          'Office Location ID must be a valid UUID',
        );
      }
    }

    // 6. Validate UUID format for agencyId if provided (400 Bad Request)
    if (createAdminDto.agencyId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(createAdminDto.agencyId)) {
        throw new BadRequestException('Agency ID must be a valid UUID');
      }
    }

    // 7. Check if admin with CID already exists (409 Conflict)
    const existing = await this.adminRepository.findOne({
      where: { cidNo: createAdminDto.cidNo },
    });

    if (existing) {
      throw new ConflictException(
        `Admin with CID "${createAdminDto.cidNo}" already exists`,
      );
    }

    // 8. Validate office location exists if provided (404 Not Found)
    if (createAdminDto.officeLocationId) {
      const officeLocation = await this.officeLocationRepository.findOne({
        where: { id: createAdminDto.officeLocationId as any },
      });
      if (!officeLocation) {
        throw new NotFoundException(
          `Office location with ID ${createAdminDto.officeLocationId} not found`,
        );
      }
    }

    // 9. Validate agency exists if provided (404 Not Found)
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

    // 10. Hash the password before saving
    const hashedPassword = await bcrypt.hash(
      createAdminDto.password,
      BCRYPT_ROUNDS,
    );

    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });
    return this.adminRepository.save(admin);
  }

  async findAll(queryDto: QueryAdminDto): Promise<PageDto<Admin>> {
    const queryBuilder = this.adminRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.officeLocation', 'officeLocation')
      .leftJoinAndSelect('admin.agency', 'agency')
      .leftJoinAndSelect('admin.adminRoles', 'adminRoles')
      .leftJoinAndSelect('adminRoles.role', 'role');

    // General search across multiple fields using 'q' parameter
    if (queryDto.q) {
      queryBuilder.andWhere(
        '(admin.cid_no ILIKE :search OR admin.full_name ILIKE :search OR admin.email ILIKE :search)',
        {
          search: `%${queryDto.q}%`,
        },
      );
    }

    // Specific CID search (takes precedence if both q and cidNo are provided)
    if (queryDto.cidNo) {
      queryBuilder.andWhere('admin.cid_no ILIKE :cidNo', {
        cidNo: `%${queryDto.cidNo}%`,
      });
    }

    if (queryDto.officeLocationId) {
      queryBuilder.andWhere('admin.office_location_id = :officeLocationId', {
        officeLocationId: queryDto.officeLocationId,
      });
    }

    if (queryDto.agencyId) {
      queryBuilder.andWhere('admin.agency_id = :agencyId', {
        agencyId: queryDto.agencyId,
      });
    }

    queryBuilder.skip(queryDto.skip).take(queryDto.take);

    // Apply ordering - use 'ASC' | 'DESC' explicitly
    if (queryDto.order) {
      queryBuilder.orderBy('admin.createdAt', queryDto.order as 'ASC' | 'DESC');
    }

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: queryDto,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async getAllAdmins(): Promise<Admin[]> {
    return this.adminRepository.find({
      relations: ['officeLocation', 'agency', 'adminRoles', 'adminRoles.role'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: Uuid): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['officeLocation', 'agency', 'adminRoles', 'adminRoles.role'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID "${id}" not found`);
    }

    return admin;
  }

  async filter(filterDto: FilterAdminDto): Promise<Admin[]> {
    const queryBuilder = this.adminRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.officeLocation', 'officeLocation')
      .leftJoinAndSelect('admin.agency', 'agency')
      .leftJoinAndSelect('admin.adminRoles', 'adminRoles')
      .leftJoinAndSelect('adminRoles.role', 'role');

    if (filterDto.cidNo) {
      queryBuilder.andWhere('admin.cid_no ILIKE :cidNo', {
        cidNo: `%${filterDto.cidNo}%`,
      });
    }

    if (filterDto.officeLocationId) {
      queryBuilder.andWhere('admin.office_location_id = :officeLocationId', {
        officeLocationId: filterDto.officeLocationId,
      });
    }

    if (filterDto.agencyId) {
      queryBuilder.andWhere('admin.agency_id = :agencyId', {
        agencyId: filterDto.agencyId,
      });
    }

    if (filterDto.email) {
      queryBuilder.andWhere('admin.email ILIKE :email', {
        email: `%${filterDto.email}%`,
      });
    }

    if (filterDto.mobileNo) {
      queryBuilder.andWhere('admin.mobile_no ILIKE :mobileNo', {
        mobileNo: `%${filterDto.mobileNo}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async update(id: Uuid, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    // If updating CID, check for conflicts
    if (updateAdminDto.cidNo && updateAdminDto.cidNo !== admin.cidNo) {
      const existing = await this.adminRepository.findOne({
        where: { cidNo: updateAdminDto.cidNo },
      });

      if (existing) {
        throw new ConflictException(
          `Admin with CID "${updateAdminDto.cidNo}" already exists`,
        );
      }
    }

    // Hash password if it's being updated
    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(
        updateAdminDto.password,
        BCRYPT_ROUNDS,
      );
    }

    Object.assign(admin, updateAdminDto);

    return this.adminRepository.save(admin);
  }

  async remove(id: Uuid): Promise<{ statusCode: number; message: string }> {
    const admin = await this.findOne(id);
    await this.adminRepository.remove(admin);
    return { statusCode: 200, message: 'Admin deleted successfully' };
  }

  async assignRole(
    adminId: Uuid,
    assignRoleDto: AssignRoleDto,
  ): Promise<AdminRole> {
    // Check if admin exists
    await this.findOne(adminId);

    // Check if role is already assigned
    const existing = await this.adminRoleRepository.findOne({
      where: {
        adminId,
        roleId: assignRoleDto.roleId,
      },
    });

    if (existing) {
      throw new ConflictException('Role already assigned to this admin');
    }

    const adminRole = this.adminRoleRepository.create({
      adminId,
      roleId: assignRoleDto.roleId,
    });

    return this.adminRoleRepository.save(adminRole);
  }

  async removeRole(
    adminId: Uuid,
    roleId: Uuid,
  ): Promise<{ statusCode: number; message: string }> {
    const adminRole = await this.adminRoleRepository.findOne({
      where: { adminId, roleId },
    });

    if (!adminRole) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.adminRoleRepository.remove(adminRole);
    return { statusCode: 200, message: 'Role removed successfully' };
  }

  async findByCidNo(cidNo: string): Promise<Admin | null> {
    return this.adminRepository.findOne({
      where: { cidNo },
      relations: ['adminRoles', 'adminRoles.role'],
    });
  }

  async changePassword(
    id: Uuid,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ statusCode: number; message: string }> {
    const admin = await this.adminRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID "${id}" not found`);
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      admin.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      BCRYPT_ROUNDS,
    );

    admin.password = hashedNewPassword;
    await this.adminRepository.save(admin);

    return { statusCode: 200, message: 'Password updated successfully' };
  }

  async findByOfficeLocationId(officeLocationId: string): Promise<Admin | null> {
    try {
      console.log(`[NATS] Finding admin for office location: ${officeLocationId}`);
      
      const admin = await this.adminRepository.findOne({
        where: { officeLocationId: officeLocationId as any },
        relations: ['officeLocation', 'agency'],
      });

      if (!admin) {
        console.log(`[NATS] No admin found for office location: ${officeLocationId}`);
        return null;
      }

      console.log(`[NATS] Found admin: ${admin.fullName} (${admin.id})`);
      return admin;
    } catch (error) {
      console.error(`[NATS] Error finding admin by office location:`, error);
      throw error;
    }
  }
}
