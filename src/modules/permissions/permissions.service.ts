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
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { FilterPermissionDto } from './dto/filter-permission.dto';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 1. Validate name length (400 Bad Request)
    if (
      createPermissionDto.name.length < 3 ||
      createPermissionDto.name.length > 100
    ) {
      throw new BadRequestException(
        'Name must be between 3 and 100 characters',
      );
    }

    // 2. Validate description length if provided (400 Bad Request)
    if (
      createPermissionDto.description &&
      createPermissionDto.description.length > 1000
    ) {
      throw new BadRequestException(
        'Description cannot exceed 1000 characters',
      );
    }

    // 3. Validate actions array is not empty (400 Bad Request)
    if (
      !createPermissionDto.actions ||
      createPermissionDto.actions.length === 0
    ) {
      throw new BadRequestException('Actions must not be empty');
    }

    // 4. Validate subjects array is not empty (400 Bad Request)
    if (
      !createPermissionDto.subjects ||
      createPermissionDto.subjects.length === 0
    ) {
      throw new BadRequestException('Subjects must not be empty');
    }

    // 5. Check if permission with name already exists (409 Conflict)
    const existing = await this.permissionRepository.findOne({
      where: { name: createPermissionDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Permission with name "${createPermissionDto.name}" already exists`,
      );
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async findAll(queryDto: QueryPermissionDto): Promise<PageDto<Permission>> {
    const queryBuilder =
      this.permissionRepository.createQueryBuilder('permission');

    if (queryDto.name) {
      queryBuilder.andWhere('permission.name ILIKE :name', {
        name: `%${queryDto.name}%`,
      });
    }

    queryBuilder
      .orderBy('permission.created_at', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take);

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: queryDto,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: Uuid): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.role'],
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }

    return permission;
  }

  async filter(filterDto: FilterPermissionDto): Promise<Permission[]> {
    const queryBuilder =
      this.permissionRepository.createQueryBuilder('permission');

    if (filterDto.name) {
      queryBuilder.andWhere('permission.name ILIKE :name', {
        name: `%${filterDto.name}%`,
      });
    }

    if (filterDto.description) {
      queryBuilder.andWhere('permission.description ILIKE :description', {
        description: `%${filterDto.description}%`,
      });
    }

    if (filterDto.action) {
      queryBuilder.andWhere('permission.actions @> :actions', {
        actions: JSON.stringify([filterDto.action]),
      });
    }

    if (filterDto.subject) {
      queryBuilder.andWhere('permission.subjects @> :subjects', {
        subjects: JSON.stringify([filterDto.subject]),
      });
    }

    return queryBuilder.getMany();
  }

  async update(
    id: Uuid,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    // If updating name, check for conflicts
    if (
      updatePermissionDto.name &&
      updatePermissionDto.name !== permission.name
    ) {
      const existing = await this.permissionRepository.findOne({
        where: { name: updatePermissionDto.name },
      });

      if (existing) {
        throw new ConflictException(
          `Permission with name "${updatePermissionDto.name}" already exists`,
        );
      }
    }

    Object.assign(permission, updatePermissionDto);

    return this.permissionRepository.save(permission);
  }

  async remove(id: Uuid): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { name },
      relations: ['rolePermissions', 'rolePermissions.role'],
    });
  }
}
