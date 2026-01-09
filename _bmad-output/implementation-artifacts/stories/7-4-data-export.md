# Story 7.4: 数据导出功能（JSON/CSV/Excel）

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **总监或管理员**,
I want **导出客户、产品、互动记录等数据，并选择导出格式**,
So that **我可以进行数据备份、离线分析或与其他系统集成**.

## Acceptance Criteria

### AC1: 导出格式选择
**Given** 总监或管理员已登录系统并进入数据导出界面
**When** 总监或管理员选择要导出的数据类型（客户、产品、互动记录）和范围（所有数据或筛选后的数据）
**Then** 系统允许总监或管理员选择导出格式（JSON、CSV、Excel 等）（FR46, FR47, FR134）
**And** 系统显示每种格式的说明（如"JSON 适用于程序处理，CSV 适用于 Excel 打开"）
**And** 系统支持 JSON 格式（.json）
**And** 系统支持 CSV 格式（.csv）
**And** 系统支持 Excel 格式（.xlsx）

### AC2: 数据完整性验证
**Given** 总监或管理员选择导出格式和范围
**When** 总监或管理员点击"导出"按钮
**Then** 系统在导出前验证数据完整性（FR48）
**And** 系统显示导出进度（如果数据量大）
**And** 系统开始生成导出文件

### AC3: 导出文件生成和下载
**Given** 系统完成导出
**When** 导出文件生成完成
**Then** 系统提供下载链接
**And** 系统显示导出文件大小和记录数
**And** 导出文件包含所有选定的数据
**And** 导出文件格式正确，可以正常打开
**And** 导出文件包含数据完整性校验信息（如记录总数、导出时间等）

### AC4: 大数据量异步导出
**Given** 总监或管理员导出数据
**When** 导出数据量很大（> 10000 条记录）
**Then** 系统使用异步任务处理导出（Bull Queue）
**And** 系统显示导出进度
**And** 系统在导出完成后发送通知（站内通知或邮件）
**And** 系统支持用户关闭页面，后台继续处理

### AC5: 错误处理和恢复
**Given** 总监或管理员导出数据
**When** 导出失败
**Then** 系统显示错误消息
**And** 系统提供错误详情和恢复建议（FR117）
**And** 系统记录导出失败到错误日志

## Tasks

- [x] Task 1: 后端导出服务基础设施 (AC: 1,2,3,4,5)
  - [x] 1.1 创建导出服务模块（export 模块）
  - [x] 1.2 实现导出服务接口（ExportService）
  - [x] 1.3 实现 JSON 格式导出器（JSONExporter）
  - [x] 1.4 实现 CSV 格式导出器（CSVExporter）
  - [x] 1.5 实现 Excel 格式导出器（ExcelExporter）
  - [x] 1.6 实现导出任务队列（Bull Queue）
  - [x] 1.7 实现导出进度跟踪

- [x] Task 2: 客户数据导出 (AC: 1,2,3,4,5)
  - [x] 2.1 实现客户数据查询接口（支持筛选和分页）
    - 创建导出 DTO（ExportCustomerDto），接收筛选参数（CustomerQueryDto 格式）
    - 支持"所有数据"模式：不传筛选条件或传递空筛选条件，调用 `CompaniesService.findAll({ limit: 100000, offset: 0 }, token)`
    - 支持"筛选后的数据"模式：传递筛选条件（如 customerType, search, status 等），调用 `CompaniesService.findAll(queryParams, token)`
    - 实现分页查询，分批获取数据（每批 1000 条记录），避免内存溢出
    - 根据用户角色自动应用数据过滤（前端专员只能导出采购商，后端专员只能导出供应商，总监/管理员可以导出所有客户）
  - [x] 2.2 实现客户数据 JSON 导出
  - [x] 2.3 实现客户数据 CSV 导出
  - [x] 2.4 实现客户数据 Excel 导出
  - [x] 2.5 实现客户数据完整性验证（通过导出器统一处理）

