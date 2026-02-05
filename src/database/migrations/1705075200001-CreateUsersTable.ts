import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1705075200001 implements MigrationInterface {
  name = 'CreateUsersTable1705075200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "role_type" character varying(20) NOT NULL DEFAULT 'CITIZEN',
        "cid_no" character varying(20) UNIQUE NOT NULL,
        "full_name" character varying(100) NOT NULL,
        "password" character varying,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_cid_no" ON "users" ("cid_no")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_cid_no"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
