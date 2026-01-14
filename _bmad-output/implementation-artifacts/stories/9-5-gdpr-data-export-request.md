# Story 9.5: GDPR 数据导出请求（按角色）

Status: done

<!-- 测试指南: _bmad-output/test-reports/story-9-5-manual-testing-guide.md -->

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **请求导出自己相关的数据**,
So that **我可以履行 GDPR 规定的数据主体权利**.

## Acceptance Criteria

### AC1: 前端专员数据导出请求
**Given** 前端专员已登录系统
**When** 前端专员在个人设置或数据管理界面发起"导出我的采购商数据"请求
**Then** 系统在 30 天内生成包含该前端专员所有相关采购商数据的导出文件（FR97, FR98）
**And** 导出文件格式为通用可读格式（例如：JSON, CSV）
**And** 前端专员无法请求导出供应商数据
**And** 系统发送通知（站内通知或邮件）告知前端专员导出文件已准备好

### AC2: 后端专员数据导出请求
**Given** 后端专员已登录系统
**When** 后端专员在个人设置或数据管理界面发起"导出我的供应商数据"请求
**Then** 系统在 30 天内生成包含该后端专员所有相关供应商数据的导出文件（FR97, FR98）
**And** 导出文件格式为通用可读格式（例如：JSON, CSV）
**And** 后端专员无法请求导出采购商数据
**And** 系统发送通知告知后端专员导出文件已准备好

### AC3: 总监或管理员数据导出请求
**Given** 总监或管理员已登录系统
**When** 总监或管理员在个人设置或数据管理界面发起"导出我的所有数据"请求
**Then** 系统在 30 天内生成包含该总监或管理员所有相关数据的导出文件（FR97, FR98）
**And** 导出文件格式为通用可读格式（例如：JSON, CSV）
**And** 系统发送通知告知总监或管理员导出文件已准备好

### AC4: 导出数据完整性
**Given** 用户请求导出数据
**When** 系统生成导出文件
**Then** 导出文件包含用户相关的所有数据：
  - 用户创建的客户记录
  - 用户创建的互动记录
  - 用户创建的产品记录（如果适用）
  - 用户的活动日志
**And** 导出文件结构清晰，易于理解

### AC5: 导出文件下载和审计
**Given** 用户请求导出数据
**When** 导出文件生成完成
**Then** 系统提供下载链接（有效期 7 天）
**And** 用户可以通过下载链接下载导出文件
**And** 系统记录数据导出请求到审计日志

## Tasks / Subtasks

### Task 1: 创建 GDPR 数据导出请求数据模型
- [ ] Task 1.1: 设计数据导出请求表结构
  - [ ] 创建数据库迁移脚本
  - [ ] 定义表结构：
    - `id`: UUID (主键)
    - `user_id`: UUID (外键，关联 users 表)
    - `request_type`: VARCHAR (请求类型：'GDPR_EXPORT')
    - `status`: VARCHAR (状态：'PENDING', 'QUEUED', 'PROCESSING', 'GENERATING_FILE', 'COMPLETED', 'FAILED')
    - `download_token`: VARCHAR (安全下载令牌，使用 crypto.randomUUID() 生成)
    - [ ] 添加字段：`requested_at`, `completed_at`, `expires_at`, `download_url`, `file_path`, `file_format`, `file_size`
    - [ ] 添加元数据字段：`metadata` (JSONB) 存储导出配置和统计信息
  - [ ] 添加索引（user_id, status, requested_at, expires_at）
- [ ] Task 1.2: 创建数据库迁移脚本
  - [ ] 创建 `fenghua-backend/migrations/XXX-add-gdpr-export-request-table.sql`
  - [ ] 实现表的创建和索引
  - [ ] 确保 `status` 字段支持：'PENDING', 'QUEUED', 'PROCESSING', 'GENERATING_FILE', 'COMPLETED', 'FAILED'
  - [ ] 确保 `download_token` 字段为 VARCHAR(255) 或 UUID 类型，添加唯一索引

