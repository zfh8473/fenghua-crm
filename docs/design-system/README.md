# 设计系统文档

欢迎使用 fenghua-crm 设计系统文档。本文档提供了完整的设计系统指南，帮助开发团队创建一致、可访问、高性能的用户界面。

## 设计系统概述

### Linear + Data-Dense Minimalism

fenghua-crm 设计系统采用 **Linear + Data-Dense Minimalism** 风格，特点包括：

- **深色背景**：现代、专业的视觉效果
- **数据密集**：最大化信息展示，适合 CRM 系统
- **高信息密度**：在有限空间内展示更多信息
- **现代感**：玻璃态效果、微动效、渐变

### 设计原则

1. **一致性**：使用设计 Token 确保视觉一致性
2. **可访问性**：所有组件支持键盘导航和屏幕阅读器
3. **响应式**：支持移动端、平板和桌面
4. **性能**：使用 Tailwind CSS 编译时优化

---

## 快速开始

### 导入组件

```typescript
// 组件导入
import { Button, Input, Card, Table } from '../components/ui';

// 类型导入（如果需要扩展组件）
import type { ButtonProps, InputProps, CardProps, TableProps } from '../components/ui';
```

### 使用设计 Token

```tsx
// 使用 Tailwind 类名
<div className="bg-linear-dark text-linear-text p-linear-8">
  <Card className="p-linear-6">
    <Button variant="primary">按钮</Button>
  </Card>
</div>
```

### 基础示例

```tsx
import { Button, Input, Card } from '../components/ui';

function MyComponent() {
  return (
    <Card title="示例">
      <div className="space-y-linear-4">
        <Input label="邮箱" type="email" />
        <Button variant="primary">提交</Button>
      </div>
    </Card>
  );
}
```

---

## 文档导航

### 核心文档

1. **[UI 设计标准](./ui-design-standards.md)** ⭐ **推荐阅读**
   - 字体系统规范（圆润字体、层次化）
   - 按钮设计规范（文本简洁、样式统一）
   - 表单设计规范（标签层次、输入框字体）
   - 菜单设计规范
   - 颜色使用规范
   - 组件使用规范

2. **[设计 Token 文档](./design-tokens.md)**
   - 颜色系统
   - 间距系统
   - 字体系统
   - 阴影、模糊、圆角、渐变

3. **[组件库文档](./components.md)**
   - Button 组件
   - Input 组件
   - Card 组件
   - Table 组件

4. **[布局指南](./layout.md)**
   - 页面布局模式
   - 三栏布局
   - 响应式设计
   - 网格系统

5. **[最佳实践文档](./best-practices.md)**
   - 组件选择指南
   - Token 使用指南
   - 可访问性最佳实践
   - 性能优化建议

### 代码示例

查看 `examples/` 目录中的代码示例文件：
- `button-examples.tsx` - Button 组件示例
- `input-examples.tsx` - Input 组件示例
- `card-examples.tsx` - Card 组件示例
- `table-examples.tsx` - Table 组件示例
- `layout-examples.tsx` - 布局示例
- `form-examples.tsx` - 表单组合示例

---

## 设计原则

### 数据密集

设计系统优先考虑信息密度，在有限空间内展示更多信息：

- 紧凑的间距
- 清晰的层次结构
- 高效的信息组织

### 高信息密度

适合 CRM 系统的高信息密度需求：

- 表格组件支持大量数据
- 卡片组件紧凑布局
- 响应式设计适配不同屏幕

### 现代感

使用现代设计趋势：

- 玻璃态效果（glassmorphism）
- 微动效（micro-animations）
- 渐变背景
- 柔和的阴影

---

## 设计系统版本信息

- **版本：** 1.0.0
- **创建日期：** 2025-12-26
- **最后更新：** 2025-12-26
- **状态：** MVP 阶段

### 技术栈

- **React：** 18+
- **TypeScript：** 5+
- **Tailwind CSS：** 3.4.19
- **Vite：** 4.4.5

---

## 贡献指南

### 如何扩展设计系统

#### 1. 添加新的设计 Token

在 `fenghua-frontend/src/styles/theme.ts` 中添加新的 Token：

```typescript
// 添加新的颜色
const colors: ColorTokens = {
  // ... 现有颜色
  custom: {
    newColor: '#FF0000',
  },
};
```

然后在 `tailwind.config.ts` 中注册：

```typescript
colors: {
  // ... 现有颜色
  'custom-new-color': themeTokens.colors.custom.newColor,
}
```

#### 2. 创建新组件

在 `fenghua-frontend/src/components/ui/` 中创建新组件：

```typescript
// NewComponent.tsx
import React from 'react';

export interface NewComponentProps {
  // Props 定义
}

export const NewComponent: React.FC<NewComponentProps> = (props) => {
  // 组件实现
};
```

在 `index.ts` 中导出：

```typescript
export { NewComponent } from './NewComponent';
export type { NewComponentProps } from './NewComponent';
```

#### 3. 更新文档

添加新 Token 或组件后，更新相应的文档：
- 设计 Token → `design-tokens.md`
- 新组件 → `components.md`

---

## 相关资源

### 源代码

- **设计 Token：** `fenghua-frontend/src/styles/theme.ts`
- **组件库：** `fenghua-frontend/src/components/ui/`
- **Tailwind 配置：** `fenghua-frontend/tailwind.config.ts`

### 示例代码

- **组件测试：** `fenghua-frontend/src/components/TestTailwind.tsx`
- **代码示例：** `docs/design-system/examples/`

### 相关文档

- **Epic 0：** 设计系统基础设施
- **Story 0.2：** 设计 Token 系统
- **Story 0.3：** 核心 UI 组件库
- **Story 0.4：** 已完成的 Stories UI 改造

---

## 支持

如有问题或建议，请参考：
- 设计 Token 文档了解 Token 使用
- 组件库文档了解组件 API
- 最佳实践文档了解使用建议

---

**注意：** 所有自定义代码都是专有代码，不开源。

