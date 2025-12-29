# Twenty CRM Token 获取指南

**日期：** 2025-12-25  
**问题：** `getAuthTokensFromLoginToken` mutation 的返回结构需要确认

---

## 🔍 发现的问题

通过测试发现，`getAuthTokensFromLoginToken` mutation 的返回类型是 `AuthTokenPair`，但字段结构与我们预期的不同：

- ❌ 不是 `accessToken { token, expiresAt }`
- ❌ 不是 `tokens { accessToken { token } }`
- ❓ 实际结构需要查看 GraphQL schema

---

## 🔑 获取 Token 的方法

### 方法 1: 从浏览器获取（最可靠）

1. **登录 Twenty CRM**
   - 访问：http://localhost:3000
   - 使用邮箱和密码登录

2. **打开开发者工具**
   - 按 F12 或右键 > 检查
   - 转到 **Application** 标签（Chrome）或 **Storage** 标签（Firefox）

3. **查找 Token**
   - 在 **Local Storage** > `http://localhost:3000` 中查找
   - 可能的 key 名称：
     - `token`
     - `accessToken`
     - `authToken`
     - `twenty-token`
     - `auth.accessToken`
   - 或者在 **Session Storage** 中查找

4. **复制 Token**
   - 复制 token 的值
   - 设置环境变量：
     ```bash
     export TWENTY_TEST_TOKEN=your_token_here
     ```

### 方法 2: 从 Network 请求获取

1. **登录 Twenty CRM**
2. **打开开发者工具 > Network 标签**
3. **刷新页面或执行操作**
4. **查找 GraphQL 请求**
5. **查看请求头中的 Authorization**
   - 格式：`Authorization: Bearer <token>`
6. **复制 token 值**

### 方法 3: 使用登录脚本（需要修复）

当前登录脚本可以获取 `loginToken`，但 `getAuthTokensFromLoginToken` 的格式需要确认。

**临时方案：** 使用 `loginToken` 直接测试（可能不适用于所有端点）

---

## 🧪 运行测试

获取 token 后：

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node scripts/test-api.ts
```

---

## 📝 下一步行动

1. **从浏览器获取 token**（推荐）
2. **运行 API 测试**
3. **记录测试结果**
4. **根据结果更新代码实现**
5. **修复 `getAuthTokensFromLoginToken` 的格式**（如果需要）

---

## 🔧 修复 getAuthTokensFromLoginToken

需要：
1. 查看 Twenty CRM 的 GraphQL schema
2. 确认 `AuthTokenPair` 和 `AuthTokens` 的实际字段
3. 更新 `auth.service.ts` 和 `get-token.ts` 脚本

可以使用 introspection query 查看 schema：
```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token
npx ts-node scripts/introspect-schema.ts
```

