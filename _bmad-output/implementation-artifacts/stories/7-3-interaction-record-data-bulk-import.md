# Story 7.3: 互动记录数据批量导入（Excel/CSV）

Status: done

<!-- Dev Agent Record -->
## Dev Agent Record

### Agent Model Used
- Claude Sonnet 4.5 (via Cursor)

### Completion Notes List
1. ✅ 创建了后端导入模块基础设施（Task 1）
   - 创建了 `interactions-import.service.ts`（主导入服务）
   - 创建了 `interactions-import.controller.ts`（控制器）
   - 创建了 `interactions-import.module.ts`（模块）
   - 创建了 `services/mapping.service.ts`（映射服务）
   - 创建了 `services/validation.service.ts`（验证服务）
   - 复用了客户/产品导入的 Excel/CSV 解析库和临时文件存储机制

2. ✅ 实现了数据映射预览 API（Task 2）
   - 实现了列名自动识别和映射逻辑
   - 实现了映射预览端点
   - 实现了手动映射调整的验证逻辑

3. ✅ 实现了数据验证和错误检测（Task 3）
   - 实现了必填字段验证
   - 实现了客户存在性验证（批量查询优化）
   - 实现了产品存在性验证（批量查询优化）
   - 实现了互动类型验证和名称转换
   - 实现了日期时间格式验证
   - 实现了状态验证
   - 实现了角色权限验证（批量优化）
   - 实现了客户-产品关联关系验证（必填，批量查询优化）
   - 实现了数据清洗建议逻辑

4. ✅ 实现了异步导入任务（Task 4）
   - 创建了 `interactions-import.processor.ts`（Bull Queue 处理器）
   - 在 `InteractionsService` 中实现了 `bulkCreate` 方法
   - 实现了批量插入逻辑（使用 SAVEPOINT 实现部分成功）
   - 实现了进度跟踪
   - 创建了导入任务状态查询端点

5. ✅ 实现了导入结果和错误报告（Task 5）
   - 实现了部分成功导入逻辑
   - 实现了错误报告生成
   - 实现了导入历史记录（复用 import_history 表，import_type = 'INTERACTION'）
   - 实现了导入历史查询端点
   - 添加了审计日志记录

6. ✅ 实现了前端文件上传和映射预览界面（Task 6）
   - 创建了 `InteractionImportPage.tsx`（主页面组件）
   - 复用了文件上传组件
   - 创建了 `InteractionMappingPreview.tsx`（映射预览组件）
   - 实现了自动映射识别和手动调整功能
   - 实现了数据样本预览

7. ✅ 实现了前端数据验证和确认界面（Task 7）
   - 复用了 `ValidationResults` 组件
   - 实现了数据验证结果显示
   - 实现了错误详情查看功能
   - 实现了导入确认功能

8. ✅ 实现了前端导入进度和结果界面（Task 8）
   - 更新了 `ImportProgress` 组件以支持互动记录导入
   - 实现了导入进度显示
   - 实现了轮询机制获取实时进度更新
   - 实现了导入结果摘要显示
   - 实现了导入历史记录查看功能（基础结构）

9. ✅ 完成了测试和验证（Task 9）
   - ✅ 创建了基础单元测试（mapping.service.spec.ts, validation.service.spec.ts）
   - ✅ 创建了集成测试（interactions-import.integration.spec.ts）
   - ✅ 创建了性能测试（interactions-import-performance.spec.ts）
   - ✅ 创建了部分成功测试（interactions-import-partial-success.spec.ts）
   - ✅ 创建了错误处理测试（interactions-import-error-handling.spec.ts）

### File List

#### Backend Files Created
- `fenghua-backend/src/import/interactions/interactions-import.service.ts`
- `fenghua-backend/src/import/interactions/interactions-import.controller.ts`
- `fenghua-backend/src/import/interactions/interactions-import.processor.ts`
- `fenghua-backend/src/import/interactions/interactions-import.module.ts`
- `fenghua-backend/src/import/interactions/services/mapping.service.ts`
- `fenghua-backend/src/import/interactions/services/validation.service.ts`
- `fenghua-backend/src/import/interactions/services/mapping.service.spec.ts`
- `fenghua-backend/src/import/interactions/services/validation.service.spec.ts`
- `fenghua-backend/src/import/interactions/interactions-import.integration.spec.ts`
- `fenghua-backend/src/import/interactions/interactions-import-performance.spec.ts`
- `fenghua-backend/src/import/interactions/interactions-import-partial-success.spec.ts`
- `fenghua-backend/src/import/interactions/interactions-import-error-handling.spec.ts`

