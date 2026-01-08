-- Migration: Add customer timeline index
-- Date: 2025-01-03
-- Description: Add composite index for customer timeline queries (customer_id + interaction_date)

-- Create composite index for customer timeline queries
-- This index optimizes queries that filter by customer_id and sort by interaction_date
CREATE INDEX IF NOT EXISTS idx_interactions_customer_date 
  ON product_customer_interactions(customer_id, interaction_date DESC) 
  WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON INDEX idx_interactions_customer_date IS 'Composite index for customer timeline queries (optimizes customer_id filter + interaction_date sort)';

