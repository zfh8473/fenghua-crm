# Story 4.3: 互动记录附加信息

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **在记录互动时添加文本描述、时间、状态等信息**,
so that **我可以提供详细的互动信息，便于后续查看和分析**.

## Acceptance Criteria

**AC1: 互动描述字段增强**
- **Given** 用户填写互动记录表单
- **When** 用户在"互动描述"字段输入文本描述
- **Then** 系统支持多行文本输入（已实现）
- **And** 系统显示字符计数（可选，建议最大 5000 字符）
- **And** 系统支持文本格式化（可选，基础版本保持纯文本，富文本编辑器作为未来增强）

**AC2: 互动时间选择器增强**
- **Given** 用户填写互动记录表单
- **When** 用户选择互动时间
- **Then** 系统提供日期时间选择器（已实现 `datetime-local` 输入）
- **And** 系统默认选择当前时间，用户可以修改（已实现）
- **And** 系统验证时间不能是未来时间（业务规则，可选但建议实现）
- **And** 如果用户选择未来时间，系统显示验证错误消息

**AC3: 互动状态选择器实现**
- **Given** 用户填写互动记录表单
- **When** 用户选择互动状态
- **Then** 系统根据用户角色和互动类型显示相应的状态选项（下拉选择器，替代当前文本输入）
- **And** 前端专员的互动状态包括：进行中、已完成、已取消
- **And** 后端专员的互动状态包括：进行中、已完成、已取消、需要跟进
- **And** 状态字段为可选字段
- **And** 如果用户未选择状态，系统使用默认值（可选，如"进行中"）

**AC4: 附加信息保存和显示**
- **Given** 用户填写互动记录表单
- **When** 用户填写所有信息（描述、时间、状态）并提交
- **Then** 系统保存所有附加信息到互动记录（后端已支持）
- **And** 系统在互动历史中正确显示这些信息（后续 story 会实现详细显示）

## Tasks / Subtasks

