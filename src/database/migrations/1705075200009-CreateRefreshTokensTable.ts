import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1705075200009
  implements MigrationInterface
{
  name = 'CreateRefreshTokensTable1705075200009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "token" text NOT NULL,
        "user_id" uuid,
        "admin_id" uuid,
        "expires_at" TIMESTAMP NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "ip_address" character varying(50),
        "user_agent" text,
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_admin_id" ON "refresh_tokens" ("admin_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")
    `);

    // Add foreign keys
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_refresh_tokens_user'
        ) THEN
          ALTER TABLE "refresh_tokens"
          ADD CONSTRAINT "FK_refresh_tokens_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_refresh_tokens_admin'
        ) THEN
          ALTER TABLE "refresh_tokens"
          ADD CONSTRAINT "FK_refresh_tokens_admin"
          FOREIGN KEY ("admin_id")
          REFERENCES "admin"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_admin"
    `);
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_user"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_refresh_tokens_expires_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_refresh_tokens_admin_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_refresh_tokens_user_id"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
