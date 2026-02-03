import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateAdminRoleDto } from './dto/create-admin-role.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { QueryAdminRoleDto } from './dto/query-admin-role.dto';
import { AdminRole } from './entities/admin-role.entity';

@Injectable()
export class AdminRoleService {
  constructor(
    @InjectRepository(AdminRole)
    private readonly adminRoleRepository: Repository<AdminRole>,
  ) {}

  async create(createAdminRoleDto: CreateAdminRoleDto): Promise<AdminRole> {
    // Check if assignment already exists
    const existing = await this.adminRoleRepository.findOne({
      where: {
        adminId: createAdminRoleDto.adminId as any,
        roleId: createAdminRoleDto.roleId as any,
      },
    });

    if (existing) {
      throw new ConflictException('This role is already assigned to the admin');
    }

    const adminRole = this.adminRoleRepository.create(createAdminRoleDto);
    return this.adminRoleRepository.save(adminRole);
  }

  async findOne(id: Uuid): Promise<AdminRole> {
    const adminRole = await this.adminRoleRepository.findOne({
      where: { id },
      relations: ['admin', 'role'],
    });

    if (!adminRole) {
      throw new NotFoundException(
        `Admin-Role assignment with ID "${id}" not found`,
      );
    }

    return adminRole;
  }

  async update(
    id: Uuid,
    updateAdminRoleDto: UpdateAdminRoleDto,
  ): Promise<AdminRole> {
    const adminRole = await this.findOne(id);

    // If updating adminId or roleId, check for conflicts
    if (updateAdminRoleDto.adminId || updateAdminRoleDto.roleId) {
      const targetAdminId = updateAdminRoleDto.adminId || adminRole.adminId;
      const targetRoleId = updateAdminRoleDto.roleId || adminRole.roleId;

      const existing = await this.adminRoleRepository.findOne({
        where: {
          adminId: targetAdminId as any,
          roleId: targetRoleId as any,
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          'This role is already assigned to the admin',
        );
      }
    }

    Object.assign(adminRole, updateAdminRoleDto);
    return this.adminRoleRepository.save(adminRole);
  }

  async remove(id: Uuid): Promise<{ statusCode: number; message: string }> {
    const adminRole = await this.findOne(id);
    await this.adminRoleRepository.remove(adminRole);
    return {
      statusCode: 200,
      message: 'Admin-Role assignment removed successfully',
    };
  }

  async removeByAdminAndRole(
    adminId: Uuid,
    roleId: Uuid,
  ): Promise<{ statusCode: number; message: string }> {
    const adminRole = await this.adminRoleRepository.findOne({
      where: { adminId, roleId },
    });

    if (!adminRole) {
      throw new NotFoundException('Admin-Role assignment not found');
    }

    await this.adminRoleRepository.remove(adminRole);
    return {
      statusCode: 200,
      message: 'Role removed from admin successfully',
    };
  }

  async findByAdminId(adminId: Uuid): Promise<AdminRole[]> {
    return this.adminRoleRepository.find({
      where: { adminId },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });
  }

  async findByRoleId(roleId: Uuid): Promise<AdminRole[]> {
    return this.adminRoleRepository.find({
      where: { roleId },
      relations: ['admin'],
    });
  }

  async findAll(queryDto: QueryAdminRoleDto): Promise<PageDto<AdminRole>> {
    const queryBuilder = this.adminRoleRepository
      .createQueryBuilder('adminRole')
      .leftJoinAndSelect('adminRole.admin', 'admin')
      .leftJoinAndSelect('adminRole.role', 'role');

    // Filter by admin ID
    if (queryDto.adminId) {
      queryBuilder.andWhere('adminRole.admin_id = :adminId', {
        adminId: queryDto.adminId,
      });
    }

    // Filter by role ID
    if (queryDto.roleId) {
      queryBuilder.andWhere('adminRole.role_id = :roleId', {
        roleId: queryDto.roleId,
      });
    }

    // Apply smart defaults for pagination
    const page = queryDto.page ?? 1;
    const take = queryDto.take ?? 10;

    // Apply pagination
    queryBuilder.skip((page - 1) * take).take(take);

    // Apply ordering
    if (queryDto.order) {
      queryBuilder.orderBy(
        'adminRole.createdAt',
        queryDto.order as 'ASC' | 'DESC',
      );
    }

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    // Create a modified query DTO with the actual values used
    const actualQueryDto = {
      ...queryDto,
      page,
      take,
    };

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: actualQueryDto as any,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findAllWithoutPagination(): Promise<AdminRole[]> {
    return this.adminRoleRepository.find({
      relations: ['admin', 'role'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
