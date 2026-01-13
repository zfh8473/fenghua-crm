# Story 8.7: 分析结果导出

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**As a** 总监或管理员  
**I want to** 导出分析结果（报表、图表等）  
**So that** 我可以分享分析报告或进行离线处理

## Acceptance Criteria

### AC1: 分析结果导出基础功能
**Given** 总监或管理员已登录系统并查看业务分析结果  
**When** 总监或管理员点击"导出"按钮  
**Then** 系统允许选择导出格式（例如：PDF、CSV、图片、Excel），并生成可下载的分析报告或图表（FR76）  
**And** 导出的报表内容与界面显示一致  
**And** 系统在操作失败时提供错误信息和恢复建议（FR117）

### AC2: 导出格式支持
**Given** 总监或管理员导出分析结果  
**When** 用户选择导出格式  
**Then** 系统支持的导出格式包括：
  - PDF（适用于完整报告）
  - CSV（适用于数据表格）
  - PNG/JPEG（适用于图表）
  - Excel（适用于数据表格）

### AC3: 导出进度和文件处理
**Given** 总监或管理员导出分析结果  
**When** 系统生成导出文件  
**Then** 系统显示导出进度（如果文件较大）  
**And** 系统在导出完成后提供下载链接  
**And** 导出文件包含分析结果的所有关键信息

### AC4: 错误处理和用户体验
**Given** 总监或管理员导出分析结果  
**When** 导出失败  
**Then** 系统显示错误消息  
**And** 系统提供错误详情和恢复建议（FR117）

## Tasks / Subtasks

- [x] Task 1: 创建统一的分析结果导出服务 (AC: 1,2,3,4)
  - [x] 1.1 创建分析结果导出服务模块
    - 创建 `fenghua-backend/src/dashboard/analysis-export.service.ts`
    - 实现统一的导出服务，支持多种格式：
      - CSV 导出（复用现有实现）
      - Excel 导出（使用 `xlsx` 库）
      - PDF 导出（使用 `pdfkit` 或 `puppeteer`）
      - 图片导出（PNG/JPEG，前端生成）
    - 支持导出以下分析结果：
      - 产品关联分析结果
      - 客户分析结果
      - 供应商分析结果
      - 采购商分析结果
      - 业务趋势分析结果
    - 实现导出数据量限制检查（防止内存溢出）
    - 实现导出进度跟踪（可选，对于大文件）
  - [x] 1.2 创建分析结果导出控制器
    - 创建 `fenghua-backend/src/dashboard/analysis-export.controller.ts`
    - 实现统一的导出端点：
      - `POST /api/dashboard/analysis-export`（支持所有分析类型）
      - 或为每个分析类型创建独立端点（保持向后兼容）
    - 支持请求参数：
      ```typescript
      {
        analysisType: 'product-association' | 'customer' | 'supplier' | 'buyer' | 'business-trend';
        format: 'csv' | 'excel' | 'pdf' | 'png' | 'jpeg';
        queryParams: Record<string, any>; // 分析查询参数
        includeCharts?: boolean; // 是否包含图表（PDF/图片格式）
      }
      ```
    - 添加 JWT 认证和角色验证：`@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)`
    - 实现导出格式验证和错误处理

- [x] Task 2: 实现 PDF 导出功能 (AC: 2,3)
  - [x] 2.1 实现 PDF 报告生成
    - 使用 `pdfkit` 或 `puppeteer` 生成 PDF 报告
    - PDF 内容应包括：
      - 分析结果标题和描述
      - 数据表格（如果适用）
      - 图表（使用 `html2canvas` 或 `puppeteer` 截图）
      - 导出时间和筛选条件
    - 实现 PDF 模板和样式
    - 支持中文字体渲染
  - [x] 2.2 实现图表转图片功能
    - 前端使用 Recharts 的 `toDataURL()` 或 `toSVG()` 方法
    - 或使用 `html2canvas` 将图表 DOM 转换为图片
    - 支持 PNG 和 JPEG 格式
    - 确保图表在导出时保持清晰度

- [x] Task 3: 实现 Excel 导出功能 (AC: 2,3)
  - [x] 3.1 实现 Excel 文件生成
    - 使用 `xlsx` 库生成 Excel 文件
    - Excel 内容应包括：
      - 数据表格（多个工作表，如果数据量大）
      - 图表（可选，Excel 支持内嵌图表）
      - 元数据（导出时间、筛选条件等）
    - 实现 Excel 样式和格式（表头、数据格式等）
    - 支持大数据量导出（分工作表）

