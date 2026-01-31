#!/usr/bin/env ts-node

/**
 * Standalone Script to Create SUPER_ADMIN
 *
 * This script creates the first SUPER_ADMIN user directly in the database.
 * It can be run independently without starting the NestJS application.
 *
 * Usage: npm run create-superadmin
 */

import * as readline from 'readline';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BCRYPT_ROUNDS = 12;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Validation functions
const validateCID = (cid: string): boolean => {
  return /^\d{4,}$/.test(cid);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 1;
};

const validateUUID = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid,
  );
};

const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateMobile = (mobile: string): boolean => {
  if (!mobile) return true; // Mobile is optional
  return /^\+975\d{8}$/.test(mobile);
};

// Main function
async function createSuperAdmin() {
  console.log(
    `${colors.cyan}╔════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.cyan}║                                                    ║${colors.reset}`,
  );
  console.log(
    `${colors.cyan}║         SUPER ADMIN CREATION SCRIPT               ║${colors.reset}`,
  );
  console.log(
    `${colors.cyan}║                                                    ║${colors.reset}`,
  );
  console.log(
    `${colors.cyan}╚════════════════════════════════════════════════════╝${colors.reset}`,
  );
  console.log();

  let dataSource: DataSource | null = null;

  try {
    // Initialize database connection
    console.log(`${colors.blue}📡 Connecting to database...${colors.reset}`);

    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'auth_db',
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
    console.log(`${colors.green}✅ Database connected!${colors.reset}\n`);

    // Check if SUPER_ADMIN already exists
    const existingAdmin = await dataSource.query(
      `SELECT id, cid_no FROM admin WHERE role_type = 'SUPER_ADMIN' LIMIT 1`,
    );

    if (existingAdmin.length > 0) {
      console.log(
        `${colors.yellow}⚠️  SUPER_ADMIN already exists!${colors.reset}`,
      );
      console.log(
        `${colors.yellow}   CID: ${existingAdmin[0].cid_no}${colors.reset}`,
      );
      console.log(
        `${colors.yellow}   ID: ${existingAdmin[0].id}${colors.reset}\n`,
      );

      const overwrite = await question(
        `${colors.red}Do you want to create another SUPER_ADMIN? (yes/no): ${colors.reset}`,
      );

      if (overwrite.toLowerCase() !== 'yes') {
        console.log(`${colors.cyan}Operation cancelled.${colors.reset}`);
        rl.close();
        await dataSource.destroy();
        process.exit(0);
      }
      console.log();
    }

    // Collect user input
    console.log(`${colors.cyan}📝 Enter SUPER_ADMIN details:${colors.reset}\n`);

    // Get CID
    let cidNo = '';
    while (!validateCID(cidNo)) {
      cidNo = await question(
        `${colors.blue}Enter CID (exactly 11 digits): ${colors.reset}`,
      );
      if (!validateCID(cidNo)) {
        console.log(`${colors.red}❌ Invalid CID format!${colors.reset}\n`);
      }
    }

    // Check if CID already exists
    const existingCID = await dataSource.query(
      `SELECT id FROM admin WHERE cid_no = $1`,
      [cidNo],
    );

    if (existingCID.length > 0) {
      console.log(
        `${colors.red}❌ Admin with CID "${cidNo}" already exists!${colors.reset}`,
      );
      rl.close();
      await dataSource.destroy();
      process.exit(1);
    }

    // Get Password
    let password = '';
    while (!validatePassword(password)) {
      password = await question(
        `${colors.blue}Enter Password (min 1 characters): ${colors.reset}`,
      );
      if (!validatePassword(password)) {
        console.log(
          `${colors.red}❌ Password must be at least 1 characters!${colors.reset}\n`,
        );
      }
    }

    // Get Office Location ID
    let officeLocationId = '';
    while (!validateUUID(officeLocationId)) {
      officeLocationId = await question(
        `${colors.blue}Enter Office Location ID (UUID): ${colors.reset}`,
      );
      if (!validateUUID(officeLocationId)) {
        console.log(`${colors.red}❌ Invalid UUID format!${colors.reset}\n`);
      }
    }

    // Verify office location exists
    const officeExists = await dataSource.query(
      `SELECT id FROM office_location WHERE id = $1`,
      [officeLocationId],
    );

    if (officeExists.length === 0) {
      console.log(
        `${colors.red}❌ Office Location with ID "${officeLocationId}" not found!${colors.reset}`,
      );
      rl.close();
      await dataSource.destroy();
      process.exit(1);
    }

    // Get Agency ID
    let agencyId = '';
    while (!validateUUID(agencyId)) {
      agencyId = await question(
        `${colors.blue}Enter Agency ID (UUID): ${colors.reset}`,
      );
      if (!validateUUID(agencyId)) {
        console.log(`${colors.red}❌ Invalid UUID format!${colors.reset}\n`);
      }
    }

    // Verify agency exists
    const agencyExists = await dataSource.query(
      `SELECT id FROM agency WHERE id = $1`,
      [agencyId],
    );

    if (agencyExists.length === 0) {
      console.log(
        `${colors.red}❌ Agency with ID "${agencyId}" not found!${colors.reset}`,
      );
      rl.close();
      await dataSource.destroy();
      process.exit(1);
    }

    // Get Email (optional)
    let email = '';
    let validEmail = false;
    while (!validEmail) {
      email = await question(
        `${colors.blue}Enter Email (optional, press Enter to skip): ${colors.reset}`,
      );
      if (validateEmail(email)) {
        validEmail = true;
      } else {
        console.log(`${colors.red}❌ Invalid email format!${colors.reset}\n`);
      }
    }

    // Get Mobile (optional)
    let mobileNo = '';
    let validMobile = false;
    while (!validMobile) {
      mobileNo = await question(
        `${colors.blue}Enter Mobile (+975XXXXXXXX, optional, press Enter to skip): ${colors.reset}`,
      );
      if (validateMobile(mobileNo)) {
        validMobile = true;
      } else {
        console.log(
          `${colors.red}❌ Invalid mobile format! Use +975XXXXXXXX${colors.reset}\n`,
        );
      }
    }

    console.log();
    console.log(`${colors.yellow}⏳ Creating SUPER_ADMIN...${colors.reset}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert SUPER_ADMIN into database
    const result = await dataSource.query(
      `INSERT INTO admin (
        cid_no, 
        role_type, 
        password, 
        office_location_id, 
        agency_id,
        email,
        mobile_no,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, cid_no, role_type, created_at`,
      [
        cidNo,
        'SUPER_ADMIN',
        hashedPassword,
        officeLocationId,
        agencyId,
        email || null,
        mobileNo || null,
      ],
    );

    const createdAdmin = result[0];

    // Display success message
    console.log();
    console.log(
      `${colors.green}╔════════════════════════════════════════════════════╗${colors.reset}`,
    );
    console.log(
      `${colors.green}║                                                    ║${colors.reset}`,
    );
    console.log(
      `${colors.green}║   ✅ SUPER_ADMIN CREATED SUCCESSFULLY!            ║${colors.reset}`,
    );
    console.log(
      `${colors.green}║                                                    ║${colors.reset}`,
    );
    console.log(
      `${colors.green}╚════════════════════════════════════════════════════╝${colors.reset}`,
    );
    console.log();
    console.log(`${colors.cyan}📋 Admin Details:${colors.reset}`);
    console.log(`   ID: ${colors.yellow}${createdAdmin.id}${colors.reset}`);
    console.log(
      `   CID: ${colors.yellow}${createdAdmin.cid_no}${colors.reset}`,
    );
    console.log(
      `   Role Type: ${colors.yellow}${createdAdmin.role_type}${colors.reset}`,
    );
    console.log(
      `   Created At: ${colors.yellow}${createdAdmin.created_at}${colors.reset}`,
    );
    console.log();
    console.log(
      `${colors.green}🎉 You can now login with CID: ${cidNo}${colors.reset}`,
    );
    console.log();

    rl.close();
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
    rl.close();
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();
