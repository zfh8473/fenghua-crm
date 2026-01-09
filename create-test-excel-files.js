/**
 * Script to create test Excel files for import testing
 * All custom code is proprietary and not open source.
 */

// Try to load xlsx from backend node_modules first
let XLSX;
try {
  XLSX = require('./fenghua-backend/node_modules/xlsx');
} catch (e) {
  try {
    XLSX = require('xlsx');
  } catch (e2) {
    console.error('Error: xlsx module not found. Please install it: npm install xlsx');
    process.exit(1);
  }
}
const path = require('path');
const fs = require('fs');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Customer import test data
const customerData = [
  {
    '客户名称': '测试客户公司A',
    '客户代码': 'BUY001',
    '客户类型': '采购商',
    '域名': 'testcompanya.com',
    '地址': '北京市朝阳区测试路123号',
    '城市': '北京',
    '州/省': '北京市',
    '国家': '中国',
    '邮编': '100000',
    '行业': '制造业',
    '员工数': '150',
    '网站': 'https://www.testcompanya.com',
    '电话': '010-12345678',
    '邮箱': 'contact@testcompanya.com',
    '备注': '测试客户A，用于导入功能验证'
  },
  {
    '客户名称': '测试供应商公司B',
    '客户代码': 'SUP001',
    '客户类型': '供应商',
    '域名': 'testsupplierb.com',
    '地址': '上海市浦东新区测试大道456号',
    '城市': '上海',
    '州/省': '上海市',
    '国家': '中国',
    '邮编': '200000',
    '行业': '贸易',
    '员工数': '80',
    '网站': 'https://www.testsupplierb.com',
    '电话': '021-87654321',
    '邮箱': 'info@testsupplierb.com',
    '备注': '测试供应商B，用于导入功能验证'
  },
  {
    '客户名称': '测试客户公司C',
    '客户代码': 'BUY002',
    '客户类型': '采购商',
    '域名': 'testcompanyc.com',
    '地址': '广州市天河区测试街789号',
    '城市': '广州',
    '州/省': '广东省',
    '国家': '中国',
    '邮编': '510000',
    '行业': '零售',
    '员工数': '200',
    '网站': 'https://www.testcompanyc.com',
    '电话': '020-11223344',
    '邮箱': 'hello@testcompanyc.com',
    '备注': '测试客户C'
  },
  {
    '客户名称': '测试供应商公司D',
    '客户代码': 'SUP002',
    '客户类型': '供应商',
    '域名': 'testsupplierd.com',
    '地址': '深圳市南山区测试路321号',
    '城市': '深圳',
    '州/省': '广东省',
    '国家': '中国',
    '邮编': '518000',
    '行业': '科技',
    '员工数': '300',
    '网站': 'https://www.testsupplierd.com',
    '电话': '0755-99887766',
    '邮箱': 'sales@testsupplierd.com',
    '备注': '测试供应商D'
  },
  {
    '客户名称': '测试客户公司E',
    '客户代码': 'BUY003',
    '客户类型': '采购商',
    '域名': 'testcompanye.com',
    '地址': '杭州市西湖区测试路555号',
    '城市': '杭州',
    '州/省': '浙江省',
    '国家': '中国',
    '邮编': '310000',
    '行业': '电子商务',
    '员工数': '500',
    '网站': 'https://www.testcompanye.com',
    '电话': '0571-55667788',
    '邮箱': 'service@testcompanye.com',
    '备注': '测试客户E'
  }
];

// Product import test data
const productData = [
  {
    '产品名称': '测试产品A - 电子元件',
    'HS编码': '85414000',
    '产品类别': '电子产品',
    '产品描述': '用于测试的电子元件产品A',
    '产品规格': '{"电压":"5V","电流":"2A","尺寸":"10x10x5mm"}',
    '产品图片': 'https://example.com/images/product-a.jpg'
  },
  {
    '产品名称': '测试产品B - 机械零件',
    'HS编码': '84818090',
    '产品类别': '机械零件',
    '产品描述': '用于测试的机械零件产品B',
    '产品规格': '{"材质":"不锈钢","直径":"20mm","长度":"50mm"}',
    '产品图片': 'https://example.com/images/product-b.jpg'
  },
  {
    '产品名称': '测试产品C - 化工原料',
    'HS编码': '29012100',
    '产品类别': '化工产品',
    '产品描述': '用于测试的化工原料产品C',
    '产品规格': '{"纯度":"99%","包装":"25kg/袋","储存条件":"阴凉干燥"}',
    '产品图片': ''
  },
  {
    '产品名称': '测试产品D - 纺织品',
    'HS编码': '52051200',
    '产品类别': '纺织品',
    '产品描述': '用于测试的纺织品产品D',
    '产品规格': '{"材质":"100%棉","克重":"200g/m²","宽度":"150cm"}',
    '产品图片': 'https://example.com/images/product-d.jpg'
  },
  {
    '产品名称': '测试产品E - 食品',
    'HS编码': '19059090',
    '产品类别': '食品',
    '产品描述': '用于测试的食品产品E',
    '产品规格': '{"净重":"500g","保质期":"12个月","储存温度":"常温"}',
    '产品图片': ''
  }
];

// Create customer import Excel file
const customerWorkbook = XLSX.utils.book_new();
const customerWorksheet = XLSX.utils.json_to_sheet(customerData);
XLSX.utils.book_append_sheet(customerWorkbook, customerWorksheet, '客户数据');
const customerFilePath = path.join(outputDir, 'test-customers-import.xlsx');
XLSX.writeFile(customerWorkbook, customerFilePath);
console.log(`✅ 客户导入测试文件已创建: ${customerFilePath}`);

// Create product import Excel file
const productWorkbook = XLSX.utils.book_new();
const productWorksheet = XLSX.utils.json_to_sheet(productData);
XLSX.utils.book_append_sheet(productWorkbook, productWorksheet, '产品数据');
const productFilePath = path.join(outputDir, 'test-products-import.xlsx');
XLSX.writeFile(productWorkbook, productFilePath);
console.log(`✅ 产品导入测试文件已创建: ${productFilePath}`);

console.log('\n📋 文件说明:');
console.log('1. test-customers-import.xlsx - 客户导入测试文件');
console.log('   - 包含 5 条测试客户数据');
console.log('   - 必填字段：客户名称、客户类型');
console.log('   - 可选字段：客户代码、域名、地址等');
console.log('\n2. test-products-import.xlsx - 产品导入测试文件');
console.log('   - 包含 5 条测试产品数据');
console.log('   - 必填字段：产品名称、HS编码、产品类别');
console.log('   - 可选字段：产品描述、产品规格、产品图片');
console.log('\n💡 使用说明:');
console.log('1. 在导入页面上传对应的 Excel 文件');
console.log('2. 系统会自动识别列名并映射到 CRM 字段');
console.log('3. 确认映射后点击"下一步:验证数据"');
console.log('4. 查看验证结果并确认导入');