- [x] Task 4: 创建前端统一导出组件 (AC: 1,3,4)
  - [x] 4.1 创建导出对话框组件
    - 创建 `fenghua-frontend/src/dashboard/components/AnalysisExportDialog.tsx`
    - 实现导出格式选择（CSV、Excel、PDF、PNG、JPEG）
    - 实现导出选项配置：
      - 是否包含图表（PDF/图片格式）
      - 导出范围（当前页/全部数据）
      - 文件名称自定义
    - 实现导出进度显示（对于大文件）
    - 实现错误处理和用户提示
  - [ ] 4.2 创建导出服务
    - 创建 `fenghua-frontend/src/dashboard/services/analysis-export.service.ts`
    - 实现导出 API 调用
    - 实现文件下载处理
    - 实现导出进度跟踪（如果支持）
  - [ ] 4.3 集成导出功能到各分析页面
    - 更新 `ProductAssociationAnalysisPage.tsx`，使用统一导出组件
    - 更新 `CustomerAnalysisPage.tsx`，使用统一导出组件
    - 更新 `SupplierAnalysisPage.tsx`，使用统一导出组件
    - 更新 `BuyerAnalysisPage.tsx`，使用统一导出组件
    - 更新 `BusinessTrendAnalysisPage.tsx`，使用统一导出组件
    - 保持向后兼容（保留现有导出按钮，但使用新的导出组件）

- [x] Task 5: 性能优化和错误处理 (AC: 3,4)
  - [x] 5.1 实现导出数据量限制
    - 在导出前检查数据量
    - 如果数据量过大，提示用户使用筛选条件或异步导出
    - 设置合理的导出限制（如 CSV/Excel: 50000 条，PDF: 10000 条）
  - [x] 5.2 实现导出错误处理
    - 捕获导出过程中的错误
    - 提供友好的错误消息
    - 提供恢复建议（如"请缩小时间范围"、"请使用筛选条件"）
  - [x] 5.3 实现导出进度跟踪（可选）
    - 对于大文件导出，显示进度条
    - 使用 WebSocket 或轮询获取导出进度
    - 或使用前端进度估算（基于数据量）

- [x] Task 6: 测试和文档 (AC: 1,2,3,4)
  - [x] 6.1 编写单元测试
    - 测试导出服务各个方法
    - 测试导出格式转换
    - 测试错误处理
  - [x] 6.2 编写集成测试
    - 测试各分析页面的导出功能
    - 测试不同导出格式
    - 测试大数据量导出
  - [x] 6.3 创建手动测试指南
    - 测试各分析页面的导出功能
    - 测试不同导出格式
    - 测试错误场景

## Dev Notes

### 技术栈
- **后端：**
  - NestJS
  - `xlsx` 库（Excel 导出）
  - `pdfkit` 或 `puppeteer`（PDF 导出）
  - 现有的 CSV 导出实现
- **前端：**
  - React + TypeScript
  - Recharts（图表导出）
  - `html2canvas`（图表转图片）
  - 文件下载处理

### 架构决策
- **统一导出服务：** 创建统一的分析结果导出服务，避免代码重复
- **格式支持优先级：**
  1. CSV（已实现，保持现有功能）
  2. Excel（高优先级，用户常用）
  3. PDF（中优先级，适用于完整报告）
  4. PNG/JPEG（低优先级，主要用于图表）
- **导出方式：**
  - CSV/Excel：同步导出（快速响应）
  - PDF：同步导出（使用 `pdfkit`）或异步导出（使用 `puppeteer`，如果文件很大）
  - 图片：前端生成，然后下载
- **向后兼容：** 保留现有的各分析页面的导出端点，但内部使用统一导出服务

### 参考实现
- 参考 `fenghua-backend/src/export/services/csv-exporter.service.ts`（CSV 导出）
- 参考 `fenghua-backend/src/dashboard/*-analysis.controller.ts`（现有导出端点）
- 参考 `fenghua-frontend/src/dashboard/pages/*-analysis-page.tsx`（现有导出按钮）

### 数据库
- 无需新的数据库表
- 复用现有的分析数据查询

### API 端点
- `POST /api/dashboard/analysis-export`（统一导出端点，可选）
- 或保持现有端点，内部使用统一导出服务：
  - `GET /api/dashboard/product-association-analysis/export`
  - `GET /api/dashboard/customer-analysis/export`
  - `GET /api/dashboard/supplier-analysis/export`
  - `GET /api/dashboard/buyer-analysis/export`
  - `GET /api/dashboard/business-trend-analysis/export`

### 前端路由
- 无需新的路由
- 在各分析页面集成导出组件

### 权限控制
- 使用 `DirectorOrAdminGuard`，仅允许总监和管理员导出分析结果

### 性能考虑
- 导出数据量限制：防止内存溢出
- 大数据量导出：考虑异步导出或分页导出
- 图表导出：前端生成，减少服务器负载

### 错误处理
- 导出格式验证
- 数据量限制检查
- 文件生成错误处理
- 网络错误处理
- 提供友好的错误消息和恢复建议

## Related FRs
- FR76: 总监和管理员可以导出分析结果（报表、图表等）
- FR117: 操作失败时提供错误信息和恢复建议（横切关注点）
- FR148: 系统可以通过图表和可视化方式查看业务分析结果

## Dependencies
- Story 8.2: 产品关联分析（已完成）
- Story 8.3: 客户分析（已完成）
- Story 8.4: 供应商分析（已完成）
- Story 8.5: 采购商分析（已完成）
- Story 8.6: 业务趋势分析（已完成）

