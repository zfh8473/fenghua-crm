/**
 * GDPR Export API Debug Script
 * 
 * Directly tests the GDPR export API to debug the 400 Bad Request issue
 * All custom code is proprietary and not open source.
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

async function login(): Promise<string> {
  console.log('🔐 Logging in...');
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${JSON.stringify(error)}`);
  }

  const data = (await response.json()) as AuthResponse;
  console.log('✅ Login successful');
  return data.token;
}

async function testGdprEndpoint(token: string, queryParams: string) {
  const url = `${API_BASE_URL}/gdpr/export-requests${queryParams}`;
  console.log(`\n📡 Testing: GET ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (status === 200) {
      console.log(`✅ Status: ${status}`);
      console.log(`📦 Response:`, JSON.stringify(responseData, null, 2));
    } else {
      console.log(`❌ Status: ${status}`);
      console.log(`📦 Response:`, JSON.stringify(responseData, null, 2));
    }

    return { status, data: responseData };
  } catch (error: any) {
    console.log(`💥 Error:`, error.message);
    return { status: 0, error: error.message };
  }
}

async function main() {
  console.log('🚀 GDPR Export API Debug Script\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}\n`);

  try {
    // Step 1: Login
    const token = await login();

    // Step 2: Test various query parameter combinations
    const testCases = [
      { name: 'No parameters', params: '' },
      { name: 'Default parameters (limit=50&offset=0)', params: '?limit=50&offset=0' },
      { name: 'Empty limit', params: '?limit=&offset=0' },
      { name: 'Empty offset', params: '?limit=50&offset=' },
      { name: 'Both empty', params: '?limit=&offset=' },
      { name: 'String numbers', params: '?limit=25&offset=10' },
      { name: 'Invalid limit (negative)', params: '?limit=-1&offset=0' },
      { name: 'Invalid limit (too large)', params: '?limit=101&offset=0' },
      { name: 'Invalid offset (negative)', params: '?limit=50&offset=-1' },
    ];

    console.log('\n' + '='.repeat(60));
    console.log('TESTING QUERY PARAMETER HANDLING');
    console.log('='.repeat(60));

    const results: Array<{ name: string; status: number; success: boolean }> = [];

    for (const testCase of testCases) {
      console.log(`\n📋 Test: ${testCase.name}`);
      const result = await testGdprEndpoint(token, testCase.params);
      results.push({
        name: testCase.name,
        status: result.status,
        success: result.status === 200,
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.status}`);
    });

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    console.log(`\n📊 Results: ${successCount}/${totalCount} tests passed`);

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

main();
