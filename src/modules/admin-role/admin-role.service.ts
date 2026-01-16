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
import { QueryAdminRoleDto } from './dto/query-admin-role.dto';
import { FilterAdminRoleDto } from './dto/filter-admin-role.dto';
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
        adminId: createAdminRoleDto.adminId,
        roleId: createAdminRoleDto.roleId,
      },
    });

    if (existing) {
      throw new ConflictException('This role is already assigned to the admin');
    }

    const adminRole = this.adminRoleRepository.create(createAdminRoleDto);
    return this.adminRoleRepository.save(adminRole);
  }

  async findAll(queryDto: QueryAdminRoleDto): Promise<PageDto<AdminRole>> {
    const queryBuilder = this.adminRoleRepository
      .createQueryBuilder('adminRole')
      .leftJoinAndSelect('adminRole.admin', 'admin')
      .leftJoinAndSelect('adminRole.role', 'role');

    if (queryDto.adminId) {
      queryBuilder.andWhere('adminRole.admin_id = :adminId', {
        adminId: queryDto.adminId,
      });
    }

    if (queryDto.roleId) {
      queryBuilder.andWhere('adminRole.role_id = :roleId', {
        roleId: queryDto.roleId,
      });
    }

    queryBuilder.skip(queryDto.skip).take(queryDto.take);

    if (queryDto.order) {
      queryBuilder.orderBy(
        'adminRole.createdAt',
        queryDto.order as 'ASC' | 'DESC',
      );
    }

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: queryDto,
    });

    return new PageDto(entities, pageMetaDto);
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

  async filter(filterDto: FilterAdminRoleDto): Promise<AdminRole[]> {
    const queryBuilder = this.adminRoleRepository
      .createQueryBuilder('adminRole')
      .leftJoinAndSelect('adminRole.admin', 'admin')
      .leftJoinAndSelect('adminRole.role', 'role');

    if (filterDto.adminId) {
      queryBuilder.andWhere('adminRole.admin_id = :adminId', {
        adminId: filterDto.adminId,
      });
    }

    if (filterDto.roleId) {
      queryBuilder.andWhere('adminRole.role_id = :roleId', {
        roleId: filterDto.roleId,
      });
    }

    return queryBuilder.getMany();
  }

  async remove(id: Uuid): Promise<void> {
    const adminRole = await this.findOne(id);
    await this.adminRoleRepository.remove(adminRole);
  }

  async removeByAdminAndRole(adminId: Uuid, roleId: Uuid): Promise<void> {
    const adminRole = await this.adminRoleRepository.findOne({
      where: { adminId, roleId },
    });

    if (!adminRole) {
      throw new NotFoundException('Admin-Role assignment not found');
    }

    await this.adminRoleRepository.remove(adminRole);
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
}
