const fs = require('fs');
const path = require('path');

console.log('🚀 ElimuHub 2.0 Quick Setup Script\n');

// Step 1: Create .env file in project root if it doesn't exist
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file in project root...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created in project root from env.example');
  } else {
    console.log('❌ env.example not found. Please create .env manually in project root.');
  }
} else {
  console.log('✅ .env file already exists in project root');
}

// Step 2: Create necessary directories in server folder
const dirs = [
  'logs',
  'uploads',
  'uploads/templates',
  'uploads/documents',
  'uploads/schemes',
  'uploads/lesson-plans'
];

console.log('\n📁 Creating necessary directories in server folder...');
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`✅ Exists: ${dir}`);
  }
});

// Step 3: Check package.json scripts
console.log('\n🔧 Checking package.json scripts...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = [
    'db:generate',
    'db:push',
    'db:seed',
    'create:admins',
    'create:admins:js'
  ];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ Script exists: ${script}`);
    } else {
      console.log(`❌ Missing script: ${script}`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Step 4: Check Prisma setup
console.log('\n🗄️ Checking Prisma setup...');
const prismaDir = path.join(__dirname, 'prisma');
const schemaPath = path.join(prismaDir, 'schema.prisma');
const generatedDir = path.join(__dirname, 'src/generated');

if (fs.existsSync(schemaPath)) {
  console.log('✅ Prisma schema exists');
} else {
  console.log('❌ Prisma schema not found');
}

if (fs.existsSync(generatedDir)) {
  console.log('✅ Prisma client generated directory exists');
} else {
  console.log('❌ Prisma client not generated');
}

// Step 5: Check environment variables in project root
console.log('\n🔐 Checking environment configuration in project root...');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV',
    'PORT'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ Environment variable: ${varName}`);
    } else {
      console.log(`❌ Missing environment variable: ${varName}`);
    }
  });
}

// Step 6: Next steps instructions
console.log('\n🎯 Next Steps:');
console.log('1. Edit .env file in project root with your actual values');
console.log('2. Run: npm run db:generate');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run db:seed');
console.log('5. Run: npm run create:admins');
console.log('6. Run: npm run dev');

console.log('\n📋 Quick Commands:');
console.log('cd server');
console.log('npm run db:generate');
console.log('npm run db:push');
console.log('npm run db:seed');
console.log('npm run create:admins');
console.log('npm run dev');

console.log('\n📝 Note: .env file is created in project root directory');
console.log('   Server will automatically load it from there');

console.log('\n🎉 Quick setup completed!');
console.log('Please follow the next steps above to complete your setup.');
