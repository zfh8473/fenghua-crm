-- Script: Create 50 Interaction Records for Two-Column Layout Testing
-- Description: Creates 50 diverse interaction records with various types, statuses, and products
-- Date: 2026-01-27
-- Purpose: Test data for two-column card layout demonstration

DO $$
DECLARE
  user_id UUID;
  customer_rec RECORD;
  product_rec RECORD;
  person_rec RECORD;
  interaction_id UUID;
  interaction_type TEXT;
  interaction_status TEXT;
  interaction_date TIMESTAMP;
  description_text TEXT;
  num_products INT;
  selected_products UUID[];
  product_ids UUID[];
  person_ids UUID[];
  selected_person_id UUID;
  i INT;
  j INT;
  customer_type TEXT;
  buyer_types TEXT[] := ARRAY[
    'initial_contact', 'product_inquiry', 'quotation', 
    'quotation_accepted', 'quotation_rejected', 'order_signed', 
    'order_completed'
  ];
  supplier_types TEXT[] := ARRAY[
    'product_inquiry_supplier', 'quotation_received', 'specification_confirmed',
    'production_progress', 'pre_shipment_inspection', 'shipped'
  ];
  statuses TEXT[] := ARRAY['in_progress', 'completed', 'cancelled', 'needs_follow_up'];
  descriptions TEXT[] := ARRAY[
    '和周奇愿讨论一下合并账口负责的可能性，客户表示对我们的产品方案很感兴趣',
    '完成了新产品的演示，客户对产品性能表示满意，特别是对自动化功能很感兴趣',
    '已提交正式报价单，包含三个产品的详细报价和付款条件',
    '成功签订年度采购合同，总金额500万元。约定每季度交付一次',
    '深入讨论客户的技术需求和应用场景，确认了产品规格和交付时间',
    '首次电话沟通，了解客户基本需求和采购预算',
    '跟进订单生产进度，预计下周可以完成第一批交付',
    '客户对报价表示认可，正在内部审批流程中',
    '产品规格已确认，开始准备生产计划',
    '发货前验收完成，产品质量符合客户要求',
    '订单已完成交付，客户对服务表示满意',
    '讨论产品定制需求，需要进一步确认技术细节',
    '客户提出新的采购计划，需要重新评估报价',
    '跟进售后服务，解决客户使用中的技术问题',
    '参加客户举办的供应商大会，展示公司实力'
  ];
BEGIN
  -- Get first user (or create a test user)
  SELECT id INTO user_id FROM users LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a user first.';
  END IF;

  -- Create 50 interactions
  FOR i IN 1..50 LOOP
    -- Select random customer that has at least one person (contact)
    -- Prioritize customers with contacts to ensure person_id is populated
    SELECT c.id, c.customer_type, c.name INTO customer_rec 
    FROM companies c
    WHERE c.deleted_at IS NULL 
      AND EXISTS (SELECT 1 FROM people p WHERE p.company_id = c.id AND p.deleted_at IS NULL)
    ORDER BY RANDOM() 
    LIMIT 1;
    
    -- If no customer with people found, fallback to any customer
    IF customer_rec.id IS NULL THEN
      SELECT c.id, c.customer_type, c.name INTO customer_rec 
      FROM companies c
      WHERE c.deleted_at IS NULL 
      ORDER BY RANDOM() 
      LIMIT 1;
    END IF;
    
    IF customer_rec.id IS NULL THEN
      RAISE EXCEPTION 'No customers found. Please create customers first.';
    END IF;
    
    customer_type := customer_rec.customer_type;
    
    -- Select interaction type based on customer type
    IF customer_type = 'BUYER' THEN
      interaction_type := buyer_types[1 + (RANDOM() * (array_length(buyer_types, 1) - 1))::INTEGER];
    ELSE
      interaction_type := supplier_types[1 + (RANDOM() * (array_length(supplier_types, 1) - 1))::INTEGER];
    END IF;
    
    -- Select random status
    interaction_status := statuses[1 + (RANDOM() * (array_length(statuses, 1) - 1))::INTEGER];
    
    -- Create interaction date (within last 30 days, more recent for better demo)
    interaction_date := CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days');
    
    -- Select random description
    description_text := descriptions[1 + (RANDOM() * (array_length(descriptions, 1) - 1))::INTEGER];
    
    -- Get people (contacts) associated with this customer
    SELECT ARRAY_AGG(id) INTO person_ids
    FROM people
    WHERE company_id = customer_rec.id
      AND deleted_at IS NULL;
    
    -- Select random person for this interaction (if available)
    selected_person_id := NULL;
    IF person_ids IS NOT NULL AND array_length(person_ids, 1) > 0 THEN
      selected_person_id := person_ids[1 + (FLOOR(RANDOM() * array_length(person_ids, 1))::int % array_length(person_ids, 1))];
    END IF;
    
    -- Get products associated with this customer
    SELECT ARRAY_AGG(product_id) INTO product_ids
    FROM product_customer_associations
    WHERE customer_id = customer_rec.id;
    
    -- If no products, get random products
    IF product_ids IS NULL OR array_length(product_ids, 1) = 0 THEN
      SELECT ARRAY_AGG(id) INTO product_ids
      FROM products
      WHERE deleted_at IS NULL
      LIMIT 10;
    END IF;
    
    -- Select 1-4 products for this interaction
    num_products := LEAST(4, GREATEST(1, 1 + FLOOR(RANDOM() * array_length(product_ids, 1))::int));
    
    -- Build selected products array (random selection)
    selected_products := ARRAY[]::UUID[];
    FOR j IN 1..num_products LOOP
      selected_products := array_append(
        selected_products, 
        product_ids[1 + (FLOOR(RANDOM() * array_length(product_ids, 1))::int % array_length(product_ids, 1))]
      );
    END LOOP;
    
    -- Remove duplicates
    selected_products := ARRAY(SELECT DISTINCT unnest(selected_products));
    
    -- Ensure we have at least one product
    IF array_length(selected_products, 1) = 0 THEN
      SELECT id INTO product_rec FROM products WHERE deleted_at IS NULL LIMIT 1;
      IF product_rec.id IS NOT NULL THEN
        selected_products := ARRAY[product_rec.id];
      END IF;
    END IF;
    
    -- Insert interaction
    INSERT INTO product_customer_interactions (
      customer_id,
      person_id, -- Story 20.5: Include person_id for contact person association
      product_id, -- First product for backward compatibility
      interaction_type,
      interaction_date,
      description,
      status,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      customer_rec.id,
      selected_person_id, -- Include person_id if available
      selected_products[1], -- First product for backward compatibility
      interaction_type,
      interaction_date,
      description_text || ' - ' || customer_rec.name || ' (记录 ' || i || ')',
      interaction_status,
      user_id,
      interaction_date,
      interaction_date
    ) RETURNING id INTO interaction_id;
    
    -- Create product associations
    IF array_length(selected_products, 1) > 0 THEN
      FOR j IN 1..array_length(selected_products, 1) LOOP
        INSERT INTO interaction_products (interaction_id, product_id, created_at)
        VALUES (interaction_id, selected_products[j], interaction_date)
        ON CONFLICT ON CONSTRAINT interaction_products_pkey DO NOTHING;
      END LOOP;
    END IF;
    
    RAISE NOTICE 'Created interaction %: % - %', i, interaction_type, customer_rec.name;
  END LOOP;
  
  RAISE NOTICE 'Successfully created 50 interaction records for testing!';
END $$;
