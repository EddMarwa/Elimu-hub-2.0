import { PrismaClient, UserRole, UserStatus } from '../../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface UserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const defaultUsers: UserData[] = [
  {
    name: "System SuperAdmin",
    email: "superadmin@elimuhub.com",
    password: "superadmin123",
    role: UserRole.SUPER_ADMIN
  },
  {
    name: "System Admin",
    email: "admin@elimuhub.com",
    password: "admin123",
    role: UserRole.ADMIN
  },
  {
    name: "Demo Teacher",
    email: "teacher@elimuhub.com",
    password: "teacher123",
    role: UserRole.TEACHER
  }
];

async function createUserIfNotExists(userData: UserData): Promise<{ created: boolean; user: any }> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`⏭️  User already exists: ${userData.email} (${userData.role})`);
      return { created: false, user: existingUser };
    }

    // Hash password securely
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Split name into firstName and lastName
    const nameParts = userData.name.split(' ');
    const firstName = nameParts[0] || userData.name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
        role: userData.role,
        status: UserStatus.ACTIVE,
        school: 'ElimuHub System',
        county: 'Nairobi',
        subjects: JSON.stringify(['General'])
      }
    });

    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    return { created: true, user: newUser };

  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🌱 Starting ElimuHub 2.0 Admin Users Seed...\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('🔌 Database connection established\n');

    const results = {
      created: 0,
      skipped: 0,
      users: [] as any[]
    };

    // Process each default user
    for (const userData of defaultUsers) {
      const result = await createUserIfNotExists(userData);
      
      if (result.created) {
        results.created++;
      } else {
        results.skipped++;
      }
      
      results.users.push(result.user);
    }

    // Summary
    console.log('\n📊 Seed Summary:');
    console.log(`   ✅ Created: ${results.created} users`);
    console.log(`   ⏭️  Skipped: ${results.skipped} users (already exist)`);
    console.log(`   📋 Total processed: ${defaultUsers.length} users`);

    // Display all users in system
    console.log('\n👥 All Users in System:');
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    allUsers.forEach((user, index) => {
      const createdDate = user.createdAt.toLocaleDateString('en-GB');
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`      Role: ${user.role} | Status: ${user.status} | Created: ${createdDate}`);
    });

    console.log('\n🎉 Admin users seed completed successfully!');

    // Display login credentials for newly created users
    if (results.created > 0) {
      console.log('\n🔐 Login Credentials for New Users:');
      defaultUsers.forEach(userData => {
        const user = results.users.find(u => u.email === userData.email);
        if (user && user.createdAt.toISOString().includes(new Date().toISOString().split('T')[0])) {
          console.log(`   ${userData.role}: ${userData.email} / ${userData.password}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .catch((error) => {
      console.error('❌ Fatal error during seeding:', error);
      process.exit(1);
    });
}

export { main as seedAdminUsers };