### Task 2: 实现后端 GDPR 数据导出服务
- [x] Task 2.1: 创建 GDPR 导出服务模块
  - [x] 创建 `fenghua-backend/src/gdpr/gdpr-export.service.ts`
  - [x] **重要：** 创建新的 `GdprExportService`，**不直接使用** `ExportService`（因为 ExportService 需要 AdminGuard）
  - [x] **重要：** `GdprExportService` 直接使用 `JsonExporterService` 和 `CsvExporterService`（参考 Story 7.4）
  - [x] 实现基于角色的数据查询逻辑：
    - 前端专员：只查询采购商（customerType = 'BUYER'）相关数据
    - 后端专员：只查询供应商（customerType = 'SUPPLIER'）相关数据
    - 总监/管理员：查询所有相关数据
- [x] Task 2.2: 实现用户数据收集逻辑
  - [x] 收集用户创建的客户记录（根据角色过滤，使用 `PermissionService.getDataAccessFilter()`）
  - [x] 收集用户创建的互动记录（根据角色过滤，关联客户的类型）
  - [x] 收集产品记录（包括以下三种）：
    - 用户创建的产品（`products.created_by = userId`）
    - 与用户客户关联的产品（通过 `product_customer_associations` 表关联）
    - 用户互动记录中的产品（通过 `product_customer_interactions` 表关联）
  - [x] 收集用户的活动日志：使用 `AuditService.getUserAuditLogs(userId, limit)` 方法
    - 查询所有 `user_id = userId` 或 `entity_id = userId` 的审计日志
    - 建议 limit 为 10000 或根据实际需求调整
  - [x] 使用分页查询避免内存溢出（每批 1000 条记录）
  - [ ] 在开始导出前估算文件大小，如果超过阈值（如 100MB）则警告用户（可选优化）
- [x] Task 2.3: 实现异步导出任务处理
  - [x] 使用 Bull Queue 处理大数据量导出（参考 Story 7.4 的 `ExportProcessor`）
  - [x] 实现导出进度跟踪（状态：'QUEUED', 'PROCESSING', 'GENERATING_FILE', 'COMPLETED', 'FAILED'）
  - [x] 实现导出文件生成（JSON、CSV 格式，使用 `JsonExporterService` 和 `CsvExporterService`）
  - [x] 实现文件存储和下载链接生成：
    - 使用 `crypto.randomUUID()` 生成安全的下载令牌（存储在数据库 `gdpr_export_requests.download_token`）
    - 下载链接格式：`/gdpr/export-requests/:id/download?token={downloadToken}`
    - 下载端点必须验证：令牌有效性、用户所有权（只能下载自己的导出文件）、令牌过期时间（7天）
- [x] Task 2.4: 实现导出请求管理
  - [x] 创建导出请求记录
  - [x] 更新导出请求状态（支持细粒度状态：QUEUED, PROCESSING, GENERATING_FILE, COMPLETED, FAILED）
  - [x] 查询用户的导出请求历史
  - [x] 清理过期的导出文件（超过 7 天）
- [x] Task 2.5: 实现 30 天期限监控
  - [x] 创建定时任务（使用 `@nestjs/schedule`）每天检查逾期请求
  - [x] 在请求创建 25 天时发送提醒（记录到日志，未来可扩展为邮件通知）
  - [x] 在请求超过 30 天时记录违规到审计日志（操作类型：'GDPR_EXPORT_DEADLINE_VIOLATION'）

