# 批次一：仪表盘与分析页（19.2）— 设计约定与 Pro Max 依据

**Story：** 19.2 仪表盘与分析类页面 UI 优化  
**Pro Max 命令：**

- `search.py "B2B CRM analytics dashboard metrics charts tables" --design-system -p "fenghua-crm" -f markdown`
- `search.py "trend comparison funnel real-time dashboard" --domain chart`
- `search.py "animation accessibility loading" --domain ux`

**约定：** 由 ui-ux-pro-max-skill 生成并人工校订；色板、字体以 **MASTER / uipro-\*** 为主，本文件仅记录**本批的扩展与差异**。

---

## 一、本批范围

### 页面

- `DashboardPage`
- `CustomerAnalysisPage`
- `ProductAssociationAnalysisPage`
- `SupplierAnalysisPage`
- `BuyerAnalysisPage`
- `BusinessTrendAnalysisPage`

### 组件

- 图表：`BarChart`、`LineChart`、`PieChart`、`ChurnRateTrendChart`、`ConversionRateTrendChart`、`ActivityTrendChart`、`CooperationTrendChart`、`BusinessTrendChart`、`BuyerChurnTrendChart`
- 表格：`CustomerAnalysisTable`、`ProductAssociationTable`、`SupplierAnalysisTable`、`BuyerAnalysisTable`
- 其他：`AnalysisExportDialog`、`MetricCard`、`TrendSummary`，以及筛选、日期范围、导出等共用控件

---

## 二、相对 MASTER 的共识（与 MASTER 一致）

- **字体：** Fira Code（标题）+ Fira Sans（正文）
- **色板（主控）：** 使用 `uipro-primary`、`uipro-secondary`、`uipro-cta`、`uipro-bg`、`uipro-text`（见 [MASTER.md](../MASTER.md)、[design-tokens.md](../design-tokens.md)）
- **Anti-patterns：** 不用 playful、AI 紫/粉渐变；本批额外避免：**ornate 装饰、无筛选**
- **Pre-Delivery：** 与 MASTER 相同（无 emoji 图标、cursor-pointer、hover 150–300ms、对比度 ≥4.5:1、焦点可见、prefers-reduced-motion、375/768/1024/1440）

---

## 三、本批扩展与差异

### 3.1 Style：Data-Dense Dashboard

- **关键词：** 多图表/表格、KPI 卡、紧凑 padding、网格、高信息密度
- **落地：** 仪表盘与分析页采用 **grid、minimal padding、space-efficient**；表格与卡片密度高于营销页，但仍需保证可读性与触控目标。

### 3.2 图表类型与库（来自 `--domain chart`）

| 数据类型           | 首选图表       | 备选         | 配色建议                         | 库/交互                |
|--------------------|----------------|--------------|----------------------------------|------------------------|
| 趋势 / 时间序列   | Line Chart     | Area, Smooth Area | Primary #0080FF；多系列用区分色；Fill 约 20% 透明度 | Recharts, Chart.js；Hover + Zoom |
| 实时/流式         | Streaming Area | Ticker, Gauge | 当前值高亮、历史渐隐；网格深色   | 若有实时需求：D3/CanvasJS；**闪烁须有暂停** |
| 漏斗 / 转化       | Funnel, Sankey | Waterfall    | 阶段渐变；标注转化率             | Recharts, D3；Hover + Drill      |

- **与 uipro-\* 对齐：** 系列色从 `uipro-primary`、`uipro-secondary`、`uipro-cta` 及 `semantic-*` 中选取；**不引入** MASTER 禁止的紫/粉渐变。
- **无障碍：** 多系列为色盲用户加**线型/图案区分**；图例、轴标签、percent 清晰可读。

### 3.3 效果（来自 design-system + chart）

- **图表：** Hover tooltips、行/点高亮、点击 Zoom（按需）、图例可 toggle。
- **表格：** 行 hover 高亮、斑马纹（可选）、表头固定（纵向滚动时）。
- **筛选与控件：** 筛选、日期范围、导出等切换有 **smooth 过渡（150–300ms）**；**必须提供筛选**，避免「No filtering」反模式。
- **加载：** 数据请求中用 **skeleton 或 spinner**，禁止空白无反馈（见 3.4）。

### 3.4 UX：动效、加载、无障碍（来自 `--domain ux`）

| 类别       | 建议 | 避免 |
|------------|------|------|
| 加载状态   | skeleton（`animate-pulse`）或 spinner（`animate-spin`） | 空白屏、无反馈 |
| 连续动效   | 仅用于 loading；装饰性不用 `animate-bounce` 等无限循环 | 图标/装饰无限动效 |
| 惰性加载   |  below-the-fold 图表/列表 `loading='lazy'` 或按视口加载 | 首屏一次性加载过重 |

- **prefers-reduced-motion：** 尊重系统设置，减弱或关闭非必要动效。

### 3.5 指标卡与表格

- **MetricCard / TrendSummary：** 与 MASTER 的「smooth stat reveal」「metric pulse」一致；数字变化可做短过渡，避免布局抖动。
- **分析表格：** 表头、斑马纹、行 hover、操作列（如「导出」「查看」）统一 `cursor-pointer` 与 hover；密度在「可扫视」与「不拥挤」之间平衡。

### 3.6 筛选区、日期范围、导出

- **布局：** 与主内容有明确层级（背景、间距或细分栏）；可在表格/图表上方或侧边，视断点调整。
- **导出：** 主按钮用 `uipro-cta` 或 `primary-blue`；`AnalysisExportDialog` 内选项、格式、范围清晰，焦点顺序合理。

---

## 四、色板使用（本批）

- **主控：** `uipro-*`（#0F172A / #334155 / #0369A1 / #F8FAFC / #020617）。
- **图表系列：** 从 `uipro-primary`、`uipro-secondary`、`uipro-cta`、`semantic-success`、`semantic-warning` 等取 3–5 个区分色；多系列时加线型/图案。
- **表格与卡片：** 背景、边框、斑马纹用现有 `monday-*` / `linear-*` 或 `uipro-bg`，与 MASTER 不冲突即可。

---

## 五、Pre-Delivery 与验证（本批必查）

- [ ] 无 emoji 图标（SVG：Heroicons/Lucide）
- [ ] 图表、表格行、筛选、导出、分页等可点击处 `cursor-pointer`
- [ ] Hover、筛选切换、加载 150–300ms 过渡
- [ ] 正文对比度 ≥ 4.5:1；图例、轴标签可读
- [ ] 焦点顺序、键盘可操作、prefers-reduced-motion
- [ ] 375 / 768 / 1024 / 1440 无横向滚动；图表不溢出、可读
- [ ] 各分析页**具备筛选或等效控件**；加载态为 skeleton 或 spinner

---

## 六、回滚与存档

- **回滚单位：** Story 19.2（本批单独 PR）
- **截图/录屏：** 各分析页及 Dashboard 优化后 1–2 张（或短录屏），存 `docs/design-system/screenshots/` 或 `_bmad-output/epic-19-screenshots/`，命名如 `DashboardPage-after-<日期>.png`。
- **回滚步骤与「效果不好」定义：** 见 Story 19.6 产出（如 `epic-19-rollback-and-acceptance.md`）。
