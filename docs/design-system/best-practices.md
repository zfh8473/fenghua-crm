# 最佳实践文档

本文档描述了使用 fenghua-crm 设计系统的最佳实践，帮助开发团队创建一致、可访问、高性能的用户界面。

## 概述

### 设计系统使用原则

1. **一致性优先**：始终使用设计 Token 和核心组件
2. **可访问性必需**：所有组件必须支持键盘导航和屏幕阅读器
3. **性能优化**：使用 Tailwind CSS 类名，避免内联样式
4. **响应式设计**：所有布局必须支持移动端、平板和桌面

---

## 组件选择指南

### 何时使用哪个组件？

#### Button vs Link

**使用 Button：**
- 执行操作（提交表单、删除、确认）
- 触发状态变化
- 打开模态框

```tsx
<Button variant="primary" onClick={handleSubmit}>
  提交
</Button>
```

**使用 Link（但应用 Button 样式）：**
- 页面导航
- 外部链接
- 路由跳转

```tsx
<Link to="/products" className="inline-flex items-center justify-center font-medium rounded-linear-md bg-gradient-primary text-white px-linear-4 py-linear-2">
  查看产品
</Link>
```

#### Input vs Select

**使用 Input：**
- 文本输入
- 数字输入
- 邮箱、密码等标准输入类型
- 搜索框

```tsx
<Input
  label="邮箱"
  type="email"
  placeholder="name@example.com"
/>
```

**使用 Select（未来实现）：**
- 从预定义选项中选择
- 下拉选择
- 多选

```tsx
// 未来实现
<Select
  label="角色"
  options={roleOptions}
/>
```

#### Card vs div

**使用 Card：**
- 内容容器
- 信息卡片
- 可交互卡片
- 需要玻璃态效果的内容

```tsx
<Card title="用户信息">
  <p>姓名：张三</p>
  <p>邮箱：zhangsan@example.com</p>
</Card>
```

**使用 div：**
- 简单布局容器
- 不需要视觉强调的内容
- 纯布局用途

```tsx
<div className="flex gap-linear-4">
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</div>
```

#### Table vs 列表

**使用 Table：**
- 结构化数据
- 需要排序的数据
- 需要列对齐的数据
- 数据密集的场景

```tsx
<Table
  columns={columns}
  data={data}
  sortable={true}
  aria-label="用户列表"
/>
```

**使用 ul/ol：**
- 简单列表
- 导航菜单
- 不需要表格结构的列表

```tsx
<ul className="space-y-linear-2">
  <li>项目 1</li>
  <li>项目 2</li>
  <li>项目 3</li>
</ul>
```

---

## 设计 Token 使用指南

### 何时使用哪个颜色？

#### 背景颜色

- **`bg-linear-dark`** - 页面主背景
- **`bg-linear-dark-alt`** - 替代背景（用于区分区域）
- **`bg-linear-surface`** - 卡片、面板背景
- **`bg-linear-surface-alt`** - 悬停状态背景

```tsx
<div className="bg-linear-dark">
  <Card className="bg-linear-surface">
    卡片内容
  </Card>
</div>
```

#### 文本颜色

- **`text-linear-text`** - 主要文本（深色背景上）
- **`text-linear-text-secondary`** - 次要文本
- **`text-linear-text-placeholder`** - 占位符文本
- **`text-primary-blue`** - 链接、强调文本

```tsx
<p className="text-linear-text">主要文本</p>
<p className="text-linear-text-secondary">次要文本</p>
<a href="#" className="text-primary-blue">链接</a>
```

#### 语义颜色

- **`semantic-success`** - 成功状态、确认消息
- **`semantic-warning`** - 警告状态、提醒消息
- **`semantic-error`** - 错误状态、错误消息
- **`semantic-info`** - 信息提示

```tsx
<div className="bg-semantic-success/20 text-semantic-success">
  操作成功
</div>
```

### 何时使用哪个间距？

- **`p-linear-8`** - 页面边距
- **`p-linear-6`** - 卡片内边距
- **`p-linear-4`** - 组件间距
- **`p-linear-2`** - 元素间距
- **`gap-linear-4`** - 组件之间的间距

```tsx
<div className="p-linear-8">
  <div className="space-y-linear-4">
    <Card className="p-linear-6">
      <div className="space-y-linear-2">
        <h2>标题</h2>
        <p>内容</p>
      </div>
    </Card>
  </div>
</div>
```

### 何时使用哪个字体大小？

- **`text-linear-5xl`** - H1 标题（48px）
- **`text-linear-4xl`** - H2 标题（36px）
- **`text-linear-3xl`** - H3 标题（30px）
- **`text-linear-base`** - 正文（16px，默认）
- **`text-linear-sm`** - 辅助文本（14px）
- **`text-linear-xs`** - 标签、小文本（12px）

```tsx
<h1 className="text-linear-5xl font-bold">页面标题</h1>
<h2 className="text-linear-4xl font-semibold">章节标题</h2>
<p className="text-linear-base">正文内容</p>
<p className="text-linear-sm text-linear-text-secondary">辅助文本</p>
```

---

## 可访问性最佳实践

### 1. 所有交互元素有 aria-label

```tsx
<Button aria-label="删除用户">
  <TrashIcon />
</Button>

<Table
  columns={columns}
  data={data}
  aria-label="用户列表"
/>
```

