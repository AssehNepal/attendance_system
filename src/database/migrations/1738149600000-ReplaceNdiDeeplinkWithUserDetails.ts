import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceNdiDeeplinkWithUserDetails1738149600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // For users table
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS ndi_deeplink
    `);

    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN full_name VARCHAR(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN date_of_birth VARCHAR(20) NULL
    `);

    // For admin table
    await queryRunner.query(`
      ALTER TABLE admin 
      DROP COLUMN IF EXISTS ndi_deeplink
    `);

    await queryRunner.query(`
      ALTER TABLE admin 
      ADD COLUMN full_name VARCHAR(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE admin 
      ADD COLUMN date_of_birth VARCHAR(20) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // For users table
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS full_name
    `);

    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS date_of_birth
    `);

    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN ndi_deeplink TEXT NULL
    `);

    // For admin table
    await queryRunner.query(`
      ALTER TABLE admin 
      DROP COLUMN IF EXISTS full_name
    `);

    await queryRunner.query(`
      ALTER TABLE admin 
      DROP COLUMN IF EXISTS date_of_birth
    `);

    await queryRunner.query(`
      ALTER TABLE admin 
      ADD COLUMN ndi_deeplink VARCHAR(255) NULL
    `);
  }
}
