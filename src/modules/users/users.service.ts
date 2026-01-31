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
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 1. Validate CID length (400 Bad Request)
    if (createUserDto.cidNo.length < 1 || createUserDto.cidNo.length > 20) {
      throw new BadRequestException('CID must be at least 1 character');
    }

    // 2. Validate password length if provided (400 Bad Request)
    if (createUserDto.password && createUserDto.password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    // 3. Check if user with CID already exists (409 Conflict)
    const existing = await this.userRepository.findOne({
      where: { cidNo: createUserDto.cidNo },
    });

    if (existing) {
      throw new ConflictException(
        `User with CID "${createUserDto.cidNo}" already exists`,
      );
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(queryDto: QueryUserDto): Promise<PageDto<User>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Search by CID (supports partial matching for autocomplete)
    if (queryDto.cidNo || queryDto.q) {
      const searchTerm = queryDto.cidNo || queryDto.q;
      queryBuilder.andWhere('user.cid_no ILIKE :cidNo', {
        cidNo: `${searchTerm}%`, // Match CIDs starting with the search term
      });
    }

    // Apply smart defaults for pagination
    const page = queryDto.page ?? 1;
    const take = queryDto.take ?? 10; // Default to 10 items per page

    // Apply pagination
    queryBuilder.skip((page - 1) * take).take(take);

    // Apply ordering
    if (queryDto.order) {
      queryBuilder.orderBy('user.createdAt', queryDto.order as 'ASC' | 'DESC');
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
      pageOptionsDto: actualQueryDto as PageOptionsDto,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: Uuid): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async filter(filterDto: FilterUserDto): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filterDto.roleType) {
      queryBuilder.andWhere('user.role_type = :roleType', {
        roleType: filterDto.roleType,
      });
    }

    if (filterDto.hasPassword !== undefined) {
      if (filterDto.hasPassword) {
        queryBuilder.andWhere('user.password IS NOT NULL');
      } else {
        queryBuilder.andWhere('user.password IS NULL');
      }
    }

    // Search functionality for continuous searching (handles CID and ID)
    if (filterDto.search) {
      queryBuilder.andWhere(
        '(user.cid_no ILIKE :search OR CAST(user.id AS TEXT) ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    return queryBuilder.getMany();
  }

  async update(id: Uuid, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async remove(id: Uuid): Promise<{ statusCode: number; message: string }> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { statusCode: 200, message: 'User deleted successfully' };
  }

  async findByCidNo(cidNo: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { cidNo } });
  }
}
