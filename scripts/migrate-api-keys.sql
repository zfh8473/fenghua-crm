-- API Keys 表迁移脚本
-- 用于 n8n 等外部自动化工具访问 CRM API
-- 执行方式：在 Neon 控制台或 psql 中运行

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                        -- 描述性名称，如 "n8n 自动化服务"
  key_hash VARCHAR(64) NOT NULL UNIQUE,              -- SHA-256 哈希，不存储明文
  key_prefix VARCHAR(16) NOT NULL,                   -- 前缀，用于在列表中识别，如 "fh_live_a1b2"
  user_id UUID NOT NULL REFERENCES users(id),        -- 此 Key 以哪个用户身份执行操作
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE api_keys IS '外部服务 API Key，供 n8n 等自动化工具使用';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256(plaintext_key)，明文 Key 仅在创建时返回一次';
COMMENT ON COLUMN api_keys.key_prefix IS '明文 Key 的前 12 位，用于在管理界面识别 Key';
COMMENT ON COLUMN api_keys.user_id IS '此 Key 操作时使用的用户身份（通常是 ADMIN 账户）';
