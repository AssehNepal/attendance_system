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
    if (createUserDto.cidNo.length < 11 || createUserDto.cidNo.length > 20) {
      throw new BadRequestException('CID must be between 11 and 20 characters');
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

    if (queryDto.cidNo) {
      queryBuilder.andWhere('user.cid_no ILIKE :cidNo', {
        cidNo: `%${queryDto.cidNo}%`,
      });
    }

    if (queryDto.roleType) {
      queryBuilder.andWhere('user.role_type = :roleType', {
        roleType: queryDto.roleType,
      });
    }

    queryBuilder.skip(queryDto.skip).take(queryDto.take);

    if (queryDto.order) {
      queryBuilder.orderBy('user.createdAt', queryDto.order as 'ASC' | 'DESC');
    }

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: queryDto,
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

    if (filterDto.cidNo) {
      queryBuilder.andWhere('user.cid_no ILIKE :cidNo', {
        cidNo: `%${filterDto.cidNo}%`,
      });
    }

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

    return queryBuilder.getMany();
  }

  async update(id: Uuid, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async remove(id: Uuid): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async findByCidNo(cidNo: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { cidNo } });
  }
}
