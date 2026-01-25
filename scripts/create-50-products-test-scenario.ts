/**
 * 创建50个产品的测试场景脚本
 * 
 * 这个脚本会：
 * 1. 创建一个测试客户（如果不存在）
 * 2. 创建50个测试产品
 * 3. 将这50个产品关联到测试客户
 * 
 * 使用方法：
 *   cd fenghua-backend
 *   API_BASE_URL=http://localhost:3001 API_TOKEN=your_token npx ts-node ../scripts/create-50-products-test-scenario.ts
 * 
 * 或者先登录获取 token：
 *   1. 在浏览器中登录系统
 *   2. 打开 DevTools > Application > Local Storage
 *   3. 找到 fenghua_auth_token，复制值
 *   4. 运行：API_BASE_URL=http://localhost:3001 API_TOKEN=your_token npx ts-node ../scripts/create-50-products-test-scenario.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const API_TOKEN = process.env.API_TOKEN || '';
const LOGIN_EMAIL = process.env.LOGIN_EMAIL || '';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || '';

/**
 * 通过登录获取 token
 */
async function getTokenFromLogin(): Promise<string> {
  if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
    throw new Error('需要提供 LOGIN_EMAIL 和 LOGIN_PASSWORD 来登录');
  }

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
  if (!data.token) {
    throw new Error('登录响应中未找到 token');
  }

  return data.token;
}

// Token 初始化将在 main 函数中进行

// 产品类别列表（用于生成测试产品）
const PRODUCT_CATEGORIES = [
  '电子产品',
  '机械设备',
  '化工产品',
  '纺织品',
  '食品饮料',
  '建筑材料',
  '汽车配件',
  '医疗器械',
  '办公用品',
  '家居用品',
];

// 产品名称模板
const PRODUCT_NAME_TEMPLATES = [
  '高级{category}',
  '专业{category}',
  '优质{category}',
  '标准{category}',
  '经济型{category}',
];

/**
 * 生成随机 HS 编码
 */
function generateHsCode(index: number): string {
  // 生成6-10位数字的HS编码
  const base = 100000 + index;
  return base.toString().padStart(6, '0');
}

/**
 * 生成测试产品数据
 */
function generateTestProducts(count: number): Array<{
  name: string;
  hsCode: string;
  category: string;
  description?: string;
}> {
  const products: Array<{
    name: string;
    hsCode: string;
    category: string;
    description?: string;
  }> = [];

  for (let i = 0; i < count; i++) {
    const category = PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length];
    const template = PRODUCT_NAME_TEMPLATES[i % PRODUCT_NAME_TEMPLATES.length];
    const name = template.replace('{category}', category) + ` ${i + 1}号`;
    const hsCode = generateHsCode(i + 1);
    const description = `这是第 ${i + 1} 个测试产品，用于测试产品选择组件的布局效果。`;

    products.push({
      name,
      hsCode,
      category,
      description,
    });
  }

  return products;
}

// apiRequest 函数将在 main 函数中定义，以便使用动态的 TOKEN

/**
 * 获取所有产品类别
 */
async function getProductCategories(apiRequest: <T>(endpoint: string, options?: RequestInit) => Promise<T>): Promise<string[]> {
  try {
    const response = await apiRequest<Array<{ name: string }>>('/product-categories');
    return response.map(cat => cat.name);
  } catch (error) {
    console.warn('⚠️  获取产品类别失败，将使用默认类别');
    return PRODUCT_CATEGORIES;
  }
}

/**
 * 创建产品
 */
async function createProduct(
  apiRequest: <T>(endpoint: string, options?: RequestInit) => Promise<T>,
  product: {
    name: string;
    hsCode: string;
    category: string;
    description?: string;
  }
): Promise<{ id: string; name: string }> {
  return apiRequest<{ id: string; name: string }>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

/**
 * 获取或创建测试客户
 */
async function getOrCreateTestCustomer(
  apiRequest: <T>(endpoint: string, options?: RequestInit) => Promise<T>
): Promise<{ id: string; name: string }> {
  const testCustomerName = '测试客户-50产品场景';
  const testCustomerCode = 'TEST-50PROD';

  try {
    // 尝试查找现有客户（使用搜索参数）
    const response = await apiRequest<{
      customers: Array<{ id: string; name: string; customerCode: string }>;
      total: number;
    }>(`/customers?search=${encodeURIComponent(testCustomerName)}&limit=100`);

    const existingCustomer = response.customers?.find(
      c => c.name === testCustomerName || c.customerCode === testCustomerCode
    );

    if (existingCustomer) {
      console.log(`✅ 找到现有测试客户: ${existingCustomer.name} (${existingCustomer.id})`);
      return existingCustomer;
    }
  } catch (error) {
    console.warn('⚠️  查找现有客户失败，将创建新客户:', error instanceof Error ? error.message : error);
  }

  // 创建新客户
  try {
    const newCustomer = await apiRequest<{ id: string; name: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: testCustomerName,
        customerCode: testCustomerCode,
        customerType: 'BUYER',
        contactEmail: 'test-50prod@example.com',
        contactPhone: '+86-138-0000-0000',
        address: '测试地址',
        country: '中国',
      }),
    });
    console.log(`✅ 创建测试客户: ${newCustomer.name} (${newCustomer.id})`);
    return newCustomer;
  } catch (error) {
    console.error('❌ 创建测试客户失败:', error);
    throw error;
  }
}

/**
 * 关联产品到客户
 */
