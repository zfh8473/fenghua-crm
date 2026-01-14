# BMAD 工作流下一步指引

**生成时间：** 2026-01-14  
**当前阶段：** Phase 4 (Implementation)  
**当前 Epic：** Epic 10 (互动记录评论功能)

---

## 📊 当前项目状态

### Epic 10 进度

| Story | 状态 | 说明 |
|-------|------|------|
| **10-1** | ✅ **done** | 互动记录评论（按角色）- 已完成实现和代码审查 |
| **10-2** | 📝 **ready-for-dev** | 互动记录评论历史查看（实时更新）- 已创建，准备开发 |
| **10-3** | 📋 **backlog** | 评论编辑和删除 - 待创建 |

---

## 🎯 BMAD 标准工作流序列

根据 BMAD 工作流文档，Story 的标准生命周期如下：

```
backlog → ready-for-dev → in-progress → review → done
```

### Story 生命周期说明

1. **backlog** - Story 在 Epic 中定义，但尚未创建 Story 文件
2. **ready-for-dev** - Story 文件已通过 `create-story` 创建
3. **in-progress** - 开发人员通过 `dev-story` 开始实现
4. **review** - 实现完成，等待 `code-review`
5. **done** - 代码审查通过，Story 完成

---

## ✅ 推荐下一步操作

### 选项 A：继续开发 Story 10-2（推荐）

**当前状态：** Story 10-2 处于 `ready-for-dev` 状态

**标准流程：**

1. **（可选）验证 Story 质量**
   ```
   validate-create-story
   ```
   - 检查 Story 文档的完整性和质量
   - 识别需要改进的地方
   - **注意：** 这是可选的，但推荐执行

2. **开始实现 Story**
   ```
   dev-story
   ```
   - 实现所有任务和子任务
   - 编写测试代码
   - 更新 Story 文件状态为 `in-progress` → `review`

3. **代码审查**
   ```
   code-review
   ```
   - 进行代码质量审查
   - 识别问题和改进建议
   - 修复 HIGH 和 MEDIUM 优先级问题
   - 更新 Story 文件状态为 `done`

4. **（可选）测试验证**
   - 运行数据库迁移
   - 进行功能测试
   - 验证所有验收标准

---

### 选项 B：创建 Story 10-3

**当前状态：** Story 10-3 处于 `backlog` 状态

**操作：**
```
create-story
```

**说明：**
- 从 Epic 10 中提取 Story 10-3（评论编辑和删除）
- 创建完整的 Story 文档
- 更新 `sprint-status.yaml` 状态为 `ready-for-dev`

**后续流程：**
- 与选项 A 相同（validate-create-story → dev-story → code-review）

---

### 选项 C：测试 Story 10-1

**当前状态：** Story 10-1 已完成实现和代码审查

**操作：**
- 运行数据库迁移：`fenghua-backend/migrations/034-create-interaction-comments-table.sql`
- 启动后端和前端服务
- 进行功能测试：
  - 创建评论
  - 查看评论列表
  - 验证权限控制
  - 验证 XSS 防护

---

### 选项 D：提交代码到 GitHub

**当前状态：** Story 10-1 已完成，代码已修复所有审查问题

**操作：**
```bash
git add .
git commit -m "feat: 实现 Story 10-1 互动记录评论功能

- 添加评论创建功能（按角色权限）
- 实现评论列表查看和分页
- 添加 XSS 防护和输入验证
- 实现用户信息显示
- 修复代码审查中发现的所有问题"
git push origin main
```

---

## 📋 BMAD 工作流命令参考

### 核心工作流命令

| 工作流 | 命令 | 用途 | 执行者 |
|--------|------|------|--------|
| **create-story** | `create-story` | 从 Epic 创建 Story 文件 | SM |
| **validate-create-story** | `validate-create-story` | 验证 Story 质量（可选） | SM/DEV |
| **dev-story** | `dev-story` | 实现 Story 的所有任务 | DEV |
| **code-review** | `code-review` | 代码质量审查 | DEV |
| **sprint-status** | `sprint-status` | 查看当前 Sprint 状态 | SM/DEV |

### 辅助工作流命令

| 工作流 | 命令 | 用途 |
|--------|------|------|
| **retrospective** | `retrospective` | Epic 完成后的回顾 |
| **correct-course** | `correct-course` | 处理重大变更 |
| **workflow-status** | `workflow-status` | 查看跨阶段路由和项目级路径 |

---

## 🎯 我的推荐

基于当前状态，我推荐以下顺序：

### 推荐方案 1：继续开发流程（标准流程）

1. **立即执行：** `dev-story`（Story 10-2）
   - Story 10-2 已经处于 `ready-for-dev` 状态
   - 可以立即开始实现实时更新功能
   - 预计工作量：中等（主要是前端轮询逻辑）

2. **完成后：** `code-review`（Story 10-2）
   - 确保代码质量

3. **然后：** `create-story`（Story 10-3）
   - 创建评论编辑和删除功能

4. **最后：** 测试和提交
   - 测试所有 Story
   - 提交代码到 GitHub

### 推荐方案 2：先完善再继续（保守流程）

1. **立即执行：** 测试 Story 10-1
   - 确保已完成的功能正常工作
   - 运行数据库迁移
   - 验证功能

2. **然后：** `dev-story`（Story 10-2）
   - 实现实时更新功能

3. **后续：** 与方案 1 相同

---

## 📝 注意事项

### Story 10-2 的特殊性

- **简化版 Story：** Story 10-2 是简化版，专注于实时更新功能
- **核心功能已实现：** 评论历史查看功能已在 Story 10-1 中实现
- **主要任务：** 实现轮询机制和新评论通知

### 代码审查后的修复

- Story 10-1 的所有代码审查问题已修复
- 包括：用户信息显示、XSS 防护、输入验证、性能优化等
- 代码已准备好提交

---

## 🚀 快速开始

**如果你想立即开始开发 Story 10-2，运行：**

```
dev-story
```

**如果你想先验证 Story 10-2 的质量，运行：**

```
validate-create-story
```

**如果你想查看当前 Sprint 状态，运行：**

```
sprint-status
```

---

## 📚 参考文档

- [BMAD BMM 工作流文档](_bmad/bmm/docs/workflows-implementation.md)
- [Story 生命周期说明](_bmad/bmm/docs/glossary.md#story-status-progression)
- [当前 Sprint 状态](_bmad-output/implementation-artifacts/sprint-status.yaml)
- [Story 10-1 文档](_bmad-output/implementation-artifacts/stories/10-1-interaction-record-comments.md)
- [Story 10-2 文档](_bmad-output/implementation-artifacts/stories/10-2-interaction-record-comment-history.md)

---

**生成时间：** 2026-01-14  
**下次更新：** 完成 Story 10-2 后