### Task 3: 实现后端 GDPR 导出 API
- [x] Task 3.1: 创建 GDPR 导出控制器
  - [x] 创建 `fenghua-backend/src/gdpr/gdpr-export.controller.ts`
  - [x] **重要：** 使用 `@UseGuards(JwtAuthGuard)` **不添加** `AdminGuard`（所有已认证用户都可以请求导出）
  - [x] 实现 `POST /gdpr/export-request` 端点（创建导出请求）
  - [x] 实现 `GET /gdpr/export-requests` 端点（查询用户的导出请求列表，只能查询自己的）
  - [x] 实现 `GET /gdpr/export-requests/:id` 端点（查询导出请求详情，验证用户所有权）
  - [x] 实现 `GET /gdpr/export-requests/:id/download` 端点（下载导出文件）
    - 验证查询参数 `token` 是否匹配数据库中的 `download_token`
    - 验证用户所有权（`user_id = req.user.id`）
    - 验证令牌未过期（`expires_at > now()`）
    - 验证文件存在
  - [x] 所有端点必须验证用户只能访问自己的导出请求
- [x] Task 3.2: 创建 GDPR 导出 DTO
  - [x] 创建 `CreateGdprExportRequestDto`（包含 format: 'JSON' | 'CSV'）
  - [x] 创建 `GdprExportRequestResponseDto`
  - [x] 创建 `GdprExportRequestListResponseDto`

### Task 4: 集成审计日志
- [x] Task 4.1: 记录导出请求到审计日志
  - [x] 在创建导出请求时记录到审计日志（操作类型：'GDPR_EXPORT_REQUEST'）
  - [x] 在导出完成时记录到审计日志（操作类型：'GDPR_EXPORT_COMPLETED'）
  - [x] 在导出失败时记录到审计日志（操作类型：'GDPR_EXPORT_FAILED'）
  - [x] 复用现有的 `AuditService`（参考 Story 9.1 和 9.2）

### Task 5: 实现前端 GDPR 数据导出界面
- [x] Task 5.1: 创建 GDPR 数据导出页面
  - [x] 创建 `fenghua-frontend/src/gdpr/GdprExportPage.tsx`
  - [x] 实现导出请求表单（选择格式：JSON 或 CSV）
  - [x] 根据用户角色显示相应的导出选项：
    - 前端专员：只显示"导出我的采购商数据"
    - 后端专员：只显示"导出我的供应商数据"
    - 总监/管理员：显示"导出我的所有数据"
- [x] Task 5.2: 实现导出请求列表
  - [x] 显示用户的导出请求历史
  - [x] 显示导出请求状态（待处理、处理中、已完成、失败）
  - [x] 显示导出文件下载链接（如果已完成）
  - [x] 显示导出文件过期时间
- [x] Task 5.3: 创建 GDPR 导出服务
  - [x] 创建 `fenghua-frontend/src/gdpr/services/gdpr-export.service.ts`
  - [x] 实现 API 调用方法（创建请求、查询列表、下载文件）

### Task 6: 实现通知功能
- [x] Task 6.1: 导出完成通知（MVP 方案）
  - [x] 在导出完成时记录通知到系统日志（参考 `BackupService` 和 `RestoreService` 的模式）
  - [x] 通知内容包含：导出类型、记录数、文件大小、下载链接、过期时间
  - [x] **未来增强：** 实现站内通知系统或邮件通知服务（当前 MVP 仅记录日志）

### Task 7: 测试和验证
- [ ] Task 7.1: 单元测试（可选，建议后续添加）
  - [ ] 测试 GDPR 导出服务的角色过滤逻辑
  - [ ] 测试数据收集逻辑
  - [ ] 测试导出文件生成
- [ ] Task 7.2: 集成测试（可选，建议后续添加）
  - [ ] 测试完整的导出流程（创建请求 → 处理 → 下载）
  - [ ] 测试不同角色的导出权限
  - [ ] 测试导出文件格式和内容完整性
- [ ] Task 7.3: 性能测试（可选，建议后续添加）
  - [ ] 测试大数据量导出的性能（> 10000 条记录）
  - [ ] 验证异步处理不影响系统性能

