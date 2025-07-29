import { PrismaClient, UserRole } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemoUsers() {
  try {
    console.log('🌱 Seeding demo users...');

    // Demo teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher@demo.com' },
      update: {},
      create: {
        email: 'teacher@demo.com',
        password: teacherPassword,
        firstName: 'Jane',
        lastName: 'Teacher',
        role: UserRole.TEACHER,
        school: 'Nairobi Primary School',
        county: 'Nairobi',
        subjects: JSON.stringify(['Mathematics', 'Science', 'English']),
      },
    });

    // Demo admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        password: adminPassword,
        firstName: 'John',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        school: 'Ministry of Education',
        county: 'Nairobi',
        subjects: JSON.stringify(['All Subjects']),
      },
    });

    // Demo super admin
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@demo.com' },
      update: {},
      create: {
        email: 'superadmin@demo.com',
        password: superAdminPassword,
        firstName: 'Mary',
        lastName: 'SuperAdmin',
        role: UserRole.SUPER_ADMIN,
        school: 'Kenya Institute of Curriculum Development',
        county: 'Nairobi',
        subjects: JSON.stringify(['System Administration', 'Curriculum Oversight']),
      },
    });

    console.log('✅ Demo users created successfully:');
    console.log(`   Teacher: teacher@demo.com / teacher123`);
    console.log(`   Admin: admin@demo.com / admin123`);
    console.log(`   Super Admin: superadmin@demo.com / superadmin123`);
    
    return { teacher, admin, superAdmin };
  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoUsers().catch(console.error);
}

export default seedDemoUsers;
