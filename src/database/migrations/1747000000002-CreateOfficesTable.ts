import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOfficesTable1747000000002 implements MigrationInterface {
  name = 'CreateOfficesTable1747000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offices" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"                  varchar(200) NOT NULL,
        "dzongkhag_code"        varchar(20) NOT NULL,
        "email_domain"          varchar(100),
        "office_start_time"     time NOT NULL DEFAULT '09:00',
        "office_end_time"       time NOT NULL DEFAULT '17:00',
        "absence_cutoff_time"   time NOT NULL DEFAULT '10:00',
        "is_active"             boolean NOT NULL DEFAULT true,
        "created_by"            uuid,
        "created_at"            timestamptz NOT NULL DEFAULT now(),
        "updated_at"            timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_offices" PRIMARY KEY ("id"),
        CONSTRAINT "uq_office_name" UNIQUE ("name"),
        CONSTRAINT "uq_office_code" UNIQUE ("dzongkhag_code")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "offices" ADD CONSTRAINT "fk_offices_created_by" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE "admins" ADD CONSTRAINT "fk_admins_office" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE SET NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "admins" ADD CONSTRAINT "fk_admins_created_by" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admins" DROP CONSTRAINT IF EXISTS "fk_admins_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" DROP CONSTRAINT IF EXISTS "fk_admins_office"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offices" DROP CONSTRAINT IF EXISTS "fk_offices_created_by"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "offices"`);
  }
}
