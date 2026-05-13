import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutingRequestsTable1747000000008 implements MigrationInterface {
  name = 'CreateOutingRequestsTable1747000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outing_requests" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "staff_id"              uuid NOT NULL,
        "log_date"              date NOT NULL,
        "requested_at"          timestamptz NOT NULL DEFAULT now(),
        "will_resume"           boolean NOT NULL,
        "resume_time"           time,
        "outing_before_checkin" boolean NOT NULL DEFAULT false,
        "status"                varchar(20) NOT NULL DEFAULT 'active',
        "resumed_at"            timestamptz,
        "created_at"            timestamptz NOT NULL DEFAULT now(),
        "updated_at"            timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_outing_requests" PRIMARY KEY ("id"),
        CONSTRAINT "chk_outing_status" CHECK ("status" IN ('active', 'resumed', 'cancelled'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_outing_staff_date" ON "outing_requests" ("staff_id", "log_date")`,
    );

    await queryRunner.query(
      `ALTER TABLE "outing_requests" ADD CONSTRAINT "fk_outing_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outing_requests" DROP CONSTRAINT IF EXISTS "fk_outing_staff"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_outing_staff_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outing_requests"`);
  }
}
