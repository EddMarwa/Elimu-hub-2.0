const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking ElimuHub Database...\n');

    // Check users
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
          createdAt: true
        }
      });
      console.log('\n📋 Users:');
      users.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
      });
    }

    // Check lesson plans
    const lessonPlanCount = await prisma.lessonPlan.count();
    console.log(`\n📚 Total Lesson Plans: ${lessonPlanCount}`);

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
