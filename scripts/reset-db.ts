/**
 * Dev-only script: drops ALL tables in the public schema and re-runs all migrations.
 * Usage: npx tsx scripts/reset-db.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
import { execSync } from 'child_process';

const client = new Client({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

async function main() {
  await client.connect();
  console.log('🗑️  Dropping all tables in public schema...');

  // Drop all tables (cascade handles FK dependencies)
  await client.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  console.log('✅ All tables dropped.');
  await client.end();

  console.log('🚀 Running all migrations...');
  execSync(
    'npx tsx node_modules/typeorm/cli.js migration:run -d ormconfig.ts',
    {
      stdio: 'inherit',
    },
  );

  console.log('✅ All migrations completed successfully.');
}

main().catch((err) => {
  console.error('❌ Reset failed:', err.message);
  process.exit(1);
});
