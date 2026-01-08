# Story 7.1: 客户数据批量导入（Excel/CSV）

Status: ready-for-dev

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

- [ ] Task 1: 后端文件上传和解析基础设施 (AC: 1,2)
  - [ ] 1.1 安装和配置 Excel/CSV 解析库（xlsx 或 csv-parser）
  - [ ] 1.2 创建文件上传端点（POST /api/import/customers/upload）
  - [ ] 1.3 实现文件格式验证（.csv, .xlsx, .xls，最大 50MB）
  - [ ] 1.4 实现文件解析服务（ExcelParserService, CsvParserService）
  - [ ] 1.5 实现列名自动识别和映射逻辑（常见列名映射规则）

- [ ] Task 2: 数据映射预览 API (AC: 2)
  - [ ] 2.1 创建数据映射预览端点（POST /api/import/customers/preview）
  - [ ] 2.2 实现列名到字段的自动映射算法
  - [ ] 2.3 返回解析后的数据样本（前 10 行）和映射建议
  - [ ] 2.4 实现手动映射调整的验证逻辑

- [ ] Task 3: 数据验证和错误检测 (AC: 3)
  - [ ] 3.1 创建数据验证服务（CustomerImportValidationService）
  - [ ] 3.2 实现必填字段验证（name, customerType）
  - [ ] 3.3 实现数据类型和格式验证（email, phone, employees 等）
  - [ ] 3.4 实现数据清洗建议逻辑（自动修复常见错误）
  - [ ] 3.5 实现重复数据检测（基于 name 或 customerCode）
  - [ ] 3.6 创建验证结果 DTO（成功/失败记录列表，错误详情）

- [ ] Task 4: 异步导入任务（Bull Queue）(AC: 4)
  - [ ] 4.1 安装和配置 BullMQ（或 Bull）和 Redis
  - [ ] 4.2 创建导入任务队列（customer-import-queue）
  - [ ] 4.3 创建导入任务处理器（CustomerImportProcessor）
  - [ ] 4.4 实现批量插入逻辑（分批处理，每批 100 条）
  - [ ] 4.5 实现进度跟踪（已处理记录数、总记录数、预计剩余时间）
  - [ ] 4.6 创建导入任务状态查询端点（GET /api/import/customers/tasks/:taskId）

- [ ] Task 5: 导入结果和错误报告 (AC: 5)
  - [ ] 5.1 实现部分成功导入逻辑（记录成功和失败的记录）
  - [ ] 5.2 创建导入结果摘要 DTO（成功数、失败数、错误详情）
  - [ ] 5.3 实现失败记录导出功能（生成 Excel 文件，包含错误信息）
  - [ ] 5.4 创建导入历史记录表（import_history）和存储逻辑
  - [ ] 5.5 实现导入历史查询端点（GET /api/import/customers/history）

- [ ] Task 6: 前端文件上传和映射预览界面 (AC: 1,2)
  - [ ] 6.1 创建数据导入页面组件（CustomerImportPage）
  - [ ] 6.2 实现文件上传组件（支持拖拽上传，显示文件大小限制）
  - [ ] 6.3 实现数据映射预览界面（显示 Excel 列和 CRM 字段的映射关系）
  - [ ] 6.4 实现自动映射识别和手动调整功能
  - [ ] 6.5 实现数据样本预览（显示前 10 行解析后的数据）

- [ ] Task 7: 前端数据验证和确认界面 (AC: 3)
  - [ ] 7.1 实现数据验证结果显示（成功/失败记录数、错误详情）
  - [ ] 7.2 实现错误详情查看功能（展开/折叠错误列表）
  - [ ] 7.3 实现数据清洗建议显示和确认功能
  - [ ] 7.4 实现导入确认对话框（显示验证结果摘要）

- [ ] Task 8: 前端导入进度和结果界面 (AC: 4,5)
  - [ ] 8.1 实现导入进度显示（进度条、已处理记录数、预计剩余时间）
  - [ ] 8.2 实现 WebSocket 或轮询机制获取实时进度更新
  - [ ] 8.3 实现导入结果摘要显示（成功数、失败数）
  - [ ] 8.4 实现失败记录下载功能（下载包含错误信息的 Excel 文件）
  - [ ] 8.5 实现导入历史记录查看功能

- [ ] Task 9: 测试和验证 (AC: 1,2,3,4,5)
  - [ ] 9.1 编写单元测试（文件解析、数据验证、映射逻辑）
  - [ ] 9.2 编写集成测试（文件上传、映射预览、导入流程）
  - [ ] 9.3 测试大文件导入（5000+ 记录）的性能和稳定性
  - [ ] 9.4 测试部分成功导入场景（部分记录成功，部分失败）
  - [ ] 9.5 测试错误处理和恢复机制

## Dev Notes

### 架构决策和约束

