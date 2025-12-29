# 环境配置指南

**日期：** 2025-12-26  
**项目：** fenghua-crm

---

## 📋 环境配置概述

项目支持两个环境：
1. **开发环境（Development）** - 用于本地开发和测试
2. **生产环境（Production）** - 用于生产部署

---

## 🗄️ 数据库配置

### 开发环境

**数据库：** Neon PostgreSQL  
**连接字符串：**
```
postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require
```

**数据库名称：** `fenghua-crm-dev`

---

### 生产环境

**数据库：** Neon PostgreSQL  
**连接字符串：**
```
postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require
```

**数据库名称：** `fenghua-crm`

---

## 🔧 环境变量配置

### 开发环境配置

**文件位置：** `fenghua-backend/.env.development`

**关键配置：**
```env
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d
LOG_LEVEL=debug
PORT=3001
```

---

### 生产环境配置

**文件位置：** `fenghua-backend/.env.production`

**关键配置：**
```env
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require
JWT_SECRET=your-production-secret-key-here-use-strong-random-key
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
PORT=3001
```

---

## 🚀 使用环境变量

### NestJS 配置

项目使用 `@nestjs/config` 模块管理环境变量。配置会自动从以下文件加载：
- `.env.development`（开发环境）
- `.env.production`（生产环境）

**根据 NODE_ENV 自动选择：**
```typescript
// src/app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
})
```

---

## 📝 运行数据库迁移

### 开发环境迁移

```bash
cd fenghua-backend

# 设置环境变量
export DATABASE_URL="postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require"

# 运行迁移脚本
./scripts/run-migrations.sh
```

### 生产环境迁移

```bash
cd fenghua-backend

# 设置环境变量
export DATABASE_URL="postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require"

# 运行迁移脚本（生产环境需要额外确认）
./scripts/run-migrations.sh
```

---

## 🔒 安全注意事项

1. **不要提交 `.env` 文件到 Git**
   - `.env.development` 和 `.env.production` 已添加到 `.gitignore`
   - 只提交 `.env.example` 作为模板

2. **生产环境密钥**
   - 使用强随机密钥生成 `JWT_SECRET`（至少 32 字符）
   - 定期轮换数据库密码和 JWT 密钥
   - 使用环境变量管理敏感信息
   - 在 Vercel 中配置环境变量（生产环境）

3. **数据库连接安全**
   - 使用 SSL 连接（`sslmode=require`）
   - 使用连接池（pooler）减少连接数
   - 限制数据库访问 IP（在 Neon 控制台配置）

---

## ✅ 验证配置

### 测试数据库连接

```bash
# 开发环境
psql 'postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require' -c "SELECT version();"

# 生产环境
psql 'postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require' -c "SELECT version();"
```

### 测试应用连接

```bash
# 开发环境
cd fenghua-backend
NODE_ENV=development npm run start:dev

# 检查健康状态
curl http://localhost:3001/health
```

---

## 📋 下一步

1. **运行开发环境迁移**
   - 在 `fenghua-crm-dev` 数据库中创建定制表

2. **验证表结构**
   - 使用 `verify-migrations.sh` 脚本验证

3. **开始 Epic 2 开发**
   - 使用开发环境数据库进行开发

4. **准备生产环境**
   - 在需要时运行生产环境迁移

---

**参考文档：**
- [Neon 数据库配置指南](neon-database-setup-guide.md)
- [数据库表结构设计](database-schema-design.md)

