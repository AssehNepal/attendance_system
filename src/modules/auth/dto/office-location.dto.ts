import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';
import type { OfficeLocation } from '../entities/office-location.entity.ts';

export class OfficeLocationDto extends AbstractDto {
  @StringField()
  name!: string;

  @StringField({ nullable: true })
  code!: string | null;

  @StringField({ nullable: true })
  description!: string | null;

  constructor(officeLocation: OfficeLocation) {
    super(officeLocation);
    this.name = officeLocation.name;
    this.code = officeLocation.code;
    this.description = officeLocation.description;
  }
}