### 2. 所有表单有 label 和 error message

```tsx
<Input
  label="邮箱"
  type="email"
  error={hasError}
  errorMessage={errorMessage}
/>
```

### 3. 所有按钮有焦点样式

所有核心组件都内置了焦点样式（focus ring），无需额外配置。

```tsx
<Button>按钮（自动包含焦点样式）</Button>
```

### 4. 键盘导航支持

所有交互组件都支持键盘导航：
- **Tab** - 移动到下一个元素
- **Enter/Space** - 激活按钮或链接
- **Esc** - 关闭模态框（如果实现）

```tsx
<Table
  columns={columns}
  data={data}
  onRowClick={(row) => handleClick(row)}
  // 自动支持 Tab 和 Enter 键
/>
```

### 5. 颜色对比度

所有颜色 Token 都经过对比度测试，确保符合 WCAG AA 标准。

---

## 性能优化建议

### 1. 使用 Tailwind 类名（编译时优化）

Tailwind CSS 在构建时会移除未使用的类名，确保最终 CSS 文件最小。

❌ **错误：**
```tsx
<div style={{ padding: '32px', backgroundColor: '#0a0a0a' }}>
```

✅ **正确：**
```tsx
<div className="p-linear-8 bg-linear-dark">
```

### 2. 避免内联样式

内联样式无法被 Tailwind 优化，会增加运行时开销。

❌ **错误：**
```tsx
<div style={{ padding: '16px' }}>
```

✅ **正确：**
```tsx
<div className="p-linear-4">
```

### 3. 使用设计 Token（减少重复代码）

使用设计 Token 可以减少重复代码，提高可维护性。

❌ **错误：**
```tsx
<div className="p-[16px] m-[16px]">
```

✅ **正确：**
```tsx
<div className="p-linear-4 m-linear-4">
```

### 4. 组件复用

优先使用核心 UI 组件，而不是创建自定义组件。

❌ **错误：**
```tsx
function CustomButton() {
  return <button className="...">自定义按钮</button>;
}
```

✅ **正确：**
```tsx
import { Button } from '../components/ui';

<Button variant="primary">按钮</Button>
```

---

## 常见错误和避免方法

### 错误 1: 直接使用颜色值

❌ **错误：**
```tsx
<div style={{ backgroundColor: '#2563EB' }}>
<div className="bg-[#2563EB]">
```

✅ **正确：**
```tsx
<div className="bg-primary-blue">
```

**原因：** 硬编码颜色值会导致不一致，难以维护。

### 错误 2: 使用固定间距

❌ **错误：**
```tsx
<div style={{ padding: '16px' }}>
<div className="p-[16px]">
```

✅ **正确：**
```tsx
<div className="p-linear-4">
```

**原因：** 使用设计 Token 确保间距一致性。

### 错误 3: 创建自定义组件而不是使用核心组件

❌ **错误：**
```tsx
function MyButton() {
  return <button className="...">按钮</button>;
}
```

✅ **正确：**
```tsx
import { Button } from '../components/ui';

<Button variant="primary">按钮</Button>
```

**原因：** 核心组件已经过测试和优化，自定义组件可能导致不一致。

### 错误 4: 忽略可访问性

❌ **错误：**
```tsx
<button onClick={handleClick}>
  <Icon />
</button>
```

✅ **正确：**
```tsx
<Button onClick={handleClick} aria-label="删除">
  <Icon />
</Button>
```

**原因：** 可访问性是必需功能，不是可选项。

### 错误 5: 不使用响应式类名

❌ **错误：**
```tsx
<div className="grid grid-cols-3">
```

✅ **正确：**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**原因：** 移动端用户需要适配的界面。

---

## 实际案例和反例

### 案例 1: 表单布局

✅ **正确：**
```tsx
<Card title="创建用户">
  <form className="space-y-linear-4">
    <Input
      label="姓名"
      required
      error={errors.name}
      errorMessage={errors.name}
    />
    <Input
      label="邮箱"
      type="email"
      required
      error={errors.email}
      errorMessage={errors.email}
    />
    <div className="flex justify-end gap-linear-2">
      <Button variant="outline" type="button" onClick={handleCancel}>
        取消
      </Button>
      <Button variant="primary" type="submit">
        创建
      </Button>
    </div>
  </form>
</Card>
```

❌ **错误：**
```tsx
<div style={{ padding: '24px', backgroundColor: '#242424' }}>
  <h2 style={{ fontSize: '20px', fontWeight: '600' }}>创建用户</h2>
  <form>
    <input type="text" placeholder="姓名" />
    <input type="email" placeholder="邮箱" />
    <button>创建</button>
  </form>
</div>
```

### 案例 2: 数据列表

✅ **正确：**
```tsx
<Card title="用户列表">
  <Table
    columns={columns}
    data={users}
    sortable={true}
    onRowClick={(user) => navigate(`/users/${user.id}`)}
    aria-label="用户列表"
  />
</Card>
```

❌ **错误：**
```tsx
<div>
  <h2>用户列表</h2>
  <table>
    <thead>
      <tr>
        <th>姓名</th>
        <th>邮箱</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.email}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 参考资源

- **设计 Token 文档：** [design-tokens.md](./design-tokens.md)
- **组件库文档：** [components.md](./components.md)
- **布局指南：** [layout.md](./layout.md)

