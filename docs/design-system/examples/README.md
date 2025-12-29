# 代码示例说明

本目录包含设计系统各组件的使用示例代码。

## 重要说明

### 导入路径

示例文件中的导入路径是**示例性的**，实际使用时需要根据你的文件位置调整：

```typescript
// 如果组件文件在 src/pages/ 目录，使用：
import { Button, Input, Card, Table } from '../components/ui';

// 如果组件文件在 src/components/ 目录，使用：
import { Button, Input, Card, Table } from './ui';

// 如果组件文件在 src/ 根目录，使用：
import { Button, Input, Card, Table } from './components/ui';
```

### 使用方式

1. **复制代码**：从示例文件中复制需要的代码片段
2. **调整导入路径**：根据你的文件位置调整导入路径
3. **根据需要修改**：根据实际需求修改代码

### 示例文件列表

- `button-examples.tsx` - Button 组件示例
- `input-examples.tsx` - Input 组件示例
- `card-examples.tsx` - Card 组件示例
- `table-examples.tsx` - Table 组件示例
- `layout-examples.tsx` - 布局示例
- `form-examples.tsx` - 表单组合示例

### 类型检查

所有示例代码都遵循 TypeScript 类型规范，但示例文件本身不进行类型检查（因为它们在 docs 目录中）。

实际使用时，确保：
1. 导入路径正确
2. 所有 props 类型匹配
3. 通过 `tsc --noEmit` 类型检查

