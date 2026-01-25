-- 创建50个产品的测试场景 SQL 脚本
-- 
-- 使用方法：
--   psql $DATABASE_URL -f scripts/create-50-products-test-data.sql
-- 
-- 或者：
--   cd fenghua-backend
--   psql 'postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require' -f ../scripts/create-50-products-test-data.sql

-- 开始事务
BEGIN;

-- 1. 获取一个可用的 created_by（用户ID），用于创建产品
DO $$
DECLARE
    v_created_by UUID;
    v_test_customer_id UUID;
    v_customer_code VARCHAR(50) := 'TEST-50PROD';
    v_customer_name VARCHAR(255) := '测试客户-50产品场景';
    v_product_ids UUID[];
    v_product_id UUID;
    v_hs_code VARCHAR(50);
    v_product_name VARCHAR(255);
    v_category VARCHAR(100);
    v_i INTEGER;
BEGIN
    -- 获取第一个可用的 created_by（从现有产品或客户）
    SELECT created_by INTO v_created_by
    FROM products
    WHERE deleted_at IS NULL
      AND created_by IS NOT NULL
    LIMIT 1;
    
    -- 如果没有找到，尝试从 companies 表获取
    IF v_created_by IS NULL THEN
        SELECT created_by INTO v_created_by
        FROM companies
        WHERE deleted_at IS NULL
          AND created_by IS NOT NULL
        LIMIT 1;
    END IF;
    
    -- 如果还是没有，尝试从 users 表获取第一个用户
    IF v_created_by IS NULL THEN
        SELECT id INTO v_created_by
        FROM users
        WHERE deleted_at IS NULL
        LIMIT 1;
    END IF;
    
    -- 如果还是没有，设置为 NULL（允许系统创建）
    IF v_created_by IS NULL THEN
        RAISE NOTICE '未找到可用的用户ID，将使用 NULL（系统创建）';
    ELSE
        RAISE NOTICE '使用 created_by: %', v_created_by;
    END IF;
    
    -- 2. 获取或创建测试客户
    SELECT id INTO v_test_customer_id
    FROM companies
    WHERE (name = v_customer_name OR customer_code = v_customer_code)
      AND deleted_at IS NULL
    LIMIT 1;
    
    IF v_test_customer_id IS NULL THEN
        -- 创建测试客户
        INSERT INTO companies (
            id,
            name,
            customer_code,
            customer_type,
            email,
            phone,
            address,
            country,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_customer_name,
            v_customer_code,
            'BUYER',
            'test-50prod@example.com',
            '+86-138-0000-0000',
            '测试地址',
            '中国',
            v_created_by,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_test_customer_id;
        
        RAISE NOTICE '创建测试客户: % (ID: %)', v_customer_name, v_test_customer_id;
    ELSE
        RAISE NOTICE '找到现有测试客户: % (ID: %)', v_customer_name, v_test_customer_id;
    END IF;
    
    -- 3. 创建50个测试产品
    v_product_ids := ARRAY[]::UUID[];
    
    FOR v_i IN 1..50 LOOP
        -- 生成产品信息
        v_hs_code := LPAD((100000 + v_i)::TEXT, 6, '0');
        
        -- 产品类别循环使用
        CASE (v_i - 1) % 10
            WHEN 0 THEN v_category := '电子产品';
            WHEN 1 THEN v_category := '机械设备';
            WHEN 2 THEN v_category := '化工产品';
            WHEN 3 THEN v_category := '纺织品';
            WHEN 4 THEN v_category := '食品饮料';
            WHEN 5 THEN v_category := '建筑材料';
            WHEN 6 THEN v_category := '汽车配件';
            WHEN 7 THEN v_category := '医疗器械';
            WHEN 8 THEN v_category := '办公用品';
            WHEN 9 THEN v_category := '家居用品';
        END CASE;
        
        -- 产品名称模板循环使用
        CASE (v_i - 1) % 5
            WHEN 0 THEN v_product_name := '高级' || v_category || ' ' || v_i || '号';
            WHEN 1 THEN v_product_name := '专业' || v_category || ' ' || v_i || '号';
            WHEN 2 THEN v_product_name := '优质' || v_category || ' ' || v_i || '号';
            WHEN 3 THEN v_product_name := '标准' || v_category || ' ' || v_i || '号';
            WHEN 4 THEN v_product_name := '经济型' || v_category || ' ' || v_i || '号';
        END CASE;
        
        -- 检查产品是否已存在（通过 HS 编码和 created_by）
        SELECT id INTO v_product_id
        FROM products
        WHERE hs_code = v_hs_code
          AND (created_by = v_created_by OR (created_by IS NULL AND v_created_by IS NULL))
          AND deleted_at IS NULL
        LIMIT 1;
        
        IF v_product_id IS NULL THEN
            -- 创建新产品
            INSERT INTO products (
                id,
                name,
                hs_code,
                description,
                category,
                status,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_product_name,
                v_hs_code,
                '这是第 ' || v_i || ' 个测试产品，用于测试产品选择组件的布局效果。',
                v_category,
                'active',
                v_created_by,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) RETURNING id INTO v_product_id;
            
            RAISE NOTICE '创建产品 %: % (HS: %)', v_i, v_product_name, v_hs_code;
        ELSE
            RAISE NOTICE '产品已存在: % (HS: %)', v_product_name, v_hs_code;
        END IF;
        
        -- 添加到数组
        v_product_ids := array_append(v_product_ids, v_product_id);
    END LOOP;
    
    RAISE NOTICE '共创建/找到 % 个产品', array_length(v_product_ids, 1);
    
    -- 4. 关联产品到客户
    FOR v_i IN 1..array_length(v_product_ids, 1) LOOP
        v_product_id := v_product_ids[v_i];
        
        -- 检查关联是否已存在
        IF NOT EXISTS (
            SELECT 1
            FROM product_customer_associations
            WHERE product_id = v_product_id
              AND customer_id = v_test_customer_id
              AND deleted_at IS NULL
        ) THEN
            -- 创建关联
            INSERT INTO product_customer_associations (
                id,
                product_id,
                customer_id,
                association_type,
                created_at,
                updated_at,
                deleted_at
            ) VALUES (
                gen_random_uuid(),
                v_product_id,
                v_test_customer_id,
                'POTENTIAL_BUYER',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                NULL
            );
            
            IF v_i % 10 = 0 THEN
                RAISE NOTICE '已关联 %/% 个产品', v_i, array_length(v_product_ids, 1);
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE '完成！测试客户: % (ID: %)', v_customer_name, v_test_customer_id;
    RAISE NOTICE '已关联 % 个产品到测试客户', array_length(v_product_ids, 1);
END $$;

-- 提交事务
COMMIT;

-- 显示结果
SELECT 
    c.name AS customer_name,
    c.customer_code,
    COUNT(DISTINCT pca.product_id) AS associated_products_count
FROM companies c
LEFT JOIN product_customer_associations pca ON pca.customer_id = c.id AND pca.deleted_at IS NULL
WHERE c.customer_code = 'TEST-50PROD'
  AND c.deleted_at IS NULL
GROUP BY c.id, c.name, c.customer_code;
