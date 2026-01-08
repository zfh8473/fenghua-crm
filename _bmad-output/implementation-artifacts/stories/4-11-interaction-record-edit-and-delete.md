# Story 4.11: 互动记录编辑和删除

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **编辑和删除自己创建的互动记录**,
so that **我可以修正错误或删除不需要的记录**.

## Acceptance Criteria

**AC1: 编辑互动记录表单显示**
- **Given** 用户已创建互动记录
- **When** 用户在互动历史列表中选择自己创建的互动记录，点击"编辑"
- **Then** 系统显示互动记录编辑表单，预填充现有信息
- **And** 用户可以修改互动描述、互动时间、状态、附件等
- **And** 用户不能修改客户、产品和互动类型关联（业务规则，如需修改应删除后重新创建）
- **And** 客户、产品和互动类型字段显示为只读或禁用状态

**AC2: 编辑互动记录验证和更新**
- **Given** 用户编辑互动记录
- **When** 用户提交修改
- **Then** 系统验证修改后的数据（互动时间不能是未来时间、描述长度等）
- **And** 系统更新互动记录
- **And** 系统自动记录修改者和修改时间（FR31）
- **And** 系统显示成功消息"互动记录更新成功"
- **And** 更新后的互动记录出现在互动历史列表中

**AC3: 删除互动记录确认和软删除**
- **Given** 用户已创建互动记录
- **When** 用户在互动历史列表中选择自己创建的互动记录，点击"删除"
- **Then** 系统显示确认对话框"确定要删除这条互动记录吗？"
- **And** 用户确认删除后，系统执行软删除（标记为 deleted_at）
- **And** 互动记录从列表中移除（但数据保留用于审计）
- **And** 系统显示成功消息"互动记录删除成功"

**AC4: 权限控制**
- **Given** 用户尝试编辑或删除其他用户创建的互动记录
- **When** 用户点击"编辑"或"删除"按钮
- **Then** 系统显示权限错误"您只能编辑/删除自己创建的互动记录"
- **And** 系统不执行编辑或删除操作
- **And** 如果用户不是创建者，编辑和删除按钮不显示或显示为禁用状态

**AC5: 审计日志记录**
- **Given** 用户删除互动记录
- **When** 系统执行软删除
- **Then** 系统记录删除操作到审计日志（action: 'INTERACTION_DELETED'）
- **And** 系统保留互动记录数据用于历史追溯
- **And** 系统记录编辑操作到审计日志（action: 'INTERACTION_UPDATED'）

## Tasks / Subtasks

