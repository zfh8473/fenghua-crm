-- Migration: Add customer analysis performance indexes
-- Date: 2026-01-12
-- Description: Add indexes to optimize customer analysis queries
-- Story: 8.3

-- Composite index for customer analysis queries (customer, type, date)
-- This index optimizes queries filtering by customer_id, interaction_type, and interaction_date
-- Note: idx_interactions_customer_date already exists from migration 015, but we need a composite index with interaction_type
CREATE INDEX IF NOT EXISTS idx_interactions_customer_type_date 
  ON product_customer_interactions(customer_id, interaction_type, interaction_date DESC) 
  WHERE deleted_at IS NULL;

-- Index for customer type filtering (if not already exists from migration 022)
-- This index optimizes queries filtering companies by customer_type
-- Note: idx_companies_customer_type already exists from migration 022, but we add IF NOT EXISTS for safety
CREATE INDEX IF NOT EXISTS idx_companies_customer_type 
  ON companies(customer_type) 
  WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON INDEX idx_interactions_customer_type_date IS 'Optimizes customer analysis queries with customer, interaction type, and date filters.';
COMMENT ON INDEX idx_companies_customer_type IS 'Optimizes customer type filtering in customer analysis.';

