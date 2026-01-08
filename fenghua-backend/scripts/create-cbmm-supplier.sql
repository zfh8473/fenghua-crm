-- Script: Create CBMM Supplier and Associate with Ferro Niobium Product
-- Description: Creates CBMM supplier record and associates it with Ferro Niobium product
-- Date: 2025-01-03
-- Source: https://cbmm.com/

-- Step 1: Get the next available supplier code and create supplier
DO $$
DECLARE
  next_supplier_code VARCHAR(50);
  supplier_id UUID;
  ferro_niobium_product_id UUID;
  user_id UUID;
  alloys_category_name VARCHAR(255) := 'Alloys';
  alloys_category_exists BOOLEAN;
BEGIN
  -- Get the first admin user ID (or any user)
  SELECT id INTO user_id FROM users LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the database. Please create a user first.';
  END IF;

  -- Generate next supplier code
  SELECT COALESCE(
    'SUPPLIER' || LPAD((CAST(SUBSTRING(MAX(customer_code) FROM '[0-9]+$') AS INTEGER) + 1)::TEXT, 3, '0'),
    'SUPPLIER001'
  ) INTO next_supplier_code
  FROM companies
  WHERE customer_type = 'SUPPLIER' AND deleted_at IS NULL;

  -- Step 2: Check if "Alloys" category exists, create if needed
  SELECT EXISTS(
    SELECT 1 FROM product_categories 
    WHERE name = alloys_category_name AND deleted_at IS NULL
  ) INTO alloys_category_exists;
  
  IF NOT alloys_category_exists THEN
    INSERT INTO product_categories (name, hs_code, description, created_by)
    VALUES (
      alloys_category_name,
      '72000000', -- HS Code range for iron and steel
      'Metal alloys including ferroalloys',
      user_id
    ) ON CONFLICT (name) DO NOTHING;
    RAISE NOTICE 'Created category: %', alloys_category_name;
  END IF;

  -- Step 3: Check if Ferro Niobium product exists, create if not
  SELECT id INTO ferro_niobium_product_id
  FROM products
  WHERE name ILIKE '%Ferro Niobium%' OR name ILIKE '%铁铌合金%'
  AND deleted_at IS NULL
  LIMIT 1;

  IF ferro_niobium_product_id IS NULL THEN
    -- Create Ferro Niobium product
    INSERT INTO products (
      name,
      hs_code,
      category,
      description,
      status,
      created_by
    ) VALUES (
      'Ferro Niobium',
      '72029300', -- HS Code for ferro-niobium (adjusted from 7202.93.00)
      'Alloys',
      'Ferro Niobium is an important iron-niobium alloy with 60-70% niobium content. It is primarily used in high-strength low-alloy steel (HSLA) production, accounting for approximately 80% of global niobium production. Applications include oil and gas pipelines, automotive bodies, tools, ship hulls, and railway tracks.',
      'active',
      user_id
    ) RETURNING id INTO ferro_niobium_product_id;
    RAISE NOTICE 'Created product: Ferro Niobium (ID: %)', ferro_niobium_product_id;
  ELSE
    RAISE NOTICE 'Found existing product: Ferro Niobium (ID: %)', ferro_niobium_product_id;
  END IF;

  -- Step 4: Create CBMM supplier record
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
    email,
    notes, 
    created_by
  ) VALUES (
    'Companhia Brasileira de Metalurgia e Mineração (CBMM)',
    next_supplier_code,
    'SUPPLIER',
    'cbmm.com',
    'Córrego da Mata, s/n',
    'Araxá',
    'Minas Gerais',
    'Brazil',
    NULL,
    'Mining',
    'https://cbmm.com/',
    NULL,
    'info@cbmm.com',
    'CBMM is the world''s leading supplier of niobium products and technologies, founded in 1955. The company specializes in niobium production and application technologies, with products sold to over 50 countries worldwide, serving infrastructure, aerospace, energy, and other industries. CBMM provides over 80% of global niobium supply.',
    user_id
  ) RETURNING id INTO supplier_id;

  RAISE NOTICE 'Created supplier: % (ID: %)', next_supplier_code, supplier_id;

  -- Step 5: Create supplier-product association
  INSERT INTO product_customer_associations (
    product_id,
    customer_id,
    association_type,
    created_by
  ) VALUES (
    ferro_niobium_product_id, 
    supplier_id, 
    'POTENTIAL_SUPPLIER', 
    user_id
  ) ON CONFLICT DO NOTHING; -- Avoid duplicate associations

  RAISE NOTICE 'Created association between CBMM and Ferro Niobium';

  -- Step 6: Verify creation
  RAISE NOTICE '=== Summary ===';
  RAISE NOTICE 'Supplier: CBMM (% - ID: %)', next_supplier_code, supplier_id;
  RAISE NOTICE 'Product: Ferro Niobium (ID: %)', ferro_niobium_product_id;
  RAISE NOTICE 'Association: Created';

END $$;

-- Verify the created records
SELECT 
  'Supplier' as type,
  c.name,
  c.customer_code,
  c.customer_type,
  c.city || ', ' || c.state || ', ' || c.country as location,
  c.email
FROM companies c
WHERE c.domain_name = 'cbmm.com'
UNION ALL
SELECT 
  'Product' as type,
  p.name,
  p.hs_code as code,
  p.category as type_info,
  p.status as location,
  NULL as email
FROM products p
WHERE p.name = 'Ferro Niobium'
ORDER BY type, name;



