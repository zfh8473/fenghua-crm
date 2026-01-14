-- Migration: Create interaction_comments table
-- Description: Creates table for storing comments on interaction records
-- Date: 2026-01-14
-- Story: 10.1

-- Create interaction_comments table
CREATE TABLE IF NOT EXISTS interaction_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联字段
  interaction_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- 评论内容
  content TEXT NOT NULL,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  
  -- 外键约束
  CONSTRAINT fk_comments_interaction FOREIGN KEY (interaction_id) 
    REFERENCES product_customer_interactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_comments_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_comments_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL
);

-- Create index on interaction_id (for querying comments by interaction)
CREATE INDEX IF NOT EXISTS idx_comments_interaction 
  ON interaction_comments(interaction_id) 
  WHERE deleted_at IS NULL;

-- Create index on user_id (for querying comments by user)
CREATE INDEX IF NOT EXISTS idx_comments_user 
  ON interaction_comments(user_id) 
  WHERE deleted_at IS NULL;

-- Create index on created_at (for sorting comments by time, descending order)
CREATE INDEX IF NOT EXISTS idx_comments_created_at 
  ON interaction_comments(created_at DESC) 
  WHERE deleted_at IS NULL;

-- Create composite index (for common query: interaction + time)
CREATE INDEX IF NOT EXISTS idx_comments_interaction_created_at 
  ON interaction_comments(interaction_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON interaction_comments;
CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON interaction_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Add comments
COMMENT ON TABLE interaction_comments IS 'Comments on interaction records for team collaboration';
COMMENT ON COLUMN interaction_comments.interaction_id IS 'Interaction record ID (foreign key to product_customer_interactions table)';
COMMENT ON COLUMN interaction_comments.user_id IS 'User ID who created the comment (foreign key to users table)';
COMMENT ON COLUMN interaction_comments.content IS 'Comment content (required, cannot be empty)';
COMMENT ON COLUMN interaction_comments.deleted_at IS 'Soft delete timestamp (NULL if not deleted)';
