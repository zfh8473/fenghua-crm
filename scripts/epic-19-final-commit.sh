#!/bin/bash
# Epic 19 收尾大提交
# 用法：在仓库根目录执行 ./scripts/epic-19-final-commit.sh
# 注意：下列文件故意不纳入本次提交（非 Epic 19）：
#   - docs/railway-deploy.md
#   - docs/hong-kong-deployment-options.md, docs/neon-*.md
#   - fenghua-backend/src/auth/auth.service.ts
#   - page-optimization-guide.md（根目录，为空）

set -e
cd "$(git rev-parse --show-toplevel)"

echo "==> 1. 暂存 Epic 19 相关修改与新增…"
git add docs/design-system/
git add fenghua-frontend/
git add .cursor/commands/
git add .shared/
git add _backup/

# 可选：将 Epic 19 启动文档的「已完成」状态纳入（需 -f，因 _bmad-output 在 .gitignore）
# git add -f _bmad-output/epic-19-kickoff-2026-01.md

echo ""
echo "==> 2. 当前暂存概况（请核对）："
git status

echo ""
read -p "确认无误后按 Enter 执行 commit，或 Ctrl+C 取消…"

git commit -m "chore(epic-19): Epic 19 全站 UI 优化与设计系统落地收尾

- 设计系统：MASTER、design-tokens、page-optimization-guide、epic-19-rollback、ui-ux-pro-max-skill、pages/
- 前端：主题与 Tailwind uipro/proMax、全站页面 UI（仪表盘、主业务、登录导航、管理设置、列表与操作等）
- 资源：AppLogo、HomeModuleIcons、logo-fh、背景方案 demo、chart-colors、theme.test
- 工具与备份：.cursor/commands ui-ux-pro-max、.shared、_backup（pre-19-4 等）"

echo ""
echo "==> 3. 推送到 origin main …"
git push origin main

echo ""
echo "==> 完成。"
