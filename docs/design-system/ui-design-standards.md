# UI 设计标准

本文档定义了峰华CRM系统的UI设计统一标准，基于Monday.com风格，确保整个应用的视觉一致性和用户体验。

**最后更新：** 2025-01-03  
**版本：** 1.3.0

---

## 设计风格概述

### Monday.com 风格
- **浅色背景**：`#F4F5F8` 主背景，`#FFFFFF` 卡片背景
- **圆润字体**：使用 Nunito、Poppins、Quicksand 等圆润字体，提升友好度
- **彩色标签**：使用蓝色、紫色、绿色、红色等彩色标签
- **卡片式设计**：主要元素采用卡片样式，带有圆角和阴影

---

## 1. 字体系统

### 1.1 字体族

**优先级顺序：**
1. Nunito（主要圆润字体）
2. Poppins（备选圆润字体）
3. Quicksand（备选圆润字体）
4. SF Pro Rounded（系统圆润字体）
5. PingFang SC、Hiragino Sans GB（中文字体）

**配置位置：**
- `fenghua-frontend/src/styles/theme.ts`
- `fenghua-frontend/src/index.css`
- `fenghua-frontend/index.html` (Google Fonts 链接)

### 1.2 字体大小和粗细层次

#### 表单字段标签层次

| 字段重要性 | 字体大小 | 字体粗细 | 使用场景 | 示例 |
|-----------|---------|---------|---------|------|
| 最重要 | `text-monday-sm` | `font-semibold` | 产品名称、HS编码、产品类别 | 产品名称 |
| 重要 | `text-monday-sm` | `font-semibold` | HS编码、产品类别 | HS编码 |
| 次要 | `text-monday-sm` | `font-medium` | 产品状态、产品描述、产品规格 | 产品状态 |
| 最次要 | `text-monday-sm` | `font-normal` | 产品图片URL | 产品图片URL |

#### 输入框内容字体

- **输入值**：`font-normal`（不加粗）
- **占位符**：`text-monday-text-placeholder`

#### 菜单项字体

- **左侧导航菜单**：`text-monday-sm font-medium`（统一，不加粗）
- **下拉列表选项**：`font-semibold`（加粗，提升可读性）

### 1.3 字体使用规范

```tsx
// ✅ 正确：表单标签使用层次化字体
<label className="text-monday-sm font-semibold text-monday-text">
  产品名称
</label>

// ✅ 正确：输入框内容不加粗
<Input className="font-normal" />

// ❌ 错误：所有标签使用相同字体粗细
<label className="text-monday-sm font-bold">所有标签</label>
```

---

## 2. 按钮设计规范

### 2.1 按钮文本

**原则：简洁明了，避免冗长**

| 按钮类型 | 推荐文本 | 不推荐 |
|---------|---------|--------|
| 主要操作 | "创建"、"更新"、"保存" | "创建新产品"、"更新产品信息" |
| 次要操作 | "取消"、"返回" | "取消操作"、"返回上一页" |
| 危险操作 | "删除"、"确认删除" | "删除此项目" |

### 2.2 按钮样式

#### 主要按钮（Primary）
```tsx
<Button variant="primary">
  创建
</Button>
```
- 蓝色背景：`bg-primary-blue`
- 白色文字
- 悬停效果：`hover:bg-primary-blue-hover`
- 阴影：`shadow-monday-md`

#### 取消按钮（Outline）
```tsx
<Button 
  variant="outline"
  className="bg-gray-50 hover:bg-gray-100 border-gray-300 text-monday-text"
>
  取消
</Button>
```
- 浅灰色背景：`bg-gray-50`
- 悬停效果：`hover:bg-gray-100`
- 灰色边框：`border-gray-300`

#### 次要按钮（Secondary）
```tsx
<Button variant="secondary">
  编辑
</Button>
```
- 透明背景，蓝色边框和文字
- 悬停效果：`hover:bg-primary-blue/10`

#### 危险按钮（Ghost + 红色）
```tsx
<Button 
  variant="ghost"
  className="text-primary-red hover:text-primary-red hover:bg-primary-red/10 border border-transparent hover:border-primary-red/20"
>
  删除
</Button>
```

### 2.3 按钮大小一致性

**原则：同一操作栏的按钮应保持相同大小**

- 使用相同的 `size` prop（通常为 `md`）
- 文本长度相近，避免视觉不平衡
- 必要时使用固定宽度：`min-w-[100px]`

---

## 3. 表单设计规范

### 3.1 表单字段布局

**两列布局（桌面端）：**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
  <Input label="产品名称" />
  <Input label="HS编码" />
</div>
```

**单列布局（移动端）：**
- 自动响应式：`grid-cols-1 md:grid-cols-2`

### 3.2 下拉列表设计

#### 类别/状态下拉列表
```tsx
<select className="w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-semibold">
  <option value="">所有类别</option>
  {/* 选项 */}
