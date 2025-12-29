-- Migration: Create system_settings table
-- Description: Creates the system_settings table for storing system configuration
-- Date: 2025-12-26

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  CONSTRAINT system_settings_key_check CHECK (key IN (
    'dataRetentionDays',
    'backupFrequency',
    'backupRetentionDays',
    'emailNotificationsEnabled',
    'notificationRecipients',
    'logLevel'
  ))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

-- Insert default settings
INSERT INTO system_settings (key, value, description, updated_at) VALUES
  ('dataRetentionDays', '2555', '数据保留天数（默认 7 年，符合财务记录要求）', CURRENT_TIMESTAMP),
  ('backupFrequency', 'daily', '备份频率：daily（每日）、weekly（每周）、monthly（每月）', CURRENT_TIMESTAMP),
  ('backupRetentionDays', '30', '备份保留天数（默认 30 天）', CURRENT_TIMESTAMP),
  ('emailNotificationsEnabled', 'false', '邮件通知开关（默认关闭）', CURRENT_TIMESTAMP),
  ('notificationRecipients', '[]', '通知接收人邮箱列表（JSON 数组）', CURRENT_TIMESTAMP),
  ('logLevel', 'info', '日志级别：error、warn、info、debug（默认 info）', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

