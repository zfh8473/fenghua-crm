#!/bin/bash
# Simple script to view backend logs
# Usage: ./view-logs.sh

echo "查看后端日志（按 Ctrl+C 退出）..."
echo "================================"
tail -f /tmp/backend.log 2>/dev/null || echo "日志文件不存在，请先启动后端服务"

