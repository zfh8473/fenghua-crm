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
