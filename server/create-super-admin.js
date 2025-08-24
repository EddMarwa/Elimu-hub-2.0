#!/usr/bin/env node

/**
 * Create Super Admin User Script
 * Creates the first super admin user for ElimuHub
 */

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createSuperAdmin() {
  console.log('👑 Creating Super Admin User for ElimuHub...\n');
  
  try {
    // Check if environment is loaded
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL is missing! Please create .env file in project root.');
      console.log('📖 See ENVIRONMENT_SETUP.md for configuration details.');
      process.exit(1);
    }

    // Import Prisma Client
    const { PrismaClient, UserRole, UserStatus } = require('./src/generated/prisma');
    const prisma = new PrismaClient();

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN }
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.firstName} ${existingSuperAdmin.lastName}`);
      console.log(`   Role: ${existingSuperAdmin.role}`);
      console.log(`   Status: ${existingSuperAdmin.status}`);
      
      await prisma.$disconnect();
      return;
    }

    // Super admin details
    const superAdminData = {
      email: 'superadmin@elimuhub.com',
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      school: 'ElimuHub System',
      county: 'Nairobi',
      subjects: ['All Subjects'],
      status: UserStatus.ACTIVE
    };

    console.log('📋 Super Admin Details:');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Password: ${superAdminData.password}`);
    console.log(`   Name: ${superAdminData.firstName} ${superAdminData.lastName}`);
    console.log(`   Role: ${superAdminData.role}`);
    console.log(`   School: ${superAdminData.school}`);
    console.log(`   County: ${superAdminData.county}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminData.email,
        password: hashedPassword,
        firstName: superAdminData.firstName,
        lastName: superAdminData.lastName,
        role: superAdminData.role,
        school: superAdminData.school,
        county: superAdminData.county,
        subjects: JSON.stringify(superAdminData.subjects),
        status: superAdminData.status,
      },
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Status: ${superAdmin.status}`);
    console.log(`   Created: ${superAdmin.createdAt.toLocaleString()}`);

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: superAdmin.id,
        userId: superAdmin.id,
        details: JSON.stringify({
          action: 'Created super admin user',
          userRole: superAdminData.role,
          userEmail: superAdminData.email,
          method: 'Script execution'
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'SuperAdmin-Creation-Script',
      },
    });

    console.log('\n📝 Audit log entry created');

    // Display login instructions
    console.log('\n🔐 Login Instructions:');
    console.log('   1. Use the email and password above to log in');
    console.log('   2. You now have full system access');
    console.log('   3. You can create additional admin users');
    console.log('   4. You can manage all system settings');

    // Display available admin endpoints
    console.log('\n🌐 Available Admin Endpoints:');
    console.log('   GET  /api/admin/users          - List all users');
    console.log('   POST /api/admin/users          - Create admin users');
    console.log('   GET  /api/admin/system/stats   - System statistics');
    console.log('   GET  /api/admin/system/health  - System health');
    console.log('   GET  /api/admin/audit/logs     - Audit logs');

    await prisma.$disconnect();
    console.log('\n🎉 Super Admin setup complete!');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 PostgreSQL service may not be running');
      console.log('   Windows: net start postgresql-x64-15');
      console.log('   macOS/Linux: sudo systemctl start postgresql');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Database credentials may be incorrect');
      console.log('   Check username, password, and database name');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Database may not exist');
      console.log('   Create database: createdb elimuhub');
    }
    
    process.exit(1);
  }
}

// Run the script
createSuperAdmin().catch(console.error);