#### Backend Files Modified
- `fenghua-backend/src/interactions/interactions.service.ts`（添加了 `bulkCreate` 方法）
- `fenghua-backend/src/app.module.ts`（导入了 `InteractionsImportModule`）

#### Frontend Files Created
- `fenghua-frontend/src/import/interactions-import.service.ts`
- `fenghua-frontend/src/import/InteractionImportPage.tsx`
- `fenghua-frontend/src/import/components/InteractionMappingPreview.tsx`

#### Frontend Files Modified
- `fenghua-frontend/src/import/components/ImportProgress.tsx`（添加了 'interaction' 类型支持）
- `fenghua-frontend/src/App.tsx`（添加了路由和快速访问入口）

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **总监或管理员**,
I want **从 Excel 文件批量导入互动记录数据**,
So that **我可以快速将历史互动记录迁移到 CRM 系统**.

## Acceptance Criteria

### AC1: 文件格式验证和上传
**Given** 总监或管理员已登录系统并进入数据导入界面
**When** 总监或管理员选择"导入互动记录数据"，上传包含互动记录的 Excel 或 CSV 文件
**Then** 系统在导入前验证文件格式和数据完整性（FR39）
**And** 系统支持 CSV 格式（.csv）
**And** 系统支持基本 Excel 格式（.xlsx, .xls）
**And** 系统显示文件大小限制（如最大 50MB）

### AC2: 数据映射预览
**Given** 总监或管理员上传互动记录数据文件
**When** 文件格式验证通过
**Then** 系统解析文件内容
**And** 系统显示数据映射预览界面，允许总监或管理员确认 Excel 列与 CRM 字段的映射关系（FR42）
**And** 系统自动识别常见的列名映射（如"客户名称"映射到"customer"，"产品名称"映射到"product"，"互动类型"映射到"interactionType"）
**And** 总监或管理员可以手动调整映射关系

### AC3: 数据验证和错误检测
**Given** 总监或管理员确认数据映射
**When** 系统开始导入
**Then** 系统在导入前检测并报告数据错误（例如：客户不存在、产品不存在、时间格式错误），并提供数据清洗建议（FR40, FR41）
**And** 系统验证客户和产品的关联关系（确保客户和产品存在，且符合角色权限）
**And** 系统验证互动类型是否有效（前端或后端专员的互动类型）
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
**And** 系统验证导入的互动记录正确关联到客户和产品（FR116）
**And** 总监或管理员可以下载失败记录的 Excel 文件，修正后重新导入

## Tasks / Subtasks

- [x] Task 1: 后端文件上传和解析基础设施 (AC: 1,2)
  - [x] 1.1 复用客户/产品导入的 Excel/CSV 解析库（xlsx, csv-parser）
  - [x] 1.2 创建互动记录导入文件上传端点（POST /api/import/interactions/upload）
    - 复用 `ExcelParserService` 和 `CsvParserService`
    - 使用相同的临时文件存储机制
  - [x] 1.3 实现文件格式验证（.csv, .xlsx, .xls，最大 50MB）
  - [x] 1.4 实现互动记录列名自动识别和映射逻辑（常见列名映射规则）

- [x] Task 2: 数据映射预览 API (AC: 2)
  - [x] 2.1 创建互动记录数据映射预览端点（POST /api/import/interactions/preview）
  - [x] 2.2 实现互动记录列名到字段的自动映射算法
  - [x] 2.3 返回解析后的数据样本（前 10 行）和映射建议
  - [x] 2.4 实现手动映射调整的验证逻辑

