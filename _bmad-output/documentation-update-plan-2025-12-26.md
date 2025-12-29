# 文档更新计划：移除 Twenty CRM 依赖

**项目：** fenghua-crm  
**日期：** 2025-12-26  
**目标：** 在执行重构之前，更新所有文档以反映移除 Twenty CRM 依赖的决策

---

## 📋 文档分类

### 类别 A：核心架构文档（必须更新）

这些文档描述了系统架构，需要更新以反映新的技术栈。

#### A1. `docs/api-integration-architecture.md`
**状态：** 需要完全重写  
**原因：** 当前文档描述的是 API 集成架构（依赖 Twenty CRM），需要改为原生技术栈架构  
**行动：** 重写为原生技术栈架构文档

#### A2. `docs/infrastructure-decisions.md`
**状态：** 需要更新  
**原因：** 包含 Twenty CRM 绑定决策，需要更新为移除 Twenty 的决策  
**行动：** 更新决策表，添加重构决策记录

#### A3. `_bmad-output/architecture.md`
**状态：** 需要更新  
**原因：** 主架构文档，需要反映新的架构决策  
**行动：** 更新架构图和技术栈说明

#### A4. `_bmad-output/prd.md`
**状态：** 需要更新  
**原因：** PRD 中提到选择 Twenty CRM 的理由，需要更新为移除 Twenty 的决策  
**行动：** 更新"为什么选择 Twenty CRM"部分，添加重构决策说明

---

### 类别 B：Twenty CRM 专用文档（标记为过时或删除）

这些文档专门描述 Twenty CRM 的集成和使用，在移除依赖后不再需要。

#### B1. 可以删除的文档（不再需要）

- `docs/twenty-user-management-api.md` - Twenty API 文档
- `docs/twenty-auth-integration.md` - Twenty 认证集成
- `docs/twenty-api-data-source-clarification.md` - Twenty API 数据源说明
- `docs/twenty-ai-integration-guide.md` - Twenty AI 集成指南
- `docs/twenty-ai-features-scenarios.md` - Twenty AI 功能场景
- `docs/twenty-evaluation-report.md` - Twenty 评估报告（历史参考）
- `docs/twenty-evaluation-checklist.md` - Twenty 评估清单（历史参考）
- `docs/twenty-evaluation-log.md` - Twenty 评估日志（历史参考）
- `docs/twenty-quick-start.md` - Twenty 快速开始
- `docs/twenty-quick-test-guide.md` - Twenty 快速测试指南
- `docs/twenty-deployment-guide.md` - Twenty 部署指南
- `docs/docker-installation-guide.md` - Docker 安装指南（如果只用于 Twenty）

**行动：** 移动到 `docs/archive/twenty-crm/` 目录（保留作为历史参考）

#### B2. 需要标记为过时的文档（保留作为历史参考）

- `docs/architecture-compliance-update.md` - 架构合规更新（历史参考）
- `docs/architecture-migration-summary.md` - 架构迁移摘要（历史参考）
- `docs/license-compliance-guide.md` - 许可证合规指南（如果不再需要 AGPL 合规）

**行动：** 在文档顶部添加过时标记

---

### 类别 C：需要更新的开发文档

这些文档包含开发指南，需要更新以反映新的技术栈。

#### C1. `docs/environment-setup-guide.md`
**状态：** 需要更新  
**原因：** 可能包含 Twenty CRM 环境变量和设置  
**行动：** 移除 Twenty 相关配置，更新为原生技术栈配置

#### C2. `docs/quick-start-guide.md`
**状态：** 需要更新  
**原因：** 可能包含启动 Twenty CRM 的步骤  
**行动：** 移除 Docker 和 Twenty 启动步骤

#### C3. `docs/database-schema-design.md`
**状态：** 需要更新  
**原因：** 可能包含对 Twenty 数据库的引用  
**行动：** 更新为新的数据库 Schema

#### C4. `docs/customization-strategy.md`
**状态：** 需要更新  
**原因：** 可能描述基于 Twenty 的定制策略  
**行动：** 更新为原生技术栈的定制策略

---

### 类别 D：测试和 API 文档（需要更新或删除）

#### D1. 可以删除的测试文档（不再相关）

- `docs/api-test-results.md` - Twenty API 测试结果
- `docs/api-test-results-final.md` - Twenty API 最终测试结果
- `docs/api-test-summary.md` - Twenty API 测试摘要
- `docs/api-testing-guide.md` - Twenty API 测试指南
- `docs/token-acquisition-guide.md` - Token 获取指南（Twenty）
- `docs/token-extraction-tips.md` - Token 提取技巧（Twenty）
- `docs/token-location-notes.md` - Token 位置说明（Twenty）
- `docs/get-token-from-network.md` - 从网络获取 Token（Twenty）
- `docs/test-users-service-guide.md` - 用户服务测试指南（如果基于 Twenty）

**行动：** 移动到 `docs/archive/twenty-crm/` 目录

#### D2. 需要更新的测试文档

- `docs/unit-testing-summary.md` - 单元测试摘要（可能需要更新）
- `docs/migration-testing-guide.md` - 迁移测试指南（可能需要更新）

**行动：** 检查并更新

---

### 类别 E：实现文档（需要更新）

#### E1. `_bmad-output/implementation-artifacts/stories/1-1-twenty-crm-initial-deployment.md`
**状态：** 需要标记为过时  
**原因：** 描述 Twenty CRM 初始部署，现在不再需要  
**行动：** 在文档顶部添加过时标记，说明已被重构计划替代

