// Test authentication endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  console.log('🧪 Testing Authentication...\n');

  try {
    // Test login with seeded user
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@elimuhub.com',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    console.log('Full response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data?.token;
    const user = loginResponse.data.data?.user;

    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('User:', user ? `${user.firstName} ${user.lastName}` : 'Missing');

    if (!token) {
      console.log('❌ No token received, cannot test protected routes');
      return;
    }

    // Test protected route
    console.log('\n2. Testing protected route...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile fetch successful!');
    console.log('Profile:', profileResponse.data.user ? `${profileResponse.data.user.firstName} ${profileResponse.data.user.lastName}` : 'Missing');

    // Test admin login
    console.log('\n3. Testing admin login...');
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@elimuhub.com',
      password: 'password123'
    });

    console.log('✅ Admin login successful!');
    const adminUser = adminLoginResponse.data.data?.user;
    console.log('Admin:', adminUser ? `${adminUser.firstName} ${adminUser.lastName} (${adminUser.role})` : 'Missing');

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Available accounts:');
    console.log('Teacher: teacher@elimuhub.com / password123');
    console.log('Admin: admin@elimuhub.com / password123');

  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data || error.message);
  }
}

testAuth();
