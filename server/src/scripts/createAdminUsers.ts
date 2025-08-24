import { PrismaClient, UserRole, UserStatus } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  school: string;
  county: string;
  subjects: string[];
  status: UserStatus;
}

async function createAdminUsers() {
  try {
    console.log('🚀 Creating Admin and Super Admin Users for ElimuHub 2.0...\n');

    const usersToCreate: CreateUserData[] = [
      {
        email: 'superadmin@elimuhub.com',
        firstName: 'System',
        lastName: 'SuperAdmin',
        password: 'superadmin123',
        role: UserRole.SUPER_ADMIN,
        school: 'ElimuHub System Administration',
        county: 'Nairobi',
        subjects: ['System Administration', 'Curriculum Oversight', 'User Management'],
        status: UserStatus.ACTIVE
      },
      {
        email: 'admin@elimuhub.com',
        firstName: 'System',
        lastName: 'Admin',
        password: 'admin123',
        role: UserRole.ADMIN,
        school: 'ElimuHub Administration',
        county: 'Nairobi',
        subjects: ['User Management', 'Content Management', 'System Monitoring'],
        status: UserStatus.ACTIVE
      },
      {
        email: 'teacher@elimuhub.com',
        firstName: 'Demo',
        lastName: 'Teacher',
        password: 'teacher123',
        role: UserRole.TEACHER,
        school: 'Demo Primary School',
        county: 'Nairobi',
        subjects: ['Mathematics', 'Science', 'English'],
        status: UserStatus.ACTIVE
      }
    ];

    for (const userData of usersToCreate) {
      console.log(`👤 Creating ${userData.role} User: ${userData.email}...`);
      
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          school: userData.school,
          county: userData.county,
          subjects: JSON.stringify(userData.subjects),
          status: userData.status
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          school: userData.school,
          county: userData.county,
          subjects: JSON.stringify(userData.subjects),
          status: userData.status
        },
      });

      console.log(`✅ ${userData.role} created successfully!`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${userData.password}\n`);
    }

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

// Run if called directly
if (require.main === module) {
  createAdminUsers().catch(console.error);
}

export { createAdminUsers };
