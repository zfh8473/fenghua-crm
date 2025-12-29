# 布局指南

本文档描述了 fenghua-crm 设计系统中的布局模式和响应式设计原则。

## 概述

### 布局原则

- **数据密集**：最大化信息展示，减少不必要的留白
- **层次清晰**：使用间距和阴影创建清晰的视觉层次
- **响应式优先**：所有布局都支持移动端、平板和桌面
- **一致性**：使用设计 Token 确保布局的一致性

### 响应式设计

设计系统使用 Tailwind CSS 的响应式断点：

| 断点 | 宽度 | 设备类型 | 使用场景 |
|------|------|---------|---------|
| `sm` | `640px` | 移动端（大屏） | 手机横屏、小平板 |
| `md` | `768px` | 平板 | iPad、平板电脑 |
| `lg` | `1024px` | 桌面（小） | 笔记本电脑 |
| `xl` | `1280px` | 桌面（大） | 台式机、大屏显示器 |

---

## 页面布局模式

### 全宽布局

全宽布局适用于登录页、仪表板等需要充分利用屏幕空间的页面。

```tsx
<div className="min-h-screen bg-linear-dark">
  {/* 页面内容 */}
</div>
```

**使用场景：**
- 登录页
- 仪表板
- 全屏应用

### 容器布局

容器布局限制内容宽度，提供更好的阅读体验。

```tsx
<div className="min-h-screen bg-linear-dark">
  <div className="max-w-7xl mx-auto p-linear-8">
    {/* 页面内容 */}
  </div>
</div>
```

**使用场景：**
- 内容页面
- 表单页面
- 列表页面

### 卡片布局

卡片布局使用 Card 组件包装内容，创建清晰的视觉分组。

```tsx
<div className="min-h-screen bg-linear-dark p-linear-8">
  <Card title="页面标题">
    {/* 页面内容 */}
  </Card>
</div>
```

**使用场景：**
- 设置页面
- 详情页面
- 表单页面

---

## 三栏布局

三栏布局适用于需要同时显示侧边栏、主内容和详情面板的复杂应用。

### 布局结构

```tsx
<div className="flex h-screen bg-linear-dark">
  {/* 侧边栏 */}
  <aside className="w-64 fixed left-0 top-0 h-screen bg-linear-surface border-r border-linear-surface-alt">
    {/* 侧边栏内容 */}
  </aside>

  {/* 主内容 */}
  <main className="ml-64 flex-1 overflow-y-auto p-linear-8">
    {/* 主内容 */}
  </main>

  {/* 详情面板（可选） */}
  <aside className="w-80 fixed right-0 top-0 h-screen bg-linear-surface border-l border-linear-surface-alt">
    {/* 详情面板内容 */}
  </aside>
</div>
```

### 响应式适配

在移动端，侧边栏和详情面板应该隐藏或转换为抽屉式菜单。

```tsx
<div className="flex h-screen bg-linear-dark">
  {/* 移动端隐藏侧边栏 */}
  <aside className="hidden lg:block w-64 fixed left-0 top-0 h-screen bg-linear-surface">
    {/* 侧边栏内容 */}
  </aside>

  {/* 主内容 */}
  <main className="lg:ml-64 flex-1 overflow-y-auto p-linear-4 lg:p-linear-8">
    {/* 主内容 */}
  </main>

  {/* 移动端隐藏详情面板 */}
  <aside className="hidden xl:block w-80 fixed right-0 top-0 h-screen bg-linear-surface">
    {/* 详情面板内容 */}
  </aside>
</div>
```

---

## 响应式设计

### 响应式类名

使用 Tailwind CSS 的响应式前缀创建响应式布局：

```tsx
// 移动端单列，桌面多列
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-linear-4">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
  <Card>卡片 3</Card>
</div>

// 响应式间距
<div className="p-linear-4 md:p-linear-6 lg:p-linear-8">
  响应式内边距
</div>

// 响应式字体
<h1 className="text-linear-3xl md:text-linear-4xl lg:text-linear-5xl">
  响应式标题
</h1>
```

### 移动端适配

#### 导航栏

```tsx
{/* 桌面端显示完整导航 */}
<nav className="hidden md:flex gap-linear-4">
  <Link to="/">首页</Link>
  <Link to="/products">产品</Link>
  <Link to="/customers">客户</Link>
</nav>

{/* 移动端显示汉堡菜单 */}
<button className="md:hidden" onClick={toggleMenu}>
  <MenuIcon />
</button>
```

