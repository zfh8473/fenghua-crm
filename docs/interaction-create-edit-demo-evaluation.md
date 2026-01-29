# 创建/编辑互动记录 Demo 页面整合评估

本文档评估两个由 Claude 生成的 HTML Demo（`interaction-create-unified.html`、`interaction-edit-unified.html`）与当前项目的整合可行性。

---

## 一、Demo 概览

### 1. 创建互动记录 Demo（interaction-create-unified.html）

| 区块       | 内容 |
|------------|------|
| 页面头部   | 返回列表、标题「创建互动记录」、副标题「记录与客户的沟通和互动情况」 |
| 客户信息   | 客户（必填，搜索框）、联系人（可选，搜索框） |
| 关联产品   | 标题 +「已选 N 个」徽章、产品搜索、**产品网格卡片**（名称/HS编码/类别/状态，点击多选） |
| 互动详情   | 互动类型（**下拉 select**）、互动时间（**datetime-local**）、互动描述（textarea + 0/5000 字数） |
| 附件       | 虚线拖拽上传区 + 已上传列表 |
| 底部       | 取消、创建互动记录 |

- 技术：Tailwind CDN，主色 `#0D7ABD`，无真实 API，产品为 mock 数据。

### 2. 编辑互动记录 Demo（interaction-edit-unified.html）

| 区块       | 内容 |
|------------|------|
| 页面头部   | 返回、标题「编辑互动记录」、副标题含客户名、**查看详情** + **删除** 按钮 |
| 客户信息   | **客户只读**（蓝色高亮卡片）、**关联联系人**（灰色卡片 +「更换」） |
| 关联产品   | 「已选 N 个」、产品搜索、**已选产品列表**（卡片 + 每项移除按钮）、**「+ 添加更多产品」** |
| 互动详情   | 互动类型 select、互动时间 datetime、互动描述 + 字数、**状态** select（已完成/进行中/待跟进/已取消） |
| 附件       | 上传区（无已上传列表展示） |
| 底部       | 取消 \| **保存草稿**、保存修改 |

- 技术：同上，静态 HTML。

---

## 二、与当前项目对比

### 2.1 创建页（InteractionCreateForm + InteractionCreatePage）

| 维度         | Demo                          | 当前项目 |
|--------------|-------------------------------|----------|
| 客户/联系人  | 两个搜索框（客户必填、联系人可选） | CustomerSelect + PersonSelect（联系人必填） |
| 产品选择     | 产品网格卡片 + 搜索 + 多选   | ProductMultiSelect（下拉/搜索列表） |
| 互动类型     | select 下拉                   | 单选 radio 组（按角色过滤） |
| 互动时间     | 显式 datetime-local           | 隐藏，提交时用当前时间 |
| 描述         | textarea + 5000 字计数        | textarea，有 5000 限制（Edit 有 MAX_DESCRIPTION_LENGTH） |
| 附件         | 上传区 + 列表                 | FileUpload 组件 |
| 设计         | #0D7ABD，Tailwind CDN         | ui-ux-pro-max（如 #0369A1、rounded-monday-md 等） |

### 2.2 编辑页（InteractionEditForm）

| 维度         | Demo                          | 当前项目 |
|--------------|-------------------------------|----------|
| 客户         | 只读高亮卡片                  | 只读（注释写 customer 只读） |
| 联系人       | 只读卡片 +「更换」            | PersonSelect 可更换 |
| 产品         | 可移除、可「添加更多产品」    | **不支持编辑产品**（说明：需删除后重建） |
| 互动类型     | select                        | 只读（注释写 interactionType 只读） |
| 互动时间     | 可编辑 datetime               | 可编辑 |
| 描述/状态    | 可编辑 + 状态 select          | 可编辑，有状态 |
| 附件         | 上传区                        | FileUpload + 已有附件列表 |
| 头部操作     | 查看详情、删除                | 有返回/删除等 |

**后端能力：**

- `UpdateInteractionDto` 已包含 `productIds`、`personId`，后端 `interactions.service` 已支持按 `productIds` 更新关联产品。
- 前端 `UpdateInteractionDto` 类型和编辑表单尚未暴露「编辑产品」能力，属于产品/前端未做，而非后端不支持。

---

## 三、可整合点

### 3.1 可直接采纳的 UI/结构

1. **分区与层级**
   - Demo 的「客户信息」「关联产品」「互动详情」「附件」卡片分区与当前页面结构一致，可直接对应现有 Card/区块，无需改数据流。
2. **创建页**
   - 头部：返回 + 标题 + 副标题（当前有标题，可补一句副标题）。
   - 产品区：采用「产品网格卡片 + 搜索 + 已选 N 个」的布局和文案，用现有 `ProductMultiSelect` 或新写「卡片网格」展示模式，数据仍用 `allowedProducts`/`selectedProducts`。
   - 描述：增加「0/5000」字数统计，与 Edit 页的 `MAX_DESCRIPTION_LENGTH` 统一。
