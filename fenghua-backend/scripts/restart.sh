#!/bin/bash
# Restart backend service script
# This script helps restart the backend service to load new routes

echo "🔄 正在重启后端服务..."

# Find and kill existing backend process
BACKEND_PID=$(lsof -ti :3001)
if [ ! -z "$BACKEND_PID" ]; then
  echo "📌 找到运行中的后端进程 (PID: $BACKEND_PID)，正在停止..."
  kill $BACKEND_PID
  sleep 2
  
  # Force kill if still running
  if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "⚠️  进程仍在运行，强制停止..."
    kill -9 $BACKEND_PID
    sleep 1
  fi
  echo "✅ 后端服务已停止"
else
  echo "ℹ️  未找到运行中的后端服务"
fi

# Check if running in production mode (dist) or development mode
if [ -f "dist/src/main.js" ]; then
  echo "📦 检测到生产模式，重新构建..."
  npm run build
  echo "🚀 启动生产模式后端服务..."
  npm run start:prod &
else
  echo "🔧 启动开发模式后端服务..."
  npm run start:dev &
fi

echo "⏳ 等待服务启动..."
sleep 3

# Check if service is running
if lsof -i :3001 > /dev/null 2>&1; then
  echo "✅ 后端服务已成功启动在端口 3001"
  echo "📝 测试 /people 路由..."
  sleep 1
  curl -s http://localhost:3001/people -H "Authorization: Bearer test" | head -3
else
  echo "❌ 后端服务启动失败，请检查日志"
fi
