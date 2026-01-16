import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { FilterRoleDto } from './dto/filter-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // 1. Validate name length (400 Bad Request)
    if (createRoleDto.name.length < 3 || createRoleDto.name.length > 100) {
      throw new BadRequestException(
        'Name must be between 3 and 100 characters',
      );
    }

    // 2. Validate description length if provided (400 Bad Request)
    if (createRoleDto.description && createRoleDto.description.length > 1000) {
      throw new BadRequestException(
        'Description cannot exceed 1000 characters',
      );
    }

    // 3. Check if role with name already exists (409 Conflict)
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Role with name "${createRoleDto.name}" already exists`,
      );
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(queryDto: QueryRoleDto): Promise<PageDto<Role>> {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.permission', 'permission');

    if (queryDto.name) {
      queryBuilder.andWhere('role.name ILIKE :name', {
        name: `%${queryDto.name}%`,
      });
    }

    queryBuilder.skip(queryDto.skip).take(queryDto.take);

    if (queryDto.order) {
      queryBuilder.orderBy('role.createdAt', queryDto.order as 'ASC' | 'DESC');
    }

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: queryDto,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: Uuid): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }

  async filter(filterDto: FilterRoleDto): Promise<Role[]> {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.permission', 'permission');

    if (filterDto.name) {
      queryBuilder.andWhere('role.name ILIKE :name', {
        name: `%${filterDto.name}%`,
      });
    }

    if (filterDto.description) {
      queryBuilder.andWhere('role.description ILIKE :description', {
        description: `%${filterDto.description}%`,
      });
    }

    if (filterDto.hasPermissions !== undefined) {
      if (filterDto.hasPermissions) {
        queryBuilder.andWhere('rolePermissions.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('rolePermissions.id IS NULL');
      }
    }

    return queryBuilder.getMany();
  }

  async update(id: Uuid, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // If updating name, check for conflicts
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existing) {
        throw new ConflictException(
          `Role with name "${updateRoleDto.name}" already exists`,
        );
      }
    }

    Object.assign(role, updateRoleDto);

    return this.roleRepository.save(role);
  }

  async remove(id: Uuid): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }

  async assignPermission(
    roleId: Uuid,
    assignPermissionDto: AssignPermissionDto,
  ): Promise<RolePermission> {
    // Check if role exists
    await this.findOne(roleId);

    // Check if permission is already assigned
    const existing = await this.rolePermissionRepository.findOne({
      where: {
        roleId,
        permissionId: assignPermissionDto.permissionId,
      },
    });

    if (existing) {
      throw new ConflictException('Permission already assigned to this role');
    }

    const rolePermission = this.rolePermissionRepository.create({
      roleId,
      permissionId: assignPermissionDto.permissionId,
    });

    return this.rolePermissionRepository.save(rolePermission);
  }

  async removePermission(roleId: Uuid, permissionId: Uuid): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      throw new NotFoundException('Permission assignment not found');
    }

    await this.rolePermissionRepository.remove(rolePermission);
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }
}
