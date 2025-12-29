#!/bin/bash

# Twenty CRM 部署脚本
# 用途：快速部署 Twenty CRM 用于评估
# 作者：fenghua-crm 项目
# 日期：2025-12-23

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
TWENTY_DIR="${HOME}/Documents/GitHub/twenty"
DEPLOYMENT_MODE=""  # docker 或 local

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Twenty CRM 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查部署模式
echo "请选择部署模式："
echo "1) Docker 部署（推荐 - 快速试用）"
echo "2) 本地开发环境部署（推荐 - 深度评估）"
read -p "请输入选项 (1 或 2): " choice

case $choice in
    1)
        DEPLOYMENT_MODE="docker"
        echo -e "${GREEN}已选择: Docker 部署${NC}"
        ;;
    2)
        DEPLOYMENT_MODE="local"
        echo -e "${GREEN}已选择: 本地开发环境部署${NC}"
        ;;
    *)
        echo -e "${RED}无效选项，退出${NC}"
        exit 1
        ;;
esac

# 检查前置条件
echo ""
echo -e "${YELLOW}检查前置条件...${NC}"

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 Yarn
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo -e "${GREEN}✓ Yarn: ${YARN_VERSION}${NC}"
else
    echo -e "${RED}✗ Yarn 未安装，请先安装 Yarn${NC}"
    exit 1
fi

# Docker 模式检查
if [ "$DEPLOYMENT_MODE" = "docker" ]; then
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        echo -e "${GREEN}✓ Docker: ${DOCKER_VERSION}${NC}"
    else
        echo -e "${RED}✗ Docker 未安装，请先安装 Docker${NC}"
        exit 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_VERSION=$(docker-compose --version)
        echo -e "${GREEN}✓ Docker Compose: ${DOCKER_COMPOSE_VERSION}${NC}"
    else
        echo -e "${RED}✗ Docker Compose 未安装，请先安装 Docker Compose${NC}"
        exit 1
    fi
fi

# 本地模式检查
if [ "$DEPLOYMENT_MODE" = "local" ]; then
    # 检查 PostgreSQL
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version)
        echo -e "${GREEN}✓ PostgreSQL: ${PSQL_VERSION}${NC}"
    else
        echo -e "${YELLOW}⚠ PostgreSQL 未安装，请确保已安装并运行${NC}"
    fi
    
    # 检查 Redis
    if command -v redis-cli &> /dev/null; then
        REDIS_VERSION=$(redis-cli --version)
        echo -e "${GREEN}✓ Redis: ${REDIS_VERSION}${NC}"
    else
        echo -e "${YELLOW}⚠ Redis 未安装，请确保已安装并运行${NC}"
    fi
fi

echo ""
echo -e "${GREEN}前置条件检查完成${NC}"
echo ""

# 创建目录
if [ ! -d "$TWENTY_DIR" ]; then
    echo -e "${YELLOW}克隆 Twenty 仓库...${NC}"
    mkdir -p "$(dirname "$TWENTY_DIR")"
    cd "$(dirname "$TWENTY_DIR")"
    git clone https://github.com/twentyhq/twenty.git
    echo -e "${GREEN}✓ 仓库克隆完成${NC}"
else
    echo -e "${YELLOW}检测到 Twenty 目录已存在${NC}"
    read -p "是否更新到最新版本？(y/n): " update_choice
    if [ "$update_choice" = "y" ]; then
        cd "$TWENTY_DIR"
        git pull
        echo -e "${GREEN}✓ 代码更新完成${NC}"
    fi
fi

cd "$TWENTY_DIR"