</select>
```
- **字体**：`font-semibold`（加粗，提升可读性）
- **边框**：`border-gray-200`
- **聚焦效果**：`focus:ring-2 focus:ring-primary-blue`
- **背景**：`bg-monday-surface`（浅色背景，符合Monday.com风格）
- **内边距**：`p-monday-3 px-monday-4`

#### 系统设置表单下拉列表
```tsx
<div className="flex flex-col gap-monday-2">
  <label htmlFor="backupFrequency" className="text-monday-sm font-semibold text-monday-text">
    备份频率
  </label>
  <select
    id="backupFrequency"
    className="w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-semibold"
  >
    <option value={BackupFrequency.DAILY}>每日</option>
    <option value={BackupFrequency.WEEKLY}>每周</option>
    <option value={BackupFrequency.MONTHLY}>每月</option>
  </select>
  <span className="text-monday-xs text-monday-text-placeholder">
    用于配置系统自动备份的频率
  </span>
</div>
```
- **标签**：使用 `font-semibold`（与表单字段标签层次一致）
- **帮助文本**：使用 `text-monday-xs text-monday-text-placeholder`

#### 产品状态选择器（单选按钮）
- 使用 `ProductStatusSelector` 组件
- 三个选项并排：`grid grid-cols-3`
- 颜色编码：
  - 活跃：绿色 `bg-primary-green`
  - 已停用：红色 `bg-primary-red`
  - 已归档：灰色 `bg-gray-400`
- **不显示图标**，仅保留文字和单选按钮圆圈

### 3.3 输入框设计

- **标签**：根据重要性使用不同字体粗细
- **输入值**：`font-normal`（不加粗）
- **错误提示**：红色文字，显示在输入框下方
- **帮助文本**：灰色小字，显示在输入框下方

#### 系统设置表单输入框
```tsx
<div className="flex flex-col gap-monday-2">
  <label htmlFor="dataRetentionDays" className="text-monday-sm font-semibold text-monday-text">
    数据保留天数（默认 2555 天/7年，符合财务记录要求）
  </label>
  <Input
    id="dataRetentionDays"
    label=""
    type="number"
    className="font-normal"
  />
  <span className="text-monday-xs text-monday-text-placeholder">
    用于配置业务数据的保留期限，超过保留期的数据将被自动清理
  </span>
</div>
```
- **标签**：使用 `font-semibold`（重要字段）
- **输入框**：`className="font-normal"`（输入值不加粗）
- **帮助文本**：使用 `text-monday-xs text-monday-text-placeholder`

---

## 4. 菜单设计规范

### 4.1 左侧导航菜单

**字体：**
- 统一使用：`text-monday-sm font-medium`
- 不加粗，保持一致性

**样式：**
- 卡片式设计：`bg-monday-surface rounded-monday-lg shadow-monday-md border border-gray-200`
- 选中状态：`bg-blue-50 text-primary-blue`
- 悬停效果：`hover:bg-monday-bg`

### 4.2 下拉菜单选项

- **字体**：`font-semibold`（加粗）
- **背景**：`bg-monday-surface`
- **边框**：`border-gray-200`

---

## 5. 颜色使用规范

### 5.1 主色调

| 颜色 | 用途 | Tailwind 类名 |
|------|------|--------------|
| 蓝色 | 主要操作、链接、选中状态 | `primary-blue`, `bg-primary-blue` |
| 紫色 | 次要操作、标签 | `primary-purple`, `bg-primary-purple` |
| 绿色 | 成功状态、活跃状态 | `primary-green`, `bg-primary-green` |
| 红色 | 错误、危险操作、已停用 | `primary-red`, `bg-primary-red` |

### 5.2 背景色

| 背景类型 | 颜色 | Tailwind 类名 |
|---------|------|--------------|
| 页面背景 | `#F4F5F8` | `monday-bg` |
| 卡片背景 | `#FFFFFF` | `monday-surface` |
| 悬停背景 | 浅灰色 | `monday-bg` |
| 取消按钮背景 | `#F9FAFB` | `bg-gray-50` |

### 5.3 文本颜色

| 文本类型 | 颜色 | Tailwind 类名 |
|---------|------|--------------|
| 主要文本 | `#323338` | `monday-text` |
| 次要文本 | `#6D7175` | `monday-text-secondary` |
| 占位符文本 | `#9CA3AF` | `monday-text-placeholder` |

---

## 6. 间距和布局规范

### 6.1 卡片间距

- **卡片之间**：`gap-monday-4` 或 `gap-monday-6`
- **卡片内边距**：`p-monday-4` 或 `p-monday-6`

### 6.2 表单间距

- **字段之间**：`gap-monday-6`（两列布局）
- **标签和输入框**：`gap-monday-2`
- **操作按钮区域**：`pt-monday-6 border-t border-gray-200`

