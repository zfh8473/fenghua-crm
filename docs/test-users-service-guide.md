# UsersService 测试指南

**日期：** 2025-12-25  
**目的：** 测试更新后的 UsersService 方法是否按预期工作

---

## 🔑 获取 Token

### 方法 1: 从浏览器获取（推荐）

1. 打开浏览器，访问 http://localhost:3000
2. 登录 Twenty CRM
3. 打开 DevTools (F12) > Network 标签
4. 查找 GraphQL 请求
5. 查看请求头中的 `Authorization: Bearer <token>`
6. 复制 token 值

### 方法 2: 使用后端登录 API

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"zfh8473@gmail.com","password":"Zfh122431!"}'
```

从响应中提取 `token` 字段。

---

## 🧪 测试方法

### 方法 1: 直接测试 Service 方法（推荐）

**优点：** 直接测试服务逻辑，不依赖 HTTP 层

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node scripts/test-users-direct.ts
```

**测试内容：**
- ✅ `findAll()` - 查询所有用户
- ✅ `findOne()` - 查询单个用户
- ✅ `update()` - 更新用户信息
- ✅ `create()` - 创建用户（应该失败并显示帮助消息）
- ✅ `remove()` - 删除用户（测试防止自删除）

---

### 方法 2: 通过 HTTP API 测试

**优点：** 测试完整的 HTTP 请求流程

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node scripts/test-users-api.ts
```

**测试端点：**
- ✅ `GET /users` - 获取所有用户
- ✅ `GET /users/:id` - 获取单个用户
- ✅ `POST /users` - 创建用户（应该失败）
- ✅ `PUT /users/:id` - 更新用户
- ✅ `DELETE /users/:id` - 删除用户

---

## 📋 预期结果

### 1. findAll() - 查询所有用户

**预期：**
- ✅ 返回用户数组
- ✅ 每个用户包含：id, email, firstName, lastName, role, createdAt, updatedAt
- ✅ 使用 GraphQL Connection Pattern (edges.node)
- ✅ 通过 userId 获取用户详情

**示例输出：**
```json
[
  {
    "id": "e1523409-53b9-484b-b920-baf9d2ea1152",
    "email": "zfh8473@gmail.com",
    "firstName": "",
    "lastName": "",
    "role": "7a5e2079-4d69-4712-85d9-e10a66d81972",
    "createdAt": "2025-12-23T21:00:42.804Z",
    "updatedAt": "2025-12-23T21:00:56.350Z"
  }
]
```

---

### 2. findOne() - 查询单个用户

**预期：**
- ✅ 返回单个用户对象
- ✅ 包含完整的用户信息
- ✅ 如果用户不存在，抛出 `NotFoundException`

---

### 3. create() - 创建用户

**预期：**
- ❌ 应该失败（因为 `createUser` mutation 不存在）
- ✅ 错误消息应该包含：
  - "not supported"
  - "manually"
  - 或指向 Twenty CRM 管理面板的指导

**示例错误消息：**
```
User creation via GraphQL API is not supported by Twenty CRM. 
Please create the user manually in Twenty CRM admin panel (http://localhost:3000), 
then use the update endpoint to assign roles if needed.
```

---

### 4. update() - 更新用户

**预期：**
- ✅ 成功更新用户信息（如果 `updateUser` mutation 可用）
- ⚠️ 或者使用现有用户数据（如果 mutation 不可用）
- ✅ 尝试更新角色（可能失败，但会记录警告）

**注意：** 如果 `updateUser` mutation 不可用，方法会使用现有用户数据，这是预期的行为。

---

### 5. remove() - 删除用户

**预期：**
- ✅ 防止自删除（如果尝试删除自己的账户）
- ✅ 错误消息：`不能删除自己的账户` 或类似消息
- ⚠️ 实际删除功能需要进一步测试（因为可能影响数据）

---

## 🔍 验证要点

### 1. GraphQL Connection Pattern

检查 `findAll()` 是否正确处理 `edges.node` 结构：
- ✅ 使用 `result.workspaceMembers.edges.map(edge => edge.node)`
- ✅ 正确提取 `userId` 字段

### 2. 用户详情获取

检查 `fetchUserDetailsByIds()` 是否正常工作：
- ✅ 能够获取当前用户信息
- ✅ 为其他用户尝试查询（可能失败，但会使用占位符）

### 3. 错误处理

检查错误处理是否完善：
- ✅ `create()` 提供清晰的错误消息
- ✅ `update()` 在 mutation 失败时使用现有数据
- ✅ 所有方法都有适当的日志记录

### 4. 角色更新

检查角色更新逻辑：
- ✅ 尝试使用正确的 `updateWorkspaceMember` 格式
- ✅ 如果失败，记录警告但不阻止用户更新

---

## 📝 测试记录

运行测试后，请记录：

1. **测试日期和时间**
2. **使用的 token**（仅记录前 20 个字符）
3. **每个测试的结果**（成功/失败）
4. **任何错误或警告**
5. **需要改进的地方**

---

## 🔗 相关文档

- [API 测试结果](api-test-results-final.md)
- [UsersService 更新总结](users-service-update-summary.md)
- [Token 获取指南](get-token-from-network.md)

