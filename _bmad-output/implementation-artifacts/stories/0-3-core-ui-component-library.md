# Story 0.3: 核心 UI 组件库

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **开发团队**,
I want **核心 UI 组件库完成**,
So that **后续 Stories 可以直接使用这些组件，提升开发效率**.

## Acceptance Criteria

1. **Given** 设计 Token 系统已建立（Story 0.2 完成）
   **When** 开发团队创建核心 UI 组件
   **Then** 创建 `src/components/ui/` 目录结构
   **And** 实现按钮组件（Linear 风格：渐变、微动效）
   **And** 实现输入框组件（极细描边、外发光）
   **And** 实现卡片组件（玻璃态效果、模糊背景）
   **And** 实现表格组件（数据密集、高信息密度）
   **And** 所有组件使用设计 Token
   **And** 所有组件支持响应式设计
   **And** 组件文档完整（JSDoc 注释）

2. **Given** 核心 UI 组件库已完成
   **When** 开发团队验证组件库
   **Then** 所有组件可以通过 Tailwind 类名使用设计 Token
   **And** 所有组件在深色模式下正确显示
   **And** 所有组件支持响应式布局
   **And** 所有组件有完整的 TypeScript 类型定义
   **And** 所有组件有 JSDoc 注释

## Tasks / Subtasks

