-- Migration: Extend system_settings table for data retention policy
-- Description: Adds support for per-data-type retention policies (customers, products, interactions, audit logs)
-- Date: 2026-01-14
-- Story: 9.7

-- Update system_settings_key_check constraint to include new retention policy keys
ALTER TABLE system_settings
DROP CONSTRAINT IF EXISTS system_settings_key_check;

ALTER TABLE system_settings
ADD CONSTRAINT system_settings_key_check CHECK (key IN (
  'dataRetentionDays',
  'backupFrequency',
  'backupRetentionDays',
  'emailNotificationsEnabled',
  'notificationRecipients',
  'logLevel',
  'customerDataRetentionDays',
  'productDataRetentionDays',
  'interactionDataRetentionDays',
  'auditLogRetentionDays'
));

-- Insert default retention policy settings
INSERT INTO system_settings (key, value, description, updated_at) VALUES
  ('customerDataRetentionDays', '2555', '客户数据保留天数（默认 7 年/2555 天）', CURRENT_TIMESTAMP),
  ('productDataRetentionDays', '-1', '产品数据保留天数（-1 表示永久保留）', CURRENT_TIMESTAMP),
  ('interactionDataRetentionDays', '2555', '互动记录保留天数（默认 7 年/2555 天）', CURRENT_TIMESTAMP),
  ('auditLogRetentionDays', '3650', '审计日志保留天数（默认 10 年/3650 天）', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

-- Add comments
COMMENT ON COLUMN system_settings.key IS 'Setting key - must match system_settings_key_check constraint';
COMMENT ON COLUMN system_settings.value IS 'Setting value as text (will be parsed by application)';
