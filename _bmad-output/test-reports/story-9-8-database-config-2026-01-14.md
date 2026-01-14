# Story 9-8 Epic 9 回归测试 - 数据库配置说明

**创建日期：** 2026-01-14  
**Story：** 9-8-epic-9-regression-testing

---

## 📋 数据库配置说明

### 项目使用的数据库

项目使用 **Neon PostgreSQL** 数据库，配置了两个环境：

#### 开发环境（Development）

**数据库名称：** `fenghua-crm-dev`  
**连接字符串：**
```
postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require
```

**用途：**
- 本地开发
- 功能测试
- 数据迁移测试

#### 生产环境（Production）

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

### 环境变量文件位置

项目使用 NestJS 的 `ConfigModule`，会自动从以下文件加载环境变量：

- `.env.development` - 开发环境（默认）
- `.env.production` - 生产环境
- `.env.example` - 环境变量模板

**配置文件路径：** `fenghua-backend/.env.development` 或 `fenghua-backend/.env.production`

**注意：** `.env.development` 和 `.env.production` 已添加到 `.gitignore`，不会提交到 Git。

### 环境变量加载方式

根据 `fenghua-backend/src/app.module.ts` 的配置：

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
  ignoreEnvFile: false,
})
```

**默认行为：**
- 如果未设置 `NODE_ENV`，使用 `.env.development`
- 如果设置了 `NODE_ENV=production`，使用 `.env.production`

### 数据库连接变量

项目支持以下环境变量（按优先级）：

1. **DATABASE_URL** - 优先使用
2. **PG_DATABASE_URL** - 备用选项

**代码示例：**
```typescript
const databaseUrl =
  this.configService.get<string>('DATABASE_URL') ||
  this.configService.get<string>('PG_DATABASE_URL');
```

---

## 🚀 配置测试环境

### 方式 1: 使用环境变量文件（推荐）

**创建 `.env.development` 文件：**

```bash
cd fenghua-backend
cat > .env.development << 'EOF'
# 数据库配置
DATABASE_URL=postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require

# JWT 配置
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# 其他配置...
EOF
```

### 方式 2: 使用环境变量

**临时设置（当前终端会话）：**
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require"
```

**永久设置（添加到 `~/.zshrc` 或 `~/.bashrc`）：**
```bash
echo 'export DATABASE_URL="postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require"' >> ~/.zshrc
source ~/.zshrc
```

---

## ✅ 测试执行脚本配置

### 自动加载环境变量

测试执行脚本 `fenghua-backend/scripts/run-epic-9-tests.sh` 已更新，会自动：

1. **检查环境变量文件：**
   - 查找 `.env.development`（如果 `NODE_ENV` 未设置）
   - 查找 `.env.production`（如果 `NODE_ENV=production`）

2. **自动加载配置：**
   - 从环境变量文件中读取 `DATABASE_URL` 或 `PG_DATABASE_URL`
   - 自动导出到当前 shell 环境

3. **验证配置：**
   - 检查是否设置了数据库连接
   - 如果未设置，显示帮助信息

### 使用测试执行脚本

```bash
cd fenghua-backend

# 方式 1: 使用默认开发环境配置
./scripts/run-epic-9-tests.sh

# 方式 2: 使用生产环境配置
NODE_ENV=production ./scripts/run-epic-9-tests.sh

# 方式 3: 手动设置环境变量
export DATABASE_URL="your_database_url"
./scripts/run-epic-9-tests.sh
```

---

## 📝 测试数据种子脚本配置

### 脚本自动读取环境变量

所有测试数据种子脚本都会自动读取环境变量：

- `fenghua-backend/scripts/seed-audit-logs.ts`
- `fenghua-backend/scripts/seed-gdpr-test-data.ts`
- `fenghua-backend/scripts/seed-retention-test-data.ts`

**代码示例：**
```typescript
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.PG_DATABASE_URL ||
  'postgresql://user:password@localhost:5432/fenghua_crm'; // 默认值（仅用于开发）
```

### 执行种子脚本

```bash
cd fenghua-backend

# 方式 1: 使用环境变量文件（如果已创建）
npx ts-node scripts/seed-audit-logs.ts

# 方式 2: 手动设置环境变量
export DATABASE_URL="your_database_url"
npx ts-node scripts/seed-audit-logs.ts
```

---

## 🔍 验证配置

### 检查环境变量

```bash
# 检查 DATABASE_URL
echo $DATABASE_URL

# 检查 PG_DATABASE_URL
echo $PG_DATABASE_URL
```

### 测试数据库连接

```bash
# 使用 psql 测试连接（如果已安装）
psql "$DATABASE_URL" -c "SELECT current_database(), version();"
```

### 验证后端服务配置

```bash
cd fenghua-backend
npm run start:dev

# 查看日志，应该看到：
# PostgreSQL connection pool initialized for AuditService
# PostgreSQL connection pool initialized for DataRetentionService
# ...
```

---

## 📚 参考文档

- `fenghua-backend/README-ENVIRONMENT.md` - 环境配置详细说明
- `fenghua-backend/src/app.module.ts` - 应用模块配置
- `fenghua-backend/src/data-retention/data-retention.service.ts` - 数据库连接示例

---

**最后更新：** 2026-01-14
