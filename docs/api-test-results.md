# Twenty CRM API 测试结果

**测试日期：** 2025-12-25  
**测试脚本：** `fenghua-backend/scripts/test-api.ts`  
**Twenty CRM URL：** http://localhost:3000/graphql

---

## ⚠️ 当前状态

**Token 获取问题：** `getAuthTokensFromLoginToken` mutation 的返回结构需要确认。

**临时解决方案：** 从浏览器获取 token 后运行测试。

---

## 📋 测试步骤

### 步骤 1: 获取 Token

**从浏览器获取（推荐）：**

1. 登录 Twenty CRM: http://localhost:3000
2. 打开 DevTools (F12) > Application > Local Storage
3. 查找 token（可能是 `token`, `accessToken`, `authToken` 等）
4. 复制 token 值

### 步骤 2: 运行测试

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node scripts/test-api.ts
```

---

## 📊 测试结果

### Test 1: Query Workspace Members

**状态：** ⏳ 待测试  
**Query:**
```graphql
query {
  workspaceMembers {
    id
    user {
      id
      email
      firstName
      lastName
    }
    roles {
      role
    }
    createdAt
    updatedAt
  }
}
```

**结果：**  
**可用：** ❓  
**备注：**

---

### Test 2: Query Current User and Workspace

**状态：** ⏳ 待测试  
**Query:**
```graphql
query {
  currentUser {
    id
    email
    firstName
    lastName
    workspaceMember {
      id
      workspace {
        id
        name
      }
      roles {
        role
      }
    }
  }
}
```

**结果：**  
**可用：** ❓  
**备注：**

---

### Test 3: Create User

**状态：** ⏳ 待测试  
**Mutation:**
```graphql
mutation CreateUser($email: String!, $password: String!, $firstName: String, $lastName: String) {
  createUser(
    email: $email
    password: $password
    firstName: $firstName
    lastName: $lastName
  ) {
    id
    email
    firstName
    lastName
    createdAt
  }
}
```

**结果：**  
**可用：** ❓  
**Mutation 格式：**  
**备注：**

---

### Test 4: Create Workspace Member

**状态：** ⏳ 待测试  
**Mutation:**
```graphql
mutation CreateWorkspaceMember($userId: ID!, $workspaceId: ID!, $role: String!) {
  createWorkspaceMember(
    userId: $userId
    workspaceId: $workspaceId
    role: $role
  ) {
    id
    roles {
      role
    }
    createdAt
  }
}
```

**结果：**  
**可用：** ❓  
**Mutation 格式：**  
**备注：**

---

### Test 5: Update Workspace Member Role

**状态：** ⏳ 待测试  
**Mutation (尝试多种格式):**
```graphql
# Format 1
mutation UpdateWorkspaceMember($id: ID!, $role: String!) {
  updateWorkspaceMember(id: $id, role: $role) {
    id
    roles { role }
  }
}

# Format 2
mutation UpdateWorkspaceMember($id: ID!, $input: WorkspaceMemberUpdateInput!) {
  updateWorkspaceMember(id: $id, input: $input) {
    id
    roles { role }
  }
}
```

**结果：**  
**可用：** ❓  
**Mutation 格式：**  
**备注：**

---

## 🔍 发现的问题

### 1. getAuthTokensFromLoginToken 格式问题

**错误信息：**
- `Cannot query field "accessToken" on type "AuthTokenPair"`
- `Cannot query field "accessToken" on type "AuthTokens"`

**说明：** `AuthTokenPair` 和 `AuthTokens` 的实际字段结构需要确认。

**解决方案：**
1. 使用 GraphQL introspection 查询实际 schema
2. 或从浏览器获取 token（推荐）

---

## 🔄 根据结果更新代码

### 如果 createUser 不可用

更新 `fenghua-backend/src/users/users.service.ts` 中的错误消息，指导用户手动创建。

### 如果角色分配 API 不同

根据实际可用的 mutation 格式调整代码中的 GraphQL queries。

---

## 📝 测试记录

### 2025-12-25: 初始测试准备

- ✅ 创建了测试脚本
- ✅ 创建了 token 获取脚本
- ⚠️ 发现 `getAuthTokensFromLoginToken` 格式问题
- ⏳ 等待从浏览器获取 token 后运行完整测试

---

## 🔗 相关文档

- [Token 获取指南](token-acquisition-guide.md)
- [API 测试指南](api-testing-guide.md)
- [Twenty CRM 用户管理 API 文档](twenty-user-management-api.md)
