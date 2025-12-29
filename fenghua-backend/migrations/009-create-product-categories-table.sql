-- Migration: Create product_categories table
-- Date: 2025-12-29
-- Description: Create product_categories table for dynamic category management with HS code binding
-- Story: 2.8

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  hs_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- 约束：确保HS编码格式正确
  CONSTRAINT product_categories_hs_code_format 
    CHECK (hs_code ~ '^[0-9]{6,10}(-[0-9]{2,4})*$')
);

-- Create unique index on name (only for non-deleted records)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_name_unique 
  ON product_categories(name) 
  WHERE deleted_at IS NULL;

-- Create unique index on hs_code (only for non-deleted records)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_hs_code_unique 
  ON product_categories(hs_code) 
  WHERE deleted_at IS NULL;

-- Create index on name (for queries)
CREATE INDEX IF NOT EXISTS idx_product_categories_name 
  ON product_categories(name) 
  WHERE deleted_at IS NULL;

-- Create index on hs_code (for queries)
CREATE INDEX IF NOT EXISTS idx_product_categories_hs_code 
  ON product_categories(hs_code) 
  WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_product_categories_updated_at ON product_categories;
CREATE TRIGGER trigger_update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_product_categories_updated_at();

-- Add comment to table
COMMENT ON TABLE product_categories IS 'Product categories table with HS code mapping';
COMMENT ON COLUMN product_categories.name IS 'Category name - unique identifier';
COMMENT ON COLUMN product_categories.hs_code IS 'HS Code bound to this category - unique identifier, one-to-one relationship';
COMMENT ON COLUMN product_categories.description IS 'Optional category description';

