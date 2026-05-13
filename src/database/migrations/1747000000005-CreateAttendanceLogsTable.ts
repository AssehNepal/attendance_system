import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendanceLogsTable1747000000005 implements MigrationInterface {
  name = 'CreateAttendanceLogsTable1747000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_logs" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "staff_id"        uuid NOT NULL,
        "log_date"        date NOT NULL,
        "checkin_time"    time,
        "checkout_time"   time,
        "status"          varchar(30) NOT NULL DEFAULT 'out',
        "remarks"         text,
        "checkin_source"  varchar(30) DEFAULT 'biometric',
        "checkout_source" varchar(30),
        "override_by"     uuid,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_attendance_logs" PRIMARY KEY ("id"),
        CONSTRAINT "uq_staff_log_date" UNIQUE ("staff_id", "log_date"),
        CONSTRAINT "chk_attendance_status" CHECK ("status" IN ('present', 'out', 'on_duty', 'on_leave', 'absent', 'holiday'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_log_date" ON "attendance_logs" ("log_date")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_status" ON "attendance_logs" ("status")`,
    );

    await queryRunner.query(
      `ALTER TABLE "attendance_logs" ADD CONSTRAINT "fk_attendance_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "attendance_logs" ADD CONSTRAINT "fk_attendance_override" FOREIGN KEY ("override_by") REFERENCES "admins"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendance_logs" DROP CONSTRAINT IF EXISTS "fk_attendance_override"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_logs" DROP CONSTRAINT IF EXISTS "fk_attendance_staff"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_log_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_logs"`);
  }
}
