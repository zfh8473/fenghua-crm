-- Migration: Add indexes for business trend analysis queries
-- Created: 2026-01-12
-- Description: Optimize business trend analysis queries by adding indexes for time-based aggregations
-- Story: 8.6

-- Index for order trends (interaction_date for time-based aggregation)
-- This index optimizes queries aggregating orders by time periods
CREATE INDEX IF NOT EXISTS idx_interactions_date_for_trends
  ON product_customer_interactions(interaction_date DESC, interaction_type)
  WHERE deleted_at IS NULL
    AND interaction_type IN ('order_signed', 'order_completed');

-- Index for customer growth trends (created_at for time-based aggregation)
-- This index optimizes queries aggregating customer creation by time periods
CREATE INDEX IF NOT EXISTS idx_companies_created_at_for_trends
  ON companies(created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for sales trends (interaction_date and additional_info for amount extraction)
-- This index optimizes queries aggregating sales amounts by time periods
CREATE INDEX IF NOT EXISTS idx_interactions_sales_date
  ON product_customer_interactions(interaction_date DESC)
  WHERE deleted_at IS NULL
    AND interaction_type IN ('order_signed', 'order_completed')
    AND additional_info IS NOT NULL
    AND (additional_info ? 'orderAmount' OR additional_info ? 'amount');

-- Add comments
COMMENT ON INDEX idx_interactions_date_for_trends IS 'Optimizes order trend queries with time-based aggregation.';
COMMENT ON INDEX idx_companies_created_at_for_trends IS 'Optimizes customer growth trend queries with time-based aggregation.';
COMMENT ON INDEX idx_interactions_sales_date IS 'Optimizes sales trend queries with time-based aggregation and amount extraction.';

