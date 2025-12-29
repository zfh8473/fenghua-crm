# 组件库文档

本文档描述了 fenghua-crm 设计系统中的核心 UI 组件。所有组件都使用 Linear + Data-Dense Minimalism 设计风格，并遵循设计 Token 系统。

## 概述

### 组件库介绍

核心 UI 组件库提供了四个基础组件：
- **Button** - 按钮组件
- **Input** - 输入框组件
- **Card** - 卡片组件
- **Table** - 表格组件

这些组件是构建应用界面的基础，所有组件都：
- 使用设计 Token 确保视觉一致性
- 支持响应式设计
- 包含完整的可访问性支持
- 提供 TypeScript 类型定义

### 使用方式

#### 导入组件

```typescript
// 组件导入
import { Button, Input, Card, Table } from '../components/ui';

// 类型导入（如果需要扩展组件）
import type { ButtonProps, InputProps, CardProps, TableProps } from '../components/ui';
```

#### 基础使用

```tsx
import { Button } from '../components/ui';

function MyComponent() {
  return (
    <Button onClick={() => console.log('clicked')}>
      点击我
    </Button>
  );
}
```

---

## Button 组件

### 概述

Button 组件是一个多功能的按钮组件，支持多种变体、尺寸和状态。参考 `fenghua-frontend/src/components/ui/Button.tsx` 中的 JSDoc 注释和 `ButtonProps` 接口。

### Props 接口

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';  // 默认: 'primary'
  size?: 'sm' | 'md' | 'lg';  // 默认: 'md'
  isLoading?: boolean;  // 默认: false
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### 变体说明

| 变体 | 描述 | 使用场景 |
|------|------|---------|
| `primary` | 主要按钮，使用渐变背景 | 主要操作（提交、确认） |
| `secondary` | 次要按钮，蓝色边框 | 次要操作（取消、返回） |
| `outline` | 轮廓按钮，灰色边框 | 中性操作 |
| `ghost` | 幽灵按钮，无边框 | 链接样式、文本按钮 |

### 尺寸说明

| 尺寸 | 描述 | 使用场景 |
|------|------|---------|
| `sm` | 小尺寸 | 紧凑布局、表格操作 |
| `md` | 中等尺寸（默认） | 标准按钮 |
| `lg` | 大尺寸 | 重要操作、CTA 按钮 |

### 使用示例

#### 基础用法

```tsx
import { Button } from '../components/ui';

function Example() {
  return (
    <div className="space-y-linear-4">
      <Button variant="primary">主要按钮</Button>
      <Button variant="secondary">次要按钮</Button>
      <Button variant="outline">轮廓按钮</Button>
      <Button variant="ghost">幽灵按钮</Button>
    </div>
  );
}
```

#### 不同尺寸

```tsx
<div className="flex items-center gap-linear-2">
  <Button size="sm">小按钮</Button>
  <Button size="md">中等按钮</Button>
  <Button size="lg">大按钮</Button>
</div>
```

#### 带图标

```tsx
<Button
  variant="primary"
  leftIcon={<svg>...</svg>}
  rightIcon={<svg>...</svg>}
>
  带图标的按钮
</Button>
```

#### 加载状态

```tsx
<Button isLoading={true}>
  加载中...
</Button>
```

#### 禁用状态

```tsx
<Button disabled>
  禁用按钮
</Button>
```

### 可访问性

- 自动添加 `aria-disabled` 属性
- 支持 `aria-label` 属性
- 键盘导航支持（Tab, Enter, Space）
- 焦点样式（focus ring）

### 最佳实践

1. **主要操作使用 primary 变体**
   ```tsx
   <Button variant="primary" onClick={handleSubmit}>
     提交
   </Button>
   ```

2. **次要操作使用 secondary 或 outline 变体**
   ```tsx
   <Button variant="secondary" onClick={handleCancel}>
     取消
   </Button>
   ```

3. **链接样式使用 ghost 变体**
   ```tsx
   <Button variant="ghost" onClick={handleViewDetails}>
     查看详情
   </Button>
   ```

4. **重要操作使用大尺寸**
   ```tsx
   <Button variant="primary" size="lg" onClick={handleConfirm}>
     确认操作
   </Button>
   ```

---

## Input 组件

### 概述

Input 组件是一个样式化的输入框组件，支持标签、错误消息、帮助文本和图标。参考 `fenghua-frontend/src/components/ui/Input.tsx` 中的 JSDoc 注释和 `InputProps` 接口。

### Props 接口