### 6.3 按钮间距

- **按钮之间**：`gap-monday-3`

---

## 7. 响应式设计规范

### 7.1 设计原则

**移动端优先（Mobile First）：**
- 先设计移动端体验，再逐步增强桌面端功能
- 确保核心功能在所有设备上可用
- 小屏幕上隐藏装饰性元素，保留核心功能

**触摸友好：**
- 移动端交互元素最小尺寸：44x44px（iOS HIG标准）
- 点击目标之间至少8px间距
- 避免过小的链接和按钮

### 7.2 断点系统

**Tailwind CSS 标准断点：**

| 断点 | 屏幕宽度 | 使用场景 | Tailwind类名 |
|------|---------|---------|-------------|
| sm | ≥640px | 大手机（横屏） | `sm:` |
| md | ≥768px | 平板 | `md:` |
| lg | ≥1024px | 小桌面 | `lg:` |
| xl | ≥1280px | 大桌面 | `xl:` |
| 2xl | ≥1536px | 超大屏 | `2xl:` |

**使用示例：**
```tsx
// 响应式网格布局
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
  {/* 移动端：1列，平板：2列，桌面：3列 */}
</div>

// 响应式文本大小
<h1 className="text-monday-xl md:text-monday-2xl lg:text-monday-3xl">
  标题
</h1>

// 响应式显示/隐藏
<aside className="hidden md:block w-60">
  {/* 移动端隐藏，平板及以上显示 */}
</aside>
```

### 7.3 常见响应式模式

#### 网格布局响应式

```tsx
// 卡片网格：移动端单列，平板双列，桌面三列
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
  {items.map((item) => (
    <Card key={item.id}>{/* 内容 */}</Card>
  ))}
</div>

// 表单布局：移动端单列，桌面双列
<div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
  <Input label="字段1" />
  <Input label="字段2" />
</div>
```

#### 侧边栏响应式

```tsx
// 移动端：侧边栏隐藏或折叠
// 桌面端：侧边栏显示
<aside className="hidden lg:block w-60">
  {/* 侧边栏内容 */}
</aside>

// 或使用抽屉式侧边栏（移动端）
<aside className="lg:block fixed lg:static inset-y-0 left-0 z-50">
  {/* 侧边栏内容 */}
</aside>
```

#### 表格响应式

```tsx
// 小屏幕上表格横向滚动
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px]">
    {/* 表格内容 */}
  </table>
</div>

// 或移动端转换为卡片布局
<div className="block md:hidden">
  {/* 移动端卡片布局 */}
</div>
<div className="hidden md:block">
  {/* 桌面端表格布局 */}
</div>
```

#### 导航响应式

```tsx
// 移动端：汉堡菜单
// 桌面端：水平导航
<nav className="flex flex-col md:flex-row gap-monday-4">
  {/* 导航项 */}
</nav>
```

### 7.4 触摸交互规范

**最小触摸目标尺寸：**
- **按钮**：最小 44x44px（移动端）
- **链接**：最小 44x44px（移动端）
- **图标按钮**：最小 48x48px（推荐）

**触摸目标间距：**
- 相邻触摸目标之间至少 8px 间距
- 避免过于密集的交互元素

**手势支持：**
- 考虑移动端常见手势：滑动、长按、双击
- 提供明确的手势反馈
- 避免与浏览器默认手势冲突

### 7.5 响应式图片

```tsx
// 使用响应式图片
<img
  src="image.jpg"
  srcSet="image-small.jpg 640w, image-medium.jpg 1024w, image-large.jpg 1920w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="描述"
  className="w-full h-auto"
/>

// 或使用Tailwind响应式类
<img
  src="image.jpg"
  alt="描述"
  className="w-full md:w-1/2 lg:w-1/3 h-auto"
/>
```

### 7.6 响应式测试检查清单

- [ ] 在移动端（375px-414px）测试所有页面
- [ ] 在平板（768px-1024px）测试所有页面
- [ ] 验证所有交互元素在触摸设备上可用
- [ ] 检查文本在小屏幕上的可读性
- [ ] 验证表格和长列表的滚动体验
- [ ] 测试侧边栏和导航的响应式行为
- [ ] 检查图片和媒体的响应式加载

---

## 8. 无障碍性（Accessibility）规范

### 8.1 设计原则

**WCAG 2.1 AA级别要求：**
- 所有设计决策应符合WCAG 2.1 AA级别标准
- 确保所有用户（包括残障用户）都能使用系统
- 不仅是法律合规，更是提升整体用户体验

**核心原则：**
- **可感知**：信息必须对所有用户可感知
- **可操作**：界面组件必须可操作
- **可理解**：信息和操作必须可理解
- **健壮性**：内容必须足够健壮，能被各种辅助技术解释

### 8.2 颜色对比度

