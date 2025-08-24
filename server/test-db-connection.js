const { PrismaClient } = require('./src/generated/prisma');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if we can connect
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test 2: Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Test 3: Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('\n👥 Users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role} | Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // Test 4: Check other tables
    const tableCounts = {};
    const tables = ['Document', 'SchemeOfWork', 'LessonPlan', 'Template'];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        tableCounts[table] = count;
      } catch (e) {
        tableCounts[table] = 'Error';
      }
    }
    
    console.log('📋 Table record counts:');
    Object.entries(tableCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed.');
  }
}

testDatabaseConnection();
