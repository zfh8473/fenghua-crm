#!/bin/bash

# Story 2.2 API 测试脚本
# 用于测试产品搜索 API 端点

API_URL="http://localhost:3001"
TOKEN="" # 需要从浏览器 localStorage 获取

echo "=== Story 2.2 API 测试 ==="
echo ""

# 测试 1: 产品名称搜索
echo "测试 1: 产品名称搜索"
echo "请求: GET ${API_URL}/products?search=不锈钢"
curl -s -X GET "${API_URL}/products?search=不锈钢" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.total, .products[0].name' 2>/dev/null || echo "需要设置 TOKEN"
echo ""

# 测试 2: HS编码搜索
echo "测试 2: HS编码搜索"
echo "请求: GET ${API_URL}/products?search=7323"
curl -s -X GET "${API_URL}/products?search=7323" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.total, .products[0].hsCode' 2>/dev/null || echo "需要设置 TOKEN"
echo ""

# 测试 3: 类别筛选
echo "测试 3: 类别筛选"
echo "请求: GET ${API_URL}/products?category=电子产品"
curl -s -X GET "${API_URL}/products?category=电子产品" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.total, .products[0].category' 2>/dev/null || echo "需要设置 TOKEN"
echo ""

# 测试 4: 组合搜索
echo "测试 4: 组合搜索（名称 + 类别）"
echo "请求: GET ${API_URL}/products?search=不锈钢&category=电子产品"
curl -s -X GET "${API_URL}/products?search=不锈钢&category=电子产品" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.total' 2>/dev/null || echo "需要设置 TOKEN"
echo ""

# 测试 5: 分页
echo "测试 5: 分页功能"
echo "请求: GET ${API_URL}/products?limit=5&offset=0"
curl -s -X GET "${API_URL}/products?limit=5&offset=0" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.products | length, .total' 2>/dev/null || echo "需要设置 TOKEN"
echo ""

echo "=== 测试完成 ==="
echo ""
echo "注意：需要设置 TOKEN 环境变量才能执行完整测试"
echo "TOKEN 可以从浏览器 localStorage 中获取（fenghua_auth_token）"

