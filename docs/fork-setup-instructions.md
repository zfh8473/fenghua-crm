# Fork Twenty 仓库设置指南

**日期：** 2025-12-25  
**项目：** fenghua-crm

## 快速开始

### 方式 1: 使用自动化脚本（推荐）

```bash
cd /Users/travis_z/Documents/GitHub/fenghua-crm
./scripts/setup-twenty-fork.sh
```

脚本会自动完成：
1. 克隆你的 Fork 仓库
2. 添加上游仓库
3. 创建 fenghua-crm 分支
4. 创建定制代码目录结构
5. 提交初始设置

### 方式 2: 手动设置

#### 步骤 1: Fork 仓库（在 GitHub 上）

1. 访问：https://github.com/twentyhq/twenty
2. 点击右上角的 "Fork" 按钮
3. 选择你的 GitHub 账户
4. 等待 Fork 完成

#### 步骤 2: 克隆 Fork 的仓库

```bash
cd ~/Documents/GitHub

# 替换 YOUR_USERNAME 为你的 GitHub 用户名
git clone https://github.com/YOUR_USERNAME/twenty.git twenty-fenghua
cd twenty-fenghua
```

#### 步骤 3: 添加上游仓库

```bash
git remote add upstream https://github.com/twentyhq/twenty.git
git remote -v  # 验证
```

#### 步骤 4: 创建 fenghua-crm 分支

```bash
git checkout -b fenghua-crm
git push -u origin fenghua-crm
```

#### 步骤 5: 创建定制代码目录

```bash
# 后端定制代码
mkdir -p packages/twenty-server/src/custom
touch packages/twenty-server/src/custom/.gitkeep

# 前端定制代码
mkdir -p packages/twenty-front/src/custom
touch packages/twenty-front/src/custom/.gitkeep
```

#### 步骤 6: 提交初始设置

```bash
git add packages/twenty-server/src/custom/
git add packages/twenty-front/src/custom/
git commit -m "feat: Initialize fenghua-crm custom code directories"
git push origin fenghua-crm
```

## 验证设置

```bash
cd ~/Documents/GitHub/twenty-fenghua

# 检查分支
git branch
# 应该显示: * fenghua-crm

# 检查远程仓库
git remote -v
# 应该显示:
# origin    https://github.com/YOUR_USERNAME/twenty.git (fetch)
# origin    https://github.com/YOUR_USERNAME/twenty.git (push)
# upstream  https://github.com/twentyhq/twenty.git (fetch)
# upstream  https://github.com/twentyhq/twenty.git (push)

# 检查定制目录
ls -la packages/twenty-server/src/custom/
ls -la packages/twenty-front/src/custom/
```

## 开发工作流

### 日常开发

```bash
cd ~/Documents/GitHub/twenty-fenghua

# 确保在 fenghua-crm 分支
git checkout fenghua-crm

# 创建功能分支
git checkout -b feature/product-management

# 开发定制代码
# 所有定制代码放在 packages/twenty-server/src/custom/ 或 packages/twenty-front/src/custom/

# 提交更改
git add .
git commit -m "feat: Add product management module"
git push origin feature/product-management
```

### 同步上游更新

```bash
cd ~/Documents/GitHub/twenty-fenghua

# 获取上游更新
git fetch upstream

# 合并到 fenghua-crm 分支
git checkout fenghua-crm
git merge upstream/main

# 如果有冲突，解决后提交
git push origin fenghua-crm
```

## 重要提示

1. **不要修改核心代码**：所有定制代码必须放在 `custom/` 目录下
2. **保持分支独立**：所有定制开发在 `fenghua-crm` 分支进行
3. **定期同步**：建议每月同步一次上游更新
4. **提交规范**：使用清晰的提交信息，便于维护

## 下一步

设置完成后，可以开始：
1. 实施 Story 1.2: 用户认证系统
2. 创建产品管理模块（Epic 2）
3. 开发定制功能

参考：
- 架构文档：`_bmad-output/architecture.md`
- Epic 和 Story：`_bmad-output/epics.md`

