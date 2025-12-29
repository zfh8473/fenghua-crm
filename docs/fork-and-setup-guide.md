# Fork Twenty 仓库并设置 fenghua-crm 分支指南

**日期：** 2025-12-25  
**项目：** fenghua-crm

## 步骤 1: Fork Twenty 仓库（在 GitHub 上操作）

1. **访问 Twenty 仓库：**
   - 打开浏览器访问：https://github.com/twentyhq/twenty

2. **Fork 仓库：**
   - 点击右上角的 "Fork" 按钮
   - 选择你的 GitHub 账户
   - 等待 Fork 完成

3. **获取 Fork 后的仓库 URL：**
   - Fork 完成后，你的仓库 URL 应该是：`https://github.com/YOUR_USERNAME/twenty`
   - 例如：`https://github.com/zfh8473/twenty`

## 步骤 2: 克隆 Fork 的仓库

```bash
cd ~/Documents/GitHub

# 克隆你的 fork（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git clone https://github.com/YOUR_USERNAME/twenty.git twenty-fenghua

cd twenty-fenghua
```

## 步骤 3: 创建 fenghua-crm 分支

```bash
# 创建并切换到 fenghua-crm 分支
git checkout -b fenghua-crm

# 推送到远程并设置上游
git push -u origin fenghua-crm
```

## 步骤 4: 添加上游仓库（用于跟踪官方更新）

```bash
# 添加上游仓库
git remote add upstream https://github.com/twentyhq/twenty.git

# 验证远程仓库
git remote -v
```

应该看到：
- `origin` - 你的 fork（用于推送）
- `upstream` - 官方仓库（用于拉取更新）

## 步骤 5: 创建定制代码目录结构

```bash
# 后端定制代码目录
mkdir -p packages/twenty-server/src/custom

# 前端定制代码目录
mkdir -p packages/twenty-front/src/custom

# 创建 .gitkeep 文件以保留空目录
touch packages/twenty-server/src/custom/.gitkeep
touch packages/twenty-front/src/custom/.gitkeep
```

## 步骤 6: 提交初始定制目录结构

```bash
# 添加定制目录
git add packages/twenty-server/src/custom/.gitkeep
git add packages/twenty-front/src/custom/.gitkeep

# 提交
git commit -m "feat: Add custom code directories for fenghua-crm customization"

# 推送到远程
git push origin fenghua-crm
```

## 步骤 7: 更新 Docker Compose 配置（可选）

如果需要使用本地代码而不是预构建镜像，可以修改 `packages/twenty-docker/docker-compose.yml`：

```yaml
# 将 image 改为 build
server:
  build:
    context: ../..
    dockerfile: packages/twenty-server/Dockerfile
  # 而不是: image: twentycrm/twenty:latest
```

## 验证设置

```bash
# 检查分支
git branch

# 检查远程仓库
git remote -v

# 检查定制目录
ls -la packages/twenty-server/src/custom/
ls -la packages/twenty-front/src/custom/
```

## 后续工作流

### 日常开发

```bash
# 确保在 fenghua-crm 分支
git checkout fenghua-crm

# 创建功能分支
git checkout -b feature/product-management

# 开发完成后
git add .
git commit -m "feat: Add product management module"
git push origin feature/product-management
```

### 同步上游更新

```bash
# 获取上游更新
git fetch upstream

# 合并到当前分支
git merge upstream/main

# 如果有冲突，解决后提交
git push origin fenghua-crm
```

## 注意事项

1. **不要直接修改 main 分支**：所有定制开发都在 `fenghua-crm` 分支进行
2. **定期同步上游**：保持与官方 Twenty CRM 的同步，避免版本差异过大
3. **定制代码位置**：所有定制代码放在 `custom/` 目录下，不要修改 Twenty 核心代码
4. **提交信息规范**：使用清晰的提交信息，便于后续维护

## 参考

- 架构文档：`_bmad-output/architecture.md#Project Structure & Boundaries`
- 定制策略：`docs/customization-strategy.md`

