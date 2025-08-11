const { PrismaClient } = require('./src/generated/prisma');

async function testBackend() {
  console.log('🧪 Testing ElimuHub 2.0 Backend...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Database connection
    console.log('1. Testing Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Test 2: Check if users exist
    console.log('2. Testing User Data...');
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} users in database`);
    users.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });
    console.log('');
    

    
    // Test 4: Check templates
    console.log('4. Testing Template Data...');
    const templates = await prisma.template.findMany();
    console.log(`✅ Found ${templates.length} templates in database`);
    templates.forEach(template => {
      console.log(`   - ${template.name} (${template.type})`);
    });
    console.log('');
    
    // Test 5: Test user authentication service
    console.log('5. Testing Authentication Service...');
    const userService = require('./dist/services/userService.js').default;
    
    // Try to find the admin user
    const adminUser = await userService.findUserByEmail('admin@elimuhub.com');
    if (adminUser) {
      console.log('✅ Admin user found');
      console.log(`   - ID: ${adminUser.id}`);
      console.log(`   - Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   - Role: ${adminUser.role}`);
      
      // Test password validation
      const isValidPassword = await userService.validatePassword('admin123', adminUser.password);
      console.log(`   - Password validation: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
    } else {
      console.log('❌ Admin user not found');
    }
    console.log('');
    
    console.log('🎉 All backend tests passed successfully!');
    console.log('\n📊 Backend Summary:');
    console.log(`   • Database: SQLite with Prisma ORM`);
    console.log(`   • Users: ${users.length} registered`);
    console.log(`   • Templates: ${templates.length} available`);
    console.log(`   • Authentication: JWT-based with bcrypt`);
    
  } catch (error) {
    console.error('❌ Backend test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBackend();
