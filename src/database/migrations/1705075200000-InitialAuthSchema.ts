import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAuthSchema1705075200000 implements MigrationInterface {
  name = 'InitialAuthSchema1705075200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table first (base table for the system)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "role_type" character varying(20) NOT NULL DEFAULT 'CITIZEN',
        "cid_no" character varying(20) UNIQUE NOT NULL,
        "password" character varying,
        "ndi_deeplink" text,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create office_location table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "office_location" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        CONSTRAINT "PK_office_location" PRIMARY KEY ("id")
      )
    `);

    // Create agency table (must be before admin table for foreign key)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agency" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        "code" character varying(50) NOT NULL,
        CONSTRAINT "UQ_agency_code" UNIQUE ("code"),
        CONSTRAINT "PK_agency" PRIMARY KEY ("id")
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "description" text,
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "actions" jsonb NOT NULL,
        "subjects" jsonb NOT NULL,
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // Create role_permission table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permission" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permission" UNIQUE ("role_id", "permission_id")
      )
    `);

    // Create admin table
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
        "ndi_deeplink" character varying(255),
        CONSTRAINT "UQ_admin_cid_no" UNIQUE ("cid_no"),
        CONSTRAINT "PK_admin" PRIMARY KEY ("id")
      )
    `);

    // Create admin_role table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_role" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "admin_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_admin_role" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_role" UNIQUE ("admin_id", "role_id")
      )
    `);

    // Add foreign keys (with IF NOT EXISTS check)
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

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_role_permission_role'
        ) THEN
          ALTER TABLE "role_permission"
          ADD CONSTRAINT "FK_role_permission_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_role_permission_permission'
        ) THEN
          ALTER TABLE "role_permission"
          ADD CONSTRAINT "FK_role_permission_permission"
          FOREIGN KEY ("permission_id")
          REFERENCES "permissions"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_role_admin'
        ) THEN
          ALTER TABLE "admin_role"
          ADD CONSTRAINT "FK_admin_role_admin"
          FOREIGN KEY ("admin_id")
          REFERENCES "admin"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_admin_role_role'
        ) THEN
          ALTER TABLE "admin_role"
          ADD CONSTRAINT "FK_admin_role_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles"("id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create indexes for performance (with IF NOT EXISTS)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_cid_no" ON "admin" ("cid_no")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_cid_no" ON "users" ("cid_no")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_cid_no"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_cid_no"`);

    // Drop all foreign keys for auth tables
    await queryRunner.query(`
      ALTER TABLE "admin_role" DROP CONSTRAINT IF EXISTS "FK_admin_role_role"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin_role" DROP CONSTRAINT IF EXISTS "FK_admin_role_admin"
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "FK_role_permission_permission"
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "FK_role_permission_role"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin" DROP CONSTRAINT IF EXISTS "FK_admin_office_location"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin" DROP CONSTRAINT IF EXISTS "FK_admin_agency"
    `);

    // Drop all auth tables in correct order
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_role"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permission"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "office_location"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agency"`);
  }
}
