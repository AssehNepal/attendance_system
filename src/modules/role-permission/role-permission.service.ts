import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { QueryRolePermissionDto } from './dto/query-role-permission.dto';
import { FilterRolePermissionDto } from './dto/filter-role-permission.dto';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(
    createRolePermissionDto: CreateRolePermissionDto,
  ): Promise<RolePermission> {
    // 1. Validate that role exists (404 Not Found)
    const role = await this.roleRepository.findOne({
      where: { id: createRolePermissionDto.roleId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role with ID "${createRolePermissionDto.roleId}" not found`,
      );
    }

    // 2. Validate that permission exists (404 Not Found)
    const permission = await this.permissionRepository.findOne({
      where: { id: createRolePermissionDto.permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with ID "${createRolePermissionDto.permissionId}" not found`,
      );
    }

    // 3. Check if assignment already exists (409 Conflict)
    const existing = await this.rolePermissionRepository.findOne({
      where: {
        roleId: createRolePermissionDto.roleId,
        permissionId: createRolePermissionDto.permissionId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Permission "${permission.name}" is already assigned to role "${role.name}"`,
      );
    }

    const rolePermission = this.rolePermissionRepository.create(
      createRolePermissionDto,
    );
    return this.rolePermissionRepository.save(rolePermission);
  }

  async findAll(
    queryDto: QueryRolePermissionDto,
  ): Promise<PageDto<RolePermission>> {
    const queryBuilder = this.rolePermissionRepository
      .createQueryBuilder('rolePermission')
      .leftJoinAndSelect('rolePermission.role', 'role')
      .leftJoinAndSelect('rolePermission.permission', 'permission');

    if (queryDto.roleId) {
      queryBuilder.andWhere('rolePermission.role_id = :roleId', {
        roleId: queryDto.roleId,
      });
    }

    if (queryDto.permissionId) {
      queryBuilder.andWhere('rolePermission.permission_id = :permissionId', {
        permissionId: queryDto.permissionId,
      });
    }

    queryBuilder.skip(queryDto.skip).take(queryDto.take);

    if (queryDto.order) {
      queryBuilder.orderBy(
        'rolePermission.createdAt',
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

  async findOne(id: Uuid): Promise<RolePermission> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { id },
      relations: ['role', 'permission'],
    });

    if (!rolePermission) {
      throw new NotFoundException(
        `Role-Permission assignment with ID "${id}" not found`,
      );
    }

    return rolePermission;
  }

  async filter(filterDto: FilterRolePermissionDto): Promise<RolePermission[]> {
    const queryBuilder = this.rolePermissionRepository
      .createQueryBuilder('rolePermission')
      .leftJoinAndSelect('rolePermission.role', 'role')
      .leftJoinAndSelect('rolePermission.permission', 'permission');

    if (filterDto.roleId) {
      queryBuilder.andWhere('rolePermission.role_id = :roleId', {
        roleId: filterDto.roleId,
      });
    }

    if (filterDto.permissionId) {
      queryBuilder.andWhere('rolePermission.permission_id = :permissionId', {
        permissionId: filterDto.permissionId,
      });
    }

    return queryBuilder.getMany();
  }

  async remove(id: Uuid): Promise<void> {
    const rolePermission = await this.findOne(id);
    await this.rolePermissionRepository.remove(rolePermission);
  }

  async removeByRoleAndPermission(
    roleId: Uuid,
    permissionId: Uuid,
  ): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      throw new NotFoundException('Role-Permission assignment not found');
    }

    await this.rolePermissionRepository.remove(rolePermission);
  }

  async findByRoleId(roleId: Uuid): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });
  }

  async findByPermissionId(permissionId: Uuid): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find({
      where: { permissionId },
      relations: ['role'],
    });
  }
}
