#!/bin/bash
# Monitor backend logs for errors
# Usage: ./monitor-logs.sh

echo "监控后端日志（按 Ctrl+C 退出）..."
echo "================================"
echo ""

tail -f /tmp/backend.log 2>/dev/null | grep --line-buffered -E "error|Error|ERROR|Failed|Exception|500|findAll|Controller|\[findAll\]|\[Controller\]" -i || {
  echo "日志文件不存在，请先启动后端服务"
  echo "启动命令: cd fenghua-backend && npm run start:dev > /tmp/backend.log 2>&1 &"
}

