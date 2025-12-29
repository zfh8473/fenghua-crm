# 环境配置说明

**日期：** 2025-12-26  
**项目：** fenghua-backend

---

## 🗄️ 数据库环境配置

项目配置了两个 Neon PostgreSQL 数据库环境：

### 开发环境（Development）

**数据库名称：** `fenghua-crm-dev`  
**连接字符串：**
```
postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require
```

**用途：**
- 本地开发
- 功能测试
- 数据迁移测试

---

### 生产环境（Production）

**数据库名称：** `fenghua-crm`  
**连接字符串：**
```
postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require
```

**用途：**
- 生产部署
- 真实用户数据

---

## 🔧 环境变量配置

### 创建环境变量文件

**开发环境：**
```bash
cd fenghua-backend
cp .env.example .env.development
# 编辑 .env.development，填入开发环境配置
```

**生产环境：**
```bash
cd fenghua-backend
cp .env.example .env.production
# 编辑 .env.production，填入生产环境配置
```

### 环境变量文件位置

- `.env.development` - 开发环境（已配置数据库连接字符串）
- `.env.production` - 生产环境（已配置数据库连接字符串）
- `.env.example` - 环境变量模板（可提交到 Git）

**注意：** `.env.development` 和 `.env.production` 已添加到 `.gitignore`，不会提交到 Git。

---

## 🚀 运行数据库迁移

### 使用 Neon 迁移脚本（推荐）

```bash
cd fenghua-backend
./scripts/run-migrations-neon.sh
```

脚本会提示您选择环境（开发或生产），然后自动运行所有迁移。

### 手动运行迁移

**开发环境：**
```bash
cd fenghua-backend/migrations

# 运行单个迁移
psql 'postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require' -f 001-create-products-table.sql
```

**生产环境：**
```bash
cd fenghua-backend/migrations

# 运行单个迁移
psql 'postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require' -f 001-create-products-table.sql
```

---

## ✅ 验证数据库连接

### 测试开发环境连接

```bash
psql 'postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require' -c "SELECT current_database(), version();"
```

### 测试生产环境连接

```bash
psql 'postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require' -c "SELECT current_database(), version();"
```

---

## 🔄 切换环境

### 开发环境

```bash
export NODE_ENV=development
npm run start:dev
```

### 生产环境

```bash
export NODE_ENV=production
npm run start:prod
```

---

## 📋 迁移脚本列表

1. **001-create-products-table.sql** - 创建产品表
2. **002-create-interactions-table.sql** - 创建互动记录表
3. **003-create-attachments-table.sql** - 创建附件表
4. **004-create-system-settings-table.sql** - 创建系统设置表

---

## 🔒 安全注意事项

1. **不要提交 `.env` 文件到 Git**
   - `.env.development` 和 `.env.production` 已添加到 `.gitignore`

2. **保护数据库密码**
   - 使用环境变量管理敏感信息
   - 定期轮换数据库密码

3. **使用 SSL 连接**
   - 所有连接字符串都包含 `sslmode=require`

---

**参考文档：**
- [环境配置指南](../docs/environment-setup-guide.md)
- [Neon 数据库配置指南](../docs/neon-database-setup-guide.md)

