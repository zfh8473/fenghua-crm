# 设计 Token 文档

本文档描述了 fenghua-crm 设计系统中使用的所有设计 Token。设计 Token 是设计系统的核心，确保整个应用的视觉一致性。

## 概述

### 什么是设计 Token？

设计 Token 是设计系统中可重用的设计决策的抽象表示。它们定义了颜色、间距、字体、阴影等视觉属性的值，确保整个应用保持一致的外观和感觉。

### 为什么使用设计 Token？

- **一致性**：确保整个应用的视觉元素保持一致
- **可维护性**：集中管理设计值，便于更新和维护
- **可扩展性**：支持主题切换和深色模式
- **开发效率**：通过 Tailwind CSS 类名快速使用

### 参考文件

所有 Token 值定义在 `fenghua-frontend/src/styles/theme.ts` 文件中。

---

## 颜色系统

### Linear 风格颜色

Linear 风格使用深色背景和浅色文本，营造现代、专业的视觉效果。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `linear-dark` | `#0a0a0a` | `bg-linear-dark`, `text-linear-dark` | 主背景色 |
| `linear-dark-alt` | `#1a1a1a` | `bg-linear-dark-alt` | 替代背景色 |
| `linear-surface` | `#242424` | `bg-linear-surface` | 卡片、面板背景 |
| `linear-surface-alt` | `#2a2a2a` | `bg-linear-surface-alt` | 悬停状态背景 |
| `linear-text` | `#ffffff` | `text-linear-text` | 主要文本颜色 |
| `linear-text-secondary` | `#e5e5e5` | `text-linear-text-secondary` | 次要文本颜色 |
| `linear-text-placeholder` | `#a0a0a0` | `text-linear-text-placeholder` | 占位符文本 |

#### 浅色模式文本颜色（兼容性）

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `linear-text-on-light` | `#1a1a1a` | `text-linear-text-on-light` | 浅色背景上的主要文本 |
| `linear-text-secondary-on-light` | `#4a4a4a` | `text-linear-text-secondary-on-light` | 浅色背景上的次要文本 |
| `linear-text-placeholder-on-light` | `#9a9a9a` | `text-linear-text-placeholder-on-light` | 浅色背景上的占位符文本 |

**代码示例：**

```tsx
// 深色背景
<div className="bg-linear-dark text-linear-text">
  <p>主要文本</p>
  <p className="text-linear-text-secondary">次要文本</p>
</div>

// 浅色背景（兼容性）
<div className="bg-white text-linear-text-on-light">
  <p>主要文本</p>
  <p className="text-linear-text-secondary-on-light">次要文本</p>
</div>
```

### 主色

主色用于强调重要元素和品牌标识。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `primary-blue` | `#2563EB` | `bg-primary-blue`, `text-primary-blue`, `border-primary-blue` | 主要操作按钮、链接、强调元素 |
| `primary-purple` | `#7C3AED` | `bg-primary-purple`, `text-primary-purple` | 次要操作、装饰元素 |
| `primary-info` | `#3B82F6` | `bg-primary-info`, `text-primary-info` | 信息提示 |

**代码示例：**

```tsx
<button className="bg-primary-blue text-white px-4 py-2 rounded-linear-md">
  主要操作
</button>

<a href="#" className="text-primary-blue hover:underline">
  链接文本
</a>
```

### 语义色

语义色用于传达状态和反馈信息。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `semantic-success` | `#10B981` | `bg-semantic-success`, `text-semantic-success`, `border-semantic-success` | 成功状态、确认消息 |
| `semantic-warning` | `#F59E0B` | `bg-semantic-warning`, `text-semantic-warning` | 警告状态、提醒消息 |
| `semantic-error` | `#EF4444` | `bg-semantic-error`, `text-semantic-error`, `border-semantic-error` | 错误状态、错误消息 |
| `semantic-info` | `#3B82F6` | `bg-semantic-info`, `text-semantic-info` | 信息提示 |

**代码示例：**

```tsx
// 成功消息
<div className="bg-semantic-success/20 text-semantic-success p-linear-4 rounded-linear-md">
  操作成功
</div>

// 错误消息
<div className="bg-semantic-error/20 text-semantic-error p-linear-4 rounded-linear-md">
  操作失败
</div>
```

---

## 间距系统

