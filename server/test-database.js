#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests PostgreSQL connection and Prisma Client functionality
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testDatabase() {
  console.log('🧪 Testing ElimuHub Database Connection...\n');
  
  try {
    // Test 1: Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   PORT: ${process.env.PORT || 5000}\n`);
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL is missing! Please create .env file in project root.');
      console.log('📖 See ENVIRONMENT_SETUP.md for configuration details.');
      process.exit(1);
    }
    
    // Test 2: Test Prisma Client import
    console.log('🔌 Prisma Client Import Test:');
    let PrismaClient;
    try {
      PrismaClient = require('./src/generated/prisma').PrismaClient;
      console.log('   ✅ Prisma Client imported successfully');
    } catch (error) {
      console.log('   ❌ Prisma Client import failed');
      console.log('   💡 Run: npx prisma generate');
      process.exit(1);
    }
    
    // Test 3: Test database connection
    console.log('\n🌐 Database Connection Test:');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('   ✅ Database connection successful');
      
      // Test 4: Test basic query
      console.log('\n🔍 Database Query Test:');
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('   ✅ Basic query successful:', result);
      
      // Test 5: Test user table access
      console.log('\n👥 User Table Access Test:');
      try {
        const userCount = await prisma.user.count();
        console.log(`   ✅ User table accessible, count: ${userCount}`);
      } catch (error) {
        console.log('   ⚠️  User table not accessible (may need migration)');
        console.log('   💡 Run: npx prisma migrate dev');
      }
      
      await prisma.$disconnect();
      console.log('\n✅ All tests passed! Database is ready.');
      
    } catch (error) {
      console.log('   ❌ Database connection failed');
      console.log('   🔍 Error details:', error.message);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 PostgreSQL service may not be running');
        console.log('   Windows: net start postgresql-x64-15');
        console.log('   macOS/Linux: sudo systemctl start postgresql');
      } else if (error.message.includes('authentication failed')) {
        console.log('\n💡 Database credentials may be incorrect');
        console.log('   Check username, password, and database name');
      } else if (error.message.includes('does not exist')) {
        console.log('\n💡 Database may not exist');
        console.log('   Create database: createdb elimuhub');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
    process.exit(1);
  }
}

// Run the test
testDatabase().catch(console.error);
