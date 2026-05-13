import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminOverridesTable1747000000012 implements MigrationInterface {
  name = 'CreateAdminOverridesTable1747000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_overrides" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "admin_id"     uuid NOT NULL,
        "target_table" varchar(50) NOT NULL,
        "target_id"    uuid NOT NULL,
        "action_type"  varchar(50) NOT NULL,
        "old_value"    text,
        "new_value"    text,
        "reason"       text NOT NULL,
        "override_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_admin_overrides" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_override_target" ON "admin_overrides" ("target_table", "target_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_override_admin" ON "admin_overrides" ("admin_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "admin_overrides" ADD CONSTRAINT "fk_overrides_admin" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_overrides" DROP CONSTRAINT IF EXISTS "fk_overrides_admin"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_override_admin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_override_target"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_overrides"`);
  }
}
