# Redis 设置指南

## 问题
GDPR 导出功能使用 BullMQ 队列处理异步任务，需要 Redis 服务运行。

## 解决方案

### macOS (使用 Homebrew)

```bash
# 安装 Redis
brew install redis

# 启动 Redis 服务
brew services start redis

# 或者手动启动（前台运行）
redis-server
```

### Linux (Ubuntu/Debian)

```bash
# 安装 Redis
sudo apt-get update
sudo apt-get install redis-server

# 启动 Redis 服务
sudo systemctl start redis-server

# 设置开机自启
sudo systemctl enable redis-server
```

### 验证 Redis 运行

```bash
# 检查 Redis 是否运行
redis-cli ping
# 应该返回: PONG

# 或者检查端口
lsof -ti:6379
```

### Docker (可选)

```bash
# 使用 Docker 运行 Redis
docker run -d -p 6379:6379 --name redis redis:latest

# 验证
docker ps | grep redis
```

## 完成后

1. ✅ Redis 服务运行
2. 🔄 重启后端服务
3. 🔄 刷新前端页面
4. ✅ 重新创建导出请求

## 注意事项

- Redis 默认端口: 6379
- 确保防火墙允许 Redis 连接
- 如果使用远程 Redis，检查 REDIS_URL 配置
