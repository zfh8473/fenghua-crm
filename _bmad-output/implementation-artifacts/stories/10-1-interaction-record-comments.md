# Story 10.1: 互动记录评论（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **在互动记录中添加评论**,
So that **我可以与团队成员就特定互动进行讨论和协作**.

## Acceptance Criteria

### AC1: 评论创建功能（按角色权限）

**Given** 前端专员已登录系统并查看某个采购商的互动记录
**When** 前端专员在互动记录详情页的评论区输入评论并提交
**Then** 系统保存评论，并显示评论内容、评论者、评论时间（FR101）
**And** 评论只对有权限查看该互动记录的用户可见
**And** 前端专员无法在供应商相关的互动记录中添加评论

**Given** 后端专员已登录系统并查看某个供应商的互动记录
**When** 后端专员在互动记录详情页的评论区输入评论并提交
**Then** 系统保存评论，并显示评论内容、评论者、评论时间（FR101）
**And** 评论只对有权限查看该互动记录的用户可见
**And** 后端专员无法在采购商相关的互动记录中添加评论

**Given** 总监或管理员已登录系统并查看任何互动记录
**When** 总监或管理员在互动记录详情页的评论区输入评论并提交
**Then** 系统保存评论，并显示评论内容、评论者、评论时间（FR101）
**And** 评论只对有权限查看该互动记录的用户可见

### AC2: 评论输入和验证

**Given** 用户添加评论
**When** 用户在评论区输入评论
**Then** 系统支持多行文本输入
**And** 系统支持文本格式化（可选，如加粗、列表等）
**And** 系统显示字符计数（可选）
**And** 系统验证评论内容不为空

**Given** 用户提交评论
**When** 评论内容验证通过
**Then** 系统保存评论到数据库
**And** 系统自动记录评论者（当前用户）和评论时间
**And** 系统显示成功消息"评论已添加"
**And** 评论立即显示在评论区

**Given** 用户提交评论
**When** 评论内容为空或验证失败
**Then** 系统显示验证错误消息（如"评论内容不能为空"）
**And** 评论不被保存

### AC3: 评论权限控制

**Given** 用户尝试在无权访问的互动记录中添加评论
**When** 用户提交评论
**Then** 系统验证用户是否有权限访问该互动记录
**And** 如果无权限，系统返回 403 错误
**And** 系统显示错误消息"您无权在此互动记录中添加评论"

## Tasks / Subtasks

### Task 1: 创建评论数据模型和数据库表 (AC: #1, #2)

- [ ] 1.1 设计评论数据模型
  - 创建数据库迁移脚本
  - 定义评论表结构：
    - `id`: UUID (主键)
    - `interaction_id`: UUID (外键，关联 product_customer_interactions 表)
    - `user_id`: UUID (外键，关联 users 表，评论者)
    - `content`: TEXT (评论内容，必填)
    - `created_at`: TIMESTAMP (评论时间)
    - `updated_at`: TIMESTAMP (更新时间，用于编辑功能)
    - `deleted_at`: TIMESTAMP (软删除时间，用于删除功能)
    - `created_by`: UUID (创建者，与 user_id 相同)
    - `updated_by`: UUID (更新者，用于编辑功能)
  - 添加适当的索引（interaction_id, user_id, created_at）
  - 添加外键约束

- [x] 1.2 创建数据库迁移脚本
  - 创建 `fenghua-backend/migrations/XXX-create-interaction-comments-table.sql`
  - 实现评论表的创建
  - 实现索引的创建
  - 实现外键约束

### Task 2: 实现后端评论服务 (AC: #1, #2, #3)

- [x] 2.1 创建评论服务模块
  - 创建 `fenghua-backend/src/interactions/comments/comments.service.ts`
  - 实现 `createComment` 方法：
    - 接收参数：interactionId, content, token
    - 验证 token 并获取用户信息（调用 `AuthService.validateToken`）
    - 获取互动记录（调用 `InteractionsService.findOne(interactionId, token)` - 此方法已包含权限验证）
    - 获取客户信息（调用 `CompaniesService.findOne(interaction.customerId, token)`）
    - 验证客户类型是否符合用户角色权限（参考权限验证流程）
    - 验证评论内容不为空（如果为空，抛出 `BadRequestException`）
    - 保存评论到数据库（使用 `pgPool.query`）
    - 记录审计日志（调用 `AuditService.log`）
    - 返回评论数据
  - 实现 `getCommentsByInteractionId` 方法：
    - 接收参数：interactionId, token（用于权限验证）
    - 验证用户是否有权限访问该互动记录（调用 `InteractionsService.findOne(interactionId, token)` - 如果无权限会抛出异常）
    - 查询该互动记录的所有评论（按时间倒序，排除软删除的记录）
    - 支持分页（page, limit 参数）
    - 返回评论列表和总数
  - 实现 `getCommentById` 方法：
    - 接收参数：commentId, token
    - 根据ID获取评论详情
    - 验证用户是否有权限访问该评论（通过验证互动记录权限）
    - 如果评论不存在，抛出 `NotFoundException`