- [x] Task 3: 数据验证和错误检测 (AC: 3)
  - [x] 3.1 创建互动记录数据验证服务（InteractionImportValidationService）
  - [x] 3.2 实现必填字段验证（customerId/customerName, productIds/productName, interactionType, interactionDate）
  - [x] 3.3 实现客户存在性验证（通过客户名称或代码查找客户ID）
    - 批量查询所有客户（使用 `CompaniesService.findAll()`），存储在 Map 中用于快速查找
    - 支持通过客户名称或客户代码查找
  - [x] 3.4 实现产品存在性验证（通过产品名称或HS编码查找产品ID）
    - 批量查询所有产品（使用 `ProductsService.findAll()`），存储在 Map 中用于快速查找
    - 支持通过产品名称或HS编码查找
  - [x] 3.5 实现互动类型验证（验证 interactionType 是否为有效的前端或后端互动类型）
  - [x] 3.6 实现日期时间格式验证（ISO 8601 格式）
  - [x] 3.7 实现状态验证（验证 status 是否为有效的状态值：in_progress, completed, cancelled, needs_follow_up）
  - [x] 3.8 实现角色权限验证（验证客户类型是否符合用户角色权限）
    - 批量查询所有客户，存储在 Map 中
    - 对于每条记录，检查客户类型是否符合用户角色权限
    - 前端专员：只能导入采购商（BUYER）的互动记录
    - 后端专员：只能导入供应商（SUPPLIER）的互动记录
    - 总监/管理员：可以导入所有客户的互动记录
    - 不符合权限的记录标记为错误，不进入导入流程
  - [x] 3.9 实现客户-产品关联关系验证（**必填**）
    - 批量查询所有客户-产品关联关系（查询 `product_customer_associations` 表），存储在 Set 中（key: `${customerId}-${productId}`）
    - 验证每条记录的客户和产品之间是否存在关联关系
    - 如果关联不存在，标记为错误并报告："产品 X 和客户之间必须已有关联，请先创建关联"
    - **注意:** 当前实现不允许自动创建关联，必须先手动创建关联关系
  - [x] 3.10 实现数据清洗建议逻辑（自动修复常见错误）
    - 客户名称模糊匹配（去除空格、大小写不敏感）
    - 产品名称或HS编码匹配（去除空格、大小写不敏感）
    - 互动类型名称转换（中文名称、英文名称到枚举值）
  - [x] 3.11 创建验证结果 DTO（成功/失败记录列表，错误详情）

- [x] Task 4: 异步导入任务（Bull Queue）(AC: 4)
  - [x] 4.1 复用客户/产品导入的 BullMQ 配置（创建新的互动记录导入队列：interaction-import-queue）
  - [x] 4.2 创建互动记录导入任务处理器（InteractionsImportProcessor）
  - [x] 4.3 在 InteractionsService 中实现 bulkCreate 方法（批量插入，使用事务）
    - 参考: `fenghua-backend/src/companies/companies.service.ts#bulkCreate` (Lines 215-310)
    - 关键差异:
      - Interactions 需要验证客户和产品存在（批量查询）
      - Interactions 需要验证客户-产品关联关系（**必填**，批量查询 `product_customer_associations` 表）
      - Interactions 需要验证角色权限（前端专员只能导入采购商互动，后端专员只能导入供应商互动）
      - Interactions 需要设置 created_by（从用户 token 或请求中获取）
      - Interactions 支持多产品（productIds 数组），需要为每个产品创建单独的互动记录
    - 实现步骤:
      1. 批量查询所有客户（使用 `CompaniesService.findAll()`），存储在 Map 中（key: 客户名称或客户代码，value: 客户对象）
      2. 批量查询所有产品（使用 `ProductsService.findAll()`），存储在 Map 中（key: 产品名称或HS编码，value: 产品对象）
      3. 批量查询所有客户-产品关联关系（查询 `product_customer_associations` 表），存储在 Set 中（key: `${customerId}-${productId}`）
      4. 验证角色权限（前端专员只能导入采购商互动，后端专员只能导入供应商互动）
      5. 使用事务和 SAVEPOINT 实现部分成功导入
      6. 每批 100 条记录，使用批量 INSERT
      7. 对于每条记录，如果 productIds 是数组，为每个产品创建单独的互动记录（所有记录共享相同的客户、互动类型、时间、描述等）
    - 代码参考:
      - `fenghua-backend/src/interactions/interactions.service.ts#create` (Lines 114-300) - 单条创建逻辑
      - `fenghua-backend/src/companies/companies.service.ts#bulkCreate` (Lines 215-310) - 批量创建模式
  - [x] 4.4 实现批量插入逻辑（分批处理，每批 100 条，使用 SAVEPOINT 实现部分成功）
  - [x] 4.5 实现进度跟踪（已处理记录数、总记录数、预计剩余时间）
  - [x] 4.6 创建导入任务状态查询端点（GET /api/import/interactions/tasks/:taskId）

