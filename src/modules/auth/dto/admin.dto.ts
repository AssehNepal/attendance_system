import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { Admin } from '../entities/admin.entity.ts';

export class AdminDto extends AbstractDto {
  @StringFieldOptional()
  cidNo!: string;

  @StringFieldOptional()
  roleType!: string;

  @StringFieldOptional()
  officeLocationId!: string;

  @StringFieldOptional()
  agencyId!: string | null;

  @StringFieldOptional()
  mobileNo!: string;

  @StringFieldOptional()
  email!: string;

  @StringFieldOptional()
  officeLocationName?: string;

  constructor(admin: Admin) {
    super(admin);
    this.cidNo = admin.cidNo;
    this.roleType = admin.roleType;
    this.officeLocationId = admin.officeLocationId;
    this.agencyId = admin.agencyId;
    this.mobileNo = admin.mobileNo;
    this.email = admin.email;
    this.officeLocationName = admin.officeLocation?.name;
  }
}
