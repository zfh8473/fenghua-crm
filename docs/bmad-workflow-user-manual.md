# BMAD 工作流详细用户手册

**版本：** 1.0  
**日期：** 2025-12-25  
**项目：** fenghua-crm

---

## 📋 目录

1. [BMAD 简介](#bmad-简介)
2. [BMAD 架构概览](#bmad-架构概览)
3. [核心概念](#核心概念)
4. [工作流阶段](#工作流阶段)
5. [代理（Agents）使用指南](#代理agents使用指南)
6. [工作流（Workflows）使用指南](#工作流workflows使用指南)
7. [任务（Tasks）使用指南](#任务tasks使用指南)
8. [工具（Tools）使用指南](#工具tools使用指南)
9. [最佳实践](#最佳实践)
10. [常见问题](#常见问题)

---

## BMAD 简介

**BMAD (Business Model Architecture Design)** 是一个结构化的项目管理和开发方法论，通过 AI 代理（Agents）、工作流（Workflows）、任务（Tasks）和工具（Tools）来指导软件开发的全生命周期。

### BMAD 的核心价值

- **结构化流程**：从需求分析到实施，提供清晰的阶段划分
- **角色驱动**：通过专业代理（PM、架构师、开发、UX 等）确保各阶段质量
- **文档驱动**：自动生成和维护项目文档（PRD、架构、Epics、Stories 等）
- **可追溯性**：完整记录项目进展和决策过程

---

## BMAD 架构概览

### 模块结构

BMAD 分为两个主要模块：

1. **CORE（核心模块）**
   - 提供基础代理和工作流引擎
   - 包含通用工具和任务

2. **BMM（业务模型方法）**
   - 提供完整的软件开发工作流
   - 包含专业代理（PM、架构师、开发、UX 等）
   - 包含阶段化工作流（规划、设计、实施、测试等）

### 文件结构

```
.cursor/rules/bmad/
├── core/                    # 核心模块
│   ├── agents/             # 核心代理
│   ├── tasks/              # 核心任务
│   ├── tools/              # 核心工具
│   └── workflows/          # 核心工作流
├── bmm/                     # 业务模型方法
│   ├── agents/             # 专业代理
│   ├── workflows/          # 阶段化工作流
│   └── ...
└── index.mdc               # 索引文件
```

### 输出结构

```
_bmad-output/
├── prd.md                          # 产品需求文档
├── architecture.md                 # 架构设计文档
├── ux-design-specification.md      # UX 设计规范
├── epics.md                        # Epics 和 Stories
├── epics-summary.md                # Epics 摘要
├── bmm-workflow-status.yaml        # 工作流状态跟踪
├── implementation-readiness-report-*.md  # 实施就绪报告
└── implementation-artifacts/       # 实施产物
    ├── sprint-status.yaml          # Sprint 状态
    └── stories/                    # Story 文件
        ├── 1-1-*.md
        ├── 1-2-*.md
        └── ...
```

---

## 核心概念

### 1. 代理（Agents）

代理是扮演特定专业角色的 AI 助手，每个代理都有明确的职责和技能：

- **PM（产品经理）**：需求分析、PRD 编写、Epics/Stories 创建
- **架构师（Architect）**：系统架构设计、技术决策
- **开发（Dev）**：代码实施、Story 开发
- **UX 设计师**：用户体验设计、界面设计规范
- **分析师（Analyst）**：需求分析、业务分析
- **测试架构师（TEA）**：测试策略、测试设计
- **技术写作者**：文档编写、技术文档

### 2. 工作流（Workflows）

工作流是结构化的流程，指导完成特定任务：

- **规划阶段**：产品简介、PRD、研究
- **设计阶段**：UX 设计、架构设计、Epics/Stories
- **实施阶段**：Sprint 规划、Story 开发、代码审查
- **测试阶段**：测试策略、测试设计、测试自动化

### 3. 任务（Tasks）

任务是可重用的操作单元，可以在多个工作流中使用。

### 4. 工具（Tools）

工具提供特定功能，如文档分片、索引等。

---

## 工作流阶段

BMAD BMM 工作流分为以下阶段：

### 阶段 1：规划（Planning）

**目标**：理解需求，定义产品范围

**主要工作流**：
- `create-product-brief` - 创建产品简介
- `create-prd` - 创建产品需求文档（PRD）
- `research` - 研究和分析

**输出**：
- `_bmad-output/prd.md` - 产品需求文档

### 阶段 2：设计（Design）

**目标**：设计系统架构和用户体验

**主要工作流**：
- `create-ux-design` - 创建 UX 设计规范
- `create-architecture` - 创建架构设计文档
- `create-epics-and-stories` - 创建 Epics 和 Stories

**输出**：
- `_bmad-output/ux-design-specification.md` - UX 设计规范
- `_bmad-output/architecture.md` - 架构设计文档
- `_bmad-output/epics.md` - Epics 和 Stories

### 阶段 3：实施准备（Implementation Readiness）

**目标**：验证实施就绪性

**主要工作流**：
- `check-implementation-readiness` - 检查实施就绪性

**输出**：
- `_bmad-output/implementation-readiness-report-*.md` - 实施就绪报告

### 阶段 4：实施（Implementation）

**目标**：开发功能，实施 Stories

**主要工作流**：
- `sprint-planning` - Sprint 规划
- `create-story` - 创建 Story 文件
- 'validate-create-story
- `dev-story` - 开发 Story
- `code-review` - 代码审查
- `sprint-status` - Sprint 状态跟踪
- `retrospective` - 回顾

**输出**：
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Sprint 状态
- `_bmad-output/implementation-artifacts/stories/*.md` - Story 文件

### 阶段 5：测试（Testing）

**目标**：测试策略和测试实施

**主要工作流**：
- `testarch-framework` - 测试框架设计
- `testarch-test-design` - 测试设计
- `testarch-automate` - 测试自动化
- `testarch-ci` - CI/CD 集成

---

## 代理（Agents）使用指南

### 如何激活代理

在 Cursor 中，通过引用代理规则来激活：

```
@bmad/bmm/agents/pm
```

或者使用完整路径：

```
@bmad/bmm/agents/pm.mdc
```

### 代理列表

#### 1. PM（产品经理）

**用途**：需求分析、PRD 编写、Epics/Stories 创建

**激活方式**：
```
@bmad/bmm/agents/pm
```

**主要职责**：
- 编写产品需求文档（PRD）
- 创建 Epics 和 Stories
- 管理产品 backlog
- 协调跨团队沟通

#### 2. Architect（架构师）

**用途**：系统架构设计、技术决策

**激活方式**：
```
@bmad/bmm/agents/architect
```

**主要职责**：
- 设计系统架构
- 做出技术决策（ADR）
- 评估技术方案
- 定义技术标准

#### 3. Dev（开发）

**用途**：代码实施、Story 开发

**激活方式**：
```
@bmad/bmm/agents/dev
```

**主要职责**：
- 实施 Stories
- 编写代码
- 进行代码审查
- 修复 bug

#### 4. UX Designer（UX 设计师）

**用途**：用户体验设计、界面设计规范

**激活方式**：
```
@bmad/bmm/agents/ux-designer
```

**主要职责**：
- 设计用户体验
- 创建 UI/UX 规范
- 设计用户界面
- 进行可用性测试

#### 5. Analyst（分析师）

**用途**：需求分析、业务分析

**激活方式**：
```
@bmad/bmm/agents/analyst
```

**主要职责**：
- 分析业务需求
- 进行需求调研
- 编写需求文档
- 支持 PM 工作

#### 6. TEA（测试架构师）

**用途**：测试策略、测试设计

**激活方式**：
```
@bmad/bmm/agents/tea
```

**主要职责**：
- 设计测试策略
- 创建测试框架
- 设计测试用例
- 实施测试自动化

#### 7. Tech Writer（技术写作者）

**用途**：文档编写、技术文档

**激活方式**：
```
@bmad/bmm/agents/tech-writer
```

**主要职责**：
- 编写技术文档
- 维护项目文档
- 编写用户手册
- 文档审查

#### 8. SM（Scrum Master）

**用途**：Sprint 管理、流程协调

**激活方式**：
```
@bmad/bmm/agents/sm
```

**主要职责**：
- 管理 Sprint
- 协调团队工作
- 组织回顾会议
- 跟踪进度

### 代理使用示例

**示例 1：激活 PM 代理并创建 PRD**

```
@bmad/bmm/agents/pm

请帮我创建产品需求文档，项目是一个 CRM 系统。
```

**示例 2：激活架构师并设计架构**

```
@bmad/bmm/agents/architect

基于 PRD，请设计系统架构。
```

**示例 3：激活开发并实施 Story**

```
@bmad/bmm/agents/dev

请开始实施 Story 1.2：用户认证系统。
```

---

## 工作流（Workflows）使用指南

### 如何激活工作流

在 Cursor 中，通过引用工作流规则来激活：

```
@bmad/bmm/workflows/create-prd
```

### 主要工作流详解

BMAD BMM 提供了丰富的工作流，按阶段分类如下：

---

## 📋 阶段 1：分析和规划（Analysis & Planning）

### 1. create-product-brief（创建产品简介）

**用途**：创建产品简介文档，快速定义产品范围和目标

**激活方式**：
```
@bmad/bmm/workflows/create-product-brief
```

**使用场景**：
- 项目启动阶段
- 需要快速定义产品范围和核心价值

**输出**：
- 产品简介文档

**相关代理**：PM, Analyst

---

### 2. research（研究）

**用途**：进行市场、领域和技术研究，为产品决策提供依据

**激活方式**：
```
@bmad/bmm/workflows/research
```

**使用场景**：
- 需要了解市场趋势
- 需要技术选型研究
- 需要领域知识调研

**输出**：
- 研究报告（市场、技术、领域）

**相关代理**：Analyst, Architect

---

### 3. create-prd（创建产品需求文档）

**用途**：创建详细的产品需求文档，包含功能和非功能需求

**激活方式**：
```
@bmad/bmm/workflows/create-prd
```

**使用场景**：
- 完成产品简介后
- 需要详细的功能和非功能需求定义

**输出**：
- `_bmad-output/prd.md` - 产品需求文档

**示例**：
```
@bmad/bmm/workflows/create-prd

基于产品简介，请创建详细的 PRD。
```

**相关代理**：PM

---

## 🎨 阶段 2：设计（Design）

### 4. create-ux-design（创建 UX 设计规范）

**用途**：创建用户体验设计规范，定义界面和交互标准

**激活方式**：
```
@bmad/bmm/workflows/create-ux-design
```

**使用场景**：
- PRD 完成后
- 需要设计用户界面和体验

**输出**：
- `_bmad-output/ux-design-specification.md` - UX 设计规范

**相关代理**：UX Designer

---

### 5. create-architecture（创建架构设计文档）

**用途**：创建系统架构设计文档，包含技术决策和架构模式

**激活方式**：
```
@bmad/bmm/workflows/create-architecture
```

**使用场景**：
- PRD 和 UX 设计完成后
- 需要设计技术架构和技术决策

**输出**：
- `_bmad-output/architecture.md` - 架构设计文档
- ADR（架构决策记录）

**相关代理**：Architect

---

### 6. create-epics-and-stories（创建 Epics 和 Stories）

**用途**：将需求分解为 Epics 和 Stories，便于实施管理

**激活方式**：
```
@bmad/bmm/workflows/create-epics-and-stories
```

**使用场景**：
- 架构设计完成后
- 需要将需求分解为可实施的 Stories

**输出**：
- `_bmad-output/epics.md` - Epics 和 Stories
- `_bmad-output/epics-summary.md` - Epics 摘要

**相关代理**：PM, SM

---

## ✅ 阶段 3：实施准备（Implementation Readiness）

### 7. check-implementation-readiness（检查实施就绪性）

**用途**：验证所有准备工作是否完成，确保可以开始实施

**激活方式**：
```
@bmad/bmm/workflows/check-implementation-readiness
```

**使用场景**：
- 所有设计文档完成后
- 准备开始实施前
- 需要验证 PRD、架构、Epics、UX 的完整性

**输出**：
- `_bmad-output/implementation-readiness-report-*.md` - 实施就绪报告

**相关代理**：PM, Architect

---

## 🚀 阶段 4：实施（Implementation）

### 8. sprint-planning（Sprint 规划）

**用途**：规划 Sprint，组织 Stories 到 Sprint 中

**激活方式**：
```
@bmad/bmm/workflows/sprint-planning
```

**使用场景**：
- 开始新的 Sprint
- 需要组织 Stories 到 Sprint
- 需要确定 Sprint 目标和容量

**输出**：
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Sprint 状态

**相关代理**：SM, PM

---

### 9. create-story（创建 Story 文件）

**用途**：为特定 Story 创建详细的实施文件，包含任务、验收标准等

**激活方式**：
```
@bmad/bmm/workflows/create-story
```

**使用场景**：
- Sprint 规划后
- 准备开发特定 Story
- 需要详细的实施指导

**输出**：
- `_bmad-output/implementation-artifacts/stories/{story-id}.md` - Story 文件

**示例**：
```
@bmad/bmm/workflows/create-story

请为 Story 1.2 创建详细文件。
```

**相关代理**：SM, Dev

---

### 10. validate-create-story（验证 Story 文件）

**用途**：验证新创建的 Story 文件质量，发现潜在问题

**激活方式**：
```
@bmad/bmm/workflows/validate-create-story
```

**使用场景**：
- Story 文件创建后
- 需要质量检查
- 确保 Story 文件完整且可执行

**输出**：
- Story 文件改进建议
- 验证报告

**相关代理**：SM, Dev

---

### 11. dev-story（开发 Story）

**用途**：实施 Story，编写代码，完成功能开发

**激活方式**：
```
@bmad/bmm/workflows/dev-story
```

**使用场景**：
- Story 文件创建后
- 开始实施 Story
- 需要按照 Story 文件的任务进行开发

**输出**：
- 代码实现
- 更新的 Story 文件（标记完成）
- 测试代码

**示例**：
```
@bmad/bmm/workflows/dev-story

请开始实施 Story 1.2：用户认证系统。
```

**相关代理**：Dev

---

### 12. code-review（代码审查）

**用途**：进行对抗性代码审查，发现代码质量问题

**激活方式**：
```
@bmad/bmm/workflows/code-review
```

**使用场景**：
- Story 实施完成后
- 需要审查代码质量
- 需要发现安全性、性能、测试覆盖等问题

**输出**：
- `_bmad-output/code-review-reports/code-review-story-{id}-{date}.md` - 审查报告
- Story 文件中的审查结果和待办事项

**相关代理**：Dev（建议使用不同的 LLM）

---

### 13. correct-course（纠正方向）

**用途**：处理 Sprint 执行过程中的重大变更，分析影响并提出解决方案

**激活方式**：
```
@bmad/bmm/workflows/correct-course
```

**使用场景**：
- Sprint 执行过程中出现重大变更
- 需要分析变更影响
- 需要重新规划或调整 Story

**输出**：
- `_bmad-output/sprint-change-proposal-{date}.md` - 变更提案

**相关代理**：SM, PM

---

### 14. sprint-status（Sprint 状态跟踪）

**用途**：跟踪 Sprint 进度，查看 Story 状态

**激活方式**：
```
@bmad/bmm/workflows/sprint-status
```

**使用场景**：
- 需要查看 Sprint 进度
- 需要更新 Story 状态
- 需要了解项目整体进展

**输出**：
- Sprint 状态报告

**相关代理**：SM

---

### 15. retrospective（回顾）

**用途**：Sprint 回顾，总结经验教训和改进点

**激活方式**：
```
@bmad/bmm/workflows/retrospective
```

**使用场景**：
- Sprint 结束时
- 需要总结经验和改进点
- 需要识别问题和机会

**输出**：
- 回顾报告
- 改进建议

**相关代理**：SM

---

## ⚡ 快速开发流程（Quick Flow）

### 16. create-tech-spec（创建技术规范）

**用途**：对话式规范工程，通过提问和代码调研生成实施就绪的技术规范

**激活方式**：
```
@bmad/bmm/workflows/create-tech-spec
```

**使用场景**：
- 需要快速创建技术规范
- 不需要完整的 PRD/架构流程
- 需要针对特定功能的技术规范

**输出**：
- 技术规范文档

**相关代理**：Architect, Dev

---

### 17. quick-dev（快速开发）

**用途**：灵活的开发流程，可以执行技术规范或直接指令，支持可选规划

**激活方式**：
```
@bmad/bmm/workflows/quick-dev
```

**使用场景**：
- 需要快速开发功能
- 有技术规范或直接指令
- 不需要完整的 Story 流程

**输出**：
- 代码实现

**相关代理**：Dev

---

## 📚 项目文档（Project Documentation）

### 18. document-project（文档化项目）

**用途**：分析并文档化现有项目（Brownfield），扫描代码库、架构和模式，创建全面的参考文档

**激活方式**：
```
@bmad/bmm/workflows/document-project
```

**使用场景**：
- 接手现有项目
- 需要理解项目结构和架构
- 需要为 AI 辅助开发创建参考文档

**输出**：
- `_bmad-output/index.md` - 项目索引
- 项目概览、源代码树、深度分析等

**相关代理**：Tech Writer, Architect

---

### 19. generate-project-context（生成项目上下文）

**用途**：创建简洁的 `project-context.md` 文件，包含 AI 代理在实施代码时必须遵循的关键规则和模式

**激活方式**：
```
@bmad/bmm/workflows/generate-project-context
```

**使用场景**：
- 需要为 AI 代理创建实施规则
- 需要优化 LLM 上下文效率
- 需要捕获关键的实现细节

**输出**：
- `_bmad-output/project-context.md` - 项目上下文文档

**相关代理**：Tech Writer

---

## 📊 图表绘制（Excalidraw Diagrams）

### 20. create-excalidraw-dataflow（创建数据流图）

**用途**：创建数据流图（DFD）的 Excalidraw 格式图表

**激活方式**：
```
@bmad/bmm/workflows/create-excalidraw-dataflow
```

**使用场景**：
- 需要可视化数据流
- 需要设计系统数据流图
- 需要文档化数据流向

**输出**：
- Excalidraw 格式的数据流图

**相关代理**：Architect

---

### 21. create-excalidraw-diagram（创建通用图表）

**用途**：创建通用技术图表的 Excalidraw 格式

**激活方式**：
```
@bmad/bmm/workflows/create-excalidraw-diagram
```

**使用场景**：
- 需要创建技术架构图
- 需要可视化系统组件
- 需要文档化系统设计

**输出**：
- Excalidraw 格式的技术图表

**相关代理**：Architect

---

### 22. create-excalidraw-flowchart（创建流程图）

**用途**：创建流程图的 Excalidraw 格式

**激活方式**：
```
@bmad/bmm/workflows/create-excalidraw-flowchart
```

**使用场景**：
- 需要可视化业务流程
- 需要设计算法流程
- 需要文档化工作流程

**输出**：
- Excalidraw 格式的流程图

**相关代理**：Analyst, Architect

---

### 23. create-excalidraw-wireframe（创建线框图）

**用途**：创建网站或应用的线框图（Wireframe）的 Excalidraw 格式

**激活方式**：
```
@bmad/bmm/workflows/create-excalidraw-wireframe
```

**使用场景**：
- 需要设计界面布局
- 需要创建 UI 线框图
- 需要可视化页面结构

**输出**：
- Excalidraw 格式的线框图

**相关代理**：UX Designer

---

## 🧪 测试架构（Test Architecture）

### 24. testarch-framework（测试框架）

**用途**：初始化生产就绪的测试框架架构（Playwright 或 Cypress），包含 fixtures、helpers 和配置

**激活方式**：
```
@bmad/bmm/workflows/testarch-framework
```

**使用场景**：
- 需要建立测试框架
- 需要配置 E2E 测试环境
- 需要设置测试基础设施

**输出**：
- 测试框架配置
- 测试基础设施代码

**相关代理**：TEA

---

### 25. testarch-atdd（ATDD - 验收测试驱动开发）

**用途**：在实施前生成失败的验收测试，使用 TDD 红绿重构循环

**激活方式**：
```
@bmad/bmm/workflows/testarch-atdd
```

**使用场景**：
- 需要实施 ATDD 流程
- 需要先写验收测试
- 需要测试驱动开发

**输出**：
- 验收测试用例
- ATDD 检查清单

**相关代理**：TEA, Dev

---

### 26. testarch-test-design（测试设计）

**用途**：设计测试用例和测试策略

**激活方式**：
```
@bmad/bmm/workflows/testarch-test-design
```

**使用场景**：
- 需要设计测试用例
- 需要制定测试策略
- 需要规划测试覆盖

**输出**：
- 测试设计文档
- 测试用例规范

**相关代理**：TEA

---

### 27. testarch-test-review（测试审查）

**用途**：审查测试质量和测试覆盖

**激活方式**：
```
@bmad/bmm/workflows/testarch-test-review
```

**使用场景**：
- 需要审查测试质量
- 需要评估测试覆盖
- 需要改进测试策略

**输出**：
- 测试审查报告

**相关代理**：TEA

---

### 28. testarch-automate（测试自动化）

**用途**：实施测试自动化，配置自动化测试流程

**激活方式**：
```
@bmad/bmm/workflows/testarch-automate
```

**使用场景**：
- 需要自动化测试
- 需要配置测试运行
- 需要集成测试工具

**输出**：
- 自动化测试配置
- 测试脚本

**相关代理**：TEA

---

### 29. testarch-ci（CI/CD 集成）

**用途**：将测试集成到 CI/CD 流程中

**激活方式**：
```
@bmad/bmm/workflows/testarch-ci
```

**使用场景**：
- 需要集成测试到 CI/CD
- 需要配置持续集成
- 需要自动化测试执行

**输出**：
- CI/CD 配置文件（GitHub Actions, GitLab CI 等）

**相关代理**：TEA

---

### 30. testarch-nfr（非功能需求评估）

**用途**：评估非功能需求（性能、安全性、可靠性、可维护性），在发布前进行基于证据的验证

**激活方式**：
```
@bmad/bmm/workflows/testarch-nfr
```

**使用场景**：
- 需要评估非功能需求
- 需要性能测试
- 需要安全评估
- 发布前验证

**输出**：
- NFR 评估报告

**相关代理**：TEA, Architect

---

### 31. testarch-trace（需求追踪）

**用途**：生成需求到测试的可追溯性矩阵，分析覆盖度，并做出质量门决策（PASS/CONCERNS/FAIL/WAIVED）

**激活方式**：
```
@bmad/bmm/workflows/testarch-trace
```

**使用场景**：
- 需要需求追踪
- 需要测试覆盖分析
- 需要质量门决策

**输出**：
- 可追溯性矩阵
- 覆盖分析报告

**相关代理**：TEA

---

## 🔧 工作流管理（Workflow Management）

### 32. workflow-init（工作流初始化）

**用途**：初始化新项目的工作流状态跟踪

**激活方式**：
```
@bmad/bmm/workflows/workflow-init
```

**使用场景**：
- 新项目启动
- 需要初始化工作流跟踪
- 需要设置项目级别和路径

**输出**：
- `_bmad-output/bmm-workflow-status.yaml` - 工作流状态文件

**相关代理**：PM, SM

---

### 33. workflow-status（工作流状态）

**用途**：轻量级状态检查器，回答"现在应该做什么？"，读取 YAML 状态文件进行工作流跟踪

**激活方式**：
```
@bmad/bmm/workflows/workflow-status
```

**使用场景**：
- 需要查看工作流状态
- 需要了解下一步该做什么
- 需要跟踪项目进展

**输出**：
- 工作流状态报告
- 下一步建议

**相关代理**：所有代理

### 工作流分类总结

| 类别 | 工作流数量 | 主要用途 |
|------|-----------|---------|
| 分析和规划 | 3 | 产品简介、研究、PRD |
| 设计 | 3 | UX 设计、架构设计、Epics/Stories |
| 实施准备 | 1 | 实施就绪性检查 |
| 实施 | 7 | Sprint 规划、Story 开发、代码审查等 |
| 快速开发 | 2 | 快速技术规范和开发 |
| 项目文档 | 2 | 项目文档化和上下文生成 |
| 图表绘制 | 4 | 数据流图、流程图、线框图等 |
| 测试架构 | 8 | 测试框架、ATDD、自动化、CI/CD 等 |
| 工作流管理 | 2 | 工作流初始化和状态跟踪 |
| **总计** | **33** | - |

### 工作流使用示例

#### 完整项目流程示例（标准流程）：

```
# 阶段 1：分析和规划
# 1. 创建产品简介
@bmad/bmm/workflows/create-product-brief
请创建产品简介，项目是一个 CRM 系统。

# 2. 研究（可选）
@bmad/bmm/workflows/research
请进行市场和技术研究。

# 3. 创建 PRD
@bmad/bmm/workflows/create-prd
基于产品简介，请创建详细的 PRD。

# 阶段 2：设计
# 4. 创建 UX 设计
@bmad/bmm/workflows/create-ux-design
基于 PRD，请创建 UX 设计规范。

# 5. 创建架构设计
@bmad/bmm/workflows/create-architecture
基于 PRD 和 UX 设计，请创建架构设计文档。

# 6. 创建 Epics 和 Stories
@bmad/bmm/workflows/create-epics-and-stories
基于 PRD，请创建 Epics 和 Stories。

# 阶段 3：实施准备
# 7. 检查实施就绪性
@bmad/bmm/workflows/check-implementation-readiness
请检查项目是否准备好开始实施。

# 阶段 4：实施
# 8. Sprint 规划
@bmad/bmm/workflows/sprint-planning
请进行 Sprint 规划。

# 9. 创建 Story 文件
@bmad/bmm/workflows/create-story
请为 Story 1.2 创建详细文件。

# 10. 验证 Story（可选，推荐）
@bmad/bmm/workflows/validate-create-story
请验证 Story 1.2 文件。

# 11. 开发 Story
@bmad/bmm/workflows/dev-story
请开始实施 Story 1.2。

# 12. 代码审查
@bmad/bmm/workflows/code-review
请审查 Story 1.2 的代码。

# 13. Sprint 状态跟踪
@bmad/bmm/workflows/sprint-status
请查看 Sprint 进度。

# 14. Sprint 回顾
@bmad/bmm/workflows/retrospective
请进行 Sprint 回顾。
```

#### 快速开发流程示例：

```
# 快速开发流程（不需要完整的 PRD/架构）
# 1. 创建技术规范
@bmad/bmm/workflows/create-tech-spec
请为"用户登录功能"创建技术规范。

# 2. 快速开发
@bmad/bmm/workflows/quick-dev
请根据技术规范实施用户登录功能。
```

#### 现有项目文档化示例：

```
# 文档化现有项目
@bmad/bmm/workflows/document-project
请分析并文档化当前项目。

# 生成项目上下文
@bmad/bmm/workflows/generate-project-context
请生成项目上下文文档。
```

#### 测试流程示例：

```
# 测试架构流程
# 1. 初始化测试框架
@bmad/bmm/workflows/testarch-framework
请初始化测试框架。

# 2. 测试设计
@bmad/bmm/workflows/testarch-test-design
请设计测试用例。

# 3. ATDD
@bmad/bmm/workflows/testarch-atdd
请生成验收测试。

# 4. 测试自动化
@bmad/bmm/workflows/testarch-automate
请配置测试自动化。

# 5. CI/CD 集成
@bmad/bmm/workflows/testarch-ci
请集成测试到 CI/CD。
```

---

## 任务（Tasks）使用指南

### 核心任务

#### 1. advanced-elicitation（高级需求获取）

**用途**：深入获取和分析需求

**激活方式**：
```
@bmad/core/tasks/advanced-elicitation
```

#### 2. index-docs（文档索引）

**用途**：为文档创建索引

**激活方式**：
```
@bmad/core/tasks/index-docs
```

---

## 工具（Tools）使用指南

### 核心工具

#### 1. shard-doc（文档分片）

**用途**：将大文档分片处理

**激活方式**：
```
@bmad/core/tools/shard-doc
```

---

## 最佳实践

### 1. 工作流顺序

遵循标准的工作流顺序，确保每个阶段都有充分的输入：

```
产品简介 → PRD → UX 设计 → 架构设计 → Epics/Stories → 实施就绪检查 → Sprint 规划 → Story 开发
```

### 2. 文档维护

- 定期更新文档，确保文档与代码同步
- 使用版本控制跟踪文档变更
- 在实施过程中及时更新 Story 状态

### 3. 代理选择

根据当前任务选择合适的代理：

- **需求阶段**：使用 PM 或 Analyst
- **设计阶段**：使用 Architect 或 UX Designer
- **实施阶段**：使用 Dev
- **测试阶段**：使用 TEA

### 4. Story 管理

- 每个 Story 应该有明确的验收标准
- Story 文件应该包含实施记录
- 完成后及时更新状态

### 5. 状态跟踪

- 使用 `sprint-status` 工作流跟踪进度
- 定期更新 `bmm-workflow-status.yaml`
- 使用 `sprint-status.yaml` 跟踪 Sprint 进度

---

## 常见问题

### Q1: 如何开始一个新项目？

**A**: 按照以下顺序：

1. 激活 `create-product-brief` 工作流，创建产品简介
2. 激活 `create-prd` 工作流，创建 PRD
3. 激活 `create-ux-design` 工作流，创建 UX 设计
4. 激活 `create-architecture` 工作流，创建架构设计
5. 激活 `create-epics-and-stories` 工作流，创建 Epics 和 Stories
6. 激活 `check-implementation-readiness` 工作流，检查就绪性
7. 激活 `sprint-planning` 工作流，开始 Sprint 规划

### Q2: 如何实施一个 Story？

**A**: 按照以下步骤：

1. 激活 `create-story` 工作流，为 Story 创建详细文件
2. 激活 `dev-story` 工作流，开始实施
3. 实施完成后，激活 `code-review` 工作流进行代码审查
4. 更新 Story 文件状态为 `completed`

### Q3: 如何查看项目进度？

**A**: 

- 查看 `_bmad-output/bmm-workflow-status.yaml` 了解整体工作流状态
- 查看 `_bmad-output/implementation-artifacts/sprint-status.yaml` 了解 Sprint 进度
- 查看 `_bmad-output/implementation-artifacts/stories/` 了解各个 Story 的状态

### Q4: 如何更新 Story 状态？

**A**: 

- 手动编辑 Story 文件，更新 `Status:` 字段
- 或使用 `sprint-status` 工作流自动更新

### Q5: 如何添加新的 Story？

**A**: 

1. 编辑 `_bmad-output/epics.md`，在相应的 Epic 下添加新的 Story
2. 激活 `create-story` 工作流，为新 Story 创建详细文件
3. 更新 `sprint-status.yaml`，添加新 Story 的状态

### Q6: 代理和工作流的区别是什么？

**A**: 

- **代理（Agents）**：扮演特定专业角色，提供专业建议和指导
- **工作流（Workflows）**：结构化的流程，执行特定任务并生成输出

通常，工作流会使用相应的代理来完成工作。例如，`create-prd` 工作流会使用 PM 代理来编写 PRD。

### Q7: 如何自定义工作流？

**A**: 

BMAD 工作流基于 YAML 配置文件。你可以：

1. 查看现有工作流配置文件（在 `_bmad/bmm/workflows/` 目录下）
2. 复制并修改配置文件
3. 创建新的工作流规则文件

---

## 快速参考

### 常用命令

#### 分析和规划阶段
```bash
# 创建产品简介
@bmad/bmm/workflows/create-product-brief

# 研究
@bmad/bmm/workflows/research

# 创建 PRD
@bmad/bmm/workflows/create-prd
```

#### 设计阶段
```bash
# 创建 UX 设计
@bmad/bmm/workflows/create-ux-design

# 创建架构设计
@bmad/bmm/workflows/create-architecture

# 创建 Epics 和 Stories
@bmad/bmm/workflows/create-epics-and-stories
```

#### 实施阶段
```bash
# 检查实施就绪性
@bmad/bmm/workflows/check-implementation-readiness

# Sprint 规划
@bmad/bmm/workflows/sprint-planning

# 创建 Story 文件
@bmad/bmm/workflows/create-story

# 验证 Story
@bmad/bmm/workflows/validate-create-story

# 开发 Story
@bmad/bmm/workflows/dev-story

# 代码审查
@bmad/bmm/workflows/code-review

# Sprint 状态跟踪
@bmad/bmm/workflows/sprint-status

# Sprint 回顾
@bmad/bmm/workflows/retrospective
```

#### 快速开发
```bash
# 创建技术规范
@bmad/bmm/workflows/create-tech-spec

# 快速开发
@bmad/bmm/workflows/quick-dev
```

#### 项目文档
```bash
# 文档化项目
@bmad/bmm/workflows/document-project

# 生成项目上下文
@bmad/bmm/workflows/generate-project-context
```

#### 图表绘制
```bash
# 创建数据流图
@bmad/bmm/workflows/create-excalidraw-dataflow

# 创建流程图
@bmad/bmm/workflows/create-excalidraw-flowchart

# 创建线框图
@bmad/bmm/workflows/create-excalidraw-wireframe

# 创建通用图表
@bmad/bmm/workflows/create-excalidraw-diagram
```

#### 测试架构
```bash
# 测试框架
@bmad/bmm/workflows/testarch-framework

# ATDD
@bmad/bmm/workflows/testarch-atdd

# 测试设计
@bmad/bmm/workflows/testarch-test-design

# 测试自动化
@bmad/bmm/workflows/testarch-automate

# CI/CD 集成
@bmad/bmm/workflows/testarch-ci

# NFR 评估
@bmad/bmm/workflows/testarch-nfr

# 需求追踪
@bmad/bmm/workflows/testarch-trace
```

#### 工作流管理
```bash
# 工作流初始化
@bmad/bmm/workflows/workflow-init

# 工作流状态
@bmad/bmm/workflows/workflow-status
```

### 文件位置

- **工作流状态**：`_bmad-output/bmm-workflow-status.yaml`
- **Sprint 状态**：`_bmad-output/implementation-artifacts/sprint-status.yaml`
- **PRD**：`_bmad-output/prd.md`
- **架构文档**：`_bmad-output/architecture.md`
- **Epics**：`_bmad-output/epics.md`
- **Story 文件**：`_bmad-output/implementation-artifacts/stories/*.md`

---

## 附录

### A. BMAD 规则索引

所有可用的 BMAD 规则都可以通过以下方式引用：

- **代理**：`@bmad/{module}/agents/{agent-name}`
- **工作流**：`@bmad/{module}/workflows/{workflow-name}`
- **任务**：`@bmad/{module}/tasks/{task-name}`
- **工具**：`@bmad/{module}/tools/{tool-name}`

### B. 工作流状态值

- `backlog` - 待处理
- `in-progress` - 进行中
- `completed` - 已完成
- `done` - 已完成（Epic 级别）
- `ready-for-dev` - 准备开发
- `review` - 审查中
- `optional` - 可选

### C. 相关文档

- [BMAD 索引](.cursor/rules/bmad/index.mdc)
- [项目上下文](_bmad-output/project-context.md)
- [快速开始指南](docs/quick-start-guide.md)

---

**文档维护**：本文档应随 BMAD 工作流的更新而更新。  
**最后更新**：2025-12-25

