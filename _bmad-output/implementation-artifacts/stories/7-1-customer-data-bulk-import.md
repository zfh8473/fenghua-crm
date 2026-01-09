# Story 7.1: 客户数据批量导入（Excel/CSV）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **总监或管理员**,
I want **从 Excel 文件（CSV 和基本 Excel 格式）批量导入客户数据**,
So that **我可以快速将历史客户数据迁移到 CRM 系统**.

## Acceptance Criteria

### AC1: 文件格式验证和上传
**Given** 总监或管理员已登录系统并进入数据导入界面
**When** 总监或管理员上传一个包含客户数据的 Excel 或 CSV 文件
**Then** 系统在导入前验证文件格式和数据完整性（FR39）
**And** 系统支持 CSV 格式（.csv）
**And** 系统支持基本 Excel 格式（.xlsx, .xls）
**And** 系统显示文件大小限制（如最大 50MB）

### AC2: 数据映射预览
**Given** 总监或管理员上传文件
**When** 文件格式验证通过
**Then** 系统解析文件内容
**And** 系统显示数据映射预览界面，允许总监或管理员确认 Excel 列与 CRM 字段的映射关系（FR42）
**And** 系统自动识别常见的列名映射（如"客户名称"映射到"name"）
**And** 总监或管理员可以手动调整映射关系

### AC3: 数据验证和错误检测
**Given** 总监或管理员确认数据映射
**When** 系统开始导入
**Then** 系统在导入前检测并报告数据错误（例如：必填字段缺失、格式错误），并提供数据清洗建议（FR40, FR41）
**And** 系统显示数据验证结果（成功记录数、失败记录数、错误详情）
**And** 总监或管理员可以查看错误详情并决定是否继续导入

### AC4: 异步导入和进度跟踪
**Given** 总监或管理员确认导入
**When** 系统开始异步处理导入任务（架构：Bull Queue）
**Then** 系统显示导入进度（FR43）
**And** 系统显示当前处理进度（如"已处理 100/500 条记录"）
**And** 系统显示预计剩余时间
**And** 系统支持导入任务的后台处理，用户可以关闭页面

### AC5: 导入结果和错误报告
**Given** 系统完成导入
**When** 导入任务完成
**Then** 系统显示导入结果摘要（成功记录数、失败记录数）
**And** 系统支持部分成功导入（部分记录导入成功，部分失败）（FR45）
**And** 系统提供详细的错误报告（FR44）
**And** 总监或管理员可以下载失败记录的 Excel 文件，修正后重新导入

## Tasks / Subtasks

- [x] Task 1: 后端文件上传和解析基础设施 (AC: 1,2)
  - [x] 1.1 安装和配置 Excel/CSV 解析库（xlsx, csv-parser）
  - [x] 1.2 创建文件上传端点（POST /api/import/customers/upload）
    - 使用 `@UseInterceptors(FileInterceptor('file'))` 处理文件上传
    - 实现临时文件存储（存储在 `/tmp/imports/` 或环境变量配置的临时目录）
    - 文件上传后立即解析，不保存到永久存储
  - [x] 1.3 实现文件格式验证（.csv, .xlsx, .xls，最大 50MB）
  - [x] 1.4 实现文件解析服务（ExcelParserService, CsvParserService）
  - [x] 1.5 实现列名自动识别和映射逻辑（常见列名映射规则）

- [x] Task 2: 数据映射预览 API (AC: 2)
  - [x] 2.1 创建数据映射预览端点（POST /api/import/customers/preview）
  - [x] 2.2 实现列名到字段的自动映射算法
  - [x] 2.3 返回解析后的数据样本（前 10 行）和映射建议
  - [x] 2.4 实现手动映射调整的验证逻辑

- [x] Task 3: 数据验证和错误检测 (AC: 3)
  - [x] 3.1 创建数据验证服务（CustomerImportValidationService）
  - [x] 3.2 实现必填字段验证（name, customerType）
  - [x] 3.3 实现数据类型和格式验证（email, phone, employees 等）
  - [x] 3.4 实现数据清洗建议逻辑（自动修复常见错误）
  - [x] 3.5 实现重复数据检测（基于 name 或 customerCode）
  - [x] 3.6 创建验证结果 DTO（成功/失败记录列表，错误详情）

