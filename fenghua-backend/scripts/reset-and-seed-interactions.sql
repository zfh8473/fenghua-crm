-- Reset and Seed Interactions Script (SQL)
-- 
-- This script:
-- 1. Soft deletes all existing interactions
-- 2. Creates new interaction records with proper customer and product associations
--
-- Usage:
--   psql -d your_database -f scripts/reset-and-seed-interactions.sql
--   Or execute in your database client

BEGIN;

-- Step 1: Soft delete all existing interactions
UPDATE product_customer_interactions
SET deleted_at = NOW()
WHERE deleted_at IS NULL;

-- Step 2: Delete all interaction_products associations for deleted interactions
DELETE FROM interaction_products
WHERE interaction_id IN (
  SELECT id FROM product_customer_interactions WHERE deleted_at IS NOT NULL
);

-- Step 3: Create new interactions based on existing associations
-- For each customer with associations, create 2-3 interactions
DO $$
DECLARE
  customer_rec RECORD;
  product_ids UUID[];
  selected_products UUID[];
  interaction_type TEXT;
  interaction_date TIMESTAMP WITH TIME ZONE;
  user_id UUID;
  interaction_id UUID;
  i INT;
  num_interactions INT;
  num_products INT;
BEGIN
  -- Get a user ID
  SELECT id INTO user_id FROM users WHERE deleted_at IS NULL LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a user first.';
  END IF;

  -- Loop through customers with associations
  FOR customer_rec IN 
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.customer_type,
      ARRAY_AGG(pca.product_id) as product_ids
    FROM companies c
    INNER JOIN product_customer_associations pca ON pca.customer_id = c.id
    WHERE c.deleted_at IS NULL 
      AND pca.deleted_at IS NULL
    GROUP BY c.id, c.name, c.customer_type
    HAVING COUNT(*) > 0
    LIMIT 20
  LOOP
    product_ids := customer_rec.product_ids;
    
    -- Determine number of interactions (2-3 per customer)
    num_interactions := LEAST(3, GREATEST(2, array_length(product_ids, 1) / 2));
    
    -- Create interactions
    FOR i IN 1..num_interactions LOOP
      -- Select interaction type based on customer type
      IF customer_rec.customer_type = 'BUYER' THEN
        interaction_type := (ARRAY[
          'initial_contact', 'product_inquiry', 'quotation', 
          'quotation_accepted', 'order_signed', 'order_follow_up'
        ])[1 + (i % 6)];
      ELSE
        interaction_type := (ARRAY[
          'product_inquiry_supplier', 'quotation_received', 'specification_confirmed',
          'production_progress', 'pre_shipment_inspection', 'shipped'
        ])[1 + (i % 6)];
      END IF;
      
      -- Random date within last 90 days
      interaction_date := CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '90 days');
      
      -- Insert interaction
      INSERT INTO product_customer_interactions (
        customer_id,
        interaction_type,
        interaction_date,
        description,
        status,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        customer_rec.customer_id,
        interaction_type,
        interaction_date,
        '互动记录 ' || i || ' - ' || customer_rec.customer_name,
        CASE WHEN RANDOM() > 0.5 THEN 'in_progress' ELSE 'completed' END,
        user_id,
        interaction_date,
        interaction_date
      ) RETURNING id INTO interaction_id;
      
      -- Select 1-3 products for this interaction (randomly from customer's products)
      num_products := LEAST(3, GREATEST(1, 1 + FLOOR(RANDOM() * array_length(product_ids, 1))::int));
      
      -- Build selected products array
      selected_products := ARRAY[]::UUID[];
      FOR j IN 1..num_products LOOP
        -- Randomly select a product from the customer's product list
        selected_products := array_append(
          selected_products, 
          product_ids[1 + (FLOOR(RANDOM() * array_length(product_ids, 1))::int % array_length(product_ids, 1))]
        );
      END LOOP;
      
      -- Remove duplicates
      selected_products := ARRAY(SELECT DISTINCT unnest(selected_products));
      
      -- Ensure we have at least one product
      IF array_length(selected_products, 1) IS NULL OR array_length(selected_products, 1) = 0 THEN
        selected_products := ARRAY[product_ids[1]];
      END IF;
      
      -- Insert product associations
      FOR j IN 1..array_length(selected_products, 1) LOOP
        INSERT INTO interaction_products (interaction_id, product_id, created_at)
        VALUES (interaction_id, selected_products[j], interaction_date)
        ON CONFLICT ON CONSTRAINT interaction_products_pkey DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

COMMIT;

-- Display summary
SELECT 
  'Summary' as info,
  (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL) as total_customers,
  (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND status = 'active') as total_products,
  (SELECT COUNT(*) FROM product_customer_associations WHERE deleted_at IS NULL) as total_associations,
  (SELECT COUNT(*) FROM product_customer_interactions WHERE deleted_at IS NULL) as total_interactions,
  (SELECT COUNT(*) FROM interaction_products) as total_interaction_products;
