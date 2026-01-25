# 联系人管理模块 — 设计约定与 Pro Max 依据

**Story：** 20.3 联系人管理模块 UI 设计  
**Epic：** 20  
**Pro Max 命令：**

- `search.py "B2B CRM contact person management list form detail modal" --design-system -p "fenghua-crm" -f markdown`
- `search.py "form label validation accessible" --domain ux`
- `search.py "table form layout" --stack html-tailwind`
- `search.py "modal dialog contact list" --domain ux`

**约定：** 由 ui-ux-pro-max-skill 生成并人工校订；色板、字体以 **MASTER / uipro-\*** 为主，本文件仅记录**本批的扩展与差异**。

---

## 一、本批范围

### 页面

**联系人管理：** `PersonManagementPage`、联系人列表（表格式）、`PersonList`、`PersonDetailPanel`、`PersonCreateForm`、`PersonEditForm`、`PersonSearch`

**客户列表集成：** `CustomerPersonManagementModal`（模态弹窗，参考 `CustomerAssociationManagementModal`）

**互动记录集成：** `PersonSelect`（智能推荐）、互动记录表单中的联系人选择

**共用：** `Table`、`Input`、`Button`、`Card`、`MultiSelect`（`components/ui`）

---

## 二、相对 MASTER 的共识（与 MASTER 一致）

- **字体：** Fira Code（标题）+ Fira Sans（正文），即 `font-uipro-heading`、`font-uipro-body`
- **色板（主控）：** `uipro-primary`、`uipro-secondary`、`uipro-cta`、`uipro-bg`、`uipro-text`；语义色 `semantic-success`、`semantic-error`、`semantic-warning`
- **Anti-patterns：** 不用 playful、AI 紫/粉渐变、隐藏资质；本批额外避免：**placeholder 作唯一标签、仅提交时校验、提交无反馈、列表无筛选**
- **Pre-Delivery：** 与 MASTER 相同（无 emoji 图标、cursor-pointer、hover 150–300ms、对比度 ≥4.5:1、焦点可见、prefers-reduced-motion、375/768/1024/1440）

---

## 三、本批扩展与差异

### 3.1 Style：Trust & Authority + 联系人管理

- **关键词：** 联系人列表密度适中、表单可访问、详情信息分组清晰、联系方式图标可识别、模态弹窗不干扰主流程
- **落地：** 联系人管理页采用 **grid / flex、一致 gap、responsive padding**；列表与 19.3 主业务列表类似：行 hover、斑马纹可选、**必须提供筛选或等效控件**；表单、详情与 19.3 一致：略多留白，保证可读与触控目标。

### 3.2 联系人列表（表格式，参考 CustomerList）

| 项 | 建议 | 避免 |
|----|------|------|
| 密度 | 与 19.3 主业务列表平衡；`p-monday-2 p-monday-4` 或 `px-4 md:px-6` | 过挤或过疏 |
| 排序 | 表头可排序列 `cursor-pointer`、`transition-colors duration-200` | 无排序 |
| 筛选 | **必须**有筛选或搜索（按客户、职位、部门、重要性） | 无筛选（反模式） |
| 分页 | 清晰、可键盘焦点 | 仅「加载更多」且无焦点 |
| 行 hover | `hover:bg-monday-bg`、`transition-colors duration-200` | 无反馈或布局位移 |
| 重要联系人 | 星标图标（⭐）在姓名前，`is_important = true` 时显示 | 无视觉标识 |

**表格列：**
- 姓名（含星标）+ 职位 + 部门
- 所属客户（链接到客户详情）
- 联系方式图标（电话、邮箱、微信、WhatsApp、LinkedIn、Facebook）- 有值则点亮
- 操作（编辑、删除）

### 3.3 客户列表中的联系人管理（模态弹窗）

**参考实现：** `CustomerAssociationManagementModal`

