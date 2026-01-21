# 批次三：登录、首页、导航与布局（19.4）

**Pro Max 依据：** [login-nav-layout-pro-max.md](./login-nav-layout-pro-max.md)  
**与 MASTER 关系：** 色板、字体、Avoid、Pre-Delivery 与 [MASTER.md](../MASTER.md) 一致；**不引入紫/粉**，优先 `uipro-*`、`semantic-*`。

---

## 1. 范围

| 类型 | 路径 / 组件 |
|------|-------------|
| 登录 | `auth/LoginPage.tsx` |
| 首页 | `App.tsx` 内 `HomePage` |
| 主导航 / 布局 | `components/layout/MainLayout.tsx`、`TopNavigation.tsx` |
| 路由与权限 | `auth/ProtectedRoute.tsx`、`auth/components/RoleProtectedRoute.tsx`（入口与跳转提示） |

**说明：** `TopNavigation` 若当前未嵌入 MainLayout，仍纳入本批规范，便于日后统一顶栏时复用。

---

## 2. 登录页（LoginPage）

### 2.1 布局与品牌

- 居中卡片：`max-w-md`，`uipro-bg` 或白底，与 MASTER 一致。
- 品牌区：Logo/首字可用 `uipro-primary` / `uipro-cta` 单色或浅底，**禁止** `from-primary-blue to-primary-purple` 等紫/粉渐变。
- 标题：`font-uipro-heading`、`text-uipro-text`；副标题 `text-uipro-secondary`。

### 2.2 表单

- **Label：** 每个 input 必须有 `<label for="id">` 或等效（已有则保留）；不可仅用 placeholder。
- **Input：** 边框、焦点、错误遵守 19.3 的 Input 规范：`focus:ring-uipro-cta/50`、`border-semantic-error` + `focus:ring-semantic-error/50`  when error。
- **显示/隐藏密码：** 按钮 `focus:ring-uipro-cta/50`，`cursor-pointer`，`transition-colors duration-200`；`aria-label` 保留。
- **提交按钮：** `!bg-uipro-cta hover:!bg-uipro-cta/90`，`cursor-pointer`，`transition-colors duration-200`；Loading 时禁用且可考虑 loading 态。
- **错误块：** 已有 `bg-semantic-error/20 border-semantic-error text-semantic-error`、`role="alert"` 可保留；若为 `/20` 可改为 `/10` 与 19.3 统一。

### 2.3 背景与动效

- **禁止：** `from-primary-purple`、`to-primary-purple` 等紫/粉渐变（MASTER Anti-pattern）。
- **允许：** `uipro-cta`、`uipro-primary`、`uipro-secondary` 的浅色/模糊装饰；若保留 `animate-pulse`，需兼顾 `prefers-reduced-motion`（本批可为后续优化）。

### 2.4 验证要点

- [ ] 375、768 下表单可操作、不溢出。
- [ ] Tab 顺序：邮箱 → 密码 → 显示/隐藏 → 登录。
- [ ] 错误提示 `role="alert"`，焦点在首错或概要处可接受。

---

## 3. 首页（HomePage）

### 3.1 欢迎区与快捷入口

- **头像/首字：** 不用 `from-primary-blue to-primary-purple`；改为 `uipro-cta` 或 `uipro-primary` 单色/浅底。
- **背景：** 禁止紫/粉渐变；可用 `uipro-bg`、`uipro-cta/5` 等。
- **图标：** **禁止 emoji**（👥、📦、🏷️、📥、📤 等）；改用 Heroicons / Lucide SVG，尺寸统一（如 24×24，`w-6 h-6`）。
- **链接/卡片：** `cursor-pointer`，hover 用 `text-uipro-cta` 或 `bg-uipro-cta/10`，`transition-colors duration-200`。

### 3.2 文案与层级

- 标题：`text-uipro-text`、`font-uipro-heading`。
- 次要：`text-uipro-secondary`。

---

## 4. 主导航与 MainLayout

