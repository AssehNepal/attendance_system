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

    // Search by permission name using general query parameter
    if (queryDto.q) {
      queryBuilder.andWhere('permission.name ILIKE :name', {
        name: `${queryDto.q}%`,
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
        'permission.createdAt',
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

  async remove(id: Uuid): Promise<{ statusCode: number; message: string }> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
    return { statusCode: 200, message: 'Permission deleted successfully' };
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { name },
      relations: ['rolePermissions', 'rolePermissions.role'],
    });
  }
}
