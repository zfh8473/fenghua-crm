# UI设计标准团队培训材料

**培训日期：** 2025-01-03  
**目标受众：** 前端开发团队、UI/UX设计师、产品经理  
**培训时长：** 60分钟

---

## 培训目标

1. 理解峰华CRM系统的UI设计标准
2. 掌握Monday.com风格的设计原则
3. 学会应用响应式设计规范
4. 理解无障碍性要求并能在开发中实践
5. 了解设计标准文档的使用方法

---

## 第一部分：设计系统概述（10分钟）

### 1.1 设计风格：Monday.com

**核心特征：**
- 浅色背景（`#F4F5F8`）
- 圆润友好的字体（Nunito, Poppins, Quicksand）
- 彩色标签系统（蓝、紫、绿、红）
- 卡片式设计（圆角、阴影、边框）

**为什么选择Monday.com风格？**
- 现代、专业、友好
- 适合B2B CRM系统
- 提升用户体验和品牌形象

### 1.2 设计标准文档位置

- **主文档**：`docs/design-system/ui-design-standards.md`
- **颜色审计报告**：`docs/design-system/color-contrast-audit.md`
- **设计Token定义**：`fenghua-frontend/src/styles/theme.ts`

---

## 第二部分：核心设计规范（20分钟）

### 2.1 字体系统

**关键要点：**
- 使用圆润字体提升友好度
- 标签使用层次化字体粗细（`font-semibold`、`font-medium`、`font-normal`）
- 输入框内容使用 `font-normal`（不加粗）
- 菜单项统一使用 `font-medium`

**实践练习：**
```tsx
// ✅ 正确示例
<label className="text-monday-sm font-semibold">产品名称</label>
<Input className="font-normal" />

// ❌ 错误示例
<label className="text-monday-sm font-bold">产品名称</label>
<Input className="font-semibold" />
```

### 2.2 按钮设计

**关键要点：**
- 按钮文本简洁（"创建"而非"创建新产品"）
- 主要按钮：蓝色背景 + 白色文字
- 取消按钮：灰色背景 + 灰色边框
- 危险按钮：红色文字 + 红色边框

**实践练习：**
```tsx
// ✅ 正确示例
<Button variant="primary">创建</Button>
<Button variant="outline" className="bg-gray-50 hover:bg-gray-100">取消</Button>

// ❌ 错误示例
<Button variant="primary">创建新产品</Button>
```

### 2.3 表单设计

**关键要点：**
- 两列布局（桌面端）：`grid grid-cols-1 md:grid-cols-2`
- 标签和输入框间距：`gap-monday-2`
- 错误消息使用 `role="alert"`
- 帮助文本使用 `text-monday-xs text-monday-text-placeholder`

---

## 第三部分：响应式设计（15分钟）

### 3.1 移动端优先原则

**设计流程：**
1. 先设计移动端体验
2. 逐步增强桌面端功能
3. 确保核心功能在所有设备上可用

### 3.2 断点系统

| 断点 | 屏幕宽度 | 使用场景 |
|------|---------|---------|
| sm | ≥640px | 大手机 |
| md | ≥768px | 平板 |
| lg | ≥1024px | 小桌面 |
| xl | ≥1280px | 大桌面 |

**实践示例：**
```tsx
// 响应式网格
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
  {/* 内容 */}
</div>

// 响应式显示/隐藏
<aside className="hidden md:block">
  {/* 侧边栏 */}
</aside>
```

### 3.3 触摸交互规范

- 按钮最小尺寸：44x44px（移动端）
- 点击目标间距：至少8px
- 避免过小的交互元素

---

## 第四部分：无障碍性设计（15分钟）

### 4.1 为什么重要？

- **法律合规**：避免法律风险
- **扩大用户群体**：15%的全球人口有某种形式的残疾
- **提升用户体验**：无障碍设计对所有人都有益

### 4.2 核心要求

**1. 颜色对比度（WCAG AA标准）**
- 正文文本：≥4.5:1
- 大文本：≥3:1

**2. 键盘导航**
- 所有交互元素必须支持键盘
- 焦点状态清晰可见

**3. 屏幕阅读器支持**
- 使用语义化HTML
- 添加ARIA标签
- 图片必须有alt文本

**实践示例：**
```tsx
// ✅ 正确：完整的无障碍性表单
<div className="flex flex-col gap-monday-2">
  <label htmlFor="email" className="text-monday-sm font-semibold">
    邮箱地址
  </label>
  <Input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : "email-help"}
  />
  {hasError ? (
    <span id="email-error" role="alert" className="text-primary-red">
      {errorMessage}
    </span>
  ) : (
    <span id="email-help" className="text-monday-xs text-monday-text-placeholder">
      请输入有效的邮箱地址
    </span>
  )}
</div>
```

### 4.3 开发工具

