#!/bin/bash

# Story 16.3 端到端测试执行脚本
# 支持手动输入 token 或自动登录

set -e

BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3005"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0
SKIPPED=0

# 测试结果数组
declare -a TEST_RESULTS

echo "=========================================="
echo "Story 16.3 端到端测试"
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

# 2. 获取认证 Token
echo -e "${BLUE}2. 获取认证 Token${NC}"
echo "----------------"

TOKEN=""

# 方法 1: 从环境变量获取
if [ -n "$TEST_TOKEN" ]; then
    TOKEN="$TEST_TOKEN"
    echo -e "${GREEN}✓ 使用环境变量中的 token${NC}"
# 方法 2: 尝试自动登录
elif [ -n "$TEST_EMAIL" ] && [ -n "$TEST_PASSWORD" ]; then
    echo "正在尝试自动登录..."
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$BACKEND_URL/auth/login")
    
    HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
    BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        TOKEN=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$TOKEN" ]; then
            echo -e "${GREEN}✓ 登录成功${NC}"
            echo "Token: ${TOKEN:0:30}..."
        else
            echo -e "${RED}✗ 登录失败：无法获取 token${NC}"
        fi
    else
        echo -e "${RED}✗ 登录失败 (HTTP $HTTP_CODE)${NC}"
        echo "响应: $BODY" | head -3
    fi
fi

# 方法 3: 提示用户手动输入
if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}需要认证 token 才能继续测试${NC}"
    echo ""
    echo "请选择以下方式之一："
    echo "  1. 在浏览器中登录系统（http://localhost:3005/login）"
    echo "  2. 打开浏览器开发者工具（F12）"
    echo "  3. 进入 Application > Local Storage"
    echo "  4. 复制 'fenghua_auth_token' 的值"
    echo ""
    echo -e "${CYAN}或者设置环境变量：${NC}"
    echo "  export TEST_TOKEN='your-token-here'"
    echo "  export TEST_EMAIL='your-email@example.com'"
    echo "  export TEST_PASSWORD='your-password'"
    echo ""
    read -p "请输入 token（或按 Enter 跳过需要认证的测试）: " MANUAL_TOKEN
    
    if [ -n "$MANUAL_TOKEN" ]; then
        TOKEN="$MANUAL_TOKEN"
        echo -e "${GREEN}✓ 使用手动输入的 token${NC}"
    else
        echo -e "${YELLOW}未提供 token，跳过需要认证的测试${NC}"
        SKIPPED=12
    fi
fi

echo ""

# 3. 执行测试
if [ -z "$TOKEN" ]; then
    echo "=========================================="
    echo "测试总结"
    echo "=========================================="
    echo -e "通过: ${GREEN}$PASSED${NC}"
    echo -e "失败: ${RED}$FAILED${NC}"
    echo -e "跳过: ${YELLOW}$SKIPPED${NC}"
    echo ""
    echo -e "${YELLOW}要执行完整测试，请提供认证 token${NC}"
    exit 0
fi

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
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" \
            "$url" 2>/dev/null)
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            "$url" 2>/dev/null)
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
        ERROR_MSG=$(echo "$BODY" | head -1 | cut -c1-80)
        echo "  错误: $ERROR_MSG"
        ((FAILED++))
        TEST_RESULTS+=("✗ $name (HTTP $HTTP_CODE)")
        return 1
    fi
}

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
echo -n "获取用户 ID ... "
USER_LIST=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/users" 2>/dev/null)
FIRST_USER_ID=$(echo "$USER_LIST" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if data and len(data) > 0 else '')" 2>/dev/null || echo "$USER_LIST" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$FIRST_USER_ID" ] && [ "$FIRST_USER_ID" != "null" ]; then
    echo -e "${GREEN}✓ 找到用户 ID${NC}"
    test_api "获取单个用户" "GET" "$BACKEND_URL/users/$FIRST_USER_ID" "" "200"
else
    echo -e "${YELLOW}⚠ 无法获取用户 ID${NC}"
    ((SKIPPED++))
fi

# 创建新用户
TEST_EMAIL_NEW="test-user-$(date +%s)@example.com"
CREATE_USER_DATA="{\"email\":\"$TEST_EMAIL_NEW\",\"password\":\"test123456\",\"firstName\":\"测试\",\"lastName\":\"用户\",\"role\":\"FRONTEND_SPECIALIST\"}"
test_api "创建新用户" "POST" "$BACKEND_URL/users" "$CREATE_USER_DATA" "201"

# 获取新创建的用户 ID（用于后续测试）
sleep 1
NEW_USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/users?search=$TEST_EMAIL_NEW" 2>/dev/null)
NEW_USER_ID=$(echo "$NEW_USER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if data and len(data) > 0 else '')" 2>/dev/null || echo "$NEW_USER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$NEW_USER_ID" ] && [ "$NEW_USER_ID" != "null" ]; then
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
if [ -n "$FIRST_USER_ID" ] && [ "$FIRST_USER_ID" != "null" ]; then
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
test_api "搜索词长度验证 (101字符)" "GET" "$BACKEND_URL/users?search=$LONG_SEARCH" "" "400"

# 测试过长的角色筛选
LONG_ROLE=$(printf 'a%.0s' {1..51})
test_api "角色筛选长度验证 (51字符)" "GET" "$BACKEND_URL/users?role=$LONG_ROLE" "" "400"

echo ""

# 总结
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "跳过: ${YELLOW}$SKIPPED${NC}"
echo ""

if [ ${#TEST_RESULTS[@]} -gt 0 ]; then
    echo "详细结果："
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == ✓* ]]; then
            echo -e "  ${GREEN}$result${NC}"
        else
            echo -e "  ${RED}$result${NC}"
        fi
    done
    echo ""
fi

if [ $FAILED -eq 0 ] && [ $PASSED -gt 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
elif [ $PASSED -gt 0 ]; then
    echo -e "${YELLOW}部分测试通过，部分测试失败${NC}"
    exit 1
else
    echo -e "${YELLOW}没有执行任何测试${NC}"
    exit 0
fi

