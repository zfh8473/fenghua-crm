-- 为测试客户创建10条联系人数据（用于测试三列响应式布局）
-- 
-- 使用方法：
--   psql $DATABASE_URL -f scripts/create-10-test-contacts.sql
-- 
-- 或者：
--   cd fenghua-backend
--   psql 'postgresql://neondb_owner:npg_s8GTNvalyr3B@ep-super-grass-a1gk4r12-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f ../scripts/create-10-test-contacts.sql

-- 开始事务
BEGIN;

DO $$
DECLARE
    v_test_customer_id UUID;
    v_customer_code VARCHAR(50) := 'TEST-50PROD';
    v_customer_name VARCHAR(255) := '测试客户-50产品场景';
    v_created_by UUID;
    v_person_id UUID;
    v_counter INTEGER := 0;
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
    
    -- 3. 创建10个联系人（逐个插入）
    
    -- 联系人 1: 张经理
    SELECT id INTO v_person_id FROM people WHERE email = 'zhang.manager@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '张', '经理', 'zhang.manager@test.com', '+86-10-8888-0001', '+86-138-0000-0001', '销售经理', '销售部', 'https://www.linkedin.com/in/zhang-manager', 'zhang_manager', '+86-138-0000-0001', 'https://www.facebook.com/zhang.manager', true, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[1/10] 已创建联系人: 张 经理';
    ELSE
        RAISE NOTICE '[1/10] 联系人已存在: 张 经理';
    END IF;
    
    -- 联系人 2: 李总
    SELECT id INTO v_person_id FROM people WHERE email = 'li.director@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '李', '总', 'li.director@test.com', '+86-10-8888-0002', '+86-138-0000-0002', '采购总监', '采购部', 'https://www.linkedin.com/in/li-director', 'li_director', '+86-138-0000-0002', NULL, true, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[2/10] 已创建联系人: 李 总';
    ELSE
        RAISE NOTICE '[2/10] 联系人已存在: 李 总';
    END IF;
    
    -- 联系人 3: 王工
    SELECT id INTO v_person_id FROM people WHERE email = 'wang.engineer@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '王', '工', 'wang.engineer@test.com', '+86-10-8888-0003', '+86-138-0000-0003', '技术工程师', '技术部', NULL, 'wang_engineer', NULL, NULL, false, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[3/10] 已创建联系人: 王 工';
    ELSE
        RAISE NOTICE '[3/10] 联系人已存在: 王 工';
    END IF;
    
    -- 联系人 4: 刘主管
    SELECT id INTO v_person_id FROM people WHERE email = 'liu.supervisor@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '刘', '主管', 'liu.supervisor@test.com', '+86-10-8888-0004', '+86-138-0000-0004', '运营主管', '运营部', 'https://www.linkedin.com/in/liu-supervisor', NULL, '+86-138-0000-0004', 'https://www.facebook.com/liu.supervisor', false, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[4/10] 已创建联系人: 刘 主管';
    ELSE
        RAISE NOTICE '[4/10] 联系人已存在: 刘 主管';
    END IF;
    
    -- 联系人 5: 陈助理
    SELECT id INTO v_person_id FROM people WHERE email = 'chen.assistant@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '陈', '助理', 'chen.assistant@test.com', '+86-10-8888-0005', '+86-138-0000-0005', '行政助理', '行政部', NULL, NULL, NULL, NULL, false, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[5/10] 已创建联系人: 陈 助理';
    ELSE
        RAISE NOTICE '[5/10] 联系人已存在: 陈 助理';
    END IF;
    
    -- 联系人 6: 赵专员
    SELECT id INTO v_person_id FROM people WHERE email = 'zhao.specialist@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '赵', '专员', 'zhao.specialist@test.com', '+86-10-8888-0006', '+86-138-0000-0006', '市场专员', '市场部', 'https://www.linkedin.com/in/zhao-specialist', 'zhao_specialist', '+86-138-0000-0006', NULL, true, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[6/10] 已创建联系人: 赵 专员';
    ELSE
        RAISE NOTICE '[6/10] 联系人已存在: 赵 专员';
    END IF;
    
    -- 联系人 7: 孙经理
    SELECT id INTO v_person_id FROM people WHERE email = 'sun.manager@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '孙', '经理', 'sun.manager@test.com', '+86-10-8888-0007', '+86-138-0000-0007', '财务经理', '财务部', NULL, 'sun_manager', NULL, NULL, false, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[7/10] 已创建联系人: 孙 经理';
    ELSE
        RAISE NOTICE '[7/10] 联系人已存在: 孙 经理';
    END IF;
    
    -- 联系人 8: 周主任
    SELECT id INTO v_person_id FROM people WHERE email = 'zhou.director@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '周', '主任', 'zhou.director@test.com', '+86-10-8888-0008', '+86-138-0000-0008', '人力资源主任', '人力资源部', 'https://www.linkedin.com/in/zhou-director', NULL, '+86-138-0000-0008', 'https://www.facebook.com/zhou.director', true, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[8/10] 已创建联系人: 周 主任';
    ELSE
        RAISE NOTICE '[8/10] 联系人已存在: 周 主任';
    END IF;
    
    -- 联系人 9: 吴部长
    SELECT id INTO v_person_id FROM people WHERE email = 'wu.minister@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '吴', '部长', 'wu.minister@test.com', '+86-10-8888-0009', '+86-138-0000-0009', '质量部长', '质量部', NULL, 'wu_minister', '+86-138-0000-0009', NULL, false, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[9/10] 已创建联系人: 吴 部长';
    ELSE
        RAISE NOTICE '[9/10] 联系人已存在: 吴 部长';
    END IF;
    
    -- 联系人 10: 郑副总
    SELECT id INTO v_person_id FROM people WHERE email = 'zheng.vp@test.com' AND deleted_at IS NULL;
    IF v_person_id IS NULL THEN
        INSERT INTO people (id, first_name, last_name, email, phone, mobile, job_title, department, linkedin_url, wechat, whatsapp, facebook, is_important, company_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '郑', '副总', 'zheng.vp@test.com', '+86-10-8888-0010', '+86-138-0000-0010', '副总经理', '管理层', 'https://www.linkedin.com/in/zheng-vp', 'zheng_vp', '+86-138-0000-0010', 'https://www.facebook.com/zheng.vp', true, v_test_customer_id, v_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        v_counter := v_counter + 1;
        RAISE NOTICE '[10/10] 已创建联系人: 郑 副总';
    ELSE
        RAISE NOTICE '[10/10] 联系人已存在: 郑 副总';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '完成！已为测试客户创建/检查了 % 个联系人。', v_counter;
    RAISE NOTICE '现在可以在"管理客户联系人"页面查看三列响应式布局效果。';
END $$;

-- 提交事务
COMMIT;

-- 显示创建的联系人
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.email,
    p.job_title,
    p.department,
    p.is_important,
    c.name AS company_name
FROM people p
JOIN companies c ON c.id = p.company_id
WHERE c.customer_code = 'TEST-50PROD'
  AND p.deleted_at IS NULL
  AND p.email LIKE '%@test.com'
ORDER BY p.created_at DESC
LIMIT 15;
