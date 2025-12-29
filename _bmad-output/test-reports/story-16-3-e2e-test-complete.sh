#!/bin/bash

# Story 16.3 完整端到端测试脚本
# 包含登录和所有 API 测试

set -e

BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3005"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0
SKIPPED=0

# 测试结果数组
declare -a TEST_RESULTS

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_code=${5:-200}
    
    echo -n "测试: $name ... "
    
    if [ -n "$data" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
            -d "$data" \
            "$url")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
            "$url")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo -e "${GREEN}✓ 通过 (HTTP $HTTP_CODE)${NC}"
        ((PASSED++))
        TEST_RESULTS+=("✓ $name")
        return 0
    else
        echo -e "${RED}✗ 失败 (HTTP $HTTP_CODE)${NC}"
        echo "  响应: $BODY" | head -3
        ((FAILED++))
        TEST_RESULTS+=("✗ $name (HTTP $HTTP_CODE)")
        return 1
    fi
}

echo "=========================================="
echo "Story 16.3 完整端到端测试"
echo "=========================================="
echo ""

# 1. 检查服务状态
echo -e "${BLUE}1. 检查服务状态${NC}"
echo "----------------"

if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
    HEALTH=$(curl -s "$BACKEND_URL/health")
    DB_STATUS=$(echo "$HEALTH" | grep -o '"status":"connected"' || echo "")
    if [ -n "$DB_STATUS" ]; then
        echo -e "${GREEN}✓ 数据库连接正常${NC}"
    fi
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    exit 1
fi

if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务运行正常${NC}"
else
    echo -e "${YELLOW}⚠ 前端服务未运行（可选）${NC}"
fi

echo ""

# 2. 登录获取 token
echo -e "${BLUE}2. 登录获取 Token${NC}"
echo "----------------"

# 提示输入登录信息
if [ -z "$TEST_EMAIL" ] || [ -z "$TEST_PASSWORD" ]; then
    echo -e "${YELLOW}提示：设置环境变量以自动登录：${NC}"
    echo "  export TEST_EMAIL='your-email@example.com'"
    echo "  export TEST_PASSWORD='your-password'"
    echo ""
    echo -e "${YELLOW}或手动登录后从浏览器 localStorage 获取 token${NC}"
    echo "  export TEST_TOKEN='your-jwt-token-here'"
    echo ""
    
    if [ -z "$TEST_TOKEN" ]; then
        echo -e "${YELLOW}未设置登录信息，跳过需要认证的测试${NC}"
        SKIPPED=12
        echo ""
        echo "=========================================="
        echo "测试总结"
        echo "=========================================="
        echo -e "通过: ${GREEN}$PASSED${NC}"
        echo -e "失败: ${RED}$FAILED${NC}"
        echo -e "跳过: ${YELLOW}$SKIPPED${NC}"
        echo ""
        echo -e "${YELLOW}要执行完整测试，请设置登录信息或 token${NC}"
        exit 0
    fi
else
    # 自动登录
    echo "正在登录..."
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$BACKEND_URL/auth/login")
    
    HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
    BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$TOKEN" ]; then
            echo -e "${GREEN}✓ 登录成功${NC}"
            echo "Token: ${TOKEN:0:20}..."
        else
            echo -e "${RED}✗ 登录失败：无法获取 token${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ 登录失败 (HTTP $HTTP_CODE)${NC}"
        echo "响应: $BODY"
        exit 1
    fi
fi

echo ""

# 3. 测试用户管理 API
echo -e "${BLUE}3. 测试用户管理 API${NC}"
echo "----------------"

# 获取用户列表
test_api "获取用户列表" "GET" "$BACKEND_URL/users" "" "200"

# 按角色筛选
test_api "按角色筛选用户 (ADMIN)" "GET" "$BACKEND_URL/users?role=ADMIN" "" "200"

# 搜索用户
test_api "搜索用户" "GET" "$BACKEND_URL/users?search=test" "" "200"

# 获取单个用户（需要先获取用户 ID）
USER_LIST=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/users")
FIRST_USER_ID=$(echo "$USER_LIST" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -n "$FIRST_USER_ID" ]; then
    test_api "获取单个用户" "GET" "$BACKEND_URL/users/$FIRST_USER_ID" "" "200"
else
    echo -e "${YELLOW}⚠ 跳过：无法获取用户 ID${NC}"
    ((SKIPPED++))
fi

# 创建新用户
TEST_EMAIL_NEW="test-user-$(date +%s)@example.com"
CREATE_USER_DATA="{\"email\":\"$TEST_EMAIL_NEW\",\"password\":\"test123456\",\"firstName\":\"测试\",\"lastName\":\"用户\",\"role\":\"FRONTEND_SPECIALIST\"}"
test_api "创建新用户" "POST" "$BACKEND_URL/users" "$CREATE_USER_DATA" "201"

# 获取新创建的用户 ID（用于后续测试）
NEW_USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/users?search=$TEST_EMAIL_NEW")
NEW_USER_ID=$(echo "$NEW_USER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$NEW_USER_ID" ]; then
    # 更新用户
    UPDATE_USER_DATA="{\"firstName\":\"更新\",\"lastName\":\"用户\",\"role\":\"ADMIN\"}"
    test_api "更新用户信息" "PUT" "$BACKEND_URL/users/$NEW_USER_ID" "$UPDATE_USER_DATA" "200"
    
    # 软删除用户
    test_api "软删除用户" "DELETE" "$BACKEND_URL/users/$NEW_USER_ID" "" "204"
else
    echo -e "${YELLOW}⚠ 跳过更新和删除测试：无法获取新用户 ID${NC}"
    ((SKIPPED+=2))
fi

echo ""

# 4. 测试角色管理 API
echo -e "${BLUE}4. 测试角色管理 API${NC}"
echo "----------------"

# 获取所有角色
test_api "获取所有角色" "GET" "$BACKEND_URL/roles" "" "200"

# 获取用户角色（需要有效的用户 ID）
if [ -n "$FIRST_USER_ID" ]; then
    test_api "获取用户角色" "GET" "$BACKEND_URL/roles/users/$FIRST_USER_ID" "" "200"
else
    echo -e "${YELLOW}⚠ 跳过：无法获取用户 ID${NC}"
    ((SKIPPED++))
fi

echo ""

# 5. 测试输入验证
echo -e "${BLUE}5. 测试输入验证${NC}"
echo "----------------"

# 测试过长的搜索词
LONG_SEARCH=$(printf 'a%.0s' {1..101})
test_api "搜索词长度验证" "GET" "$BACKEND_URL/users?search=$LONG_SEARCH" "" "400"

# 测试过长的角色筛选
LONG_ROLE=$(printf 'a%.0s' {1..51})
test_api "角色筛选长度验证" "GET" "$BACKEND_URL/users?role=$LONG_ROLE" "" "400"

echo ""

# 总结
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "跳过: ${YELLOW}$SKIPPED${NC}"
echo ""

echo "详细结果："
for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == ✓* ]]; then
        echo -e "  ${GREEN}$result${NC}"
    else
        echo -e "  ${RED}$result${NC}"
    fi
done

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}部分测试失败${NC}"
    exit 1
fi