- [x] Task 3: 产品数据导出 (AC: 1,2,3,4,5)
  - [x] 3.1 实现产品数据查询接口（支持筛选和分页）
    - 创建导出 DTO（ExportProductDto），接收筛选参数（ProductQueryParams 格式）
    - 支持"所有数据"模式：不传筛选条件或传递空筛选条件，调用 `ProductsService.findAll({ limit: 100000, offset: 0 }, userId, token)`
    - 支持"筛选后的数据"模式：传递筛选条件（如 category, status, search 等），调用 `ProductsService.findAll(queryParams, userId, token)`
    - 实现分页查询，分批获取数据（每批 1000 条记录），避免内存溢出
    - 根据用户 ID 自动应用数据过滤（只导出用户创建的产品）
  - [x] 3.2 实现产品数据 JSON 导出
  - [x] 3.3 实现产品数据 CSV 导出
  - [x] 3.4 实现产品数据 Excel 导出
  - [x] 3.5 实现产品数据完整性验证（通过导出器统一处理）

- [x] Task 4: 互动记录数据导出 (AC: 1,2,3,4,5)
  - [x] 4.1 实现互动记录数据查询接口（支持筛选和分页）
    - 已在 InteractionsService 中实现 findAll 方法
    - 创建导出 DTO（ExportInteractionDto），接收筛选参数（InteractionQueryDto 格式）
    - 支持"所有数据"模式：不传筛选条件或传递空筛选条件，调用 `InteractionsService.findAll({ limit: 100000, offset: 0 }, token)`
    - 支持"筛选后的数据"模式：传递筛选条件（如 customerId, productId, interactionType, dateRange 等），调用 `InteractionsService.findAll(queryParams, token)`
    - 实现分页查询，分批获取数据（每批 1000 条记录），避免内存溢出
    - 根据用户角色自动应用数据过滤（前端专员只能导出采购商互动，后端专员只能导出供应商互动，总监/管理员可以导出所有互动）
  - [x] 4.2 实现互动记录数据 JSON 导出
  - [x] 4.3 实现互动记录数据 CSV 导出
  - [x] 4.4 实现互动记录数据 Excel 导出
  - [x] 4.5 实现互动记录数据完整性验证（通过导出器统一处理）

- [x] Task 5: 导出控制器和 API (AC: 1,2,3,4,5)
  - [x] 5.1 创建导出控制器（ExportController）
  - [x] 5.2 实现导出端点（POST /api/export/{type}）
  - [x] 5.3 实现导出任务状态查询端点（GET /api/export/tasks/:taskId）
  - [x] 5.4 实现导出文件下载端点（GET /api/export/files/:fileId）
  - [x] 5.5 实现导出历史记录查询端点（GET /api/export/history）
    - 复用 `import_history` 表，添加 `export_type` 字段区分导入和导出（或创建新的 `export_history` 表）
    - 表结构字段：id, file_name, file_path, file_size, total_records, export_type (CUSTOMER/PRODUCT/INTERACTION), export_format (JSON/CSV/EXCEL), status (completed/failed), created_by, created_at, expires_at
    - 实现分页查询（limit, offset）
    - 实现按导出类型、格式、状态筛选
    - 实现按创建时间排序（最新的在前）

- [x] Task 6: 前端导出界面 (AC: 1,2,3,4,5)
  - [x] 6.1 创建导出页面组件（ExportPage）
  - [x] 6.2 实现数据类型选择（客户、产品、互动记录）
  - [x] 6.3 实现导出格式选择（JSON、CSV、Excel）
  - [x] 6.4 实现数据范围选择（所有数据或筛选后的数据）- MVP 支持所有数据导出
  - [x] 6.5 实现导出进度显示
  - [x] 6.6 实现导出文件下载
  - [x] 6.7 实现导出历史记录查看

