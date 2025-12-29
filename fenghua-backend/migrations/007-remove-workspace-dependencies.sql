-- Migration: Remove workspace dependencies
-- Description: Removes workspace_id from existing tables and updates foreign key constraints
-- Date: 2025-12-26
-- Story: 16.1

-- Update products table: remove workspace_id, ensure created_by/updated_by exist
DO $$
BEGIN
  -- Remove workspace_id column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE products DROP COLUMN workspace_id;
    RAISE NOTICE 'Dropped workspace_id column from products table';
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE products ADD COLUMN created_by UUID REFERENCES users(id);
    RAISE NOTICE 'Added created_by column to products table';
  END IF;

  -- Add updated_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE products ADD COLUMN updated_by UUID REFERENCES users(id);
    RAISE NOTICE 'Added updated_by column to products table';
  END IF;
END $$;

-- Drop workspace_id related indexes from products table
DROP INDEX IF EXISTS idx_products_workspace;
DROP INDEX IF EXISTS idx_products_workspace_status;
DROP INDEX IF EXISTS idx_products_workspace_hs_code;

-- Create new indexes for products table (using created_by instead of workspace_id)
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_created_by_status ON products(created_by, status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_created_by_hs_code 
  ON products(created_by, hs_code) 
  WHERE deleted_at IS NULL;

-- Update product_customer_interactions table: remove workspace_id, update customer_id foreign key
DO $$
BEGIN
  -- Remove workspace_id column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_customer_interactions' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE product_customer_interactions DROP COLUMN workspace_id;
    RAISE NOTICE 'Dropped workspace_id column from product_customer_interactions table';
  END IF;

  -- Drop old foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'product_customer_interactions' 
    AND constraint_name LIKE '%customer%'
  ) THEN
    -- Find and drop the constraint
    ALTER TABLE product_customer_interactions 
    DROP CONSTRAINT IF EXISTS fk_interactions_customer;
    RAISE NOTICE 'Dropped old customer foreign key constraint from product_customer_interactions table';
  END IF;
END $$;

-- Add foreign key constraint for customer_id to companies table
-- Note: This will only work if the customer_id values can be matched to companies.id
-- If there are existing data, you may need to migrate the data first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'product_customer_interactions' 
    AND constraint_name = 'fk_interactions_customer'
  ) THEN
    -- Check if companies table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'companies'
    ) THEN
      ALTER TABLE product_customer_interactions
      ADD CONSTRAINT fk_interactions_customer 
      FOREIGN KEY (customer_id) 
      REFERENCES companies(id) ON DELETE RESTRICT;
      RAISE NOTICE 'Added foreign key constraint for customer_id to companies table';
    ELSE
      RAISE NOTICE 'Companies table does not exist yet. Please run migration 006 first.';
    END IF;
  END IF;
END $$;

-- Update file_attachments table: remove workspace_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'file_attachments' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE file_attachments DROP COLUMN workspace_id;
    RAISE NOTICE 'Dropped workspace_id column from file_attachments table';
  END IF;
END $$;

-- Drop workspace_id related indexes from file_attachments table
DROP INDEX IF EXISTS idx_file_attachments_workspace;

-- Add comments
COMMENT ON COLUMN products.created_by IS 'User ID who created the product (replaces workspace_id)';
COMMENT ON COLUMN products.updated_by IS 'User ID who last updated the product';
COMMENT ON COLUMN product_customer_interactions.customer_id IS 'Foreign key to companies table (replaces Twenty CRM company reference)';

