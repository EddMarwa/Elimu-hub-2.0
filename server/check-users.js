const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function viewUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        school: true,
        county: true,
        status: true,
        createdAt: true
      }
    });

    console.log('👥 Current Users in Database:');
    console.log('==============================');
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   School: ${user.school || 'Not set'}`);
      console.log(`   County: ${user.county || 'Not set'}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    });

    console.log(`\n📊 Total Users: ${users.length}`);
    
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n👑 Role Distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

viewUsers();