**WCAG对比度要求：**

| 元素类型 | WCAG级别 | 对比度要求 | 检查工具 |
|---------|---------|-----------|---------|
| 正文文本（<18pt） | AA | ≥4.5:1 | WebAIM Contrast Checker |
| 大文本（≥18pt或≥14pt粗体） | AA | ≥3:1 | WebAIM Contrast Checker |
| UI组件和图形 | AA | ≥3:1 | WebAIM Contrast Checker |
| 非文本内容 | AA | ≥3:1 | WebAIM Contrast Checker |

**当前颜色对比度测试结果：**

| 文本颜色 | 背景颜色 | 对比度 | WCAG AA | 状态 | 备注 |
|---------|---------|--------|---------|------|------|
| `#323338` (text-monday-text) | `#FFFFFF` (monday-surface) | 12.6:1 | ✅ 通过 | 优秀 | 符合AAA标准 |
| `#6D7175` (text-monday-text-secondary) | `#FFFFFF` (monday-surface) | 4.8:1 | ✅ 通过 | 合格 | 符合AA标准 |
| `#9CA3AF` (text-monday-text-placeholder) | `#FFFFFF` (monday-surface) | 2.9:1 | ❌ 未通过 | **需修复** | 建议调整为 `#6B7280` |
| `#FFFFFF` (white) | `#0073EA` (primary-blue) | 4.5:1 | ✅ 通过 | 合格 | 符合AA标准 |
| `#FFFFFF` (white) | `#00C875` (primary-green) | 2.9:1 | ❌ 未通过 | **需修复** | 建议调整为 `#00A862` |
| `#FFFFFF` (white) | `#FF3838` (primary-red) | 4.3:1 | ✅ 通过 | 合格 | 符合AA标准 |
| `#FFFFFF` (white) | `#F5A623` (warning) | 2.1:1 | ❌ 未通过 | **需修复** | 建议调整为 `#D97706` |

**需要立即修复的颜色：**
1. **占位符文本** (`#9CA3AF`) → 建议调整为 `#6B7280`（对比度 4.6:1）
2. **成功状态绿色** (`#00C875`) → 建议调整为 `#00A862`（对比度 4.5:1）
3. **警告状态橙色** (`#F5A623`) → 建议调整为 `#D97706`（对比度 4.8:1）

**详细审计报告：** 参见 `docs/design-system/color-contrast-audit.md`

**注意：** 当前检测到的无障碍性问题可以通过运行 `npm run lint` 查看。主要问题包括：
- 表单标签未关联控件（需要使用 `htmlFor` 和 `id`）
- 缺少键盘事件处理（`onClick` 需要配合 `onKeyDown`）
- 缺少ARIA属性

**颜色使用规范：**
- **不要仅依赖颜色传达信息**：使用颜色+图标、颜色+文字等方式
- **提供替代方案**：为色盲用户提供其他视觉提示
- **错误状态**：使用颜色+图标+文字组合

```tsx
// ✅ 正确：颜色+图标+文字
<div className="flex items-center gap-monday-2 text-primary-red">
  <span>⚠️</span>
  <span>错误：请输入有效的邮箱地址</span>
</div>

// ❌ 错误：仅依赖颜色
<div className="text-primary-red">错误</div>
```

### 8.3 键盘导航

**所有交互元素必须支持键盘导航：**

```tsx
// ✅ 正确：按钮支持键盘
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
>
  按钮
</button>

// ✅ 正确：链接支持键盘
<a
  href="/path"
  className="focus:outline-none focus:ring-2 focus:ring-primary-blue"
>
  链接
</a>

// ❌ 错误：div模拟按钮且无键盘支持
<div onClick={handleClick}>点击</div>
```

**焦点管理规范：**
- **焦点顺序**：逻辑顺序（从上到下，从左到右）
- **焦点可见性**：所有可聚焦元素必须有明显的焦点指示器
- **跳过隐藏元素**：使用 `hidden` 或 `aria-hidden="true"` 跳过不可见元素
- **模态框焦点锁定**：模态框打开时，焦点应锁定在模态框内

**焦点样式：**
```tsx
// 标准焦点样式
className="focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"

// 对于按钮和链接
className="focus:outline-none focus:ring-2 focus:ring-primary-blue"
```

### 8.4 屏幕阅读器支持

**ARIA标签使用：**

```tsx
// 图标按钮必须有aria-label
<button aria-label="关闭对话框">
  <span aria-hidden="true">×</span>
</button>

// 表单标签关联
<label htmlFor="product-name" className="...">
  产品名称
</label>
<Input 
  id="product-name" 
  aria-required="true"
  aria-describedby="product-name-help"
/>

// 错误消息关联
<Input 
  id="email"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
{hasError && (
  <span id="email-error" role="alert" className="...">
    {errorMessage}
  </span>
)}

// 加载状态
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? '加载中...' : '内容'}
</div>
```

