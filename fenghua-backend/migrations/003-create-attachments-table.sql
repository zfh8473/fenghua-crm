-- Migration: Create file_attachments table
-- Date: 2025-12-26
-- Description: Create file_attachments table for file attachments (photos, documents, etc.)

-- Create file_attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联字段
  interaction_id UUID,
  product_id UUID,
  
  -- 文件信息
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),
  
  -- 存储信息
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'aliyun_oss',  -- 'aliyun_oss', 'aws_s3', 'cloudflare_r2'
  storage_key TEXT NOT NULL,  -- 对象存储的 key
  
  -- 文件元数据
  metadata JSONB,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  
  -- 外键关联
  workspace_id UUID NOT NULL,
  
  -- 外键约束
  CONSTRAINT fk_attachments_interaction FOREIGN KEY (interaction_id) 
    REFERENCES product_customer_interactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE CASCADE,
  
  -- 检查约束（至少关联一个实体）
  CONSTRAINT attachments_reference_check CHECK (
    (interaction_id IS NOT NULL) OR (product_id IS NOT NULL)
  )
);

-- Create index on interaction_id (for querying attachments by interaction)
CREATE INDEX IF NOT EXISTS idx_attachments_interaction 
  ON file_attachments(interaction_id) 
  WHERE deleted_at IS NULL;

-- Create index on product_id (for querying attachments by product)
CREATE INDEX IF NOT EXISTS idx_attachments_product 
  ON file_attachments(product_id) 
  WHERE deleted_at IS NULL;

-- Create index on file_type (for filtering by file type)
CREATE INDEX IF NOT EXISTS idx_attachments_type 
  ON file_attachments(file_type) 
  WHERE deleted_at IS NULL;

-- Create index on workspace_id (for multi-tenant isolation)
CREATE INDEX IF NOT EXISTS idx_attachments_workspace 
  ON file_attachments(workspace_id) 
  WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_attachments_updated_at ON file_attachments;
CREATE TRIGGER trigger_update_attachments_updated_at
  BEFORE UPDATE ON file_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_attachments_updated_at();

-- Add comment to table
COMMENT ON TABLE file_attachments IS 'File attachments table for fenghua-crm (photos, documents, videos)';
COMMENT ON COLUMN file_attachments.interaction_id IS 'Interaction ID (foreign key to product_customer_interactions table)';
COMMENT ON COLUMN file_attachments.product_id IS 'Product ID (foreign key to products table)';
COMMENT ON COLUMN file_attachments.storage_provider IS 'Storage provider: aliyun_oss, aws_s3, or cloudflare_r2';
COMMENT ON COLUMN file_attachments.storage_key IS 'Object storage key (used to generate signed URL)';