async function associateProductToCustomer(
  apiRequest: <T>(endpoint: string, options?: RequestInit) => Promise<T>,
  customerId: string,
  productId: string,
  associationType: 'POTENTIAL_SUPPLIER' | 'POTENTIAL_BUYER' = 'POTENTIAL_BUYER'
): Promise<void> {
  await apiRequest(`/customers/${customerId}/associations`, {
    method: 'POST',
    body: JSON.stringify({
      productId,
      associationType,
    }),
  });
}

/**
 * 初始化 token
 */
async function initializeToken(): Promise<string> {
  // 如果已有 token，直接返回
  if (API_TOKEN) {
    return API_TOKEN;
  }

  // 尝试通过登录获取 token
  if (LOGIN_EMAIL && LOGIN_PASSWORD) {
    console.log('🔐 尝试通过登录获取 token...');
    try {
      const token = await getTokenFromLogin();
      console.log('✅ 登录成功，已获取 token\n');
      return token;
    } catch (error) {
      console.error('❌ 登录失败:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // 没有 token 也没有登录凭据
  throw new Error('需要提供 API_TOKEN 或 LOGIN_EMAIL/LOGIN_PASSWORD');
}

/**
 * 主函数
 */
async function main() {
  // 初始化 token
  let TOKEN: string;
  try {
    TOKEN = await initializeToken();
  } catch (error) {
    console.error('❌ 无法获取 token:', error instanceof Error ? error.message : error);
    console.error('');
    console.error('请使用以下方法之一：');
    console.error('');
    console.error('方法 1 - 使用已有 token：');
    console.error('  1. 在浏览器中登录系统');
    console.error('  2. 打开 DevTools > Application > Local Storage');
    console.error('  3. 找到 fenghua_auth_token，复制值');
    console.error('  4. 运行：API_BASE_URL=http://localhost:3001/api API_TOKEN=your_token npx ts-node ../scripts/create-50-products-test-scenario.ts');
    console.error('');
    console.error('方法 2 - 通过登录获取 token：');
    console.error('  运行：API_BASE_URL=http://localhost:3001/api LOGIN_EMAIL=your@email.com LOGIN_PASSWORD=yourpassword npx ts-node ../scripts/create-50-products-test-scenario.ts');
    process.exit(1);
  }

  // 更新 apiRequest 函数以使用 TOKEN
  const apiRequestWithToken = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return response.json() as Promise<T>;
  };

  console.log('🚀 开始创建50个产品的测试场景...\n');

  try {
    // 1. 获取产品类别
    console.log('📋 步骤 1: 获取产品类别...');
    const categories = await getProductCategories(apiRequestWithToken);
    console.log(`✅ 获取到 ${categories.length} 个产品类别\n`);

    // 2. 获取或创建测试客户
    console.log('👤 步骤 2: 获取或创建测试客户...');
    const customer = await getOrCreateTestCustomer(apiRequestWithToken);
    console.log(`✅ 测试客户: ${customer.name} (${customer.id})\n`);

    // 3. 生成测试产品数据
    console.log('📦 步骤 3: 生成50个测试产品数据...');
    const products = generateTestProducts(50);
    console.log(`✅ 生成了 ${products.length} 个测试产品数据\n`);

    // 4. 创建产品
    console.log('📦 步骤 4: 创建产品（这可能需要一些时间）...');
    const createdProducts: Array<{ id: string; name: string }> = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        const created = await createProduct(apiRequestWithToken, product);
        createdProducts.push(created);
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`   已创建 ${i + 1}/${products.length} 个产品...`);
        }
      } catch (error) {
        failCount++;
        console.error(`   ❌ 创建产品失败: ${product.name}`, error instanceof Error ? error.message : error);
      }
      // 添加小延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`✅ 产品创建完成: 成功 ${successCount} 个，失败 ${failCount} 个\n`);

    if (createdProducts.length === 0) {
      console.error('❌ 没有成功创建任何产品，无法继续');
      process.exit(1);
    }

    // 5. 关联产品到客户
    console.log('🔗 步骤 5: 关联产品到测试客户...');
    let associationSuccessCount = 0;
    let associationFailCount = 0;

    for (let i = 0; i < createdProducts.length; i++) {
      const product = createdProducts[i];
      try {
        await associateProductToCustomer(apiRequestWithToken, customer.id, product.id, 'POTENTIAL_BUYER');
        associationSuccessCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`   已关联 ${i + 1}/${createdProducts.length} 个产品...`);
        }
      } catch (error) {
        associationFailCount++;
        console.error(`   ❌ 关联产品失败: ${product.name}`, error instanceof Error ? error.message : error);
      }
      // 添加小延迟
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`✅ 产品关联完成: 成功 ${associationSuccessCount} 个，失败 ${associationFailCount} 个\n`);

    // 6. 总结
    console.log('🎉 测试场景创建完成！\n');
    console.log('📊 总结:');
    console.log(`   - 测试客户: ${customer.name} (${customer.id})`);
    console.log(`   - 创建产品: ${successCount} 个`);
    console.log(`   - 关联产品: ${associationSuccessCount} 个`);
    console.log('');
    console.log('💡 使用方法:');
    console.log(`   1. 打开客户管理页面`);
    console.log(`   2. 搜索并选择客户: "${customer.name}"`);
    console.log(`   3. 在客户详情页的联系人部分，点击"显示联系人"`);
    console.log(`   4. 点击任意联系人的联系方式，打开"准备互动"页面`);
    console.log(`   5. 在"产品"选择区域，您将看到 ${associationSuccessCount} 个产品`);
    console.log(`   6. 测试搜索功能和滚动容器的效果`);
    console.log('');

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
});
