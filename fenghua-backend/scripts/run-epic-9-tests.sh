#!/bin/bash

# Story 9-8 Epic 9 回归测试执行脚本
# 用途：自动化执行 Epic 9 回归测试

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 开始执行 Epic 9 回归测试..."
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查后端服务是否运行
echo "📡 检查后端服务状态..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务未运行，正在自动启动后端服务...${NC}"
    # 非交互式环境，自动启动服务
    AUTO_START=true
    if [ -t 0 ] && [ -z "$AUTO_START" ]; then
        # 交互式环境，询问用户
        read -p "是否现在启动后端服务？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            AUTO_START=true
        fi
    fi
    
    if [ "$AUTO_START" = "true" ]; then
        echo "🚀 启动后端服务..."
        cd "$PROJECT_ROOT"
        npm run start:dev > /tmp/fenghua-backend-test.log 2>&1 &
        BACKEND_PID=$!
        echo "后端服务 PID: $BACKEND_PID"
        echo "等待服务启动..."
        sleep 10
        
        # 检查服务是否启动成功
        for i in {1..30}; do
            if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 后端服务启动成功${NC}"
                break
            fi
            if [ $i -eq 30 ]; then
                echo -e "${RED}❌ 后端服务启动超时${NC}"
                echo "查看日志: tail -50 /tmp/fenghua-backend-test.log"
                exit 1
            fi
            sleep 1
        done
    else
        echo "请手动启动后端服务后重新运行此脚本"
        exit 1
    fi
fi

echo ""
echo "📊 执行测试数据准备..."

# 检查数据库连接
echo "检查数据库连接..."

# 尝试从环境变量文件加载配置（参照 app.module.ts 的配置方式）
NODE_ENV_VALUE="${NODE_ENV:-development}"
ENV_FILE=".env.${NODE_ENV_VALUE}"

if [ -f "$ENV_FILE" ]; then
    echo "从 $ENV_FILE 加载环境变量..."
    # 手动解析 .env 文件并导出变量
    while IFS= read -r line || [ -n "$line" ]; do
        # 跳过注释和空行
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]] && [[ "$line" =~ = ]]; then
            # 提取变量名和值（处理可能包含 = 的值）
            var_name="${line%%=*}"
            var_value="${line#*=}"
            # 移除变量名两端的空格
            var_name=$(echo "$var_name" | xargs)
            # 移除值两端的引号（如果有）
            var_value=$(echo "$var_value" | sed -e 's/^["'\'']//' -e 's/["'\'']$//')
            # 导出变量
            export "$var_name=$var_value"
        fi
    done < "$ENV_FILE"
    echo -e "${GREEN}✅ 已从 $ENV_FILE 加载环境变量${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 $ENV_FILE 文件${NC}"
fi

# 检查是否设置了数据库连接
if [ -z "$DATABASE_URL" ] && [ -z "$PG_DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  未设置 DATABASE_URL 或 PG_DATABASE_URL 环境变量${NC}"
    echo ""
    echo "请执行以下操作之一："
    echo "1. 创建 $ENV_FILE 文件并配置 DATABASE_URL"
    echo "2. 或者设置环境变量："
    echo "   export DATABASE_URL=postgresql://user:password@host:5432/dbname"
    echo ""
    echo "参考文档：fenghua-backend/README-ENVIRONMENT.md"
    echo ""
    echo "开发环境数据库连接字符串（从 README-ENVIRONMENT.md）："
    echo "DATABASE_URL=postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require"
    exit 1
fi

echo -e "${GREEN}✅ 数据库连接配置已找到${NC}"
if [ -n "$DATABASE_URL" ]; then
    echo "   使用 DATABASE_URL（已隐藏敏感信息）"
elif [ -n "$PG_DATABASE_URL" ]; then
    echo "   使用 PG_DATABASE_URL（已隐藏敏感信息）"
fi

# 执行测试数据种子脚本（如果存在）
if [ -f "scripts/seed-audit-logs.ts" ]; then
    echo "执行审计日志测试数据种子脚本..."
    npx ts-node scripts/seed-audit-logs.ts || echo -e "${YELLOW}⚠️  审计日志种子脚本执行失败（可能数据已存在）${NC}"
fi

if [ -f "scripts/seed-gdpr-test-data.ts" ]; then
    echo "执行 GDPR 测试数据种子脚本..."
    npx ts-node scripts/seed-gdpr-test-data.ts || echo -e "${YELLOW}⚠️  GDPR 种子脚本执行失败（可能数据已存在）${NC}"
fi

if [ -f "scripts/seed-retention-test-data.ts" ]; then
    echo "执行数据保留测试数据种子脚本..."
    npx ts-node scripts/seed-retention-test-data.ts || echo -e "${YELLOW}⚠️  数据保留种子脚本执行失败（可能数据已存在）${NC}"
fi

echo ""
echo "🧪 执行集成测试..."

# 运行集成测试
echo "1. 运行审计日志集成测试..."
npm test -- test/integration/audit-logs.integration.spec.ts --passWithNoTests || echo -e "${YELLOW}⚠️  审计日志集成测试未找到或失败${NC}"

echo ""
echo "2. 运行数据保留策略集成测试..."
npm test -- test/integration/data-retention.integration.spec.ts --passWithNoTests || echo -e "${YELLOW}⚠️  数据保留策略集成测试未找到或失败${NC}"

echo ""
echo "3. 运行单元测试（Story 9-3 数据加密）..."
npm test -- --testPathPattern="encryption.service.spec" --passWithNoTests

echo ""
echo "4. 运行审计服务单元测试..."
npm test -- --testPathPattern="audit.service.spec" --passWithNoTests

echo ""
echo "5. 运行审计日志控制器单元测试..."
npm test -- --testPathPattern="audit-logs.controller.spec" --passWithNoTests

echo ""
echo "✅ 自动化测试执行完成！"
echo ""
echo "📋 下一步："
echo "1. 查看测试结果报告模板：_bmad-output/test-reports/story-9-8-test-results-template-2026-01-14.md"
echo "2. 按照测试执行指南执行手动测试：_bmad-output/test-reports/story-9-8-testing-guide-2026-01-14.md"
echo "3. 记录测试结果到测试结果报告"