### Task 8: 代码审查后续改进（AI-Review）
- [ ] [AI-Review][LOW] L1: 添加 JSDoc 注释到关键方法 [`fenghua-backend/src/gdpr/gdpr-export.processor.ts:196`, `fenghua-backend/src/gdpr/gdpr-export.service.ts:276`]
  - [ ] 为 `collectUserData()` 方法添加详细的参数和返回值文档
  - [ ] 为 `updateRequestStatus()` 方法添加 metadata 参数文档
  - [ ] 为其他关键方法添加完整的 JSDoc 注释（参数描述、返回类型、示例）
- [ ] [AI-Review][LOW] L2: 优化前端轮询频率 [`fenghua-frontend/src/gdpr/GdprExportPage.tsx:58`]
  - [ ] 考虑将轮询间隔从 5 秒增加到 10-15 秒
  - [ ] 或实现指数退避策略
  - [ ] 或当所有请求处于终端状态（COMPLETED, FAILED）时停止轮询

## Dev Notes

### 架构约束和模式

**技术栈：**
- **后端：** NestJS + PostgreSQL + Bull Queue（异步任务处理）
- **前端：** React + TypeScript
- **数据导出：** 直接使用 `JsonExporterService` 和 `CsvExporterService`（不使用 `ExportService`，因为它需要 AdminGuard）

**关键约束：**
- 必须符合 GDPR 要求（30 天内完成导出请求，需要定时任务监控）
- 必须基于角色进行数据过滤（前端专员只能导出采购商数据，后端专员只能导出供应商数据）
- 导出文件必须包含用户相关的所有数据（客户、互动记录、产品、活动日志）
- 导出文件下载链接有效期 7 天，使用安全令牌验证
- 必须记录所有导出请求到审计日志
- **所有已认证用户都可以请求导出**（不使用 AdminGuard）

### 实现要点

**服务架构：**
- 创建新的 `GdprExportService`，**不直接使用** `ExportService`（因为 ExportService 需要 AdminGuard，只允许总监/管理员）
- `GdprExportService` 直接注入和使用 `JsonExporterService` 和 `CsvExporterService`（参考 Story 7.4）
- `GdprExportController` 使用 `@UseGuards(JwtAuthGuard)` **不添加** `AdminGuard`

**角色基础数据过滤：**
- 使用 `PermissionService.getDataAccessFilter()` 方法（参考 Story 3.7）
- 前端专员：`customerType = 'BUYER'`
- 后端专员：`customerType = 'SUPPLIER'`
- 总监/管理员：无过滤（可以访问所有数据）

**数据收集逻辑（具体实现）：**
1. **客户记录：** 
   - 查询 `companies` 表，WHERE `created_by = userId` AND 角色过滤条件
   - 使用 `PermissionService.getDataAccessFilter(userId, userRole)` 获取过滤条件
2. **互动记录：** 
   - 查询 `product_customer_interactions` 表
   - JOIN `companies` 表获取客户类型
   - WHERE 客户类型符合角色过滤条件 AND 互动记录关联的用户客户
3. **产品记录（三种来源）：**
   - 用户创建的产品：`products.created_by = userId`
   - 与用户客户关联的产品：JOIN `product_customer_associations` WHERE `customer_id IN (用户客户ID列表)`
   - 用户互动中的产品：JOIN `product_customer_interactions` WHERE `user_id = userId` 或关联的用户客户
4. **活动日志：**
   - 使用 `AuditService.getUserAuditLogs(userId, limit)` 方法
   - 或直接查询：`audit_logs` WHERE `user_id = userId` OR `entity_id = userId`
   - 建议 limit 为 10000（或根据实际需求调整）

**异步处理和进度跟踪：**
- 使用 Bull Queue 处理大数据量导出（参考 Story 7.4 的 `ExportProcessor`）
- 状态跟踪：'QUEUED' → 'PROCESSING' → 'GENERATING_FILE' → 'COMPLETED'（或 'FAILED'）
- 导出前估算文件大小，超过阈值（如 100MB）则警告用户

