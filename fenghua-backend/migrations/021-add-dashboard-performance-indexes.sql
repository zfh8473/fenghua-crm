-- Migration: Add dashboard performance indexes
-- Date: 2026-01-11
-- Description: Add indexes to optimize dashboard queries for monthly statistics
-- Story: 8.1

-- Create index on companies.created_at for monthly new customers query
-- This index optimizes the query: COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))
CREATE INDEX IF NOT EXISTS idx_companies_created_at 
  ON companies(created_at DESC) 
  WHERE deleted_at IS NULL;

-- Note: idx_interactions_date already exists (created in migration 002)
-- This index optimizes: COUNT(*) FILTER (WHERE interaction_date >= DATE_TRUNC('month', CURRENT_DATE))
-- Verify it exists: idx_interactions_date on product_customer_interactions(interaction_date DESC)

-- Add comments
COMMENT ON INDEX idx_companies_created_at IS 'Index for dashboard monthly new customers query (optimizes created_at filter)';

