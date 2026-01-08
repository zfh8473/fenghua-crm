-- Migration: Create product_customer_associations table
-- Date: 2025-01-03
-- Description: Create product_customer_associations table for explicit product-customer associations
-- Story: 17.1

-- Create product_customer_associations table
CREATE TABLE IF NOT EXISTS product_customer_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联字段
  product_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  association_type VARCHAR(20) NOT NULL,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- 外键约束
  CONSTRAINT fk_associations_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_associations_customer FOREIGN KEY (customer_id) 
    REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 检查约束
  CONSTRAINT associations_type_check CHECK (association_type IN ('POTENTIAL_SUPPLIER', 'POTENTIAL_BUYER'))
);

-- Create partial unique index to prevent duplicate associations (only for non-deleted records)
-- This ensures product-customer association uniqueness within active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_customer_associations_unique 
  ON product_customer_associations(product_id, customer_id) 
  WHERE deleted_at IS NULL;

-- Create index on product_id (for querying associations by product)
CREATE INDEX IF NOT EXISTS idx_product_customer_associations_product_id 
  ON product_customer_associations(product_id) 
  WHERE deleted_at IS NULL;

-- Create index on customer_id (for querying associations by customer)
CREATE INDEX IF NOT EXISTS idx_product_customer_associations_customer_id 
  ON product_customer_associations(customer_id) 
  WHERE deleted_at IS NULL;

-- Create index on association_type (for filtering by association type)
CREATE INDEX IF NOT EXISTS idx_product_customer_associations_type 
  ON product_customer_associations(association_type) 
  WHERE deleted_at IS NULL;

-- Create index on created_by (for querying associations by creator)
CREATE INDEX IF NOT EXISTS idx_product_customer_associations_creator 
  ON product_customer_associations(created_by) 
  WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_customer_associations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_product_customer_associations_updated_at ON product_customer_associations;
CREATE TRIGGER trigger_update_product_customer_associations_updated_at
  BEFORE UPDATE ON product_customer_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_customer_associations_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE product_customer_associations IS 'Product-customer explicit associations for fenghua-crm';
COMMENT ON COLUMN product_customer_associations.product_id IS 'Product ID (foreign key to products table)';
COMMENT ON COLUMN product_customer_associations.customer_id IS 'Customer ID (foreign key to companies table)';
COMMENT ON COLUMN product_customer_associations.association_type IS 'Association type: POTENTIAL_SUPPLIER or POTENTIAL_BUYER';
COMMENT ON COLUMN product_customer_associations.created_by IS 'User ID who created the association';
COMMENT ON COLUMN product_customer_associations.deleted_at IS 'Soft delete timestamp (NULL if not deleted)';

