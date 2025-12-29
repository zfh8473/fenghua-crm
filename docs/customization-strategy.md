# fenghua-crm 定制开发策略

**日期：** 2025-12-25  
**项目：** fenghua-crm

## 当前情况说明

### 1. Twenty CRM 代码位置

**源代码位置：**
- Twenty CRM 源代码在：`~/Documents/GitHub/twenty`
- 这是一个独立的 Git 仓库，指向官方仓库：`https://github.com/twentyhq/twenty.git`
- **不在** `fenghua-crm` 项目目录下

**Docker 部署：**
- 当前使用的是预构建的 Docker 镜像：`twentycrm/twenty:latest`
- 镜像包含编译后的代码，是只读的
- 容器内的代码无法直接修改

### 2. 定制代码位置

根据架构文档，定制代码应该放在：
- **后端：** `packages/twenty-server/src/custom/`
- **前端：** `packages/twenty-front/src/custom/`

但这些目录应该在 **Twenty 仓库**中，而不是在 `fenghua-crm` 项目目录下。

## 定制开发策略选项

### 方案 A：在 Twenty 仓库中直接开发（当前状态）

**优点：**
- 简单直接，可以立即开始开发
- 代码在 Twenty 仓库中，符合架构文档的预期结构

**缺点：**
- 与上游 Twenty 仓库可能产生冲突
- 升级 Twenty 时需要处理合并冲突
- 定制代码与 Twenty 核心代码混在一起

**适用场景：**
- 快速原型开发
- 短期项目
- 不计划频繁升级 Twenty

### 方案 B：Fork Twenty 仓库并创建 fenghua-crm 分支（推荐）

**优点：**
- 完全控制定制代码
- 可以跟踪上游更新
- 独立的 Git 历史
- 便于团队协作

**缺点：**
- 需要维护 fork
- 升级时需要手动合并上游更改

**实施步骤：**
1. Fork Twenty 仓库到你的 GitHub 账户
2. 克隆 fork 的仓库
3. 创建 `fenghua-crm` 分支
4. 在分支中开发定制功能

### 方案 C：Git Submodule（不推荐）

**优点：**
- 保持 Twenty 仓库独立
- 可以指定特定版本

**缺点：**
- Git submodule 管理复杂
- 定制代码仍然需要在 Twenty 仓库中
- 不利于快速开发

## 推荐方案：方案 B（Fork + 分支）

### 实施步骤

1. **Fork Twenty 仓库**
   ```bash
   # 在 GitHub 上 Fork https://github.com/twentyhq/twenty
   # 然后克隆你的 fork
   cd ~/Documents/GitHub
   git clone https://github.com/YOUR_USERNAME/twenty.git twenty-fenghua
   cd twenty-fenghua
   ```

2. **创建 fenghua-crm 分支**
   ```bash
   git checkout -b fenghua-crm
   git push -u origin fenghua-crm
   ```

3. **添加上游仓库（用于跟踪更新）**
   ```bash
   git remote add upstream https://github.com/twentyhq/twenty.git
   ```

4. **创建定制代码目录**
   ```bash
   # 后端定制代码
   mkdir -p packages/twenty-server/src/custom
   
   # 前端定制代码
   mkdir -p packages/twenty-front/src/custom
   ```

5. **更新 Docker Compose 使用本地代码**
   - 修改 `packages/twenty-docker/docker-compose.yml`
   - 使用本地代码构建镜像，而不是使用预构建镜像

### 开发工作流

1. **日常开发：**
   - 在 `twenty-fenghua` 仓库的 `fenghua-crm` 分支中开发
   - 定制代码放在 `packages/twenty-server/src/custom/` 和 `packages/twenty-front/src/custom/`

2. **升级 Twenty：**
   ```bash
   git fetch upstream
   git merge upstream/main
   # 解决冲突
   ```

3. **部署：**
   - 开发环境：使用本地代码运行
   - 生产环境：构建包含定制代码的 Docker 镜像

## 当前建议

**对于 MVP 阶段：**

由于 Twenty CRM 已经部署并运行，建议：

1. **短期（当前）：**
   - 继续使用现有的 Twenty 仓库（`~/Documents/GitHub/twenty`）
   - 在仓库中创建 `custom/` 目录开始开发
   - 使用本地开发模式（不使用 Docker 镜像，直接运行源代码）

2. **中期（开发阶段）：**
   - 考虑 Fork 仓库并创建分支
   - 建立独立的定制开发环境

3. **长期（生产环境）：**
   - 构建包含定制代码的 Docker 镜像
   - 建立 CI/CD 流程

## 下一步行动

1. **立即行动：**
   - 在 Twenty 仓库中创建 `custom/` 目录结构
   - 切换到本地开发模式（不使用 Docker 镜像）

2. **后续优化：**
   - 评估是否需要 Fork 仓库
   - 建立定制代码的版本控制策略

## 参考文档

- 架构文档：`_bmad-output/architecture.md#Project Structure & Boundaries`
- 项目上下文：`_bmad-output/project-context.md#Technology Stack & Versions`