- [x] Task 1: 创建组件目录结构 (AC: #1)
  - [x] 创建 `fenghua-frontend/src/components/ui/` 目录（已存在，Story 0.1 创建了 .gitkeep）✅
  - [x] 创建组件索引文件 `index.ts` 用于统一导出（使用 named exports）✅
  - [x] 确保目录结构与项目规范一致 ✅
  - [x] **文件命名规范：** 所有组件文件使用 `PascalCase.tsx`（如 `Button.tsx`, `Input.tsx`）✅
  - [x] **导出规范：** 使用 named exports（`export const Button = ...`），避免 default exports ✅

- [x] Task 2: 实现按钮组件 (AC: #1)
  - [x] 创建 `Button.tsx` 组件文件（PascalCase 命名）✅
  - [x] 实现按钮基础功能（onClick, disabled, children）✅
  - [x] 实现 TypeScript Props 接口（ButtonProps，继承 React.ButtonHTMLAttributes）✅
  - [x] 使用 `React.forwardRef` 支持 ref 转发 ✅
  - [x] 实现 Linear 风格样式（使用具体设计 Token）：
    - Primary 变体：`bg-gradient-primary`, `text-white`, `rounded-linear-md`, `p-linear-2 p-linear-4` ✅
    - Secondary 变体：`border border-primary-blue`, `text-primary-blue`, `bg-transparent` ✅
    - Outline 变体：`border border-linear-surface`, `text-linear-text`, `bg-transparent` ✅
    - Ghost 变体：`text-linear-text`, `bg-transparent`, `hover:bg-linear-surface/50` ✅
    - 微动效：`hover:scale-[0.98]`, `focus:ring-2 focus:ring-primary-blue`, `transition-all duration-200` ✅
    - 阴影：hover 时 `shadow-linear-md` ✅
  - [x] 实现按钮变体（primary, secondary, outline, ghost）✅
  - [x] 实现按钮尺寸（sm, md, lg）✅
  - [x] 添加可访问性支持：
    - `aria-label`（自动从 children 或 props 获取）✅
    - `aria-disabled`（当 disabled 时）✅
    - 键盘支持：Enter/Space 键触发点击（原生支持）✅
  - [x] 添加 JSDoc 注释（组件说明、Props 说明、使用示例）✅
  - [x] 使用 named export：`export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)` ✅
  - [x] 支持响应式设计（移动端适配）✅

- [x] Task 3: 实现输入框组件 (AC: #1)
  - [x] 创建 `Input.tsx` 组件文件（PascalCase 命名）✅
  - [x] 实现输入框基础功能（value, onChange, placeholder, type）✅
  - [x] 实现 TypeScript Props 接口（InputProps，使用 Omit 排除 HTML size 属性冲突）✅
  - [x] 使用 `React.forwardRef` 支持 ref 转发 ✅
  - [x] 实现 Linear 风格样式（使用具体设计 Token）：
    - 默认状态：`border border-linear-surface`, `bg-linear-dark`, `text-linear-text`, `rounded-linear-md`, `p-linear-3 p-linear-4` ✅
    - Focus 状态：`focus:ring-2 focus:ring-primary-blue`, `focus:border-primary-blue` ✅
    - Error 状态：`border-semantic-error`, `focus:ring-semantic-error` ✅
    - Disabled 状态：`opacity-50`, `cursor-not-allowed` ✅
    - 占位符：`placeholder:text-linear-text-placeholder` ✅
  - [x] 实现输入框状态（default, focus, error, disabled）✅
  - [x] 实现输入框尺寸（sm, md, lg）✅
  - [x] 添加可访问性支持：
    - `aria-label` 或 `aria-labelledby`（通过 label prop 和 useId）✅
    - `aria-describedby`（用于 error message 或 helper text）✅
    - `aria-invalid`（当 error 为 true 时）✅
    - 键盘支持：标准输入框键盘操作（原生支持）✅
  - [x] 添加 JSDoc 注释 ✅
  - [x] 使用 named export：`export const Input = React.forwardRef<HTMLInputElement, InputProps>(...)` ✅
  - [x] 支持响应式设计 ✅

- [x] Task 4: 实现卡片组件 (AC: #1)
  - [x] 创建 `Card.tsx` 组件文件（PascalCase 命名）✅
  - [x] 实现卡片基础功能（children, title, footer）✅
  - [x] 实现 TypeScript Props 接口（CardProps，使用 Omit 排除 HTML title 属性冲突）✅
  - [x] 实现 Linear 风格样式（使用具体设计 Token）：
    - Default 变体：`backdrop-blur-linear-md`, `bg-linear-surface/80`, `rounded-linear-lg`, `shadow-linear-md`, `p-linear-6` ✅
    - Elevated 变体：`shadow-linear-lg`（更强阴影）✅
    - Outlined 变体：`border border-white/20`（边框强调）✅
    - 悬停效果（当 hoverable 为 true）：`hover:bg-linear-surface/90`, `transition-all duration-200` ✅
  - [x] 实现卡片变体（default, elevated, outlined）✅
  - [x] 添加可访问性支持：
    - `role="article"`（当有 title 时）✅
    - `aria-label`（当 title 是字符串时）✅
  - [x] 添加 TypeScript 类型定义（CardProps 接口）✅
  - [x] 添加 JSDoc 注释 ✅
  - [x] 使用 named export：`export const Card = ({ ... }: CardProps) => ...` ✅
  - [x] 支持响应式设计 ✅

- [x] Task 5: 实现表格组件 (AC: #1)
  - [x] 创建 `Table.tsx` 组件文件（PascalCase 命名）✅
  - [x] 实现表格基础功能（columns, data, onRowClick）✅
  - [x] 实现 TypeScript Props 接口（TableProps, Column，支持泛型）✅
  - [x] 实现 Linear 风格样式（使用具体设计 Token）：
    - 数据密集布局：`text-linear-sm` (14px), `p-linear-2` (8px) 垂直, `p-linear-4` (16px) 水平 ✅
    - 表头：`bg-linear-surface`, `text-linear-text`, `font-semibold`, `border-b border-linear-surface` ✅
    - 行悬停：`hover:bg-linear-surface/50`, `transition-colors duration-150` ✅
    - 行分隔：`border-b border-linear-surface`（极细分隔线）✅
    - 表格容器：`rounded-linear-lg`, `overflow-hidden` ✅
  - [x] 实现表格功能（排序支持，使用 useState 和 useMemo）✅
  - [x] 实现表格响应式（移动端横向滚动：`overflow-x-auto`）✅
  - [x] 添加可访问性支持：
    - `role="table"`, `aria-label`（表格描述）✅
    - 表头使用 `<th>` 和 `scope="col"` ✅
    - 键盘导航：Tab 键在单元格间移动，Enter 键触发行点击 ✅
  - [x] 添加 TypeScript 类型定义（TableProps, Column 接口）✅
  - [x] 添加 JSDoc 注释 ✅
  - [x] 使用 named export：`export function Table<T>({ ... }: TableProps<T>)` ✅
  - [x] 支持响应式设计 ✅

- [x] Task 6: 创建组件索引文件 (AC: #1)
  - [x] 创建 `src/components/ui/index.ts` ✅
  - [x] 使用 named exports 导出所有组件 ✅
  - [x] 导出所有类型定义（使用 `export type`）✅
  - [x] 确保导入路径正确 ✅
  - [x] 避免 default exports（遵循项目规范）✅

- [x] Task 7: 组件测试和验证 (AC: #2)
  - [x] 更新测试组件 `src/components/TestTailwind.tsx`：
    - 添加按钮组件测试（所有变体和尺寸）✅
    - 添加输入框组件测试（所有状态和尺寸）✅
    - 添加卡片组件测试（所有变体）✅
    - 添加表格组件测试（示例数据）✅
    - 测试深色模式下的所有组件（通过深色模式切换）✅
    - 测试响应式布局（响应式卡片网格）✅
  - [x] 验证所有组件使用设计 Token（所有组件都使用设计 Token 类名）✅
  - [x] 验证构建过程无错误 ✅ 构建成功
  - [x] 验证 TypeScript 类型检查通过 ✅ 类型检查通过

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - React 18+ + TypeScript + Vite 4.4.5
  - Tailwind CSS v3.4.19 已配置（Story 0.1）
  - 设计 Token 系统已建立（Story 0.2）✅
  - 前端项目路径：`fenghua-frontend/`
  - 设计风格：Linear + Data-Dense Minimalism
  - 深色模式策略：`darkMode: 'class'`（已在 Story 0.1 配置）

- **Design System Requirements (具体 Token 使用):**
  - **Button:** Primary `bg-gradient-primary text-white rounded-linear-md p-linear-2 p-linear-4 hover:scale-[0.98] focus:ring-2`, Secondary `border-primary-blue text-primary-blue`, Outline `border-linear-surface text-linear-text`, Ghost `text-linear-text hover:bg-linear-surface/50`
  - **Input:** Default `border-linear-surface bg-linear-dark text-linear-text rounded-linear-md p-linear-3 p-linear-4`, Focus `ring-2 ring-primary-blue`, Error `border-semantic-error`, Disabled `opacity-50`
  - **Card:** Default `backdrop-blur-linear-md bg-linear-surface/80 rounded-linear-lg shadow-linear-md p-linear-6`, Elevated `shadow-linear-lg`, Outlined `border-white/20`
  - **Table:** 容器 `rounded-linear-lg bg-linear-dark`, 表头 `bg-linear-surface text-linear-text border-linear-surface p-linear-2 p-linear-4`, 单元格 `text-linear-sm p-linear-2 p-linear-4 border-linear-surface`, 行悬停 `hover:bg-linear-surface/50`, 响应式 `overflow-x-auto`

- **Dependencies:**
  - Story 0.2 必须完成（设计 Token 系统）✅ 已完成
  - Tailwind CSS v3.4.19 已安装 ✅
  - TypeScript 已配置 ✅
  - 所有设计 Token 可用（颜色、间距、字体、阴影、模糊、圆角、渐变）✅

- **Source tree components to touch:**
  - `fenghua-frontend/src/components/ui/Button.tsx`: 新建（PascalCase 命名，named export）
  - `fenghua-frontend/src/components/ui/Input.tsx`: 新建（PascalCase 命名，named export，forwardRef）
  - `fenghua-frontend/src/components/ui/Card.tsx`: 新建（PascalCase 命名，named export）
  - `fenghua-frontend/src/components/ui/Table.tsx`: 新建（PascalCase 命名，named export，泛型支持）
  - `fenghua-frontend/src/components/ui/index.ts`: 新建（组件索引，named exports）
  - `fenghua-frontend/src/components/TestTailwind.tsx`: 更新（添加组件测试）

- **Component File Structure Example:**
  ```typescript
  // Button.tsx
  import React from 'react';
  
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    // ...
  }
  
  export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', ...props }, ref) => {
      // Implementation
    }
  );
  
  Button.displayName = 'Button';
  ```

- **Testing requirements:**
  - 创建/更新测试组件验证所有 UI 组件
  - 测试所有组件变体和尺寸
  - 测试深色模式下的所有组件
  - 测试响应式布局（移动端、平板、桌面）
  - 验证所有组件使用设计 Token（检查 Tailwind 类名）
  - 验证可访问性（键盘导航、ARIA 属性）
  - 验证构建成功
  - 验证 TypeScript 类型检查通过
  - **测试策略：** 
    - 视觉测试：在测试组件中展示所有变体和状态
    - 交互测试：验证点击、输入、悬停等交互
    - 可访问性测试：验证键盘导航和 ARIA 属性

- **Story dependencies:**
  - **前置依赖：** Story 0.2（设计 Token 系统）必须完成 ✅ 已完成
  - **后续依赖：** Story 0.4（已完成的 Stories UI 改造）依赖此 Story 完成

- **Component Design Patterns:**
  - **文件命名：** 组件文件使用 `PascalCase.tsx`（如 `Button.tsx`, `Input.tsx`）
  - **导出模式：** 使用 named exports（`export const Button = ...`），避免 default exports
  - **组件结构：** 使用函数组件 + TypeScript
  - **Props 接口：** 明确定义所有 Props 类型，继承 HTML 元素属性（如 `React.ButtonHTMLAttributes`）
  - **Ref 转发：** 使用 `React.forwardRef` 支持 ref（Button, Input）
  - **默认值：** 使用默认参数（`variant = 'primary'`）
  - **可访问性：** 
    - Button: `aria-label`（图标按钮）, `aria-disabled`（disabled 时）
    - Input: `aria-label`/`aria-labelledby`, `aria-describedby`, `aria-invalid`（error 时）
    - Card: `role="article"` 或 `role="region"`（如适用）
    - Table: `role="table"`, `aria-label`, 正确的 `<th>` 和 `scope` 属性
  - **键盘支持：** 
    - Button: Enter/Space 键触发点击
    - Input: 标准输入框键盘操作
    - Table: Tab 键在单元格间移动，Enter 键触发行点击
  - **响应式：** 使用 Tailwind 响应式类（sm:, md:, lg:）

- **Reference:**
  - Linear Design System: https://linear.app (参考视觉风格)
  - Tailwind CSS Components: https://tailwindcss.com/docs
  - React forwardRef: https://react.dev/reference/react/forwardRef
  - ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
  - Story 0.2 实现：`_bmad-output/implementation-artifacts/stories/0-2-design-token-system.md`
  - 设计系统决策会议记录：`_bmad-output/meeting-notes-2025-12-26-design-system-decision.md`
  - UX 设计规范：`_bmad-output/ux-design-specification.md`
  - 项目代码规范：`_bmad-output/project-context.md` (Component files: PascalCase.tsx, named exports)

---

## Dev Agent Record

### Implementation Plan

**Approach:**
1. 创建组件目录结构和索引文件
2. 实现 Button 组件（forwardRef, 4 种变体, 3 种尺寸）
3. 实现 Input 组件（forwardRef, 4 种状态, 3 种尺寸）
4. 实现 Card 组件（3 种变体, 玻璃态效果）
5. 实现 Table 组件（泛型支持, 排序功能）
6. 更新测试组件验证所有组件

**Key Decisions:**
- 使用 `React.forwardRef` 支持 ref 转发（Button, Input）
- 使用 `Omit` 解决 Props 接口冲突（Card title, Input size）
- 所有组件使用 named exports
- 所有组件使用设计 Token 类名
- 完整的可访问性支持（ARIA 属性, 键盘导航）

### Debug Log

**Task 1 - 组件目录结构:**
- ✅ 创建 `index.ts` 文件
- ✅ 使用 named exports 导出所有组件和类型

**Task 2 - Button 组件:**
- ✅ 创建 `Button.tsx` 文件
- ✅ 实现完整的 ButtonProps 接口
- ✅ 使用 React.forwardRef 支持 ref
- ✅ 实现 4 种变体（primary, secondary, outline, ghost）
- ✅ 实现 3 种尺寸（sm, md, lg）
- ✅ 添加加载状态和图标支持
- ✅ 添加可访问性支持（aria-label, aria-disabled）
- ✅ 添加 JSDoc 注释

**Task 3 - Input 组件:**
- ✅ 创建 `Input.tsx` 文件
- ✅ 实现完整的 InputProps 接口（使用 Omit 排除 HTML size 属性）
- ✅ 使用 React.forwardRef 支持 ref
- ✅ 实现 4 种状态（default, focus, error, disabled）
- ✅ 实现 3 种尺寸（sm, md, lg）
- ✅ 添加 label, errorMessage, helperText 支持
- ✅ 添加图标支持（leftIcon, rightIcon）
- ✅ 添加可访问性支持（aria-label, aria-describedby, aria-invalid）
- ✅ 使用 useId 生成唯一 ID
- ✅ 添加 JSDoc 注释

**Task 4 - Card 组件:**
- ✅ 创建 `Card.tsx` 文件
- ✅ 实现完整的 CardProps 接口（使用 Omit 排除 HTML title 属性）
- ✅ 实现 3 种变体（default, elevated, outlined）
- ✅ 实现玻璃态效果（backdrop-blur-linear-md）
- ✅ 添加 title 和 footer 支持
- ✅ 添加 hoverable 功能
- ✅ 添加可访问性支持（role="article", aria-label）
- ✅ 添加 JSDoc 注释

**Task 5 - Table 组件:**
- ✅ 创建 `Table.tsx` 文件
- ✅ 实现完整的 TableProps 和 Column 接口（支持泛型）
- ✅ 实现数据密集布局
- ✅ 实现排序功能（useState + useMemo）
- ✅ 实现行点击功能
- ✅ 实现响应式（移动端横向滚动）
- ✅ 添加可访问性支持（role="table", aria-label, scope="col"）
- ✅ 添加键盘导航（Tab, Enter）
- ✅ 添加 JSDoc 注释

**Task 6 - 组件索引文件:**
- ✅ 创建 `index.ts` 文件
- ✅ 导出所有组件和类型（named exports）

**Task 7 - 组件测试和验证:**
- ✅ 更新 TestTailwind.tsx 组件
- ✅ 添加所有组件的测试示例
- ✅ 测试所有变体和尺寸
- ✅ 测试响应式布局
- ✅ 构建验证通过 ✅
- ✅ TypeScript 类型检查通过 ✅

### Completion Notes

**Implemented:**
- ✅ 核心 UI 组件库完整实现
- ✅ 所有组件使用设计 Token
- ✅ 所有组件支持响应式设计
- ✅ 所有组件有完整的 TypeScript 类型定义
- ✅ 所有组件有 JSDoc 注释
- ✅ 所有组件支持可访问性

**Files Created:**
- `fenghua-frontend/src/components/ui/Button.tsx` - 按钮组件
- `fenghua-frontend/src/components/ui/Input.tsx` - 输入框组件
- `fenghua-frontend/src/components/ui/Card.tsx` - 卡片组件
- `fenghua-frontend/src/components/ui/Table.tsx` - 表格组件
- `fenghua-frontend/src/components/ui/index.ts` - 组件索引文件

**Files Modified:**
- `fenghua-frontend/src/components/TestTailwind.tsx` - 添加所有 UI 组件测试示例

**Testing:**
- ✅ 构建验证通过：`npm run build` 成功
- ✅ 所有组件可通过 named exports 导入
- ✅ 所有组件使用设计 Token 类名
- ✅ 测试组件包含完整的组件示例
- ✅ 深色模式支持（通过深色模式切换）
- ✅ 响应式布局测试

**TypeScript Fixes:**
- ✅ 修复 CardProps title 属性冲突（使用 Omit）
- ✅ 修复 InputProps size 属性冲突（使用 Omit）

**Next Steps:**
- Story 0.4 可以使用这些组件改造已完成的 Stories UI
- 所有后续 Stories 可以直接使用这些组件，提升开发效率

---

## File List

**New Files:**
- `fenghua-frontend/src/components/ui/Button.tsx`
- `fenghua-frontend/src/components/ui/Input.tsx`
- `fenghua-frontend/src/components/ui/Card.tsx`
- `fenghua-frontend/src/components/ui/Table.tsx`
- `fenghua-frontend/src/components/ui/index.ts`

**Modified Files:**
- `fenghua-frontend/src/components/TestTailwind.tsx`

---

## Change Log

**2025-12-26:**
- 创建核心 UI 组件库（Button, Input, Card, Table）
- 所有组件使用设计 Token（Linear 风格）
- 所有组件支持响应式设计
- 所有组件有完整的 TypeScript 类型定义和 JSDoc 注释
- 所有组件支持可访问性（ARIA 属性, 键盘导航）
- 更新测试组件，添加所有组件测试示例
- 验证构建成功，所有组件可用

