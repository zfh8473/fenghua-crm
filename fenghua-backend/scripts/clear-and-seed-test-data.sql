-- Script: Clear and Seed Test Data
-- Description: Clears existing products and customers data, then creates test data with associations
-- Date: 2025-01-03

-- Step 1: Clear existing data (in correct order to respect foreign keys)
BEGIN;

-- Delete interactions first (they reference products and customers)
DELETE FROM product_customer_interactions;
DELETE FROM product_customer_associations;
DELETE FROM products;
-- Note: companies table is from Twenty CRM, we'll only clear our test data

-- Step 2: Create test products
INSERT INTO products (id, name, hs_code, description, category, status, specifications, created_at, updated_at, deleted_at, created_by, updated_by, workspace_id)
VALUES
  -- Product 1
  (gen_random_uuid(), '测试产品 A', '1234567890', '这是一个测试产品 A 的描述', '电子产品', 'active', '{"color": "黑色", "size": "标准"}', NOW(), NOW(), NULL, NULL, NULL, '00000000-0000-0000-0000-000000000001'),
  -- Product 2
  (gen_random_uuid(), '测试产品 B', '0987654321', '这是一个测试产品 B 的描述', '机械产品', 'active', '{"weight": "10kg", "material": "不锈钢"}', NOW(), NOW(), NULL, NULL, NULL, '00000000-0000-0000-0000-000000000001'),
  -- Product 3
  (gen_random_uuid(), '测试产品 C', '1122334455', '这是一个测试产品 C 的描述', '化工产品', 'active', '{"grade": "工业级", "purity": "99%"}', NOW(), NOW(), NULL, NULL, NULL, '00000000-0000-0000-0000-000000000001');

-- Step 3: Get product IDs for associations (we'll use a subquery)
-- Note: In practice, you'd want to store these IDs or use a more sophisticated approach

-- Step 4: Create test customers in companies table (if they don't exist)
-- Note: This assumes companies table exists and has the required structure
-- We'll use INSERT ... ON CONFLICT DO NOTHING to avoid errors if customers already exist

-- Step 5: Create associations between products and customers
-- This will be done after we have the actual product and customer IDs

COMMIT;

-- Note: This is a template. In practice, you'll need to:
-- 1. Get actual product IDs after insertion
-- 2. Get actual customer IDs from companies table
-- 3. Create associations using those IDs

