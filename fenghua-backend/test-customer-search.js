/**
 * Simple test script to reproduce the customer search 500 error
 * Run with: node test-customer-search.js
 */

const http = require('http');

// You'll need to replace this with a valid JWT token from your frontend
const token = process.env.TEST_TOKEN || 'your-token-here';

const searchQuery = '北京';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/customers?search=${encodeURIComponent(searchQuery)}&limit=20`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.end();