```typescript
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';  // 默认: 'md'
  error?: boolean;  // 默认: false
  errorMessage?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### 变体说明

Input 组件没有变体，但支持不同的状态：
- **正常状态** - 默认样式
- **错误状态** - 红色边框和错误消息
- **禁用状态** - 灰色背景，不可交互

### 尺寸说明

| 尺寸 | 描述 | 使用场景 |
|------|------|---------|
| `sm` | 小尺寸 | 紧凑表单、表格内输入 |
| `md` | 中等尺寸（默认） | 标准表单 |
| `lg` | 大尺寸 | 重要输入、搜索框 |

### 使用示例

#### 基础用法

```tsx
import { Input } from '../components/ui';

function Example() {
  const [value, setValue] = useState('');
  
  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="请输入"
    />
  );
}
```

#### 带标签

```tsx
<Input
  label="邮箱地址"
  type="email"
  placeholder="name@example.com"
/>
```

#### 错误状态

```tsx
<Input
  label="密码"
  type="password"
  error={true}
  errorMessage="密码长度不能少于6个字符"
/>
```

#### 帮助文本

```tsx
<Input
  label="用户名"
  helperText="用户名只能包含字母、数字和下划线"
/>
```

#### 带图标

```tsx
<Input
  label="搜索"
  leftIcon={<SearchIcon />}
  placeholder="搜索..."
/>

<Input
  label="密码"
  type="password"
  rightIcon={<EyeIcon />}
/>
```

#### 不同尺寸

```tsx
<div className="space-y-linear-4">
  <Input size="sm" placeholder="小输入框" />
  <Input size="md" placeholder="中等输入框" />
  <Input size="lg" placeholder="大输入框" />
</div>
```

### 可访问性

- 自动关联 `label` 和 `input`（使用 `htmlFor` 和 `id`）
- 错误消息使用 `role="alert"`
- 支持 `aria-invalid` 和 `aria-describedby`
- 键盘导航支持（Tab, Enter）

### 最佳实践

1. **始终使用 label**
   ```tsx
   <Input label="邮箱" type="email" />
   ```

2. **提供错误消息**
   ```tsx
   <Input
     error={hasError}
     errorMessage={errorMessage}
   />
   ```

3. **使用帮助文本提供额外信息**
   ```tsx
   <Input
     label="密码"
     type="password"
     helperText="密码长度至少8个字符"
   />
   ```

---

## Card 组件

### 概述

Card 组件是一个卡片容器组件，支持玻璃态效果、多种变体和悬停效果。参考 `fenghua-frontend/src/components/ui/Card.tsx` 中的 JSDoc 注释和 `CardProps` 接口。

### Props 接口

```typescript
interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'default' | 'elevated' | 'outlined';  // 默认: 'default'
  title?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;  // 默认: false
}
```

### 变体说明

| 变体 | 描述 | 使用场景 |
|------|------|---------|
| `default` | 标准卡片，中等阴影 | 一般内容容器 |
| `elevated` | 提升卡片，强阴影 | 重要内容、模态框 |
| `outlined` | 轮廓卡片，边框强调 | 可交互卡片 |

### 使用示例

#### 基础用法

```tsx
import { Card } from '../components/ui';

function Example() {
  return (
    <Card>
      <p>卡片内容</p>
    </Card>
  );
}
```

#### 带标题

```tsx
<Card title="卡片标题">
  <p>卡片内容</p>
</Card>
```

#### 带页脚

```tsx
<Card
  title="卡片标题"
  footer={<Button>操作</Button>}
>
  <p>卡片内容</p>
</Card>
```

#### 可悬停

```tsx
<Card hoverable onClick={handleClick}>
  <p>可点击的卡片</p>
</Card>
```

#### 不同变体

```tsx
<div className="grid grid-cols-3 gap-linear-4">
  <Card variant="default" title="标准卡片">
    内容
  </Card>
  <Card variant="elevated" title="提升卡片">
    内容
  </Card>
  <Card variant="outlined" title="轮廓卡片">
    内容
  </Card>
</div>
```

### 可访问性

- 有标题时自动添加 `role="article"`
- 支持 `aria-label` 属性
- 可悬停卡片支持键盘导航

### 最佳实践

1. **使用 Card 包装相关内容**
   ```tsx
   <Card title="用户信息">
     <div className="space-y-linear-2">
       <p>姓名：张三</p>
       <p>邮箱：zhangsan@example.com</p>
     </div>
   </Card>
   ```

2. **使用 elevated 变体突出重要内容**
   ```tsx
   <Card variant="elevated" title="重要通知">
     重要内容
   </Card>
   ```

3. **使用 hoverable 创建可交互卡片**
   ```tsx
   <Card hoverable onClick={handleCardClick}>
     可点击的卡片
   </Card>
   ```

---

## Table 组件

### 概述

Table 组件是一个数据密集的表格组件，支持排序、行点击和键盘导航。参考 `fenghua-frontend/src/components/ui/Table.tsx` 中的 JSDoc 注释和 `TableProps` 接口。

### Props 接口

```typescript
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  sortable?: boolean;  // 默认: false
  rowKey?: keyof T | ((row: T) => string);
  className?: string;
  'aria-label'?: string;
}

interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}
```

### 使用示例

#### 基础用法

```tsx
import { Table, Column } from '../components/ui';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

function Example() {
  const columns: Column<UserData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: '姓名' },
    { key: 'email', header: '邮箱' },
    { key: 'role', header: '角色' },
  ];

  const data: UserData[] = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'Admin' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: 'User' },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      aria-label="用户列表"
    />
  );
}
```

#### 可排序

```tsx
const columns: Column<UserData>[] = [
  { key: 'name', header: '姓名', sortable: true },
  { key: 'email', header: '邮箱', sortable: true },
  { key: 'role', header: '角色' },
];

<Table
  columns={columns}
  data={data}
  sortable={true}
  aria-label="可排序用户列表"
/>
```

#### 行点击

```tsx
<Table
  columns={columns}
  data={data}
  onRowClick={(row) => console.log('点击行:', row)}
  aria-label="可点击用户列表"
/>
```

#### 自定义渲染

```tsx
const columns: Column<UserData>[] = [
  { key: 'name', header: '姓名' },
  {
    key: 'role',
    header: '角色',
    render: (value) => (
      <span className="font-semibold text-primary-blue">
        {value}
      </span>
    ),
  },
];
```

#### 空状态

```tsx
<Table
  columns={columns}
  data={[]}
  aria-label="空用户列表"
/>
// 自动显示 "No data available"
```

### 可访问性

- 使用 `role="table"` 和 `aria-label`
- 表头使用 `scope="col"`
- 排序状态使用 `aria-sort`
- 可点击行支持键盘导航（Tab, Enter）

### 最佳实践

1. **始终提供 aria-label**
   ```tsx
   <Table columns={columns} data={data} aria-label="用户列表" />
   ```

2. **使用 rowKey 提供唯一标识**
   ```tsx
   <Table
     columns={columns}
     data={data}
     rowKey="id"
   />
   ```

3. **使用自定义渲染格式化数据**
   ```tsx
   {
     key: 'createdAt',
     header: '创建时间',
     render: (value) => new Date(value).toLocaleDateString('zh-CN'),
   }
   ```

---

## 组件组合示例

### Card + Table

```tsx
<Card title="用户列表">
  <Table
    columns={columns}
    data={data}
    aria-label="用户列表"
  />
</Card>
```

### Card + Input + Button

```tsx
<Card title="登录">
  <form className="space-y-linear-4">
    <Input
      label="邮箱"
      type="email"
      placeholder="name@example.com"
    />
    <Input
      label="密码"
      type="password"
    />
    <Button variant="primary" type="submit" className="w-full">
      登录
    </Button>
  </form>
</Card>
```

### 表单组合

```tsx
<Card title="创建用户">
  <form className="space-y-linear-4">
    <Input label="姓名" />
    <Input label="邮箱" type="email" />
    <Input label="密码" type="password" />
    <div className="flex justify-end gap-linear-2">
      <Button variant="outline" type="button">
        取消
      </Button>
      <Button variant="primary" type="submit">
        创建
      </Button>
    </div>
  </form>
</Card>
```

---

## 常见错误和解决方案

### 错误 1: 导入路径错误

❌ **错误：**
```tsx
import { Button } from './components/Button';
```

✅ **正确：**
```tsx
import { Button } from '../components/ui';
```

### 错误 2: 忘记传递必需的 props

❌ **错误：**
```tsx
<Table data={data} />
// 缺少 columns
```

✅ **正确：**
```tsx
<Table columns={columns} data={data} aria-label="表格" />
```

### 错误 3: 类型不匹配

❌ **错误：**
```tsx
<Button variant="custom" />
// 'custom' 不是有效的 variant
```

✅ **正确：**
```tsx
<Button variant="primary" />
```

### 错误 4: 缺少可访问性属性

❌ **错误：**
```tsx
<Table columns={columns} data={data} />
// 缺少 aria-label
```

✅ **正确：**
```tsx
<Table
  columns={columns}
  data={data}
  aria-label="用户列表"
/>
```

---

## 参考资源

- **组件源代码：** `fenghua-frontend/src/components/ui/`
- **组件使用示例：** `fenghua-frontend/src/components/TestTailwind.tsx`
- **设计 Token 文档：** [design-tokens.md](./design-tokens.md)

