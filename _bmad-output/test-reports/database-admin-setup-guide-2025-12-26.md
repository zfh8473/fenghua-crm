# 通过数据库设置管理员指南

**日期：** 2025-12-26  
**目标：** 将 `zfh8473@gmail.com` 设置为管理员

---

## 📋 方法概述

由于没有管理员 token，我们可以直接通过数据库更新用户角色。Twenty CRM 使用 PostgreSQL 数据库存储用户和角色信息。

---

## 🗄️ 数据库结构

Twenty CRM 使用以下表管理用户和角色：

1. **`user`** - 用户基础信息（邮箱、密码等）
2. **`workspaceMember`** - 工作空间成员（关联用户和工作空间）
3. **`workspaceRole`** - 工作空间角色定义（ADMIN, DIRECTOR 等）
4. **`_workspaceMemberToWorkspaceRole`** - 多对多关联表（成员和角色的关联）

---

## 🔧 方法 1: 使用 TypeScript 脚本（推荐）

### 前提条件

1. **安装依赖：**
   ```bash
   cd fenghua-backend
   npm install pg @types/pg
   ```

2. **获取 Twenty CRM 数据库连接字符串：**
   - Twenty CRM 通常运行在 `localhost:3000`
   - 数据库通常在 `localhost:5432`
   - 数据库名可能是 `twenty` 或类似名称
   - 需要数据库用户名和密码

### 使用方法

```bash
cd fenghua-backend

# 设置数据库连接字符串
export TWENTY_DATABASE_URL=postgresql://username:password@localhost:5432/twenty

# 运行脚本
npx ts-node scripts/set-user-admin-db.ts zfh8473@gmail.com
```

### 脚本功能

脚本会自动：
1. ✅ 查找用户 `zfh8473@gmail.com`
2. ✅ 查找用户的 workspace member ID
3. ✅ 查找 ADMIN 角色 ID
4. ✅ 删除用户的旧角色
5. ✅ 添加 ADMIN 角色
6. ✅ 验证更新结果

---

## 🔧 方法 2: 使用 SQL 脚本（手动）

### 前提条件

1. **连接到 Twenty CRM 数据库：**
   ```bash
   psql -h localhost -p 5432 -U postgres -d twenty
   ```

2. **或者使用连接字符串：**
   ```bash
   psql "postgresql://username:password@localhost:5432/twenty"
   ```

### 执行步骤

#### 步骤 1: 查找用户信息

```sql
SELECT 
    u.id as user_id,
    u.email,
    wm.id as workspace_member_id,
    wm."userId" as workspace_user_id
FROM 
    "user" u
LEFT JOIN 
    "workspaceMember" wm ON wm."userId" = u.id
WHERE 
    LOWER(u.email) = LOWER('zfh8473@gmail.com');
```

**记录结果：**
- `workspace_member_id`: _______________

#### 步骤 2: 查找 ADMIN 角色 ID

```sql
SELECT 
    id as role_id,
    name as role_name,
    description
FROM 
    "workspaceRole"
WHERE 
    UPPER(name) LIKE '%ADMIN%'
ORDER BY 
    "createdAt" ASC
LIMIT 1;
```

**记录结果：**
- `role_id`: _______________

#### 步骤 3: 删除旧角色

```sql
-- 替换 :workspace_member_id 为步骤 1 获取的值
DELETE FROM 
    "_workspaceMemberToWorkspaceRole"
WHERE 
    "A" = '<workspace_member_id>';
```

#### 步骤 4: 添加 ADMIN 角色

```sql
-- 替换 :workspace_member_id 和 :admin_role_id 为步骤 1 和 2 获取的值
INSERT INTO 
    "_workspaceMemberToWorkspaceRole" ("A", "B")
VALUES 
    ('<workspace_member_id>', '<admin_role_id>')
ON CONFLICT DO NOTHING;
```

#### 步骤 5: 验证

```sql
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    wm.id as workspace_member_id,
    wr.name as role_name,
    wr.id as role_id
FROM 
    "user" u
JOIN 
    "workspaceMember" wm ON wm."userId" = u.id
JOIN 
    "_workspaceMemberToWorkspaceRole" wmwr ON wmwr."A" = wm.id
JOIN 
    "workspaceRole" wr ON wr.id = wmwr."B"
WHERE 
    LOWER(u.email) = LOWER('zfh8473@gmail.com');
```

应该看到角色为 `ADMIN`。

---