- [ ] 2.2 创建评论 DTO
  - 创建 `fenghua-backend/src/interactions/comments/dto/create-comment.dto.ts`
  - 定义 `CreateCommentDto`（用于创建评论）
  - 创建 `fenghua-backend/src/interactions/comments/dto/comment-response.dto.ts`
  - 定义 `CommentResponseDto`（用于返回评论数据）

- [x] 2.3 创建评论控制器
  - 创建 `fenghua-backend/src/interactions/comments/comments.controller.ts`
  - 实现 `POST /api/interactions/:interactionId/comments` 端点（创建评论）
  - 实现 `GET /api/interactions/:interactionId/comments` 端点（获取评论列表）
  - 实现 `GET /api/interactions/:interactionId/comments/:commentId` 端点（获取评论详情）
  - 使用 `@UseGuards(JwtAuthGuard)` 保护所有端点
  - 实现权限验证（调用 PermissionService 验证用户是否有权限访问互动记录）

- [ ] 2.4 创建评论模块
  - 创建 `fenghua-backend/src/interactions/comments/comments.module.ts`
  - 导入必要的模块（AuthModule, PermissionModule, InteractionsModule）
  - 注册 CommentsService 和 CommentsController
  - 在 `InteractionsModule` 中导入 `CommentsModule`

### Task 3: 实现前端评论组件 (AC: #1, #2)

- [x] 3.1 创建评论列表组件
  - 创建 `fenghua-frontend/src/interactions/components/CommentList.tsx`
  - 显示评论列表（按时间倒序）
  - 显示评论内容、评论者、评论时间
  - 支持分页或滚动加载（如果评论较多）
  - 显示空状态"暂无评论"

- [ ] 3.2 创建评论输入组件
  - 创建 `fenghua-frontend/src/interactions/components/CommentInput.tsx`
  - 实现多行文本输入
  - 实现字符计数（可选）
  - 实现提交按钮
  - 实现验证（评论内容不为空）
  - 显示验证错误消息

- [x] 3.3 创建评论项组件
  - 创建 `fenghua-frontend/src/interactions/components/CommentItem.tsx`
  - 显示评论内容
  - 显示评论者信息（姓名、头像）
  - 显示评论时间（相对时间，如"2 小时前"）
  - 显示编辑/删除按钮（仅对评论创建者显示）

- [ ] 3.4 集成到互动记录详情页
  - 在 `fenghua-frontend/src/interactions/pages/InteractionDetailPage.tsx` 中添加评论区域
  - 显示评论列表组件
  - 显示评论输入组件
  - 实现评论创建功能（调用 API）
  - 实现评论列表刷新（创建评论后自动刷新）

### Task 4: 实现权限验证 (AC: #3)

- [x] 4.1 后端权限验证
  - 在 `CommentsService.createComment` 中验证用户权限
  - 使用 `InteractionsService.findOne(interactionId, token)` 获取互动记录（此方法已包含权限验证）
  - 获取客户信息并验证客户类型：
    - 前端专员：`customer.customerType` 必须是 `'BUYER'`
    - 后端专员：`customer.customerType` 必须是 `'SUPPLIER'`
    - 总监/管理员：无限制
  - 如果无权限，抛出 `ForbiddenException`（包含明确的错误消息）
  - 错误处理：
    - 互动记录不存在：`NotFoundException`
    - 用户无权限：`ForbiddenException`
    - 评论内容为空：`BadRequestException`
    - 数据库错误：记录日志并抛出 `InternalServerErrorException`

- [ ] 4.2 前端权限验证
  - 在评论输入组件中检查用户权限
  - 如果用户无权限，隐藏评论输入组件
  - 显示提示消息"您无权在此互动记录中添加评论"

### Task 5: 实现审计日志记录 (AC: #1)

