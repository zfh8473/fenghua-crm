# 后端服务故障排查知识库

**最后更新：** 2025-01-XX  
**维护者：** 开发团队

---

## 📋 目录

1. [快速诊断](#快速诊断)
2. [常见问题](#常见问题)
3. [服务重启流程](#服务重启流程)
4. [端口占用问题](#端口占用问题)
5. [编译错误](#编译错误)
6. [数据库连接问题](#数据库连接问题)
7. [前端连接失败](#前端连接失败)
8. [日志查看](#日志查看)

---

## 🚀 快速诊断

### 检查服务状态

```bash
# 检查后端服务是否运行
ps aux | grep -E "nest|node.*main" | grep -v grep

# 检查端口 3001 是否被占用
lsof -ti:3001

# 测试后端 API 是否响应
curl http://localhost:3001/api/health
# 或
curl http://localhost:3001/api/auth/health
```

### 前端连接失败症状

- **浏览器控制台错误：** `net::ERR_CONNECTION_REFUSED`
- **前端显示：** "Failed to fetch"
- **登录页面：** 无法提交登录请求

---

## 🔧 常见问题

### 问题 1: 后端服务未启动

**症状：**
- 前端显示 "Failed to fetch"
- `curl http://localhost:3001` 无响应

**解决方案：**

```bash
cd fenghua-backend

# 1. 检查是否有编译错误
npm run build

# 2. 启动开发服务器
npm run start:dev

# 3. 查看启动日志，确认服务已启动
# 应该看到：fenghua-backend is running on: http://localhost:3001
```

---

### 问题 2: 端口 3001 被占用

**症状：**
- 启动时错误：`EADDRINUSE: address already in use :::3001`
- 服务无法启动

**解决方案：**

```bash
# 方法 1: 查找并终止占用端口的进程
lsof -ti:3001 | xargs kill -9

# 方法 2: 使用更详细的命令
lsof -i:3001
# 查看输出，找到 PID，然后：
kill -9 <PID>

# 方法 3: 使用 pkill（如果进程名已知）
pkill -f "nest start"

# 然后重新启动服务
cd fenghua-backend
npm run start:dev
```

---

### 问题 3: 编译错误导致服务无法启动

**症状：**
- 启动时显示 TypeScript 编译错误
- 服务启动失败

**解决方案：**

```bash
cd fenghua-backend

# 1. 检查编译错误
npm run build

# 2. 修复所有编译错误
# 常见错误：
# - 缺少导入 (import)
# - 类型不匹配
# - 未使用的变量

# 3. 重新启动
npm run start:dev
```

**常见编译错误：**

- **缺少导入：** 检查 `import` 语句
- **类型错误：** 检查 DTO 类型定义
- **模块未找到：** 检查 `package.json` 依赖

---

### 问题 4: 数据库连接失败

**症状：**
- 启动时错误：`ECONNREFUSED` 或数据库连接超时
- API 请求返回 500 错误

**解决方案：**

```bash
# 1. 检查环境变量
cd fenghua-backend
cat .env.development  # 或 .env.production

# 2. 确认 DATABASE_URL 正确
# 开发环境应使用：fenghua-crm-dev
# 生产环境应使用：fenghua-crm

# 3. 测试数据库连接
psql "$DATABASE_URL" -c "SELECT 1;"

# 4. 如果连接失败，检查：
# - 网络连接
# - Neon 数据库状态
# - 连接字符串是否正确
```

---

### 问题 5: 前端无法连接后端

**症状：**
- 浏览器控制台：`net::ERR_CONNECTION_REFUSED`
- 前端显示 "Failed to fetch"

**解决方案：**

```bash
# 1. 确认后端服务正在运行
curl http://localhost:3001/api/health

# 2. 检查后端日志
tail -f /tmp/fenghua-backend.log
# 或查看终端输出

# 3. 检查 CORS 配置
# 确认前端 URL 在允许列表中（main.ts）

# 4. 检查前端 API 配置
# 确认 VITE_API_BASE_URL 或 VITE_BACKEND_URL 正确
```

---

## 🔄 服务重启流程

### 标准重启流程

```bash
# 1. 进入后端目录
cd /Users/travis_z/Documents/GitHub/fenghua-crm/fenghua-backend

# 2. 停止现有服务
pkill -f "nest start" || true
# 或
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# 3. 等待进程完全终止
sleep 2

# 4. 检查端口是否已释放
lsof -ti:3001 && echo "端口仍被占用" || echo "端口已释放"

# 5. 清理编译缓存（可选）
rm -rf dist

# 6. 重新编译（可选，但推荐）
npm run build

# 7. 启动服务
npm run start:dev

# 8. 等待服务启动（约 5-10 秒）
sleep 5

# 9. 验证服务是否正常运行
curl http://localhost:3001/api/health || echo "服务未响应，请检查日志"
```

### 完全重启（包括清理）

```bash
cd /Users/travis_z/Documents/GitHub/fenghua-crm/fenghua-backend

# 1. 停止所有相关进程
pkill -f "nest start"
pkill -f "node.*main"

# 2. 清理
rm -rf dist
rm -rf node_modules/.cache

# 3. 重新安装依赖（如果需要）
# npm install

# 4. 重新编译
npm run build

# 5. 启动服务
npm run start:dev
```

---

## 🔍 端口占用问题

### 查找占用端口的进程

```bash
# 查找占用 3001 端口的进程
lsof -i:3001

# 输出示例：
# COMMAND   PID    USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    70328 travis_z   23u  IPv6 0x...      0t0  TCP *:3001 (LISTEN)

# 终止进程
kill -9 70328
```

### 批量清理端口

```bash
# 清理常见开发端口
for port in 3001 3002 3003 5173 5174; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
```

---

## 📝 编译错误

### 常见编译错误及解决方案

#### 1. 缺少导入

```typescript
// 错误：Property 'X' does not exist on type 'Y'
// 解决：添加导入
import { X } from './path/to/X';
```

#### 2. 类型不匹配

```typescript
// 错误：Type 'A' is not assignable to type 'B'
// 解决：检查类型定义，确保类型匹配
```

#### 3. 未使用的变量

```typescript
// 错误：'variable' is declared but its value is never read
// 解决：删除未使用的变量，或添加下划线前缀：_variable
```

#### 4. 模块未找到

```bash
# 错误：Cannot find module 'xxx'
# 解决：安装缺失的依赖
npm install xxx
```

---

## 🗄️ 数据库连接问题

### 检查数据库连接

```bash
# 1. 检查环境变量
cd fenghua-backend
cat .env.development | grep DATABASE_URL

# 2. 测试连接
psql "$(grep DATABASE_URL .env.development | cut -d '=' -f2-)" -c "SELECT 1;"

# 3. 检查数据库表
psql "$DATABASE_URL" -c "\dt"
```

### 常见数据库错误

- **连接超时：** 检查网络和 Neon 服务状态
- **认证失败：** 检查连接字符串中的密码
- **数据库不存在：** 确认数据库名称正确

---

## 🌐 前端连接失败

### 检查清单

1. **后端服务是否运行？**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **端口是否正确？**
   - 后端默认端口：3001
   - 前端默认端口：3002 或 5173

3. **CORS 配置是否正确？**
   - 检查 `fenghua-backend/src/main.ts` 中的 CORS 配置
   - 确认前端 URL 在允许列表中

4. **前端 API 配置是否正确？**
   - 检查 `.env` 文件中的 `VITE_API_BASE_URL`
   - 或 `VITE_BACKEND_URL`

---

## 📊 日志查看

### 查看实时日志

```bash
# 如果服务在后台运行，查看日志文件
tail -f /tmp/fenghua-backend.log

# 或查看系统日志
journalctl -u fenghua-backend -f  # Linux
log show --predicate 'process == "nest"' --last 5m  # macOS
```

### 日志位置

- **开发模式：** 终端输出
- **后台运行：** `/tmp/fenghua-backend.log`
- **生产模式：** 配置的日志文件路径

---

## 🛠️ 快速修复脚本

### 一键重启脚本

创建 `fenghua-backend/scripts/restart.sh`:

```bash
#!/bin/bash

cd "$(dirname "$0")/.."

echo "🛑 停止现有服务..."
pkill -f "nest start" || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

echo "🧹 清理编译缓存..."
rm -rf dist

echo "🔨 重新编译..."
npm run build

echo "🚀 启动服务..."
npm run start:dev > /tmp/fenghua-backend.log 2>&1 &

echo "⏳ 等待服务启动..."
sleep 5

echo "✅ 检查服务状态..."
if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "✅ 后端服务已成功启动！"
else
  echo "❌ 后端服务启动失败，请查看日志："
  tail -20 /tmp/fenghua-backend.log
fi
```

使用：

```bash
chmod +x fenghua-backend/scripts/restart.sh
./fenghua-backend/scripts/restart.sh
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看完整日志：**
   ```bash
   tail -100 /tmp/fenghua-backend.log
   ```

2. **检查系统资源：**
   ```bash
   # 检查内存
   free -h  # Linux
   vm_stat  # macOS
   
   # 检查磁盘空间
   df -h
   ```

3. **重启开发环境：**
   - 重启终端
   - 重启 IDE
   - 重启计算机（最后手段）

---

## 📚 相关文档

- [后端 README](../fenghua-backend/README.md)
- [环境配置说明](../fenghua-backend/README-ENVIRONMENT.md)
- [架构文档](../architecture-compliance-update.md)

---

**提示：** 遇到问题时，首先执行[快速诊断](#快速诊断)步骤，然后根据错误信息查找对应的解决方案。

