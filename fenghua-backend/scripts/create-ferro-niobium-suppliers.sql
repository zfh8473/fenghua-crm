-- Script: Create Multiple Ferro Niobium Suppliers
-- Description: Creates 5 supplier records and associates them with Ferro Niobium product
-- Date: 2025-01-03
-- Source: Business Radar data

DO $$
DECLARE
  next_supplier_code VARCHAR(50);
  supplier_id UUID;
  ferro_niobium_product_id UUID := 'ce80c937-54c1-420e-9777-d38bda9b878b'; -- Ferro Niobium product ID
  user_id UUID;
  supplier_count INTEGER := 0;
  current_code_num INTEGER;
BEGIN
  -- Get the first admin user ID (or any user)
  SELECT id INTO user_id FROM users LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the database. Please create a user first.';
  END IF;

  -- Verify Ferro Niobium product exists
  SELECT COUNT(*) INTO supplier_count
  FROM products
  WHERE id = ferro_niobium_product_id AND deleted_at IS NULL;
  
  IF supplier_count = 0 THEN
    RAISE EXCEPTION 'Ferro Niobium product not found. Please create the product first.';
  END IF;

  -- Get the current max supplier code number
  SELECT COALESCE(
    CAST(SUBSTRING(MAX(customer_code) FROM '[0-9]+$') AS INTEGER),
    0
  ) INTO current_code_num
  FROM companies
  WHERE customer_type = 'SUPPLIER' AND deleted_at IS NULL;

  -- Supplier 1: MSL DO BRASIL AGENCIAMENTOS AND TRANSPORTES LTDA
  current_code_num := current_code_num + 1;
  next_supplier_code := 'SUPPLIER' || LPAD(current_code_num::TEXT, 3, '0');
  
  INSERT INTO companies (
    name, 
    customer_code, 
    customer_type, 
    domain_name, 
    address, 
    city, 
    state, 
    country, 
    industry, 
    website, 
    email,
    notes, 
    created_by
  ) VALUES (
    'MSL DO BRASIL AGENCIAMENTOS AND TRANSPORTES LTDA',
    next_supplier_code,
    'SUPPLIER',
    NULL, -- Domain not available
    NULL, -- Address not available
    NULL, -- City not available
    NULL, -- State not available
    'Brazil',
    'Logistics',
    NULL,
    NULL,
    'Transportation and logistics company dealing with Ferro Niobium. Last supply: 2025-10-26. Product: 2 PACKAGES OF FERRONIOBIUM 111.',
    user_id
  ) RETURNING id INTO supplier_id;

  INSERT INTO product_customer_associations (
    product_id, customer_id, association_type, created_by
  ) VALUES (ferro_niobium_product_id, supplier_id, 'POTENTIAL_SUPPLIER', user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created supplier 1: % (ID: %)', next_supplier_code, supplier_id;

  -- Supplier 2: PAUL JOST GMBH
  current_code_num := current_code_num + 1;
  next_supplier_code := 'SUPPLIER' || LPAD(current_code_num::TEXT, 3, '0');
  
  INSERT INTO companies (
    name, 
    customer_code, 
    customer_type, 
    domain_name, 
    address, 
    city, 
    state, 
    country, 
    industry, 
    website, 
    email,
    notes, 
    created_by
  ) VALUES (
    'PAUL JOST GMBH',
    next_supplier_code,
    'SUPPLIER',
    NULL,
    NULL,
    NULL,
    NULL,
    'Brazil',
    'Trading',
    NULL,
    NULL,
    'Trading company dealing with Ferro Niobium Powder. Last supply: 2025-10-23. Product: FERRO NIOBIUM POWDER.',
    user_id
  ) RETURNING id INTO supplier_id;

  INSERT INTO product_customer_associations (
    product_id, customer_id, association_type, created_by
  ) VALUES (ferro_niobium_product_id, supplier_id, 'POTENTIAL_SUPPLIER', user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created supplier 2: % (ID: %)', next_supplier_code, supplier_id;

  -- Supplier 3: EXIROS B V SUCURSAL URUGUAY
  current_code_num := current_code_num + 1;
  next_supplier_code := 'SUPPLIER' || LPAD(current_code_num::TEXT, 3, '0');
  
  INSERT INTO companies (
    name, 
    customer_code, 
    customer_type, 
    domain_name, 
    address, 
    city, 
    state, 
    country, 
    industry, 
    website, 
    email,
    notes, 
    created_by
  ) VALUES (
    'EXIROS B V SUCURSAL URUGUAY',
    next_supplier_code,
    'SUPPLIER',
    NULL,
    NULL,
    NULL,
    NULL,
    'Uruguay',
    'Trading',
    NULL,
    NULL,
    'Trading company dealing with Ferro Niobium. Last supply: 2025-10-19. Product: FERRONIOBIO.',
    user_id
  ) RETURNING id INTO supplier_id;

  INSERT INTO product_customer_associations (
    product_id, customer_id, association_type, created_by
  ) VALUES (ferro_niobium_product_id, supplier_id, 'POTENTIAL_SUPPLIER', user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created supplier 3: % (ID: %)', next_supplier_code, supplier_id;

  -- Supplier 4: CRONIMET RAW MATERIALS GMBH
  current_code_num := current_code_num + 1;
  next_supplier_code := 'SUPPLIER' || LPAD(current_code_num::TEXT, 3, '0');
  
  INSERT INTO companies (
    name, 
    customer_code, 
    customer_type, 
    domain_name, 
    address, 
    city, 
    state, 
    country, 
    industry, 
    website, 
    email,
    notes, 
    created_by
  ) VALUES (
    'CRONIMET RAW MATERIALS GMBH',
    next_supplier_code,
    'SUPPLIER',
    NULL,
    NULL,
    NULL,
    NULL,
    'Germany',
    'Trading',
    NULL,
    NULL,
    'CRONIMET Holding GmbH is a leading company group in trading, production and recycling of alloy raw materials. Last supply: 2025-10-13. Product: FERRO NIOBIUM POWDER.',
    user_id
  ) RETURNING id INTO supplier_id;

  INSERT INTO product_customer_associations (
    product_id, customer_id, association_type, created_by
  ) VALUES (ferro_niobium_product_id, supplier_id, 'POTENTIAL_SUPPLIER', user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created supplier 4: % (ID: %)', next_supplier_code, supplier_id;

  -- Supplier 5: ASIA SHIPPING TRANSPORTES INTERNACIONAIS LTDA
  current_code_num := current_code_num + 1;
  next_supplier_code := 'SUPPLIER' || LPAD(current_code_num::TEXT, 3, '0');
  
  INSERT INTO companies (
    name, 
    customer_code, 
    customer_type, 
    domain_name, 
    address, 
    city, 
    state, 
    country, 
    industry, 
    website, 
    email,
    notes, 
    created_by
  ) VALUES (
    'ASIA SHIPPING TRANSPORTES INTERNACIONAIS LTDA',
    next_supplier_code,
    'SUPPLIER',
    NULL,
    NULL,
    NULL,
    NULL,
    'Brazil',
    'Logistics',
    NULL,
    NULL,
    'International transportation company dealing with Ferro Niobium. Last supply: 2025-10-05. Product: 2 X 40 CONTAINERS CONTAINING 45 PALLET OF FERRONIOBIUM.',
    user_id
  ) RETURNING id INTO supplier_id;

  INSERT INTO product_customer_associations (
    product_id, customer_id, association_type, created_by
  ) VALUES (ferro_niobium_product_id, supplier_id, 'POTENTIAL_SUPPLIER', user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created supplier 5: % (ID: %)', next_supplier_code, supplier_id;

  RAISE NOTICE '=== Summary ===';
  RAISE NOTICE 'Created 5 suppliers and associated them with Ferro Niobium product';

END $$;

-- Verify the created records
SELECT 
  'Supplier' as type,
  c.name,
  c.customer_code,
  c.customer_type,
  c.country as location,
  pca.association_type
FROM companies c
INNER JOIN product_customer_associations pca ON pca.customer_id = c.id
WHERE pca.product_id = 'ce80c937-54c1-420e-9777-d38bda9b878b'
  AND c.name IN (
    'MSL DO BRASIL AGENCIAMENTOS AND TRANSPORTES LTDA',
    'PAUL JOST GMBH',
    'EXIROS B V SUCURSAL URUGUAY',
    'CRONIMET RAW MATERIALS GMBH',
    'ASIA SHIPPING TRANSPORTES INTERNACIONAIS LTDA'
  )
  AND c.deleted_at IS NULL
  AND pca.deleted_at IS NULL
ORDER BY c.name;




