# Twenty CRM 用户管理 API 文档

**日期：** 2025-12-25  
**项目：** fenghua-crm  
**目的：** 记录 Twenty CRM 的用户管理 GraphQL API

---

## ⚠️ 重要说明

Twenty CRM 的用户管理主要通过 **Workspace Members** 来实现。用户（User）和 Workspace Member 是不同的概念：

- **User**: 基础用户账户（邮箱、密码、个人信息）
- **Workspace Member**: 用户在特定工作空间中的成员身份和角色

---

## 📋 GraphQL API 参考

### 1. 查询 Workspace Members

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

**响应示例:**
```json
{
  "data": {
    "workspaceMembers": [
      {
        "id": "workspace-member-id",
        "user": {
          "id": "user-id",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "roles": [
          {
            "role": "ADMIN"
          }
        ],
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 2. 查询单个 Workspace Member

**Query:**
```graphql
query GetWorkspaceMember($id: ID!) {
  workspaceMember(id: $id) {
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

### 3. 创建用户和 Workspace Member

**注意：** Twenty CRM 可能没有直接的 `createUser` mutation。通常需要：

1. **创建用户账户**（如果 Twenty CRM 支持）：
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

2. **创建 Workspace Member 并分配角色**：
```graphql
mutation CreateWorkspaceMember($userId: ID!, $role: String!) {
  createWorkspaceMember(
    userId: $userId
    role: $role
  ) {
    id
    user {
      id
      email
    }
    roles {
      role
    }
    createdAt
  }
}
```

**或者使用组合 mutation（如果可用）：**
```graphql
mutation CreateUserWithWorkspaceMember(
  $email: String!
  $password: String!
  $firstName: String
  $lastName: String
  $role: String!
) {
  createUserWithWorkspaceMember(
    email: $email
    password: $password
    firstName: $firstName
    lastName: $lastName
    role: $role
  ) {
    user {
      id
      email
      firstName
      lastName
    }
    workspaceMember {
      id
      roles {
        role
      }
    }
  }
}
```

### 4. 更新用户信息

**Mutation:**
```graphql
mutation UpdateUser($id: ID!, $email: String, $firstName: String, $lastName: String) {
  updateUser(
    id: $id
    email: $email
    firstName: $firstName
    lastName: $lastName
  ) {
    id
    email
    firstName
    lastName
    updatedAt
  }
}
```

### 5. 更新 Workspace Member 角色

**Mutation:**
```graphql
mutation UpdateWorkspaceMemberRole($id: ID!, $role: String!) {
  updateWorkspaceMember(
    id: $id
    role: $role
  ) {
    id
    roles {
      role
    }
    updatedAt
  }
}
```

### 6. 删除 Workspace Member（软删除）

**Mutation:**
```graphql
mutation DeleteWorkspaceMember($id: ID!) {
  deleteWorkspaceMember(id: $id) {
    id
    deletedAt
  }
}
```

---

## 🔍 API 验证步骤

### 步骤 1: 测试查询 Workspace Members

```bash
# 使用 curl 测试
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query { workspaceMembers { id user { id email } roles { role } } }"
  }'
```

### 步骤 2: 测试创建用户（如果支持）

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "mutation CreateUser($email: String!, $password: String!) { createUser(email: $email, password: $password) { id email } }",
    "variables": {
      "email": "test@example.com",
      "password": "password123"
    }
  }'
```

### 步骤 3: 检查 GraphQL Schema

访问 Twenty CRM 的 GraphQL Playground（如果可用）：
```
http://localhost:3000/graphql
```

查看可用的 mutations 和 queries。

---

## 💡 实施建议

### 方案 A: 如果 Twenty CRM 支持直接创建用户

1. 使用 `createUser` mutation 创建用户
2. 使用 `createWorkspaceMember` mutation 添加工作空间成员并分配角色

### 方案 B: 如果 Twenty CRM 不支持直接创建用户（更可能）

1. **使用 Twenty CRM 的管理界面创建用户**
2. **通过 API 管理 Workspace Members 和角色**
3. **或者使用 REST API（如果可用）**

### 方案 C: 混合方案（推荐）

1. **用户创建**: 如果 API 不支持，提供指导让管理员在 Twenty CRM 界面创建
2. **角色管理**: 通过 GraphQL API 管理 Workspace Member 角色
3. **用户信息更新**: 通过 API 更新用户信息

---

## 📝 注意事项

1. **权限要求**: 创建用户和 Workspace Member 通常需要管理员权限
2. **角色映射**: 确保角色名称与 Twenty CRM 的角色定义一致
3. **错误处理**: 处理 API 不支持的情况，提供友好的错误消息
4. **软删除**: 确认 Twenty CRM 是否支持软删除，或需要自定义实现

---

## 🔄 下一步行动

1. **验证 API**: 实际测试 Twenty CRM 的 GraphQL API
2. **调整实现**: 根据实际 API 调整 `UsersService` 的实现
3. **实现角色分配**: 完成角色分配功能
4. **错误处理**: 添加适当的错误处理和用户提示