- [x] 5.1 记录评论创建操作
  - 在 `CommentsService.createComment` 中记录审计日志
  - 调用 `AuditService.log` 记录评论创建操作
  - 记录操作类型：`COMMENT_CREATED`
  - 记录实体类型：`INTERACTION_COMMENT`
  - 记录实体ID：评论ID
  - 记录用户ID和操作者ID

## Dev Notes

### 架构决策和约束

**技术栈约束：**
- **后端：** NestJS + TypeScript + PostgreSQL，RESTful API（无 GraphQL）
- **数据库访问：** 使用原生 PostgreSQL (`pg.Pool`)，不使用 TypeORM
  - 参考: `fenghua-backend/src/interactions/interactions.service.ts` 使用 `this.pgPool.query()` 进行数据库操作
- **前端：** React 18+ + TypeScript + Vite + React Query
- **权限验证：** 使用 `PermissionService` 进行基于角色的权限验证
- [Source: _bmad-output/project-context.md#Technology-Stack]
- [Source: fenghua-backend/src/interactions/interactions.service.ts]

### 数据库表结构

**Interaction Comments 表字段：**
- `id` (UUID, PRIMARY KEY)
- `interaction_id` (UUID, NOT NULL, FOREIGN KEY REFERENCES product_customer_interactions(id))
- `user_id` (UUID, NOT NULL, FOREIGN KEY REFERENCES users(id))
- `content` (TEXT, NOT NULL) - **必填**
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
- `deleted_at` (TIMESTAMP WITH TIME ZONE) - 软删除
- `created_by` (UUID, REFERENCES users(id))
- `updated_by` (UUID, REFERENCES users(id))

**索引：**
- `idx_comments_interaction` ON `interaction_id` WHERE `deleted_at IS NULL` - 用于查询互动记录的所有评论
- `idx_comments_user` ON `user_id` WHERE `deleted_at IS NULL` - 用于查询用户的所有评论
- `idx_comments_created_at` ON `created_at DESC` WHERE `deleted_at IS NULL` - 用于按时间排序

### 权限验证逻辑

**评论权限验证：**
1. 验证用户是否有权限访问互动记录（调用 `PermissionService.canAccessInteraction`）
2. 根据用户角色验证：
   - **前端专员 (FRONTEND_SPECIALIST):** 只能评论采购商相关的互动记录（customerType = 'BUYER'）
   - **后端专员 (BACKEND_SPECIALIST):** 只能评论供应商相关的互动记录（customerType = 'SUPPLIER'）
   - **总监 (DIRECTOR):** 可以评论所有互动记录
   - **管理员 (ADMIN):** 可以评论所有互动记录

**权限验证流程：**
1. 获取互动记录（通过 `InteractionsService.findOne(interactionId, token)` - 此方法已包含权限验证）
2. 从互动记录中获取客户ID（`interaction.customerId`）
3. 获取客户信息（通过 `CompaniesService.findOne(customerId, token)`）
4. 验证客户类型是否符合用户角色权限：
   - 前端专员：`customer.customerType` 必须是 `'BUYER'`
   - 后端专员：`customer.customerType` 必须是 `'SUPPLIER'`
   - 总监/管理员：无限制
5. 如果不符合，抛出 `ForbiddenException`

**注意：** `InteractionsService.findOne` 方法已经包含了基于角色的权限验证（通过 `PermissionService.getDataAccessFilter`），但为了确保评论权限与互动记录访问权限一致，建议在评论服务中再次验证客户类型。

### API 端点设计

**评论 API 端点：**
- `POST /api/interactions/:interactionId/comments` - 创建评论
  - 请求体：`{ content: string }`
  - 响应：`CommentResponseDto`
  - 权限：需要 JWT 认证，需要权限访问互动记录

- `GET /api/interactions/:interactionId/comments` - 获取评论列表
  - 查询参数：`page?`, `limit?`
  - 响应：`{ data: CommentResponseDto[], total: number, page: number, limit: number }`
  - 权限：需要 JWT 认证，需要权限访问互动记录

- `GET /api/interactions/:interactionId/comments/:commentId` - 获取评论详情
  - 响应：`CommentResponseDto`
  - 权限：需要 JWT 认证，需要权限访问互动记录

### 文件结构

**后端模块 (`fenghua-backend/src/interactions/comments/`):**
- `comments.module.ts` - 评论模块
- `comments.service.ts` - 评论服务
- `comments.controller.ts` - 评论控制器
- `dto/create-comment.dto.ts` - 创建评论 DTO
- `dto/comment-response.dto.ts` - 评论响应 DTO

**数据库迁移:**
- `fenghua-backend/migrations/XXX-create-interaction-comments-table.sql` - 评论表迁移

**前端模块 (`fenghua-frontend/src/interactions/components/`):**
- `CommentList.tsx` - 评论列表组件
- `CommentInput.tsx` - 评论输入组件
- `CommentItem.tsx` - 评论项组件

**前端服务 (`fenghua-frontend/src/interactions/services/`):**
- `comment.service.ts` - 评论 API 服务

### 实现模式示例

**评论创建权限验证实现：**
```typescript
// In CommentsService.createComment
async createComment(interactionId: string, content: string, token: string): Promise<CommentResponseDto> {
  // 1. Validate token and get user
  const user = await this.authService.validateToken(token);
  if (!user || !user.id) {
    throw new UnauthorizedException('无效的用户 token');
  }

  // 2. Get interaction record (this already validates user access)
  const interaction = await this.interactionsService.findOne(interactionId, token);

  // 3. Get customer info to verify customer type
  const customer = await this.companiesService.findOne(interaction.customerId, token);

  // 4. Verify role-based access
  if (user.role === 'FRONTEND_SPECIALIST' && customer.customerType !== 'BUYER') {
    throw new ForbiddenException('前端专员只能评论采购商相关的互动记录');
  }
  if (user.role === 'BACKEND_SPECIALIST' && customer.customerType !== 'SUPPLIER') {
    throw new ForbiddenException('后端专员只能评论供应商相关的互动记录');
  }

  // 5. Validate comment content
  if (!content || content.trim().length === 0) {
    throw new BadRequestException('评论内容不能为空');
  }

  // 6. Create comment (no transaction needed for single insert)
  const result = await this.pgPool.query(
    `INSERT INTO interaction_comments (interaction_id, user_id, content, created_by, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, interaction_id, user_id, content, created_at, updated_at`,
    [interactionId, user.id, content.trim(), user.id]
  );

  const comment = result.rows[0];

  // 7. Record audit log (non-blocking)
  setImmediate(async () => {
    try {
      await this.auditService.log({
        action: 'COMMENT_CREATED',
        entityType: 'INTERACTION_COMMENT',
        entityId: comment.id,
        userId: user.id,
        operatorId: user.id,
        timestamp: new Date(),
        metadata: {
          interactionId: interactionId,
          commentLength: content.length,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to log comment creation', error);
    }
  });

  return {
    id: comment.id,
    interactionId: comment.interaction_id,
    userId: comment.user_id,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  };
}
```

**错误处理模式：**
- 互动记录不存在：`NotFoundException('互动记录不存在')`
- 用户无权限：`ForbiddenException('您无权在此互动记录中添加评论')`
- 评论内容为空：`BadRequestException('评论内容不能为空')`
- 数据库错误：记录日志并抛出 `InternalServerErrorException('创建评论失败')`

**事务管理：**
- 评论创建是单个 INSERT 操作，不需要事务
- 审计日志记录使用异步方式（`setImmediate`），不阻塞主操作

### 参考文档

- [Source: _bmad-output/epics.md#Epic-10] - Epic 10 需求定义
- [Source: _bmad-output/implementation-artifacts/stories/4-1-interaction-record-creation-frontend.md] - Story 4-1 实现细节（互动记录创建）
- [Source: fenghua-backend/src/interactions/interactions.service.ts] - 互动记录服务实现（参考 `findOne` 方法的权限验证模式）
- [Source: fenghua-backend/src/permission/permission.service.ts] - 权限服务实现
- [Source: fenghua-backend/src/companies/companies.service.ts] - 客户服务实现（参考 `findOne` 方法）

## Completion Notes List

- 2026-01-14: Story created
- 2026-01-14: Story implementation completed
  - Task 1: Created database migration script (034-create-interaction-comments-table.sql)
  - Task 2: Implemented backend service (CommentsService, CommentsController, CommentsModule, DTOs)
  - Task 3: Implemented frontend components (CommentList, CommentInput, CommentItem, InteractionDetailPage)
  - Task 4: Permission validation implemented in CommentsService
  - Task 5: Audit logging implemented in CommentsService.createComment
- 2026-01-14: Code review fixes applied
  - H1: Added user information (name/email) to comment responses and display
  - H2: Fixed comment list refresh mechanism using React key prop
  - M1: Added input sanitization for XSS protection (backend + frontend DOMPurify)
  - M2: Added ValidationPipe to controller endpoints
  - M3: Optimized permission check in getCommentsByInteractionId (lightweight query)