**设计要点：**
- 模态弹窗尺寸：`max-w-6xl max-h-[90vh]`
- 左侧：联系人列表（卡片式或表格式，支持搜索和筛选）
- 右侧：可添加新联系人（可选）
- 联系方式图标：如果联系人填写了该联系方式，图标点亮；点击图标可快速创建互动记录

**联系方式图标：**
- 电话：`tel:号码`
- 手机：`tel:号码`
- 邮箱：`mailto:邮箱?subject=主题&body=内容`
- 微信：`weixin://`（需要验证）
- WhatsApp：`whatsapp://send?phone=号码&text=消息`
- LinkedIn：`https://www.linkedin.com/in/用户名`
- Facebook：`https://www.facebook.com/用户名`

**快速创建互动记录流程：**
1. 用户点击联系方式图标
2. 弹出互动记录表单（预填：联系人、客户、互动类型、联系方式）
3. 用户填写互动内容（描述、日期等）
4. 用户点击"创建互动记录并开始互动"按钮
5. 系统先保存互动记录到数据库
6. 然后调用本地应用协议打开对话窗口

### 3.4 联系人表单（创建/编辑）

| 项 | 建议 | 避免 |
|----|------|------|
| 标签 | 每输入有 `<label>` 或 `aria-label` | 仅 `placeholder` 作标签 |
| 必填 | `*` 或「必填」+ `aria-required` | 必填无提示 |
| 校验 | **onBlur** 为主；提交时汇总 | 仅提交时校验 |
| 提交反馈 | Loading → Success/Error 明确 | 点击后无反馈 |
| 按钮主次 | 主：`uipro-cta`；次：`outline` / `ghost` | 主次不分 |

**必填字段：**
- 姓名（first_name 或 last_name 至少一个）
- 关联客户（company_id）- 下拉选择器，显示客户名称

**可选字段：**
- 职位（job_title）
- 部门（department）
- 联系方式：电话、手机、邮箱、微信、WhatsApp、LinkedIn、Facebook
- 备注（notes）

**数据验证：**
- 邮箱：全局唯一，格式验证（`@IsEmail()`）
- 邮箱唯一性例外：允许联系人的邮箱与客户的邮箱相同（公司官方邮箱）

**错误态：** 边框/文案用 `semantic-error` 或 `uipro-*` 中与 MASTER 一致的红；与 `Input` 等组件统一。

### 3.5 联系人详情面板（侧边栏，参考 CustomerDetailPanel）

**信息分组：**
- 基本信息：姓名、职位、部门、所属客户
- 联系方式：所有联系方式（电话、手机、邮箱、微信、WhatsApp、LinkedIn、Facebook）
- 重要联系人标记：星标切换按钮
- 备注：notes 字段
- 互动历史：显示该联系人的所有互动记录（可选）

**操作按钮：**
- 编辑：`variant="outline"`、`text-uipro-cta`、`hover:bg-uipro-cta/10`、图标 `pencilSquare`
- 删除：`variant="outline"`、`text-semantic-error`、`hover:bg-semantic-error/10`、图标 `trash`

### 3.6 互动记录中的联系人选择（智能推荐）

**实现方式：**
- 用户先选择客户
- 系统根据客户自动推荐常用联系人（基于历史互动记录）
- 显示该客户下最近互动的联系人
- 按互动频率排序
- 最多显示3-5个推荐联系人
- 用户可以选择推荐的联系人，或手动搜索选择，或选择"无联系人"（使用公司官方邮箱）

**组件：** `PersonSelect`（参考 `ProductSelect`、`CustomerSelect`）

### 3.7 重要联系人标记（星标）

**数据库字段：** `is_important` BOOLEAN DEFAULT false

**UI 实现：**
- 在联系人列表的姓名前显示星标图标（⭐）
- 在联系人详情面板中提供星标切换按钮
- 星标状态：`is_important = true` 时显示实心星标，`false` 时显示空心星标或隐藏
- 支持按重要性筛选和排序

