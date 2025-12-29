# Story 16.6: 移除 Twenty 依赖和清理

Status: backlog

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **开发团队**,
I want **移除所有 Twenty CRM 依赖**,
So that **系统完全独立，代码库干净，无过时依赖**.

## Acceptance Criteria

1. **Given** 所有功能已迁移到原生技术栈
   **When** 开发团队清理代码
   **Then** 删除 `fenghua-backend/src/services/twenty-client/twenty-client.service.ts`
   **And** 删除 `fenghua-backend/src/services/twenty-client/twenty-client.module.ts`
   **And** 删除 `fenghua-backend/src/services/twenty-client/README.md`
   **And** 从 `fenghua-backend/src/app.module.ts` 移除 `TwentyClientModule` 导入
   **And** 从所有服务文件中移除 `TwentyClientService` 导入和使用

2. **Given** 环境变量需要更新
   **When** 开发团队更新环境变量配置
   **Then** 从 `.env.development` 移除 `TWENTY_API_URL`
   **And** 从 `.env.development` 移除 `TWENTY_API_TOKEN`
   **And** 从 `.env.development` 移除 `TWENTY_ORIGIN`
   **And** 从 `.env.development` 移除 `TWENTY_DATABASE_URL`
   **And** 保留 `DATABASE_URL`（fenghua-crm 数据库）
   **And** 确保 `JWT_SECRET` 已配置

3. **Given** 依赖需要更新
   **When** 开发团队更新 `package.json`
   **Then** 移除 `graphql-request`（如果不再需要）
   **And** 验证所有依赖都是必需的
   **And** 运行 `npm install` 确保依赖正确

4. **Given** 应用需要验证
   **When** 开发团队测试应用
   **Then** 应用可以正常启动（无编译错误）
   **And** 所有 API 端点正常工作
   **And** 所有测试通过
   **And** 构建过程无错误

## Tasks / Subtasks

- [ ] Task 1: 删除 Twenty 相关代码 (AC: #1)
  - [ ] 删除 `fenghua-backend/src/services/twenty-client/twenty-client.service.ts`
  - [ ] 删除 `fenghua-backend/src/services/twenty-client/twenty-client.module.ts`
  - [ ] 删除 `fenghua-backend/src/services/twenty-client/README.md`
  - [ ] 删除 `fenghua-backend/src/services/twenty-client/` 目录（如果为空）

- [ ] Task 2: 更新应用模块 (AC: #1)
  - [ ] 从 `fenghua-backend/src/app.module.ts` 移除 `TwentyClientModule` 导入
  - [ ] 验证应用可以正常启动

- [ ] Task 3: 检查并移除所有 Twenty 引用 (AC: #1)
  - [ ] 搜索所有文件中的 `TwentyClientService` 引用
  - [ ] 移除所有 `TwentyClientService` 导入
  - [ ] 移除所有 `TwentyClientService` 使用
  - [ ] 搜索所有文件中的 `twenty-client` 引用
  - [ ] 移除所有相关引用

- [ ] Task 4: 更新环境变量 (AC: #2)
  - [ ] 从 `.env.development` 移除 `TWENTY_API_URL`
  - [ ] 从 `.env.development` 移除 `TWENTY_API_TOKEN`
  - [ ] 从 `.env.development` 移除 `TWENTY_ORIGIN`
  - [ ] 从 `.env.development` 移除 `TWENTY_DATABASE_URL`
  - [ ] 验证 `DATABASE_URL` 已配置
  - [ ] 验证 `JWT_SECRET` 已配置
  - [ ] 更新 `.env.production`（如果存在）

- [ ] Task 5: 更新依赖 (AC: #3)
  - [ ] 检查 `fenghua-backend/package.json`
  - [ ] 移除 `graphql-request`（如果不再需要）
  - [ ] 验证所有依赖都是必需的
  - [ ] 运行 `npm install` 确保依赖正确
  - [ ] 运行 `npm audit` 检查安全问题

- [ ] Task 6: 更新测试文件 (AC: #4)
  - [ ] 搜索所有测试文件中的 `TwentyClientService` 引用
  - [ ] 更新测试文件移除 Twenty 相关 mock
  - [ ] 更新测试文件使用新的服务
  - [ ] 验证所有测试通过

- [ ] Task 7: 验证应用 (AC: #4)
  - [ ] 运行 `npm run build` 验证构建成功
  - [ ] 运行 `npm run start:dev` 验证应用可以启动
  - [ ] 测试所有 API 端点正常工作
  - [ ] 运行测试套件验证所有测试通过
  - [ ] 检查是否有编译错误或警告

- [ ] Task 8: 清理前端（如果需要）(AC: #1)
  - [ ] 搜索前端代码中的 Twenty 相关引用
  - [ ] 移除所有 Twenty API 调用
  - [ ] 更新为使用新的 API 端点
  - [ ] 验证前端可以正常工作

## Dev Notes

- **参考文档：**
  - 重构计划：`_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`（阶段 6）

- **清理步骤：**
  1. 删除 Twenty 相关代码文件
  2. 更新所有导入语句
  3. 更新环境变量
  4. 更新依赖
  5. 更新测试
  6. 验证应用

- **搜索命令：**
  ```bash
  # 搜索所有 Twenty 相关引用
  grep -r "TwentyClientService" fenghua-backend/src/
  grep -r "twenty-client" fenghua-backend/src/
  grep -r "TWENTY" fenghua-backend/
  ```

- **验证清单：**
  - [ ] 所有 Twenty 相关代码已删除
  - [ ] 所有导入语句已更新
  - [ ] 环境变量已更新
  - [ ] 依赖已更新
  - [ ] 测试已更新
  - [ ] 应用可以正常启动
  - [ ] 所有测试通过
  - [ ] 构建成功

- **测试要求：**
  - 运行完整测试套件
  - 验证所有 API 端点正常工作
  - 验证前端可以正常使用
  - 验证构建过程无错误

