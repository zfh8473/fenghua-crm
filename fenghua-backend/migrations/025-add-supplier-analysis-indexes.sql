-- Migration: Add supplier analysis performance indexes
-- Date: 2026-01-12
-- Description: Add indexes to optimize supplier analysis queries
-- Story: 8.4

-- Composite index for supplier analysis queries (customer_id, interaction_type, interaction_date)
-- This index optimizes queries filtering by customer_id (SUPPLIER), interaction_type, and interaction_date
CREATE INDEX IF NOT EXISTS idx_interactions_supplier_type_date
  ON product_customer_interactions(customer_id, interaction_type, interaction_date DESC)
  WHERE deleted_at IS NULL
    AND customer_id IN (SELECT id FROM companies WHERE customer_type = 'SUPPLIER' AND deleted_at IS NULL);

-- Index for product category filtering
-- This index optimizes queries filtering products by category
CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category)
  WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON INDEX idx_interactions_supplier_type_date IS 'Optimizes supplier analysis queries with supplier, interaction type, and date filters.';
COMMENT ON INDEX idx_products_category IS 'Optimizes product category filtering in supplier analysis.';

