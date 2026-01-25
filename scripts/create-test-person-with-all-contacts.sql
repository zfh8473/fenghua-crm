-- 为测试客户创建包含所有联系方式的联系人
-- 
-- 使用方法：
--   psql $DATABASE_URL -f scripts/create-test-person-with-all-contacts.sql
-- 
-- 或者：
--   cd fenghua-backend
--   psql 'postgresql://neondb_owner:npg_s8GTNvalyr3B@ep-super-grass-a1gk4r12-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f ../scripts/create-test-person-with-all-contacts.sql

-- 开始事务
BEGIN;

DO $$
DECLARE
    v_test_customer_id UUID;
    v_customer_code VARCHAR(50) := 'TEST-50PROD';
    v_customer_name VARCHAR(255) := '测试客户-50产品场景';
    v_person_id UUID;
    v_created_by UUID;
BEGIN
    -- 1. 查找测试客户
    SELECT id INTO v_test_customer_id
    FROM companies
    WHERE (name = v_customer_name OR customer_code = v_customer_code)
      AND deleted_at IS NULL
    LIMIT 1;
    
    IF v_test_customer_id IS NULL THEN
        RAISE EXCEPTION '未找到测试客户: % (代码: %)', v_customer_name, v_customer_code;
    END IF;
    
    RAISE NOTICE '找到测试客户: % (ID: %)', v_customer_name, v_test_customer_id;
    
    -- 2. 获取一个可用的 created_by（用户ID）
    SELECT created_by INTO v_created_by
    FROM people
    WHERE deleted_at IS NULL
      AND created_by IS NOT NULL
    LIMIT 1;
    
    IF v_created_by IS NULL THEN
        SELECT created_by INTO v_created_by
        FROM companies
        WHERE deleted_at IS NULL
          AND created_by IS NOT NULL
        LIMIT 1;
    END IF;
    
    IF v_created_by IS NULL THEN
        SELECT id INTO v_created_by
        FROM users
        WHERE deleted_at IS NULL
        LIMIT 1;
    END IF;
    
    IF v_created_by IS NULL THEN
        RAISE NOTICE '未找到可用的用户ID，将使用 NULL（系统创建）';
    ELSE
        RAISE NOTICE '使用 created_by: %', v_created_by;
    END IF;
    
    -- 3. 检查联系人是否已存在（通过邮箱）
    SELECT id INTO v_person_id
    FROM people
    WHERE email = 'test-contact-50prod@example.com'
      AND deleted_at IS NULL;
    
    IF v_person_id IS NOT NULL THEN
        RAISE NOTICE '联系人已存在 (ID: %)，将更新所有联系方式', v_person_id;
        
        -- 更新现有联系人，确保包含所有联系方式
        UPDATE people SET
            first_name = '测试',
            last_name = '联系人',
            email = 'test-contact-50prod@example.com',
            phone = '+86-10-8888-8888',
            mobile = '+86-138-0000-0001',
            job_title = '业务经理',
            department = '销售部',
            linkedin_url = 'https://www.linkedin.com/in/test-contact-50prod',
            wechat = 'test_wechat_50prod',
            whatsapp = '+86-138-0000-0001',
            facebook = 'https://www.facebook.com/test.contact.50prod',
            is_important = true,
            notes = '这是测试客户-50产品场景的联系人，包含所有联系方式，用于测试"准备互动"页面的产品选择功能。',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_person_id;
        
        RAISE NOTICE '已更新联系人: 测试 联系人 (ID: %)', v_person_id;
    ELSE
        -- 创建新联系人，包含所有联系方式
        INSERT INTO people (
            id,
            first_name,
            last_name,
            email,
            phone,
            mobile,
            job_title,
            department,
            linkedin_url,
            wechat,
            whatsapp,
            facebook,
            is_important,
            notes,
            company_id,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            '测试',
            '联系人',
            'test-contact-50prod@example.com',
            '+86-10-8888-8888',
            '+86-138-0000-0001',
            '业务经理',
            '销售部',
            'https://www.linkedin.com/in/test-contact-50prod',
            'test_wechat_50prod',
            '+86-138-0000-0001',
            'https://www.facebook.com/test.contact.50prod',
            true,
            '这是测试客户-50产品场景的联系人，包含所有联系方式，用于测试"准备互动"页面的产品选择功能。',
            v_test_customer_id,
            v_created_by,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_person_id;
        
        RAISE NOTICE '已创建联系人: 测试 联系人 (ID: %)', v_person_id;
    END IF;
    
    -- 4. 显示创建的联系人信息
    RAISE NOTICE '';
    RAISE NOTICE '联系人信息：';
    RAISE NOTICE '  姓名: 测试 联系人';
    RAISE NOTICE '  邮箱: test-contact-50prod@example.com';
    RAISE NOTICE '  电话: +86-10-8888-8888';
    RAISE NOTICE '  手机: +86-138-0000-0001';
    RAISE NOTICE '  LinkedIn: https://www.linkedin.com/in/test-contact-50prod';
    RAISE NOTICE '  微信: test_wechat_50prod';
    RAISE NOTICE '  WhatsApp: +86-138-0000-0001';
    RAISE NOTICE '  Facebook: https://www.facebook.com/test.contact.50prod';
    RAISE NOTICE '  重要联系人: 是';
    RAISE NOTICE '';
    RAISE NOTICE '完成！现在可以在客户详情页看到这个联系人，并点击任意联系方式打开"准备互动"页面。';
END $$;

-- 提交事务
COMMIT;

-- 显示结果
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.email,
    p.phone,
    p.mobile,
    p.linkedin_url,
    p.wechat,
    p.whatsapp,
    p.facebook,
    p.is_important,
    c.name AS company_name
FROM people p
JOIN companies c ON c.id = p.company_id
WHERE p.email = 'test-contact-50prod@example.com'
  AND p.deleted_at IS NULL
  AND c.customer_code = 'TEST-50PROD';
