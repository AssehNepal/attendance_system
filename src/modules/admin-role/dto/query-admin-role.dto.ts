import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryAdminRoleDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by Admin ID' })
  @IsUUID()
  @IsOptional()
  adminId?: Uuid;

  @ApiPropertyOptional({ description: 'Filter by Role ID' })
  @IsUUID()
  @IsOptional()
  roleId?: Uuid;
}