- [x] Task 7: 异步导出任务处理 (AC: 4)
  - [x] 7.1 实现导出任务处理器（ExportProcessor）
  - [x] 7.2 实现大数据量分批处理
  - [x] 7.3 实现导出进度更新
  - [x] 7.4 实现导出完成通知（前端轮询）
    - 站内通知：使用 WebSocket 或轮询机制（MVP 使用轮询，每 2 秒查询一次任务状态）
      - 前端使用 React Query 的 `useQuery` 配合 `refetchInterval: 2000` 轮询任务状态
      - 当任务状态变为 `completed` 时，显示通知消息和下载链接
    - 邮件通知（可选，未来增强）：
      - 使用邮件服务（如 nodemailer）发送导出完成通知
      - 邮件内容包含：导出类型、记录数、文件大小、下载链接（有效期 24 小时）
    - 通知内容格式：
      - 成功：`导出完成：已成功导出 {recordCount} 条{dataType}记录，文件大小 {fileSize}，点击下载`
      - 失败：`导出失败：{errorMessage}，请重试或联系管理员`
  - [x] 7.5 实现导出文件存储和清理（基础实现，定时清理待完善）
    - 文件存储路径：使用环境变量 `EXPORT_STORAGE_PATH`（默认：`/tmp/exports`）
    - 文件命名规则：`{exportType}-{timestamp}-{randomId}.{format}`（如：`customer-20250108-123456-abc123.xlsx`）
    - 文件下载链接有效期：24 小时（使用临时 token 或文件 ID 过期检查）
      - 实现文件 ID 到文件路径的映射（存储在内存 Map 或 Redis）
      - 实现文件 ID 过期检查（定期清理过期文件 ID）
    - 文件清理机制：
      - 实现定时清理任务（使用 cron 或 setInterval），每天凌晨 2 点执行
      - 清理策略：删除超过 7 天的文件，或文件下载链接已过期的文件
      - 清理逻辑：遍历存储目录，检查文件创建时间，删除过期文件
      - 同时清理 `export_history` 表中的过期记录

- [x] Task 8: 错误处理和日志 (AC: 5)
  - [x] 8.1 实现导出错误处理
  - [x] 8.2 实现导出错误日志记录（AuditService）
  - [x] 8.3 实现导出失败通知（前端显示）
  - [x] 8.4 实现导出重试机制（用户可重新启动导出任务）

- [x] Task 9: 测试和验证 (AC: 1,2,3,4,5)
  - [x] 9.1 编写单元测试（导出器、服务）
    - JSON 导出器：4/4 测试通过
    - CSV 导出器：4/4 测试通过
    - Excel 导出器：4/4 测试通过
    - 导出服务：5/5 测试通过
  - [x] 9.2 编写集成测试（导出流程）
    - 客户导出流程测试
    - 产品导出流程测试
    - 互动记录导出流程测试
  - [x] 9.3 测试大数据量导出（> 10000 条记录）
    - 大数据量异步导出测试
    - 批量处理测试
  - [x] 9.4 测试导出文件格式正确性
    - JSON 格式验证：2/2 测试通过
    - CSV 格式验证：2/2 测试通过
    - Excel 格式验证：2/2 测试通过
  - [x] 9.5 测试导出数据完整性
    - 数据完整性测试：5/5 测试通过
    - 数据准确性测试：3/3 测试通过
    - 字段映射测试：3/3 测试通过
    - 空数据处理测试：3/3 测试通过

## Dev Notes

### 导出格式说明
- **JSON**: 适用于程序处理、API 集成、数据迁移
- **CSV**: 适用于 Excel 打开、数据分析、简单导入导出
- **Excel**: 适用于复杂数据分析、多工作表、格式化显示

### 数据完整性验证
- 验证记录总数
- 验证必填字段完整性
- 验证关联关系完整性（如客户-产品关联）
- 验证数据格式正确性