#### E2. 其他 Story 文档
**状态：** 需要检查  
**原因：** 可能包含对 Twenty 的引用  
**行动：** 检查并更新相关引用

---

## 📝 更新计划执行步骤

### 步骤 1：创建归档目录

```bash
mkdir -p docs/archive/twenty-crm
```

### 步骤 2：移动过时文档

将类别 B1 和 D1 的文档移动到归档目录。

### 步骤 3：更新核心架构文档

按顺序更新：
1. `docs/api-integration-architecture.md` - 重写为原生技术栈架构
2. `docs/infrastructure-decisions.md` - 更新决策表
3. `_bmad-output/architecture.md` - 更新架构图
4. `_bmad-output/prd.md` - 更新决策说明

### 步骤 4：更新开发文档

更新类别 C 的文档。

### 步骤 5：标记过时文档

在类别 B2 和 E1 的文档顶部添加过时标记。

### 步骤 6：创建文档索引

创建 `docs/README.md` 或更新现有索引，说明文档结构。

---

## 📄 具体更新内容

### 更新 1：`docs/api-integration-architecture.md`

**新标题：** 原生技术栈架构详细说明

**主要更改：**
- 移除 Twenty CRM 组件
- 更新架构图为原生技术栈
- 更新数据流示例
- 更新数据库设计（移除共享数据库方案）
- 更新 API 设计（移除 GraphQL API 调用）
- 更新部署架构（Vercel 原生支持）

### 更新 2：`docs/infrastructure-decisions.md`

**主要更改：**
- 更新决策表：
  - "Twenty CRM 绑定" → "移除 Twenty CRM，使用原生技术栈"
  - 理由：支持 Vercel 部署，简化架构，移除集成问题
- 添加重构决策记录
- 更新"未来考虑"部分

### 更新 3：`_bmad-output/architecture.md`

**主要更改：**
- 更新架构图（移除 Twenty CRM）
- 更新技术栈说明
- 更新组件说明
- 更新数据流

### 更新 4：`_bmad-output/prd.md`

**主要更改：**
- 更新"为什么选择 Twenty CRM"部分：
  - 添加说明：已决定移除 Twenty CRM 依赖
  - 添加重构决策的理由
- 更新技术栈说明

### 更新 5：`docs/environment-setup-guide.md`

**主要更改：**
- 移除 `TWENTY_API_URL`
- 移除 `TWENTY_API_TOKEN`
- 移除 `TWENTY_ORIGIN`
- 移除 `TWENTY_DATABASE_URL`
- 保留 `DATABASE_URL`（fenghua-crm 数据库）
- 添加 `JWT_SECRET`

### 更新 6：`docs/quick-start-guide.md`

**主要更改：**
- 移除 Docker 启动步骤
- 移除 Twenty CRM 启动步骤
- 更新为直接启动后端和前端

---

## 🗂️ 文档归档结构

```
docs/
├── archive/
│   └── twenty-crm/
│       ├── twenty-user-management-api.md
│       ├── twenty-auth-integration.md
│       ├── twenty-api-data-source-clarification.md
│       ├── twenty-ai-integration-guide.md
│       ├── twenty-ai-features-scenarios.md
│       ├── twenty-evaluation-report.md
│       ├── twenty-evaluation-checklist.md
│       ├── twenty-evaluation-log.md
│       ├── twenty-quick-start.md
│       ├── twenty-quick-test-guide.md
│       ├── twenty-deployment-guide.md
│       ├── api-test-results.md
│       ├── api-test-results-final.md
│       ├── api-test-summary.md
│       ├── api-testing-guide.md
│       ├── token-acquisition-guide.md
│       ├── token-extraction-tips.md
│       ├── token-location-notes.md
│       ├── get-token-from-network.md
│       └── README.md (说明这些是历史参考文档)
```

---

## ✅ 验收标准

### 文档完整性
- ✅ 所有核心架构文档已更新
- ✅ 所有过时文档已归档或标记
- ✅ 文档索引已更新

### 文档准确性
- ✅ 所有文档反映新的技术栈
- ✅ 所有文档移除 Twenty CRM 引用
- ✅ 所有文档更新为 Vercel 部署方案

### 文档可访问性
- ✅ 历史文档可以访问（归档目录）
- ✅ 当前文档清晰明确
- ✅ 文档结构合理

---

## 📅 执行时间线

| 步骤 | 任务 | 时间 | 优先级 |
|------|------|------|--------|
| 1 | 创建归档目录 | 5 分钟 | 高 |
| 2 | 移动过时文档 | 10 分钟 | 高 |
| 3 | 更新核心架构文档 | 2-3 小时 | 高 |
| 4 | 更新开发文档 | 1-2 小时 | 中 |
| 5 | 标记过时文档 | 30 分钟 | 中 |
| 6 | 创建文档索引 | 30 分钟 | 低 |

**总计：4-6 小时**

---

## 📝 过时文档标记模板

在需要标记为过时的文档顶部添加：

```markdown
> ⚠️ **文档已过时**
> 
> 本文档描述的是基于 Twenty CRM 的架构，该项目已决定移除 Twenty CRM 依赖。
> 
> **状态：** 已过时（保留作为历史参考）  
> **替代文档：** `docs/api-integration-architecture.md`（原生技术栈架构）  
> **重构计划：** `_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`
> 
> **最后更新：** 2025-12-26
> 
> ---
```

---

**文档版本：** 1.0  
**最后更新：** 2025-12-26  
**状态：** 待执行

