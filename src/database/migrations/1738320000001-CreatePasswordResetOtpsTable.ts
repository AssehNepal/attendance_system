import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetOtpsTable1738320000001 implements MigrationInterface {
  name = 'CreatePasswordResetOtpsTable1738320000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_otps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "admin_id" uuid NOT NULL,
        "otp" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "email" character varying(255),
        "mobile_no" character varying(20),
        CONSTRAINT "PK_password_reset_otps" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_password_reset_otps_admin'
        ) THEN
          ALTER TABLE "password_reset_otps"
          ADD CONSTRAINT "FK_password_reset_otps_admin"
          FOREIGN KEY ("admin_id")
          REFERENCES "admin"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "password_reset_otps" DROP CONSTRAINT IF EXISTS "FK_password_reset_otps_admin"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_otps"`);
  }
}
