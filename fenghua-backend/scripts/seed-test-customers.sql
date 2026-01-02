-- Script: Seed Test Customer Data
-- Description: Creates 20 test customer records (10 BUYER, 10 SUPPLIER) for testing
-- Date: 2025-01-03
-- Usage: Run this script against your database to populate test data

-- Note: This script assumes you have at least one user in the users table
-- If you need to use a specific user ID, replace (SELECT id FROM users LIMIT 1) with the actual user ID

-- Insert 10 BUYER (采购商) customers
INSERT INTO companies (
  name, customer_code, customer_type, domain_name, address, city, state, country, 
  postal_code, industry, employees, website, phone, notes, created_by
) VALUES
-- Large enterprise buyers
('上海国际贸易集团', 'BUYER001', 'BUYER', 'shanghaitrade.com', '上海市浦东新区世纪大道1000号', '上海', '上海市', '中国', '200120', '国际贸易', 5000, 'https://www.shanghaitrade.com', '+86-21-1234-5678', '大型国际贸易公司，主要采购电子产品', (SELECT id FROM users LIMIT 1)),
('北京采购中心', 'BUYER002', 'BUYER', 'beijingprocure.com', '北京市朝阳区建国门外大街1号', '北京', '北京市', '中国', '100020', '采购服务', 800, 'https://www.beijingprocure.com', '+86-10-8765-4321', '专业采购服务公司', (SELECT id FROM users LIMIT 1)),
('深圳电商采购平台', 'BUYER003', 'BUYER', 'szecplatform.com', '深圳市南山区科技园南区', '深圳', '广东省', '中国', '518057', '电子商务', 2000, 'https://www.szecplatform.com', '+86-755-2345-6789', '大型电商平台，采购量巨大', (SELECT id FROM users LIMIT 1)),
('广州零售连锁', 'BUYER004', 'BUYER', 'gzretail.com', '广州市天河区天河路123号', '广州', '广东省', '中国', '510620', '零售', 3000, 'https://www.gzretail.com', '+86-20-3456-7890', '连锁零售企业，覆盖华南地区', (SELECT id FROM users LIMIT 1)),
('杭州制造企业', 'BUYER005', 'BUYER', 'hangzhoufactory.com', '杭州市西湖区文三路456号', '杭州', '浙江省', '中国', '310012', '制造业', 1500, 'https://www.hangzhoufactory.com', '+86-571-4567-8901', '制造企业，需要大量原材料', (SELECT id FROM users LIMIT 1)),

-- Medium buyers
('成都贸易公司', 'BUYER006', 'BUYER', 'chengdutrade.com', '成都市锦江区春熙路789号', '成都', '四川省', '中国', '610021', '贸易', 200, 'https://www.chengdutrade.com', '+86-28-5678-9012', '西部地区贸易公司', (SELECT id FROM users LIMIT 1)),
('武汉采购代理', 'BUYER007', 'BUYER', 'wuhanagent.com', '武汉市江汉区解放大道321号', '武汉', '湖北省', '中国', '430022', '采购代理', 150, 'https://www.wuhanagent.com', '+86-27-6789-0123', '专业采购代理服务', (SELECT id FROM users LIMIT 1)),
('西安批发市场', 'BUYER008', 'BUYER', 'xianwholesale.com', '西安市雁塔区小寨东路654号', '西安', '陕西省', '中国', '710061', '批发', 300, 'https://www.xianwholesale.com', '+86-29-7890-1234', '西北地区批发商', (SELECT id FROM users LIMIT 1)),
('南京零售企业', 'BUYER009', 'BUYER', 'nanjingretail.com', '南京市鼓楼区中山路987号', '南京', '江苏省', '中国', '210008', '零售', 500, 'https://www.nanjingretail.com', '+86-25-8901-2345', '区域零售企业', (SELECT id FROM users LIMIT 1)),
('天津进出口公司', 'BUYER010', 'BUYER', 'tianjinimport.com', '天津市和平区南京路147号', '天津', '天津市', '中国', '300041', '进出口贸易', 400, 'https://www.tianjinimport.com', '+86-22-9012-3456', '专业进出口贸易公司', (SELECT id FROM users LIMIT 1)),