**Excel 导入处理策略（ADR-005）：**
- **决策：** 异步处理（Bull Queue）
- **理由：** 非阻塞用户体验，处理大文件，进度跟踪，错误处理
- **实施：** 使用 BullMQ（或 Bull）和 Redis 实现任务队列
- [Source: _bmad-output/architecture.md#ADR-005]

**技术栈约束：**
- **后端：** NestJS + TypeScript + PostgreSQL，RESTful API（无 GraphQL）
- **前端：** React 18+ + TypeScript + Vite + React Query
- **文件上传：** 参考现有的 `FileUpload` 组件模式
- [Source: _bmad-output/project-context.md#Technology-Stack]

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

**常见列名映射（中文 → 英文字段）：**
- "客户名称" / "公司名称" / "名称" → `name`
- "客户代码" / "代码" → `customerCode`
- "客户类型" / "类型" → `customerType` (需要转换：采购商→BUYER, 供应商→SUPPLIER)
- "域名" / "公司域名" → `domainName`
- "地址" → `address`
- "城市" → `city`
- "州/省" / "省份" → `state`
- "国家" → `country`
- "邮编" / "邮政编码" → `postalCode`
- "行业" → `industry`
- "员工数" / "员工数量" → `employees`
- "网站" / "网址" → `website`
- "电话" / "联系电话" → `phone`
- "邮箱" / "电子邮件" → `email`
- "备注" / "说明" → `notes`

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

**队列设置：**
- **队列名称：** `customer-import-queue`
- **并发处理：** 1（避免数据库压力过大）
- **重试策略：** 失败后重试 3 次，指数退避
- **任务超时：** 30 分钟（大文件导入可能需要较长时间）

**进度跟踪：**
- 使用 Bull Queue 的 `progress` 事件更新任务进度
- 前端通过 WebSocket 或轮询（每 2 秒）获取进度更新
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

**后端文件：**
- `fenghua-backend/src/import/customers/customers-import.module.ts` - 导入模块
- `fenghua-backend/src/import/customers/customers-import.controller.ts` - 导入控制器
- `fenghua-backend/src/import/customers/customers-import.service.ts` - 导入服务
- `fenghua-backend/src/import/customers/customers-import.processor.ts` - Bull Queue 处理器
- `fenghua-backend/src/import/customers/dto/upload-file.dto.ts` - 文件上传 DTO
- `fenghua-backend/src/import/customers/dto/mapping-preview.dto.ts` - 映射预览 DTO
- `fenghua-backend/src/import/customers/dto/import-result.dto.ts` - 导入结果 DTO
- `fenghua-backend/src/import/customers/services/excel-parser.service.ts` - Excel 解析服务
- `fenghua-backend/src/import/customers/services/csv-parser.service.ts` - CSV 解析服务
- `fenghua-backend/src/import/customers/services/validation.service.ts` - 数据验证服务
- `fenghua-backend/src/import/customers/services/mapping.service.ts` - 列名映射服务
- `fenghua-backend/migrations/017-create-import-history-table.sql` - 导入历史表迁移

**前端文件：**
- `fenghua-frontend/src/import/pages/CustomerImportPage.tsx` - 导入页面
- `fenghua-frontend/src/import/components/FileUploadStep.tsx` - 文件上传步骤
- `fenghua-frontend/src/import/components/MappingPreviewStep.tsx` - 映射预览步骤
- `fenghua-frontend/src/import/components/ValidationStep.tsx` - 验证步骤
- `fenghua-frontend/src/import/components/ImportProgressStep.tsx` - 导入进度步骤
- `fenghua-frontend/src/import/components/ImportResultStep.tsx` - 导入结果步骤
- `fenghua-frontend/src/import/services/customers-import.service.ts` - 导入服务
- `fenghua-frontend/src/import/hooks/useCustomerImport.ts` - 导入 Hook

### 参考实现

**文件上传模式：**
- 参考 `fenghua-frontend/src/attachments/components/FileUpload.tsx` 的文件上传实现
- 参考 `fenghua-frontend/src/attachments/services/attachments.service.ts` 的上传服务
- [Source: fenghua-frontend/src/attachments/components/FileUpload.tsx]

**客户创建模式：**
- 参考 `fenghua-backend/src/companies/companies.service.ts#create` 的客户创建逻辑
- 参考 `fenghua-backend/src/companies/dto/create-customer.dto.ts` 的验证规则
- [Source: fenghua-backend/src/companies/companies.service.ts#create]

### 性能优化

**批量插入优化：**
- 使用 PostgreSQL 的 `COPY` 命令或批量 `INSERT`（每批 100 条）
- 使用事务确保数据一致性
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
- 临时文件清理（导入完成后删除）

**数据安全：**
- 验证用户权限（仅总监和管理员可以导入）
- 审计日志记录（记录所有导入操作）
- 数据隔离（导入的数据遵循 created_by 隔离规则）

### Project Structure Notes

- **对齐统一项目结构：** 所有文件遵循现有的命名和目录结构约定
- **模块化设计：** 导入功能作为独立模块，不污染现有代码
- **服务复用：** 复用 `CompaniesService.create()` 方法进行客户创建

### References

- [Source: _bmad-output/epics.md#Story-7.1] - Story 需求和验收标准
- [Source: _bmad-output/architecture.md#ADR-005] - Excel 导入架构决策
- [Source: _bmad-output/project-context.md] - 项目上下文和技术栈
- [Source: fenghua-backend/src/companies/companies.service.ts] - 客户创建服务
- [Source: fenghua-backend/src/companies/dto/create-customer.dto.ts] - 客户创建 DTO
- [Source: fenghua-backend/migrations/006-create-companies-and-people-tables.sql] - Companies 表结构
- [Source: fenghua-frontend/src/attachments/components/FileUpload.tsx] - 文件上传组件参考

## Dev Agent Record

### Agent Model Used

gpt-4o

### Debug Log References

### Completion Notes List

### File List

