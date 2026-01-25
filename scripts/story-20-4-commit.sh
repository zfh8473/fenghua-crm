#!/bin/bash
# Story 20.4: Git 提交脚本
# 此脚本用于提交 Story 20.4 相关的所有文件

set -e

echo "📦 Story 20.4: 准备提交文件..."

# 检查当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"

# 前端新建文件
echo ""
echo "➕ 添加前端新建文件..."
git add fenghua-frontend/src/customers/components/CustomerPersonManagementModal.tsx
git add fenghua-frontend/src/people/components/ContactMethodIcon.tsx
git add fenghua-frontend/src/people/utils/contact-protocols.ts

# 前端修改文件
echo ""
echo "📝 添加前端修改文件..."
git add fenghua-frontend/src/customers/components/CustomerList.tsx
git add fenghua-frontend/src/customers/CustomerManagementPage.tsx
git add fenghua-frontend/src/people/components/PersonList.tsx
git add fenghua-frontend/src/people/components/PersonCreateForm.tsx
git add fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx

# 后端修改文件
echo ""
echo "🔧 添加后端修改文件..."
git add fenghua-backend/src/people/dto/update-person.dto.ts
git add fenghua-backend/src/interactions/dto/update-interaction.dto.ts
git add fenghua-backend/src/people/people.controller.ts

# 文档文件（可选，如果 _bmad-output 不在 .gitignore 中）
echo ""
echo "📚 尝试添加文档文件（如果未被 .gitignore 忽略）..."
if ! git check-ignore -q _bmad-output/implementation-artifacts/stories/20-4-customer-list-integration.md; then
  git add _bmad-output/implementation-artifacts/stories/20-4-customer-list-integration.md 2>/dev/null || true
  git add _bmad-output/implementation-artifacts/stories/20-4-customer-list-integration-completion.md 2>/dev/null || true
  git add _bmad-output/code-reviews/story-20-4-code-review.md 2>/dev/null || true
  git add _bmad-output/code-reviews/story-20-4-code-review-fixes-applied.md 2>/dev/null || true
  git add _bmad-output/code-reviews/story-20-4-merge-checklist.md 2>/dev/null || true
  git add _bmad-output/test-reports/story-20-4-manual-testing-guide.md 2>/dev/null || true
  git add _bmad-output/test-reports/story-20-4-api-404-fix.md 2>/dev/null || true
  git add _bmad-output/implementation-artifacts/sprint-status.yaml 2>/dev/null || true
  echo "✅ 文档文件已添加"
else
  echo "ℹ️  文档文件被 .gitignore 忽略，跳过（这是正常的）"
fi

# 显示暂存的文件
echo ""
echo "📋 已暂存的文件:"
git status --short | grep "^A\|^M" | head -20

echo ""
echo "✅ 文件已添加到暂存区"
echo ""
echo "💡 下一步: 运行以下命令提交"
echo "   git commit -m \"feat(story-20-4): 实现客户列表中的联系人管理功能\""
echo ""
echo "   或使用详细的提交信息:"
echo "   git commit -F - << 'EOF'"
echo "feat(story-20-4): 实现客户列表中的联系人管理功能"
echo ""
echo "- 添加 CustomerPersonManagementModal 组件（模态弹窗管理联系人）"
echo "- 提取 ContactMethodIcon 为共享组件"
echo "- 实现快速创建互动记录功能（预填 personId 和联系方式）"
echo "- 实现本地应用协议调用工具（跨平台支持）"
echo "- 集成到 CustomerManagementPage"
echo "- 修复后端编译错误（UpdatePersonDto、UpdateInteractionDto、PeopleController）"
echo ""
echo "相关文件:"
echo "- 前端: CustomerPersonManagementModal, ContactMethodIcon, contact-protocols"
echo "- 后端: UpdatePersonDto, UpdateInteractionDto, PeopleController"
echo "- 文档: 代码审查报告、测试指南、完成报告"
echo ""
echo "Closes: Story 20.4"
echo "EOF"
