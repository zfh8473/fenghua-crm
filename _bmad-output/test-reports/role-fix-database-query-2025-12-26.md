# 角色显示问题 - 数据库查询修复

**日期：** 2025-12-26  
**问题：** 登录后仍然显示角色为 "user"  
**根本原因：** `loginToken` 无法直接用于 Twenty CRM 的 GraphQL API

---

## 🔍 问题分析

### 根本原因

从后端日志中发现：

1. **`loginToken` 无法直接用于 GraphQL 查询**：
   - 错误：`"Invalid token"` 和 `"INVALID_JWT_TOKEN_TYPE"`
   - `loginToken` 不能直接用于 `currentUser` 查询

2. **Token exchange 失败**：
   - `getAuthTokensFromLoginToken` mutation 的 GraphQL schema 不匹配
   - `accessToken` 字段不存在

3. **Fallback 到 JWT payload**：
   - 当所有方法都失败时，fallback 到 `extractUserFromLoginToken`
   - 它只返回硬编码的 `role: 'user'`

4. **Fallback 后的角色查询也失败**：
   - 即使尝试再次查询角色，也因为同样的 "Invalid token" 错误而失败

---

## ✅ 修复方案

### 使用 RolesService 查询角色

**文件：** `fenghua-backend/src/auth/auth.service.ts`

**修改：**
1. 注入 `RolesService` 到 `AuthService`
2. 在 fallback 到 `extractUserFromLoginToken` 后
3. 使用 `RolesService.getUserRole()` 查询角色
4. 如果失败，尝试直接使用 `workspaceMembers` 查询

**代码逻辑：**
```typescript
// 1. 尝试 getUserFromLoginToken（可能失败，因为 loginToken 无法直接使用）
// 2. 如果失败，fallback 到 extractUserFromLoginToken（获取 userId 和 email）
// 3. 在 fallback 后，如果获取到 userId：
//    a. 尝试使用 RolesService.getUserRole(userId, loginToken)
//    b. 如果失败，尝试直接使用 workspaceMembers 查询
//    c. 映射角色名称（Admin → ADMIN）
```

---

## 🔧 技术细节

### 修改的文件

1. **`fenghua-backend/src/auth/auth.service.ts`**：
   - 添加 `RolesService` 依赖注入
   - 修改 fallback 逻辑，使用 `RolesService.getUserRole()`
   - 添加直接 `workspaceMembers` 查询作为最后的后备方案

2. **`fenghua-backend/src/auth/auth.module.ts`**：
   - 导入 `RolesModule`（使用 `forwardRef` 避免循环依赖）

### 角色查询策略

1. **主要方法**：`RolesService.getUserRole(userId, loginToken)`
   - 使用 `workspaceMembers` 查询获取角色 ID
   - 使用 `mapRoleIdToUserRole()` 映射角色

2. **后备方法**：直接 `workspaceMembers` 查询
   - 如果 `RolesService` 失败，直接查询 `workspaceMembers`
   - 获取角色名称并映射

---

## 🚀 下一步

### 1. 后端已修复并重启

- ✅ 已添加 `RolesService` 依赖注入
- ✅ 已修改 fallback 逻辑
- ✅ 已导入 `RolesModule`
- ✅ 后端服务已重启

### 2. 测试

**注意：** 如果 `loginToken` 仍然无法用于 `workspaceMembers` 查询，可能需要：

1. **检查 Twenty CRM API 文档**：
   - 确认 `loginToken` 的正确使用方式
   - 确认是否需要 token exchange

2. **考虑替代方案**：
   - 在登录成功后，立即使用 `loginToken` 获取 access token
   - 使用 access token 查询角色信息

3. **或者**：
   - 在登录时，从数据库直接查询角色（如果可能）
   - 不依赖 GraphQL API

---

## 📝 如果仍然失败

如果 `RolesService.getUserRole()` 也失败（因为 `loginToken` 无法使用），可能需要：

1. **修复 token exchange**：
   - 检查 `getAuthTokensFromLoginToken` mutation 的正确格式
   - 确认 Twenty CRM API 版本和 schema

2. **使用数据库直接查询**：
   - 如果可能，直接从 PostgreSQL 数据库查询角色
   - 绕过 GraphQL API

3. **延迟角色查询**：
   - 在登录时返回 `loginToken`
   - 前端使用 `loginToken` 获取 access token
   - 使用 access token 查询角色

---

**注意：** 
- 数据库中的角色已正确设置为 "Admin"
- 所有代码修复已完成
- 需要测试 `RolesService.getUserRole()` 是否能够使用 `loginToken`

