import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintsToAdmin1738476000000
  implements MigrationInterface
{
  name = 'AddUniqueConstraintsToAdmin1738476000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique constraint for email
    await queryRunner.query(`
      ALTER TABLE "admin"
      ADD CONSTRAINT "UQ_admin_email" UNIQUE ("email")
    `);

    // Add unique constraint for mobile_no
    await queryRunner.query(`
      ALTER TABLE "admin"
      ADD CONSTRAINT "UQ_admin_mobile_no" UNIQUE ("mobile_no")
    `);

    // Add indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_email" ON "admin" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_mobile_no" ON "admin" ("mobile_no")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_mobile_no"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_email"`);

    // Drop unique constraints
    await queryRunner.query(`
      ALTER TABLE "admin" DROP CONSTRAINT IF EXISTS "UQ_admin_mobile_no"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin" DROP CONSTRAINT IF EXISTS "UQ_admin_email"
    `);
  }
}
