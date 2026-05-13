import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemSettingsTable1747000000013 implements MigrationInterface {
  name = 'CreateSystemSettingsTable1747000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key"         varchar(100) NOT NULL,
        "value"       varchar(500) NOT NULL,
        "description" text,
        "updated_by"  uuid,
        "updated_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_system_settings" PRIMARY KEY ("id"),
        CONSTRAINT "uq_setting_key" UNIQUE ("key")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "system_settings" ADD CONSTRAINT "fk_settings_updated_by" FOREIGN KEY ("updated_by") REFERENCES "admins"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_settings" DROP CONSTRAINT IF EXISTS "fk_settings_updated_by"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings"`);
  }
}
