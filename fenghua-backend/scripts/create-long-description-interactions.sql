-- Script: Create Interaction Records with Long Descriptions for Two-Column Layout Testing
-- Description: Creates interaction records with longer descriptions to test line-clamp-1 truncation
-- Date: 2026-01-27

DO $$
DECLARE
  user_id UUID;
  customer_rec RECORD;
  product_rec RECORD;
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
  -- Long descriptions for testing line-clamp-1 truncation
  long_descriptions TEXT[] := ARRAY[
    '和周奇愿讨论一下合并账口负责的可能性，客户表示对我们的产品方案很感兴趣，特别是自动化功能能够显著提升他们的生产效率。我们详细介绍了产品的技术规格、性能参数以及成功案例，客户对产品的稳定性和可靠性表示认可。双方就价格、交付周期和售后服务等细节进行了深入交流，客户希望我们能够提供更详细的报价方案和技术支持计划。',
    '完成了新产品的演示，客户对产品性能表示满意，特别是对自动化功能很感兴趣。在演示过程中，我们展示了产品的核心功能、操作流程以及与其他系统的集成能力。客户的技术团队提出了很多专业问题，我们的技术专家一一解答，并提供了详细的技术文档。客户表示会尽快组织内部评审会议，讨论采购方案和预算安排。我们约定下周再次会面，讨论具体的合作细节和合同条款。',
    '已提交正式报价单，包含三个产品的详细报价和付款条件。报价单中详细列出了每个产品的规格、数量、单价、总价以及相关的技术参数。我们还提供了多种付款方式供客户选择，包括一次性付款、分期付款以及按进度付款等方案。客户财务部门正在审核报价，预计一周内会有反馈。我们同时准备了备选方案，以便根据客户的预算和需求进行调整。',
    '成功签订年度采购合同，总金额500万元。约定每季度交付一次，首次交付时间为下个月。合同条款包括产品质量标准、验收标准、违约责任、售后服务等详细内容。双方就价格调整机制、交付时间弹性、技术支持等关键条款达成一致。客户对我们的专业服务表示认可，希望建立长期合作关系。我们已开始准备首次交付的产品，确保按时按质完成。',
    '深入讨论客户的技术需求和应用场景，确认了产品规格和交付时间。客户提出了很多定制化需求，包括特殊的功能模块、接口对接、数据格式等。我们的技术团队详细分析了每个需求的可行性和实现方案，并提供了技术评估报告。双方就定制开发的成本、周期和风险进行了充分沟通，客户表示理解并愿意承担相应的费用。我们已开始制定详细的技术方案和开发计划。',
    '首次电话沟通，了解客户基本需求和采购预算。客户是一家大型制造企业，正在寻找能够提升生产效率的自动化解决方案。我们初步了解了他们的生产规模、现有设备情况、技术团队能力以及预算范围。客户对我们的产品表现出浓厚兴趣，希望我们能够提供更详细的产品资料和成功案例。我们约定下周进行现场调研，深入了解他们的具体需求和痛点，以便提供更精准的解决方案。',
    '跟进订单生产进度，预计下周可以完成第一批交付。我们与生产部门密切沟通，确保产品质量和交付时间。目前生产进度正常，所有关键工序都按照计划进行。我们已提前通知客户准备接收货物，并协调物流安排。同时，我们也在准备相关的技术文档、操作手册和培训材料，确保客户能够顺利使用产品。客户对我们的专业服务表示赞赏，期待产品的交付。',
    '客户对报价表示认可，正在内部审批流程中。客户采购部门已完成初步审核，认为我们的报价合理，产品质量符合要求。目前正在等待财务部门审批和法务部门审核合同条款。客户表示审批流程预计需要一周时间，希望我们能够保持耐心。我们已准备好所有必要的文件和资料，随时可以配合客户的审批流程。同时，我们也开始准备合同签署后的相关工作。',
    '产品规格已确认，开始准备生产计划。经过多轮技术沟通和方案调整，客户最终确认了产品的详细规格和技术参数。我们的技术团队已将所有规格要求转化为生产图纸和工艺文件，生产部门已开始准备原材料和安排生产计划。我们预计生产周期为三周，首批产品将在下个月交付。客户对我们的专业态度和响应速度表示满意，期待产品的交付。',
    '发货前验收完成，产品质量符合客户要求。我们的质检部门对产品进行了全面检测，包括功能测试、性能测试、外观检查等，所有指标都符合合同要求。客户也派出了验收团队进行现场验收，对产品质量表示认可。我们已准备好所有发货文件，包括装箱单、质量证书、技术文档等。物流安排已就绪，预计明天可以发货，三天内到达客户现场。',
    '订单已完成交付，客户对服务表示满意。产品已顺利安装调试，运行稳定，各项功能正常。我们的技术团队在现场提供了详细的培训和指导，客户的操作人员已能够熟练使用产品。客户对我们的产品质量、技术支持和售后服务都表示高度认可，希望继续合作。我们已开始准备后续的维护计划和升级方案，确保客户能够持续获得优质服务。',
    '讨论产品定制需求，需要进一步确认技术细节。客户提出了很多特殊的定制化需求，包括特殊的功能模块、界面定制、数据接口等。我们的技术团队详细分析了每个需求的可行性和实现难度，并提供了初步的技术方案。客户对方案表示认可，但希望我们能够提供更详细的开发计划和成本估算。我们已开始准备详细的技术文档和报价方案，预计下周可以提交给客户。',
    '客户提出新的采购计划，需要重新评估报价。客户在原有采购计划基础上，增加了新的产品需求和数量，总采购金额大幅增加。我们需要重新评估成本、产能和交付能力，并调整报价方案。同时，客户也提出了新的技术要求和服务需求，我们需要评估这些需求对成本和周期的影响。我们已开始准备新的报价方案和技术方案，预计三天内可以提交给客户。',
    '跟进售后服务，解决客户使用中的技术问题。客户在使用过程中遇到了一些技术问题，包括功能使用、系统配置、数据导入等。我们的技术支持团队及时响应，通过远程协助和现场支持等方式，帮助客户解决了所有问题。客户对我们的响应速度和技术能力表示认可，问题已全部解决。我们已开始准备后续的优化方案，提升产品的易用性和稳定性。',
    '参加客户举办的供应商大会，展示公司实力。我们在供应商大会上展示了公司的技术实力、产品优势和服务能力，获得了客户的关注和认可。通过这次大会，我们与多家潜在客户建立了联系，并获得了多个合作机会。客户对我们的专业表现表示赞赏，希望我们能够参与更多的项目。我们已开始跟进这些潜在客户，准备详细的合作方案。'
  ];
BEGIN
  -- Get first user
  SELECT id INTO user_id FROM users LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a user first.';
  END IF;

  -- Create 20 interactions with long descriptions
  FOR i IN 1..20 LOOP
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
    
    -- Create interaction date (very recent, within last 2 days)
    interaction_date := CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '2 days');
    
    -- Select random long description
    description_text := long_descriptions[1 + (RANDOM() * (array_length(long_descriptions, 1) - 1))::INTEGER];
    
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
      product_id,
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
      selected_products[1],
      interaction_type,
      interaction_date,
      description_text || ' - ' || customer_rec.name || ' (长描述测试 ' || i || ')',
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
    
    RAISE NOTICE 'Created interaction %: % - % (description length: %)', i, interaction_type, customer_rec.name, length(description_text);
  END LOOP;
  
  RAISE NOTICE 'Successfully created 20 interaction records with long descriptions for testing!';
END $$;
