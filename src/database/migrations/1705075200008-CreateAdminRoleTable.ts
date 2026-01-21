import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminRoleTable1705075200008 implements MigrationInterface {
  name = 'CreateAdminRoleTable1705075200008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_role" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "admin_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_admin_role" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_role" UNIQUE ("admin_id", "role_id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_role_admin'
        ) THEN
          ALTER TABLE "admin_role"
          ADD CONSTRAINT "FK_admin_role_admin"
          FOREIGN KEY ("admin_id")
          REFERENCES "admin"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_role_role'
        ) THEN
          ALTER TABLE "admin_role"
          ADD CONSTRAINT "FK_admin_role_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admin_role" DROP CONSTRAINT IF EXISTS "FK_admin_role_role"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin_role" DROP CONSTRAINT IF EXISTS "FK_admin_role_admin"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_role"`);
  }
}
