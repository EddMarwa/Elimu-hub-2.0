import { PrismaClient, UserRole } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDemoUsers() {
  console.log('🌱 Creating demo users...');

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@elimuhub.com' },
    update: {
      password: teacherPassword,
    },
    create: {
      email: 'teacher@elimuhub.com',
      firstName: 'John',
      lastName: 'Teacher',
      role: UserRole.TEACHER,
      school: 'Sample Primary School',
      county: 'Nairobi',
      subjects: JSON.stringify(['Mathematics', 'Science']),
      password: teacherPassword,
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@elimuhub.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@elimuhub.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      school: 'ElimuHub System',
      county: 'Nairobi',
      subjects: JSON.stringify(['Mathematics', 'Science', 'English']),
      password: adminPassword,
    },
  });

  // Create super admin user
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@elimuhub.com' },
    update: {},
    create: {
      email: 'superadmin@elimuhub.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      school: 'ElimuHub System',
      county: 'Nairobi',
      subjects: JSON.stringify(['Mathematics', 'Science', 'English', 'Administration']),
      password: superAdminPassword,
    },
  });

  console.log('✅ Demo users created successfully!');
  console.log('👨‍🏫 Teacher: teacher@elimuhub.com / teacher123');
  console.log('👤 Admin: admin@elimuhub.com / admin123');
}

createDemoUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