- [x] Task 1: 创建后端更新互动记录 API (AC: #2, #5)
  - [ ] 创建 `UpdateInteractionDto` - 定义更新互动记录的 DTO
    - [ ] 包含可选字段：`description`, `interactionDate`, `status`, `additionalInfo`
    - [ ] 不包含 `productId`、`customerId` 和 `interactionType`（业务规则：不能修改关联和互动类型）
    - [ ] 添加验证：互动时间不能是未来时间（可选，但建议实现）
  - [ ] **附件处理说明：**
    - [ ] 附件添加：使用现有的 `linkAttachmentToInteraction` API（`POST /api/attachments/:attachmentId/link`）
    - [ ] 附件删除：使用现有的 `deleteAttachment` API（`DELETE /api/attachments/:attachmentId`）
    - [ ] 附件元数据更新：使用现有的 `updateAttachmentMetadata` API（`PATCH /api/attachments/:attachmentId/metadata`，Story 4.6 已实现）
    - [ ] 附件操作在编辑表单中处理，不在更新互动记录的 API 中处理（保持 API 职责单一）
  - [ ] 在 `InteractionsService` 中添加 `update` 方法
    - [ ] 验证互动记录存在且未被删除（`deleted_at IS NULL`）
    - [ ] 验证当前用户是创建者（`created_by === currentUserId`）
    - [ ] 如果验证失败，返回 403 Forbidden 或 404 Not Found
    - [ ] 更新互动记录字段（只更新提供的字段）
    - [ ] 自动记录 `updated_by` 和 `updated_at`
    - [ ] 使用数据库事务确保数据一致性
    - [ ] 记录审计日志（action: 'INTERACTION_UPDATED'）
  - [ ] 在 `InteractionsController` 中添加 `PATCH /api/interactions/:id` 端点
    - [ ] 使用 `@Param('id', ParseUUIDPipe)` 验证 ID
    - [ ] 使用 `@Body(ValidationPipe)` 验证 DTO
    - [ ] 使用 `@Token()` 获取 JWT token
    - [ ] 调用 `InteractionsService.update`

- [x] Task 2: 创建后端删除互动记录 API (AC: #3, #4, #5)
  - [ ] 在 `InteractionsService` 中添加 `delete` 方法
    - [ ] 验证互动记录存在且未被删除（`deleted_at IS NULL`）
    - [ ] 验证当前用户是创建者（`created_by === currentUserId`）
    - [ ] 如果验证失败，返回 403 Forbidden 或 404 Not Found
    - [ ] 执行软删除（UPDATE `deleted_at = NOW()`）
    - [ ] 使用数据库事务确保数据一致性
    - [ ] 记录审计日志（action: 'INTERACTION_DELETED'）
  - [ ] 在 `InteractionsController` 中添加 `DELETE /api/interactions/:id` 端点
    - [ ] 使用 `@Param('id', ParseUUIDPipe)` 验证 ID
    - [ ] 使用 `@Token()` 获取 JWT token
    - [ ] 调用 `InteractionsService.delete`
    - [ ] 返回 204 No Content 或 200 OK with success message

- [x] Task 3: 创建前端互动记录编辑表单组件 (AC: #1, #2)
  - [ ] 创建 `InteractionEditForm` 组件（或复用 `InteractionCreateForm` 并添加编辑模式）
    - [ ] 接收 `interactionId` prop
    - [ ] 使用 React Query 获取互动记录详情（`GET /api/interactions/:id`）
    - [ ] 预填充表单字段（描述、时间、状态等）
    - [ ] 客户、产品和互动类型字段显示为只读或禁用状态
    - [ ] 实现表单验证（与创建表单相同）
    - [ ] 使用 React Hook Form 管理表单状态
    - [ ] **附件编辑功能：**
      - [ ] 集成 `FileUpload` 组件（参考 `InteractionCreateForm` 的实现）
      - [ ] 显示现有附件列表（从 `GET /api/interactions/:id` 响应中获取 `attachments` 数组）
      - [ ] 支持添加新附件（上传后使用 `linkAttachmentToInteraction` API 关联）
      - [ ] 支持删除现有附件（使用 `deleteAttachment` API）
      - [ ] 支持更新附件元数据（使用 `updateAttachmentMetadata` API，如照片顺序和标注）
      - [ ] 附件操作在提交表单时处理（与创建表单类似）
    - [ ] **错误处理：**
      - [ ] 使用统一的错误消息常量（在 `error-messages.ts` 中添加 `INTERACTION_EDIT_ERRORS` 常量）
      - [ ] 替换所有硬编码的错误消息为常量
      - [ ] 参考 Story 4.9 和 4.10 的实现模式
  - [ ] 创建 `InteractionEditPage` 页面
    - [ ] 从 URL 参数获取 `interactionId`
    - [ ] 显示编辑表单
    - [ ] 处理成功和错误状态

- [x] Task 4: 在前端互动历史组件中添加编辑和删除按钮 (AC: #1, #3, #4)
  - [ ] 在 `CustomerTimeline` 组件的 `TimelineInteractionCard` 中添加编辑和删除按钮
    - [ ] **权限检查：** 使用 `useAuth` hook 获取当前用户信息：`const { user } = useAuth()`
    - [ ] **比较逻辑：** 只在 `interaction.createdBy === user?.id` 时显示按钮
    - [ ] 参考实现：`CustomerTimeline` 组件已使用 `const { token, user } = useAuth()`（第 397 行）
    - [ ] 编辑按钮链接到 `/interactions/:id/edit`
    - [ ] 删除按钮触发确认对话框
  - [ ] 在 `ProductCustomerInteractionHistory` 组件的 `InteractionCard` 中添加编辑和删除按钮
    - [ ] 同样的权限检查逻辑（`interaction.createdBy === user?.id`）
  - [ ] 在 `CustomerProductInteractionHistory` 组件的 `InteractionCard` 中添加编辑和删除按钮
    - [ ] 同样的权限检查逻辑（`interaction.createdBy === user?.id`）
  - [ ] 实现删除确认对话框
    - [ ] **UI 实现：** 参考 `CustomerManagementPage.tsx` 的删除确认对话框实现（第 354-385 行）
    - [ ] 使用固定定位的遮罩层：`fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50`
    - [ ] 使用 `Card` 组件作为对话框容器，`variant="elevated"` 或 `variant="outlined"`
    - [ ] 显示确认消息："确定要删除这条互动记录吗？"
    - [ ] 添加提示信息："此操作将执行软删除，数据保留用于审计。"
    - [ ] 按钮布局：取消按钮（`variant="outline"`）和确认按钮（`variant="primary"`，危险样式：`bg-red-600 hover:bg-red-700`）
    - [ ] 支持 ESC 键关闭对话框（`onKeyDown` 处理 `Escape` 键）
    - [ ] 点击遮罩层关闭对话框（`onClick` 处理，但点击对话框内容时不关闭）
    - [ ] 确认后调用删除 API
    - [ ] **错误处理：** 使用统一的错误消息常量（`INTERACTION_EDIT_ERRORS`）

- [x] Task 5: 实现前端删除功能 (AC: #3)
  - [ ] 在 `interactions.service.ts` 中添加 `deleteInteraction` 方法
    - [ ] 调用 `DELETE /api/interactions/:id`
    - [ ] 处理成功和错误响应
  - [ ] 在删除成功后，刷新互动历史列表（使用 React Query 的 `invalidateQueries`）
  - [ ] 显示成功消息（使用 toast 通知）

- [x] Task 6: 实现前端更新功能 (AC: #2)
  - [ ] 在 `interactions.service.ts` 中添加 `updateInteraction` 方法
    - [ ] 调用 `PATCH /api/interactions/:id`
    - [ ] 处理成功和错误响应
  - [ ] 在更新成功后，刷新互动历史列表
  - [ ] 显示成功消息
  - [ ] 导航回互动历史页面或关闭编辑表单

- [x] Task 7: 添加后端获取单个互动记录 API (AC: #1)
  - [ ] 在 `InteractionsService` 中添加 `findOne` 方法
    - [ ] 验证互动记录存在且未被删除（`deleted_at IS NULL`）
    - [ ] **权限验证详细说明：**
      - [ ] 使用 `PermissionService.getDataAccessFilter(token)` 获取用户的数据访问过滤器
      - [ ] 验证客户类型与用户角色匹配（前端专员只能查看采购商，后端专员只能查看供应商）
      - [ ] 通过 JOIN `companies` 表获取客户类型，验证 `customer_type` 与过滤器匹配
      - [ ] 如果权限验证失败，返回 403 Forbidden
      - [ ] 参考 Story 4.8、4.9、4.10 的实现模式（`CustomerTimelineService`、`ProductCustomerInteractionHistoryService`、`CustomerProductInteractionHistoryService`）
    - [ ] 使用 SQL JOIN 获取附件信息（`LEFT JOIN file_attachments`，参考 Story 4.8 的实现）
    - [ ] 返回互动记录详情（包括附件信息）
  - [ ] 在 `InteractionsController` 中添加 `GET /api/interactions/:id` 端点
    - [ ] 使用 `@Param('id', ParseUUIDPipe)` 验证 ID
    - [ ] 使用 `@Token()` 获取 JWT token
    - [ ] 调用 `InteractionsService.findOne`

- [ ] Task 8: 添加测试用例 (AC: #1, #2, #3, #4, #5)
  - [ ] 添加后端 Service 测试
    - [ ] 测试更新互动记录成功场景
    - [ ] 测试更新权限验证失败场景（非创建者）
    - [ ] 测试更新已删除的互动记录（应返回 404）
    - [ ] 测试更新时验证失败（如未来时间）
    - [ ] 测试部分字段更新（只更新提供的字段）
    - [ ] 测试删除互动记录成功场景
    - [ ] 测试删除权限验证失败场景（非创建者）
    - [ ] 测试删除已删除的互动记录（应返回 404）
    - [ ] 测试软删除（deleted_at 被设置，但数据保留）
    - [ ] 测试审计日志记录（INTERACTION_UPDATED 和 INTERACTION_DELETED）
    - [ ] 测试获取单个互动记录成功场景
    - [ ] 测试获取单个互动记录权限验证失败场景（基于角色的数据过滤）
  - [ ] 添加后端 Controller 测试
    - [ ] 测试 GET /api/interactions/:id 端点
    - [ ] 测试 PATCH /api/interactions/:id 端点
    - [ ] 测试 DELETE /api/interactions/:id 端点
    - [ ] 测试权限验证（JWT token 验证）
    - [ ] 测试错误处理（400, 403, 404, 500）
  - [ ] 添加前端组件测试（可选）
    - [ ] 测试编辑表单显示和预填充
    - [ ] 测试编辑表单提交成功和失败场景
    - [ ] 测试附件添加、删除和更新
    - [ ] 测试删除确认对话框显示和关闭
    - [ ] 测试删除确认和提交
    - [ ] 测试权限控制（按钮显示/隐藏逻辑）
    - [ ] 测试只读字段（客户、产品、互动类型）不能修改

## Dev Notes

### 现有实现分析

**数据库表结构：**
- `product_customer_interactions` 表已存在
- 表结构包含：`id`, `product_id`, `customer_id`, `interaction_type`, `interaction_date`, `description`, `status`, `additional_info`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`
- `deleted_at` 字段用于软删除
- `updated_by` 和 `updated_at` 字段用于记录修改信息

**现有 API 端点：**
- `POST /api/interactions` - 创建互动记录（已实现）
- 需要添加：`GET /api/interactions/:id` - 获取单个互动记录
- 需要添加：`PATCH /api/interactions/:id` - 更新互动记录
- 需要添加：`DELETE /api/interactions/:id` - 删除互动记录

**权限控制：**
- 当前用户信息通过 JWT token 获取（`AuthService.validateToken`）
- 创建者信息存储在 `created_by` 字段
- 需要验证 `created_by === currentUserId` 才能编辑/删除

**审计日志：**
- `AuditService` 已存在（Story 3.8 实现）
- 使用 `AuditService.log` 记录操作
- 需要记录：`INTERACTION_UPDATED` 和 `INTERACTION_DELETED`

**前端组件：**
- `CustomerTimeline` 组件显示客户的所有互动记录（Story 4.8）
- `ProductCustomerInteractionHistory` 组件显示产品-客户互动记录（Story 4.9）
- `CustomerProductInteractionHistory` 组件显示客户-产品互动记录（Story 4.10）
- 这些组件都显示互动记录卡片，需要添加编辑和删除按钮
- `InteractionCreateForm` 组件已实现附件上传和关联功能（Story 4.4-4.6），可参考其实现

**附件处理：**
- 附件上传：`POST /api/attachments/upload`（Story 4.4 已实现）
- 附件关联：`POST /api/attachments/:attachmentId/link`（Story 4.4 已实现）
- 附件删除：`DELETE /api/attachments/:attachmentId`（Story 4.4 已实现）
- 附件元数据更新：`PATCH /api/attachments/:attachmentId/metadata`（Story 4.6 已实现）
- `FileUpload` 组件已实现文件上传、拖拽排序、照片标注等功能（Story 4.4-4.6）

**错误消息常量：**
- 需要在 `fenghua-frontend/src/common/constants/error-messages.ts` 中添加 `INTERACTION_EDIT_ERRORS` 常量
- 包含：`NO_PERMISSION`, `NOT_FOUND`, `UPDATE_FAILED`, `DELETE_FAILED`, `LOAD_FAILED` 等

### 技术要求和架构约束

**后端架构：**
- 使用 NestJS + TypeScript
- RESTful API（不是 GraphQL）
- 使用原生 PostgreSQL 连接池（`pg.Pool`）查询数据库
- 使用 JWT 认证（`JwtAuthGuard`）
- 使用 `@Token()` 装饰器获取 JWT token
- 使用数据库事务确保数据一致性

**前端架构：**
- 使用 React 18+ + TypeScript
- 使用 React Hook Form 管理表单状态
- 使用 React Query 管理 API 调用状态
- 使用 Tailwind CSS 样式（自定义设计系统）
- 使用 `useAuth` hook 获取当前用户信息
- 使用 React Toastify 显示通知消息

**API 端点：**

```
GET /api/interactions/:id
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "uuid",
  "productId": "uuid",
  "customerId": "uuid",
  "interactionType": "string",
  "interactionDate": "2025-01-03T10:00:00Z",
  "description": "string",
  "status": "string",
  "additionalInfo": {},
  "createdAt": "2025-01-03T10:00:00Z",
  "createdBy": "uuid",
  "updatedAt": "2025-01-03T10:00:00Z",
  "updatedBy": "uuid",
  "attachments": [...]
}
```

```
PATCH /api/interactions/:id
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "description": "string (optional)",
  "interactionDate": "2025-01-03T10:00:00Z (optional)",
  "status": "string (optional)",
  "additionalInfo": {} (optional)
}

注意：不包含 productId、customerId 和 interactionType（业务规则：不能修改）

Response (200 OK):
{
  "id": "uuid",
  "productId": "uuid",
  "customerId": "uuid",
  "interactionType": "string",
  "interactionDate": "2025-01-03T10:00:00Z",
  "description": "string",
  "status": "string",
  "additionalInfo": {},
  "createdAt": "2025-01-03T10:00:00Z",
  "createdBy": "uuid",
  "updatedAt": "2025-01-03T10:00:00Z",
  "updatedBy": "uuid"
}
```

```
DELETE /api/interactions/:id
Authorization: Bearer <token>

Response (204 No Content) or (200 OK):
{
  "message": "互动记录删除成功"
}
```

**业务规则：**
- 用户只能编辑/删除自己创建的互动记录
- 客户、产品和互动类型关联不能修改（如需修改应删除后重新创建）
- 使用软删除（标记 `deleted_at`），数据保留用于审计
- 所有操作记录到审计日志
- 附件可以添加、删除和更新（通过独立的附件 API）

**错误处理：**
- 404 Not Found: 互动记录不存在或已被删除
- 403 Forbidden: 用户不是创建者，无权限编辑/删除
- 400 Bad Request: 验证失败（如互动时间是未来时间）

## References

- **Epic 4:** 互动记录核心功能
- **FR29:** 所有用户可以编辑和删除自己创建的互动记录
- **FR31:** 系统可以自动记录互动的创建者和修改者
- **Story 4.1:** 互动记录创建（前端专员 - 采购商互动）
- **Story 4.8:** 互动历史查看（按角色）
- **Story 4.9:** 产品客户互动记录查看（按角色）
- **Story 4.10:** 客户产品互动记录查看（按角色）

