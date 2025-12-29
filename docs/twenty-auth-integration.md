# Twenty CRM 认证集成说明

**日期：** 2025-12-25  
**项目：** fenghua-crm

## 重要发现

经过测试，Twenty CRM 的 GraphQL API **没有 `login` mutation**。

## 认证方案

### 方案 A：使用 Twenty 前端登录（推荐 - 当前实现）

**流程：**
1. 用户在 Twenty CRM 前端登录（http://localhost:3000）
2. 获取 JWT token（从浏览器 localStorage 或 cookie）
3. 在 fenghua-crm 中使用该 token 进行 API 调用

**优点：**
- 使用 Twenty 的标准认证流程
- 无需实现自定义登录逻辑
- 完全兼容 Twenty CRM

**缺点：**
- 用户需要在两个系统间切换
- 需要手动获取 token

### 方案 B：代理 Twenty 认证（需要实现）

**流程：**
1. fenghua-crm 前端显示登录表单
2. 后端代理登录请求到 Twenty CRM
3. 返回 token 给前端

**实施：**
- 需要找到 Twenty CRM 的实际认证端点（可能是 REST API）
- 或者通过浏览器自动化获取 token

### 方案 C：统一认证（未来优化）

**流程：**
1. 在 fenghua-crm 前端实现登录
2. 直接调用 Twenty CRM 的认证 API（如果可用）
3. 或者使用 OAuth/SAML 统一认证

## 当前实现状态

### 后端

✅ **已实现：**
- 认证服务框架（`auth.service.ts`）
- 认证控制器（`auth.controller.ts`）
- JWT 认证守卫（`jwt-auth.guard.ts`）
- Token 验证逻辑

⚠️ **需要调整：**
- `auth.service.ts` 中的 `login` 方法需要根据实际 Twenty API 调整
- 可能需要使用 REST 端点而不是 GraphQL

### 前端

✅ **已实现：**
- 登录页面组件（`LoginPage.tsx`）
- 认证服务（`auth.service.ts`）
- 认证 Context（`AuthContext.tsx`）
- 路由保护（`ProtectedRoute.tsx`）

⚠️ **需要调整：**
- 登录 API 调用需要根据后端实际端点调整

## 下一步行动

### 选项 1：使用 Twenty 前端登录（快速方案）

1. 用户在 Twenty CRM 登录（http://localhost:3000）
2. 从浏览器获取 token
3. 在 fenghua-crm 中使用 token

**实施：**
- 修改前端，允许用户输入 token
- 或者从 Twenty 前端自动获取 token（需要浏览器扩展或脚本）

### 选项 2：查找 Twenty 认证端点（推荐）

1. 检查 Twenty CRM 源代码，找到认证端点
2. 更新 `auth.service.ts` 使用正确的端点
3. 测试认证流程

**需要：**
- 访问 Twenty CRM 源代码
-查找认证相关的代码

### 选项 3：使用 REST API（如果可用）

1. 测试 Twenty CRM 的 REST 认证端点
2. 更新后端使用 REST 而不是 GraphQL
3. 实现完整的认证流程

## 临时解决方案

在找到正确的认证端点之前，可以：

1. **手动获取 token：**
   - 在 Twenty CRM 前端登录
   - 从浏览器开发者工具获取 token
   - 在 fenghua-crm 中使用

2. **Token 输入界面：**
   - 在 fenghua-crm 登录页面添加"使用现有 token"选项
   - 允许用户粘贴从 Twenty 获取的 token

3. **继续开发其他功能：**
   - 先实现其他不依赖认证的功能
   - 稍后回来完善认证集成

## 参考

- Twenty CRM 源代码：`~/Documents/GitHub/twenty`
- 认证服务：`fenghua-backend/src/auth/auth.service.ts`
- 前端认证：`fenghua-frontend/src/auth/`

