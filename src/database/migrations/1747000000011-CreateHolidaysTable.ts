import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHolidaysTable1747000000011 implements MigrationInterface {
  name = 'CreateHolidaysTable1747000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "holidays" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "office_id"    uuid NOT NULL,
        "holiday_date" date NOT NULL,
        "name"         varchar(200) NOT NULL,
        "type"         varchar(30) NOT NULL DEFAULT 'public',
        "created_by"   uuid NOT NULL,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        "updated_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_holidays" PRIMARY KEY ("id"),
        CONSTRAINT "uq_holiday_per_office" UNIQUE ("office_id", "holiday_date"),
        CONSTRAINT "chk_holiday_type" CHECK ("type" IN ('public', 'restricted'))
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "holidays" ADD CONSTRAINT "fk_holidays_office" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "holidays" ADD CONSTRAINT "fk_holidays_created_by" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "holidays" DROP CONSTRAINT IF EXISTS "fk_holidays_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "holidays" DROP CONSTRAINT IF EXISTS "fk_holidays_office"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "holidays"`);
  }
}
