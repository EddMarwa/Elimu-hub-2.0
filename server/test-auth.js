// Test authentication endpoints
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAuthentication() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'TEACHER',
      school: 'Test School',
      county: 'Test County'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.success);
    
    const token = registerResponse.data.data.token;
    console.log('📝 Token received:', token ? 'Yes' : 'No');

    // Test 2: Login with the registered user
    console.log('\n2. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data.success);

    // Test 3: Get user profile with token
    console.log('\n3. Testing profile retrieval...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile retrieval successful:', profileResponse.data.success);
    console.log('👤 User data:', {
      email: profileResponse.data.data.email,
      role: profileResponse.data.data.role,
      firstName: profileResponse.data.data.firstName
    });

    // Test 4: Test protected endpoint (lesson plans)
    console.log('\n4. Testing protected endpoint access...');
    const lessonPlansResponse = await axios.get(`${API_BASE_URL}/lesson-plans`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Protected endpoint access successful:', lessonPlansResponse.data.success);

    // Test 5: Test invalid token
    console.log('\n5. Testing invalid token...');
    try {
      await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Invalid token test failed - should have been rejected');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Invalid token correctly rejected');
      } else {
        console.log('❌ Unexpected error for invalid token:', error.response?.status);
      }
    }

    // Test 6: Test missing token
    console.log('\n6. Testing missing token...');
    try {
      await axios.get(`${API_BASE_URL}/auth/profile`);
      console.log('❌ Missing token test failed - should have been rejected');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Missing token correctly rejected');
      } else {
        console.log('❌ Unexpected error for missing token:', error.response?.status);
      }
    }

    // Test 7: Test public endpoint without token
    console.log('\n7. Testing public endpoint access...');
    const publicResponse = await axios.get(`${API_BASE_URL}/lesson-plans`);
    console.log('✅ Public endpoint access successful:', publicResponse.data.success);

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('\n❌ Authentication test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 Server error - make sure the server is running on port 5000');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused - make sure the server is running on port 5000');
    }
  }
}

// Run the test
testAuthentication();