**语义化HTML：**

```tsx
// ✅ 正确：使用语义化标签
<nav aria-label="主导航">
  <ul>
    <li><a href="/">首页</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>标题</h1>
    <p>内容</p>
  </article>
</main>

// ❌ 错误：使用div模拟语义元素
<div className="nav">
  <div className="nav-item">首页</div>
</div>
```

**ARIA角色使用：**

| 场景 | ARIA角色 | 示例 |
|------|---------|------|
| 错误消息 | `role="alert"` | `<span role="alert">错误信息</span>` |
| 加载状态 | `aria-live="polite"` | `<div aria-live="polite">加载中</div>` |
| 按钮组 | `role="group"` | `<div role="group" aria-label="操作按钮">` |
| 对话框 | `role="dialog"` | `<div role="dialog" aria-labelledby="dialog-title">` |

### 8.5 表单无障碍性

**完整的表单示例：**

```tsx
<div className="flex flex-col gap-monday-2">
  <label 
    htmlFor="email" 
    className="text-monday-sm font-semibold text-monday-text"
  >
    邮箱地址
    <span className="text-primary-red" aria-label="必填">*</span>
  </label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={handleChange}
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : "email-help"}
    className="font-normal"
  />
  {hasError ? (
    <span 
      id="email-error" 
      role="alert" 
      className="text-monday-sm text-primary-red"
    >
      {errorMessage}
    </span>
  ) : (
    <span 
      id="email-help" 
      className="text-monday-xs text-monday-text-placeholder"
    >
      请输入有效的邮箱地址
    </span>
  )}
</div>
```

**表单验证：**
- 实时验证时使用 `aria-live="polite"`
- 错误消息使用 `role="alert"`
- 必填字段使用 `aria-required="true"`
- 无效输入使用 `aria-invalid="true"`

### 8.6 图片和媒体

```tsx
// ✅ 正确：所有图片都有alt文本
<img 
  src="product.jpg" 
  alt="峰华CRM系统产品管理界面截图"
/>

// 装饰性图片
<img 
  src="decoration.svg" 
  alt=""
  aria-hidden="true"
/>

// 图标作为内容
<span role="img" aria-label="成功">
  ✅
</span>
```

### 8.7 无障碍性测试检查清单

**开发时检查：**
- [ ] 使用键盘（Tab键）可以访问所有交互元素
- [ ] 所有图片都有有意义的alt文本
- [ ] 所有表单字段都有关联的label
- [ ] 错误消息有 `role="alert"`
- [ ] 颜色对比度符合WCAG AA标准
- [ ] 焦点状态清晰可见
- [ ] 语义化HTML标签使用正确

**工具检查：**
- [ ] 使用浏览器开发者工具检查ARIA属性
- [ ] 使用 axe DevTools 或 Lighthouse 进行自动化检查
- [ ] 使用屏幕阅读器（NVDA/VoiceOver）测试
- [ ] 使用颜色对比度检查工具验证所有颜色组合

**手动测试：**
- [ ] 仅使用键盘完成所有主要任务
- [ ] 使用屏幕阅读器浏览整个应用
- [ ] 在高对比度模式下测试
- [ ] 放大到200%测试可读性

### 8.8 无障碍性工具和资源

**开发工具：**
- **ESLint插件**：`eslint-plugin-jsx-a11y`（已安装并配置）
  - 配置文件：`fenghua-frontend/.eslintrc.cjs`
  - 运行检查：`npm run lint`
- **浏览器扩展**：axe DevTools, WAVE
- **对比度检查**：WebAIM Contrast Checker
- **屏幕阅读器**：NVDA (Windows), VoiceOver (Mac)

**测试工具：**
- **自动化测试**：pa11y, lighthouse-ci
- **CI/CD集成**：在CI流程中添加无障碍性检查

**ESLint配置说明：**
项目已配置 `eslint-plugin-jsx-a11y`，包含以下关键规则：
- `jsx-a11y/alt-text`: 要求图片有alt文本
- `jsx-a11y/label-has-associated-control`: 要求label关联表单控件
- `jsx-a11y/aria-props`: 检查ARIA属性
- `jsx-a11y/role-has-required-aria-props`: 检查ARIA角色完整性
- 更多规则见 `.eslintrc.cjs` 配置文件

---

## 9. 系统页面设计规范

### 7.1 系统页面统一布局

**所有系统页面必须遵循以下规范：**

1. **使用 MainLayout 组件**
   ```tsx
   import { MainLayout } from '../components/layout';
   
   <MainLayout title="页面标题">
     {/* 页面内容 */}
   </MainLayout>
   ```

2. **错误消息样式**
   ```tsx
   {error && (
     <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md" role="alert">
       {error}
     </div>
   )}
   ```

