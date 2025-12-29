# 数据库连接修复 - 统一使用 dev 环境

**日期：** 2025-12-26  
**问题：** AuthService 连接了错误的数据库  
**解决方案：** 统一连接到 Twenty CRM 数据库（Docker）

---

## 🔍 问题分析

### 发现的问题

1. **数据库混淆：**
   - `DATABASE_URL` 指向 Neon 的 `fenghua-crm-dev`（fenghua-crm 自己的数据库）
   - 但用户角色信息存储在 Twenty CRM 的数据库中（Docker 容器 `twenty-db-1`）

2. **数据库验证：**
   - ✅ 已验证 Twenty CRM 数据库中用户角色为 "Admin"
   - ✅ 数据库连接字符串：`postgresql://postgres:postgres@localhost:5432/default`

---

## ✅ 已完成的修复

### 1. 更新了 AuthService 数据库连接逻辑

**文件：** `fenghua-backend/src/auth/auth.service.ts`

**修改：**
- 优先使用 `TWENTY_DATABASE_URL`（Twenty CRM 数据库）
- 如果未配置，使用默认 Docker 连接：`postgresql://postgres:postgres@localhost:5432/default`
- **不再使用** `DATABASE_URL`（那是 fenghua-crm 的数据库）

### 2. 需要手动配置环境变量

**文件：** `fenghua-backend/.env.development`

**需要添加：**
```env
# Twenty CRM 数据库（Docker - 用于用户、角色等 Twenty CRM 数据）
TWENTY_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/default
```

**完整配置示例：**
```env
# fenghua-crm 数据库（Neon - 用于产品等定制数据）
DATABASE_URL=postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require

# Twenty CRM 数据库（Docker - 用于用户、角色等 Twenty CRM 数据）
TWENTY_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/default

# Twenty CRM API 配置
TWENTY_API_URL=http://localhost:3000/graphql
TWENTY_ORIGIN=http://localhost:3000
```

---

## 🚀 配置步骤

### 方法 1：编辑 `.env.development` 文件（推荐）

```bash
cd fenghua-backend
nano .env.development
# 或
code .env.development
```

添加以下行：
```env
TWENTY_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/default
```

### 方法 2：使用环境变量（临时）

```bash
export TWENTY_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/default
cd fenghua-backend
npm run start:dev
```

---

## ✅ 验证

### 1. 检查后端日志

重启后端后，应该看到：
```
PostgreSQL connection pool initialized for AuthService (Twenty CRM database)
```

如果看到警告：
```
TWENTY_DATABASE_URL not configured, using default Docker connection for Twenty CRM database
```

说明使用了默认连接（也可以工作）。

### 2. 测试登录

1. 清除浏览器缓存
2. 重新登录
3. 检查角色是否显示为 "ADMIN"

### 3. 检查数据库查询日志

登录时应该看到：
```
Found role ADMIN for user zfh8473@gmail.com from database (core schema)
Successfully retrieved role ADMIN for user zfh8473@gmail.com from database after fallback
```

---

## 📝 数据库连接说明

### 两个数据库的用途

1. **Twenty CRM 数据库（Docker）：**
   - 连接：`postgresql://postgres:postgres@localhost:5432/default`
   - 用途：用户、角色、工作空间等 Twenty CRM 核心数据
   - 环境变量：`TWENTY_DATABASE_URL`

2. **fenghua-crm 数据库（Neon）：**
   - 连接：`postgresql://neondb_owner:...@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev`
   - 用途：产品、互动记录等 fenghua-crm 定制数据
   - 环境变量：`DATABASE_URL`

---

## 🔧 技术细节

### SQL 查询（已验证）

```sql
SELECT
  r.label as role_name
FROM
  core."user" u
JOIN
  core."userWorkspace" uw ON uw."userId" = u.id
JOIN
  core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
JOIN
  core."role" r ON r.id = rt."roleId"
WHERE
  LOWER(u.email) = LOWER('zfh8473@gmail.com')
LIMIT 1;
```

**结果：** `Admin` ✅

---

**下一步：**
1. 在 `.env.development` 中添加 `TWENTY_DATABASE_URL`
2. 重启后端服务
3. 清除浏览器缓存并重新登录
4. 验证角色显示为 "ADMIN"