间距系统基于 4px 的倍数，提供一致的布局节奏。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `linear-0` | `0px` | `p-linear-0`, `m-linear-0`, `gap-linear-0` | 无间距 |
| `linear-1` | `4px` | `p-linear-1`, `m-linear-1`, `gap-linear-1` | 极小间距 |
| `linear-2` | `8px` | `p-linear-2`, `m-linear-2`, `gap-linear-2` | 小间距（图标与文本） |
| `linear-3` | `12px` | `p-linear-3`, `m-linear-3`, `gap-linear-3` | 中小间距 |
| `linear-4` | `16px` | `p-linear-4`, `m-linear-4`, `gap-linear-4` | 标准间距（组件间距） |
| `linear-5` | `20px` | `p-linear-5`, `m-linear-5`, `gap-linear-5` | 中间距 |
| `linear-6` | `24px` | `p-linear-6`, `m-linear-6`, `gap-linear-6` | 卡片内边距 |
| `linear-8` | `32px` | `p-linear-8`, `m-linear-8`, `gap-linear-8` | 页面边距、大间距 |
| `linear-10` | `40px` | `p-linear-10`, `m-linear-10`, `gap-linear-10` | 超大间距 |
| `linear-12` | `48px` | `p-linear-12`, `m-linear-12`, `gap-linear-12` | 页面区块间距 |
| `linear-14` | `56px` | `p-linear-14`, `m-linear-14`, `gap-linear-14` | 特大间距 |
| `linear-16` | `64px` | `p-linear-16`, `m-linear-16`, `gap-linear-16` | 最大间距 |

**代码示例：**

```tsx
// 页面布局
<div className="p-linear-8">
  <div className="space-y-linear-4">
    <Card className="p-linear-6">
      <p>卡片内容</p>
    </Card>
  </div>
</div>

// 组件间距
<div className="flex gap-linear-2">
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</div>
```

---

## 字体系统

### 字体族

使用 Inter 字体族，提供现代、清晰的阅读体验。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `font-sans` | `Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif` | `font-sans` | 所有文本（默认） |

**代码示例：**

```tsx
<p className="font-sans">使用 Inter 字体</p>
```

### 字号

字号系统提供从 12px 到 48px 的完整范围。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `linear-xs` | `12px` | `text-linear-xs` | 辅助文本、标签 |
| `linear-sm` | `14px` | `text-linear-sm` | 小文本、帮助文本 |
| `linear-base` | `16px` | `text-linear-base` | 正文（默认） |
| `linear-lg` | `18px` | `text-linear-lg` | 大正文 |
| `linear-xl` | `20px` | `text-linear-xl` | 小标题 |
| `linear-2xl` | `24px` | `text-linear-2xl` | 中标题 |
| `linear-3xl` | `30px` | `text-linear-3xl` | 大标题 |
| `linear-4xl` | `36px` | `text-linear-4xl` | 超大标题（H2） |
| `linear-5xl` | `48px` | `text-linear-5xl` | 最大标题（H1） |

**代码示例：**

```tsx
<h1 className="text-linear-5xl font-bold">页面标题</h1>
<h2 className="text-linear-4xl font-semibold">章节标题</h2>
<p className="text-linear-base">正文内容</p>
<p className="text-linear-sm text-linear-text-secondary">辅助文本</p>
```

### 字重

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `normal` | `400` | `font-normal` | 正文 |
| `medium` | `500` | `font-medium` | 强调文本 |
| `semibold` | `600` | `font-semibold` | 标题、重要文本 |
| `bold` | `700` | `font-bold` | 强调标题 |

**代码示例：**

```tsx
<p className="font-normal">正常文本</p>
<p className="font-semibold">重要文本</p>
<h1 className="font-bold">标题</h1>
```

### 行高

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `tight` | `1.25` | `leading-tight` | 标题 |
| `normal` | `1.5` | `leading-normal` | 正文（默认） |
| `relaxed` | `1.75` | `leading-relaxed` | 长文本、阅读内容 |

**代码示例：**

```tsx
<h1 className="leading-tight">紧凑标题</h1>
<p className="leading-normal">正常行高正文</p>
<article className="leading-relaxed">长文本内容</article>
```

---

## 阴影系统

阴影系统提供微妙的深度感，增强层次结构。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `linear-sm` | `0 1px 2px rgba(0, 0, 0, 0.1)` | `shadow-linear-sm` | 轻微阴影（按钮悬停） |
| `linear-md` | `0 4px 8px rgba(0, 0, 0, 0.15)` | `shadow-linear-md` | 标准阴影（卡片） |
| `linear-lg` | `0 10px 20px rgba(0, 0, 0, 0.2)` | `shadow-linear-lg` | 大阴影（模态框、提升卡片） |
| `linear-soft` | `0 2px 8px rgba(0, 0, 0, 0.08)` | `shadow-linear-soft` | 柔和阴影（输入框焦点） |

**代码示例：**

```tsx
<Card className="shadow-linear-md">标准卡片</Card>
<Card className="shadow-linear-lg">提升卡片</Card>
<Input className="focus:shadow-linear-soft" />
```