3. **成功消息样式**
   ```tsx
   {successMessage && (
     <div className="bg-primary-green/20 border border-primary-green text-primary-green p-monday-4 rounded-monday-md" role="alert">
       {successMessage}
     </div>
   )}
   ```

4. **内容卡片包装**
   ```tsx
   <Card variant="default" className="w-full">
     {/* 页面主要内容 */}
   </Card>
   ```

### 7.2 系统功能卡片网格

**使用场景：** 系统设置页面的"系统功能"标签页

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
  {systemMenuItems.map((item) => (
    <Link key={item.path} to={item.path} className="group block">
      <Card 
        variant="default" 
        hoverable 
        className="p-monday-5 h-full transition-all duration-200 hover:shadow-monday-md border border-gray-200 hover:border-primary-blue/30"
      >
        <div className="flex items-start gap-monday-4">
          <div className="text-monday-3xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-monday-base font-semibold text-monday-text mb-monday-1 group-hover:text-primary-blue transition-colors tracking-tight">
              {item.label}
            </h3>
            <p className="text-monday-sm text-monday-text-secondary font-normal">
              {item.description}
            </p>
          </div>
          <div className="text-monday-text-secondary group-hover:text-primary-blue transition-colors flex-shrink-0 text-monday-lg">
            →
          </div>
        </div>
      </Card>
    </Link>
  ))}
</div>
```

**规范：**
- **网格布局**：`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **卡片间距**：`gap-monday-4`
- **悬停效果**：图标放大、边框变色、阴影增强
- **文字截断**：标题使用 `truncate`，容器使用 `min-w-0`

### 7.3 健康状态面板

**使用场景：** 系统监控页面的健康状态显示

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
  <div className="p-monday-4 bg-monday-surface rounded-monday-md border border-gray-200">
    <div className="text-monday-sm text-monday-text-secondary mb-monday-2 font-medium">数据库状态</div>
    <div className={`text-monday-lg font-semibold ${status === 'connected' ? 'text-primary-green' : 'text-primary-red'}`}>
      {status === 'connected' ? '正常' : '异常'}
    </div>
  </div>
</div>
```

**规范：**
- **卡片样式**：`bg-monday-surface`，`border border-gray-200`
- **状态颜色**：正常 `text-primary-green`，异常 `text-primary-red`
- **标签字体**：`text-monday-sm font-medium`
- **值字体**：`text-monday-lg font-semibold`

---

## 10. 组件使用规范

### 8.1 产品状态选择器

**使用场景：** 产品编辑/创建表单中的状态选择

```tsx
import { ProductStatusSelector } from '../components/ProductStatusSelector';

<ProductStatusSelector
  value={formData.status}
  onChange={(status) => handleChange('status', status)}
  error={errors.status}
/>
```

**特点：**
- 三个选项并排显示
- 颜色编码（绿色/红色/灰色）
- 不显示图标，仅文字和单选按钮

### 8.2 HS编码选择器

**使用场景：** 产品创建/编辑表单中的HS编码输入

```tsx
import { HsCodeSelect } from '../../components/ui/HsCodeSelect';

<HsCodeSelect
  value={formData.hsCode}
  onChange={handleHsCodeChange}
  onSelect={(category) => {
    // 自动填充类别
  }}
  categories={categories}
  error={!!errors.hsCode}
  errorMessage={errors.hsCode}
/>
```

**特点：**
- 可搜索下拉列表
- 自动与产品类别联动
- **不显示类别标签**（已移除）

---

## 11. 常见设计模式

### 8.1 表单操作栏

```tsx
<div className="flex justify-end gap-monday-3 pt-monday-6 border-t border-gray-200">
  <Button 
    type="button" 
    variant="outline"
    className="bg-gray-50 hover:bg-gray-100 border-gray-300 text-monday-text"
  >
    取消
  </Button>
  <Button type="submit" variant="primary">
    更新
  </Button>
</div>
```

### 8.2 工具栏卡片

```tsx
<Card variant="default" className="w-full p-monday-4">
  <div className="flex items-center gap-monday-3 flex-nowrap">
    {/* 搜索、筛选、按钮 */}
  </div>
</Card>
```

### 8.3 标签页按钮（Tab Buttons）

**使用场景：** 系统设置页面的"系统功能"和"系统配置"标签页

```tsx
<button
  onClick={() => setActiveTab('overview')}
  className={`px-monday-4 py-monday-2 text-monday-sm font-semibold rounded-monday-md transition-all ${
    activeTab === 'overview'
      ? 'bg-primary-blue text-white shadow-monday-sm'
      : 'bg-monday-bg text-monday-text-secondary hover:bg-gray-200'
  }`}
>
  系统功能
