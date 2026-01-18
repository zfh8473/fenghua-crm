-- Script: Seed Dashboard Test Data
-- Description: Creates comprehensive test data for dashboard and analysis features
-- Date: 2026-01-14
-- Note: Preserves English real data (CMOC, CBMM, Ferro Niobium, Niobium, Phosphate Fertilizers)

BEGIN;

-- Step 1: Delete test data (preserving English real data)
-- Delete test interactions
DELETE FROM interaction_comments WHERE interaction_id IN (
  SELECT id FROM product_customer_interactions 
  WHERE deleted_at IS NULL
);

DELETE FROM product_customer_interactions 
WHERE deleted_at IS NULL 
  AND customer_id NOT IN (
    SELECT id FROM companies 
    WHERE name IN (
      'CMOC BRASIL MINERACAO INDUSTRIA AND PARTICIPACOES LTDA',
      'COMPANHIA BRASILEIRA DE METALURGIA AND MINERACAO CBMM'
    )
  )
  AND product_id NOT IN (
    SELECT id FROM products 
    WHERE name IN (
      'Ferro Niobium',
      'Niobium (Nióbio)',
      'Phosphate Fertilizers (Fosfatos)'
    )
  );

-- Delete test product-customer associations
DELETE FROM product_customer_associations 
WHERE customer_id NOT IN (
  SELECT id FROM companies 
  WHERE name IN (
    'CMOC BRASIL MINERACAO INDUSTRIA AND PARTICIPACOES LTDA',
    'COMPANHIA BRASILEIRA DE METALURGIA AND MINERACAO CBMM'
  )
)
AND product_id NOT IN (
  SELECT id FROM products 
  WHERE name IN (
    'Ferro Niobium',
    'Niobium (Nióbio)',
    'Phosphate Fertilizers (Fosfatos)'
  )
);

-- Delete test products (preserving English real products)
DELETE FROM products 
WHERE deleted_at IS NULL 
  AND name NOT IN (
    'Ferro Niobium',
    'Niobium (Nióbio)',
    'Phosphate Fertilizers (Fosfatos)'
  );

-- Delete test customers (preserving English real customers)
DELETE FROM companies 
WHERE deleted_at IS NULL 
  AND name NOT IN (
    'CMOC BRASIL MINERACAO INDUSTRIA AND PARTICIPACOES LTDA',
    'COMPANHIA BRASILEIRA DE METALURGIA AND MINERACAO CBMM'
  );

