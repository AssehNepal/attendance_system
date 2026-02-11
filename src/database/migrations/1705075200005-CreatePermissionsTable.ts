import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionsTable1705075200005 implements MigrationInterface {
  name = 'CreatePermissionsTable1705075200005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "actions" character varying NOT NULL,
        "subjects" character varying NOT NULL,
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
  }
}
