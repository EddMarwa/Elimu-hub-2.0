const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ElimuHub 2.0 Demo Server...\n');

// Check if package-demo.json exists
if (!fs.existsSync('package-demo.json')) {
  console.log('❌ package-demo.json not found. Please ensure you are in the server directory.');
  process.exit(1);
}

try {
  // Install demo dependencies
  console.log('📦 Installing demo dependencies...');
  execSync('npm install --package-lock-only', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully!\n');
  
  console.log('🎯 Demo Server Setup Complete!\n');
  console.log('📧 Available Demo Accounts:');
  console.log('   👑 Admin: admin@elimuhub.com / password123');
  console.log('   👨‍🏫 Teacher: teacher@elimuhub.com / password123');
  console.log('   🎭 Demo: demo@elimuhub.com / password123\n');
  
  console.log('🚀 To start the demo server:');
  console.log('   npm start\n');
  
  console.log('🔗 The server will run on: http://localhost:5000');
  console.log('📚 Frontend can connect to: http://localhost:3000\n');
  
  console.log('💡 Tips:');
  console.log('   - Use any of the demo accounts above to login');
  console.log('   - No database setup required');
  console.log('   - Perfect for testing the UI and authentication flow');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
