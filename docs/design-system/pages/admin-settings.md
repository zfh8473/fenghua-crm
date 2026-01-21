# 批次四：管理类与设置类（19.5）

**Pro Max 依据：** [admin-settings-pro-max.md](./admin-settings-pro-max.md)  
**与 MASTER 关系：** 色板、字体、Avoid、Pre-Delivery 与 [MASTER.md](../MASTER.md) 一致；优先 `uipro-*`、`semantic-*`。

---

## 1. 范围

| 模块 | 页面 / 组件 |
|------|-------------|
| 用户管理 | `users/UserManagementPage.tsx`、`UserForm`、`UserList` |
| 审计日志 | `audit-logs/AuditLogsPage.tsx`；`audit/components/AuditLogDetailDialog`、`ValueComparison` |
| 系统 / 错误日志 | `logs/SystemLogsPage.tsx`、`error-logs/ErrorLogsPage.tsx`、`LogsList` |
| 系统设置 | `settings/SystemSettingsPage.tsx`、`SettingsForm`、`DataRetentionStatistics` |
| 导入 | `import/CustomerImportPage`、`ProductImportPage`、`InteractionImportPage`；`ImportFileUpload`、`ImportHistory`、`ImportProgress`、`ImportTaskDetail`、`MappingPreview`、`*MappingPreview`、`ValidationResults` |
| 导出 | `export/ExportPage.tsx`、`ExportHistory`、`ExportProgress`、`FieldSelector` |
| 备份 / 恢复 | `backup/BackupStatusPage.tsx`、`BackupStatusPanel`；`restore/DataRestorePage.tsx`、`RestoreOperation` |
| 系统监控 | `monitoring/SystemMonitoringPage.tsx`、`HealthStatusPanel` |
| GDPR | `gdpr/GdprExportPage.tsx`、`GdprDeletionPage.tsx` |

---

## 2. 表格式管理（用户、审计、日志、导入历史、导出历史等）

### 2.1 密度与布局

- **平衡：** 在数据密集与可读性之间折中；可参考 19.2 / 19.3 的 Table：斑马纹 `striped`、行 hover、`transition-colors duration-200`
- **溢出：** 表容器 `overflow-x-auto`，避免小屏横向破版；移动端可考虑卡片式（本批可按现有结构小步优化）

### 2.2 操作列与批量操作

- **操作列：** 编辑 / 删除等用 `text-uipro-cta`、`text-semantic-error`，`cursor-pointer`、`transition-colors duration-200`；**禁止 emoji**，用 SVG
- **批量：** 若有批量操作，Checkbox 列 + 顶栏/底栏操作区；主按钮 `!bg-uipro-cta`，危险批量（如批量删除）用 `semantic-error` 并二次确认

### 2.3 加载与空态

- **加载：** 用 **skeleton** 或 spinner，不可纯「加载中」或冻结；>300ms 必须反馈
- **空态：** 无 emoji；`text-uipro-text`、`text-uipro-secondary`

---

## 3. 设置类（SystemSettings、DataRetention、FieldSelector 等）

### 3.1 设置分组

- **分组：** 用标题 `text-uipro-text`、`font-uipro-heading` 或 `text-uipro-secondary` 区分区块；Card 或 `border-b` 分隔
- **表单：** 每 input 有 `<label for="id">` 或 `aria-label`；错误 `border-semantic-error`、`text-semantic-error`、`focus:ring-semantic-error/50`；正常 `focus:ring-uipro-cta/50`
- **提交反馈：** 提交后 Loading → Success/Error，不可无反馈

### 3.2 进度与状态

- **进度条：** 导入/导出/备份等长时间任务，用进度条或「Step x of n」；色用 `uipro-cta`、`uipro-secondary`，完成可用 `semantic-success`
- **状态标签：** 成功 `semantic-success`，失败/错误 `semantic-error`，进行中/警告 `semantic-warning` 或 `uipro-cta`；**禁止** 紫/粉

---

## 4. 危险操作（删除、覆盖、GDPR 删除、恢复等）

### 4.1 视觉层级

- **主按钮：** 删除、覆盖、确认 GDPR 删除、确认恢复等用 `!bg-semantic-error` 或 `text-semantic-error` + 边框，与「取消」明显区分
- **提示/弹窗：** 警告文案可用 `bg-semantic-error/10 border-semantic-error text-semantic-error` 或 `bg-semantic-warning/10`；`role="alert"`  where 适用

### 4.2 交互

- **二次确认：** 危险操作必须有确认弹窗或二次点击；弹窗内取消 `cursor-pointer`、`transition-colors duration-200`
- **`uipro-cta` 使用：** 仅用于「主要但不危险」的操作（如导出、保存设置），不用于删除/覆盖

---

## 5. 导入 / 导出 / 备份 / 监控 / GDPR 页面

### 5.1 通用

- **标题：** `text-uipro-text`、`font-uipro-heading`
- **说明/次要：** `text-uipro-secondary`
- **链接、按钮：** `cursor-pointer`、`transition-colors duration-200`；主 CTA `!bg-uipro-cta`，危险 `semantic-error`
- **图标：** **禁止 emoji**，用 Heroicons/Lucide 风格 SVG，尺寸统一（如 `w-5 h-5` / `w-6 h-6`）

### 5.2 导入

- **ImportProgress：** 进度条、步骤、百分比；成功/失败状态 `semantic-success` / `semantic-error`
- **ImportHistory、MappingPreview、ValidationResults：** 表格式按 2；错误列表 `text-semantic-error`、`role="alert"`  where 适用

### 5.3 导出

- **ExportProgress、FieldSelector：** 同上；多选/树形可用 `uipro-cta` 表示选中

### 5.4 备份 / 恢复

- **BackupStatusPanel、HealthStatusPanel：** 状态徽章 `semantic-success` / `semantic-error` / `semantic-warning`；时间、说明 `text-uipro-secondary`
- **DataRestorePage、RestoreOperation：** 危险操作用 `semantic-error`，确认流程清晰

### 5.5 GDPR

- **GdprExportPage、GdprDeletionPage：** 说明区 `text-uipro-secondary`；删除/执行用 `semantic-error`，导出用 `uipro-cta`；步骤/进度按 3.2

---

## 6. Token 与实现注意

- **色：** 一律 `uipro-*`、`semantic-*`；禁止 `primary-purple`、紫/粉渐变
- **管理类密度：** 表格、列表在可读性前提下可略紧凑；与 19.2、19.3 的 Table、分析表风格统一
- **危险操作：** 删除、覆盖、GDPR 删除、恢复等必须有明确层级（`semantic-error`）与确认

---

## 7. Pre-delivery 自查（本批）

- [ ] 用户、审计、日志、导入、导出、备份、恢复、监控、GDPR：无 emoji 图标，无紫/粉
- [ ] 所有可点击：`cursor-pointer`；hover 有反馈；过渡 150–300ms
- [ ] 表格：`overflow-x-auto` 或等效，不破版；加载用 skeleton/spinner
- [ ] 表单：input 有 label；焦点、错误样式符合 19.3；提交有 Loading→Success/Error
- [ ] 危险操作：`semantic-error`、二次确认；与 CTA 区分清晰
- [ ] 375、768、1024、1440 无横向滚动；焦点顺序合理

---

## 8. 与 MASTER 的差异

- **无结构性差异：** 色板、Avoid、Pre-Delivery 与 MASTER 一致
- **本批特别强调：** 管理类**信息密度高**，需平衡可读性；**危险操作**必须 `semantic-error` + 确认；进度、状态、反馈（Loading/Step/Progress）需明确
