import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';
import type { OfficeLocation } from '../entities/office-location.entity.ts';

export class OfficeLocationDto extends AbstractDto {
  @StringField()
  name!: string;

  constructor(officeLocation: OfficeLocation) {
    super(officeLocation);
    this.name = officeLocation.name;
  }
}