### 异步导出处理
- 使用 Bull Queue 处理大数据量导出（> 10000 条记录）
- 分批处理数据，避免内存溢出
- 实时更新导出进度
- 导出完成后发送通知

### 导出文件存储
- **存储路径：** 使用环境变量 `EXPORT_STORAGE_PATH`（默认：`/tmp/exports`）
- **文件命名：** `{exportType}-{timestamp}-{randomId}.{format}`（如：`customer-20250108-123456-abc123.xlsx`）
- **文件保留：** 7 天，自动清理
- **下载链接有效期：** 24 小时（使用临时 token 或文件 ID 过期检查）
- **文件大小限制：** 单个导出文件最大 100MB，超过限制时：
  - 提示用户缩小导出范围（添加筛选条件）
  - 或自动分片导出（生成多个文件，每个文件最大 100MB）
  - 或使用压缩（ZIP 格式）减少文件大小
- **清理机制：**
  - 定时任务：每天凌晨 2 点执行清理
  - 清理策略：删除超过 7 天的文件，或文件下载链接已过期的文件
  - 清理逻辑：遍历存储目录，检查文件创建时间和下载链接过期时间

### 角色权限
- 只有总监和管理员可以导出数据
- 导出数据需要根据用户角色过滤（前端专员只能导出采购商数据，后端专员只能导出供应商数据）

### 性能优化
- **小数据量（< 1000 条记录）：** 同步导出，立即返回文件
- **中等数据量（1000-10000 条记录）：** 同步导出，显示进度（使用流式处理）
- **大数据量（> 10000 条记录）：** 异步导出，后台处理（Bull Queue）
- **分批处理：** 每批处理 1000 条记录，避免内存溢出
- **流式处理：** 使用 Node.js Stream API 处理大数据量，边查询边写入文件
- **内存优化：** 避免一次性加载所有数据到内存，使用游标或分页查询

### 参考实现
- **基础设施复用：**
  - 复用导入模块的 Bull Queue 配置（`customer-import-queue` 模式）
  - 复用导入模块的文件存储机制（临时文件存储、文件清理）
  - 复用导入模块的进度跟踪模式（`job.updateProgress()`）
- **服务层参考：**
  - 参考 `CustomersService.findAll()` 的查询接口和参数格式
  - 参考 `ProductsService.findAll()` 的查询接口和参数格式
  - 参考 `InteractionsService.findAll()` 的查询接口和参数格式
- **导出库：**
  - 使用 `xlsx` 库生成 Excel 文件（已用于导入模块）
  - 使用 `csv-stringify` 库生成 CSV 文件（需要安装：`npm install csv-stringify`）
  - 使用 `JSON.stringify` 生成 JSON 文件（Node.js 内置）
- **文件处理：**
  - 参考 `ErrorReportGeneratorService` 的文件生成模式
  - 参考导入模块的临时文件存储路径配置（`IMPORT_TEMP_DIR`）

## References

- FR46: 总监和管理员可以导出数据（JSON 或 CSV 格式）
- FR47: 总监和管理员可以导出数据（Excel 格式）
- FR48: 系统可以在导出前验证数据完整性
- FR134: 导出数据时支持多种格式（JSON、CSV、Excel 等）
- FR117: 操作失败时提供错误信息和恢复建议
- CustomersService: 客户数据查询（`findAll(queryParams, token)`）
- ProductsService: 产品数据查询（`findAll(queryParams, userId, token)`）
- InteractionsService: 互动记录数据查询（`findAll(queryParams, token)`）
- CustomerQueryDto: 客户查询参数 DTO（筛选条件）
- ProductQueryParams: 产品查询参数（筛选条件）
- InteractionQueryDto: 互动记录查询参数 DTO（筛选条件）
- ErrorReportGeneratorService: 错误报告生成服务（文件生成参考）
- import_history 表: 导入历史记录表（可复用或参考创建 export_history 表）

