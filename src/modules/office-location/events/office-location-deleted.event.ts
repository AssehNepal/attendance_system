export class OfficeLocationDeletedEvent {
  id!: string;
  deletedAt!: Date;

  constructor(partial: Partial<OfficeLocationDeletedEvent>) {
    Object.assign(this, partial);
  }
}
