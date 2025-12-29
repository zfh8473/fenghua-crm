#!/bin/bash

# Twenty CRM Fork 设置脚本
# 用途：设置 fenghua-crm 定制开发环境
# 作者：fenghua-crm 项目
# 日期：2025-12-25

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
TWENTY_FORK_DIR="${HOME}/Documents/GitHub/twenty-fenghua"
TWENTY_OFFICIAL_REPO="https://github.com/twentyhq/twenty.git"
TWENTY_FORK_REPO=""  # 将在脚本中设置

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Twenty CRM Fork 设置脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否已 Fork
if [ -d "$TWENTY_FORK_DIR" ]; then
    echo -e "${YELLOW}检测到 twenty-fenghua 目录已存在${NC}"
    read -p "是否重新设置？(y/n): " reinit_choice
    if [ "$reinit_choice" != "y" ]; then
        echo "退出设置"
        exit 0
    fi
    echo -e "${YELLOW}备份现有目录...${NC}"
    mv "$TWENTY_FORK_DIR" "${TWENTY_FORK_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 步骤 1: 获取 Fork 仓库 URL
echo -e "${BLUE}步骤 1: 配置 Fork 仓库${NC}"
echo ""
echo "请确保你已经在 GitHub 上 Fork 了 Twenty 仓库："
echo "  1. 访问: https://github.com/twentyhq/twenty"
echo "  2. 点击右上角的 'Fork' 按钮"
echo "  3. 选择你的 GitHub 账户"
echo ""
read -p "请输入你的 GitHub 用户名: " github_username

if [ -z "$github_username" ]; then
    echo -e "${RED}错误: GitHub 用户名不能为空${NC}"
    exit 1
fi

TWENTY_FORK_REPO="https://github.com/${github_username}/twenty.git"
echo -e "${GREEN}✓ Fork 仓库 URL: ${TWENTY_FORK_REPO}${NC}"
echo ""

# 步骤 2: 克隆 Fork 的仓库
echo -e "${BLUE}步骤 2: 克隆 Fork 的仓库${NC}"
echo -e "${YELLOW}正在克隆仓库...${NC}"

cd "$(dirname "$TWENTY_FORK_DIR")"
git clone "$TWENTY_FORK_REPO" "$(basename "$TWENTY_FORK_DIR")"
cd "$TWENTY_FORK_DIR"

echo -e "${GREEN}✓ 仓库克隆完成${NC}"
echo ""

# 步骤 3: 添加上游仓库
echo -e "${BLUE}步骤 3: 添加上游仓库${NC}"

if git remote | grep -q "^upstream$"; then
    echo -e "${YELLOW}上游仓库已存在，跳过${NC}"
else
    git remote add upstream "$TWENTY_OFFICIAL_REPO"
    echo -e "${GREEN}✓ 上游仓库已添加${NC}"
fi

# 验证远程仓库
echo ""
echo -e "${BLUE}远程仓库配置:${NC}"
git remote -v
echo ""

# 步骤 4: 创建 fenghua-crm 分支
echo -e "${BLUE}步骤 4: 创建 fenghua-crm 分支${NC}"

current_branch=$(git branch --show-current)
if [ "$current_branch" = "fenghua-crm" ]; then
    echo -e "${YELLOW}已在 fenghua-crm 分支${NC}"
else
    # 检查分支是否已存在
    if git show-ref --verify --quiet refs/heads/fenghua-crm; then
        echo -e "${YELLOW}fenghua-crm 分支已存在，切换到该分支${NC}"
        git checkout fenghua-crm
    else
        echo -e "${YELLOW}创建 fenghua-crm 分支...${NC}"
        git checkout -b fenghua-crm
        
        # 推送到远程
        echo -e "${YELLOW}推送分支到远程...${NC}"
        git push -u origin fenghua-crm || echo -e "${YELLOW}警告: 无法推送到远程，可能需要先设置 GitHub 认证${NC}"
    fi
fi

echo -e "${GREEN}✓ fenghua-crm 分支已创建/切换${NC}"
echo ""

# 步骤 5: 创建定制代码目录结构
echo -e "${BLUE}步骤 5: 创建定制代码目录结构${NC}"

# 后端定制代码目录
mkdir -p packages/twenty-server/src/custom
touch packages/twenty-server/src/custom/.gitkeep

# 前端定制代码目录
mkdir -p packages/twenty-front/src/custom
touch packages/twenty-front/src/custom/.gitkeep

echo -e "${GREEN}✓ 定制代码目录已创建${NC}"
echo "  后端: packages/twenty-server/src/custom/"
echo "  前端: packages/twenty-front/src/custom/"
echo ""

# 步骤 6: 创建 README 文件
echo -e "${BLUE}步骤 6: 创建定制代码说明文件${NC}"

cat > packages/twenty-server/src/custom/README.md << 'EOF'
# fenghua-crm 后端定制代码

此目录包含 fenghua-crm 项目的所有后端定制代码。

## 目录结构

- `product/` - 产品管理模块
- `interaction/` - 互动记录模块
- `permission/` - 权限管理模块
- `excel-import/` - Excel 导入导出模块
- `offline-sync/` - 离线同步模块

## 开发规范

- 所有定制代码必须放在此目录下
- 不要修改 Twenty CRM 核心代码
- 遵循 NestJS 和 TypeScript 最佳实践
- 参考架构文档：`_bmad-output/architecture.md`
EOF

cat > packages/twenty-front/src/custom/README.md << 'EOF'
# fenghua-crm 前端定制代码

此目录包含 fenghua-crm 项目的所有前端定制代码。

## 目录结构

- `product/` - 产品管理组件
- `quick-record/` - 快速记录组件
- `interaction/` - 互动记录组件
- `offline-sync/` - 离线同步组件

## 开发规范

- 所有定制代码必须放在此目录下
- 不要修改 Twenty CRM 核心代码
- 遵循 React 和 TypeScript 最佳实践
- 参考架构文档：`_bmad-output/architecture.md`
EOF

echo -e "${GREEN}✓ README 文件已创建${NC}"
echo ""

# 步骤 7: 提交初始设置
echo -e "${BLUE}步骤 7: 提交初始设置${NC}"

git add packages/twenty-server/src/custom/
git add packages/twenty-front/src/custom/

if git diff --staged --quiet; then
    echo -e "${YELLOW}没有需要提交的更改${NC}"
else
    git commit -m "feat: Initialize fenghua-crm custom code directories

- Add custom/ directory structure for backend and frontend
- Add README files with development guidelines
- Prepare for fenghua-crm customization development"
    
    echo -e "${GREEN}✓ 初始提交已完成${NC}"
    echo ""
    echo -e "${YELLOW}提示: 如果推送失败，请确保已设置 GitHub 认证${NC}"
    read -p "是否推送到远程仓库？(y/n): " push_choice
    if [ "$push_choice" = "y" ]; then
        git push origin fenghua-crm || echo -e "${YELLOW}警告: 推送失败，请手动推送${NC}"
    fi
fi

# 完成
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}设置完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "仓库位置: $TWENTY_FORK_DIR"
echo "当前分支: $(git branch --show-current)"
echo ""
echo "下一步："
echo "  1. 开始定制开发"
echo "  2. 所有定制代码放在 custom/ 目录下"
echo "  3. 参考架构文档进行开发"
echo ""
echo "同步上游更新："
echo "  cd $TWENTY_FORK_DIR"
echo "  git fetch upstream"
echo "  git merge upstream/main"
echo ""

