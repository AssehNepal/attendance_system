import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPermissionsColumnsToVarchar1739243572000
  implements MigrationInterface
{
  name = 'AlterPermissionsColumnsToVarchar1739243572000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the columns exist and are jsonb type, then alter them to varchar
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Check if actions column is jsonb and alter to varchar
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'permissions' 
          AND column_name = 'actions' 
          AND data_type = 'jsonb'
        ) THEN
          ALTER TABLE "permissions" ALTER COLUMN "actions" TYPE character varying USING "actions"::text;
        END IF;

        -- Check if subjects column is jsonb and alter to varchar
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'permissions' 
          AND column_name = 'subjects' 
          AND data_type = 'jsonb'
        ) THEN
          ALTER TABLE "permissions" ALTER COLUMN "subjects" TYPE character varying USING "subjects"::text;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to jsonb
    await queryRunner.query(`
      ALTER TABLE "permissions" ALTER COLUMN "actions" TYPE jsonb USING "actions"::jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "permissions" ALTER COLUMN "subjects" TYPE jsonb USING "subjects"::jsonb
    `);
  }
}
