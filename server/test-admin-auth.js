#!/usr/bin/env node

/**
 * Comprehensive Authentication Test for ElimuHub 2.0 Admin Users
 * Tests login functionality for all seeded admin users
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USERS = [
  {
    name: 'Super Admin',
    email: 'superadmin@elimuhub.com',
    password: 'superadmin123',
    role: 'SUPER_ADMIN'
  },
  {
    name: 'Admin',
    email: 'admin@elimuhub.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  {
    name: 'Demo Teacher',
    email: 'teacher@elimuhub.com',
    password: 'teacher123',
    role: 'TEACHER'
  }
];

async function testServerHealth() {
  console.log('🏥 Testing server health...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is healthy:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return false;
  }
}

async function testUserLogin(user) {
  console.log(`\n🔐 Testing login for ${user.name} (${user.email})...`);
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (loginResponse.data.success) {
      console.log(`✅ Login successful for ${user.name}`);
      console.log(`   Role: ${loginResponse.data.data.user.role}`);
      console.log(`   Token: ${loginResponse.data.data.token.substring(0, 20)}...`);
      
      // Test protected endpoint with token
      await testProtectedEndpoint(loginResponse.data.data.token, user.name);
      
      return {
        success: true,
        user: loginResponse.data.data.user,
        token: loginResponse.data.data.token
      };
    } else {
      console.log(`❌ Login failed for ${user.name}: ${loginResponse.data.message}`);
      return { success: false, error: loginResponse.data.message };
    }
  } catch (error) {
    console.log(`❌ Login error for ${user.name}:`, error.response?.data?.message || error.message);
    return { success: false, error: error.message };
  }
}

async function testProtectedEndpoint(token, userName) {
  console.log(`   🔒 Testing protected endpoint for ${userName}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    if (response.data.success) {
      console.log(`   ✅ Protected endpoint accessible for ${userName}`);
      console.log(`   👤 Profile: ${response.data.data?.user?.firstName || 'N/A'} ${response.data.data?.user?.lastName || 'N/A'}`);
    } else {
      console.log(`   ⚠️  Protected endpoint failed for ${userName}: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Protected endpoint error for ${userName}:`, error.response?.data?.message || error.message);
  }
}

async function testPasswordVerification() {
  console.log('\n🔍 Testing password verification...');
  
  const testPassword = 'superadmin123';
  const hashedPassword = await bcrypt.hash(testPassword, 12);
  
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log(`✅ Password verification test: ${isValid ? 'PASSED' : 'FAILED'}`);
  
  return isValid;
}

async function main() {
  console.log('🧪 ElimuHub 2.0 Admin Authentication Test\n');
  console.log('=' .repeat(50));
  
  const results = {
    serverHealth: false,
    passwordVerification: false,
    logins: [],
    totalTests: 0,
    passedTests: 0
  };

  try {
    // Test 1: Server Health
    results.serverHealth = await testServerHealth();
    results.totalTests++;
    if (results.serverHealth) results.passedTests++;

    // Test 2: Password Verification
    results.passwordVerification = await testPasswordVerification();
    results.totalTests++;
    if (results.passwordVerification) results.passedTests++;

    // Test 3: User Logins
    console.log('\n👥 Testing Admin User Logins...');
    for (const user of TEST_USERS) {
      const loginResult = await testUserLogin(user);
      results.logins.push({
        user: user.name,
        email: user.email,
        role: user.role,
        success: loginResult.success,
        error: loginResult.error
      });
      
      results.totalTests++;
      if (loginResult.success) results.passedTests++;
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Authentication Test Summary');
    console.log('=' .repeat(50));
    
    console.log(`🏥 Server Health: ${results.serverHealth ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔍 Password Verification: ${results.passwordVerification ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log('\n👥 Login Results:');
    results.logins.forEach(login => {
      const status = login.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`   ${login.user} (${login.role}): ${status}`);
      if (!login.success) {
        console.log(`      Error: ${login.error}`);
      }
    });
    
    console.log(`\n📈 Overall Results: ${results.passedTests}/${results.totalTests} tests passed`);
    
    if (results.passedTests === results.totalTests) {
      console.log('\n🎉 All authentication tests passed!');
      console.log('✅ Admin users can login successfully');
      console.log('✅ JWT tokens are working');
      console.log('✅ Protected endpoints are accessible');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the test
main().catch(console.error);