</button>
```

**规范：**
- **垂直内边距**：`py-monday-2`（标准大小）
- **水平内边距**：`px-monday-4`
- **字体**：`text-monday-sm font-semibold`
- **选中状态**：蓝色背景 `bg-primary-blue`，白色文字，阴影 `shadow-monday-sm`
- **未选中状态**：浅灰色背景 `bg-monday-bg`，灰色文字，悬停效果 `hover:bg-gray-200`

### 8.4 功能卡片网格（Quick Access Cards）

**使用场景：** 首页快速访问模块、系统功能概览

```tsx
<Link to={item.path} className="group block">
  <Card 
    variant="default" 
    hoverable 
    className="p-monday-5 h-full transition-all duration-200 hover:shadow-monday-md border border-gray-200 hover:border-primary-blue/30"
  >
    <div className="flex items-center gap-monday-4">
      <div className="text-monday-3xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-monday-base font-semibold text-monday-text mb-monday-1 group-hover:text-primary-blue transition-colors tracking-tight truncate">
          {item.label}
        </h3>
        <p className="text-monday-sm text-monday-text-secondary font-normal">
          {item.description}
        </p>
      </div>
      <div className="text-monday-text-secondary group-hover:text-primary-blue transition-colors flex-shrink-0 text-monday-lg">
        →
      </div>
    </div>
  </Card>
</Link>
```

**规范：**
- **卡片样式**：`border border-gray-200`，悬停时 `hover:border-primary-blue/30`
- **悬停效果**：`hover:shadow-monday-md`，图标放大 `group-hover:scale-110`
- **图标动画**：`transition-transform duration-200`
- **文字截断**：标题使用 `truncate`，容器使用 `min-w-0` 防止溢出
- **字体大小**：标题 `text-monday-base`，描述 `text-monday-sm`
- **布局**：使用 `flex` 布局，图标和箭头使用 `flex-shrink-0`

### 8.5 系统页面布局

**使用场景：** 所有系统相关页面（系统设置、系统监控、系统日志等）

```tsx
import { MainLayout } from '../components/layout';

<MainLayout title="系统监控">
  <div className="space-y-monday-6">
    {/* 错误消息 */}
    {error && (
      <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md" role="alert">
        {error}
      </div>
    )}
    {/* 内容卡片 */}
    <Card variant="default" className="w-full">
      {/* 页面内容 */}
    </Card>
  </div>
</MainLayout>
```

**规范：**
- **统一使用 MainLayout**：所有系统页面必须使用 `MainLayout` 组件
- **页面标题**：通过 `title` prop 传递给 `MainLayout`
- **标题区域样式**：`bg-monday-surface p-monday-4 shadow-monday-sm rounded-monday-lg border border-gray-200 mb-monday-6`
- **内容间距**：使用 `space-y-monday-6`（统一卡片间距）
- **错误消息样式**：`bg-primary-red/20 border border-primary-red text-primary-red`
- **卡片包装**：主要内容使用 `Card` 组件包装

### 8.6 筛选器卡片设计

**使用场景：** 日志页面、列表页面的筛选器区域

#### 水平布局（标签和控件在同一行）

```tsx
<Card variant="default" className="w-full p-monday-5">
  <div className="flex items-center gap-monday-6 flex-nowrap">
    <div className="flex items-center gap-monday-3 min-w-0 flex-1">
      <label className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
        <span>🔍</span>
        <span>错误类型</span>
      </label>
      <select className="flex-1 min-w-0 py-monday-2 px-monday-3 text-monday-sm text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-normal hover:border-gray-300">
        {/* 选项 */}
      </select>
    </div>
    {/* 更多筛选器字段 */}
  </div>
</Card>
```

**规范：**
- **布局**：标签和控件在同一行，使用 `flex items-center`
- **标签字体**：`text-monday-base font-semibold`（比控件稍大）
- **控件字体**：`text-monday-sm font-normal`（下拉框值不加粗）
- **控件内边距**：`py-monday-2 px-monday-3`（紧凑尺寸）
- **字段间距**：`gap-monday-6`（字段之间）
- **标签与控件间距**：`gap-monday-3`
- **图标**：标签前可添加图标（如 🔍、📅），图标与文字间距 `gap-monday-1.5`
- **响应式**：使用 `flex-1 min-w-0` 和 `flex-shrink-0` 处理溢出

### 8.7 日志列表卡片设计

**使用场景：** 错误日志、系统日志、审计日志等列表页面

```tsx
<Card variant="default" className="w-full p-monday-6">
  <h2 className="text-monday-2xl font-bold text-monday-text mb-monday-6 tracking-tight">错误日志列表</h2>
  
  {/* 日志项 */}
  <div className="space-y-monday-3 mb-monday-6">
    {logs.map((log, index) => (
      <div key={index} className="p-monday-5 border border-gray-200 rounded-monday-lg bg-monday-surface hover:border-gray-300 hover:shadow-monday-sm transition-all duration-200">
        {/* 日志内容 */}
      </div>
    ))}
  </div>

  {/* 分页 */}
  {pagination.totalPages > 0 && (
    <div className="flex justify-center items-center gap-monday-4 pt-monday-6 border-t border-gray-200">
      {/* 分页按钮 */}
    </div>
  )}