-- Step 2: Create diverse test products
INSERT INTO products (id, name, hs_code, description, category, status, specifications, created_at, updated_at)
VALUES
  -- 金属材料类
  (gen_random_uuid(), '高纯铁粉', '72051000', '用于冶金和化工行业的高纯度铁粉', '金属材料', 'active', '{"purity": "99.5%", "particle_size": "200目"}', NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days'),
  (gen_random_uuid(), '不锈钢板材', '72191200', '304不锈钢冷轧板材', '金属材料', 'active', '{"grade": "304", "thickness": "2mm", "width": "1000mm"}', NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days'),
  (gen_random_uuid(), '铜线材', '74081100', '电工用铜线材', '金属材料', 'active', '{"diameter": "2.5mm", "conductivity": "58MS/m"}', NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'),
  
  -- 化工产品类
  (gen_random_uuid(), '工业级硫酸', '28070000', '98%浓度工业级硫酸', '化工产品', 'active', '{"concentration": "98%", "grade": "工业级"}', NOW() - INTERVAL '200 days', NOW() - INTERVAL '200 days'),
  (gen_random_uuid(), '聚丙烯颗粒', '39021000', '注塑级聚丙烯', '化工产品', 'active', '{"melt_index": "20g/10min", "density": "0.91g/cm³"}', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
  (gen_random_uuid(), '碳酸钙粉', '28365000', '重质碳酸钙，用于塑料填充', '化工产品', 'active', '{"purity": "98%", "mesh": "325目"}', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
  
  -- 机械设备类
  (gen_random_uuid(), '注塑机', '84771010', '200吨注塑成型机', '机械设备', 'active', '{"tonnage": "200T", "injection_volume": "500cm³"}', NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days'),
  (gen_random_uuid(), 'CNC加工中心', '84596100', '三轴CNC立式加工中心', '机械设备', 'active', '{"spindle_power": "15kW", "worktable_size": "800x500mm"}', NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'),
  
  -- 电子元器件类
  (gen_random_uuid(), 'LED灯珠', '85414000', '2835封装白光LED', '电子元器件', 'active', '{"power": "0.5W", "color_temp": "6500K", "luminous_flux": "50lm"}', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days'),
  (gen_random_uuid(), 'PCB电路板', '85340090', '双面FR4电路板', '电子元器件', 'active', '{"thickness": "1.6mm", "layers": 2}', NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days');

-- Step 3: Create diverse test customers
-- Insert buyers (采购商)
INSERT INTO companies (id, name, domain_name, address, city, state, country, postal_code, industry, employees, website, phone, email, customer_type, created_at, updated_at)
VALUES
    (gen_random_uuid(), '深圳电子科技', 'sz-electronics.com', '深圳市南山区科技园', '深圳', '广东', '中国', '518000', '电子制造', 500, 'https://sz-electronics.com', '+86-755-12345678', 'contact@sz-electronics.com', 'BUYER', NOW() - INTERVAL '200 days', NOW() - INTERVAL '200 days'),
    (gen_random_uuid(), '上海汽车零部件', 'sh-auto.com', '上海市嘉定区汽车城', '上海', '上海', '中国', '201800', '汽车制造', 1200, 'https://sh-auto.com', '+86-21-87654321', 'info@sh-auto.com', 'BUYER', NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days'),
    (gen_random_uuid(), '北京建筑材料', 'bj-building.com', '北京市朝阳区建材市场', '北京', '北京', '中国', '100000', '建筑材料', 300, 'https://bj-building.com', '+86-10-12345678', 'sales@bj-building.com', 'BUYER', NOW() - INTERVAL '160 days', NOW() - INTERVAL '160 days'),
    (gen_random_uuid(), '广州化工贸易', 'gz-chemical.com', '广州市天河区化工大厦', '广州', '广东', '中国', '510000', '化工贸易', 150, 'https://gz-chemical.com', '+86-20-87654321', 'contact@gz-chemical.com', 'BUYER', NOW() - INTERVAL '140 days', NOW() - INTERVAL '140 days'),
    (gen_random_uuid(), '杭州机械设备', 'hz-machinery.com', '杭州市余杭区工业园', '杭州', '浙江', '中国', '310000', '机械设备', 800, 'https://hz-machinery.com', '+86-571-12345678', 'info@hz-machinery.com', 'BUYER', NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), '成都电子制造', 'cd-electronics.com', '成都市高新区科技园', '成都', '四川', '中国', '610000', '电子制造', 600, 'https://cd-electronics.com', '+86-28-87654321', 'sales@cd-electronics.com', 'BUYER', NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days'),
    (gen_random_uuid(), '苏州精密制造', 'sz-precision.com', '苏州市工业园区', '苏州', '江苏', '中国', '215000', '精密制造', 400, 'https://sz-precision.com', '+86-512-12345678', 'contact@sz-precision.com', 'BUYER', NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'),
    (gen_random_uuid(), '武汉钢铁贸易', 'wh-steel.com', '武汉市青山区钢铁城', '武汉', '湖北', '中国', '430000', '钢铁贸易', 250, 'https://wh-steel.com', '+86-27-87654321', 'info@wh-steel.com', 'BUYER', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    
    -- Insert suppliers (供应商)
    (gen_random_uuid(), '唐山钢铁集团', 'ts-steel.com', '唐山市路北区钢铁工业区', '唐山', '河北', '中国', '063000', '钢铁生产', 5000, 'https://ts-steel.com', '+86-315-12345678', 'sales@ts-steel.com', 'SUPPLIER', NOW() - INTERVAL '190 days', NOW() - INTERVAL '190 days'),
    (gen_random_uuid(), '山东化工集团', 'sd-chemical.com', '济南市历下区化工园区', '济南', '山东', '中国', '250000', '化工生产', 3000, 'https://sd-chemical.com', '+86-531-87654321', 'contact@sd-chemical.com', 'SUPPLIER', NOW() - INTERVAL '170 days', NOW() - INTERVAL '170 days'),
    (gen_random_uuid(), '江苏电子元件', 'js-components.com', '南京市江宁区电子产业园', '南京', '江苏', '中国', '211000', '电子元件', 2000, 'https://js-components.com', '+86-25-12345678', 'info@js-components.com', 'SUPPLIER', NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days'),
    (gen_random_uuid(), '浙江机械制造', 'zj-machinery.com', '杭州市萧山区机械工业园', '杭州', '浙江', '中国', '311200', '机械制造', 1800, 'https://zj-machinery.com', '+86-571-87654321', 'sales@zj-machinery.com', 'SUPPLIER', NOW() - INTERVAL '130 days', NOW() - INTERVAL '130 days'),
    (gen_random_uuid(), '广东塑料制品', 'gd-plastic.com', '佛山市南海区塑料工业区', '佛山', '广东', '中国', '528000', '塑料制品', 1200, 'https://gd-plastic.com', '+86-757-12345678', 'contact@gd-plastic.com', 'SUPPLIER', NOW() - INTERVAL '110 days', NOW() - INTERVAL '110 days'),
    (gen_random_uuid(), '福建纺织材料', 'fj-textile.com', '泉州市丰泽区纺织工业园', '泉州', '福建', '中国', '362000', '纺织材料', 1500, 'https://fj-textile.com', '+86-595-87654321', 'info@fj-textile.com', 'SUPPLIER', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), '湖南有色金属', 'hn-metal.com', '长沙市岳麓区有色金属园区', '长沙', '湖南', '中国', '410000', '有色金属', 2200, 'https://hn-metal.com', '+86-731-12345678', 'sales@hn-metal.com', 'SUPPLIER', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days'),
    (gen_random_uuid(), '河南建材生产', 'hn-building.com', '郑州市金水区建材工业园', '郑州', '河南', '中国', '450000', '建材生产', 1000, 'https://hn-building.com', '+86-371-87654321', 'contact@hn-building.com', 'SUPPLIER', NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days');

-- Step 4: Create product-customer associations
DO $$
DECLARE
  product_record RECORD;
  customer_record RECORD;
  association_count INTEGER := 0;
BEGIN
  -- Create associations between products and customers
  -- Buyers (采购商) - associate with supplier products
  FOR product_record IN 
    SELECT id, name, category FROM products 
    WHERE deleted_at IS NULL 
    AND name NOT IN ('Ferro Niobium', 'Niobium (Nióbio)', 'Phosphate Fertilizers (Fosfatos)')
    ORDER BY created_at
  LOOP
    FOR customer_record IN 
      SELECT id, name, customer_type FROM companies 
      WHERE deleted_at IS NULL 
      AND customer_type = 'BUYER'
      AND name NOT IN ('CMOC BRASIL MINERACAO INDUSTRIA AND PARTICIPACOES LTDA', 'COMPANHIA BRASILEIRA DE METALURGIA AND MINERACAO CBMM')
      ORDER BY RANDOM()
      LIMIT 3
    LOOP
      INSERT INTO product_customer_associations (id, product_id, customer_id, association_type, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        product_record.id,
        customer_record.id,
        CASE WHEN customer_record.customer_type = 'BUYER' THEN 'POTENTIAL_SUPPLIER' ELSE 'POTENTIAL_BUYER' END,
        NOW() - INTERVAL '90 days',
        NOW() - INTERVAL '90 days'
      )
      ON CONFLICT DO NOTHING;
      association_count := association_count + 1;
    END LOOP;
  END LOOP;

  -- Suppliers (供应商) - associate with buyer products
  FOR product_record IN 
    SELECT id, name, category FROM products 
    WHERE deleted_at IS NULL 
    AND name NOT IN ('Ferro Niobium', 'Niobium (Nióbio)', 'Phosphate Fertilizers (Fosfatos)')
    ORDER BY created_at
  LOOP
    FOR customer_record IN 
      SELECT id, name, customer_type FROM companies 
      WHERE deleted_at IS NULL 
      AND customer_type = 'SUPPLIER'
      AND name NOT IN ('CMOC BRASIL MINERACAO INDUSTRIA AND PARTICIPACOES LTDA', 'COMPANHIA BRASILEIRA DE METALURGIA AND MINERACAO CBMM')
      ORDER BY RANDOM()
      LIMIT 2
    LOOP
      INSERT INTO product_customer_associations (id, product_id, customer_id, association_type, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        product_record.id,
        customer_record.id,
        CASE WHEN customer_record.customer_type = 'BUYER' THEN 'POTENTIAL_SUPPLIER' ELSE 'POTENTIAL_BUYER' END,
        NOW() - INTERVAL '90 days',
        NOW() - INTERVAL '90 days'
      )
      ON CONFLICT DO NOTHING;
      association_count := association_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created % product-customer associations', association_count;
END $$;

-- Step 5: Create diverse interactions across different time periods
DO $$
DECLARE
  product_record RECORD;
  customer_record RECORD;
  interaction_types TEXT[] := ARRAY[
    'initial_contact', 'product_inquiry', 'quotation', 'quotation_accepted', 
    'quotation_rejected', 'order_signed', 'order_completed',
    'product_inquiry_supplier', 'quotation_received', 'specification_confirmed',
    'production_progress', 'pre_shipment_inspection', 'shipped'
  ];
  statuses TEXT[] := ARRAY['in_progress', 'completed', 'cancelled', 'needs_follow_up'];
  interaction_type TEXT;
  interaction_status TEXT;
  interaction_date TIMESTAMP WITH TIME ZONE;
  interaction_count INTEGER := 0;
  month_offset INTEGER;
  day_offset INTEGER;
BEGIN
  -- Create interactions for the past 12 months
  FOR month_offset IN 0..11 LOOP
    FOR day_offset IN 0..29 LOOP
      -- Get random product and customer
      SELECT id INTO product_record FROM products 
      WHERE deleted_at IS NULL 
      AND name NOT IN ('Ferro Niobium', 'Niobium (Nióbio)', 'Phosphate Fertilizers (Fosfatos)')
      ORDER BY RANDOM() LIMIT 1;
      
      SELECT id, customer_type INTO customer_record FROM companies 
      WHERE deleted_at IS NULL 
      AND name NOT IN ('CMOC BRASIL MINERACAO INDUSTRIA AND PARTICIPACOES LTDA', 'COMPANHIA BRASILEIRA DE METALURGIA AND MINERACAO CBMM')
      ORDER BY RANDOM() LIMIT 1;
      
      IF product_record.id IS NOT NULL AND customer_record.id IS NOT NULL THEN
        -- Set interaction date (past months, random day)
        interaction_date := NOW() - (month_offset || ' months')::INTERVAL - (day_offset || ' days')::INTERVAL;
        
        -- Select interaction type based on customer type
        IF customer_record.customer_type = 'BUYER' THEN
          interaction_type := interaction_types[1 + (RANDOM() * 6)::INTEGER]; -- Buyer types (1-7)
        ELSE
          interaction_type := interaction_types[8 + (RANDOM() * 5)::INTEGER]; -- Supplier types (8-12)
        END IF;
        
        -- Select random status
        interaction_status := statuses[1 + (RANDOM() * 4)::INTEGER];
        
        -- Create interaction (only create some, not all combinations)
        IF RANDOM() < 0.3 THEN -- 30% chance to create interaction
          INSERT INTO product_customer_interactions (
            id, customer_id, product_id, interaction_type, interaction_date,
            description, status, created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            customer_record.id,
            product_record.id,
            interaction_type,
            interaction_date,
            '互动记录：' || interaction_type || ' - ' || TO_CHAR(interaction_date, 'YYYY-MM-DD'),
            interaction_status,
            interaction_date,
            interaction_date
          );
          interaction_count := interaction_count + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created % interactions', interaction_count;
END $$;

COMMIT;

-- Summary
SELECT 
  'Products' as type, COUNT(*) as count 
FROM products WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Customers (Buyers)' as type, COUNT(*) as count 
FROM companies WHERE deleted_at IS NULL AND customer_type = 'BUYER'
UNION ALL
SELECT 
  'Customers (Suppliers)' as type, COUNT(*) as count 
FROM companies WHERE deleted_at IS NULL AND customer_type = 'SUPPLIER'
UNION ALL
SELECT 
  'Associations' as type, COUNT(*) as count 
FROM product_customer_associations
UNION ALL
SELECT 
  'Interactions' as type, COUNT(*) as count 
FROM product_customer_interactions WHERE deleted_at IS NULL;
