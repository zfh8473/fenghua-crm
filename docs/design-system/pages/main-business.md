# 批次二：主业务列表 / 表单 / 详情（19.3）— 设计约定与 Pro Max 依据

**Story：** 19.3 主业务列表 / 表单 / 详情 UI 优化  
**Pro Max 命令：**

- `search.py "B2B CRM list form detail table" --design-system -p "fenghua-crm" -f markdown`
- `search.py "CRM data table list detail record" --design-system -p "fenghua-crm" -f markdown`
- `search.py "form label validation accessible" --domain ux`
- `search.py "table form layout" --stack html-tailwind`

**约定：** 由 ui-ux-pro-max-skill 生成并人工校订；色板、字体以 **MASTER / uipro-\*** 为主，本文件仅记录**本批的扩展与差异**。

---

## 一、本批范围

### 页面

**客户：** `CustomerManagementPage`、客户列表/搜索/详情、`CustomerDetailPage`、客户表单、`CustomerSearchResults`、`CustomerProductAssociation`、`CustomerTimeline`、`CustomerProductInteractionHistory`

**产品：** `ProductManagementPage`、产品列表/详情/表单、`ProductDetailPage`、`ProductCategoryManagementPage`、`ProductSelect`、`ProductMultiSelect`

**互动：** 互动列表、详情、创建/编辑、评论、快速记录、`FileUpload`、`PhotoPreview`、`InteractionCreateForm`、`InteractionEditForm`、`CommentList`、`CommentInput`

**共用：** `Table`、`Input`、`Button`、`Card`（`components/ui`）

---

## 二、相对 MASTER 的共识（与 MASTER 一致）

- **字体：** Fira Code（标题）+ Fira Sans（正文），即 `font-uipro-heading`、`font-uipro-body`
- **色板（主控）：** `uipro-primary`、`uipro-secondary`、`uipro-cta`、`uipro-bg`、`uipro-text`；语义色 `semantic-success`、`semantic-error`、`semantic-warning`
- **Anti-patterns：** 不用 playful、AI 紫/粉渐变、隐藏资质；本批额外避免：**placeholder 作唯一标签、仅提交时校验、提交无反馈、列表无筛选**
- **Pre-Delivery：** 与 MASTER 相同（无 emoji 图标、cursor-pointer、hover 150–300ms、对比度 ≥4.5:1、焦点可见、prefers-reduced-motion、375/768/1024/1440）

---

## 三、本批扩展与差异

### 3.1 Style：Trust & Authority + 列表/表单/详情

- **关键词：** 列表密度适中、表单可访问、详情信息分组清晰、徽章/状态可读
- **落地：** 主业务页采用 **grid / flex、一致 gap、responsive padding**；列表与 19.2 表格类似：行 hover、斑马纹可选、**必须提供筛选或等效控件**；表单、详情与 19.2 的 Data-Dense 区分：略多留白，保证可读与触控目标。

### 3.2 列表（来自 design-system + stack）

| 项 | 建议 | 避免 |
|----|------|------|
| 密度 | 与 19.2 分析表平衡；`p-monday-2 p-monday-4` 或 `px-4 md:px-6` | 过挤或过疏 |
| 排序 | 表头可排序列 `cursor-pointer`、`transition-colors duration-200` | 无排序 |
| 筛选 | **必须**有筛选或搜索 | 无筛选（反模式） |
| 分页 | 清晰、可键盘焦点 | 仅「加载更多」且无焦点 |
| 行 hover | `hover:bg-monday-bg`、`transition-colors duration-200` | 无反馈或布局位移 |
| 多选 | 复选框 + 全选；`cursor-pointer` | 仅行点击且无多选 |

- **表格：** 表头固定（纵向滚动时）、斑马纹可选；与 19.2 的 `Table` 一致，`striped` 按需传入。
- **长文本：** `truncate` 或 `line-clamp-*`，不溢出布局。

### 3.2.1 列表行内 编辑/删除（Story 19.7 首次落实）

| 项 | 规范 |
|----|------|
| 编辑 | `variant="outline"`、`size="sm"`；`text-uipro-cta`、`hover:bg-uipro-cta/10`；`cursor-pointer`、`transition-colors duration-200`；图标 `HomeModuleIcon name="pencilSquare"` |
| 删除 | `variant="outline"`、`size="sm"`；`text-semantic-error`、`hover:bg-semantic-error/10`；`cursor-pointer`、`transition-colors duration-200`；图标 `HomeModuleIcon name="trash"` |
| 顺序 | 编辑在左、删除在右 |
| 权限/业务 | 仅因权限或业务导致置灰、不展示时可保留；样式、尺寸、间距三处（用户/产品/客户列表）一致 |

