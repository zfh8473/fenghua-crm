# Story 9.1: 数据访问审计日志

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **管理员**,
I want **查看所有数据访问操作记录**,
So that **我可以审计谁在何时访问了什么数据，确保数据安全**.

## Acceptance Criteria

### AC1: 数据访问操作自动记录
**Given** 用户成功访问了客户详情页
**When** 用户查看客户数据
**Then** 系统自动记录该"数据访问"操作到审计日志，包括用户ID、时间、访问的资源（客户ID）、操作结果（成功/失败）（FR90）
**And** 审计日志记录包含：操作类型（数据访问）、用户ID、资源类型（客户）、资源ID、操作时间、操作结果

**Given** 用户成功访问了产品详情页
**When** 用户查看产品数据
**Then** 系统自动记录该"数据访问"操作到审计日志，包括用户ID、时间、访问的资源（产品ID）、操作结果（成功）

**Given** 用户成功访问了互动记录详情页
**When** 用户查看互动记录数据
**Then** 系统自动记录该"数据访问"操作到审计日志，包括用户ID、时间、访问的资源（互动记录ID）、操作结果（成功）

**Given** 用户尝试访问无权限的数据
**When** 系统阻止该访问
**Then** 系统自动记录该"无权限访问"操作到审计日志，包括用户ID、时间、尝试访问的资源、操作结果（失败）
**And** 审计日志记录包含失败原因（如"无权限访问供应商数据"）

### AC2: 审计日志查询和显示
**Given** 管理员查看审计日志
**When** 管理员在系统管理界面访问审计日志模块
**Then** 系统显示所有数据访问操作记录，支持按用户、按时间、按资源类型进行查询（FR90, FR93）
**And** 审计日志列表按时间倒序排列（最新的在前）
**And** 审计日志列表包含：操作类型、用户、资源类型、资源ID、操作时间、操作结果

**Given** 管理员查看审计日志
**When** 审计日志记录较多（> 1000 条）
**Then** 系统使用分页或滚动加载显示审计日志
**And** 系统支持按时间范围、按用户、按资源类型筛选审计日志
**And** 系统支持导出审计日志（CSV、Excel 格式）

### AC3: 审计日志详情查看
**Given** 管理员查看审计日志
**When** 管理员点击某个审计日志记录
**Then** 系统显示该记录的详细信息
**And** 详细信息包括：操作类型、用户信息、资源类型、资源ID、操作时间、操作结果、IP地址（如果可用）、用户代理（如果可用）

### AC4: 性能优化
**Given** 系统记录数据访问操作
**When** 用户频繁访问数据
**Then** 审计日志记录操作不影响系统正常性能
**And** 审计日志记录使用异步方式写入（如使用消息队列或后台任务）
**And** 审计日志查询响应时间在可接受范围内（< 2 秒）

## Tasks / Subtasks

- [x] Task 1: 创建审计日志数据模型和数据库表 (AC: 1)
  - [x] 1.1 设计审计日志数据模型
    - 创建数据库迁移脚本
    - 定义审计日志表结构：
      - `id`: UUID (主键)
      - `operation_type`: VARCHAR (操作类型：'DATA_ACCESS', 'DATA_MODIFICATION', 'PERMISSION_OPERATION')
      - `user_id`: UUID (外键，关联 users 表)
      - `resource_type`: VARCHAR (资源类型：'CUSTOMER', 'PRODUCT', 'INTERACTION', 等)
      - `resource_id`: UUID (资源ID)
      - `operation_result`: VARCHAR (操作结果：'SUCCESS', 'FAILED')
      - `failure_reason`: TEXT (失败原因，可选)
      - `ip_address`: VARCHAR (IP地址，可选)
      - `user_agent`: TEXT (用户代理，可选)
      - `created_at`: TIMESTAMP (操作时间)
      - `metadata`: JSONB (额外元数据，可选)
    - 添加适当的索引（user_id, resource_type, resource_id, created_at）
  - [x] 1.2 创建数据库迁移脚本
    - 创建 `fenghua-backend/migrations/XXX-add-audit-log-table.sql`
    - 实现审计日志表的创建
    - 实现索引的创建

- [x] Task 2: 实现后端审计日志服务 (AC: 1,4)
  - [x] 2.1 创建审计日志服务模块
    - 创建 `fenghua-backend/src/audit/audit-log.service.ts`
    - 实现 `logDataAccess` 方法：
      - 接收参数：userId, resourceType, resourceId, operationResult, failureReason?, ipAddress?, userAgent?
      - 异步写入审计日志到数据库
      - 使用消息队列或后台任务异步处理（避免影响主业务性能）
    - 实现 `getAuditLogs` 方法：
      - 支持按用户、按时间范围、按资源类型查询
      - 支持分页
      - 返回审计日志列表
    - 实现 `getAuditLogById` 方法：
      - 根据ID获取审计日志详情
    - 实现 `exportAuditLogs` 方法：
      - 支持导出为 CSV 或 Excel 格式
  - [x] 2.2 创建审计日志 DTO
    - 创建 `fenghua-backend/src/audit/dto/audit-log.dto.ts`
    - 定义 `AuditLogDto`（用于返回审计日志数据）
    - 定义 `AuditLogQueryDto`（用于查询参数）
    - 定义 `CreateAuditLogDto`（用于创建审计日志）

