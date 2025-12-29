# 角色显示问题 - 直接数据库查询修复

**日期：** 2025-12-26  
**问题：** 登录后仍然显示角色为 "user"  
**解决方案：** 直接从数据库查询角色，绕过 GraphQL API 限制

---

## ✅ 已实现的修复

### 1. 添加数据库连接池

**文件：** `fenghua-backend/src/auth/auth.service.ts`

- 添加了 `pg.Pool` 连接池
- 实现了 `initializeDatabaseConnection()` 方法
- 支持 `TWENTY_DATABASE_URL` 和 `DATABASE_URL` 环境变量
- 实现了 `onModuleDestroy()` 清理连接池

### 2. 实现数据库角色查询

**方法：** `getUserRoleFromDatabase(email: string)`

- 支持两种数据库 schema：
  - **Pattern 1:** `core` schema（Twenty CRM 默认）
    - 查询 `core."user"`, `core."userWorkspace"`, `core."roleTarget"`, `core."role"`
  - **Pattern 2:** `public` schema（备选）
    - 查询 `"user"`, `"workspaceMember"`, `"_workspaceMemberToWorkspaceRole"`, `"workspaceRole"`

### 3. 角色名称映射

**方法：** `mapRoleNameToUserRole(roleName: string)`

- 将数据库中的角色名称映射到 `UserRole` enum：
  - "Admin" → `ADMIN`
  - "Director" → `DIRECTOR`
  - "Frontend" 或 "Buyer" → `FRONTEND_SPECIALIST`
  - "Backend" 或 "Supplier" → `BACKEND_SPECIALIST`
  - 其他 → `user`

### 4. 集成到登录流程

**修改：** `login()` 方法的 fallback 逻辑

- 当 `getUserFromLoginToken` 失败时
- Fallback 到 `extractUserFromLoginToken`（从 JWT payload 提取 email）
- 然后使用 `getUserRoleFromDatabase()` 从数据库查询角色
- 如果查询成功，更新 `user.role`

---

## 🔧 技术细节

### 数据库连接配置

**环境变量：**
- `TWENTY_DATABASE_URL` - Twenty CRM 数据库连接字符串（优先）
- `DATABASE_URL` - 备用数据库连接字符串

**连接池配置：**
- `max: 5` - 最大连接数（适合认证服务的负载）

### SQL 查询逻辑

**Pattern 1 (core schema):**
```sql
SELECT r.label as role_name
FROM core."user" u
JOIN core."userWorkspace" uw ON uw."userId" = u.id
JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
JOIN core."role" r ON r.id = rt."roleId"
WHERE LOWER(u.email) = LOWER($1)
LIMIT 1;
```

**Pattern 2 (public schema):**
```sql
SELECT r.name as role_name
FROM "user" u
JOIN "workspaceMember" wm ON wm."userId" = u.id
JOIN "_workspaceMemberToWorkspaceRole" wmr ON wmr."A" = wm.id
JOIN "workspaceRole" r ON r.id = wmr."B"
WHERE LOWER(u.email) = LOWER($1)
LIMIT 1;
```

---

## 🚀 下一步

### 1. 配置环境变量

确保后端服务配置了正确的数据库连接字符串：

**开发环境：**
```bash
export TWENTY_DATABASE_URL=postgresql://user:password@host:port/database
```

**或者使用 Docker：**
```bash
export TWENTY_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/default
```

### 2. 测试

1. 清除浏览器缓存
2. 重新登录
3. 检查角色是否正确显示为 "ADMIN"

### 3. 验证数据库连接

检查后端日志，应该看到：
```
PostgreSQL connection pool initialized for AuthService
```

如果看到警告：
```
TWENTY_DATABASE_URL or DATABASE_URL not configured
```

需要配置环境变量。

---

## 📝 日志输出

**成功查询角色：**
```
Found role ADMIN for user zfh8473@gmail.com from database (core schema)
Successfully retrieved role ADMIN for user zfh8473@gmail.com from database after fallback
```

**查询失败：**
```
No role found in database for user zfh8473@gmail.com, will use default user role
```

**数据库连接失败：**
```
Error querying role from database for user zfh8473@gmail.com: [error message]
```

---

## ✅ 优势

1. **可靠性：** 不依赖 GraphQL API，直接查询数据库
2. **性能：** 数据库查询通常比 GraphQL API 更快
3. **灵活性：** 支持多种数据库 schema
4. **容错性：** 如果数据库查询失败，仍然使用默认角色，不会导致登录失败

---

**注意：** 
- 数据库中的角色已正确设置为 "Admin"
- 所有代码修复已完成
- 需要配置 `TWENTY_DATABASE_URL` 环境变量
- 清除浏览器缓存并重新登录以查看更改