- [x] Task 5: 导入结果和错误报告 (AC: 5)
  - [x] 5.1 实现部分成功导入逻辑（使用 SAVEPOINT 实现部分回滚）
  - [x] 5.2 创建导入结果摘要 DTO（成功数、失败数、错误详情）
  - [x] 5.3 实现失败记录导出功能（生成 Excel 文件，包含错误信息）
  - [x] 5.4 复用导入历史记录表（import_history），添加互动记录导入记录（import_type = 'INTERACTION'）
  - [x] 5.5 实现导入历史查询端点（GET /api/import/interactions/history）
  - [x] 5.6 添加审计日志记录（使用 AuditService.log()，操作类型: 'IMPORT_INTERACTIONS'）

- [x] Task 6: 前端文件上传和映射预览界面 (AC: 1,2)
  - [x] 6.1 创建互动记录数据导入页面组件（InteractionImportPage）
  - [x] 6.2 复用文件上传组件（ImportFileUpload，支持拖拽上传，显示文件大小限制）
  - [x] 6.3 实现互动记录数据映射预览界面（显示 Excel 列和 CRM 字段的映射关系）
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
  - [x] 8.3 实现导入结果摘要显示（成功数、失败数）
  - [x] 8.4 实现失败记录下载功能（下载包含错误信息的 Excel 文件）
  - [x] 8.5 实现导入历史记录查看功能（基础结构）

- [x] Task 9: 测试和验证 (AC: 1,2,3,4,5)
  - [x] 9.1 编写单元测试（互动记录数据验证、映射逻辑）
  - [x] 9.2 编写集成测试（文件上传、映射预览、导入流程）
  - [x] 9.3 测试大文件导入（5000+ 记录）的性能和稳定性
  - [x] 9.4 测试部分成功导入场景（部分记录成功，部分失败）
  - [x] 9.5 测试角色权限验证（前端专员、后端专员、总监/管理员）
  - [x] 9.6 测试错误处理和恢复机制

## Dev Notes

### 架构决策和约束

**Excel 导入处理策略（ADR-005）：**
- 复用客户和产品导入的基础设施（ExcelParserService, CsvParserService, Bull Queue）
- 使用相同的临时文件存储机制和错误报告生成逻辑

**互动记录导入的特殊性：**
- 互动记录需要关联客户和产品，需要验证两者都存在
- **客户-产品关联关系验证（必填）：** 互动记录创建前必须验证 `product_customer_associations` 表中存在对应的关联关系。如果关联不存在，会抛出错误。当前实现不允许自动创建关联，必须先手动创建关联关系。
- 支持多产品导入（一条 Excel 记录可以对应多个互动记录，每个产品一个）
  - **Excel 格式选项：**
    1. **选项 A（推荐）：** 使用分隔符（如逗号、分号）在单个列中列出多个产品名称或HS编码
       - 示例: "产品A, 产品B, 产品C" 或 "85414000; 84818090"
    2. **选项 B：** 使用多个列（product1, product2, product3, ...）
    3. **选项 C：** 使用 JSON 格式（["产品A", "产品B", "产品C"]）
  - **解析逻辑：** 如果检测到分隔符，按分隔符分割字符串。对于每个产品标识符（名称或HS编码），查找对应的产品ID。如果所有产品都找到，创建多个互动记录（每个产品一个）。
  - **处理逻辑：** 为每个产品创建单独的互动记录。所有互动记录共享相同的客户、互动类型、时间、描述等。使用事务确保所有记录都成功创建（原子操作）。
