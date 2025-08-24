const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUsers() {
  try {
    console.log('🚀 Creating Admin and Super Admin Users for ElimuHub 2.0...\n');

    // Create Super Admin User
    console.log('👑 Creating Super Admin User...');
    const superAdminPassword = await bcrypt.hash('superadmin123', 12);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@elimuhub.com' },
      update: {
        password: superAdminPassword,
        firstName: 'System',
        lastName: 'SuperAdmin',
        role: 'SUPER_ADMIN',
        school: 'ElimuHub System Administration',
        county: 'Nairobi',
        subjects: JSON.stringify(['System Administration', 'Curriculum Oversight', 'User Management']),
        status: 'ACTIVE'
      },
      create: {
        email: 'superadmin@elimuhub.com',
        password: superAdminPassword,
        firstName: 'System',
        lastName: 'SuperAdmin',
        role: 'SUPER_ADMIN',
        school: 'ElimuHub System Administration',
        county: 'Nairobi',
        subjects: JSON.stringify(['System Administration', 'Curriculum Oversight', 'User Management']),
        status: 'ACTIVE'
      },
    });
    console.log('✅ Super Admin created successfully!');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Password: superadmin123\n`);

    // Create Admin User
    console.log('👤 Creating Admin User...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@elimuhub.com' },
      update: {
        password: adminPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        school: 'ElimuHub Administration',
        county: 'Nairobi',
        subjects: JSON.stringify(['User Management', 'Content Management', 'System Monitoring']),
        status: 'ACTIVE'
      },
      create: {
        email: 'admin@elimuhub.com',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        school: 'ElimuHub Administration',
        county: 'Nairobi',
        subjects: JSON.stringify(['User Management', 'Content Management', 'System Monitoring']),
        status: 'ACTIVE'
      },
    });
    console.log('✅ Admin created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password: admin123\n`);

    // Create Teacher User (for testing)
    console.log('👨‍🏫 Creating Teacher User...');
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher@elimuhub.com' },
      update: {
        password: teacherPassword,
        firstName: 'Demo',
        lastName: 'Teacher',
        role: 'TEACHER',
        school: 'Demo Primary School',
        county: 'Nairobi',
        subjects: JSON.stringify(['Mathematics', 'Science', 'English']),
        status: 'ACTIVE'
      },
      create: {
        email: 'teacher@elimuhub.com',
        password: teacherPassword,
        firstName: 'Demo',
        lastName: 'Teacher',
        role: 'TEACHER',
        school: 'Demo Primary School',
        county: 'Nairobi',
        subjects: JSON.stringify(['Mathematics', 'Science', 'English']),
        status: 'ACTIVE'
      },
    });
    console.log('✅ Teacher created successfully!');
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Name: ${teacher.firstName} ${teacher.lastName}`);
    console.log(`   Role: ${teacher.role}`);
    console.log(`   Password: teacher123\n`);

    // Display all users
    console.log('📋 All Users in System:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`      Role: ${user.role} | Status: ${user.status} | Created: ${user.createdAt.toLocaleDateString()}`);
    });

    console.log('\n🎉 Admin users creation completed successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Super Admin: superadmin@elimuhub.com / superadmin123');
    console.log('   Admin: admin@elimuhub.com / admin123');
    console.log('   Teacher: teacher@elimuhub.com / teacher123');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUsers();
