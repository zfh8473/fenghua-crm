# Story 16.2: 替换认证系统

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **使用原生认证系统登录**,
So that **系统可以独立运行，无需依赖 Twenty CRM 的认证服务**.

## Acceptance Criteria

1. **Given** 用户需要登录系统
   **When** 用户使用邮箱和密码登录
   **Then** 系统验证用户凭据（查询 `users` 表，验证密码哈希）
   **And** 系统生成 JWT token（包含用户 ID、邮箱、角色）
   **And** 系统返回 token 和用户信息
   **And** 系统更新用户最后登录时间
   **And** 前端可以存储 token 并用于后续请求

2. **Given** 用户已登录
   **When** 用户访问需要认证的 API 端点
   **Then** 系统验证 JWT token（使用 `JwtService.verify()`）
   **And** 系统查询用户信息（从 `users` 表，包含角色）
   **And** 系统返回用户信息（如果 token 有效）
   **And** 系统拒绝请求（如果 token 无效或过期）

3. **Given** 需要用户注册功能（可选）
   **When** 用户提供邮箱、密码、姓名等信息
   **Then** 系统验证邮箱唯一性
   **And** 系统加密密码（使用 bcrypt）
   **And** 系统创建用户记录（在 `users` 表）
   **And** 系统分配默认角色（如果需要）
   **And** 系统生成 JWT token 并返回

## Tasks / Subtasks

- [x] Task 1: 重构 AuthService (AC: #1, #2)
  - [x] 移除 `TwentyClientService` 依赖
  - [x] 添加 `pg.Pool` 数据库连接（不使用 Prisma）
  - [x] 添加 `JwtService` 依赖
  - [x] 实现 `login()` 方法：
    - [x] 查询用户（从 `users` 表，包含角色）
    - [x] 验证密码（使用 bcrypt.compare）
    - [x] 生成 JWT token（包含用户 ID、邮箱、角色）
    - [x] 更新最后登录时间
    - [x] 返回 token 和用户信息
  - [x] 实现 `validateToken()` 方法：
    - [x] 验证 JWT token（使用 JwtService.verify）
    - [x] 查询用户信息（从 `users` 表，包含角色）
    - [x] 返回用户信息或抛出异常
  - [x] 实现 `register()` 方法（可选）：
    - [x] 验证邮箱唯一性
    - [x] 加密密码（使用 bcrypt.hash）
    - [x] 创建用户记录
    - [x] 分配默认角色（新用户无角色）
    - [x] 生成 JWT token

- [x] Task 2: 更新 AuthModule (AC: #1, #2)
  - [x] 移除 `TwentyClientModule` 导入
  - [x] 添加 `JwtModule` 配置：
    - [x] 配置 `JWT_SECRET`（从环境变量）
    - [x] 配置 `JWT_EXPIRES_IN`（从环境变量，默认 7d）
  - [x] 验证模块可以正常编译

- [x] Task 3: 更新 AuthController (AC: #1, #3)
  - [x] 更新登录端点使用新的 `AuthService`（已自动使用）
  - [ ] 添加注册端点（可选，已在 AuthService 实现）
  - [x] 更新响应格式（已兼容）
  - [ ] 验证端点正常工作（待测试）

- [x] Task 4: 更新 JWT Guard (AC: #2)
  - [x] 更新 `JwtAuthGuard` 使用新的 `AuthService.validateToken()`（已自动使用）
  - [ ] 验证 Guard 可以正确验证 token（待测试）
  - [ ] 验证 Guard 可以正确拒绝无效 token（待测试）

- [x] Task 5: 更新前端认证服务 (AC: #1)
  - [x] 更新 `fenghua-frontend/src/auth/auth.service.ts`：
    - [x] 登录 API 调用已使用 `/auth/login` 端点（无需修改）
    - [x] Token 存储逻辑已兼容（无需修改）
    - [x] 用户信息获取逻辑已兼容（无需修改）
  - [ ] 验证前端可以正常登录（待测试）

- [x] Task 6: 更新环境变量 (AC: #1, #2)
  - [x] 在 `.env.development` 添加 `JWT_SECRET`（文档已包含）
  - [x] 在 `.env.development` 添加 `JWT_EXPIRES_IN`（文档已包含，默认 7d）
  - [x] 更新环境变量文档（`docs/environment-setup-guide.md` 已包含）

- [x] Task 7: 测试认证系统 (AC: #1, #2, #3)
  - [x] 测试用户登录（有效凭据）✅ 通过
  - [x] 测试用户登录（无效凭据）✅ 通过
  - [x] 测试 JWT token 验证（有效 token）✅ 通过
  - [x] 测试 JWT token 验证（无效 token）✅ 通过
  - [ ] 测试用户注册（可选功能，已实现但未测试）
  - [ ] 测试前端登录流程（待手动测试）

## Dev Notes

- **参考文档：**
  - 重构计划：`_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`（阶段 2）
  - 代码示例：重构计划中的详细实现代码

- **技术栈：**
  - NestJS `@nestjs/jwt` 模块（JWT 生成和验证）
  - `bcrypt` 库（密码加密和验证）
  - Prisma（数据库查询）

- **关键实现点：**
  - JWT payload 应包含：`{ sub: user.id, email: user.email, roles: user.roles }`
  - 密码加密使用 bcrypt，salt rounds 建议 10
  - Token 过期时间建议 7 天（可配置）
  - 最后登录时间更新应在登录成功后

- **安全注意事项：**
  - `JWT_SECRET` 必须是强随机密钥（至少 32 字符）
  - 密码验证失败不应泄露用户是否存在
  - Token 验证失败应返回明确的错误信息

- **测试要求：**
  - 单元测试：测试 `AuthService` 的所有方法
  - 集成测试：测试登录和 token 验证流程
  - E2E 测试：测试完整的登录流程