- [x] Task 4: 异步导入任务（Bull Queue）(AC: 4)
  - [x] 4.1 安装和配置 BullMQ 和 Redis
    - 安装: `npm install @nestjs/bullmq bullmq ioredis`
    - 配置 BullMQ 模块（在 `customers-import.module.ts` 中）
    - 配置 Redis 连接（使用 `REDIS_URL` 环境变量）
  - [x] 4.2 创建导入任务队列（customer-import-queue）
  - [x] 4.3 创建导入任务处理器（CustomerImportProcessor）
  - [x] 4.4 实现批量插入逻辑（分批处理，每批 100 条）
    - 使用 PostgreSQL 批量 `INSERT`（避免使用 `CompaniesService.create()` 循环调用，防止 N+1 问题）
    - 创建专门的 `CompaniesService.bulkCreate()` 方法
    - 使用事务确保原子性（全部成功或全部回滚）
  - [x] 4.5 实现进度跟踪（已处理记录数、总记录数、预计剩余时间）
    - 使用 `job.updateProgress()` 更新进度
  - [x] 4.6 创建导入任务状态查询端点（GET /api/import/customers/tasks/:taskId）

- [x] Task 5: 导入结果和错误报告 (AC: 5)
  - [x] 5.1 实现部分成功导入逻辑（记录成功和失败的记录）
    - 使用 PostgreSQL 保存点（SAVEPOINT）实现部分回滚
    - 成功记录提交，失败记录回滚到保存点
  - [x] 5.2 创建导入结果摘要 DTO（成功数、失败数、错误详情）
  - [x] 5.3 实现失败记录导出功能（生成 Excel 文件，包含错误信息）
  - [x] 5.4 创建导入历史记录表（import_history）和存储逻辑
    - 使用 `AuditService.log()` 记录所有导入操作
    - 记录操作类型: 'IMPORT_CUSTOMERS'
    - 记录元数据: 文件名称、总记录数、成功数、失败数
  - [x] 5.5 实现导入历史查询端点（GET /api/import/customers/history）

- [x] Task 6: 前端文件上传和映射预览界面 (AC: 1,2)
  - [x] 6.1 创建数据导入页面组件（CustomerImportPage）
  - [x] 6.2 实现文件上传组件（支持拖拽上传，显示文件大小限制）
  - [x] 6.3 实现数据映射预览界面（显示 Excel 列和 CRM 字段的映射关系）
  - [x] 6.4 实现自动映射识别和手动调整功能
  - [x] 6.5 实现数据样本预览（显示前 10 行解析后的数据）

- [x] Task 7: 前端数据验证和确认界面 (AC: 3)
  - [x] 7.1 实现数据验证结果显示（成功/失败记录数、错误详情）
  - [x] 7.2 实现错误详情查看功能（展开/折叠错误列表）
  - [x] 7.3 实现数据清洗建议显示和确认功能
  - [x] 7.4 实现导入确认对话框（显示验证结果摘要）

- [x] Task 8: 前端导入进度和结果界面 (AC: 4,5)
  - [x] 8.1 实现导入进度显示（进度条、已处理记录数、预计剩余时间）
  - [x] 8.2 实现轮询机制获取实时进度更新（MVP 使用轮询，每 2 秒）
    - 使用 React Query 的 `useQuery` 配合 `refetchInterval: 2000`
    - 未来优化: WebSocket（实时更新，减少服务器负载）
  - [x] 8.3 实现导入结果摘要显示（成功数、失败数）
  - [x] 8.4 实现失败记录下载功能（下载包含错误信息的 Excel 文件）
  - [x] 8.5 实现导入历史记录查看功能

- [x] Task 9: 测试和验证 (AC: 1,2,3,4,5)
  - [x] 9.1 编写单元测试（文件解析、数据验证、映射逻辑）
  - [x] 9.2 编写集成测试（文件上传、映射预览、导入流程）
  - [x] 9.3 测试大文件导入（5000+ 记录）的性能和稳定性
  - [x] 9.4 测试部分成功导入场景（部分记录成功，部分失败）
  - [x] 9.5 测试错误处理和恢复机制
    - 测试导入失败时的临时文件清理
    - 测试队列任务失败时的重试机制
    - 测试部分成功导入的事务回滚策略

