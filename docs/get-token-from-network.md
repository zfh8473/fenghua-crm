# 从浏览器 Network 标签获取 Token

**日期：** 2025-12-25  
**问题：** 无法通过 API 自动获取 access token

---

## 🎯 最简单的方法：从 Network 请求中获取

由于 `getAuthTokensFromLoginToken` 的格式需要确认，最可靠的方法是从浏览器的 Network 请求中获取 token。

### 步骤：

1. **打开浏览器开发者工具**
   - 按 `F12` 或右键 > 检查
   - 转到 **Network** 标签

2. **登录 Twenty CRM**
   - 访问：http://localhost:3000
   - 使用你的账户登录（如果还没登录）

3. **查找 GraphQL 请求**
   - 在 Network 标签中，查找请求到 `/graphql` 的请求
   - 或者筛选 "graphql" 或 "fetch"

4. **查看请求头**
   - 点击一个 GraphQL 请求
   - 在右侧面板中，点击 **Headers** 标签
   - 向下滚动到 **Request Headers** 部分
   - 查找 `Authorization` 或 `authorization` 头
   - 格式通常是：`Authorization: Bearer <token>`

5. **复制 Token**
   - 复制 `Bearer ` 后面的 token 值（不包括 "Bearer "）
   - 例如：如果看到 `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`
   - 只复制 `eyJhbGciOiJIUzI1NiIs...` 这部分

6. **使用 Token 运行测试**
   ```bash
   cd fenghua-backend
   export TWENTY_TEST_TOKEN=your_token_here
   npx ts-node scripts/test-api.ts
   ```

---

## 📸 示例

在 Network 标签中，你应该看到类似这样的请求：

```
Request URL: http://localhost:3000/graphql
Request Method: POST
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

复制 `Bearer ` 后面的整个 token 字符串。

---

## 🔍 如果找不到 GraphQL 请求

如果 Network 标签中没有 GraphQL 请求，可以：

1. **刷新页面** - 这会触发新的请求
2. **执行操作** - 在 Twenty CRM 中点击任何功能，这会触发 API 请求
3. **查看所有请求** - 在 Network 标签中，确保筛选器设置为 "All"

---

## ✅ 验证 Token

获取 token 后，可以运行测试验证：

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node scripts/test-api.ts
```

如果测试成功，你会看到 API 查询的结果。

---

## 🔗 相关文档

- [Token 获取指南](token-acquisition-guide.md)
- [API 测试指南](api-testing-guide.md)
- [Token 位置说明](token-location-notes.md)

