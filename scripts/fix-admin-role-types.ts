/**
 * Script to fix admin roleType based on assigned roles
 * Run with: npx ts-node scripts/fix-admin-role-types.ts
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function fixAdminRoleTypes() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'census_auth',
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();

  console.log('🔄 Checking admin roleType values...');

  // Find all admins with their assigned roles
  const admins = await dataSource.query(`
    SELECT 
      a.id,
      a.cid_no,
      a.role_type,
      STRING_AGG(r.name, ', ') as roles
    FROM admin a
    LEFT JOIN admin_role ar ON a.id = ar.admin_id
    LEFT JOIN roles r ON ar.role_id = r.id
    GROUP BY a.id, a.cid_no, a.role_type
  `);

  console.log(`\n📊 Found ${admins.length} admins\n`);

  let updatedCount = 0;

  for (const admin of admins) {
    const roles = admin.roles || '';
    const shouldBeSuperAdmin =
      roles.toUpperCase().includes('SUPER') ||
      roles.toUpperCase().includes('SUPERADMIN');
    const correctRoleType = shouldBeSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN';

    console.log(
      `Admin: ${admin.cid_no} | Roles: ${roles || 'None'} | Current: ${admin.role_type} | Should be: ${correctRoleType}`,
    );

    if (admin.role_type !== correctRoleType) {
      await dataSource.query('UPDATE admin SET role_type = $1 WHERE id = $2', [
        correctRoleType,
        admin.id,
      ]);
      console.log(`  ✅ Updated ${admin.cid_no} to ${correctRoleType}`);
      updatedCount++;
    } else {
      console.log(`  ✓ Already correct`);
    }
  }

  console.log(`\n✅ Fixed ${updatedCount} admin roleType values`);

  await dataSource.destroy();
}

fixAdminRoleTypes()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
