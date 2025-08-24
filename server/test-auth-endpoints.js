const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuthEndpoints() {
  console.log('🔐 Testing Authentication Endpoints...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    try {
      const response = await axios.get(`${BASE_URL}/auth/health`);
      console.log('✅ Server is running and responding');
    } catch (e) {
      console.log('⚠️  Server health check failed (might be expected)');
    }
    
    // Test 2: Test login with existing user
    console.log('\n2️⃣ Testing login with existing user...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'teacher@elimuhub.com',
        password: 'teacher123'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login successful!');
        console.log(`   User: ${loginResponse.data.data.user.firstName} ${loginResponse.data.data.user.lastName}`);
        console.log(`   Role: ${loginResponse.data.data.user.role}`);
        console.log(`   Token: ${loginResponse.data.data.token.substring(0, 20)}...`);
        
        const token = loginResponse.data.data.token;
        
        // Test 3: Test protected endpoint with token
        console.log('\n3️⃣ Testing protected endpoint with token...');
        try {
          const protectedResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Protected endpoint accessible with token');
        } catch (e) {
          console.log('⚠️  Protected endpoint test failed (might be expected)');
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } catch (e) {
      console.log('❌ Login test failed:', e.response?.data?.message || e.message);
    }
    
    // Test 4: Test user registration
    console.log('\n4️⃣ Testing user registration...');
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        email: testEmail,
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User',
        role: 'TEACHER',
        school: 'Test School',
        county: 'Test County'
      });
      
      if (registerResponse.data.success) {
        console.log('✅ User registration successful!');
        console.log(`   New user: ${registerResponse.data.data.user.email}`);
        console.log(`   Role: ${registerResponse.data.data.user.role}`);
      } else {
        console.log('❌ Registration failed:', registerResponse.data.message);
      }
    } catch (e) {
      console.log('❌ Registration test failed:', e.response?.data?.message || e.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🎯 Authentication endpoint testing completed!');
}

testAuthEndpoints();