---

## 模糊系统

模糊系统用于创建玻璃态（glassmorphism）效果。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `linear-blur-sm` | `4px` | `backdrop-blur-linear-sm` | 轻微模糊 |
| `linear-blur-md` | `8px` | `backdrop-blur-linear-md` | 标准模糊（卡片） |
| `linear-blur-lg` | `12px` | `backdrop-blur-linear-lg` | 强模糊（模态框） |

**代码示例：**

```tsx
<Card className="backdrop-blur-linear-md bg-linear-surface/80">
  玻璃态卡片
</Card>
```

---

## 圆角系统

圆角系统提供一致的圆角样式。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `linear-sm` | `2px` | `rounded-linear-sm` | 小圆角（输入框） |
| `linear-md` | `4px` | `rounded-linear-md` | 标准圆角（按钮） |
| `linear-lg` | `6px` | `rounded-linear-lg` | 大圆角（卡片） |
| `linear-xl` | `8px` | `rounded-linear-xl` | 超大圆角 |
| `linear-2xl` | `12px` | `rounded-linear-2xl` | 特大圆角 |
| `linear-3xl` | `16px` | `rounded-linear-3xl` | 最大圆角 |
| `linear-full` | `9999px` | `rounded-linear-full` | 完全圆形（头像、徽章） |

**代码示例：**

```tsx
<Button className="rounded-linear-md">标准按钮</Button>
<Card className="rounded-linear-lg">卡片</Card>
<div className="rounded-linear-full w-10 h-10">圆形头像</div>
```

---

## 渐变系统

渐变系统用于创建视觉吸引力和品牌标识。

| Token 名称 | 值 | Tailwind 类名 | 使用场景 |
|-----------|-----|--------------|---------|
| `gradient-primary` | `linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)` | `bg-gradient-primary` | 主要按钮、品牌元素 |
| `gradient-dark` | `linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)` | `bg-gradient-dark` | 背景渐变 |
| `gradient-success` | `linear-gradient(135deg, #10B981 0%, #34D399 100%)` | `bg-gradient-success` | 成功状态 |
| `gradient-progress` | `linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)` | `bg-gradient-progress` | 进度条、加载状态 |

**代码示例：**

```tsx
<Button className="bg-gradient-primary text-white">
  渐变按钮
</Button>

<div className="bg-gradient-dark min-h-screen">
  渐变背景
</div>
```

---

## 深色模式

设计系统默认使用深色模式（Linear 风格）。所有颜色 Token 都针对深色背景进行了优化。

### 使用深色模式

深色模式通过 Tailwind CSS 的 `darkMode: 'class'` 配置启用。默认情况下，应用使用深色背景。

**代码示例：**

```tsx
// 默认深色模式
<div className="bg-linear-dark text-linear-text">
  深色背景内容
</div>

// 浅色模式兼容（如果需要）
<div className="bg-white text-linear-text-on-light">
  浅色背景内容
</div>
```

---

## Token 使用最佳实践

### 1. 始终使用 Token，不要硬编码值

❌ **错误：**
```tsx
<div style={{ backgroundColor: '#2563EB' }}>内容</div>
<div className="p-[16px]">内容</div>
```

✅ **正确：**
```tsx
<div className="bg-primary-blue">内容</div>
<div className="p-linear-4">内容</div>
```

### 2. 使用语义化的 Token 名称

❌ **错误：**
```tsx
<div className="bg-[#0a0a0a]">内容</div>
```

✅ **正确：**
```tsx
<div className="bg-linear-dark">内容</div>
```

### 3. 保持间距一致性

使用间距 Token 确保布局的一致性：

```tsx
// 页面布局
<div className="p-linear-8 space-y-linear-4">
  <Card className="p-linear-6">
    <div className="space-y-linear-2">
      <h2>标题</h2>
      <p>内容</p>
    </div>
  </Card>
</div>
```

### 4. 组合使用 Token

Token 可以组合使用以创建复杂的视觉效果：

```tsx
<Card className="bg-linear-surface/80 backdrop-blur-linear-md shadow-linear-md rounded-linear-lg p-linear-6">
  玻璃态卡片
</Card>
```

### 5. 响应式设计

结合响应式类名使用 Token：

```tsx
<div className="p-linear-4 md:p-linear-6 lg:p-linear-8">
  响应式间距
</div>
```

---

## 参考资源

- **Token 定义文件：** `fenghua-frontend/src/styles/theme.ts`
- **Tailwind 配置：** `fenghua-frontend/tailwind.config.ts`
- **组件使用示例：** `fenghua-frontend/src/components/TestTailwind.tsx`

