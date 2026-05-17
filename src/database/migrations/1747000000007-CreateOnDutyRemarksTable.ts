import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnDutyRemarksTable1747000000007 implements MigrationInterface {
  name = 'CreateOnDutyRemarksTable1747000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "on_duty_remarks" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "staff_id"         uuid NOT NULL,
        "log_date"         date NOT NULL,
        "out_scan_id"      uuid NOT NULL,
        "in_scan_id"       uuid,
        "out_time"         time NOT NULL,
        "in_time"          time,
        "remarks"          text,
        "token"            varchar(200) NOT NULL,
        "token_expires_at" timestamptz NOT NULL,
        "submitted_at"     timestamptz,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_on_duty_remarks" PRIMARY KEY ("id"),
        CONSTRAINT "uq_duty_token" UNIQUE ("token")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_duty_remarks_staff_date" ON "on_duty_remarks" ("staff_id", "log_date")`,
    );

    await queryRunner.query(
      `ALTER TABLE "on_duty_remarks" ADD CONSTRAINT "fk_duty_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "on_duty_remarks" ADD CONSTRAINT "fk_duty_out_scan" FOREIGN KEY ("out_scan_id") REFERENCES "scan_logs"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "on_duty_remarks" ADD CONSTRAINT "fk_duty_in_scan" FOREIGN KEY ("in_scan_id") REFERENCES "scan_logs"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "on_duty_remarks" DROP CONSTRAINT IF EXISTS "fk_duty_in_scan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "on_duty_remarks" DROP CONSTRAINT IF EXISTS "fk_duty_out_scan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "on_duty_remarks" DROP CONSTRAINT IF EXISTS "fk_duty_staff"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_duty_remarks_staff_date"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "on_duty_remarks"`);
  }
}