- [x] Task 3: 实现审计日志拦截器/中间件 (AC: 1)
  - [x] 3.1 创建审计日志拦截器
    - 创建 `fenghua-backend/src/audit/interceptors/data-access-audit.interceptor.ts`
    - 拦截所有数据访问操作（GET 请求到详情页）
    - 自动提取用户信息、资源类型、资源ID
    - 调用 `AuditLogService.logDataAccess` 记录审计日志
    - 处理权限检查失败的情况，记录失败原因
  - [x] 3.2 在关键端点应用拦截器
    - 在客户详情端点应用拦截器：`GET /api/companies/:id`
    - 在产品详情端点应用拦截器：`GET /api/products/:id`
    - 在互动记录详情端点应用拦截器：`GET /api/interactions/:id`
    - 在分析页面端点应用拦截器（如需要）：`GET /api/dashboard/*`

- [x] Task 4: 创建审计日志查询 API (AC: 2,3)
  - [x] 4.1 创建审计日志控制器
    - 创建 `fenghua-backend/src/audit/audit-log.controller.ts`
    - 实现 `GET /api/audit-logs` 端点（查询审计日志列表）
      - 支持查询参数：userId, resourceType, startDate, endDate, page, limit
      - 使用 `@UseGuards(JwtAuthGuard, AdminGuard)` 限制只有管理员可以访问
      - 返回分页的审计日志列表
    - 实现 `GET /api/audit-logs/:id` 端点（获取审计日志详情）
      - 返回单个审计日志的详细信息
    - 实现 `GET /api/audit-logs/export` 端点（导出审计日志）
      - 支持 CSV 和 Excel 格式
      - 支持按查询条件导出

- [x] Task 5: 创建前端审计日志页面 (AC: 2,3)
  - [x] 5.1 创建审计日志服务
    - 创建 `fenghua-frontend/src/audit/services/audit-log.service.ts`
    - 实现 `getAuditLogs` 方法（查询审计日志列表）
    - 实现 `getAuditLogById` 方法（获取审计日志详情）
    - 实现 `exportAuditLogs` 方法（导出审计日志）
  - [x] 5.2 创建审计日志表格组件
    - 创建 `fenghua-frontend/src/audit/components/AuditLogTable.tsx`
    - 显示审计日志列表（操作类型、用户、资源类型、资源ID、操作时间、操作结果）
    - 支持分页
    - 支持排序（按时间倒序）
  - [x] 5.3 创建审计日志筛选组件
    - 创建 `fenghua-frontend/src/audit/components/AuditLogFilters.tsx`
    - 支持按用户筛选
    - 支持按资源类型筛选
    - 支持按时间范围筛选
  - [x] 5.4 创建审计日志详情对话框
    - 创建 `fenghua-frontend/src/audit/components/AuditLogDetailDialog.tsx`
    - 显示审计日志的详细信息
    - 显示 IP 地址和用户代理（如果可用）
  - [x] 5.5 创建审计日志页面
    - 创建 `fenghua-frontend/src/audit/pages/AuditLogPage.tsx`
    - 整合审计日志表格、筛选组件和详情对话框
    - 添加导出功能按钮
    - 添加路由：`/audit-logs`（仅管理员可见）

- [x] Task 6: 性能优化和错误处理 (AC: 4)
  - [x] 6.1 实现异步审计日志记录
    - 使用消息队列（如 BullMQ）异步处理审计日志写入
    - 或使用后台任务异步写入
    - 确保审计日志记录不影响主业务性能
  - [x] 6.2 实现审计日志查询优化
    - [x] 添加适当的数据库索引
      - 已创建 `idx_audit_logs_entity_id` 索引（entity_id）
      - 已创建 `idx_audit_logs_entity_type_id` 复合索引（entity_type, entity_id）
      - 已创建 `idx_audit_logs_entity_type_id_timestamp` 复合索引（entity_type, entity_id, timestamp DESC）
      - 迁移脚本：`fenghua-backend/migrations/029-add-audit-logs-entity-id-index.sql`
    - [x] 使用分页避免一次性加载大量数据
      - 已实现分页功能（page, limit 参数）
      - 默认每页 50 条记录
    - [x] 优化查询性能
      - 已添加必要的数据库索引
      - 查询使用索引优化（WHERE 条件使用索引字段）
  - [x] 6.3 实现错误处理
    - 审计日志记录失败不应影响主业务
    - 记录审计日志记录失败的错误到系统日志
    - 提供友好的错误消息

## Implementation Notes

### 技术栈
- **后端：**
  - NestJS
  - PostgreSQL（存储审计日志）
  - BullMQ（可选，用于异步处理）
  - 现有的 AuditModule（如果已存在）
- **前端：**
  - React + TypeScript
  - React Query（数据获取和缓存）
  - 现有的表格和筛选组件

### 架构决策
- **审计日志存储：** 使用 PostgreSQL 数据库表存储审计日志
- **异步处理：** 使用消息队列或后台任务异步写入审计日志，避免影响主业务性能
- **查询性能：** 使用数据库索引和分页优化查询性能
- **权限控制：** 只有管理员可以查看审计日志

### 参考实现
- 参考现有的 `AuditModule`（如果已存在）
- 参考 `fenghua-backend/src/audit/audit.service.ts`（如果已存在）
- 参考其他列表页面的实现（如用户管理页面）

### 数据库
- 创建 `audit_logs` 表
- 添加索引：`user_id`, `resource_type`, `resource_id`, `created_at`

### API 端点
- `GET /api/audit-logs` - 查询审计日志列表（管理员）
- `GET /api/audit-logs/:id` - 获取审计日志详情（管理员）
- `GET /api/audit-logs/export` - 导出审计日志（管理员）

### 依赖关系
- 依赖现有的用户认证和权限系统
- 依赖现有的 AuditModule（如果已存在）

## References

- [Source: _bmad-output/epics.md#Story-9.1]
- FR90: 系统可以自动记录所有数据访问操作（谁访问了什么数据，什么时候访问）
- FR93: 管理员可以查询审计日志（按用户、按时间、按操作类型等）

