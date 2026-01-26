export class OfficeLocationCreatedEvent {
  id!: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<OfficeLocationCreatedEvent>) {
    Object.assign(this, partial);
  }
}
