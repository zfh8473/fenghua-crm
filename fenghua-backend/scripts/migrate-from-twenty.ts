/**
 * Data Migration Script: Migrate from Twenty CRM to Native Tables
 * 
 * This script migrates data from Twenty CRM database to the new native tables:
 * - Users (from core.user)
 * - Roles (from core.role)
 * - Companies (from core.company)
 * - People (from core.person)
 * 
 * Usage:
 *   npx ts-node scripts/migrate-from-twenty.ts
 * 
 * Environment Variables:
 *   TWENTY_DATABASE_URL - Twenty CRM database connection string
 *   DATABASE_URL - fenghua-crm database connection string
 * 
 * Date: 2025-12-26
 * Story: 16.1
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.development') });

interface TwentyUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

interface TwentyRole {
  id: string;
  label: string;
  description: string | null;
}

interface TwentyCompany {
  id: string;
  name: string;
  domainName: string | null;
  address: string | null;
  industry: string | null;
  employees: number | null;
  createdAt: Date;
}

interface TwentyPerson {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  companyId: string;
  createdAt: Date;
}

interface UserRoleMapping {
  userId: string;
  roleId: string;
}

class DataMigrator {
  private twentyPool: Pool;
  private fenghuaPool: Pool;

  constructor() {
    const twentyDbUrl = process.env.TWENTY_DATABASE_URL;
    const fenghuaDbUrl = process.env.DATABASE_URL;

    if (!twentyDbUrl) {
      throw new Error('TWENTY_DATABASE_URL environment variable is required');
    }
    if (!fenghuaDbUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.twentyPool = new Pool({ connectionString: twentyDbUrl });
    this.fenghuaPool = new Pool({ connectionString: fenghuaDbUrl });

    // Handle pool errors
    this.twentyPool.on('error', (err) => {
      console.error('Unexpected error on Twenty database pool:', err);
    });
    this.fenghuaPool.on('error', (err) => {
      console.error('Unexpected error on fenghua database pool:', err);
    });
  }

  /**
   * Export users from Twenty CRM database
   */
  async exportUsers(): Promise<TwentyUser[]> {
    console.log('📤 Exporting users from Twenty CRM...');
    
    const query = `
      SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName",
        u."createdAt"
      FROM core."user" u
      WHERE u.email IS NOT NULL
      ORDER BY u."createdAt";
    `;

    const result = await this.twentyPool.query(query);
    console.log(`   Found ${result.rows.length} users`);
    return result.rows;
  }

  /**
   * Export roles from Twenty CRM database
   */
  async exportRoles(): Promise<TwentyRole[]> {
    console.log('📤 Exporting roles from Twenty CRM...');
    
    const query = `
      SELECT 
        r.id,
        r.label,
        r.description
      FROM core."role" r
      ORDER BY r.label;
    `;

    const result = await this.twentyPool.query(query);
    console.log(`   Found ${result.rows.length} roles`);
    return result.rows;
  }

  /**
   * Export user-role mappings from Twenty CRM database
   */
  async exportUserRoleMappings(): Promise<UserRoleMapping[]> {
    console.log('📤 Exporting user-role mappings from Twenty CRM...');
    
    const query = `
      SELECT DISTINCT
        uw."userId" as user_id,
        r.id as role_id
      FROM core."userWorkspace" uw
      JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
      JOIN core."role" r ON r.id = rt."roleId"
      WHERE uw."userId" IS NOT NULL
        AND r.id IS NOT NULL;
    `;

    const result = await this.twentyPool.query(query);
    console.log(`   Found ${result.rows.length} user-role mappings`);
    return result.rows.map(row => ({
      userId: row.user_id,
      roleId: row.role_id,
    }));
  }

  /**
   * Export companies from Twenty CRM database
   */
  async exportCompanies(): Promise<TwentyCompany[]> {
    console.log('📤 Exporting companies from Twenty CRM...');
    
    const query = `
      SELECT 
        c.id,
        c.name,
        c."domainName",
        c.address,
        c.industry,
        c.employees,
        c."createdAt"
      FROM core."company" c
      WHERE c.name IS NOT NULL
      ORDER BY c."createdAt";
    `;

    const result = await this.twentyPool.query(query);
    console.log(`   Found ${result.rows.length} companies`);
    return result.rows;
  }

  /**
   * Export people from Twenty CRM database
   */
  async exportPeople(): Promise<TwentyPerson[]> {
    console.log('📤 Exporting people from Twenty CRM...');
    
    const query = `
      SELECT 
        p.id,
        p."firstName",
        p."lastName",
        p.email,
        p.phone,
        p."jobTitle",
        p."companyId",
        p."createdAt"
      FROM core."person" p
      WHERE p."companyId" IS NOT NULL
      ORDER BY p."createdAt";
    `;

    const result = await this.twentyPool.query(query);
    console.log(`   Found ${result.rows.length} people`);
    return result.rows;
  }

  /**
   * Import users to fenghua-crm database
   * Note: Password hashes cannot be migrated, users will need to reset passwords
   */
  async importUsers(users: TwentyUser[]): Promise<Map<string, string>> {
    console.log('📥 Importing users to fenghua-crm...');
    
    const userIdMap = new Map<string, string>(); // old_id -> new_id
    let imported = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Check if user already exists (by email)
        const existing = await this.fenghuaPool.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );

        if (existing.rows.length > 0) {
          userIdMap.set(user.id, existing.rows[0].id);
          skipped++;
          continue;
        }

        // Insert new user (with temporary password_hash - users will need to reset password)
        // Generate a temporary password hash that cannot be used for login
        // Users must use password reset functionality to set their password
        const tempPasswordHash = await bcrypt.hash('TEMP_PASSWORD_RESET_REQUIRED_' + Date.now(), 10);
        
        const result = await this.fenghuaPool.query(
          `INSERT INTO users (
            email, password_hash, first_name, last_name, email_verified, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id`,
          [
            user.email,
            tempPasswordHash, // Temporary hash - user must reset password
            user.firstName || null,
            user.lastName || null,
            false, // Email not verified by default
            user.createdAt,
            user.createdAt,
          ]
        );

        const newUserId = result.rows[0].id;
        userIdMap.set(user.id, newUserId);
        imported++;
      } catch (error: any) {
        console.error(`   Error importing user ${user.email}:`, error.message);
      }
    }

    console.log(`   Imported: ${imported}, Skipped: ${skipped}`);
    return userIdMap;
  }

  /**
   * Import roles to fenghua-crm database
   */
  async importRoles(roles: TwentyRole[]): Promise<Map<string, string>> {
    console.log('📥 Importing roles to fenghua-crm...');
    
    const roleIdMap = new Map<string, string>(); // old_id -> new_id
    let imported = 0;
    let skipped = 0;

    for (const role of roles) {
      try {
        // Map role label to role name
        const roleName = this.mapRoleLabelToName(role.label);
        if (!roleName) {
          console.log(`   Skipping unknown role: ${role.label}`);
          skipped++;
          continue;
        }

        // Check if role already exists (by name)
        const existing = await this.fenghuaPool.query(
          'SELECT id FROM roles WHERE name = $1',
          [roleName]
        );

        if (existing.rows.length > 0) {
          roleIdMap.set(role.id, existing.rows[0].id);
          skipped++;
          continue;
        }

        // Insert new role
        const result = await this.fenghuaPool.query(
          `INSERT INTO roles (name, description, created_at, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id`,
          [roleName, role.description || null]
        );

        const newRoleId = result.rows[0].id;
        roleIdMap.set(role.id, newRoleId);
        imported++;
      } catch (error: any) {
        console.error(`   Error importing role ${role.label}:`, error.message);
      }
    }

    console.log(`   Imported: ${imported}, Skipped: ${skipped}`);
    return roleIdMap;
  }

  /**
   * Map Twenty CRM role label to fenghua-crm role name
   */
  private mapRoleLabelToName(label: string): string | null {
    const labelUpper = label.toUpperCase();
    
    if (labelUpper.includes('ADMIN')) return 'ADMIN';
    if (labelUpper.includes('DIRECTOR')) return 'DIRECTOR';
    if (labelUpper.includes('FRONTEND') || labelUpper.includes('BUYER')) return 'FRONTEND_SPECIALIST';
    if (labelUpper.includes('BACKEND') || labelUpper.includes('SUPPLIER')) return 'BACKEND_SPECIALIST';
    
    return null;
  }

  /**
   * Import user-role mappings to fenghua-crm database
   */
  async importUserRoleMappings(
    mappings: UserRoleMapping[],
    userIdMap: Map<string, string>,
    roleIdMap: Map<string, string>
  ): Promise<void> {
    console.log('📥 Importing user-role mappings to fenghua-crm...');
    
    let imported = 0;
    let skipped = 0;

    for (const mapping of mappings) {
      try {
        const newUserId = userIdMap.get(mapping.userId);
        const newRoleId = roleIdMap.get(mapping.roleId);

        if (!newUserId || !newRoleId) {
          skipped++;
          continue;
        }

        // Check if mapping already exists
        const existing = await this.fenghuaPool.query(
          'SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2',
          [newUserId, newRoleId]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insert new mapping
        await this.fenghuaPool.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)`,
          [newUserId, newRoleId]
        );

        imported++;
      } catch (error: any) {
        console.error(`   Error importing user-role mapping:`, error.message);
      }
    }

    console.log(`   Imported: ${imported}, Skipped: ${skipped}`);
  }

  /**
   * Import companies to fenghua-crm database
   */
  async importCompanies(companies: TwentyCompany[]): Promise<Map<string, string>> {
    console.log('📥 Importing companies to fenghua-crm...');
    
    const companyIdMap = new Map<string, string>(); // old_id -> new_id
    let imported = 0;
    let skipped = 0;

    for (const company of companies) {
      try {
        // Check if company already exists (by name)
        const existing = await this.fenghuaPool.query(
          'SELECT id FROM companies WHERE name = $1 AND deleted_at IS NULL',
          [company.name]
        );

        if (existing.rows.length > 0) {
          companyIdMap.set(company.id, existing.rows[0].id);
          skipped++;
          continue;
        }

        // Determine customer_type (default to BUYER if cannot determine)
        // Note: This is a simplified mapping. You may need to adjust based on your data.
        const customerType = 'BUYER'; // Default, can be enhanced based on company data

        // Insert new company
        const result = await this.fenghuaPool.query(
          `INSERT INTO companies (
            name, domain_name, address, industry, employees, customer_type, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
          [
            company.name,
            company.domainName || null,
            company.address || null,
            company.industry || null,
            company.employees || null,
            customerType,
            company.createdAt,
            company.createdAt,
          ]
        );

        const newCompanyId = result.rows[0].id;
        companyIdMap.set(company.id, newCompanyId);
        imported++;
      } catch (error: any) {
        console.error(`   Error importing company ${company.name}:`, error.message);
      }
    }

    console.log(`   Imported: ${imported}, Skipped: ${skipped}`);
    return companyIdMap;
  }

  /**
   * Import people to fenghua-crm database
   */
  async importPeople(
    people: TwentyPerson[],
    companyIdMap: Map<string, string>
  ): Promise<void> {
    console.log('📥 Importing people to fenghua-crm...');
    
    let imported = 0;
    let skipped = 0;

    for (const person of people) {
      try {
        const newCompanyId = companyIdMap.get(person.companyId);
        if (!newCompanyId) {
          skipped++;
          continue;
        }

        // Check if person already exists (by email and company)
        if (person.email) {
          const existing = await this.fenghuaPool.query(
            'SELECT id FROM people WHERE email = $1 AND company_id = $2 AND deleted_at IS NULL',
            [person.email, newCompanyId]
          );

          if (existing.rows.length > 0) {
            skipped++;
            continue;
          }
        }

        // Insert new person
        await this.fenghuaPool.query(
          `INSERT INTO people (
            first_name, last_name, email, phone, job_title, company_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            person.firstName || null,
            person.lastName || null,
            person.email || null,
            person.phone || null,
            person.jobTitle || null,
            newCompanyId,
            person.createdAt,
            person.createdAt,
          ]
        );

        imported++;
      } catch (error: any) {
        console.error(`   Error importing person:`, error.message);
      }
    }

    console.log(`   Imported: ${imported}, Skipped: ${skipped}`);
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity(): Promise<void> {
    console.log('🔍 Validating data integrity...');

    // Check users
    const userCount = await this.fenghuaPool.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
    console.log(`   Users: ${userCount.rows[0].count}`);

    // Check roles
    const roleCount = await this.fenghuaPool.query('SELECT COUNT(*) FROM roles');
    console.log(`   Roles: ${roleCount.rows[0].count}`);

    // Check user_roles
    const userRoleCount = await this.fenghuaPool.query('SELECT COUNT(*) FROM user_roles');
    console.log(`   User-Role Mappings: ${userRoleCount.rows[0].count}`);

    // Check companies
    const companyCount = await this.fenghuaPool.query('SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL');
    console.log(`   Companies: ${companyCount.rows[0].count}`);

    // Check people
    const peopleCount = await this.fenghuaPool.query('SELECT COUNT(*) FROM people WHERE deleted_at IS NULL');
    console.log(`   People: ${peopleCount.rows[0].count}`);

    // Check foreign key integrity
    const orphanedPeople = await this.fenghuaPool.query(
      'SELECT COUNT(*) FROM people p LEFT JOIN companies c ON p.company_id = c.id WHERE c.id IS NULL AND p.deleted_at IS NULL'
    );
    if (parseInt(orphanedPeople.rows[0].count) > 0) {
      console.warn(`   ⚠️  Found ${orphanedPeople.rows[0].count} orphaned people records`);
    } else {
      console.log('   ✓ All people records have valid company references');
    }
  }

  /**
   * Run the complete migration
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting data migration from Twenty CRM to fenghua-crm...\n');

    try {
      // Export data from Twenty CRM
      const users = await this.exportUsers();
      const roles = await this.exportRoles();
      const userRoleMappings = await this.exportUserRoleMappings();
      const companies = await this.exportCompanies();
      const people = await this.exportPeople();

      console.log('');

      // Import data to fenghua-crm
      const userIdMap = await this.importUsers(users);
      const roleIdMap = await this.importRoles(roles);
      await this.importUserRoleMappings(userRoleMappings, userIdMap, roleIdMap);
      const companyIdMap = await this.importCompanies(companies);
      await this.importPeople(people, companyIdMap);

      console.log('');

      // Validate data integrity
      await this.validateDataIntegrity();

      console.log('\n✅ Migration completed successfully!');
      console.log('\n⚠️  Important Notes:');
      console.log('   - Users will need to reset their passwords (password hashes cannot be migrated)');
      console.log('   - Email verification status is set to false by default');
      console.log('   - Company customer_type is set to BUYER by default (may need manual adjustment)');
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      throw error;
    } finally {
      await this.twentyPool.end();
      await this.fenghuaPool.end();
    }
  }
}

// Run migration if executed directly
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.migrate().catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
}

export { DataMigrator };

