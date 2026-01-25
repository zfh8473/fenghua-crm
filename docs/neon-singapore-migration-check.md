# Neon 新加坡迁移后数据检查报告

**检查时间：** 2026-01  
**目标库：** `neondb` @ `ep-super-grass-a1gk4r12-pooler.ap-southeast-1.aws.neon.tech`

---

## 一、表与行数

### 1. 已存在的表及行数

| 表名 | 行数 | 说明 |
|------|------|------|
| users | 3 | 用户 |
| roles | 4 | 角色 |
| user_roles | 3 | 用户-角色 |
| companies | 32 | 客户/公司 |
| people | 0 | 联系人 |
| products | 13 | 产品 |
| product_categories | 12 | 产品分类 |
| product_customer_interactions | 110 | 互动记录 |
| product_customer_associations | 54 | 产品-客户关联 |
| file_attachments | 0 | 附件 |
| audit_logs | 56 | 审计日志 |
| system_settings | 6 | 系统配置 |
| interaction_comments | 1 | 互动评论 |
| gdpr_export_requests | 5 | GDPR 导出请求 |
| gdpr_deletion_requests | 18 | GDPR 删除请求 |

### 2. 外键与数据关系

- **user_roles**：3 条，对应 3 个用户；角色分布：ADMIN(2)、FRONTEND_SPECIALIST(1)、DIRECTOR(0)、BACKEND_SPECIALIST(0)。
- **product_customer_interactions**：未发现 `product_id` 或 `customer_id` 悬空（均能关联到 `products` / `companies`）。
- **product_customer_associations**：未发现 `product_id` 或 `customer_id` 悬空。

### 3. 业务相关

- **companies.customer_type**：BUYER 8，SUPPLIER 10（供仪表盘供应商/采购商分析）。
- **system_settings**：含 `dataRetentionDays`、`backupFrequency`、`backupRetentionDays`、`logLevel`、`emailNotificationsEnabled`、`notificationRecipients`。

---

## 二、缺失的表（需补跑迁移）

与 `fenghua-backend/migrations` 对比，以下表在新库中**不存在**，需要执行对应迁移：

| 缺失表 | 迁移文件 | 用途 |
|--------|----------|------|
| **integrity_validation_reports** | `011-create-integrity-validation-reports-table.sql` | 产品关联完整性校验结果 |
| **import_history** | `017-create-import-history-table.sql` | 导入任务历史（客户/产品导入） |
| | `018-add-import-type-to-import-history.sql` | 为 import_history 增加 import_type |
| | `020-add-error-details-to-import-history.sql` | 为 import_history 增加 error_details |
| **export_history** | `019-create-export-history-table.sql` | 导出任务历史 |
| **encryption_keys** | `030-create-encryption-keys-table.sql` | 加密密钥表（敏感字段加密用） |

**建议执行顺序：**

```bash
cd fenghua-backend
# 从 .env.development 读取 DATABASE_URL（或手动 export）
export $(grep -E '^DATABASE_URL=' .env.development | xargs)

psql "$DATABASE_URL" -f migrations/011-create-integrity-validation-reports-table.sql
psql "$DATABASE_URL" -f migrations/017-create-import-history-table.sql
psql "$DATABASE_URL" -f migrations/018-add-import-type-to-import-history.sql
psql "$DATABASE_URL" -f migrations/019-create-export-history-table.sql
psql "$DATABASE_URL" -f migrations/020-add-error-details-to-import-history.sql
psql "$DATABASE_URL" -f migrations/030-create-encryption-keys-table.sql
```

---

## 三、可选迁移（按需执行）

- **028-add-sensitive-fields-to-companies.sql**：为 `companies` 增加 `bank_account`、`id_number`。若业务需要存敏感信息且做加密，可执行；当前 `companies` 无这两列。
- **029-add-encryption-fields-to-companies.sql**：为 `companies` 增加 `encryption_key_version`、`encrypted_notes` 等加密相关列，依赖 `encryption_keys` 表，故应在 **030** 之后执行。若未使用客户敏感字段加密，可暂不跑。

---

## 四、结论

- **已有数据**：用户、角色、客户、产品、互动、关联、审计、GDPR、系统配置等核心表均存在且行数合理，未发现外键悬空。
- **缺失结构**：`integrity_validation_reports`、`import_history`、`export_history`、`encryption_keys` 四张表及 `import_history` 的若干字段未创建；在用到**导入、导出、产品关联完整性校验、加密密钥**前，需先按上面顺序执行对应迁移。
- **可选**：若需要客户银行账号、身份证号及加密能力，再依次执行 `028-add-sensitive-fields-to-companies.sql`、`030-create-encryption-keys-table.sql`、`029-add-encryption-fields-to-companies.sql`。
