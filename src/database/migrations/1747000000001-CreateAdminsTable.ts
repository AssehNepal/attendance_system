import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminsTable1747000000001 implements MigrationInterface {
  name = 'CreateAdminsTable1747000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "office_id"     uuid,
        "name"          varchar(200) NOT NULL,
        "email"         varchar(200) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role"          varchar(20) NOT NULL DEFAULT 'admin',
        "is_active"     boolean NOT NULL DEFAULT true,
        "last_login_at" timestamptz,
        "created_by"    uuid,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_admins" PRIMARY KEY ("id"),
        CONSTRAINT "uq_admin_email" UNIQUE ("email"),
        CONSTRAINT "chk_admin_role" CHECK ("role" IN ('super_admin', 'admin'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admin_office_role" ON "admins" ("office_id", "role")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_office_role"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);
  }
}
