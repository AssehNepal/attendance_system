import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaveRequestsTable1747000000009 implements MigrationInterface {
  name = 'CreateLeaveRequestsTable1747000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "staff_id"     uuid NOT NULL,
        "leave_from"   date NOT NULL,
        "leave_to"     date NOT NULL,
        "leave_type"   varchar(50) NOT NULL,
        "reason"       text,
        "status"       varchar(20) NOT NULL DEFAULT 'approved',
        "cancelled_at" timestamptz,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        "updated_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_leave_requests" PRIMARY KEY ("id"),
        CONSTRAINT "chk_leave_type" CHECK ("leave_type" IN ('casual', 'earned', 'medical', 'maternity', 'special')),
        CONSTRAINT "chk_leave_status" CHECK ("status" IN ('approved', 'cancelled'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_leave_staff_dates" ON "leave_requests" ("staff_id", "leave_from", "leave_to")`,
    );

    await queryRunner.query(
      `ALTER TABLE "leave_requests" ADD CONSTRAINT "fk_leave_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_requests" DROP CONSTRAINT IF EXISTS "fk_leave_staff"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_leave_staff_dates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);
  }
}