## Dev Notes

### 架构决策和约束

**Excel 导入处理策略（ADR-005）：**
- **决策：** 异步处理（Bull Queue）
- **理由：** 非阻塞用户体验，处理大文件，进度跟踪，错误处理
- **实施：** 使用 BullMQ（或 Bull）和 Redis 实现任务队列
- [Source: _bmad-output/architecture.md#ADR-005]

**技术栈约束：**
- **后端：** NestJS + TypeScript + PostgreSQL，RESTful API（无 GraphQL）
- **数据库访问：** 使用原生 PostgreSQL (`pg.Pool`)，不使用 TypeORM
  - 参考: `fenghua-backend/src/companies/companies.service.ts` 使用 `this.pgPool.query()` 进行数据库操作
- **前端：** React 18+ + TypeScript + Vite + React Query
- **文件上传：** 参考现有的 `FileUpload` 组件模式
- [Source: _bmad-output/project-context.md#Technology-Stack]
- [Source: fenghua-backend/src/companies/companies.service.ts]

### 数据库表结构

**Companies 表字段：**
- `id` (UUID, PRIMARY KEY)
- `name` (VARCHAR(255), NOT NULL) - **必填**
- `customer_code` (VARCHAR(50), UNIQUE) - 可选，自动生成
- `customer_type` (VARCHAR(50), NOT NULL) - **必填**，'BUYER' 或 'SUPPLIER'
- `domain_name` (VARCHAR(255))
- `address` (TEXT)
- `city` (VARCHAR(100))
- `state` (VARCHAR(100))
- `country` (VARCHAR(100))
- `postal_code` (VARCHAR(20))
- `industry` (VARCHAR(100))
- `employees` (INTEGER)
- `website` (VARCHAR(255))
- `phone` (VARCHAR(50))
- `email` (VARCHAR(255))
- `notes` (TEXT)
- `created_by` (UUID, REFERENCES users(id))
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)
- [Source: fenghua-backend/migrations/006-create-companies-and-people-tables.sql]

### 数据验证规则

**必填字段：**
- `name`: 字符串，1-255 字符，不能为空
- `customerType`: 枚举值 'BUYER' 或 'SUPPLIER'，不能为空

**可选字段验证：**
- `customerCode`: 1-50 个字母数字字符，格式：`/^[a-zA-Z0-9]{1,50}$/`
- `email`: 邮箱格式验证
- `employees`: 整数，1-1000000
- `phone`: 最大 50 字符
- `website`: 最大 255 字符
- 其他字符串字段：根据字段类型有最大长度限制
- [Source: fenghua-backend/src/companies/dto/create-customer.dto.ts]

### 列名自动映射规则

| Excel 列名（中文） | CRM 字段 | 转换规则 |
|-------------------|---------|---------|
| 客户名称 / 公司名称 / 名称 | `name` | 直接映射 |
| 客户代码 / 代码 | `customerCode` | 直接映射 |
| 客户类型 / 类型 | `customerType` | 采购商→BUYER, 供应商→SUPPLIER |
| 域名 / 公司域名 | `domainName` | 直接映射 |
| 地址 | `address` | 直接映射 |
| 城市 | `city` | 直接映射 |
| 州/省 / 省份 | `state` | 直接映射 |
| 国家 | `country` | 直接映射 |
| 邮编 / 邮政编码 | `postalCode` | 直接映射 |
| 行业 | `industry` | 直接映射 |
| 员工数 / 员工数量 | `employees` | 字符串转数字，去除非数字字符 |
| 网站 / 网址 | `website` | 直接映射 |
| 电话 / 联系电话 | `phone` | 去除空格、连字符、括号 |
| 邮箱 / 电子邮件 | `email` | 去除空格，转换为小写 |
| 备注 / 说明 | `notes` | 直接映射 |

### 文件解析库选择

**推荐库：**
- **Excel 解析：** `xlsx` (SheetJS) - 支持 .xlsx 和 .xls 格式
  - 最新版本：^0.18.5（2024年）
  - 特点：纯 JavaScript，无依赖，支持浏览器和 Node.js
- **CSV 解析：** `csv-parser` 或 `papaparse`
  - `csv-parser`: 流式处理，适合大文件
  - `papaparse`: 功能丰富，支持浏览器和 Node.js

**实施建议：**
- 后端使用 `xlsx` 处理 Excel 文件
- 后端使用 `csv-parser` 处理 CSV 文件（流式处理，性能好）
- [Source: Web research - xlsx npm library latest version 2024]

### Bull Queue 配置

**库选择:**
- **推荐:** `@nestjs/bullmq` + `bullmq` (NestJS 官方支持，TypeScript 友好)
- **版本:** `@nestjs/bullmq: ^10.x`, `bullmq: ^5.x`
- **安装:** `npm install @nestjs/bullmq bullmq ioredis`
- **注意:** 项目已有 `redis` 包，但 BullMQ 使用 `ioredis` 作为 Redis 客户端
- **Redis 配置:** 需要配置 `REDIS_URL` 环境变量（项目已有 Redis 健康检查，参考 `fenghua-backend/src/monitoring/health.service.ts`）

**队列设置：**
- **队列名称：** `customer-import-queue`
- **并发处理：** 1（避免数据库压力过大）
- **重试策略：** 失败后重试 3 次，指数退避
- **任务超时：** 30 分钟（大文件导入可能需要较长时间）

**进度跟踪：**
- 使用 BullMQ 的 `updateProgress()` 方法更新任务进度
- **MVP 选择:** 前端使用轮询（每 2 秒）获取进度更新，使用 React Query 的 `refetchInterval`
- **未来优化:** WebSocket（实时更新，减少服务器负载）
- 存储进度信息到 Redis 或数据库（import_history 表）

**任务状态：**
- `waiting`: 等待处理
- `active`: 正在处理
- `completed`: 处理完成
- `failed`: 处理失败
- `progress`: 处理进度（0-100）

### 数据清洗建议

**自动修复规则：**
- **邮箱格式：** 自动去除空格，转换为小写
- **电话格式：** 自动去除空格、连字符、括号
- **客户类型：** 自动转换中文到英文（采购商→BUYER, 供应商→SUPPLIER）
- **员工数：** 自动转换字符串到数字，去除非数字字符
- **必填字段缺失：** 提供默认值建议（customerType 默认为 BUYER）

### 重复数据检测

**检测策略：**
- **主要检测字段：** `name`（精确匹配，忽略大小写）
- **次要检测字段：** `customerCode`（如果提供）
- **检测逻辑：** 在导入前查询数据库，检查是否存在相同 name 的记录（排除软删除）
- **处理方式：** 标记为重复，用户可以选择跳过或更新

### 错误报告格式

**失败记录 Excel 文件结构：**
- 原始数据列（所有原始 Excel 列）
- 错误信息列（`_error_message`）
- 错误字段列（`_error_fields`）
- 行号列（`_row_number`）

**错误详情格式：**
```json
{
  "row": 5,
  "errors": [
    {
      "field": "name",
      "message": "客户名称不能为空"
    },
    {
      "field": "customerType",
      "message": "客户类型必须是 BUYER 或 SUPPLIER"
    }
  ]
}
```

### 导入历史记录表

**表结构（import_history）：**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, REFERENCES users(id))
- `file_name` (VARCHAR(255))
- `file_size` (BIGINT)
- `total_records` (INTEGER)
- `success_count` (INTEGER)
- `failure_count` (INTEGER)
- `status` (VARCHAR(50)) - 'completed', 'failed', 'processing'
- `error_report_url` (VARCHAR(500)) - 失败记录文件 URL
- `created_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

### 文件结构

**后端模块 (`fenghua-backend/src/import/customers/`):**
- `customers-import.module.ts` - 导入模块（注册 BullMQ 队列）
- `customers-import.controller.ts` - 导入控制器（文件上传、预览、任务状态、历史查询）
- `customers-import.service.ts` - 导入服务（文件解析、映射、验证、任务管理）
- `customers-import.processor.ts` - BullMQ 处理器（异步导入任务执行）
- `dto/upload-file.dto.ts` - 文件上传 DTO
- `dto/mapping-preview.dto.ts` - 映射预览 DTO
- `dto/import-result.dto.ts` - 导入结果 DTO
- `services/excel-parser.service.ts` - Excel 解析服务
- `services/csv-parser.service.ts` - CSV 解析服务
- `services/validation.service.ts` - 数据验证服务
- `services/mapping.service.ts` - 列名映射服务

**数据库迁移:**
- `fenghua-backend/migrations/017-create-import-history-table.sql` - 导入历史表迁移

**前端模块 (`fenghua-frontend/src/import/`):**
- `pages/CustomerImportPage.tsx` - 导入页面（主入口）
- `components/FileUploadStep.tsx` - 文件上传步骤
- `components/MappingPreviewStep.tsx` - 映射预览步骤
- `components/ValidationStep.tsx` - 验证步骤
- `components/ImportProgressStep.tsx` - 导入进度步骤（轮询更新）
- `components/ImportResultStep.tsx` - 导入结果步骤
- `services/customers-import.service.ts` - 导入服务（API 调用）
- `hooks/useCustomerImport.ts` - 导入 Hook（React Query 集成）

### 参考实现

**文件上传模式：**
- 参考 `fenghua-frontend/src/attachments/components/FileUpload.tsx` 的文件上传实现
- 参考 `fenghua-frontend/src/attachments/services/attachments.service.ts` 的上传服务
- 注意: 导入文件使用临时存储，不同于附件的永久存储
- [Source: fenghua-frontend/src/attachments/components/FileUpload.tsx]

**客户创建模式：**
- 参考 `fenghua-backend/src/companies/companies.service.ts#create` 的客户创建逻辑
- 参考 `fenghua-backend/src/companies/dto/create-customer.dto.ts` 的验证规则
- 注意: 批量创建需要创建专门的 `bulkCreate()` 方法，避免 N+1 问题
- [Source: fenghua-backend/src/companies/companies.service.ts#create]

**权限检查模式：**
- 参考 `fenghua-backend/src/users/guards/admin.guard.ts` 的权限守卫实现
- 参考 `fenghua-backend/src/permission/permission.service.ts` 的权限服务
- 导入功能需要总监和管理员权限，可以使用 `AdminGuard` 或创建 `DirectorOrAdminGuard`
- [Source: fenghua-backend/src/users/guards/admin.guard.ts]

**审计日志模式：**
- 参考 `fenghua-backend/src/audit/audit.service.ts` 的审计日志实现
- 参考 `fenghua-backend/src/companies/companies.service.ts#create` 的审计日志记录
- 所有导入操作需要记录审计日志
- [Source: fenghua-backend/src/audit/audit.service.ts]

**数据库访问模式：**
- 参考 `fenghua-backend/src/companies/companies.service.ts` 使用 `pg.Pool.query()` 进行数据库操作
- 不使用 TypeORM，使用原生 PostgreSQL 查询
- [Source: fenghua-backend/src/companies/companies.service.ts]

### 性能优化

**批量插入优化：**
- 使用 PostgreSQL 批量 `INSERT`（每批 100 条）
  - 格式: `INSERT INTO companies (...) VALUES (...), (...), ...`
  - 避免使用 `CompaniesService.create()` 循环调用（N+1 问题）
  - 创建专门的 `CompaniesService.bulkCreate()` 方法
  - 参考: `fenghua-backend/src/companies/companies.service.ts#create` 的单条创建逻辑
- 使用事务确保数据一致性
  - 部分成功导入: 使用保存点（SAVEPOINT）实现部分回滚
  - 成功记录提交，失败记录回滚到保存点
  - **错误处理和清理:**
    - 导入失败时：清理临时文件、取消队列任务、记录错误日志
    - 队列任务失败时：自动重试 3 次，最终失败时发送通知
    - 临时文件清理：导入完成后立即删除，失败时保留 24 小时
- 在导入前禁用外键检查（如果可能），导入后重新启用

**内存优化：**
- 流式处理 CSV 文件（使用 `csv-parser` 的流式 API）
- Excel 文件分批读取（如果文件很大）
- 避免将整个文件加载到内存

### 测试标准

**单元测试：**
- 文件解析逻辑（Excel 和 CSV）
- 列名映射算法
- 数据验证规则
- 数据清洗建议逻辑
- 重复数据检测

**集成测试：**
- 文件上传流程
- 映射预览流程
- 数据验证流程
- 异步导入流程
- 错误报告生成

**性能测试：**
- 测试 1000+ 记录的导入性能
- 测试 5000+ 记录的导入性能
- 验证导入时间 < 5 分钟（5000 条记录）

### 安全考虑

**文件上传安全：**
- 验证文件类型（MIME type 和文件扩展名）
- 限制文件大小（最大 50MB）
- 扫描恶意内容（可选，MVP 后实现）
- **临时文件处理:**
  - 导入文件存储在临时目录（`/tmp/imports/` 或环境变量 `IMPORT_TEMP_DIR` 配置）
  - 文件上传后立即解析，不保存到永久存储
  - 导入完成后自动删除临时文件
  - 如果导入失败，保留文件 24 小时供调试，然后自动清理
  - 参考: `fenghua-backend/src/attachments/storage/local-storage.service.ts` 的存储模式

**数据安全：**
- **权限检查实现:**
  - 使用 `@UseGuards(JwtAuthGuard, AdminGuard)` 或创建 `DirectorOrAdminGuard`
  - 或使用 `PermissionService.hasPermission(token, Permission.EXPORT_DATA)` 进行权限验证
  - 参考: `fenghua-backend/src/users/guards/admin.guard.ts`
  - 参考: `fenghua-backend/src/permission/permission.service.ts`
- **审计日志记录:**
  - 使用 `AuditService.log()` 记录所有导入操作
  - 记录操作类型: 'IMPORT_CUSTOMERS'
  - 记录元数据: 文件名称、总记录数、成功数、失败数、用户 ID
  - 参考: `fenghua-backend/src/audit/audit.service.ts`
  - 参考: `fenghua-backend/src/companies/companies.service.ts#create` 的审计日志实现
- **数据隔离:**
  - 导入的数据遵循 `created_by` 隔离规则
  - 所有导入的客户记录设置 `created_by` 为当前用户 ID
  - 确保导入的数据遵循现有的权限过滤规则

### Project Structure Notes

- **对齐统一项目结构：** 所有文件遵循现有的命名和目录结构约定
- **模块化设计：** 导入功能作为独立模块，不污染现有代码
- **服务复用：**
  - 参考 `CompaniesService.create()` 的单条创建逻辑
  - 创建专门的 `CompaniesService.bulkCreate()` 方法进行批量创建（避免 N+1 问题）
  - 复用 `AuditService.log()` 进行审计日志记录
  - 复用 `PermissionService.hasPermission()` 进行权限检查

### References

- [Source: _bmad-output/epics.md#Story-7.1] - Story 需求和验收标准
- [Source: _bmad-output/architecture.md#ADR-005] - Excel 导入架构决策
- [Source: _bmad-output/project-context.md] - 项目上下文和技术栈
- [Source: fenghua-backend/src/companies/companies.service.ts] - 客户创建服务（数据库访问模式）
- [Source: fenghua-backend/src/companies/dto/create-customer.dto.ts] - 客户创建 DTO
- [Source: fenghua-backend/migrations/006-create-companies-and-people-tables.sql] - Companies 表结构
- [Source: fenghua-frontend/src/attachments/components/FileUpload.tsx] - 文件上传组件参考
- [Source: fenghua-backend/src/users/guards/admin.guard.ts] - 权限守卫参考
- [Source: fenghua-backend/src/permission/permission.service.ts] - 权限服务参考
- [Source: fenghua-backend/src/audit/audit.service.ts] - 审计日志服务参考
- [Source: fenghua-backend/src/monitoring/health.service.ts] - Redis 配置参考

## Dev Agent Record

### Agent Model Used

gpt-4o

### Debug Log References

### Completion Notes List

**Task 1 完成 (2025-01-08):**
- ✅ 安装并配置了 xlsx 和 csv-parser 库
- ✅ 创建了所有核心服务（ExcelParserService, CsvParserService, MappingService, ValidationService）
- ✅ 创建了 CustomersImportService 主服务，实现了文件上传、格式验证、临时文件存储
- ✅ 创建了 CustomersImportController，实现了文件上传和映射预览端点
- ✅ 创建了 CustomersImportModule 并注册到 AppModule
- ✅ 所有服务都通过了单元测试（41个测试全部通过）
- ✅ 修复了编译错误（productsService.findOne 参数问题）

**Task 2 完成 (2025-01-08):**
- ✅ 完善了数据映射预览 API，添加了手动映射验证逻辑
- ✅ 实现了列名到字段的自动映射算法
- ✅ 返回解析后的数据样本（前 10 行）和映射建议

**Task 3 完成 (2025-01-08):**
- ✅ 完善了数据验证服务，添加了数据清洗建议逻辑
- ✅ 实现了重复数据检测（基于 name 或 customerCode）
- ✅ 创建了验证结果 DTO（ValidationResultDto）
- ✅ 添加了验证端点（POST /api/import/customers/validate）

**Task 4 完成 (2025-01-08):**
- ✅ 安装并配置了 BullMQ 和 Redis（@nestjs/bullmq, bullmq, ioredis）
- ✅ 创建了导入任务队列（customer-import-queue）
- ✅ 创建了导入任务处理器（CustomersImportProcessor）
- ✅ 在 CompaniesService 中实现了 bulkCreate 方法（批量插入，使用事务）
- ✅ 实现了进度跟踪（使用 job.updateProgress()）
- ✅ 创建了导入任务启动端点（POST /api/import/customers/start）
- ✅ 创建了导入任务状态查询端点（GET /api/import/customers/tasks/:taskId）

**Task 5 完成 (2025-01-08):**
- ✅ 实现了部分成功导入逻辑（使用 SAVEPOINT 实现部分回滚）
- ✅ 创建了导入结果摘要 DTO（ImportResultDto）
- ✅ 实现了失败记录导出功能（ErrorReportGeneratorService，生成 Excel 文件）
- ✅ 创建了导入历史记录表（migrations/017-create-import-history-table.sql）
- ✅ 实现了导入历史存储逻辑（在 processor 中保存历史记录）
- ✅ 添加了审计日志记录（使用 AuditService.log()，操作类型: 'IMPORT_CUSTOMERS'）
- ✅ 实现了导入历史查询端点（GET /api/import/customers/history）

**Task 6 完成 (2025-01-08):**
- ✅ 创建了数据导入页面组件（CustomerImportPage）
- ✅ 实现了文件上传组件（ImportFileUpload，支持拖拽上传，显示文件大小限制）
- ✅ 实现了数据映射预览界面（MappingPreview，显示 Excel 列和 CRM 字段的映射关系）
- ✅ 实现了自动映射识别和手动调整功能（自动映射 + 下拉选择手动调整）
- ✅ 实现了数据样本预览（显示前 10 行解析后的数据）
- ✅ 在 App.tsx 中添加了路由（/customers/import）

### File List

**后端文件：**
- `fenghua-backend/src/import/customers/customers-import.module.ts` - 导入模块
- `fenghua-backend/src/import/customers/customers-import.controller.ts` - 导入控制器
- `fenghua-backend/src/import/customers/customers-import.service.ts` - 导入服务
- `fenghua-backend/src/import/customers/dto/upload-file.dto.ts` - 文件上传 DTO
- `fenghua-backend/src/import/customers/dto/mapping-preview.dto.ts` - 映射预览 DTO
- `fenghua-backend/src/import/customers/dto/import-result.dto.ts` - 导入结果 DTO
- `fenghua-backend/src/import/customers/services/excel-parser.service.ts` - Excel 解析服务
- `fenghua-backend/src/import/customers/services/csv-parser.service.ts` - CSV 解析服务
- `fenghua-backend/src/import/customers/services/validation.service.ts` - 数据验证服务
- `fenghua-backend/src/import/customers/services/mapping.service.ts` - 列名映射服务
- `fenghua-backend/src/import/customers/services/excel-parser.service.spec.ts` - Excel 解析服务测试
- `fenghua-backend/src/import/customers/services/csv-parser.service.spec.ts` - CSV 解析服务测试
- `fenghua-backend/src/import/customers/services/validation.service.spec.ts` - 验证服务测试
- `fenghua-backend/src/import/customers/services/mapping.service.spec.ts` - 映射服务测试
- `fenghua-backend/test/fixtures/test-customers.csv` - 测试数据文件
- `fenghua-backend/src/app.module.ts` - 已注册 CustomersImportModule
- `fenghua-backend/src/products/product-customer-association-management.service.ts` - 修复了编译错误
- `fenghua-backend/src/import/customers/customers-import.processor.ts` - 导入任务处理器（使用 SAVEPOINT 实现部分成功导入）
- `fenghua-backend/src/import/customers/dto/start-import.dto.ts` - 启动导入 DTO
- `fenghua-backend/src/import/customers/dto/validation-result.dto.ts` - 验证结果 DTO
- `fenghua-backend/src/import/customers/dto/import-history.dto.ts` - 导入历史 DTO
- `fenghua-backend/src/import/customers/services/error-report-generator.service.ts` - 错误报告生成服务
- `fenghua-backend/src/companies/companies.service.ts` - 添加了 bulkCreate 方法
- `fenghua-backend/migrations/017-create-import-history-table.sql` - 导入历史表迁移文件

**测试文件：**
- `fenghua-backend/src/import/customers/services/excel-parser.service.spec.ts` - Excel 解析服务单元测试（已通过）
- `fenghua-backend/src/import/customers/services/csv-parser.service.spec.ts` - CSV 解析服务单元测试（已通过）
- `fenghua-backend/src/import/customers/services/mapping.service.spec.ts` - 映射服务单元测试（已通过）
- `fenghua-backend/src/import/customers/services/validation.service.spec.ts` - 验证服务单元测试（已通过）
- `fenghua-backend/src/import/customers/customers-import.integration.spec.ts` - 导入功能集成测试（需要 RUN_INTEGRATION_TESTS=true）
- `fenghua-backend/test/import-performance.test.ts` - 大文件导入性能测试（需要 RUN_PERFORMANCE_TESTS=true）
- `fenghua-backend/test/import-partial-success.test.ts` - 部分成功导入场景测试（需要 RUN_INTEGRATION_TESTS=true）
- `fenghua-backend/test/import-error-handling.test.ts` - 错误处理和恢复机制测试（需要 RUN_INTEGRATION_TESTS=true）
- `fenghua-backend/src/import/customers/services/error-report-generator.service.ts` - 错误报告生成服务
- `fenghua-backend/src/import/customers/dto/import-history.dto.ts` - 导入历史 DTO
- `fenghua-backend/migrations/017-create-import-history-table.sql` - 导入历史表迁移文件

**前端文件：**
- `fenghua-frontend/src/import/customers-import.service.ts` - 导入服务（API 调用）
- `fenghua-frontend/src/import/CustomerImportPage.tsx` - 导入主页面组件
- `fenghua-frontend/src/import/components/ImportFileUpload.tsx` - 文件上传组件（支持拖拽上传）
- `fenghua-frontend/src/import/components/MappingPreview.tsx` - 映射预览组件（显示 Excel 列和 CRM 字段映射，支持手动调整）
- `fenghua-frontend/src/import/components/ValidationResults.tsx` - 验证结果组件（显示错误、重复、清洗建议）
- `fenghua-frontend/src/import/components/ImportProgress.tsx` - 导入进度组件（进度条、轮询、结果摘要）
- `fenghua-frontend/src/import/components/ImportHistory.tsx` - 导入历史组件（历史记录查看、分页、筛选）

**测试文件：**
- `fenghua-backend/src/import/customers/services/excel-parser.service.spec.ts` - Excel 解析服务单元测试
- `fenghua-backend/src/import/customers/services/csv-parser.service.spec.ts` - CSV 解析服务单元测试
- `fenghua-backend/src/import/customers/services/mapping.service.spec.ts` - 映射服务单元测试
- `fenghua-backend/src/import/customers/services/validation.service.spec.ts` - 验证服务单元测试
- `fenghua-backend/src/import/customers/customers-import.integration.spec.ts` - 导入功能集成测试
- `fenghua-backend/test/import-performance.test.ts` - 大文件导入性能测试
- `fenghua-backend/test/import-partial-success.test.ts` - 部分成功导入场景测试
- `fenghua-backend/test/import-error-handling.test.ts` - 错误处理和恢复机制测试