</Card>
```

**规范：**
- **卡片内边距**：`p-monday-6`
- **列表标题**：`text-monday-2xl font-bold mb-monday-6`
- **日志项间距**：`space-y-monday-3`
- **日志项样式**：`p-monday-5 border border-gray-200 rounded-monday-lg hover:border-gray-300 hover:shadow-monday-sm`
- **分页区域**：使用 `border-t border-gray-200` 分隔，`pt-monday-6` 上边距
- **空状态**：显示图标和提示文字

---

## 12. 设计原则总结

1. **一致性**：相同类型的元素使用相同的样式
2. **层次感**：通过字体粗细和大小建立视觉层次
3. **简洁性**：按钮文本简洁，避免冗长
4. **友好性**：使用圆润字体，提升用户体验
5. **可读性**：重要信息使用加粗字体
6. **响应式**：移动端优先，所有布局支持各种屏幕尺寸
7. **无障碍性**：符合WCAG 2.1 AA标准，确保所有用户都能使用系统
8. **可访问性**：支持键盘导航和屏幕阅读器，颜色对比度达标

---

## 13. 更新日志

### 2025-01-03 (v1.3.0) - 当前版本
- **响应式设计规范**（新增章节7）：
  - 移动端优先设计原则
  - Tailwind CSS断点系统定义
  - 常见响应式模式（网格、侧边栏、表格、导航）
  - 触摸交互规范（最小尺寸、间距、手势）
  - 响应式图片处理
  - 响应式测试检查清单
- **无障碍性规范**（新增章节8）：
  - WCAG 2.1 AA级别要求
  - 颜色对比度标准和使用规范
  - 键盘导航规范和焦点管理
  - 屏幕阅读器支持（ARIA标签、语义化HTML）
  - 表单无障碍性完整示例
  - 图片和媒体的无障碍性处理
  - 无障碍性测试检查清单和工具推荐

### 2025-01-03 (v1.2.0)
- **标题区域样式规范**：
  - 标题区域使用圆角和边框：`rounded-monday-lg border border-gray-200`
  - 标题区域与内容间距：`mb-monday-6`
- **筛选器卡片设计规范**：
  - 水平布局：标签和控件在同一行
  - 标签字体：`text-monday-base font-semibold`
  - 控件字体：`text-monday-sm font-normal`（下拉框值不加粗）
  - 控件尺寸：`py-monday-2 px-monday-3`（紧凑）
  - 字段间距：`gap-monday-6`
  - 图标使用：标签前可添加图标，间距 `gap-monday-1.5`
- **日志列表卡片设计规范**：
  - 卡片内边距：`p-monday-6`
  - 列表标题样式：`text-monday-2xl font-bold mb-monday-6`
  - 日志项样式：带悬停效果，圆角 `rounded-monday-lg`
  - 分页区域：使用分隔线和上边距
- **卡片间距统一**：
  - 系统页面内容间距：统一使用 `space-y-monday-6`

### 2025-01-02 (v1.1.0)
- **系统页面设计规范**：新增系统页面统一布局规范
  - 所有系统页面使用 `MainLayout` 组件
  - 统一错误和成功消息样式
  - 系统功能卡片网格设计规范
  - 健康状态面板设计规范
- **表单设计增强**：
  - 系统设置表单下拉列表样式规范
  - 系统设置表单输入框样式规范
  - 帮助文本使用 `text-monday-xs text-monday-text-placeholder`
- **标签页按钮规范**：
  - 标准大小：`py-monday-2`
  - 选中和未选中状态样式
- **功能卡片网格规范**：
  - 悬停效果（图标放大、边框变色、阴影增强）
  - 文字截断处理
  - 响应式网格布局

### 2025-12-29 (v1.0.0)
- 初始版本创建
- 定义字体系统规范（圆润字体、层次化）
- 定义按钮设计规范（文本简洁、样式统一）
- 定义表单设计规范（标签层次、输入框字体）
- 定义菜单设计规范（统一字体、不加粗）
- 定义颜色使用规范
- 定义组件使用规范（产品状态选择器、HS编码选择器）

---

## 参考资源

- **设计Token定义**：`fenghua-frontend/src/styles/theme.ts`
- **全局样式**：`fenghua-frontend/src/index.css`
- **组件库**：`fenghua-frontend/src/components/ui/`
- **设计系统文档**：`docs/design-system/`

---

## 贡献指南

当需要添加新的UI设计标准时：

1. 在本文档中添加新的章节
2. 提供代码示例和使用场景
3. 更新"更新日志"
4. 确保与现有标准保持一致