#### 表格

```tsx
{/* 桌面端显示完整表格 */}
<div className="hidden md:block">
  <Table columns={columns} data={data} />
</div>

{/* 移动端显示卡片列表 */}
<div className="md:hidden space-y-linear-4">
  {data.map((item) => (
    <Card key={item.id}>
      {/* 卡片内容 */}
    </Card>
  ))}
</div>
```

---

## 间距和留白

### 页面边距

使用 `p-linear-8` (32px) 作为标准页面边距：

```tsx
<div className="min-h-screen bg-linear-dark p-linear-8">
  {/* 页面内容 */}
</div>
```

### 组件间距

使用 `gap-linear-4` (16px) 作为标准组件间距：

```tsx
<div className="flex gap-linear-4">
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</div>
```

### 卡片内边距

使用 `p-linear-6` (24px) 作为标准卡片内边距：

```tsx
<Card className="p-linear-6">
  {/* 卡片内容 */}
</Card>
```

### 垂直间距

使用 `space-y-linear-4` 创建垂直间距：

```tsx
<div className="space-y-linear-4">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
  <Card>卡片 3</Card>
</div>
```

---

## 网格系统

### 基础网格

使用 Tailwind CSS 的 Grid 系统创建响应式网格：

```tsx
{/* 2 列网格 */}
<div className="grid grid-cols-2 gap-linear-4">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
</div>

{/* 3 列网格 */}
<div className="grid grid-cols-3 gap-linear-4">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
  <Card>卡片 3</Card>
</div>
```

### 响应式网格

```tsx
{/* 移动端 1 列，平板 2 列，桌面 3 列 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-linear-4">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
  <Card>卡片 3</Card>
</div>
```

### 不均匀网格

```tsx
{/* 主内容区域更大 */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-linear-4">
  <div className="lg:col-span-2">
    <Card>主内容（占 2/3）</Card>
  </div>
  <div>
    <Card>侧边栏（占 1/3）</Card>
  </div>
</div>
```

---

## 移动端适配指南

### 1. 触摸目标大小

确保所有交互元素至少 44x44px（移动端标准）：

```tsx
<Button size="lg" className="min-h-[44px]">
  移动端按钮
</Button>
```

### 2. 简化导航

移动端使用抽屉式菜单或底部导航：

```tsx
{/* 移动端底部导航 */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-linear-surface border-t border-linear-surface-alt">
  <div className="flex justify-around p-linear-4">
    <Link to="/">首页</Link>
    <Link to="/products">产品</Link>
    <Link to="/customers">客户</Link>
  </div>
</nav>
```

### 3. 优化表格

移动端将表格转换为卡片列表：

```tsx
{/* 桌面端表格 */}
<div className="hidden md:block">
  <Table columns={columns} data={data} />
</div>

{/* 移动端卡片 */}
<div className="md:hidden space-y-linear-4">
  {data.map((item) => (
    <Card key={item.id} hoverable onClick={() => handleClick(item)}>
      <div className="space-y-linear-2">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-linear-text-secondary">{item.email}</p>
      </div>
    </Card>
  ))}
</div>
```

### 4. 响应式字体

移动端使用较小的字体：

```tsx
<h1 className="text-linear-3xl md:text-linear-4xl lg:text-linear-5xl">
  响应式标题
</h1>
```

---

## 布局最佳实践

### 1. 使用设计 Token

始终使用设计 Token 而不是硬编码值：

❌ **错误：**
```tsx
<div className="p-[32px]">
```

✅ **正确：**
```tsx
<div className="p-linear-8">
```

### 2. 保持一致性

在整个应用中使用一致的布局模式：

```tsx
// 所有页面使用相同的容器布局
<div className="min-h-screen bg-linear-dark">
  <div className="max-w-7xl mx-auto p-linear-8">
    {/* 页面内容 */}
  </div>
</div>
```

### 3. 响应式优先

从移动端开始设计，然后扩展到桌面端：

```tsx
// 移动端优先
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### 4. 使用语义化 HTML

使用语义化的 HTML 元素：

```tsx
<main className="p-linear-8">
  <section className="mb-linear-8">
    <h1>章节标题</h1>
    {/* 内容 */}
  </section>
</main>
```

---

## 参考资源

- **设计 Token 文档：** [design-tokens.md](./design-tokens.md)
- **组件库文档：** [components.md](./components.md)
- **最佳实践文档：** [best-practices.md](./best-practices.md)

