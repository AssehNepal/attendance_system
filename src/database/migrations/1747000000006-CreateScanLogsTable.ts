import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScanLogsTable1747000000006 implements MigrationInterface {
  name = 'CreateScanLogsTable1747000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scan_logs" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "staff_id"   uuid NOT NULL,
        "log_date"   date NOT NULL,
        "scanned_at" timestamptz NOT NULL,
        "scan_type"  varchar(20) NOT NULL,
        "source"     varchar(30) NOT NULL DEFAULT 'biometric',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_scan_logs" PRIMARY KEY ("id"),
        CONSTRAINT "chk_scan_type" CHECK ("scan_type" IN ('checkin', 'on_duty'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_scan_staff_date" ON "scan_logs" ("staff_id", "log_date")`,
    );

    await queryRunner.query(
      `ALTER TABLE "scan_logs" ADD CONSTRAINT "fk_scan_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "scan_logs" DROP CONSTRAINT IF EXISTS "fk_scan_staff"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_scan_staff_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scan_logs"`);
  }
}
