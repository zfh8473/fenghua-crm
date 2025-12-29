# 端口配置和管理员设置修复

**日期：** 2025-12-26  
**问题：** 
1. 测试 URL 端口错误（3002 vs 3005）
2. 需要将 zfh8473@gmail.com 设置为管理员

---

## ✅ 已修复的问题

### 1. 端口配置修复

**问题：** 
- `vite.config.ts` 中配置的端口是 3002
- 实际运行端口是 3005
- 导致测试使用了错误的 URL

**修复：**
- ✅ 已更新 `fenghua-frontend/vite.config.ts` 中的端口从 3002 改为 3005

**文件：** `fenghua-frontend/vite.config.ts`
```typescript
server: {
  port: 3005,  // 已从 3002 更新为 3005
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

### 2. 页面布局检查

**检查结果：**
- ✅ `http://localhost:3005/login` 页面布局正常
- ✅ 设计 Token 使用正确
- ✅ Card 组件正确渲染
- ⚠️ `http://localhost:3002/login` 可能存在布局问题（已修复端口配置）

---

## 🔧 设置用户为管理员

### 方法 1: 使用脚本（推荐）

已创建脚本：`fenghua-backend/scripts/set-user-admin.ts`

**使用方法：**
```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_admin_token
npx ts-node scripts/set-user-admin.ts zfh8473@gmail.com
```

**脚本功能：**
1. 通过邮箱查找用户
2. 获取用户 ID
3. 调用 `/roles/users/:userId/assign` API 设置角色为 ADMIN

### 方法 2: 通过 API 直接调用

**步骤：**
1. 获取用户列表，找到 `zfh8473@gmail.com` 的 userId
2. 调用角色分配 API

**API 调用示例：**
```bash
# 1. 获取用户列表
curl -X GET "http://localhost:3001/users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# 2. 设置用户为管理员（替换 USER_ID）
curl -X PUT "http://localhost:3001/roles/users/USER_ID/assign" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ADMIN",
    "reason": "Set as admin"
  }'
```

### 方法 3: 通过前端界面（如果已登录管理员）

1. 登录管理员账号
2. 访问用户管理页面 (`/users`)
3. 找到 `zfh8473@gmail.com` 用户
4. 编辑用户，将角色设置为 ADMIN

---

## 📋 下一步

### 1. 设置管理员

**选项 A: 使用脚本（需要管理员 token）**
```bash
cd fenghua-backend
export TWENTY_TEST_TOKEN=your_admin_token
npx ts-node scripts/set-user-admin.ts zfh8473@gmail.com
```

**选项 B: 手动通过 Twenty CRM 管理面板**
1. 访问 Twenty CRM 管理面板（http://localhost:3000）
2. 找到用户 `zfh8473@gmail.com`
3. 设置角色为 ADMIN

### 2. 重新启动前端应用

由于端口配置已更改，需要重新启动前端应用：
```bash
cd fenghua-frontend
npm run dev
```

应用将在 `http://localhost:3005` 运行。

### 3. 继续自动化测试

设置完成后，可以继续自动化测试：
- 使用正确的 URL: `http://localhost:3005/login`
- 使用 `zfh8473@gmail.com` 登录
- 测试管理员功能

---

## 🔍 验证

### 验证端口配置
- ✅ `vite.config.ts` 端口已更新为 3005
- ⏳ 需要重新启动前端应用以应用更改

### 验证管理员设置
- ⏳ 需要执行设置脚本或手动设置
- ⏳ 设置后可以登录验证管理员权限

---

**注意：** 
- 设置管理员需要管理员权限的 token
- 如果当前没有管理员账号，可能需要先在 Twenty CRM 管理面板中手动设置第一个管理员

