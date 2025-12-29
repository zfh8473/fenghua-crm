#!/bin/bash

# Story 16.3 API 端到端测试脚本
# 测试用户和角色管理 API

set -e

BACKEND_URL="http://localhost:3001"

echo "=========================================="
echo "Story 16.3 API 端到端测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 检查服务
echo -e "${BLUE}1. 检查服务状态${NC}"
echo "----------------"

if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
    HEALTH=$(curl -s "$BACKEND_URL/health")
    echo "健康检查响应: $HEALTH"
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    exit 1
fi

echo ""

# 提示需要 token
echo -e "${YELLOW}⚠️  注意：以下测试需要有效的 JWT token${NC}"
echo "请先登录系统获取 token，然后设置环境变量："
echo "  export TEST_TOKEN='your-jwt-token-here'"
echo ""

if [ -z "$TEST_TOKEN" ]; then
    echo -e "${YELLOW}未设置 TEST_TOKEN，跳过需要认证的测试${NC}"
    echo ""
    echo "测试总结："
    echo "  - 服务状态检查：✓"
    echo "  - API 测试：需要 token"
    exit 0
fi

echo -e "${BLUE}2. 测试用户管理 API${NC}"
echo "----------------"

# 测试获取用户列表
echo -n "测试: 获取用户列表 ... "
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TEST_TOKEN" "$BACKEND_URL/users")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASSED++))
    USER_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "  找到 $USER_COUNT 个用户"
else
    echo -e "${RED}✗ 失败 (HTTP $HTTP_CODE)${NC}"
    echo "  响应: $BODY"
    ((FAILED++))
fi

# 测试按角色筛选
echo -n "测试: 按角色筛选用户 ... "
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TEST_TOKEN" "$BACKEND_URL/users?role=ADMIN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ 失败 (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
fi

# 测试搜索
echo -n "测试: 搜索用户 ... "
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TEST_TOKEN" "$BACKEND_URL/users?search=test")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ 失败 (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
fi

echo ""

echo -e "${BLUE}3. 测试角色管理 API${NC}"
echo "----------------"

# 测试获取所有角色
echo -n "测试: 获取所有角色 ... "
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TEST_TOKEN" "$BACKEND_URL/roles")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASSED++))
    ROLE_COUNT=$(echo "$BODY" | grep -o '"name"' | wc -l | tr -d ' ')
    echo "  找到 $ROLE_COUNT 个角色"
else
    echo -e "${RED}✗ 失败 (HTTP $HTTP_CODE)${NC}"
    echo "  响应: $BODY"
    ((FAILED++))
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

