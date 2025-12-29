# Token 提取提示

**日期：** 2025-12-25

---

## 📋 从 Network 标签提取 Token

### 方法 1: 从 Authorization 头提取（推荐）

1. 在 Network 标签中，点击 GraphQL 请求
2. 在 Headers 标签中，找到 **Request Headers** 部分
3. 查找 `Authorization` 行
4. **完整复制** `Bearer ` 后面的整个 token 字符串
   - 格式：`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - 只复制 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 这部分（不包括 "Bearer "）

### 方法 2: 从 Cookie 中提取

1. 在 Network 标签中，点击 GraphQL 请求
2. 在 Headers 标签中，找到 **Request Headers** 部分
3. 查找 `Cookie` 行
4. 在 Cookie 值中，查找 `tokenPair` 的值
5. 提取其中的 `accessOrWorkspaceAgnosticToken.token` 值

---

## ⚠️ 注意事项

1. **完整复制** - Token 通常很长（几百个字符，确保完整复制）
2. **不要包含空格** - Token 是连续的字符串，没有空格
3. **检查格式** - Token 通常以 `eyJ` 开头（Base64 编码的 JSON）

---

## 🧪 验证 Token

复制 token 后，可以运行：

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node scripts/test-api.ts
```

如果看到 "UNAUTHENTICATED" 错误，说明 token 可能：
- 不完整（复制时遗漏了部分字符）
- 已过期
- 格式不正确

---

## 💡 提示

如果直接从浏览器复制有困难，可以：
1. 右键点击 `Authorization` 行的值
2. 选择 "Copy value" 或 "Copy"
3. 然后手动删除 "Bearer " 前缀

