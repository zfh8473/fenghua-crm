# Twenty CRM API 测试快速指南

## 🚀 快速开始

### 步骤 1: 获取 JWT Token

**方法 A: 通过登录脚本（推荐）**

```bash
cd fenghua-backend
TWENTY_TEST_EMAIL=your@email.com \
TWENTY_TEST_PASSWORD=yourpassword \
npx ts-node ../scripts/get-token-from-login.ts
```

脚本会输出 token，复制它。

**方法 B: 从浏览器获取**

1. 登录 Twenty CRM: http://localhost:3000
2. 打开 DevTools (F12) > Application > Local Storage
3. 查找 token（可能是 `token`, `accessToken` 等）
4. 复制 token 值

### 步骤 2: 运行测试

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node ../scripts/test-twenty-user-api.ts
```

### 或者使用快速脚本（自动获取 token）

```bash
TWENTY_TEST_EMAIL=your@email.com \
TWENTY_TEST_PASSWORD=yourpassword \
./scripts/quick-test-api.sh
```

## 📋 测试内容

测试脚本会验证：
1. ✅ Query Workspace Members
2. ✅ Query Current User
3. ❓ Create User (如果支持)
4. ❓ Create Workspace Member (如果支持)
5. ❓ Update Workspace Member Role (如果支持)

## 📝 记录结果

测试完成后，请将结果记录到 `docs/api-test-results.md`

## 🔗 详细文档

- [完整测试指南](docs/api-testing-guide.md)
- [API 文档](docs/twenty-user-management-api.md)