-- Insert 10 SUPPLIER (供应商) customers
('东莞电子制造', 'SUPPLIER001', 'SUPPLIER', 'dongguanelc.com', '东莞市长安镇乌沙工业区', '东莞', '广东省', '中国', '523860', '电子制造', 3000, 'https://www.dongguanelc.com', '+86-769-1234-5678', '专业电子制造供应商', (SELECT id FROM users LIMIT 1)),
('苏州精密机械', 'SUPPLIER002', 'SUPPLIER', 'suzhouprecision.com', '苏州市工业园区星海街258号', '苏州', '江苏省', '中国', '215021', '精密机械', 1200, 'https://www.suzhouprecision.com', '+86-512-2345-6789', '精密机械零部件供应商', (SELECT id FROM users LIMIT 1)),
('佛山陶瓷工厂', 'SUPPLIER003', 'SUPPLIER', 'foshanceramic.com', '佛山市禅城区南庄镇', '佛山', '广东省', '中国', '528061', '陶瓷制造', 2000, 'https://www.foshanceramic.com', '+86-757-3456-7890', '陶瓷制品专业供应商', (SELECT id FROM users LIMIT 1)),
('宁波纺织企业', 'SUPPLIER004', 'SUPPLIER', 'ningbotextile.com', '宁波市鄞州区天童北路369号', '宁波', '浙江省', '中国', '315192', '纺织', 1500, 'https://www.ningbotextile.com', '+86-574-4567-8901', '纺织品供应商', (SELECT id FROM users LIMIT 1)),
('青岛食品加工', 'SUPPLIER005', 'SUPPLIER', 'qingdaofood.com', '青岛市市南区香港中路741号', '青岛', '山东省', '中国', '266071', '食品加工', 800, 'https://www.qingdaofood.com', '+86-532-5678-9012', '食品加工供应商', (SELECT id FROM users LIMIT 1)),

-- Medium suppliers
('中山灯饰制造', 'SUPPLIER006', 'SUPPLIER', 'zhongshanlighting.com', '中山市古镇镇海洲工业区', '中山', '广东省', '中国', '528421', '灯饰制造', 600, 'https://www.zhongshanlighting.com', '+86-760-6789-0123', '专业灯饰制造供应商', (SELECT id FROM users LIMIT 1)),
('温州鞋业工厂', 'SUPPLIER007', 'SUPPLIER', 'wenzhoushoes.com', '温州市鹿城区鞋都大道852号', '温州', '浙江省', '中国', '325000', '鞋业制造', 1000, 'https://www.wenzhoushoes.com', '+86-577-7890-1234', '鞋类产品供应商', (SELECT id FROM users LIMIT 1)),
('义乌小商品', 'SUPPLIER008', 'SUPPLIER', 'yiwucommodity.com', '义乌市稠城街道工人北路963号', '义乌', '浙江省', '中国', '322000', '小商品', 500, 'https://www.yiwucommodity.com', '+86-579-8901-2345', '小商品批发供应商', (SELECT id FROM users LIMIT 1)),
('厦门工艺品', 'SUPPLIER009', 'SUPPLIER', 'xiamenart.com', '厦门市思明区湖滨南路159号', '厦门', '福建省', '中国', '361004', '工艺品', 300, 'https://www.xiamenart.com', '+86-592-9012-3456', '工艺品制造供应商', (SELECT id FROM users LIMIT 1)),
('大连化工原料', 'SUPPLIER010', 'SUPPLIER', 'dalianchemical.com', '大连市甘井子区华北路357号', '大连', '辽宁省', '中国', '116033', '化工', 700, 'https://www.dalianchemical.com', '+86-411-0123-4567', '化工原料供应商', (SELECT id FROM users LIMIT 1));

-- Verify insertion
SELECT 
  customer_type,
  COUNT(*) as count
FROM companies
WHERE customer_code IN (
  'BUYER001', 'BUYER002', 'BUYER003', 'BUYER004', 'BUYER005',
  'BUYER006', 'BUYER007', 'BUYER008', 'BUYER009', 'BUYER010',
  'SUPPLIER001', 'SUPPLIER002', 'SUPPLIER003', 'SUPPLIER004', 'SUPPLIER005',
  'SUPPLIER006', 'SUPPLIER007', 'SUPPLIER008', 'SUPPLIER009', 'SUPPLIER010'
)
GROUP BY customer_type;

