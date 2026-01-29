# 互动记录详情页 — React 组件结构与数据流

## 一、组件树

```
InteractionDetailPage                    ← 页面容器，拉取 interaction / customer / person / creator / related
├── InteractionDetailHeader              ← 返回、标题行、元信息、操作按钮
├── <main> (grid 左 2/3 + 右 1/3)
│   ├── 左侧主内容 (lg:col-span-2)
│   │   ├── InteractionDetailOverview   ← 互动概览（类型/日期/状态/创建者/创建时间等）
│   │   ├── InteractionDetailCustomer   ← 客户信息 + 联系人
│   │   ├── InteractionDetailProducts   ← 关联产品（卡片列表）
│   │   ├── InteractionDetailContent    ← 互动内容（描述 + 可选 additionalInfo）
│   │   ├── InteractionDetailAttachments ← 附件列表
│   │   └── 评论区块 (CommentInput + CommentList，保留现有)
│   └── 右侧边栏
│       ├── InteractionDetailActivity   ← 活动历史（占位或创建/更新时间）
│       └── InteractionDetailRelated    ← 相关互动（同客户其他记录）
├── InteractionDetailFooter              ← 上一条 / 创建跟进 / 下一条
└── DeleteConfirmModal                   ← 删除确认（保留现有逻辑）
```

## 二、数据流

| 数据 | 来源 | 使用组件 |
|------|------|----------|
| `interaction` | `interactionsService.getInteraction(id)` | 全页面 |
| `customer` | `customersService.getCustomer(interaction.customerId)` | Header(标题), Customer, Related |
| `person` | `peopleService.getPerson(interaction.personId)` | Customer |
| `creator` | `getUserById(interaction.createdBy)` | Header, Overview |
| `relatedInteractions` | `searchInteractions({ customerId, limit: 5 })` 排除当前 id | Related |
| `interaction.products` | 已在 interaction 内 | Products |
| `interaction.attachments` | 已在 interaction 内 | Attachments |

- **Header**：`interaction`（类型、日期、状态、customerName）、`creator`（姓名）、`onEdit` / `onDelete` / `onCreateFollowUp`。
- **Overview**：`interaction`（类型、日期、状态、createdAt、updatedAt）、`creator`（姓名）。
- **Customer**：`customer`、`person`（可选）、链接到客户详情。
- **Products**：`interaction.products`；可选按 id 再请求产品详情（hsCode、category）。
- **Content**：`interaction.description`、`interaction.additionalInfo`。
- **Attachments**：`interaction.attachments`。
- **Activity**：占位或 `interaction.createdAt` / `interaction.updatedAt`。
- **Related**：`relatedInteractions`、`currentId`（用于排除与跳转）。
- **Footer**：`onCreateFollowUp`；可选 `prevId` / `nextId`（由上一条/下一条逻辑计算）。

## 三、Props 约定（子组件）

- **InteractionDetailHeader**  
  `interaction`, `customerName`, `creatorName?`, `onEdit`, `onDelete`, `onCreateFollowUp?`, `canDelete`

- **InteractionDetailOverview**  
  `interaction`, `creatorName?`, `formatDate`

- **InteractionDetailCustomer**  
  `customer`, `person?`, `customerLoading`, `personLoading`

- **InteractionDetailProducts**  
  `products` (ProductSummary[]), `legacyProductName?`（兼容旧数据）

- **InteractionDetailContent**  
  `description?`, `additionalInfo?`

- **InteractionDetailAttachments**  
  `attachments` (array)

- **InteractionDetailActivity**  
  `createdAt`, `updatedAt?`（占位时也可不传）

- **InteractionDetailRelated**  
  `interactions` (Interaction[]), `currentId`, `total?`

- **InteractionDetailFooter**  
  `onCreateFollowUp`, `customerId?`, `prevId?`, `nextId?`

## 四、路由与入口

- 路由不变：`/interactions/:id` → `InteractionDetailPage`。
- 创建跟进：`navigate(\`/interactions/create?customerId=${customerId}&personId=${personId}\`)`（若创建页支持 query）。

## 五、样式与设计 token

- 使用项目已有 Tailwind + design token：`primary-blue`、`uipro-cta`、`monday-*`、`semantic-*`。
- 示例中的 `primary-blue` 对应 `#0369A1` 或 `primary-blue` / `uipro-cta`。
- 卡片：`bg-white rounded-lg shadow-sm border border-gray-200 p-6`。
- 区块标题：`text-lg font-semibold text-gray-900` + 可选图标。

## 六、实现说明（已落地）

- **目录**：`fenghua-frontend/src/interactions/components/InteractionDetail/`
- **入口**：`InteractionDetailPage.tsx` 拉取 `interaction`、`customer`、`person`、`creator`、`relatedResult`，将数据下发给各子组件。
- **上一条/下一条**：由同客户相关互动列表（`searchInteractions` 按 `interactionDate` 降序）计算当前条前后 id，传入 `InteractionDetailFooter`。
- **创建跟进**：跳转 `/interactions/create?customerId=...&personId=...`，创建页需支持从 query 预填客户与联系人。
