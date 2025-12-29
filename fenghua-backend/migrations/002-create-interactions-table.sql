-- Migration: Create product_customer_interactions table
-- Date: 2025-12-26
-- Description: Create product_customer_interactions table for interaction records

-- Create product_customer_interactions table
CREATE TABLE IF NOT EXISTS product_customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联字段（核心）
  product_id UUID NOT NULL,
  customer_id UUID NOT NULL,  -- 关联 Twenty CRM companies 表
  
  -- 互动信息
  interaction_type VARCHAR(50) NOT NULL,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  status VARCHAR(50),
  
  -- 额外信息（JSON格式，灵活扩展）
  additional_info JSONB,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  
  -- 外键关联
  workspace_id UUID NOT NULL,
  
  -- 外键约束（注意：customer_id 关联到 Twenty CRM companies 表，无法创建外键）
  CONSTRAINT fk_interactions_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE RESTRICT,
  
  -- 检查约束（互动类型）
  CONSTRAINT interactions_type_check CHECK (
    interaction_type IN (
      -- 采购商互动类型
      'initial_contact',           -- 初步接触
      'product_inquiry',            -- 产品询价
      'quotation',                  -- 报价
      'quotation_accepted',         -- 接受报价
      'quotation_rejected',         -- 拒绝报价
      'order_signed',               -- 签署订单
      'order_completed',            -- 完成订单
      -- 供应商互动类型
      'product_inquiry_supplier',   -- 询价产品
      'quotation_received',          -- 接收报价
      'specification_confirmed',     -- 产品规格确认
      'production_progress',         -- 生产进度跟进
      'pre_shipment_inspection',     -- 发货前验收
      'shipped'                      -- 已发货
    )
  )
);

-- Create index on product_id (for querying interactions by product)
CREATE INDEX IF NOT EXISTS idx_interactions_product 
  ON product_customer_interactions(product_id) 
  WHERE deleted_at IS NULL;

-- Create index on customer_id (for querying interactions by customer)
CREATE INDEX IF NOT EXISTS idx_interactions_customer 
  ON product_customer_interactions(customer_id) 
  WHERE deleted_at IS NULL;

-- Create composite index (for querying product-customer interaction history)
CREATE INDEX IF NOT EXISTS idx_interactions_product_customer 
  ON product_customer_interactions(product_id, customer_id) 
  WHERE deleted_at IS NULL;

-- Create index on interaction_date (for timeline view, descending order)
CREATE INDEX IF NOT EXISTS idx_interactions_date 
  ON product_customer_interactions(interaction_date DESC) 
  WHERE deleted_at IS NULL;

-- Create index on interaction_type (for filtering by type)
CREATE INDEX IF NOT EXISTS idx_interactions_type 
  ON product_customer_interactions(interaction_type) 
  WHERE deleted_at IS NULL;

-- Create index on workspace_id (for multi-tenant isolation)
CREATE INDEX IF NOT EXISTS idx_interactions_workspace 
  ON product_customer_interactions(workspace_id) 
  WHERE deleted_at IS NULL;

-- Create composite index (for common query: product + customer + date)
CREATE INDEX IF NOT EXISTS idx_interactions_product_customer_date 
  ON product_customer_interactions(product_id, customer_id, interaction_date DESC) 
  WHERE deleted_at IS NULL;

-- Create index on created_by (for querying interactions by creator)
CREATE INDEX IF NOT EXISTS idx_interactions_creator 
  ON product_customer_interactions(created_by) 
  WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_interactions_updated_at ON product_customer_interactions;
CREATE TRIGGER trigger_update_interactions_updated_at
  BEFORE UPDATE ON product_customer_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_interactions_updated_at();

-- Add comment to table
COMMENT ON TABLE product_customer_interactions IS 'Product-customer interaction records for fenghua-crm';
COMMENT ON COLUMN product_customer_interactions.product_id IS 'Product ID (foreign key to products table)';
COMMENT ON COLUMN product_customer_interactions.customer_id IS 'Customer ID (references Twenty CRM companies table, no foreign key constraint)';
COMMENT ON COLUMN product_customer_interactions.interaction_type IS 'Type of interaction (see CHECK constraint for valid values)';
COMMENT ON COLUMN product_customer_interactions.additional_info IS 'Additional information in JSON format (flexible extension)';

