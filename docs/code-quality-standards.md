# 代码质量与开发指南

本文档总结了峰华CRM系统在代码质量优化过程中积累的最佳实践，旨在指导后续开发，确保代码质量、类型安全和可维护性。

**最后更新：** 2025-01-03  
**版本：** 1.0.0

---

## 目录

1. [TypeScript 类型安全规范](#1-typescript-类型安全规范)
2. [React Hooks 使用规范](#2-react-hooks-使用规范)
3. [无障碍性开发指南](#3-无障碍性开发指南)
4. [错误处理最佳实践](#4-错误处理最佳实践)
5. [ESLint 规则遵循](#5-eslint-规则遵循)
6. [代码审查检查清单](#6-代码审查检查清单)

---

## 1. TypeScript 类型安全规范

### 1.1 禁止使用 `any` 类型

**原则：** 永远不要使用 `any` 类型，它会破坏 TypeScript 的类型安全。

#### ❌ 错误示例

```typescript
// 错误：使用 any 类型
function handleChange(value: any) {
  setValue(value);
}

// 错误：catch 块使用 any
catch (error: any) {
  console.error(error.message);
}

// 错误：环境变量使用 any
const apiUrl = (import.meta as any).env.VITE_API_URL;
```

#### ✅ 正确示例

```typescript
// 正确：使用具体类型或泛型
function handleChange<T>(value: T) {
  setValue(value);
}

// 正确：使用 unknown 类型
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('An unknown error occurred');
  }
}

// 正确：使用类型断言
const apiUrl = (import.meta.env?.VITE_API_BASE_URL as string) || '';
```

### 1.2 对象属性类型规范

#### ❌ 错误示例

```typescript
// 错误：使用 Record<string, any>
interface LogEntry {
  metadata: Record<string, any>;
}
```

#### ✅ 正确示例

```typescript
// 正确：使用 Record<string, unknown>
interface LogEntry {
  metadata: Record<string, unknown>;
}

// 或者使用具体类型
interface LogEntry {
  metadata: {
    userId?: string;
    action?: string;
    timestamp?: string;
  };
}
```

### 1.3 函数参数类型规范

#### ❌ 错误示例

```typescript
// 错误：参数使用 any
function updateProduct(data: any) {
  // ...
}
```

#### ✅ 正确示例

```typescript
// 正确：使用具体类型或泛型
function updateProduct(data: UpdateProductDto) {
  // ...
}

// 或者使用 keyof 约束
function handleChange<K extends keyof UpdateProductDto>(
  key: K,
  value: UpdateProductDto[K]
) {
  // ...
}
```

### 1.4 环境变量类型安全

#### ✅ 标准模式

```typescript
// 定义环境变量类型
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || '';
const BACKEND_URL = (import.meta.env?.VITE_BACKEND_URL as string) || '';

// 使用前进行验证
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined');
}
```

---

## 2. React Hooks 使用规范

### 2.1 useEffect 依赖数组

**原则：** 必须包含所有在 effect 中使用的依赖项，或者使用 eslint-disable 注释说明原因。

#### ❌ 错误示例

```typescript
// 错误：缺少依赖项
useEffect(() => {
  loadUsers();
}, [roleFilter]); // loadUsers 函数未包含在依赖数组中
```

#### ✅ 正确示例

```typescript
// 方法1：将函数包含在依赖数组中
useEffect(() => {
  loadUsers();
}, [roleFilter, loadUsers]);

// 方法2：使用 useCallback 包装函数
const loadUsers = useCallback(async () => {
  // ...
}, [roleFilter]);

useEffect(() => {
  loadUsers();
}, [loadUsers]);

// 方法3：如果确实不需要依赖，使用 eslint-disable 注释
useEffect(() => {
  loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [roleFilter]);
```

### 2.2 useMemo 和 useCallback 依赖

**原则：** 所有依赖项必须包含在依赖数组中，包括函数依赖。

#### ❌ 错误示例

```typescript
// 错误：函数依赖未包含
const hasPermission = (permission: string): boolean => {
  // 使用 user
};

const contextValue = useMemo(
  () => ({
    hasPermission,
  }),
  [user] // hasPermission 函数未包含
);
```

#### ✅ 正确示例

```typescript
// 正确：使用 useCallback 包装函数
const hasPermission = useCallback((permission: string): boolean => {
  // 使用 user
}, [user]);

const contextValue = useMemo(
  () => ({
    hasPermission,
  }),
  [user, hasPermission] // 包含所有依赖
);
```

### 2.3 函数依赖的处理

**原则：** 如果函数在多个地方使用，使用 `useCallback` 包装以避免不必要的重新创建。

#### ✅ 标准模式

```typescript
// 在组件中定义函数时，如果会被用作依赖，使用 useCallback
const handleSubmit = useCallback(async (data: FormData) => {
  // ...
}, [token, userId]);

// 在 useEffect 中使用
useEffect(() => {
  // handleSubmit 已经在依赖数组中
}, [handleSubmit]);
```

---

## 3. 无障碍性开发指南

### 3.1 表单标签关联

**原则：** 所有表单控件必须与标签正确关联。

#### ❌ 错误示例

```typescript
// 错误：label 和 input 未关联
<label>用户名</label>
<input type="text" />
```

#### ✅ 正确示例

```typescript
// 正确：使用 htmlFor 和 id 关联
<label htmlFor="username">用户名</label>
<input id="username" type="text" />

// 或者使用 aria-label
<input 
  id="username" 
  type="text" 
  aria-label="用户名"
/>
```

### 3.2 键盘事件处理

**原则：** 所有可点击的元素必须支持键盘操作。

#### ❌ 错误示例

```typescript
// 错误：只有鼠标事件
<div onClick={handleClick}>
  点击我
</div>
```

#### ✅ 正确示例

```typescript
// 正确：添加键盘事件处理
<div 
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  role="button"
  tabIndex={0}
  aria-label="点击执行操作"
>
  点击我
</div>
```

### 3.3 模态框无障碍性

**原则：** 模态框必须支持键盘操作和屏幕阅读器。

#### ✅ 标准模式

```typescript
// 背景层：使用 role="presentation"
<div 
  className="fixed inset-0 bg-black/50"
  onClick={handleClose}
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }}
  role="presentation"
  tabIndex={-1}
>
  {/* 内容层：使用 role="dialog" */}
  <Card 
    onClick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <h3 id="dialog-title">对话框标题</h3>
    {/* 内容 */}
  </Card>
</div>
```

### 3.4 列表项交互

**原则：** 可交互的列表项必须支持键盘操作。

#### ✅ 标准模式

```typescript
<li
  onClick={() => handleSelect(item)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(item);
    }
  }}
  role="option"
  tabIndex={0}
  aria-selected={isSelected}
>
  {item.name}
</li>
```

### 3.5 只读显示字段

**原则：** 只读显示字段不应使用 `label` 元素，应使用 `div`。

#### ❌ 错误示例

```typescript
// 错误：只读字段使用 label
<label>创建时间</label>
<div>{createdAt}</div>
```

#### ✅ 正确示例

```typescript
// 正确：使用 div 显示只读字段
<div className="text-monday-sm text-monday-text-secondary font-semibold">
  创建时间
</div>
<div className="text-monday-base text-monday-text">
  {createdAt}
</div>
```

---

## 4. 错误处理最佳实践

### 4.1 错误类型处理

**原则：** 使用 `unknown` 类型处理错误，并进行类型检查。

#### ✅ 标准模式

```typescript
try {
  // 可能抛出错误的代码
  const result = await apiCall();
} catch (error: unknown) {
  // 类型检查
  if (error instanceof Error) {
    console.error('Error:', error.message);
    setError(error.message);
  } else {
    console.error('Unknown error:', error);
    setError('发生未知错误');
  }
}
```

### 4.2 API 错误处理

**原则：** 统一处理 API 错误，提供用户友好的错误消息。

#### ✅ 标准模式

```typescript
const fetchData = async (): Promise<void> => {
  try {
    setLoading(true);
    setError(null);
    const data = await apiService.getData();
    setData(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('获取数据失败，请稍后重试');
    }
  } finally {
    setLoading(false);
  }
};
```

### 4.3 错误边界

**原则：** 在关键组件中使用错误边界捕获 React 错误。

#### ✅ 标准模式

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>发生错误，请刷新页面重试</div>;
    }
    return this.props.children;
  }
}
```

---

## 5. ESLint 规则遵循

### 5.1 禁用规则的使用

**原则：** 只有在确实必要时才使用 eslint-disable 注释，并说明原因。

#### ✅ 标准模式

```typescript
// 合理使用：阻止事件冒泡的 div
{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
<div 
  onClick={(e) => e.stopPropagation()}
  role="group"
  aria-label="操作按钮组"
>
  {/* 按钮组 */}
</div>

// 合理使用：Hook 导出
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  // ...
};
```

### 5.2 未使用变量处理

**原则：** 移除未使用的导入和变量，或在解构时使用下划线前缀。

#### ✅ 标准模式

```typescript
// 方法1：移除未使用的导入
// import { Card } from './Card'; // 如果未使用，删除

// 方法2：解构时使用下划线前缀
const { search: _search, ...rest } = filters;

// 方法3：使用 eslint-disable（不推荐，除非确实需要）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unused = someValue;
```

---

## 6. 代码审查检查清单

### 6.1 类型安全检查

- [ ] 没有使用 `any` 类型
- [ ] 所有函数参数和返回值都有类型注解
- [ ] 错误处理使用 `unknown` 类型
- [ ] 环境变量使用类型断言
- [ ] 对象属性使用 `Record<string, unknown>` 而不是 `Record<string, any>`

### 6.2 React Hooks 检查

- [ ] 所有 `useEffect` 依赖数组完整
- [ ] 所有 `useMemo` 和 `useCallback` 依赖数组完整
- [ ] 函数依赖使用 `useCallback` 包装
- [ ] 没有在循环或条件语句中使用 Hooks

### 6.3 无障碍性检查

- [ ] 所有表单控件与标签正确关联（`htmlFor` 和 `id`）
- [ ] 所有可点击元素支持键盘操作（`onKeyDown`）
- [ ] 所有交互元素有适当的 `role` 和 `aria-*` 属性
- [ ] 模态框支持 ESC 键关闭
- [ ] 只读显示字段使用 `div` 而不是 `label`

### 6.4 错误处理检查

- [ ] 所有 `catch` 块使用 `unknown` 类型
- [ ] 错误消息对用户友好
- [ ] API 调用有适当的错误处理
- [ ] 加载状态和错误状态正确管理

### 6.5 代码质量检查

- [ ] 没有未使用的导入和变量
- [ ] ESLint 检查通过（0 错误，0 警告）
- [ ] 代码格式一致（使用 Prettier）
- [ ] 函数和组件有适当的 JSDoc 注释

### 6.6 性能检查

- [ ] 避免不必要的重新渲染（使用 `useMemo`、`useCallback`）
- [ ] 列表渲染使用 `key` 属性
- [ ] 图片使用适当的 `loading` 属性
- [ ] API 调用有适当的防抖/节流

---

## 7. 常见问题与解决方案

### 7.1 TypeScript 类型错误

**问题：** `Argument of type 'string | null' is not assignable to parameter of type 'string'`

**解决方案：**

```typescript
// 使用空值合并运算符
const userId = token?.userId || 'system';

// 或使用类型断言（如果确定不为 null）
const userId = token!.userId;
```

### 7.2 React Hooks 依赖警告

**问题：** `React Hook useEffect has a missing dependency`

**解决方案：**

```typescript
// 如果函数确实不需要作为依赖，使用 eslint-disable
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);

// 或者使用 useCallback 包装函数
const loadData = useCallback(() => {
  // ...
}, [id]);

useEffect(() => {
  loadData();
}, [loadData]);
```

### 7.3 无障碍性警告

**问题：** `Non-interactive elements should not be assigned mouse or keyboard event listeners`

**解决方案：**

```typescript
// 添加适当的 role 和键盘事件处理
<div
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  role="button"
  tabIndex={0}
>
  内容
</div>
```

---

## 8. 工具与配置

### 8.1 ESLint 配置

项目使用以下 ESLint 插件：

- `@typescript-eslint/eslint-plugin` - TypeScript 规则
- `eslint-plugin-react` - React 规则
- `eslint-plugin-react-hooks` - React Hooks 规则
- `eslint-plugin-jsx-a11y` - 无障碍性规则

### 8.2 运行检查

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复可修复的问题
npm run lint -- --fix
```

### 8.3 编辑器配置

建议在编辑器中启用以下功能：

- TypeScript 类型检查
- ESLint 实时检查
- Prettier 自动格式化
- 保存时自动修复

---

## 9. 持续改进

### 9.1 定期审查

- 每周运行完整的 ESLint 检查
- 定期审查代码审查检查清单
- 更新文档以反映新的最佳实践

### 9.2 团队培训

- 新成员入职时进行代码质量培训
- 定期分享代码质量改进经验
- 建立代码审查文化

### 9.3 工具更新

- 定期更新 ESLint 和相关插件
- 关注 TypeScript 新特性
- 采用新的无障碍性工具

---

## 10. 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [React Hooks 文档](https://react.dev/reference/react)
- [WCAG 2.1 无障碍性指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [ESLint 规则文档](https://eslint.org/docs/rules/)
- [无障碍性最佳实践](https://www.a11yproject.com/)

---

**文档维护者：** 开发团队  
**反馈渠道：** 通过代码审查和团队讨论提出改进建议