- [x] Task 1: 增强互动描述字段 (AC: #1)
  - [x] 在 `InteractionCreateForm.tsx` 中为描述字段添加字符计数显示
  - [x] 使用 `watch` API 监听 `description` 字段值变化（不要使用手动 `onChange`，会与 `register` 冲突）
  - [x] 设置最大字符数限制（建议 5000 字符）
  - [x] 在表单验证中添加字符数限制验证（使用 `maxLength` 选项）
  - [x] 显示当前字符数/最大字符数（如 "150/5000"）
  - [x] 保持多行文本输入（textarea，已实现）

- [x] Task 2: 增强互动时间选择器 (AC: #2)
  - [x] 在 `InteractionCreateForm.tsx` 中添加未来时间验证
  - [x] 在 `Input` 组件上添加 `max` 属性，限制最大值为当前时间（浏览器原生限制，提升 UX）
  - [x] 使用 `react-hook-form` 的 `validate` 函数验证时间不能是未来时间（双重验证）
  - [x] 如果验证失败，显示错误消息："互动时间不能是未来时间"
  - [x] 保持当前 `datetime-local` 输入类型（已实现）
  - [x] 保持默认当前时间功能（已实现）

- [x] Task 3: 实现互动状态选择器 (AC: #3)
  - [x] 在后端 `interactions/dto/create-interaction.dto.ts` 中定义状态枚举：
    - [x] 创建 `InteractionStatus` 枚举，包含：`IN_PROGRESS = 'in_progress'`（进行中）、`COMPLETED = 'completed'`（已完成）、`CANCELLED = 'cancelled'`（已取消）、`NEEDS_FOLLOW_UP = 'needs_follow_up'`（需要跟进）
    - [x] **重要：** 验证所有枚举值长度 ≤ 50 字符（数据库 status 字段为 VARCHAR(50)）
    - [x] **重要：** 使用 `export` 导出枚举，以便前端可以导入使用（或确保前后端枚举值完全一致）
    - [x] 更新 `CreateInteractionDto.status` 字段类型为 `InteractionStatus | undefined`
    - [x] 使用 `@IsEnum()` 验证状态值（`@IsEnum()` 支持单个枚举类型）
  - [x] 在前端 `interactions/services/interactions.service.ts` 中添加 `InteractionStatus` 枚举：
    - [x] 确保枚举值与后端完全一致
    - [x] 如果可能，从共享类型定义导入（如果项目使用共享类型）
  - [x] 在 `InteractionCreateForm.tsx` 中：
    - [x] 根据用户角色和互动类型动态显示状态选项
    - [x] 前端专员状态选项：进行中、已完成、已取消
    - [x] 后端专员状态选项：进行中、已完成、已取消、需要跟进
    - [x] 将状态输入从文本输入改为下拉选择器（select）
    - [x] 在 `useForm` 的 `defaultValues` 中设置默认状态为 `InteractionStatus.IN_PROGRESS`（可选）
    - [x] 确保状态字段为可选字段

- [x] Task 4: 验证附加信息保存 (AC: #4)
  - [x] 验证后端 `InteractionsService.create` 已正确保存描述、状态字段（Story 4.1 已实现）
  - [x] 验证数据库表 `product_customer_interactions` 已包含 `description` 和 `status` 字段（迁移脚本 002 已定义）
  - [x] 测试创建互动记录时所有附加信息正确保存

- [x] Task 5: 更新测试用例 (AC: #1, #2, #3, #4)
  - [x] 更新 `interactions/interactions.service.spec.ts`：
    - [x] 添加测试：验证描述字段字符数限制（如果实现）
    - [x] 添加测试：验证未来时间被拒绝（如果实现）
    - [x] 添加测试：验证状态枚举值验证
  - [x] 更新 `interactions/interactions.controller.spec.ts`：
    - [x] 添加测试：验证状态枚举值在控制器层面被正确验证

## Dev Notes

### 现有实现分析

**已实现的功能：**
- ✅ 互动描述字段：多行文本输入（textarea）已实现
- ✅ 互动时间字段：日期时间选择器（datetime-local）已实现，默认当前时间
- ✅ 互动状态字段：文本输入已实现（需要改为下拉选择器）
- ✅ 后端 DTO 已支持 `description` 和 `status` 字段（可选）
- ✅ 数据库表已包含 `description` 和 `status` 字段

**需要增强的功能：**
- ⚠️ 描述字段：需要添加字符计数显示和限制
- ⚠️ 时间字段：需要添加未来时间验证
- ⚠️ 状态字段：需要从文本输入改为下拉选择器，根据用户角色显示不同选项

### 技术实现要点

**字符计数实现：**
```typescript
// 在 InteractionCreateForm.tsx 中
const { register, watch } = useForm<CreateInteractionDto>({...});
const MAX_DESCRIPTION_LENGTH = 5000;

// 使用 watch API 监听 description 字段值变化
const descriptionValue = watch('description');
const descriptionLength = descriptionValue?.length || 0;

<textarea
  {...register('description', {
    maxLength: {
      value: MAX_DESCRIPTION_LENGTH,
      message: `描述不能超过 ${MAX_DESCRIPTION_LENGTH} 个字符`
    }
  })}
  rows={4}
  className="w-full px-monday-3 py-monday-2 border border-monday-border rounded-monday-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
  placeholder="请输入互动描述..."
/>
<div className="text-monday-xs text-monday-text-secondary mt-monday-1">
  {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
</div>
```

**未来时间验证：**
```typescript
// 在 InteractionCreateForm.tsx 中
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<CreateInteractionDto>({
  defaultValues: {
    interactionDate: new Date().toISOString().slice(0, 16),
  },
});

// 在 register 中添加自定义验证，并设置 max 属性限制用户选择
<Input
  type="datetime-local"
  max={new Date().toISOString().slice(0, 16)} // 限制最大值为当前时间（浏览器原生限制）
  {...register('interactionDate', {
    required: '互动时间不能为空',
    validate: (value) => {
      const selectedDate = new Date(value);
      const now = new Date();
      if (selectedDate > now) {
        return '互动时间不能是未来时间';
      }
      return true;
    },
  })}
/>
```

**状态枚举定义（后端）：**
```typescript
// 在 interactions/dto/create-interaction.dto.ts 中
// 注意：所有枚举值长度必须 ≤ 50 字符（数据库 status 字段为 VARCHAR(50)）
export enum InteractionStatus {
  IN_PROGRESS = 'in_progress',        // 进行中 (13 字符)
  COMPLETED = 'completed',            // 已完成 (9 字符)
  CANCELLED = 'cancelled',            // 已取消 (9 字符)
  NEEDS_FOLLOW_UP = 'needs_follow_up' // 需要跟进 (16 字符)
}

// 导出枚举供前端使用（确保前后端枚举值一致）
export class CreateInteractionDto {
  // ... 其他字段 ...
  
  @IsEnum(InteractionStatus, {
    message: '状态必须是有效的状态值',
  })
  @IsOptional()
  status?: InteractionStatus;
}
```

**数据库约束说明：**
- 数据库表 `product_customer_interactions.status` 字段类型为 `VARCHAR(50)`
- 所有枚举值长度均 ≤ 50 字符，符合数据库约束
- 可选：在数据库迁移中添加 CHECK constraint 限制状态值（当前未实现，依赖应用层验证）

**状态选择器实现（前端）：**
```typescript
// 在 InteractionCreateForm.tsx 中
// 导入状态枚举（确保与后端枚举值一致）
import { InteractionStatus } from '../services/interactions.service';

const STATUS_OPTIONS_FRONTEND = [
  { value: InteractionStatus.IN_PROGRESS, label: '进行中' },
  { value: InteractionStatus.COMPLETED, label: '已完成' },
  { value: InteractionStatus.CANCELLED, label: '已取消' },
];

const STATUS_OPTIONS_BACKEND = [
  { value: InteractionStatus.IN_PROGRESS, label: '进行中' },
  { value: InteractionStatus.COMPLETED, label: '已完成' },
  { value: InteractionStatus.CANCELLED, label: '已取消' },
  { value: InteractionStatus.NEEDS_FOLLOW_UP, label: '需要跟进' },
];

const statusOptions = useMemo(() => {
  return isBackendSpecialist
    ? STATUS_OPTIONS_BACKEND
    : STATUS_OPTIONS_FRONTEND;
}, [isBackendSpecialist]);

// 在 useForm 中设置默认状态（可选）
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<CreateInteractionDto>({
  defaultValues: {
    interactionDate: new Date().toISOString().slice(0, 16),
    interactionType: defaultInteractionType,
    status: InteractionStatus.IN_PROGRESS, // 可选：设置默认状态为"进行中"
  },
});

<select
  {...register('status')}
  className="w-full px-monday-3 py-monday-2 border border-monday-border rounded-monday-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
>
  <option value="">请选择状态（可选）</option>
  {statusOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

### 项目结构说明

**后端文件：**
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` - 添加状态枚举和验证
- `fenghua-backend/src/interactions/interactions.service.ts` - 验证状态字段保存（已实现）
- `fenghua-backend/src/interactions/interactions.service.spec.ts` - 添加状态相关测试

**前端文件：**
- `fenghua-frontend/src/interactions/services/interactions.service.ts` - 添加状态枚举
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 增强描述、时间、状态字段

### 参考实现

**Story 4.1 和 4.2 学习：**
- 互动类型选择器实现模式：使用 `useMemo` 根据用户角色动态选择选项
- 表单验证模式：使用 `react-hook-form` 的 `register` 和 `validate` 函数
- 枚举定义模式：后端使用 TypeScript enum，前端使用相同的枚举值

**现有代码参考：**
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 当前表单实现
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` - 当前 DTO 定义
- `fenghua-backend/migrations/002-create-interactions-table.sql` - 数据库表结构

### 测试要求

**后端测试：**
- 单元测试：`interactions.service.spec.ts`
  - 测试状态枚举值验证
  - 测试描述字段保存（已覆盖）
  - 测试时间字段保存（已覆盖）
- 集成测试：`interactions.controller.spec.ts`
  - 测试状态枚举值在控制器层面被正确验证

**前端测试：**
- 组件测试：`InteractionCreateForm.test.tsx`（可选，后续实现）
  - 测试字符计数显示
  - 测试未来时间验证
  - 测试状态选择器根据用户角色显示不同选项

### 快速参考

**关键代码模式：**

```typescript
// 后端：状态枚举定义（所有枚举值长度 ≤ 50 字符，符合数据库 VARCHAR(50) 约束）
export enum InteractionStatus {
  IN_PROGRESS = 'in_progress',        // 13 字符
  COMPLETED = 'completed',            // 9 字符
  CANCELLED = 'cancelled',            // 9 字符
  NEEDS_FOLLOW_UP = 'needs_follow_up' // 16 字符
}

// 后端：DTO 验证（导出枚举供前端使用）
@IsEnum(InteractionStatus, {
  message: '状态必须是有效的状态值',
})
@IsOptional()
status?: InteractionStatus;
```

```typescript
// 前端：字符计数实现
const [descriptionLength, setDescriptionLength] = useState(0);
const MAX_DESCRIPTION_LENGTH = 5000;

<textarea
  {...register('description', {
    maxLength: {
      value: MAX_DESCRIPTION_LENGTH,
      message: `描述不能超过 ${MAX_DESCRIPTION_LENGTH} 个字符`
    }
  })}
  onChange={(e) => {
    setDescriptionLength(e.target.value.length);
  }}
/>
<div className="text-monday-xs text-monday-text-secondary">
  {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
</div>
```

```typescript
// 前端：未来时间验证（添加 max 属性限制用户选择）
<Input
  type="datetime-local"
  max={new Date().toISOString().slice(0, 16)} // 限制最大值为当前时间（浏览器原生限制）
  {...register('interactionDate', {
    required: '互动时间不能为空',
    validate: (value) => {
      const selectedDate = new Date(value);
      const now = new Date();
      if (selectedDate > now) {
        return '互动时间不能是未来时间';
      }
      return true;
    },
  })}
/>
```

```typescript
// 前端：状态选择器（包含默认值设置）
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<CreateInteractionDto>({
  defaultValues: {
    interactionDate: new Date().toISOString().slice(0, 16),
    interactionType: defaultInteractionType,
    status: InteractionStatus.IN_PROGRESS, // 可选：设置默认状态为"进行中"
  },
});

const statusOptions = useMemo(() => {
  return isBackendSpecialist
    ? STATUS_OPTIONS_BACKEND
    : STATUS_OPTIONS_FRONTEND;
}, [isBackendSpecialist]);

<select
  {...register('status')}
  className="w-full px-monday-3 py-monday-2 border border-monday-border rounded-monday-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
>
  <option value="">请选择状态（可选）</option>
  {statusOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Assistant)

### Debug Log References

- All tests passed successfully (19 tests in interactions.service.spec.ts)
- No linter errors found

### Completion Notes List

1. **Task 1 - 字符计数实现：**
   - 使用 `watch` API 监听 `description` 字段值变化
   - 添加了 `MAX_DESCRIPTION_LENGTH = 5000` 常量
   - 在 `register` 中添加了 `maxLength` 验证
   - 显示字符计数：`{descriptionLength}/{MAX_DESCRIPTION_LENGTH}`

2. **Task 2 - 未来时间验证：**
   - 在 `Input` 组件上添加了 `max` 属性，限制最大值为当前时间
   - 在 `register` 中添加了 `validate` 函数，双重验证未来时间
   - 错误消息："互动时间不能是未来时间"

3. **Task 3 - 状态选择器：**
   - 后端：定义了 `InteractionStatus` 枚举，所有值长度 ≤ 50 字符
   - 后端：使用 `@IsEnum()` 验证状态值
   - 前端：添加了 `InteractionStatus` 枚举（与后端一致）
   - 前端：根据用户角色动态显示状态选项（前端专员3个，后端专员4个）
   - 前端：将状态输入从文本输入改为下拉选择器（select）
   - 前端：在 `defaultValues` 中设置默认状态为 `IN_PROGRESS`

4. **Task 4 - 验证附加信息保存：**
   - 验证了后端服务已正确保存 `description` 和 `status` 字段
   - 验证了数据库表已包含这些字段
   - 更新了 `InteractionResponseDto` 的 `status` 字段类型为 `InteractionStatus`

5. **Task 5 - 测试用例：**
   - 添加了测试：验证状态枚举值（所有4个状态值）
   - 添加了测试：验证描述字段字符数限制（5000字符）
   - 添加了控制器测试：验证状态枚举值在控制器层面被正确验证

### File List

**后端文件：**
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` - 添加 `InteractionStatus` 枚举和验证
- `fenghua-backend/src/interactions/dto/interaction-response.dto.ts` - 更新 `status` 字段类型为 `InteractionStatus`
- `fenghua-backend/src/interactions/interactions.service.spec.ts` - 添加状态枚举和描述字段测试
- `fenghua-backend/src/interactions/interactions.controller.spec.ts` - 添加状态枚举验证测试

**前端文件：**
- `fenghua-frontend/src/interactions/services/interactions.service.ts` - 添加 `InteractionStatus` 枚举，更新接口类型
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 实现字符计数、未来时间验证、状态选择器

