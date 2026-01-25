-- Migration: Add 'order_follow_up' (进度跟进) to interaction_type CHECK constraint
-- Date: 2026-01-21
-- Description: The frontend FrontendInteractionType.ORDER_FOLLOW_UP = 'order_follow_up' was
--   missing from the DB CHECK, causing UPDATE to fail when user selected "进度跟进".

-- Drop existing CHECK constraint
ALTER TABLE product_customer_interactions
  DROP CONSTRAINT IF EXISTS interactions_type_check;

-- Re-add CHECK with 'order_follow_up' included (采购商: 进度跟进)
ALTER TABLE product_customer_interactions
  ADD CONSTRAINT interactions_type_check CHECK (
    interaction_type IN (
      -- 采购商互动类型
      'initial_contact',
      'product_inquiry',
      'quotation',
      'quotation_accepted',
      'quotation_rejected',
      'order_signed',
      'order_follow_up',       -- 进度跟进 (was missing)
      'order_completed',
      -- 供应商互动类型
      'product_inquiry_supplier',
      'quotation_received',
      'specification_confirmed',
      'production_progress',
      'pre_shipment_inspection',
      'shipped'
    )
  );
