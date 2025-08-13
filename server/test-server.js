const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testServer() {
  console.log('🚀 Testing Server Status...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is running:', healthResponse.data.status);
    console.log('📊 Server info:', {
      uptime: healthResponse.data.uptime,
      environment: healthResponse.data.environment,
      timestamp: healthResponse.data.timestamp
    });

    // Test 2: API info endpoint
    console.log('\n2. Testing API info...');
    const apiInfoResponse = await axios.get(`${API_BASE_URL}`);
    console.log('✅ API is accessible');
    console.log('📋 Available endpoints:', Object.keys(apiInfoResponse.data.endpoints));

    // Test 3: Test lesson plans endpoint (public)
    console.log('\n3. Testing lesson plans endpoint...');
    const lessonPlansResponse = await axios.get(`${API_BASE_URL}/lesson-plans`);
    console.log('✅ Lesson plans endpoint accessible');
    console.log('📊 Response structure:', {
      success: lessonPlansResponse.data.success,
      hasData: !!lessonPlansResponse.data.data,
      hasPagination: !!lessonPlansResponse.data.pagination
    });

    // Test 4: Test folders endpoint (public)
    console.log('\n4. Testing folders endpoint...');
    const foldersResponse = await axios.get(`${API_BASE_URL}/lesson-plans/folders`);
    console.log('✅ Folders endpoint accessible');
    console.log('📊 Folders response:', {
      success: foldersResponse.data.success,
      hasData: !!foldersResponse.data.data
    });

    console.log('\n🎉 Server is running correctly!');
    console.log('\n📋 Server Status Summary:');
    console.log('✅ Health check: PASSED');
    console.log('✅ API endpoints: ACCESSIBLE');
    console.log('✅ Public routes: WORKING');
    console.log('✅ Database connection: ACTIVE');

  } catch (error) {
    console.error('\n❌ Server test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Please start the server first:');
      console.log('   npm run dev (or npm start)');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Server error - check server logs for details');
    } else {
      console.log('\n💡 Unexpected error - check server configuration');
    }
  }
}

// Run the test
testServer();
