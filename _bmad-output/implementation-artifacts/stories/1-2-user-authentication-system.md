# Story 1.2: 用户认证系统

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **使用用户名和密码登录系统**,
So that **我可以访问系统并执行我的角色权限范围内的操作**.

## Acceptance Criteria

1. **Given** 用户账户已创建（由管理员创建）
   **When** 用户在登录页面输入正确的用户名和密码
   **Then** 系统验证用户凭据
   **And** 用户成功登录，跳转到系统主页
   **And** 系统生成并返回 JWT token
   **And** 用户的角色信息被正确加载

2. **Given** 用户在登录页面输入错误的用户名或密码
   **When** 用户点击登录按钮
   **Then** 系统显示错误消息"用户名或密码错误"
   **And** 用户保持在登录页面
   **And** 系统不生成 token

3. **Given** 用户已登录
   **When** 用户点击登出按钮
   **Then** 用户成功登出，JWT token 被清除
   **And** 用户被重定向到登录页面
   **And** 用户无法再访问需要认证的页面

4. **Given** 用户尝试访问需要认证的页面但未登录
   **When** 系统检测到未认证的请求
   **Then** 用户被重定向到登录页面
   **And** 系统保存原始请求 URL，登录后可以重定向回去

## Tasks / Subtasks

- [x] Task 1: 后端认证服务 (AC: #1, #2)
  - [x] 创建认证模块 (auth.module.ts)
  - [x] 创建认证服务 (auth.service.ts) - 调用 Twenty API 进行认证
  - [x] 创建认证控制器 (auth.controller.ts) - 提供登录/登出端点
  - [x] 实现 JWT token 管理
  - [x] 实现用户信息获取（包括角色）

- [x] Task 2: 后端认证守卫 (AC: #4)
  - [x] 创建 JWT 认证守卫 (jwt-auth.guard.ts)
  - [x] 实现 token 验证逻辑
  - [x] 实现未认证请求重定向逻辑
  - [x] 集成到应用模块

- [x] Task 3: 前端登录组件 (AC: #1, #2)
  - [x] 创建登录页面组件 (LoginPage.tsx)
  - [x] 创建登录表单组件 (LoginForm.tsx)
  - [x] 实现表单验证
  - [x] 实现错误消息显示
  - [x] 实现登录状态管理

- [x] Task 4: 前端认证服务 (AC: #1, #3)
  - [x] 创建认证服务 (auth.service.ts)
  - [x] 实现登录 API 调用
  - [x] 实现登出功能
  - [x] 实现 token 存储（localStorage）
  - [x] 实现 token 刷新逻辑

- [x] Task 5: 前端路由保护 (AC: #4)
  - [x] 创建认证路由守卫
  - [x] 实现未认证重定向
  - [x] 实现登录后重定向到原始 URL
  - [x] 保护需要认证的路由

- [x] Task 6: 前端用户状态管理 (AC: #1)
  - [x] 创建用户状态 Context/Store
  - [x] 实现用户信息加载
  - [x] 实现角色信息管理
  - [x] 实现登录状态持久化

- [x] Task 7: 集成测试 (AC: #1, #2, #3, #4)
  - [x] 测试登录成功流程
  - [x] 测试登录失败流程
  - [x] 测试登出流程
  - [x] 测试路由保护
  - [x] 测试 token 过期处理

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **Authentication Method:** JWT-based authentication (provided by Twenty CRM)
  - Source: [architecture.md#Authentication Method](_bmad-output/architecture.md#authentication-method)
- **API Integration Architecture:** All authentication through Twenty CRM API, not direct modification
  - Source: [api-integration-architecture.md](docs/api-integration-architecture.md)
- **Security:** Token storage in localStorage (frontend), secure transmission via HTTPS
  - Source: [architecture.md#Security](_bmad-output/architecture.md#security)

### Source Tree Components to Touch

**Backend:**
- `fenghua-backend/src/auth/` - Authentication module (NEW)
  - `auth.module.ts` - Auth module
  - `auth.service.ts` - Auth service (calls Twenty API)
  - `auth.controller.ts` - Auth endpoints
  - `jwt-auth.guard.ts` - JWT authentication guard
  - `dto/login.dto.ts` - Login DTO
  - `dto/auth-response.dto.ts` - Auth response DTO

**Frontend:**
- `fenghua-frontend/src/auth/` - Authentication module (NEW)
  - `LoginPage.tsx` - Login page component
  - `LoginForm.tsx` - Login form component
  - `auth.service.ts` - Auth service (API calls)
  - `auth.context.tsx` - Auth context for state management
  - `ProtectedRoute.tsx` - Route protection component

**Services:**
- `fenghua-backend/src/services/twenty-client/` - Extend with auth methods
- `fenghua-frontend/src/services/twenty-api/` - Extend with auth methods

### Testing Standards Summary

- **Unit Tests:**
  - Auth service methods
  - Token validation logic
  - Error handling
- **Integration Tests:**
  - Login flow (success and failure)
  - Logout flow
  - Route protection
- **E2E Tests:**
  - Complete authentication flow
  - Protected route access

### Project Structure Notes

- **Alignment with API Integration Architecture:**
  - All authentication through Twenty CRM API
  - No direct modification of Twenty code
  - Custom code in `fenghua-backend` and `fenghua-frontend`
- **Detected Conflicts or Variances:**
  - Need to determine Twenty CRM authentication endpoint
  - May need to use REST endpoint instead of GraphQL for login

### References

- **Epic Definition:** [epics.md#Story 1.2](_bmad-output/epics.md#story-12-用户认证系统)
- **Architecture Authentication:** [architecture.md#Authentication & Security](_bmad-output/architecture.md#authentication--security)
- **API Integration Architecture:** [api-integration-architecture.md](docs/api-integration-architecture.md)
- **Implementation Notes from Epic:** [epics.md#Implementation Notes](_bmad-output/epics.md#implementation-notes)

### Key Technical Details

- **Twenty CRM Authentication:**
  - May use REST endpoint: `POST /auth/login` or GraphQL mutation
  - Returns JWT token on successful login
  - Token should be included in subsequent requests as `Authorization: Bearer <token>`
- **Token Storage:**
  - Frontend: localStorage (for persistence)
  - Backend: Validate token on each request
- **Token Format:**
  - JWT token containing user ID and role information
- **Session Management:**
  - Stateless (JWT-based)
  - Token expiration handling required

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Assistant)

### Debug Log References

### Completion Notes List

- **2025-12-25**: 后端认证服务创建完成，包括 `AuthService`, `AuthController`, `AuthModule`，以及相关的 DTOs 和 Guards。实现了与 Twenty CRM API 的集成，包括登录、token 验证、用户信息获取等功能。
- **2025-12-25**: 前端认证组件创建完成，包括 `LoginPage`, `AuthContext`, `ProtectedRoute` 等组件。实现了登录表单、状态管理、路由保护等功能。
- **2025-12-25**: 集成测试创建完成，包括后端单元测试 (`auth.service.spec.ts`)、前端单元测试 (`auth.service.test.ts`)、以及集成测试 (`auth.integration.spec.ts`)。所有测试覆盖了登录成功/失败流程、登出流程、路由保护和 token 验证。

### File List

**Backend Files:**
- `fenghua-backend/src/auth/auth.module.ts` - Auth module
- `fenghua-backend/src/auth/auth.service.ts` - Auth service (calls Twenty API)
- `fenghua-backend/src/auth/auth.controller.ts` - Auth REST API controller
- `fenghua-backend/src/auth/guards/jwt-auth.guard.ts` - JWT authentication guard
- `fenghua-backend/src/auth/dto/login.dto.ts` - Login DTO
- `fenghua-backend/src/auth/dto/auth-response.dto.ts` - Auth response DTO
- `fenghua-backend/src/auth/auth.service.spec.ts` - Unit tests for AuthService (NEW)
- `fenghua-backend/src/auth/auth.integration.spec.ts` - Integration tests (NEW)

**Frontend Files:**
- `fenghua-frontend/src/auth/LoginPage.tsx` - Login page component
- `fenghua-frontend/src/auth/LoginPage.css` - Login page styles
- `fenghua-frontend/src/auth/AuthContext.tsx` - Auth context for state management
- `fenghua-frontend/src/auth/auth.service.ts` - Frontend auth service (API calls)
- `fenghua-frontend/src/auth/ProtectedRoute.tsx` - Route protection component
- `fenghua-frontend/src/auth/components/RoleProtectedRoute.tsx` - Role-based route protection
- `fenghua-frontend/src/auth/auth.service.test.ts` - Unit tests for frontend auth service (NEW)

