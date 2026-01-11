#!/bin/bash

# 后端日志查看脚本
# 使用方法: ./view-logs.sh

echo "=== 峰华CRM后端日志查看工具 ==="
echo ""
echo "选择查看方式:"
echo "1. 查看最近的日志（最后100行）"
echo "2. 实时监控日志（按 Ctrl+C 退出）"
echo "3. 搜索特定关键词的日志"
echo "4. 查看错误日志"
echo ""
read -p "请选择 (1-4): " choice

case $choice in
  1)
    echo ""
    echo "=== 最近100行日志 ==="
    tail -100 /tmp/backend-startup.log 2>/dev/null || echo "日志文件不存在"
    ;;
  2)
    echo ""
    echo "=== 实时监控日志（按 Ctrl+C 退出）==="
    tail -f /tmp/backend-startup.log 2>/dev/null || echo "日志文件不存在，请检查后端服务是否正在运行"
    ;;
  3)
    read -p "请输入搜索关键词: " keyword
    echo ""
    echo "=== 搜索包含 '$keyword' 的日志 ==="
    tail -500 /tmp/backend-startup.log 2>/dev/null | grep -i "$keyword" | tail -50 || echo "未找到相关日志"
    ;;
  4)
    echo ""
    echo "=== 最近的错误日志 ==="
    tail -500 /tmp/backend-startup.log 2>/dev/null | grep -i "error\|exception\|failed" | tail -30 || echo "未找到错误日志"
    ;;
  *)
    echo "无效的选择"
    ;;
esac
