/**
 * 获取 API Token 的辅助脚本
 * 
 * 使用方法：
 *   cd fenghua-backend
 *   API_BASE_URL=http://localhost:3001/api LOGIN_EMAIL=your@email.com LOGIN_PASSWORD=yourpassword npx ts-node ../scripts/get-api-token.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const LOGIN_EMAIL = process.env.LOGIN_EMAIL || '';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || '';

if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  console.error('❌ 请设置 LOGIN_EMAIL 和 LOGIN_PASSWORD 环境变量');
  console.error('');
  console.error('使用方法：');
  console.error('  cd fenghua-backend');
  console.error('  API_BASE_URL=http://localhost:3001/api LOGIN_EMAIL=your@email.com LOGIN_PASSWORD=yourpassword npx ts-node ../scripts/get-api-token.ts');
  process.exit(1);
}

async function getToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`登录失败: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    
    if (data.token) {
      console.log('✅ 登录成功！');
      console.log('');
      console.log('📋 API Token:');
      console.log(data.token);
      console.log('');
      console.log('💡 使用方法：');
      console.log(`   export API_TOKEN="${data.token}"`);
      console.log(`   cd fenghua-backend`);
      console.log(`   API_BASE_URL=http://localhost:3001/api API_TOKEN=$API_TOKEN npx ts-node ../scripts/create-50-products-test-scenario.ts`);
      return data.token;
    } else {
      throw new Error('响应中未找到 token');
    }
  } catch (error) {
    console.error('❌ 获取 token 失败:', error);
    process.exit(1);
  }
}

getToken().catch(error => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
});
