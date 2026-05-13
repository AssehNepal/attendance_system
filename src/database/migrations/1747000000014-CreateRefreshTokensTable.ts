import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1747000000014 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1747000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token"      text NOT NULL,
        "admin_id"   uuid,
        "staff_id"   uuid,
        "expires_at" timestamptz NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "ip_address" varchar(45),
        "user_agent" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_refresh_token" ON "refresh_tokens" ("token")`,
    );

    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "fk_refresh_admin" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "fk_refresh_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "fk_refresh_staff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "fk_refresh_admin"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