**已配置的工具：**
- ESLint插件：`eslint-plugin-jsx-a11y`（已安装）
- 配置文件：`.eslintrc.cjs`

**使用方法：**
```bash
# 运行lint检查
npm run lint

# 检查特定文件
npx eslint src/components/Button.tsx
```

---

## 第五部分：常见问题和最佳实践（10分钟）

### 5.1 常见错误

**错误1：所有标签使用相同字体粗细**
```tsx
// ❌ 错误
<label className="text-monday-sm font-bold">所有标签</label>

// ✅ 正确
<label className="text-monday-sm font-semibold">重要标签</label>
<label className="text-monday-sm font-medium">次要标签</label>
```

**错误2：输入框内容加粗**
```tsx
// ❌ 错误
<Input className="font-semibold" />

// ✅ 正确
<Input className="font-normal" />
```

**错误3：缺少无障碍性属性**
```tsx
// ❌ 错误
<button onClick={handleClick}>按钮</button>

// ✅ 正确
<button 
  onClick={handleClick}
  aria-label="创建新产品"
  className="focus:outline-none focus:ring-2 focus:ring-primary-blue"
>
  创建
</button>
```

### 5.2 最佳实践检查清单

**开发新组件时：**
- [ ] 使用设计标准中定义的字体、颜色、间距
- [ ] 确保响应式设计（移动端测试）
- [ ] 添加无障碍性属性（ARIA、键盘支持）
- [ ] 运行ESLint检查（`npm run lint`）
- [ ] 检查颜色对比度
- [ ] 测试键盘导航

**代码审查时：**
- [ ] 是否符合UI设计标准？
- [ ] 是否支持响应式？
- [ ] 是否满足无障碍性要求？
- [ ] ESLint检查是否通过？

---

## 第六部分：资源和使用指南（5分钟）

### 6.1 文档资源

1. **UI设计标准文档**
   - 位置：`docs/design-system/ui-design-standards.md`
   - 包含：所有设计规范、代码示例、最佳实践

2. **颜色对比度审计报告**
   - 位置：`docs/design-system/color-contrast-audit.md`
   - 包含：颜色对比度测试结果、需要修复的问题

3. **设计Token定义**
   - 位置：`fenghua-frontend/src/styles/theme.ts`
   - 包含：所有颜色、间距、字体、阴影等token

### 6.2 工具资源

**在线工具：**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Contrast Ratio: https://contrast-ratio.com/

**浏览器扩展：**
- axe DevTools
- WAVE (Web Accessibility Evaluation Tool)

**开发工具：**
- ESLint + eslint-plugin-jsx-a11y（已配置）
- Lighthouse (Chrome DevTools)

### 6.3 如何提出改进建议

1. 在GitHub上创建Issue
2. 或直接更新文档并提交PR
3. 更新"更新日志"章节

---

## 实践练习

### 练习1：修复无障碍性问题

给定代码：
```tsx
<div onClick={handleClick}>创建产品</div>
```

请修复为符合无障碍性标准的代码。

### 练习2：应用响应式设计

给定代码：
```tsx
<div className="grid grid-cols-3 gap-4">
  {/* 卡片内容 */}
</div>
```

请修改为响应式布局。

### 练习3：应用字体层次

给定代码：
```tsx
<label className="text-monday-sm font-bold">产品名称</label>
<Input className="font-semibold" />
```

请修改为符合设计标准的代码。

---

## 常见问题解答（FAQ）

**Q1: 如果设计标准中没有覆盖的场景怎么办？**
A: 参考最相似的模式，保持一致性。如果不确定，咨询Sally（UX Designer）或团队。

**Q2: 如何平衡设计标准和开发效率？**
A: 使用已定义的组件和模式，避免重复造轮子。设计标准的目的就是提高效率。

**Q3: 无障碍性检查太严格，可以忽略吗？**
A: 不可以。无障碍性是法律要求和用户体验的基础。如果遇到特殊情况，与团队讨论解决方案。

**Q4: 响应式设计需要测试所有断点吗？**
A: 至少测试移动端（375px）、平板（768px）和桌面（1024px+）。使用浏览器开发者工具测试。

---

## 后续行动

1. **立即行动**：
   - 阅读完整的UI设计标准文档
   - 运行 `npm run lint` 检查现有代码
   - 修复已识别的无障碍性问题

2. **本周内**：
   - 修复颜色对比度问题（占位符、成功、警告颜色）
   - 为新开发的组件应用设计标准
   - 完成实践练习

3. **持续改进**：
   - 代码审查时检查设计标准符合性
   - 定期更新设计标准文档
   - 分享最佳实践和经验

---

## 联系和支持

- **设计问题**：咨询Sally（UX Designer）
- **技术问题**：咨询Amelia（Developer）或Winston（Architect）
- **标准更新**：参考文档的"贡献指南"章节

---

**培训完成！** 如有问题，随时咨询团队。



