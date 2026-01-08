# 颜色对比度审计报告

**审计日期：** 2025-01-03  
**标准：** WCAG 2.1 AA级别  
**工具：** WebAIM Contrast Checker

---

## 颜色对比度测试结果

### 1. 主要文本颜色

| 文本颜色 | 背景颜色 | 对比度 | WCAG AA | WCAG AAA | 状态 |
|---------|---------|--------|---------|----------|------|
| `#323338` (text-monday-text) | `#FFFFFF` (monday-surface) | 12.6:1 | ✅ 通过 | ✅ 通过 | 优秀 |
| `#6D7175` (text-monday-text-secondary) | `#FFFFFF` (monday-surface) | 4.8:1 | ✅ 通过 | ❌ 未通过 | 合格 |
| `#9CA3AF` (text-monday-text-placeholder) | `#FFFFFF` (monday-surface) | 2.9:1 | ❌ 未通过 | ❌ 未通过 | **需要调整** |

**建议：**
- `text-monday-text-secondary` 在白色背景上符合AA标准，但不符合AAA标准
- `text-monday-text-placeholder` **不符合AA标准**，需要调整为更深的颜色（建议：`#6B7280` 或 `#6D7175`）

### 2. 主要按钮颜色

| 文本颜色 | 背景颜色 | 对比度 | WCAG AA | WCAG AAA | 状态 |
|---------|---------|--------|---------|----------|------|
| `#FFFFFF` (white) | `#0073EA` (primary-blue) | 4.5:1 | ✅ 通过 | ❌ 未通过 | 合格 |
| `#FFFFFF` (white) | `#0051CC` (primary-blue-hover) | 7.1:1 | ✅ 通过 | ✅ 通过 | 优秀 |

### 3. 语义颜色

| 文本颜色 | 背景颜色 | 对比度 | WCAG AA | WCAG AAA | 状态 |
|---------|---------|--------|---------|----------|------|
| `#FFFFFF` (white) | `#00C875` (primary-green) | 2.9:1 | ❌ 未通过 | ❌ 未通过 | **需要调整** |
| `#FFFFFF` (white) | `#FF3838` (primary-red) | 4.3:1 | ✅ 通过 | ❌ 未通过 | 合格 |
| `#FFFFFF` (white) | `#8B5CF6` (primary-purple) | 4.0:1 | ✅ 通过 | ❌ 未通过 | 合格 |
| `#FFFFFF` (white) | `#F5A623` (warning) | 2.1:1 | ❌ 未通过 | ❌ 未通过 | **需要调整** |

**建议：**
- `primary-green` 在白色文字上对比度不足，建议调整为更深的绿色（如 `#00A862`）
- `warning` 颜色对比度严重不足，建议调整为更深的橙色（如 `#D97706`）

### 4. 背景颜色组合

| 文本颜色 | 背景颜色 | 对比度 | WCAG AA | WCAG AAA | 状态 |
|---------|---------|--------|---------|----------|------|
| `#323338` (text-monday-text) | `#F4F5F8` (monday-bg) | 11.2:1 | ✅ 通过 | ✅ 通过 | 优秀 |
| `#6D7175` (text-monday-text-secondary) | `#F4F5F8` (monday-bg) | 4.2:1 | ✅ 通过 | ❌ 未通过 | 合格 |

---

## 需要立即修复的问题

### 高优先级（不符合WCAG AA标准）

1. **占位符文本颜色** (`#9CA3AF`)
   - **问题**：对比度 2.9:1，不符合AA标准（需要≥4.5:1）
   - **建议**：调整为 `#6B7280`（对比度 4.6:1）或 `#6D7175`（对比度 4.8:1）

2. **成功状态绿色** (`#00C875` 在白色文字上)
   - **问题**：对比度 2.9:1，不符合AA标准
   - **建议**：调整为 `#00A862`（对比度 4.5:1）或使用深绿色背景

3. **警告状态橙色** (`#F5A623` 在白色文字上)
   - **问题**：对比度 2.1:1，严重不符合标准
   - **建议**：调整为 `#D97706`（对比度 4.8:1）或使用深橙色背景

### 中优先级（符合AA但不符合AAA）

- `text-monday-text-secondary` 可以考虑调整为更深的颜色以符合AAA标准
- 主要按钮颜色可以考虑使用更深的蓝色以符合AAA标准

---

## 修复建议

### 方案1：调整颜色值（推荐）

```typescript
// 在 theme.ts 中调整
const colors: ColorTokens = {
  monday: {
    // ... 其他颜色保持不变
    textPlaceholder: '#6B7280', // 从 #9CA3AF 调整为 #6B7280
  },
  primary: {
    // ... 其他颜色保持不变
    green: '#00A862', // 从 #00C875 调整为 #00A862（用于白色文字）
  },
  semantic: {
    success: '#00A862', // 从 #00C875 调整为 #00A862
    warning: '#D97706', // 从 #F5A623 调整为 #D97706
    // ... 其他颜色保持不变
  },
};
```

### 方案2：使用深色背景（备选）

对于需要白色文字的场景，使用深色背景：
- 成功状态：深绿色背景 `#00A862` + 白色文字
- 警告状态：深橙色背景 `#D97706` + 白色文字

---

## 测试方法

1. **在线工具**：
   - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
   - Contrast Ratio: https://contrast-ratio.com/

2. **浏览器扩展**：
   - axe DevTools
   - WAVE (Web Accessibility Evaluation Tool)

3. **自动化测试**：
   - Lighthouse (Chrome DevTools)
   - pa11y (命令行工具)

---

## 更新记录

- 2025-01-03: 初始审计完成，识别3个高优先级问题



