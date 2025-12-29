-- Migration: Create products table
-- Date: 2025-12-26
-- Description: Create products table for fenghua-crm custom data

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  hs_code VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  specifications JSONB,
  image_url TEXT,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  
  -- 外键关联（Twenty CRM）
  workspace_id UUID NOT NULL,
  
  -- 检查约束
  CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Create unique index on workspace_id + hs_code (only for non-deleted records)
-- This ensures HS code uniqueness within a workspace, not globally
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_workspace_hs_code 
  ON products(workspace_id, hs_code) 
  WHERE deleted_at IS NULL;

-- Create index on status (for filtering active products)
CREATE INDEX IF NOT EXISTS idx_products_status 
  ON products(status) 
  WHERE deleted_at IS NULL;

-- Create index on category (for category queries)
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category) 
  WHERE deleted_at IS NULL;

-- Create full-text search index on name (for fuzzy search)
CREATE INDEX IF NOT EXISTS idx_products_name_search 
  ON products USING gin(to_tsvector('english', name));

-- Create index on workspace_id (for multi-tenant isolation)
CREATE INDEX IF NOT EXISTS idx_products_workspace 
  ON products(workspace_id) 
  WHERE deleted_at IS NULL;

-- Create composite index (for common queries: workspace + status)
CREATE INDEX IF NOT EXISTS idx_products_workspace_status 
  ON products(workspace_id, status) 
  WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Add comment to table
COMMENT ON TABLE products IS 'Products table for fenghua-crm custom data';
COMMENT ON COLUMN products.hs_code IS 'HS Code (Harmonized System Code) - unique identifier for products';
COMMENT ON COLUMN products.status IS 'Product status: active, inactive, or archived';
COMMENT ON COLUMN products.workspace_id IS 'Workspace ID from Twenty CRM';

