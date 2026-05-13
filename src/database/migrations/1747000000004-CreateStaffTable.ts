import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStaffTable1747000000004 implements MigrationInterface {
  name = 'CreateStaffTable1747000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "office_id"        uuid NOT NULL,
        "department_id"    uuid NOT NULL,
        "employee_id"      varchar(50) NOT NULL,
        "name"             varchar(200) NOT NULL,
        "contact_no"       varchar(20) NOT NULL,
        "email"            varchar(200),
        "password_hash"    varchar(255),
        "last_login_at"    timestamptz,
        "designation"      varchar(150),
        "employment_type"  varchar(30) NOT NULL DEFAULT 'regular',
        "milvus_vector_id" varchar(100),
        "is_active"        boolean NOT NULL DEFAULT true,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_staff" PRIMARY KEY ("id"),
        CONSTRAINT "uq_staff_employee_id" UNIQUE ("employee_id"),
        CONSTRAINT "uq_staff_email" UNIQUE ("email"),
        CONSTRAINT "uq_staff_milvus" UNIQUE ("milvus_vector_id"),
        CONSTRAINT "chk_employment_type" CHECK ("employment_type" IN ('regular', 'contract', 'deputation'))
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "fk_staff_office" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "fk_staff_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_head" FOREIGN KEY ("head_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "fk_departments_head"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT IF EXISTS "fk_staff_department"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT IF EXISTS "fk_staff_office"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "staff"`);
  }
}
