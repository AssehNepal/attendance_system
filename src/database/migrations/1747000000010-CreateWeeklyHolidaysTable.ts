import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeeklyHolidaysTable1747000000010 implements MigrationInterface {
  name = 'CreateWeeklyHolidaysTable1747000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "weekly_holidays" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "office_id"   uuid NOT NULL,
        "day_of_week" smallint NOT NULL,
        "is_active"   boolean NOT NULL DEFAULT true,
        "created_by"  uuid NOT NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_weekly_holidays" PRIMARY KEY ("id"),
        CONSTRAINT "uq_weekly_holiday_per_office" UNIQUE ("office_id", "day_of_week"),
        CONSTRAINT "chk_day_of_week" CHECK ("day_of_week" >= 1 AND "day_of_week" <= 7)
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "weekly_holidays" ADD CONSTRAINT "fk_weekly_office" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "weekly_holidays" ADD CONSTRAINT "fk_weekly_created_by" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weekly_holidays" DROP CONSTRAINT IF EXISTS "fk_weekly_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weekly_holidays" DROP CONSTRAINT IF EXISTS "fk_weekly_office"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "weekly_holidays"`);
  }
}