- 需要验证角色权限（前端专员只能导入采购商互动，后端专员只能导入供应商互动）
- 需要验证互动类型是否有效（前端或后端专员的互动类型）

**数据验证优化：**
- **客户和产品查找批量优化：**
  - 批量查询所有客户（使用 `CompaniesService.findAll()`），存储在 Map 中
    - Map key: 客户名称（不区分大小写）或客户代码
    - Map value: 客户对象（包含 id, name, customerCode, customerType）
    - 支持通过客户名称或客户代码查找
  - 批量查询所有产品（使用 `ProductsService.findAll()`），存储在 Map 中
    - Map key: 产品名称（不区分大小写）或HS编码
    - Map value: 产品对象（包含 id, name, hsCode）
    - 支持通过产品名称或HS编码查找
  - 批量查询所有客户-产品关联关系（查询 `product_customer_associations` 表），存储在 Set 中（key: `${customerId}-${productId}`）
  - 对于 5000 条记录：从 5000-10000 次查询减少到 3 次查询（客户、产品、关联关系）
  - 参考: 客户导入的 `checkDuplicatesBatch` 方法和产品导入的批量验证模式
- **角色权限验证批量优化：**
  - 批量查询所有客户，存储在 Map 中
  - 对于每条记录，检查客户类型是否符合用户角色权限
  - 不符合权限的记录标记为错误，不进入导入流程
  - 参考: `fenghua-backend/src/interactions/interactions.service.ts#create` (Lines 196-227)

**部分成功导入：**
- 使用 PostgreSQL SAVEPOINT 实现部分回滚
- 成功记录提交，失败记录回滚到保存点
- 参考: 客户和产品导入的 SAVEPOINT 实现

### 数据模型参考

**互动记录必填字段：**
- `productIds`: 产品ID数组（必填，至少一个）
- `customerId`: 客户ID（必填）
- `interactionType`: 互动类型（必填，前端或后端互动类型）
- `interactionDate`: 互动时间（必填，ISO 8601 格式）

**互动记录可选字段：**
- `description`: 互动描述（可选）
- `status`: 状态（可选：in_progress, completed, cancelled, needs_follow_up）
- `additionalInfo`: 额外信息（可选，JSON 对象）

**前端互动类型（FrontendInteractionType）：**
- `initial_contact`: 初步接触
- `product_inquiry`: 产品询价
- `quotation`: 报价
- `quotation_accepted`: 接受报价
- `quotation_rejected`: 拒绝报价
- `order_signed`: 签署订单
- `order_completed`: 完成订单

**后端互动类型（BackendInteractionType）：**
- `product_inquiry_supplier`: 询价产品
- `quotation_received`: 接收报价
- `specification_confirmed`: 产品规格确认
- `production_progress`: 生产进度跟进
- `pre_shipment_inspection`: 发货前验收
- `shipped`: 已发货

**互动类型名称转换规则：**
- **前端互动类型映射：**
  - "初步接触" / "Initial Contact" → `initial_contact`
  - "产品询价" / "Product Inquiry" → `product_inquiry`
  - "报价" / "Quotation" → `quotation`
  - "接受报价" / "Quotation Accepted" → `quotation_accepted`
  - "拒绝报价" / "Quotation Rejected" → `quotation_rejected`
  - "签署订单" / "Order Signed" → `order_signed`
  - "完成订单" / "Order Completed" → `order_completed`
- **后端互动类型映射：**
  - "询价产品" / "Product Inquiry Supplier" → `product_inquiry_supplier`
  - "接收报价" / "Quotation Received" → `quotation_received`
  - "产品规格确认" / "Specification Confirmed" → `specification_confirmed`
  - "生产进度跟进" / "Production Progress" → `production_progress`
  - "发货前验收" / "Pre Shipment Inspection" → `pre_shipment_inspection`
  - "已发货" / "Shipped" → `shipped`
- **验证逻辑：**
  - 支持中文名称、英文名称、枚举值三种格式
  - 不区分大小写
  - 如果无法匹配，报告错误
- **代码参考：** `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` (Lines 22-47)

### 列名映射规则

