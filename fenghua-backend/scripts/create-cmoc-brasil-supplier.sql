-- Script: Create CMOC Brasil Supplier and Products
-- Description: Creates CMOC Brasil supplier record and associated products (Niobium and Phosphates)
-- Date: 2025-01-03
-- Source: https://cmocbrasil.com/

-- Step 1: Get the next available supplier code
-- Check existing supplier codes to generate a new one
DO $$
DECLARE
  next_supplier_code VARCHAR(50);
  supplier_id UUID;
  niobium_product_id UUID;
  phosphate_product_id UUID;
  user_id UUID;
  minerals_category_name VARCHAR(255) := 'Minerals';
  fertilizers_category_name VARCHAR(255) := 'Fertilizers';
  minerals_category_exists BOOLEAN;
  fertilizers_category_exists BOOLEAN;
BEGIN
  -- Get the first admin user ID (or any user)
  SELECT id INTO user_id FROM users LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the database. Please create a user first.';
  END IF;

  -- Generate next supplier code (find max and increment)
  SELECT COALESCE(
    'SUPPLIER' || LPAD((CAST(SUBSTRING(MAX(customer_code) FROM '[0-9]+$') AS INTEGER) + 1)::TEXT, 3, '0'),
    'SUPPLIER001'
  ) INTO next_supplier_code
  FROM companies
  WHERE customer_type = 'SUPPLIER' AND deleted_at IS NULL;

  -- Step 2: Create CMOC Brasil supplier record
  INSERT INTO companies (
    name, 
    customer_code, 
    customer_type, 
    domain_name, 
    address, 
    city, 
    state, 
    country, 
    postal_code, 
    industry, 
    website, 
    phone, 
    notes, 
    created_by
  ) VALUES (
    'CMOC Brasil Mineração, Indústria e Participações Ltda.',
    next_supplier_code,
    'SUPPLIER',
    'cmocbrasil.com',
    'Rod. Cônego Domenico Rangoni S/N',
    'Cubatão',
    'São Paulo',
    'Brazil',
    '11573-904',
    'Mining',
    'https://cmocbrasil.com/',
    '+55-13-3362-7000',
    'Global second-largest niobium producer and Brazil''s second-largest phosphate fertilizer producer. Operations located in Catalão, Ouvidor (GO) and Cubatão (SP). Contact: faleconosco@br.cmoc.com, Phone: 0800 726 1035',
    user_id
  ) RETURNING id INTO supplier_id;

  RAISE NOTICE 'Created supplier: % (ID: %)', next_supplier_code, supplier_id;

  -- Step 3: Check if product categories exist, create if needed
  -- Check if "Minerals" category exists
  SELECT EXISTS(
    SELECT 1 FROM product_categories 
    WHERE name = minerals_category_name AND deleted_at IS NULL
  ) INTO minerals_category_exists;
  
  -- Check if "Fertilizers" category exists
  SELECT EXISTS(
    SELECT 1 FROM product_categories 
    WHERE name = fertilizers_category_name AND deleted_at IS NULL
  ) INTO fertilizers_category_exists;
  
  -- Create "Minerals" category if it doesn't exist
  IF NOT minerals_category_exists THEN
    INSERT INTO product_categories (name, hs_code, description, created_by)
    VALUES (
      minerals_category_name,
      '26000000', -- HS Code range for ores, slag and ash
      'Minerals and ores including niobium, tantalum, vanadium and their compounds',
      user_id
    ) ON CONFLICT (name) DO NOTHING; -- Handle race condition
    RAISE NOTICE 'Created category: %', minerals_category_name;
  END IF;
  
  -- Create "Fertilizers" category if it doesn't exist
  IF NOT fertilizers_category_exists THEN
    INSERT INTO product_categories (name, hs_code, description, created_by)
    VALUES (
      fertilizers_category_name,
      '31000000', -- HS Code range for fertilizers
      'Fertilizers including phosphate, nitrogen, and compound fertilizers',
      user_id
    ) ON CONFLICT (name) DO NOTHING; -- Handle race condition
    RAISE NOTICE 'Created category: %', fertilizers_category_name;
  END IF;

  -- Step 4: Create Niobium product
  INSERT INTO products (
    name,
    hs_code,
    category,
    description,
    status,
    created_by
  ) VALUES (
    'Niobium (Nióbio)',
    '26159000', -- HS Code for niobium, tantalum, vanadium and their compounds
    'Minerals',
    'Niobium is primarily used in the steel industry to improve strength and corrosion resistance. CMOC Brasil is the world''s second-largest niobium producer.',
    'active',
    user_id
  ) RETURNING id INTO niobium_product_id;

  RAISE NOTICE 'Created product: Niobium (ID: %)', niobium_product_id;

  -- Step 5: Create Phosphate Fertilizers product
  INSERT INTO products (
    name,
    hs_code,
    category,
    description,
    status,
    created_by
  ) VALUES (
    'Phosphate Fertilizers (Fosfatos)',
    '31031000', -- HS Code for superphosphates
    'Fertilizers',
    'Phosphate fertilizers are widely used in agriculture to improve crop yields. CMOC Brasil is Brazil''s second-largest phosphate fertilizer producer.',
    'active',
    user_id
  ) RETURNING id INTO phosphate_product_id;

  RAISE NOTICE 'Created product: Phosphate Fertilizers (ID: %)', phosphate_product_id;

  -- Step 6: Create supplier-product associations
  INSERT INTO product_customer_associations (
    product_id,
    customer_id,
    association_type,
    created_by
  ) VALUES 
  (niobium_product_id, supplier_id, 'POTENTIAL_SUPPLIER', user_id),
  (phosphate_product_id, supplier_id, 'POTENTIAL_SUPPLIER', user_id);

  RAISE NOTICE 'Created associations between supplier and products';

  -- Step 7: Verify creation
  RAISE NOTICE '=== Summary ===';
  RAISE NOTICE 'Supplier: CMOC Brasil (% - ID: %)', next_supplier_code, supplier_id;
  RAISE NOTICE 'Product 1: Niobium (ID: %)', niobium_product_id;
  RAISE NOTICE 'Product 2: Phosphate Fertilizers (ID: %)', phosphate_product_id;
  RAISE NOTICE 'Associations: 2 created';

END $$;

-- Verify the created records
SELECT 
  'Supplier' as type,
  c.name,
  c.customer_code,
  c.customer_type,
  c.city || ', ' || c.state || ', ' || c.country as location
FROM companies c
WHERE c.domain_name = 'cmocbrasil.com'
UNION ALL
SELECT 
  'Product' as type,
  p.name,
  p.hs_code as code,
  p.category as type_info,
  p.status as location
FROM products p
WHERE p.name IN ('Niobium (Nióbio)', 'Phosphate Fertilizers (Fosfatos)')
ORDER BY type, name;

