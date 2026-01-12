-- Migration: Add product association analysis performance indexes
-- Date: 2026-01-12
-- Description: Add indexes to optimize product association analysis queries
-- Story: 8.2

-- Composite index for product association analysis queries (product, type, date)
-- This index optimizes queries filtering by product_id, interaction_type, and interaction_date
CREATE INDEX IF NOT EXISTS idx_interactions_product_type_date 
  ON product_customer_interactions(product_id, interaction_type, interaction_date DESC) 
  WHERE deleted_at IS NULL;

-- Index for category filtering
-- This index optimizes queries filtering products by category
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category) 
  WHERE deleted_at IS NULL;

-- Index for customer type filtering (if frequently used)
-- This index optimizes queries filtering companies by customer_type
CREATE INDEX IF NOT EXISTS idx_companies_customer_type 
  ON companies(customer_type) 
  WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON INDEX idx_interactions_product_type_date IS 'Optimizes product association analysis queries with product, type, and date filters.';
COMMENT ON INDEX idx_products_category IS 'Optimizes product filtering by category in association analysis.';
COMMENT ON INDEX idx_companies_customer_type IS 'Optimizes customer type filtering in association analysis.';

