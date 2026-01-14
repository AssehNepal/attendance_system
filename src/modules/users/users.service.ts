import { Injectable, NotFoundException } from '@nestjs/common';
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

    queryBuilder
      .orderBy('user.created_at', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take);

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
