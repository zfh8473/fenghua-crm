-- Migration: Add indexes for buyer analysis queries
-- Created: 2026-01-12
-- Description: Optimize buyer analysis queries by adding composite indexes
-- Story: 8.5

-- Composite index for buyer analysis queries (customer_id, interaction_type, interaction_date)
-- This index optimizes queries filtering by customer_id, interaction_type, and interaction_date
-- Note: The buyer filtering is done via JOIN with companies table in the query, not in the index
CREATE INDEX IF NOT EXISTS idx_interactions_buyer_type_date
  ON product_customer_interactions(customer_id, interaction_type, interaction_date DESC)
  WHERE deleted_at IS NULL;

-- Index for product category filtering
-- This index optimizes queries filtering products by category
-- Note: This index may already exist from previous migrations, but we use IF NOT EXISTS for safety
CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category)
  WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON INDEX idx_interactions_buyer_type_date IS 'Optimizes buyer analysis queries with customer, interaction type, and date filters. Used with JOIN to companies table for buyer filtering.';
COMMENT ON INDEX idx_products_category IS 'Optimizes product category filtering in buyer analysis.';

