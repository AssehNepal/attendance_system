import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartmentsTable1747000000003 implements MigrationInterface {
  name = 'CreateDepartmentsTable1747000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "office_id"     uuid NOT NULL,
        "name"          varchar(150) NOT NULL,
        "code"          varchar(20) NOT NULL,
        "head_staff_id" uuid,
        "is_active"     boolean NOT NULL DEFAULT true,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_departments" PRIMARY KEY ("id"),
        CONSTRAINT "uq_dept_code_per_office" UNIQUE ("office_id", "code")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_office" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "fk_departments_office"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
  }
}
