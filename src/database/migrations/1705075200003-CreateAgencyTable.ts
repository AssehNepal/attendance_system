import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgencyTable1705075200003 implements MigrationInterface {
  name = 'CreateAgencyTable1705075200003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agency" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        "code" character varying(50) NOT NULL,
        CONSTRAINT "UQ_agency_code" UNIQUE ("code"),
        CONSTRAINT "PK_agency" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "agency"`);
  }
}