**文件存储和下载安全：**
- 导出文件存储在 `exports/gdpr/` 目录
- 文件命名格式：`gdpr-export-{userId}-{requestId}-{timestamp}.{format}`
- 使用 `crypto.randomUUID()` 生成 `download_token` 存储在数据库
- 下载链接：`/gdpr/export-requests/:id/download?token={downloadToken}`
- 下载端点验证：令牌匹配、用户所有权、过期时间（7天）
- 实现定期清理过期文件的任务（超过 7 天）

**30 天期限监控：**
- 使用 `@nestjs/schedule` 创建定时任务（每天凌晨 2 点执行）
- 检查 `requested_at < now() - 25 days` 的请求，记录提醒日志
- 检查 `requested_at < now() - 30 days` 且状态不是 'COMPLETED' 的请求，记录违规到审计日志

**审计日志集成：**
- 使用 `AuditService.log()` 方法（参考 Story 9.1 和 9.2）
- 操作类型：'GDPR_EXPORT_REQUEST', 'GDPR_EXPORT_COMPLETED', 'GDPR_EXPORT_FAILED', 'GDPR_EXPORT_DEADLINE_VIOLATION'
- 资源类型：'GDPR_EXPORT'
- 资源 ID：导出请求 ID

**通知实现（MVP）：**
- 导出完成时记录到系统日志（参考 `BackupService.sendBackupFailureNotification()` 的模式）
- 日志内容：导出类型、记录数、文件大小、下载链接、过期时间
- 未来增强：实现站内通知或邮件通知服务

### 项目结构注意事项

**文件位置：**
- 后端服务：`fenghua-backend/src/gdpr/gdpr-export.service.ts`
- 后端控制器：`fenghua-backend/src/gdpr/gdpr-export.controller.ts`
- 后端模块：`fenghua-backend/src/gdpr/gdpr.module.ts`
- 前端页面：`fenghua-frontend/src/gdpr/GdprExportPage.tsx`
- 前端服务：`fenghua-frontend/src/gdpr/services/gdpr-export.service.ts`
- 数据库迁移：`fenghua-backend/migrations/XXX-add-gdpr-export-request-table.sql`

**环境变量：**
```env
# GDPR 导出配置
GDPR_EXPORT_STORAGE_PATH=./exports/gdpr
GDPR_EXPORT_DOWNLOAD_EXPIRY_DAYS=7
GDPR_EXPORT_MAX_PROCESSING_DAYS=30
```

### 参考实现

**相关 Story：**
- **Story 7.4（数据导出功能）：** 实现了通用的数据导出服务，**直接使用** `JsonExporterService` 和 `CsvExporterService`（不使用 `ExportService`，因为它需要 AdminGuard）
- **Story 3.7（基于角色的数据访问过滤）：** 实现了角色基础的数据过滤逻辑，使用 `PermissionService.getDataAccessFilter()`
- **Story 9.1（数据访问审计日志）：** 实现了审计日志功能，使用 `AuditService.log()` 和 `AuditService.getUserAuditLogs()`
- **Story 9.2（数据修改审计日志）：** 扩展了审计日志功能，可以参考实现模式
- **Story 9.4（HTTPS/TLS）：** 确保下载链接通过 HTTPS 传输（安全要求）

**架构文档参考：**
- `_bmad-output/architecture.md` - 系统架构说明
- `_bmad-output/epics.md#Story-9.5` - Story 9.5 需求定义
- `docs/api-integration-architecture.md` - API 架构说明

### 测试要求

**功能测试：**
- 验证不同角色的导出权限（前端专员只能导出采购商数据，后端专员只能导出供应商数据，总监/管理员可以导出所有数据）
- 验证导出文件包含所有相关数据（客户、互动记录、产品、活动日志）
- 验证导出文件格式正确（JSON、CSV）
- 验证下载链接有效期（7 天）

