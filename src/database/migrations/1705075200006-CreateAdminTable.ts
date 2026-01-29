import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminTable1705075200006 implements MigrationInterface {
  name = 'CreateAdminTable1705075200006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "cid_no" character varying(20) NOT NULL,
        "role_type" character varying(20) NOT NULL DEFAULT 'ADMIN',
        "password" character varying(255) NOT NULL,
        "office_location_id" uuid,
        "agency_id" uuid,
        "mobile_no" character varying(20),
        "email" character varying(255),
        CONSTRAINT "UQ_admin_cid_no" UNIQUE ("cid_no"),
        CONSTRAINT "PK_admin" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_cid_no" ON "admin" ("cid_no")
    `);

    // Add foreign keys
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_office_location'
        ) THEN
          ALTER TABLE "admin"
          ADD CONSTRAINT "FK_admin_office_location"
          FOREIGN KEY ("office_location_id")
          REFERENCES "office_location"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_agency'
        ) THEN
          ALTER TABLE "admin"
          ADD CONSTRAINT "FK_admin_agency"
          FOREIGN KEY ("agency_id")
          REFERENCES "agency"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admin" DROP CONSTRAINT IF EXISTS "FK_admin_agency"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin" DROP CONSTRAINT IF EXISTS "FK_admin_office_location"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_cid_no"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin"`);
  }
}