### 4.1 侧边栏（MainLayout 内）

- **Logo/品牌：** 文字 `text-uipro-text` 或 `text-uipro-cta`；折叠态「峰」同理。
- **导航项：**
  - **禁止 emoji**（🏠、📊、🔗、👥、📦、👔、💬、⚙️）；改用 Heroicons / Lucide SVG，与文字对齐，`flex-shrink-0`。
  - **Active：** `bg-uipro-cta/10 text-uipro-cta` 或 `bg-uipro-cta/15 text-uipro-cta`；**禁止** `bg-blue-50 text-primary-blue`。
  - **默认 / Hover：** `text-uipro-secondary`、`hover:bg-monday-bg hover:text-uipro-text`；`cursor-pointer`，`transition-colors duration-200`。
- **用户头像：** 禁止 `from-primary-blue to-primary-purple`；改为 `uipro-cta` 或 `uipro-primary` 单色/浅底。
- **折叠按钮：** 图标用 SVG 替代 ☰、←；`cursor-pointer`，`aria-label`（展开/折叠侧边栏），`transition-colors duration-200`。
- **登出：** `cursor-pointer`，`transition-colors duration-200`；hover 可与导航项一致。

### 4.2 顶栏（TopNavigation，若使用）

- 与侧栏同则：Logo `text-uipro-text` / `text-uipro-cta`；用户区、登出不用紫/粉；`cursor-pointer`，`transition-colors duration-200`。
- **Sticky 时：** 内容区 `padding-top` ≥ 顶栏高度，避免遮挡（UX：Sticky Navigation）。

### 4.3 主内容区与详情面板

- **页面标题（title）：** `text-uipro-text`、`font-uipro-heading`。
- **内容区内边距、最大宽度：** 与现有 `px-monday-6`、`max-w-*` 协调；避免横向滚动（`max-w-full overflow-x-hidden` 在合适层级）。
- **详情面板关闭按钮：** ✕ 可保留为字符；`cursor-pointer`，`hover:bg-monday-bg`，`transition-colors duration-200`；`aria-label="关闭详情面板"`。

### 4.4 布局与响应式

- 侧栏折叠/展开：`transition-all duration-300` 已可；断点 375、768、1024、1440 无错位、无横向滚动。
- 若存在固定顶栏：遵守「Content padding」：为主内容加 `pt-{nav高度}` 或等效，不被顶栏遮挡。

---

## 5. ProtectedRoute / RoleProtectedRoute

- 跳转登录时保留 `from`，以便登录后回跳；无权限时提示清晰即可（若已有「无权限」页/态，本批可不改逻辑，仅做可访问性检查）。
- 若有「无权限」提示：用 `text-semantic-error` 或 `bg-semantic-error/10`，不用 `primary-red`。

---

## 6. Token 与实现注意

- **小步优化：** 先间距、字体、按钮/链接色、去 emoji/去紫；再考虑大改（如登录背景重构）。
- **色：** 一律 `uipro-*`、`semantic-*`；禁止 `primary-purple`、`primary-blue` 与 `primary-purple` 的渐变。
- **图标：** 全用 SVG（Heroicons/Lucide），尺寸统一，无 emoji。

---

## 7. Pre-delivery 自查（本批）

- [ ] 登录、首页、侧栏、TopNavigation（若用）：无 emoji 图标，无紫/粉渐变。
- [ ] 所有可点击：`cursor-pointer`；hover 有反馈；过渡 150–300ms。
- [ ] 登录：Input 有 label；焦点 ring 可见；错误 `role="alert"`。
- [ ] 固定顶栏（若有）：内容区不被遮挡。
- [ ] 375、768、1024、1440 无横向滚动；焦点顺序合理。

---

## 8. 与 MASTER 的差异

- **无结构性差异：** 色板、Avoid、Pre-Delivery 与 MASTER 一致。
- **本批特别强调：** 登录/首页/导航中**禁止** `primary-purple` 及紫/粉渐变；**全部 emoji 图标改为 SVG**。
