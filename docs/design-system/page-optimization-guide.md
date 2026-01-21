# 页面优化操作指南（Epic 19）

**目标：** 按 Epic 19 的批次，一步一步完成全站 UI 优化；每批单独 PR、可独立回滚；优化过程**必须使用** ui-ux-pro-max-skill（`/ui-ux-pro-max` 或 `search.py`）。

**前置：** Story 19.1 已完成（`/ui-ux-pro-max` 可用，`docs/design-system/MASTER.md`、`uipro-*` Token 已落地）。

---

## 目录

1. [开始前准备](#一开始前准备)
2. [通用流程（每批必走）](#二通用流程每批必走)
3. [批次一：仪表盘与分析页（19.2）](#三批次一仪表盘与分析页192)
4. [批次二：主业务列表/表单/详情（19.3）](#四批次二主业务列表表单详情193)
5. [批次三：登录、首页、导航与布局（19.4）](#五批次三登录首页导航与布局194)
6. [批次四：管理类与设置类（19.5）](#六批次四管理类与设置类195)
7. [检查清单](#七检查清单)
8. [回滚与存档](#八回滚与存档)
9. [附录：Prompt 与命令模板](#九附录prompt-与命令模板)

---

## 一、开始前准备

### 1.1 确认设计系统就绪

- [ ] `docs/design-system/MASTER.md` 存在（色板、字体、Anti-patterns、Pre-delivery 清单）
- [ ] `fenghua-frontend/tailwind.config.ts` 与 `theme.ts` 中有 `uipro-*`（`uipro-primary`、`uipro-cta`、`font-uipro-heading`、`font-uipro-body` 等）
- [ ] 已读 [MASTER.md](./MASTER.md)、[ui-ux-pro-max-skill.md](./ui-ux-pro-max-skill.md)

### 1.2 确认 Pro Max 可用

- [ ] Cursor 中可用 **`/ui-ux-pro-max`**
- [ ]（可选）本机 `python3 --version` 可用，便于跑 `search.py`

### 1.3 批次顺序与原则

| 顺序 | Story | 批次名称 | 原则 |
|------|-------|----------|------|
| 1 | 19.2 | 仪表盘与分析 | 图表、指标卡、分析表格多；先统一数据类视觉 |
| 2 | 19.3 | 主业务列表/表单/详情 | 客户、产品、互动；列表密度、表单、详情层次 |
| 3 | 19.4 | 登录、首页、导航 | 入口与全局框架；小步优化、慎重 |
| 4 | 19.5 | 管理类与设置 | 用户、审计、导入导出、备份、GDPR 等 |

**原则：** 每批**一个 PR**；每批都要用 Pro Max 产出规范，并在 `docs/design-system/pages/` 或 PR 中记录依据。

---

## 二、通用流程（每批必走）

每一批（19.2–19.5）都按下面 7 步执行，不可跳步。

### 步骤 1：界定本批范围

- 打开对应「批次」小节（三～六），复制**页面与组件清单**
- 在仓库中快速确认路径与主要组件名，列成自己的检查表（可放在 `docs/design-system/pages/` 下本批的 `_scope.md` 或直接记在 PR 描述）

### 步骤 2：用 Pro Max 生成/校订本批规范

**方式 A：Cursor 内 `/ui-ux-pro-max`**

1. 输入：`/ui-ux-pro-max` + 本批的**推荐 Prompt**（见各批次「2. 推荐 Prompt」）
2. 若输出较长，可请它：「把 pattern、style、colors、typography、effects、anti-patterns、Pre-delivery 拆成小节，并和 `docs/design-system/MASTER.md` 的 uipro-* 对齐」

**方式 B：命令行 `search.py`**

1. 在项目根执行本批的**推荐 search.py 命令**（见各批次「2. 推荐 search.py」）
2. 将输出存为 `docs/design-system/pages/<批次名>-pro-max.md`（如 `dashboard-analytics-pro-max.md`），并在文首注明：「由 ui-ux-pro-max-skill 生成并人工校订」

**必须得到：** 本批在色彩、字体、间距、图表/表格/表单/按钮上的约定，以及要避免的反模式、Pre-delivery 要点。

### 步骤 3：记录所采用的 Pro Max 规则

在以下其一留下记录（满足 AC「在 PR 或 docs/design-system/pages/ 中记录所依据的 Pro Max 规则或片段」）：

- **推荐：** `docs/design-system/pages/<批次名>.md`  
  内容至少包括：
  - 本批涉及的页面/组件
  - 所依据的 Pro Max 输出（`/ui-ux-pro-max` 的日期/概要，或 `search.py` 命令与输出文件）
  - 本批相对 MASTER 的**差异**（若没有则写「与 MASTER 一致」）
- **或：** 在 PR 描述中写清上述三点，并链接到 `docs/design-system/MASTER.md` 与 `ui-ux-pro-max-skill.md`

### 步骤 4：按规范和 Token 修改代码

- 以 **MASTER.md** 和**本批规范**为准；色板、字体优先用 **`uipro-*`**，需要时再配合 `monday-*`、`linear-*`（并在 `design-tokens.md` 注明用途）
- 修改本批范围内页面与组件，逐项对照 **第七节 检查清单**（图标、cursor、hover、对比度、焦点、断点等）

### 步骤 5：Pre-delivery 自查

- 用 [.cursor/commands/ui-ux-pro-max.md](../.cursor/commands/ui-ux-pro-max.md) 中的 **Common Rules** 与 **Pre-Delivery Checklist** 过一遍本批页面
- 在本地按 375、768、1024、1440 看一遍；确认无横向滚动、无内容被固定顶栏遮挡

### 步骤 6：优化前后截图或录屏

- 对「本批」中的**关键页面**各存 1～2 张优化后截图（或 10–20 秒录屏）
- 若已有优化前截图，同路径并存；命名建议：`<页面名>-before|after-<日期>.png`
- 存档位置：`docs/design-system/screenshots/` 或 `_bmad-output/epic-19-screenshots/`（在回滚文档中写明）

### 步骤 7：提交与回滚信息

- 本批改动放在**单独分支、单独 PR**
- PR 描述中注明：
  - 本批对应的 Story（19.2 / 19.3 / 19.4 / 19.5）
  - 所依据的 Pro Max 记录（链接到 `docs/design-system/pages/<批次名>.md` 或等价说明）
  - **回滚说明**：`git revert <本 PR 的 merge commit>` 或等价 revert 范围，以及 revert 后建议验证的页面/操作（可后续在 Story 19.6 的回滚文档中补全）

---

## 三、批次一：仪表盘与分析页（19.2）

### 1. 范围

**页面：**

- `DashboardPage`
- `CustomerAnalysisPage`
- `ProductAssociationAnalysisPage`
- `SupplierAnalysisPage`
- `BuyerAnalysisPage`
- `BusinessTrendAnalysisPage`

**组件：**

- `BarChart`、`LineChart`、`PieChart`、`ChurnRateTrendChart`、`ConversionRateTrendChart`、`ActivityTrendChart`、`CooperationTrendChart`、`BusinessTrendChart`、`BuyerChurnTrendChart`
- `CustomerAnalysisTable`、`ProductAssociationTable`、`SupplierAnalysisTable`、`BuyerAnalysisTable`
- `AnalysisExportDialog`、`MetricCard`、`TrendSummary`，以及共用的筛选、日期范围等

### 2. 推荐 Prompt（`/ui-ux-pro-max`）

```
为 B2B CRM 的「业务仪表盘与分析页」生成设计规范。包含：业务总览、客户/产品/供应商/采购商/业务趋势等分析页；大量折线图、柱状图、饼图、指标卡、数据表格。请给出：
- 图表类型与配色（与 uipro-*、MASTER 对齐）
- 指标卡、表格密度、表头与斑马纹
- 筛选区、日期范围、导出按钮的布局与层级
- 本类页面要避免的反模式与 Pre-delivery 要点
- 和 docs/design-system/MASTER.md 的差异（若完全一致则说明）
```

### 3. 推荐 search.py

```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B CRM analytics dashboard metrics charts tables" --design-system -p "fenghua-crm" -f markdown
```

**图表与 UX 补充（按需）：**

```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "trend comparison funnel real-time dashboard" --domain chart
python3 .shared/ui-ux-pro-max/scripts/search.py "animation accessibility loading" --domain ux
```

### 4. Token 与实现注意

- 图表：用 `uipro-primary`、`uipro-secondary`、`uipro-cta` 等作系列色；避免 AI 紫/粉渐变（MASTER 的 Anti-pattern）
- 表格：表头、斑马纹、行 hover 与 `cursor-pointer` 统一
- 指标卡：与 MASTER 的「smooth stat reveal」「metric pulse」等效果一致；过渡 150–300ms

### 5. 验证要点

- [ ] 各分析页在 768、1024 下图表不溢出、图例可读
- [ ] 表格支持键盘焦点与屏幕阅读器
- [ ] 导出、筛选、日期等按钮有 hover/focus，且 `cursor-pointer`

---

## 四、批次二：主业务列表/表单/详情（19.3）

### 1. 范围

**客户：** `CustomerManagementPage`、客户列表/搜索/详情、`CustomerDetailPage`、客户表单、`CustomerSearchResults`、`CustomerProductAssociation`、`CustomerTimeline`、`CustomerProductInteractionHistory` 等  

**产品：** `ProductManagementPage`、产品列表/详情/表单、`ProductDetailPage`、`ProductCategoryManagementPage`、`ProductSelect`、`ProductMultiSelect` 等  

**互动：** 互动列表、详情、创建/编辑、评论、快速记录、`FileUpload`、`PhotoPreview`、`InteractionCreateForm`、`InteractionEditForm`、`CommentList`、`CommentInput` 等  

**共用：** `Table`、`Input`、`Button`、`Card`（`components/ui`）

### 2. 推荐 Prompt（`/ui-ux-pro-max`）

```
为 B2B CRM 的「主业务：客户、产品、互动的列表、表单、详情」生成设计规范。包含：
- 列表：密度、排序、筛选、分页、行 hover、多选
- 表单：标签、必填、校验提示、按钮主次
- 详情：信息分组、标签与徽章、关联区块、操作按钮
- 互动类型单选、状态色彩、评论区
- 要避免的反模式与 Pre-delivery 要点；与 MASTER 的 uipro-* 对齐
```

### 3. 推荐 search.py

```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B CRM list form detail table" --design-system -p "fenghua-crm" -f markdown
```

**表单与可访问性（按需）：**

```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "form label validation accessible" --domain ux
python3 .shared/ui-ux-pro-max/scripts/search.py "table form layout" --stack html-tailwind
```

### 4. Token 与实现注意

- 列表：可点击行、操作按钮统一 `cursor-pointer`、hover 不导致布局位移
- 表单：输入框、错误态与 `uipro-*` 或 `semantic-error` 一致；`label` 与 `id` 关联
- 互动类型、状态：沿用既有色彩体系，与 MASTER 的 Anti-pattern（如 playful、紫粉渐变）避开

### 5. 验证要点

- [ ] 列表→详情→编辑、创建互动等主路径走通
- [ ] 表单必填、校验在 focus/blur 下表现正确
- [ ] 详情页信息层级清晰，按钮主次符合规范

---

## 五、批次三：登录、首页、导航与布局（19.4）

### 1. 范围

- `LoginPage`
- 首页（若有）
- `MainLayout`、`TopNavigation`
- 侧边或顶导航菜单、active 状态、响应式折叠
- `ProtectedRoute`、`RoleProtectedRoute` 相关的入口与跳转提示

### 2. 推荐 Prompt（`/ui-ux-pro-max`）

```
为 B2B 企业应用的「登录页、主导航与主布局」生成设计规范。包含：
- 登录框：布局、品牌区、输入框、按钮、错误提示、与 MASTER 色板对齐
- 顶栏/侧栏：层级、active、hover、折叠规则、响应式断点
- MainLayout：内容区内边距、最大宽度、与固定顶栏的间距
- 要避免的反模式与 Pre-delivery 要点
```

### 3. 推荐 search.py

```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B enterprise login navigation layout" --design-system -p "fenghua-crm" -f markdown
```

### 4. Token 与实现注意

- 登录、导航为入口，**小步优化**：先间距、字体、按钮样式，再考虑大改
- 顶栏若固定，内容区需预留高度，避免遮挡；与 MASTER「Floating navbar」「Content padding」一致

### 5. 验证要点

- [ ] 登录在 375、768 下可用；焦点顺序、错误提示可访问
- [ ] 导航在折叠/展开、各断点下无错位、无横向滚动
- [ ] 各角色入口（含无权限跳转）正常

---

## 六、批次四：管理类与设置类（19.5）

### 1. 范围

- `UserManagementPage`、`UserForm`、`UserList`
- `AuditLogsPage`、`SystemLogsPage`、`ErrorLogsPage`
- 系统设置、数据保留、`SettingsForm`、`DataRetentionStatistics`
- `ImportPage`（客户/产品/互动）、`ImportHistory`、`ImportProgress`、`FieldSelector`、`MappingPreview` 等
- `ExportPage`、`ExportHistory`、`ExportProgress`
- `BackupStatusPage`、`BackupStatusPanel`、`DataRestorePage`
- `SystemMonitoringPage`、`HealthStatusPanel`
- `GdprExportPage`、`GdprDeletionPage`

### 2. 推荐 Prompt（`/ui-ux-pro-max`）

```
为 B2B 企业应用的「管理类与设置类页面」生成设计规范。包含：用户管理、审计/日志、系统设置、数据保留、导入/导出、备份/恢复、系统监控、GDPR。请给出：
- 表格式管理的密度、操作列、批量操作
- 设置分组、进度与状态展示、警告/危险操作
- 与 MASTER、uipro-* 对齐；要避免的反模式与 Pre-delivery 要点
```

### 3. 推荐 search.py

```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B admin settings management" --design-system -p "fenghua-crm" -f markdown
```

### 4. Token 与实现注意

- 管理类信息密度高：在「数据密集」与可读性之间平衡，可参考 Pro Max 对 B2B Enterprise、Dashboard 的建议
- 危险操作（删除、覆盖）需有明确视觉层级（如 `semantic-error`、`uipro-cta` 的谨慎使用）

### 5. 验证要点

- [ ] 用户 CRUD、审计查看、导入/导出、备份状态、GDPR 流程等主路径可用
- [ ] 进度条、状态标签、错误提示符合设计规范

---

## 七、检查清单

每批提交前，用本清单对**本批涉及页面**做一次 pass。

### 7.1 图标与视觉（来自 Pro Max Common Rules）

- [ ] 未用 emoji 当图标（用 Heroicons / Lucide 等 SVG）
- [ ] 图标尺寸统一（如 24×24，`w-6 h-6`）
- [ ] Hover 不改动 `scale` 导致布局位移；用颜色/透明度/阴影

### 7.2 交互与光标

- [ ] 所有可点击元素有 `cursor-pointer`
- [ ] Hover 有清晰反馈（颜色、边框、阴影）
- [ ] 过渡 150–300ms（如 `transition-colors duration-200`）

### 7.3 对比度与浅色模式

- [ ] 正文对比度 ≥ 4.5:1（如 `uipro-text` #020617  on `uipro-bg` #F8FAFC）
- [ ] 弱化文案至少 #475569（slate-600）一级
- [ ] 玻璃/半透明元素在浅色下可辨；边框不用 `border-white/10` 等不可见

### 7.4 布局与导航

- [ ] 固定顶栏与内容区留足间距；内容不藏在导航下
- [ ] 容器 `max-w-*` 统一（如 `max-w-6xl` / `max-w-7xl`）
- [ ] 375、768、1024、1440 无横向滚动

### 7.5 可访问性

- [ ] 图片有 `alt`；表单有 `<label>` 且与 `id` 关联
- [ ] 焦点可见（keyboard nav）；颜色非唯一信息载体
- [ ] 若有时长较长动效，考虑 `prefers-reduced-motion`

### 7.6 Pre-delivery（Pro Max）

- [ ] 与 [.cursor/commands/ui-ux-pro-max.md](../.cursor/commands/ui-ux-pro-max.md) 中的 **Pre-Delivery Checklist** 一致

---

## 八、回滚与存档

### 8.1 回滚单位与步骤

- **单位：** 以 Story（19.2 / 19.3 / 19.4 / 19.5 / 19.7）为一批；每批对应**一个 PR**
- **步骤：** 对该批 PR 的 merge commit 执行 `git revert <merge-commit>`，推分支、重新部署；按回滚文档中的「验证清单」做一次冒烟
- **回滚文档：** [epic-19-rollback-and-acceptance.md](./epic-19-rollback-and-acceptance.md)（Story 19.6 产出）

### 8.2 「效果不好」与验收

- **判定人：** 产品负责人或 Epic 发起人
- **可参考：** 反馈变差、任务完成率/错误率变差、观感或可访问性不如优化前
- **详细定义：** 见 [epic-19-rollback-and-acceptance.md](./epic-19-rollback-and-acceptance.md)

### 8.3 截图与录屏

- **位置：** `docs/design-system/screenshots/` 或 `_bmad-output/epic-19-screenshots/`
- **命名：** `<页面名>-before|after-<日期>.png` 或 `-<日期>.mp4`
- **内容：** 每批关键页面各 1～2 张/段，便于「效果不好」判定与回滚后对比

---

## 九、附录：Prompt 与命令模板

### A. `/ui-ux-pro-max` 通用模板

```
/ui-ux-pro-max 为 B2B CRM 的【本批名称】生成设计规范。范围：【页面与组件简述】。请给出：pattern、style、colors、typography、effects、anti-patterns、Pre-delivery 要点，并与 docs/design-system/MASTER.md 的 uipro-* 对齐。若有差异请单独列出。
```

### B. search.py 通用模板

```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "<本批关键词>" --design-system -p "fenghua-crm" -f markdown
```

**常用领域：**

- 图表：`--domain chart "…"`
- 动效与可访问性：`--domain ux "animation accessibility"`
- 字体：`--domain typography "…"`
- 实现：`--stack html-tailwind` 或 `--stack react`

### C. `docs/design-system/pages/` 建议结构

```
docs/design-system/pages/
├── dashboard-analytics.md      # 19.2 本批约定与 Pro Max 依据
├── main-business.md            # 19.3
├── login-nav-layout.md         # 19.4
├── admin-settings.md           # 19.5
└── （可选）*-pro-max.md        # search.py 的原始输出，供追溯
```

### D. 文档引用关系

- 本指南：`docs/design-system/page-optimization-guide.md`
- 设计系统总览： [README.md](./README.md)
- 全局规范： [MASTER.md](./MASTER.md)
- Pro Max 用法： [ui-ux-pro-max-skill.md](./ui-ux-pro-max-skill.md)
- Token： [design-tokens.md](./design-tokens.md)
- 回滚与验收（Story 19.6 产出）：[epic-19-rollback-and-acceptance.md](./epic-19-rollback-and-acceptance.md)

---

**使用方式：** 从「一开始前准备」打勾，再按「二、通用流程」执行当前批次（三～六之一），用「七、检查清单」收尾，按「八」做回滚准备与存档；需要时查「九、附录」。
