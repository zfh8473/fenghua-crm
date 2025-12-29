# Twenty CRM API 测试指南

**日期：** 2025-12-25  
**目的：** 指导如何测试 Twenty CRM 的用户管理 GraphQL API

---

## 📋 前置条件

1. **Twenty CRM 正在运行**
   - 确保 Twenty CRM 在 `http://localhost:3000` 运行
   - 可以通过访问 `http://localhost:3000` 验证

2. **安装依赖**
   ```bash
   cd fenghua-backend
   npm install --save-dev ts-node @types/node
   ```

3. **获取 JWT Token**

---

## 🔑 获取 JWT Token

### 方法 1: 通过登录脚本获取（推荐）

```bash
cd fenghua-backend
TWENTY_TEST_EMAIL=your@email.com \
TWENTY_TEST_PASSWORD=yourpassword \
npx ts-node ../scripts/get-token-from-login.ts
```

脚本会输出 token，然后可以设置环境变量：
```bash
export TWENTY_TEST_TOKEN=your_token_here
```

### 方法 2: 从浏览器获取

1. 在浏览器中登录 Twenty CRM (`http://localhost:3000`)
2. 打开开发者工具 (F12)
3. 转到 **Application** > **Local Storage** > `http://localhost:3000`
4. 查找 token 相关的 key（可能是 `token`, `accessToken`, `authToken` 等）
5. 复制 token 值
6. 设置环境变量：
   ```bash
   export TWENTY_TEST_TOKEN=your_token_here
   ```

### 方法 3: 从 Network 请求获取

1. 在浏览器中登录 Twenty CRM
2. 打开开发者工具 > **Network** 标签
3. 刷新页面或执行任何操作
4. 查找 GraphQL 请求
5. 查看请求头中的 `Authorization: Bearer <token>`
6. 复制 token 值

---

## 🧪 运行 API 测试

### 使用测试脚本

```bash
# 设置 token（如果还没有设置）
export TWENTY_TEST_TOKEN=your_token_here

# 运行测试
cd fenghua-backend
npx ts-node ../scripts/test-twenty-user-api.ts
```

### 使用测试运行器

```bash
# 设置 token
export TWENTY_TEST_TOKEN=your_token_here

# 运行测试
./scripts/run-api-tests.sh
```

---

## 📊 测试内容

测试脚本会验证以下 API：

1. **Query Workspace Members** ✅
   - 测试查询所有工作空间成员
   - 验证返回的数据结构

2. **Query Current User** ✅
   - 测试查询当前用户信息
   - 验证工作空间信息

3. **Create User** ❓
   - 测试创建用户 mutation
   - 如果不可用，会显示警告

4. **Create Workspace Member** ❓
   - 测试创建工作空间成员
   - 如果不可用，会显示警告

5. **Update Workspace Member Role** ❓
   - 测试更新工作空间成员角色
   - 如果不可用，会显示警告

---

## 📝 测试结果解读

### ✅ 成功示例

```
=== Test 1: Query Workspace Members ===
✅ Success: {
  "workspaceMembers": [
    {
      "id": "...",
      "user": { ... },
      "roles": [ ... ]
    }
  ]
}
```

### ⚠️ API 不可用示例

```
=== Test 3: Try Create User ===
⚠️  CreateUser mutation not available: Cannot query field "createUser" on type "Mutation"
```

### ❌ 错误示例

```
=== Test 1: Query Workspace Members ===
❌ Error: Unauthorized
Response: {
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": { ... }
    }
  ]
}
```

---

## 🔧 根据测试结果调整代码

### 如果 `createUser` 不可用

更新 `fenghua-backend/src/users/users.service.ts`：

```typescript
// 在 create 方法中，如果 createUser mutation 失败
// 提供友好的错误消息，指导用户手动创建
throw new BadRequestException(
  'User creation via API is not supported. ' +
  'Please create the user manually in Twenty CRM admin panel, ' +
  'then use the update endpoint to assign roles.'
);
```

### 如果角色分配 API 不同

根据实际可用的 mutation 调整代码：

```typescript
// 如果 updateWorkspaceMember 的参数不同
// 调整 mutation 格式
const mutation = `
  mutation UpdateWorkspaceMember($id: ID!, $input: WorkspaceMemberUpdateInput!) {
    updateWorkspaceMember(id: $id, input: $input) {
      id
      roles { role }
    }
  }
`;
```

---

## 📋 测试检查清单

- [ ] Twenty CRM 服务正在运行
- [ ] 已安装 ts-node 和 @types/node
- [ ] 已获取有效的 JWT token
- [ ] 已设置 TWENTY_TEST_TOKEN 环境变量
- [ ] 运行测试脚本
- [ ] 记录测试结果
- [ ] 根据结果更新代码实现
- [ ] 更新 API 文档

---

## 🐛 常见问题

### 问题 1: "ts-node not found"

**解决方案：**
```bash
cd fenghua-backend
npm install --save-dev ts-node @types/node
```

### 问题 2: "Unauthorized" 错误

**原因：** Token 无效或已过期

**解决方案：**
- 重新获取 token
- 检查 token 格式是否正确
- 确保 token 没有过期

### 问题 3: "Cannot query field" 错误

**原因：** GraphQL mutation/query 不存在

**解决方案：**
- 这是正常的，说明该 API 不可用
- 记录结果，更新代码使用替代方案
- 更新文档说明哪些 API 可用

### 问题 4: Connection refused

**原因：** Twenty CRM 服务未运行

**解决方案：**
```bash
# 检查 Twenty CRM 是否运行
curl http://localhost:3000/health

# 如果未运行，启动服务
# 参考部署文档
```

---

## 📚 相关文档

- [Twenty CRM 用户管理 API 文档](twenty-user-management-api.md)
- [用户管理实施说明](user-management-implementation-notes.md)
- [代码审查报告](../_bmad-output/code-review-reports/code-review-story-1-3-2025-12-25.md)

---

## 🔄 下一步

1. **运行测试**：按照上述步骤运行测试脚本
2. **记录结果**：将测试结果记录到文档中
3. **更新实现**：根据实际可用的 API 调整代码
4. **更新文档**：更新 API 文档记录实际可用的 mutations