# Docker 部署
if [ "$DEPLOYMENT_MODE" = "docker" ]; then
    echo ""
    echo -e "${YELLOW}开始 Docker 部署...${NC}"
    
    # 检查 docker-compose.yml（在 packages/twenty-docker/ 目录下）
    DOCKER_COMPOSE_DIR="packages/twenty-docker"
    if [ ! -f "$DOCKER_COMPOSE_DIR/docker-compose.yml" ]; then
        echo -e "${RED}✗ 未找到 docker-compose.yml 文件在 $DOCKER_COMPOSE_DIR/ 目录${NC}"
        exit 1
    fi
    
    # 进入 docker-compose 目录
    cd "$DOCKER_COMPOSE_DIR"
    echo -e "${GREEN}✓ 找到 docker-compose.yml 文件${NC}"
    
    # 检查 Docker 是否运行
    if ! docker ps &> /dev/null; then
        echo -e "${RED}✗ Docker 服务未运行，请先启动 Docker Desktop${NC}"
        exit 1
    fi
    
    # 启动服务
    echo -e "${YELLOW}启动 Docker 服务...${NC}"
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}等待服务启动...${NC}"
    sleep 15
    
    # 检查服务状态
    echo ""
    echo -e "${YELLOW}检查服务状态...${NC}"
    docker-compose ps
    
    # 返回原目录
    cd - > /dev/null
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "访问地址："
    echo "  前端: http://localhost:3000"
    echo "  GraphQL API: http://localhost:3000/graphql"
    echo ""
    echo "查看日志："
    echo "  cd $TWENTY_DIR/$DOCKER_COMPOSE_DIR && docker-compose logs -f"
    echo ""
    echo "停止服务："
    echo "  cd $TWENTY_DIR/$DOCKER_COMPOSE_DIR && docker-compose down"
    echo ""
fi

# 本地开发环境部署
if [ "$DEPLOYMENT_MODE" = "local" ]; then
    echo ""
    echo -e "${YELLOW}开始本地开发环境部署...${NC}"
    
    # 安装依赖
    echo -e "${YELLOW}安装依赖...${NC}"
    yarn install
    
    # 配置环境变量
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}创建 .env 文件...${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ .env 文件已创建，请编辑配置${NC}"
        else
            echo -e "${YELLOW}⚠ 未找到 .env.example，请手动创建 .env 文件${NC}"
        fi
    else
        echo -e "${GREEN}✓ .env 文件已存在${NC}"
    fi
    
    # 检查数据库
    echo ""
    echo -e "${YELLOW}检查数据库配置...${NC}"
    read -p "是否已配置 PostgreSQL 数据库？(y/n): " db_configured
    
    if [ "$db_configured" = "n" ]; then
        echo -e "${YELLOW}请先配置数据库：${NC}"
        echo "1. 确保 PostgreSQL 服务运行"
        echo "2. 创建数据库: createdb twenty_dev"
        echo "3. 编辑 .env 文件，设置 DATABASE_URL"
        echo ""
        read -p "配置完成后按 Enter 继续..."
    fi
    
    # 运行数据库迁移
    echo ""
    echo -e "${YELLOW}运行数据库迁移...${NC}"
    yarn prisma migrate deploy
    
    # 生成 Prisma 客户端
    echo -e "${YELLOW}生成 Prisma 客户端...${NC}"
    yarn prisma generate
    
    # 检查 Redis
    echo ""
    echo -e "${YELLOW}检查 Redis 服务...${NC}"
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis 服务运行中${NC}"
    else
        echo -e "${YELLOW}⚠ Redis 服务未运行，请启动 Redis${NC}"
        echo "  启动命令: redis-server"
        read -p "Redis 启动后按 Enter 继续..."
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}部署准备完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "启动开发服务器："
    echo "  yarn dev"
    echo ""
    echo "或分别启动："
    echo "  终端 1: yarn dev:server"
    echo "  终端 2: yarn dev:front"
    echo ""
    echo "访问地址："
    echo "  前端: http://localhost:3000"
    echo "  GraphQL API: http://localhost:3000/graphql"
    echo ""
fi

echo -e "${GREEN}部署脚本执行完成！${NC}"
echo ""
echo "下一步："
echo "1. 访问前端界面进行功能测试"
echo "2. 参考 docs/twenty-evaluation-checklist.md 进行评估"
echo "3. 记录评估结果"

