-- Migration: Add source_email_message_id for email dedup
-- Run this in Neon console or via psql before deploying backend changes

ALTER TABLE product_customer_interactions
  ADD COLUMN IF NOT EXISTS source_email_message_id VARCHAR(500);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interactions_source_email_msg_id
  ON product_customer_interactions(source_email_message_id)
  WHERE source_email_message_id IS NOT NULL AND deleted_at IS NULL;