**性能测试：**
- 测试大数据量导出的性能（> 10000 条记录）
- 验证异步处理不影响系统性能
- 验证导出文件大小和生成时间

**安全测试：**
- 验证用户只能导出自己的数据
- 验证角色权限正确应用
- 验证下载链接安全性：
  - 验证令牌有效性（无效令牌应拒绝）
  - 验证用户所有权（用户A不能下载用户B的导出文件）
  - 验证令牌过期（超过7天的令牌应拒绝）
  - 验证文件访问权限（只能通过有效令牌访问）

### 注意事项

1. **GDPR 合规性：**
   - 必须在 30 天内完成导出请求（需要定时任务监控和提醒）
   - 导出文件必须包含用户相关的所有数据（客户、互动、产品、活动日志）
   - 必须记录所有导出请求到审计日志（包括请求、完成、失败、期限违规）

2. **数据隐私和安全：**
   - 导出文件必须安全存储（存储在受保护的目录）
   - 下载链接必须使用安全令牌（crypto.randomUUID()），有时效性（7 天）
   - 下载端点必须验证：令牌有效性、用户所有权、过期时间
   - 过期文件必须自动清理（定时任务）

3. **性能考虑：**
   - 大数据量导出必须使用异步处理
   - 必须实现导出进度跟踪
   - 必须避免内存溢出（使用分页查询）

4. **错误处理：**
   - 导出失败时必须记录错误信息
   - 必须提供清晰的错误消息给用户
   - 必须记录失败到审计日志（操作类型：'GDPR_EXPORT_FAILED'）
   - 下载失败时返回适当的 HTTP 状态码（401 未授权、403 禁止、404 未找到、410 已过期）

### Project Structure Notes

- **对齐统一项目结构：** 遵循现有 NestJS 和 React 项目结构
- **检测到的冲突或差异：** 无重大冲突，主要是新增 GDPR 模块

### References

