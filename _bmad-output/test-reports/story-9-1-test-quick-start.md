# Story 9-1 快速测试指南

**Story：** 数据访问审计日志  
**日期：** 2026-01-12

---

## 🚀 快速开始测试

### 1. 检查服务状态

**检查后端服务：**
```bash
# 检查端口 3001 是否被占用
lsof -ti:3001

# 或检查健康状态
curl http://localhost:3001/api/health
```

**检查前端服务：**
```bash
# 检查端口 3005 是否被占用
lsof -ti:3005

# 或直接在浏览器访问
# http://localhost:3005
```

### 2. 启动服务（如果未运行）

**启动后端：**
```bash
cd fenghua-backend
npm run start:dev
```

**启动前端：**
```bash
cd fenghua-frontend
npm run dev
```

---

## 🧪 核心测试步骤

### 测试 1: 验证数据访问自动记录

1. **登录系统**
   - 访问：http://localhost:3005
   - 使用管理员账号登录

2. **访问数据详情页**
   - 访问客户详情页：`/customers/[客户ID]`
   - 访问产品详情页：`/products/[产品ID]`
   - 访问互动记录详情页：`/interactions/[互动记录ID]`

3. **查看审计日志**
   - 访问：http://localhost:3005/audit-logs
   - 筛选：`action = DATA_ACCESS`
   - 验证：应该看到刚才的访问记录

**预期结果：**
- ✅ 每个访问操作都有一条审计日志记录
- ✅ 操作类型为 `DATA_ACCESS`
- ✅ 操作结果为 `SUCCESS`
- ✅ 包含资源类型、资源ID、用户ID、IP地址、时间戳

---

### 测试 2: 验证筛选功能

1. **访问审计日志页面**
   - 访问：http://localhost:3005/audit-logs

2. **测试筛选**
   - 按操作类型筛选：输入 `DATA_ACCESS`
   - 按资源类型筛选：选择 `CUSTOMER`
   - 按时间范围筛选：选择开始和结束日期
   - 按用户筛选：输入操作者邮箱

3. **验证结果**
   - ✅ 筛选结果准确
   - ✅ 分页功能正常

---

### 测试 3: 验证详情查看

1. **访问审计日志页面**
   - 访问：http://localhost:3005/audit-logs

2. **查看详情**
   - 点击任意一条审计日志记录
   - 验证详情对话框显示完整信息

**预期结果：**
- ✅ 显示操作类型、操作结果、资源类型、资源ID
- ✅ 显示用户ID、操作者邮箱、操作时间
- ✅ 显示IP地址、用户代理（如果可用）

---

### 测试 4: 验证导出功能

1. **访问审计日志页面**
   - 访问：http://localhost:3005/audit-logs

2. **导出数据**
   - 点击"导出 CSV"按钮
   - 点击"导出 Excel"按钮

**预期结果：**
- ✅ CSV 文件成功下载
- ✅ Excel 文件成功下载
- ✅ 文件包含所有必要字段

---

## 🔍 验证数据库记录

**直接查询数据库：**
```bash
psql "postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require" -c "SELECT action, entity_type, entity_id, operation_result, user_id, ip_address, timestamp FROM audit_logs WHERE action = 'DATA_ACCESS' ORDER BY timestamp DESC LIMIT 10;"
```

**验证索引：**
```bash
psql "postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require" -c "SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname LIKE '%entity%';"
```

---

## 📝 测试检查清单

- [ ] 后端服务运行正常
- [ ] 前端服务运行正常
- [ ] 可以访问审计日志页面
- [ ] 数据访问操作自动记录
- [ ] 筛选功能正常
- [ ] 详情查看功能正常
- [ ] 导出功能正常
- [ ] 性能表现良好

---

## 🐛 常见问题

### 问题 1: 审计日志页面无法访问

**可能原因：**
- 用户不是管理员
- 路由未配置

**解决方法：**
- 确认使用管理员账号登录
- 检查 `App.tsx` 中的路由配置

### 问题 2: 没有审计日志记录

**可能原因：**
- 拦截器未应用
- 数据库连接失败

**解决方法：**
- 检查控制器是否应用了 `DataAccessAuditInterceptor`
- 检查后端日志是否有错误

### 问题 3: 筛选不工作

**可能原因：**
- API 参数错误
- 前端筛选逻辑问题

**解决方法：**
- 检查浏览器控制台错误
- 检查网络请求参数

---

## 📊 测试结果记录

请将测试结果记录到：`_bmad-output/test-reports/story-9-1-test-execution-2026-01-12.md`

---

**测试完成后，请更新测试执行记录文件！**
