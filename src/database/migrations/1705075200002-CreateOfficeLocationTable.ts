import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOfficeLocationTable1705075200002
  implements MigrationInterface
{
  name = 'CreateOfficeLocationTable1705075200002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "office_location" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        CONSTRAINT "PK_office_location" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "office_location"`);
  }
}
