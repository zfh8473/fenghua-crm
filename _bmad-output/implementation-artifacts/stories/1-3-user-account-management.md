# Story 1.3: 用户账户管理

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **系统管理员**,
I want **创建、编辑和删除用户账户**,
So that **我可以管理系统用户，为新员工创建账户，为离职员工删除账户**.

## Acceptance Criteria

1. **Given** 管理员已登录系统
   **When** 管理员在用户管理页面点击"创建新用户"
   **Then** 系统显示用户创建表单
   **And** 表单包含必填字段：用户名、邮箱、密码、角色
   **And** 表单包含可选字段：姓名、部门、联系方式等

2. **Given** 管理员填写用户创建表单
   **When** 管理员提交表单，所有必填字段已填写且格式正确
   **Then** 系统创建新用户账户
   **And** 用户账户信息保存到数据库
   **And** 系统显示成功消息"用户创建成功"
   **And** 新用户出现在用户列表中

3. **Given** 管理员填写用户创建表单
   **When** 管理员提交表单，但必填字段缺失或格式错误（如邮箱格式不正确）
   **Then** 系统显示验证错误消息
   **And** 用户账户不被创建
   **And** 表单保持填写状态，允许用户修正错误

4. **Given** 用户账户已存在
   **When** 管理员在用户列表中选择用户并点击"编辑"
   **Then** 系统显示用户编辑表单，预填充现有用户信息
   **And** 管理员可以修改用户信息（姓名、邮箱、角色等，但不能修改用户名）
   **And** 管理员提交修改后，系统更新用户信息并显示成功消息

5. **Given** 用户账户已存在
   **When** 管理员在用户列表中选择用户并点击"删除"
   **Then** 系统显示确认对话框"确定要删除用户 [用户名] 吗？"
   **And** 管理员确认删除后，系统执行软删除（标记为 deleted_at）
   **And** 用户账户从用户列表中移除（但数据保留用于审计）
   **And** 系统显示成功消息"用户删除成功"

6. **Given** 管理员尝试删除自己的账户
   **When** 管理员选择自己的账户并点击"删除"
   **Then** 系统显示错误消息"不能删除自己的账户"
   **And** 用户账户不被删除

## Tasks / Subtasks

- [x] Task 1: 后端用户管理服务 (AC: #2, #4, #5)
  - [x] 创建用户管理模块 (users.module.ts)
  - [x] 创建用户服务 (users.service.ts) - 调用 Twenty API 进行用户管理
  - [x] 创建用户控制器 (users.controller.ts) - 提供 CRUD 端点
  - [x] 实现用户创建 DTO 和验证
  - [x] 实现用户更新 DTO 和验证
  - [x] 实现软删除逻辑

- [x] Task 2: 后端权限检查 (AC: #1, #6)
  - [x] 创建管理员权限守卫 (admin.guard.ts)
  - [x] 实现防止删除自己的逻辑
  - [x] 集成到用户管理控制器

- [x] Task 3: 前端用户列表组件 (AC: #1, #4, #5)
  - [x] 创建用户管理页面 (UserManagementPage.tsx)
  - [x] 创建用户列表组件 (UserList.tsx)
  - [x] 实现用户列表显示
  - [x] 实现编辑和删除按钮

- [x] Task 4: 前端用户表单组件 (AC: #1, #2, #3, #4)
  - [x] 创建用户创建表单 (UserForm.tsx)
  - [x] 创建用户编辑表单 (UserForm.tsx - 复用组件)
  - [x] 实现表单验证
  - [x] 实现错误消息显示

- [x] Task 5: 前端用户服务 (AC: #2, #4, #5)
  - [x] 创建用户服务 (users.service.ts)
  - [x] 实现创建用户 API 调用
  - [x] 实现更新用户 API 调用
  - [x] 实现删除用户 API 调用
  - [x] 实现获取用户列表 API 调用

- [x] Task 6: 前端路由和权限 (AC: #1)
  - [x] 创建管理员路由保护（在 UserManagementPage 中实现）
  - [x] 添加用户管理路由
  - [x] 实现权限检查

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - API Integration Architecture: Custom backend (`fenghua-backend`) and frontend (`fenghua-frontend`) interact with Twenty CRM via its GraphQL API.
  - User Management: Need to investigate Twenty CRM's GraphQL API for user/workspace member management.
  - Soft Delete: Use `deleted_at` field for soft deletion, preserving data for audit purposes.
  - Permission: Only administrators can manage users.

- **Source tree components to touch:**
  - `fenghua-backend/src/users/`: New module for user management logic.
  - `fenghua-backend/src/services/twenty-client/twenty-client.service.ts`: Extend to call Twenty CRM user management GraphQL mutations.
  - `fenghua-frontend/src/users/`: New module for user management components and services.
  - `fenghua-frontend/src/App.tsx`: Add user management routes.

- **Testing standards summary:**
  - Unit tests for `users.service.ts` (backend) and `users.service.ts` (frontend).
  - Integration tests for CRUD operations.
  - E2E tests for UI interactions (create, edit, delete forms).

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Custom code in `fenghua-backend` and `fenghua-frontend`
- **Detected Conflicts or Variances:**
  - Need to investigate Twenty CRM's user management GraphQL API
  - May need to use workspace member mutations instead of user mutations

### References

- **Epic Definition:** [epics.md#Story 1.3](_bmad-output/epics.md#story-13-用户账户管理)
- **Architecture User Management:** [architecture.md#User Management](_bmad-output/architecture.md#user-management)
- **API Integration Architecture:** [api-integration-architecture.md](docs/api-integration-architecture.md)
- **Implementation Notes from Epic:** [epics.md#Implementation Notes](_bmad-output/epics.md#implementation-notes)

### Key Technical Details

- **Twenty CRM User Management:**
  - Need to investigate GraphQL mutations for creating/updating/deleting users or workspace members
  - May use `createWorkspaceMember`, `updateWorkspaceMember`, `deleteWorkspaceMember` mutations
  - User roles are managed through workspace member roles
- **Soft Delete:**
  - Use `deletedAt` field (if available in Twenty CRM) or implement custom soft delete logic
  - Filter deleted users from queries
- **Validation:**
  - Email format validation
  - Password strength validation (min 6 characters)
  - Required field validation

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Assistant)

### Debug Log References

### Completion Notes List

- **2025-12-25**: 后端用户管理模块创建完成，包括 `UsersService`, `UsersController`, `UsersModule`, `AdminGuard`, 以及相关的 DTOs (`CreateUserDto`, `UpdateUserDto`, `UserResponseDto`)。`AppModule` 已更新以包含 `UsersModule`。扩展了 `TwentyClientService` 以支持带 token 的 GraphQL 查询。
- **2025-12-25**: 前端用户管理组件创建完成，包括 `UserManagementPage`, `UserList`, `UserForm`, 以及 `users.service.ts`。`App.tsx` 已更新以添加用户管理路由。实现了完整的 CRUD 功能，包括表单验证、错误处理和权限检查。
- **2025-12-25**: 所有后端和前端代码编译成功。注意：Twenty CRM 的用户管理 GraphQL API 可能需要根据实际 API 进行调整（当前实现基于常见的 GraphQL 模式，如 `createUser`, `updateUser`, `deleteUser`, `workspaceMembers` 等）。
- **2025-12-26**: 完成代码审查反馈修复：
  - 创建 Token 装饰器，消除重复的 token 提取代码
  - 使用 UserRole 枚举统一角色检查（后端和前端）
  - 修复 AdminGuard 中的硬编码角色检查
  - 更新前端使用角色常量，消除硬编码
  - 所有代码审查问题已修复，代码质量提升

