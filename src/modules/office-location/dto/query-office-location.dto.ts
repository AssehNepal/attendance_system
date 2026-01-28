import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryOfficeLocationDto extends PageOptionsDto {
  // Inherits all properties from PageOptionsDto including:
  // - page?: number
  // - take?: number
  // - order?: Order
  // - q?: string (for search)
}
