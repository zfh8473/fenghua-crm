# 角色显示问题最终修复

**日期：** 2025-12-26  
**问题：** 登录后仍然显示角色为 "user"  
**根本原因：** `getUserFromLoginToken` 失败时，fallback 到 `extractUserFromLoginToken` 总是返回 `role: 'user'`

---

## 🔍 问题分析

### 根本原因

1. **登录流程：**
   - `login()` 方法调用 `getUserFromLoginToken(loginToken)`
   - 如果失败，fallback 到 `extractUserFromLoginToken(loginToken)`
   - `extractUserFromLoginToken` 硬编码返回 `role: 'user'`

2. **为什么 `getUserFromLoginToken` 会失败：**
   - `loginToken` 可能无法直接用于 GraphQL 查询
   - 需要 token exchange，但可能失败
   - 导致总是使用 JWT payload fallback

3. **JWT payload fallback 的问题：**
   - JWT payload 中不包含角色信息
   - 只能提取 `userId` 和 `email`
   - 硬编码返回 `role: 'user'`

---

## ✅ 修复方案

### 修复 `login()` 方法中的 fallback 逻辑

**文件：** `fenghua-backend/src/auth/auth.service.ts`

**修改：**
- 在 fallback 到 `extractUserFromLoginToken` 后
- 如果成功获取到 `userId`，再次尝试使用 `loginToken` 查询角色
- 使用简单的 GraphQL 查询获取 `workspaceMember.roles`
- 正确映射角色名称

**代码逻辑：**
```typescript
// 1. 尝试 getUserFromLoginToken（已修复，会获取角色名称）
// 2. 如果失败，fallback 到 extractUserFromLoginToken（只获取 userId 和 email）
// 3. 在 fallback 后，如果获取到 userId，再次尝试查询角色
// 4. 使用 loginToken 直接查询 currentUser.workspaceMember.roles
// 5. 映射角色名称（Admin → ADMIN）
```

---

## 🚀 解决步骤

### 1. 后端已修复并重启

- ✅ 已修复 `login()` 方法中的 fallback 逻辑
- ✅ 已修复 `getUserFromLoginToken()` 方法中的角色查询
- ✅ 已修复 `validateToken()` 方法中的角色查询
- ✅ 后端服务已重启

### 2. 清除浏览器缓存并重新登录

**重要：** 必须清除 localStorage 并重新登录，因为：
- 旧的 token 可能包含错误的角色信息
- 前端缓存了旧的用户信息

**步骤：**
1. 打开浏览器开发者工具（F12）
2. 转到 Application > Local Storage > `http://localhost:3005`
3. 删除以下项：
   - `fenghua_auth_token`
   - `fenghua_user`
4. 刷新页面或重新访问 `http://localhost:3005/login`
5. 使用 `zfh8473@gmail.com` 登录

### 3. 验证

登录后应该看到：
- ✅ 角色显示为 "ADMIN"（而不是 "user"）
- ✅ 显示管理员功能链接
- ✅ 可以访问管理员功能页面

---

## 🔧 技术细节

### 修复的代码位置

1. **`login()` 方法（第 63-72 行）：**
   - 添加了 fallback 后的角色查询逻辑
   - 使用 `loginToken` 直接查询角色

2. **`getUserFromLoginToken()` 方法（第 104-160 行）：**
   - 修复了 GraphQL 查询，获取 `name` 字段
   - 添加了角色名称映射逻辑

3. **`validateToken()` 方法（第 311-361 行）：**
   - 修复了 GraphQL 查询，获取 `name` 字段
   - 添加了角色名称映射逻辑

### 角色映射规则

- **"Admin"** → `ADMIN`
- **"Director"** → `DIRECTOR`
- **"Frontend"** 或 **"Buyer"** → `FRONTEND_SPECIALIST`
- **"Backend"** 或 **"Supplier"** → `BACKEND_SPECIALIST`
- 其他 → 保持原值或 `user`

---

## 📝 如果仍然显示 "user"

如果重新登录后仍然显示 "user"，请检查：

1. **后端日志：**
   ```bash
   tail -f /tmp/fenghua-backend.log | grep -i "role\|admin\|warn\|error"
   ```

2. **浏览器控制台：**
   - 打开开发者工具（F12）
   - 查看 Console 标签
   - 查看 Network 标签，检查 `/auth/login` 请求的响应

3. **验证数据库：**
   ```bash
   docker exec twenty-db-1 psql -U postgres -d default -c "SELECT u.email, r.label FROM core.\"user\" u JOIN core.\"userWorkspace\" uw ON uw.\"userId\" = u.id JOIN core.\"roleTarget\" rt ON rt.\"userWorkspaceId\" = uw.id JOIN core.role r ON r.id = rt.\"roleId\" WHERE LOWER(u.email) = LOWER('zfh8473@gmail.com');"
   ```

---

**注意：** 
- 数据库中的角色已正确设置为 "Admin"
- 所有代码修复已完成
- 必须清除浏览器缓存并重新登录才能看到正确的角色

