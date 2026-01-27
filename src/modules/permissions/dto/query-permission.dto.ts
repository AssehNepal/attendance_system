import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryPermissionDto extends PageOptionsDto {
  // Inherits: page, take, order, q from PageOptionsDto
  // Use 'q' parameter for searching permission names
}
