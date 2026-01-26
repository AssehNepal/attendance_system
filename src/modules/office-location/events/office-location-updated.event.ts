export class OfficeLocationUpdatedEvent {
  id!: string;
  name?: string;
  updatedAt!: Date;

  constructor(partial: Partial<OfficeLocationUpdatedEvent>) {
    Object.assign(this, partial);
  }
}
