import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissionTable1705075200007
  implements MigrationInterface
{
  name = 'CreateRolePermissionTable1705075200007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permission" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permission" UNIQUE ("role_id", "permission_id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_role_permission_role'
        ) THEN
          ALTER TABLE "role_permission"
          ADD CONSTRAINT "FK_role_permission_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_role_permission_permission'
        ) THEN
          ALTER TABLE "role_permission"
          ADD CONSTRAINT "FK_role_permission_permission"
          FOREIGN KEY ("permission_id")
          REFERENCES "permissions"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "FK_role_permission_permission"
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "FK_role_permission_role"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permission"`);
  }
}