## 🔍 查找 Twenty CRM 数据库连接信息

### 方法 1: 检查 Twenty CRM 环境变量

```bash
# 如果 Twenty CRM 在 Docker 中运行
docker exec -it twenty-crm-container env | grep DATABASE

# 或者检查 .env 文件
cat /path/to/twenty/.env | grep DATABASE
```

### 方法 2: 检查 Twenty CRM 配置

Twenty CRM 的数据库配置通常在：
- `.env` 文件
- `docker-compose.yml` 文件
- 环境变量

### 方法 3: 使用默认连接

如果 Twenty CRM 使用默认配置：
- **Host:** localhost
- **Port:** 5432
- **Database:** twenty (或 postgres)
- **User:** postgres (或 twenty)
- **Password:** 检查 Twenty CRM 的配置

---

## ⚠️ 注意事项

1. **数据库访问权限：**
   - 需要直接访问 Twenty CRM 的 PostgreSQL 数据库
   - 需要足够的权限来更新表

2. **数据备份：**
   - 建议在执行更新前备份数据库
   - 特别是 `_workspaceMemberToWorkspaceRole` 表

3. **表名大小写：**
   - Twenty CRM 使用 Prisma，表名可能是小写或混合大小写
   - 如果表名不存在，尝试不同的命名约定：
     - `workspaceMember` vs `workspace_member`
     - `workspaceRole` vs `workspace_role`

4. **角色名称：**
   - ADMIN 角色可能命名为：
     - `ADMIN`
     - `Admin`
     - `admin`
     - `Workspace Admin`
   - 脚本会查找包含 "ADMIN" 的角色

---

## 📝 完整 SQL 脚本

已创建完整的 SQL 脚本：`fenghua-backend/scripts/set-user-admin-db.sql`

该脚本包含：
- 查找用户的查询
- 查找 ADMIN 角色的查询
- 更新角色的 SQL
- 验证查询

---

## 🚀 快速开始

### 选项 A: 使用 Docker 脚本（最简单，如果 Twenty CRM 在 Docker 中）

```bash
cd fenghua-backend
./scripts/set-user-admin-docker.sh zfh8473@gmail.com
```

**优点：**
- ✅ 自动查找数据库容器
- ✅ 无需手动配置连接字符串
- ✅ 一键执行

### 选项 B: 使用 TypeScript 脚本（需要数据库连接）

```bash
cd fenghua-backend
# pg 和 @types/pg 已安装，无需再次安装
export TWENTY_DATABASE_URL=postgresql://user:password@localhost:5432/twenty
npx ts-node scripts/set-user-admin-db.ts zfh8473@gmail.com
```

**脚本会自动尝试多种连接方式：**
- 环境变量中的连接字符串
- `postgresql://postgres:postgres@localhost:5432/twenty`
- `postgresql://twenty:twenty@localhost:5432/twenty`
- `postgresql://postgres:postgres@localhost:5432/postgres`

### 选项 C: 使用 SQL 脚本（需要手动替换变量）

```bash
# 连接到数据库
psql "postgresql://user:password@localhost:5432/twenty"

# 或者通过 Docker
docker exec -it twenty-db-1 psql -U postgres -d twenty

# 运行脚本（需要先手动替换变量）
\i scripts/set-user-admin-db.sql
```

---

## ✅ 验证

设置完成后，可以：

1. **登录测试：**
   - 使用 `zfh8473@gmail.com` 登录
   - 检查是否有管理员权限

2. **API 测试：**
   - 调用需要管理员权限的 API
   - 验证是否成功

3. **前端测试：**
   - 访问管理员功能页面
   - 验证是否可以访问

---

**注意：** 如果无法访问 Twenty CRM 数据库，可能需要：
1. 检查 Twenty CRM 的部署方式（Docker、本地等）
2. 获取数据库连接信息
3. 或者使用 Twenty CRM 的管理界面手动设置

---

## 🎯 推荐方法

### 如果 Twenty CRM 在 Docker 中运行（最常见）

**使用 Docker 脚本：**
```bash
cd fenghua-backend
./scripts/set-user-admin-docker.sh zfh8473@gmail.com
```

### 如果 Twenty CRM 是本地部署

**使用 TypeScript 脚本：**
```bash
cd fenghua-backend
npx ts-node scripts/set-user-admin-db.ts zfh8473@gmail.com
```

脚本会自动尝试多种连接方式，通常可以自动找到正确的数据库。

