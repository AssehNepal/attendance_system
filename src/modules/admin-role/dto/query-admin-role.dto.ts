import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryAdminRoleDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter by Admin ID',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  adminId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Role ID',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  roleId?: string;
}