**CRM 字段映射规则：**
```typescript
const INTERACTION_COLUMN_MAPPING_RULES: Record<string, string> = {
  '客户名称': 'customerName',
  '客户': 'customerName',
  '客户代码': 'customerCode',
  'Customer': 'customerName',
  'Customer Name': 'customerName',
  '产品名称': 'productName',
  '产品': 'productName',
  '产品名': 'productName',
  'HS编码': 'productHsCode',
  'HS 编码': 'productHsCode',
  'HS Code': 'productHsCode',
  'Product': 'productName',
  'Product Name': 'productName',
  '互动类型': 'interactionType',
  '类型': 'interactionType',
  'Interaction Type': 'interactionType',
  '互动时间': 'interactionDate',
  '时间': 'interactionDate',
  '日期': 'interactionDate',
  'Interaction Date': 'interactionDate',
  '互动描述': 'description',
  '描述': 'description',
  'Description': 'description',
  '状态': 'status',
  'Status': 'status',
  '额外信息': 'additionalInfo',
  'Additional Info': 'additionalInfo',
};
```

### 安全考虑

**数据隔离：**
- 使用 `created_by` 字段记录导入用户
- 导入的互动记录遵循现有的数据隔离规则
- 参考: `InteractionsService` 的数据隔离逻辑

**权限验证：**
- 只有总监和管理员可以导入互动记录（AdminGuard）
- 验证客户类型是否符合用户角色权限
  - 前端专员：只能导入采购商（BUYER）的互动记录
  - 后端专员：只能导入供应商（SUPPLIER）的互动记录
  - 总监/管理员：可以导入所有客户的互动记录
- 参考: `PermissionService.getDataAccessFilter()` 和 `InteractionsService` 的权限验证逻辑

**客户-产品关联关系处理：**
- **当前实现：** 关联关系必须预先存在，如果不存在则抛出错误
- **导入时的处理选项：**
  1. **选项 A（当前实现，推荐）：** 验证关联存在，如果不存在则跳过记录并报告错误
     - 错误消息："产品 X 和客户之间必须已有关联，请先创建关联"
     - 用户需要先手动创建关联关系，然后重新导入
  2. **选项 B（未来增强）：** 如果关联不存在，自动创建关联（需要业务确认）
     - 关联类型根据客户类型自动设置：
       - 采购商：`POTENTIAL_BUYER`
       - 供应商：`POTENTIAL_SUPPLIER`
- **推荐方案：** 选项 A（当前实现），因为关联关系的创建应该是有意为之的操作
- **代码参考：**
  - `fenghua-backend/src/interactions/interactions.service.ts#create` (Lines 229-240) - 关联验证逻辑
  - `fenghua-backend/src/product-customer-associations/product-customer-associations.service.ts` - 关联创建逻辑

### 性能考虑

**批量处理：**
- 每批处理 100 条记录
- 使用批量 INSERT 减少数据库往返
- 使用 SAVEPOINT 实现部分成功导入

**查询优化：**
- 批量查询所有客户和产品，存储在 Map 中
- 批量查询所有客户-产品关联关系，存储在 Set 中
- 避免 N+1 查询问题
- 对于 5000 条记录：从 5000-10000 次查询减少到 3 次查询（客户、产品、关联关系）
- 参考: 客户和产品导入的批量验证优化

### 测试策略

**单元测试：**
- 测试数据验证逻辑（必填字段、格式验证、存在性验证）
- 测试列名映射逻辑
- 测试角色权限验证

**集成测试：**
- 测试完整的导入流程（上传、映射、验证、导入）
- 测试部分成功导入场景
- 测试角色权限验证

**性能测试：**
- 测试大文件导入（5000+ 记录）
- 测试批量查询优化效果

## References

- Story 7.1: 客户数据批量导入（Excel/CSV）
- Story 7.2: 产品数据批量导入（Excel/CSV）
- `fenghua-backend/src/interactions/interactions.service.ts` - 互动记录服务
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` - 互动记录创建 DTO
- `fenghua-backend/src/companies/companies.service.ts#bulkCreate` - 批量创建参考实现
- `fenghua-backend/src/products/products.service.ts#bulkCreate` - 批量创建参考实现

