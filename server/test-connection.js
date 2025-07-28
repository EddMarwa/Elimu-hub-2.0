console.log('Working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Node version:', process.version);

// Test our basic imports (using CommonJS for now)
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

console.log('✅ Prisma client imported successfully');

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
