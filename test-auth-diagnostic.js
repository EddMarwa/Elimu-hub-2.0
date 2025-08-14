const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuthentication() {
  console.log('🔍 Testing Authentication System...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthCheck = await axios.get(`${BASE_URL}/health`).catch(() => null);
    if (healthCheck) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server is not responding');
      return;
    }

    // Test 2: Test login with seeded user
    console.log('\n2. Testing login with seeded teacher user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'teacher@elimuhub.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('   User:', loginResponse.data.data.user.email);
      console.log('   Role:', loginResponse.data.data.user.role);
      console.log('   Token received:', !!loginResponse.data.data.token);
      
      const token = loginResponse.data.data.token;
      
      // Test 3: Test protected endpoint with token
      console.log('\n3. Testing protected endpoint...');
      const protectedResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (protectedResponse.data.success) {
        console.log('✅ Protected endpoint accessible');
        console.log('   User profile retrieved successfully');
      } else {
        console.log('❌ Protected endpoint failed');
      }
      
      // Test 4: Test lesson plans endpoint
      console.log('\n4. Testing lesson plans endpoint...');
      const lessonPlansResponse = await axios.get(`${BASE_URL}/lesson-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (lessonPlansResponse.data.success) {
        console.log('✅ Lesson plans endpoint accessible');
        console.log('   Lesson plans count:', lessonPlansResponse.data.data.length);
      } else {
        console.log('❌ Lesson plans endpoint failed');
      }
      
    } else {
      console.log('❌ Login failed');
      console.log('   Error:', loginResponse.data.message);
    }

    // Test 5: Test admin login
    console.log('\n5. Testing admin login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@elimuhub.com',
      password: 'password123'
    });

    if (adminLoginResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log('   Admin role:', adminLoginResponse.data.data.user.role);
    } else {
      console.log('❌ Admin login failed');
      console.log('   Error:', adminLoginResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Authentication test failed');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data?.message || error.message);
    } else {
      console.log('   Error:', error.message);
    }
  }
}

testAuthentication();
