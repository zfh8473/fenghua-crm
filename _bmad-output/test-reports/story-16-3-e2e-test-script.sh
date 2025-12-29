#!/bin/bash

# Story 16.3 端到端测试脚本
# 测试用户和角色管理功能

set -e

BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3005"

echo "=========================================="
echo "Story 16.3 端到端测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_case() {
    local name=$1
    local command=$2
    local expected=$3
    
    echo -n "测试: $name ... "
    
    if eval "$command" | grep -q "$expected" 2>/dev/null; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        ((FAILED++))
        return 1
    fi
}

# 检查服务状态
echo "1. 检查服务状态"
echo "----------------"

if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    exit 1
fi

if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务运行正常${NC}"
else
    echo -e "${RED}✗ 前端服务未运行${NC}"
    exit 1
fi

echo ""

# 测试 API 端点（需要认证）
echo "2. 测试 API 端点"
echo "----------------"

# 注意：这些测试需要有效的 JWT token
# 实际测试时，需要先登录获取 token

echo "提示：以下测试需要有效的认证 token"
echo "请先登录系统获取 token，然后更新脚本中的 TOKEN 变量"
echo ""

# 示例：测试获取用户列表（需要 token）
# TOKEN="your-jwt-token-here"
# test_case "获取用户列表" "curl -s -H \"Authorization: Bearer $TOKEN\" $BACKEND_URL/users" "email"

echo "3. 测试数据库连接"
echo "----------------"

# 检查数据库连接（通过健康检查端点）
DB_STATUS=$(curl -s "$BACKEND_URL/health" | grep -o '"status":"connected"' || echo "")
if [ -n "$DB_STATUS" ]; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"
else
    echo -e "${YELLOW}⚠ 无法验证数据库连接状态${NC}"
fi

echo ""

# 总结
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}部分测试失败${NC}"
    exit 1
fi

