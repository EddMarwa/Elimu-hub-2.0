const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking ElimuHub Database...\n');

    // Check users with password info
    const userCount = await prisma.user.count();
    console.log(`👥 Total Users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          school: true,
          county: true,
          password: true,
          createdAt: true
        }
      });
      console.log('\n📋 Users:');
      for (const user of users) {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
        console.log(`    Password hash: ${user.password.substring(0, 20)}...`);
        
        // Test password verification
        const isValid = await bcrypt.compare('password123', user.password);
        console.log(`    Password 'password123' is valid: ${isValid}`);
      }
    }

    

    // Check schemes of work
    const schemeCount = await prisma.schemeOfWork.count();
    console.log(`📖 Total Schemes of Work: ${schemeCount}`);

    // Check documents
    const documentCount = await prisma.document.count();
    console.log(`📄 Total Documents: ${documentCount}`);

    // Check templates
    const templateCount = await prisma.template.count();
    console.log(`📝 Total Templates: ${templateCount}`);

    console.log('\n✅ Database check completed!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