3. **编辑页**
   - 头部：保留「查看详情」「删除」，与当前一致。
   - 客户：只读高亮卡片（当前已是只读，可套 Demo 的蓝色高亮样式）。
   - 联系人：只读卡片 +「更换」按钮（当前已有 PersonSelect，可改为「先展示只读卡片，点击更换再出选择器」）。
4. **设计规范**
   - 用项目 design tokens 替代 Demo 的 hardcode：主色用 `primary-blue`/uipro-cta，圆角用 `rounded-monday-md`，背景用 `monday-bg`/`uipro-bg` 等，保证与 ui-ux-pro-max 一致。

### 3.2 需对齐或小幅改动的点

1. **互动类型**
   - Demo 为中文文案的 select；项目用 enum + `getInteractionTypeLabel`。整合时：保留 enum 与后端一致，仅把「展示控件」从 radio 改为 select（可选），选项仍由现有 `interactionTypeOptions` + label 生成。
2. **创建页「互动时间」**
   - Demo 显式可选时间；当前为自动当前时间。若产品希望创建时也可选时间，可增加 datetime 字段并随提交传给后端；否则保持现状即可。
3. **编辑页「保存草稿」**
   - 当前无草稿状态；若业务无需求可不在编辑页提供该按钮。
4. **编辑页「产品」**
   - 后端已支持 `productIds` 更新，前端可增加「编辑关联产品」：已选产品列表 + 移除 +「添加更多产品」，并更新 `UpdateInteractionDto` 与 API 调用。Demo 的这块 UI 可直接作为参考实现。

### 3.3 不建议照搬的点

1. **互动类型选项文案**
   - Demo 中如「至署订单」「需求讨论」「产品演示」等与现有 `interaction-types` 常量/后端 enum 不完全一致，整合时**以项目现有 enum + getInteractionTypeLabel 为准**，不采用 Demo 的 option 列表。
2. **Tailwind CDN**
   - 项目已用本地 Tailwind + theme，不引入 CDN，仅把 Demo 的 class 思路转为项目 token/class。
3. **状态选项**
   - 编辑页状态用项目已有 `InteractionStatus` 与 `STATUS_OPTIONS_*`（如「需要跟进」），不按 Demo 的「待跟进」等自行新增枚举值。

---

## 四、实施建议

### 阶段 1：样式与布局对齐（低风险）

- 创建页/编辑页统一为 Demo 的卡片分区与标题层级。
- 创建页产品区：在现有数据基础上增加「已选 N 个」徽章；可选：为 ProductMultiSelect 增加「网格卡片」展示模式。
- 编辑页客户/联系人：客户区改为只读高亮卡片样式；联系人改为「只读卡片 + 更换」。
- 描述区统一增加字数统计（0/5000），创建/编辑共用逻辑。
- 全部分块使用 `uipro-*`、`monday-*`、`semantic-*` 等 token，替换 Demo 中的硬编码色和圆角。

### 阶段 2：编辑页产品与 DTO（需联调）

- 前端 `UpdateInteractionDto` 增加 `productIds?: string[]`，提交时传给后端。
- 编辑页加载当前互动关联产品，展示为「已选列表」+ 每项移除 +「添加更多产品」（与 Demo 一致），调用现有产品搜索/多选逻辑。
- 后端已支持，主要工作在前端类型、表单状态与 API 调用。

### 阶段 3：可选增强

- 创建页：若产品需要，增加「互动时间」可选（datetime），并随 CreateInteractionDto 提交。
- 创建页：互动类型从 radio 改为 select，仅 UI 变化，数据与校验不变。
- 编辑页：仅在业务需要时增加「保存草稿」（并定义草稿存储与恢复方式）。

---

## 五、结论

| 问题                     | 结论 |
|--------------------------|------|
| 两个 Demo 能否与当前项目整合？ | **可以**。Demo 的布局、分区、产品/客户/联系人展示方式与当前交互和 API 兼容，用项目 design system 与数据源替换后即可落地。 |
| 主要工作量在哪里？       | 样式与 token 对齐；产品选择从「下拉列表」增强为「网格卡片 + 已选 N 个」（创建页）；编辑页客户/联系人只读卡片 + 编辑产品（含 DTO 与提交）。 |
| 是否有无法整合的部分？   | 无。Demo 中的差异（互动类型文案、是否显式时间、是否草稿）均可通过「以项目枚举/业务为准」或「可选增强」处理。 |

**建议**：先做阶段 1（布局与样式统一 + 字数统计 + 客户/联系人只读卡片），再按需求做阶段 2（编辑页产品），最后按需做阶段 3 的增强项。
