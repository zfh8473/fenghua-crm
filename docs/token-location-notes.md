# Twenty CRM Token 位置说明

**日期：** 2025-12-25  
**发现：** Twenty CRM 使用 NextAuth.js 进行认证

---

## 🔍 从 Local Storage 观察到的内容

从浏览器开发者工具的截图可以看到：

### Local Storage 中的键值对：
- `commandMenuWidth`: `600`
- `isNavigationDrawerExpanded`: `true`
- `lastVisitedObjectMetadataItemIdState`: `"811a0148-7653-474c-ba3b-ddeaba2aebdd"`
- `lastVisitedViewPerObjectMetadataItemState`: `{...}` (JSON 对象)
- **`nextauth.message`**: `{"event":"session","data":{"trigger":"getSession"},"timestamp":1763392045}`
- `persistedColorSchemeState`: `"System"`

### 重要发现：
✅ **`nextauth.message`** 的存在表明 Twenty CRM 使用 **NextAuth.js** 进行认证

---

## 🔑 Token 可能的位置

### 1. Cookies（最可能）

NextAuth.js 通常将认证 token 存储在 **Cookies** 中。

**检查方法：**
1. 在开发者工具中，点击左侧的 **Cookies** > `http://localhost:3000`
2. 查找以下可能的 cookie 名称：
   - `next-auth.session-token`
   - `next-auth.csrf-token`
   - `__Secure-next-auth.session-token`
   - `authjs.session-token`
   - `token`
   - `accessToken`

### 2. Session Storage

某些实现可能将 token 存储在 Session Storage 中。

**检查方法：**
1. 在开发者工具中，展开 **Session storage**
2. 点击 `http://localhost:3000`
3. 查找 token 相关的键

### 3. Network 请求头

如果无法在存储中找到，可以从网络请求中获取。

**检查方法：**
1. 打开 **Network** 标签
2. 刷新页面或执行操作
3. 查找 GraphQL 请求（通常是 `/graphql` 端点）
4. 查看请求头中的 `Authorization` 字段
5. 格式通常是：`Authorization: Bearer <token>`

---

## 🧪 使用 Token 进行测试

一旦找到 token，可以：

### 方法 1: 从 Cookie 中提取

如果 token 在 Cookie 中：
1. 复制 cookie 的值
2. 设置环境变量：
   ```bash
   export TWENTY_TEST_TOKEN=your_cookie_value
   ```

### 方法 2: 从 Network 请求中提取

如果从 Network 请求头中获取：
1. 复制 `Authorization: Bearer <token>` 中的 token 部分
2. 设置环境变量：
   ```bash
   export TWENTY_TEST_TOKEN=your_token_here
   ```

### 运行测试

```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_token_here
npx ts-node scripts/test-api.ts
```

---

## 📝 下一步

1. **检查 Cookies** - 查看是否有 `next-auth.session-token` 或其他 token cookie
2. **检查 Network 请求** - 查看 GraphQL 请求的 Authorization 头
3. **如果找到 token** - 运行测试脚本验证 API
4. **如果找不到 token** - 可能需要：
   - 检查是否需要先登录
   - 或者使用其他认证方式

---

## 🔗 参考

- [NextAuth.js 文档](https://next-auth.js.org/)
- [Token 获取指南](token-acquisition-guide.md)
- [API 测试指南](api-testing-guide.md)