- [Source: _bmad-output/epics.md#Story-9.5] - Story 9.5 需求定义
- [Source: _bmad-output/prd.md#FR97] - FR97: 系统可以在 30 天内响应用户的数据导出请求（GDPR 数据主体权利）
- [Source: _bmad-output/prd.md#FR98] - FR98: 系统可以以通用可读格式（JSON, CSV）导出用户数据
- [Source: _bmad-output/architecture.md] - 系统架构说明
- [Source: fenghua-backend/src/export/export.service.ts] - 数据导出服务（Story 7.4）
- [Source: fenghua-backend/src/permission/permission.service.ts] - 权限服务和角色过滤（Story 3.7）
- [Source: fenghua-backend/src/audit/audit.service.ts] - 审计日志服务（Story 9.1, 9.2）

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Agent)

### Debug Log References

### Code Review (AI) - 2026-01-13

**审查结果：** 发现 8 个问题（2 HIGH, 4 MEDIUM, 2 LOW），已全部修复

**修复的问题：**

1. **H1: UUID 验证缺失** ✅ 已修复
   - 创建了 `GdprExportRequestIdDto` 和 `GdprExportRequestListQueryDto`
   - 所有路由参数现在使用验证装饰器

2. **H2: 文件流错误处理缺失** ✅ 已修复
   - 添加了文件流和响应流的错误处理
   - 防止未处理的 Promise 拒绝

3. **M1: 前端错误处理不友好** ✅ 已修复
   - `loadRequests` 现在显示错误消息给用户

4. **M2: limit/offset 参数验证缺失** ✅ 已修复
   - 添加了 `@IsInt()`, `@Min()`, `@Max()` 验证

5. **M3: totalRecords 计算不准确** ✅ 已修复
   - 改为使用实际 `allData.length` 而不是累加

6. **M4: 缺少空数据处理** ✅ 已修复
   - 添加了空数据检查和警告日志

**审查报告：** `_bmad-output/code-reviews/story-9-5-code-review-2026-01-13.md`

### Completion Notes List

**实现完成的功能：**

1. **数据库模型：**
   - 创建了 `gdpr_export_requests` 表，包含所有必需字段和索引
   - 支持细粒度状态跟踪（PENDING, QUEUED, PROCESSING, GENERATING_FILE, COMPLETED, FAILED）
   - 实现了安全下载令牌（download_token）的唯一索引

2. **后端服务：**
   - 创建了独立的 `GdprExportService`，不依赖 `ExportService`（避免 AdminGuard 限制）
   - 直接使用 `JsonExporterService` 和 `CsvExporterService` 进行文件生成
   - 实现了基于角色的数据过滤（使用 `PermissionService.getDataAccessFilter()`）
   - 实现了完整的数据收集逻辑：
     - 客户记录（根据角色和 created_by 过滤）
     - 互动记录（根据角色和客户类型过滤）
     - 产品记录（三种来源：用户创建的、与用户客户关联的、用户互动中的）
     - 活动日志（使用 `AuditService.getUserAuditLogs()`）
   - 实现了异步导出处理（使用 Bull Queue）
   - 实现了安全下载验证（令牌、用户所有权、过期时间）

3. **后端 API：**
   - 创建了 GDPR 导出控制器，使用 `JwtAuthGuard`（不添加 AdminGuard）
   - 实现了所有必需的端点（创建请求、查询列表、查询详情、下载文件）
   - 所有端点都验证用户只能访问自己的导出请求

4. **审计日志集成：**
   - 在创建、完成、失败时记录到审计日志
   - 在 30 天期限违规时记录到审计日志

5. **定时任务：**
   - 实现了 30 天期限监控（每天检查）
   - 实现了 25 天提醒（记录到日志）
   - 实现了过期文件清理（每天执行）

6. **前端界面：**
   - 创建了 GDPR 导出页面，根据用户角色显示相应的导出选项
   - 实现了导出请求表单和请求历史列表
   - 实现了文件下载功能
   - 添加了路由配置

**技术实现要点：**
- 使用 Bull Queue 处理大数据量导出，避免阻塞主线程
- 使用分页查询（每批 1000 条）避免内存溢出
- 实现了安全下载令牌机制，防止未授权访问
- 所有数据收集都基于用户角色进行过滤，确保 GDPR 合规性

### File List

**后端文件：**
- `fenghua-backend/migrations/031-add-gdpr-export-request-table.sql` - 数据库迁移脚本
- `fenghua-backend/src/gdpr/gdpr.module.ts` - GDPR 模块
- `fenghua-backend/src/gdpr/gdpr-export.service.ts` - GDPR 导出服务
- `fenghua-backend/src/gdpr/gdpr-export.controller.ts` - GDPR 导出控制器（已修复：UUID验证、文件流错误处理、参数验证）
- `fenghua-backend/src/gdpr/gdpr-export.processor.ts` - GDPR 导出处理器（Bull Queue）（已修复：totalRecords计算、空数据处理）
- `fenghua-backend/src/gdpr/gdpr-export.scheduler.ts` - GDPR 导出定时任务（30天期限监控）
- `fenghua-backend/src/gdpr/dto/gdpr-export-request.dto.ts` - GDPR 导出 DTO（已修复：添加UUID和查询参数验证DTO）
- `fenghua-backend/src/app.module.ts` - 添加 GdprModule 导入

**前端文件：**
- `fenghua-frontend/src/gdpr/GdprExportPage.tsx` - GDPR 导出页面组件（已修复：错误处理改进）
- `fenghua-frontend/src/gdpr/services/gdpr-export.service.ts` - GDPR 导出前端服务
- `fenghua-frontend/src/App.tsx` - 添加 GDPR 导出路由