### 3.3 表单（来自 `--domain ux`）

| 项 | 建议 | 避免 |
|----|------|------|
| 标签 | 每输入有 `<label>` 或 `aria-label` | 仅 `placeholder` 作标签 |
| 必填 | `*` 或「必填」+ `aria-required` | 必填无提示 |
| 校验 | **onBlur** 为主；提交时汇总 | 仅提交时校验 |
| 提交反馈 | Loading → Success/Error 明确 | 点击后无反馈 |
| 按钮主次 | 主：`uipro-cta`；次：`outline` / `ghost` | 主次不分 |
| 图标按钮 | `aria-label` | 仅图标无名称 |

- **错误态：** 边框/文案用 `semantic-error` 或 `uipro-*` 中与 MASTER 一致的红；与 `Input` 等组件统一。

### 3.4 详情（本批自定义，与 Pro Max 的 Trust & Authority 一致）

- **信息分组：** 用 `Card` 或 `section` 分区；标题 `text-uipro-text`、`font-uipro-heading`。
- **标签与徽章：** 类型、状态用徽章；色彩从 `uipro-*`、`semantic-*` 取，**不引入** 紫/粉。
- **关联区块：** 客户↔产品、互动时间线、评论等；与主内容有层级（背景、边框、`gap-4` / `gap-6`）。
- **操作区：** 主操作 `uipro-cta`，次要 `outline`；`cursor-pointer`、`transition-colors duration-200`。

### 3.5 互动类型、状态、评论区

- **互动类型单选：** 单选控件（如 radio 或 segmented），每项有区分色，从 `uipro-*`、`semantic-*` 取；不用 emoji。
- **状态色彩：** 与 19.2 的 churn/rating 一致：`semantic-success`、`semantic-warning`、`semantic-error` 等。
- **评论区：** `CommentList`、`CommentInput`；输入有 `label`/`aria-label`，提交有 Loading/Success/Error；可聚焦、键盘可操作。

### 3.6 共用组件（Table、Input、Button、Card）

- **Table：** 与 19.2 一致；`striped`、`transition-colors duration-200`、行/表头 `cursor-pointer` 按需。
- **Input：** 支持 error 态（`semantic-error`）、与 `label` 关联；focus 可见。
- **Button：** 主按钮可用 `uipro-cta`（与 19.2 导出按钮一致）；`transition-all duration-200` 已有则保留。
- **Card：** 与 MASTER 一致；hover 不导致布局位移。

---

## 四、色板使用（本批）

- **主控：** `uipro-*`（#0F172A / #334155 / #0369A1 / #F8FAFC / #020617），与 MASTER 一致。
- **表单错误、删除、警示：** `semantic-error`、`semantic-warning`。
- **状态、徽章：** 从 `uipro-cta`、`semantic-success`、`semantic-warning`、`semantic-error` 选取；**不引入** 紫/粉。

---

## 五、布局与间距（来自 `--stack html-tailwind`）

- **Responsive padding：** `px-4 md:px-6 lg:px-8` 或等效，不同断点不同内边距。
- **Gap：** `gap-4`、`gap-6`、`gap-8` 统一，少用单侧 `mb-*` 凑。
- **长文本：** `truncate`、`line-clamp-2` 等，避免溢出。
- **Flex/Grid：** `items-center`、`justify-between`、`shrink-0` 等，避免多余嵌套。

---

## 六、Pre-Delivery 与验证（本批必查）

- [ ] 无 emoji 图标（SVG：Heroicons/Lucide）
- [ ] 列表行、表头排序、筛选、分页、表单提交、详情操作等可点击处 `cursor-pointer`
- [ ] Hover、筛选、校验、提交 150–300ms 过渡
- [ ] 正文对比度 ≥ 4.5:1；表单项、错误提示可读
- [ ] 表单：`label`/`aria-label`、`aria-required`、onBlur 校验、提交反馈
- [ ] 焦点顺序、键盘可操作、`prefers-reduced-motion`
- [ ] 375 / 768 / 1024 / 1440 无横向滚动；列表、表单、详情不溢出
- [ ] 列表**具备筛选或等效控件**；加载态为 skeleton 或 spinner

---

## 七、回滚与存档

- **回滚单位：** Story 19.3（本批单独 PR）
- **截图/录屏：** 客户/产品/互动 列表、表单、详情 优化后 1–2 张（或短录屏），存 `docs/design-system/screenshots/` 或 `_bmad-output/epic-19-screenshots/`，命名如 `CustomerDetailPage-after-<日期>.png`。
- **回滚步骤与「效果不好」定义：** 见 Story 19.6 产出。