**视觉设计：**
- 星标颜色：`text-yellow-500` 或 `text-uipro-cta`（与 CTA 色一致）
- Hover 效果：`hover:scale-110`、`transition-transform duration-200`
- 点击切换：`cursor-pointer`

---

## 四、色板使用（本批）

- **主控：** `uipro-*`（#0F172A / #334155 / #0369A1 / #F8FAFC / #020617），与 MASTER 一致。
- **表单错误、删除、警示：** `semantic-error`、`semantic-warning`。
- **状态、徽章：** 从 `uipro-cta`、`semantic-success`、`semantic-warning`、`semantic-error` 选取；**不引入** 紫/粉。
- **重要联系人星标：** `text-yellow-500` 或 `text-uipro-cta`。

---

## 五、布局与间距（来自 `--stack html-tailwind`）

- **Responsive padding：** `px-4 md:px-6 lg:px-8` 或等效，不同断点不同内边距。
- **Gap：** `gap-4`、`gap-6`、`gap-8` 统一，少用单侧 `mb-*` 凑。
- **长文本：** `truncate`、`line-clamp-2` 等，避免溢出。
- **Flex/Grid：** `items-center`、`justify-between`、`shrink-0` 等，避免多余嵌套。
- **模态弹窗：** `max-w-6xl max-h-[90vh]`、`overflow-y-auto`、`flex flex-col`。

---

## 六、Pre-Delivery 与验证（本批必查）

- [ ] 无 emoji 图标（SVG：Heroicons/Lucide）
- [ ] 列表行、表头排序、筛选、分页、表单提交、详情操作、联系方式图标、星标切换等可点击处 `cursor-pointer`
- [ ] Hover、筛选、校验、提交、图标点击 150–300ms 过渡
- [ ] 正文对比度 ≥ 4.5:1；表单项、错误提示可读
- [ ] 表单：`label`/`aria-label`、`aria-required`、onBlur 校验、提交反馈
- [ ] 焦点顺序、键盘可操作、`prefers-reduced-motion`
- [ ] 375 / 768 / 1024 / 1440 无横向滚动；列表、表单、详情、模态弹窗不溢出
- [ ] 列表**具备筛选或等效控件**；加载态为 skeleton 或 spinner
- [ ] 联系方式图标：有值则点亮，无值则灰色/禁用
- [ ] 本地应用调用：检测应用是否安装，未安装时提示用户

---

## 七、与 main-business.md 的差异

**相同点：**
- 列表、表单、详情的基本设计原则与 19.3 一致
- 使用相同的 Token（`uipro-*`、`semantic-*`）
- 遵循相同的 Pre-Delivery Checklist

**差异点：**
- **模态弹窗设计：** 客户列表中的联系人管理使用模态弹窗（不在客户详情页显示）
- **联系方式图标：** 新增联系方式图标组件，支持快速创建互动记录和调用本地应用
- **智能推荐：** 互动记录中的联系人选择支持智能推荐（基于历史互动记录）
- **重要联系人标记：** 新增星标功能，用于标记重要联系人

---

## 八、回滚与存档

- **回滚单位：** Story 20.3（本批单独 PR）
- **截图/录屏：** 联系人列表、表单、详情、模态弹窗、互动记录集成 优化后 1–2 张（或短录屏），存 `docs/design-system/screenshots/` 或 `_bmad-output/epic-20-screenshots/`，命名如 `PersonManagementPage-after-<日期>.png`。
- **回滚步骤与「效果不好」定义：** 见 Story 20.6 产出。

---

## 九、参考资源

- **设计系统 MASTER：** `docs/design-system/MASTER.md`
- **主业务页面设计：** `docs/design-system/pages/main-business.md`
- **客户关联产品模态弹窗：** `fenghua-frontend/src/customers/components/CustomerAssociationManagementModal.tsx`
- **需求总结：** `_bmad-output/brainstorming/people-module-summary.md`
