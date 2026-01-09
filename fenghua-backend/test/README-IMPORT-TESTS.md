# 客户数据批量导入测试指南

## 测试概述

Story 7-1 的测试分为以下几类：

### 1. 单元测试（已通过 ✅）

所有单元测试已通过，共 41 个测试用例：

- `excel-parser.service.spec.ts` - Excel 解析服务测试
- `csv-parser.service.spec.ts` - CSV 解析服务测试
- `mapping.service.spec.ts` - 映射服务测试
- `validation.service.spec.ts` - 验证服务测试

**运行命令：**
```bash
npm test -- --testPathPattern="import/customers/services"
```

### 2. 集成测试（需要环境变量）

集成测试需要运行数据库、Redis 和完整的后端服务。

**运行命令：**
```bash
RUN_INTEGRATION_TESTS=true npm test -- --testPathPattern="customers-import.integration"
```

**测试文件：**
- `src/import/customers/customers-import.integration.spec.ts`
  - 文件上传测试
  - 映射预览测试
  - 数据验证测试
  - 导入任务启动和状态查询测试
  - 导入历史查询测试

### 3. 性能测试（需要环境变量）

大文件导入性能测试（5000+ 记录）。

**运行命令：**
```bash
RUN_PERFORMANCE_TESTS=true npm test -- --testPathPattern="import-performance"
```

**测试文件：**
- `test/import-performance.test.ts`
  - 测试大文件导入（5000+ 记录）
  - 验证性能指标（上传、预览、验证、导入时间）

### 4. 部分成功导入测试（需要环境变量）

测试部分成功导入场景（部分记录成功，部分失败）。

**运行命令：**
```bash
RUN_INTEGRATION_TESTS=true npm test -- --testPathPattern="import-partial-success"
```

**测试文件：**
- `test/import-partial-success.test.ts`
  - 混合有效和无效数据的导入场景
  - 验证部分成功、部分失败的导入结果

### 5. 错误处理测试（需要环境变量）

测试错误处理和恢复机制。

**运行命令：**
```bash
RUN_INTEGRATION_TESTS=true npm test -- --testPathPattern="import-error-handling"
```

**测试文件：**
- `test/import-error-handling.test.ts`
  - 文件上传错误处理
  - 数据验证错误处理
  - 导入任务错误处理
  - 临时文件清理验证

## 运行所有测试

### 仅运行单元测试（推荐，快速验证）
```bash
npm test -- --testPathPattern="import/customers/services"
```

### 运行所有导入相关测试（包括集成测试）
```bash
RUN_INTEGRATION_TESTS=true RUN_PERFORMANCE_TESTS=true npm test -- --testPathPattern="import"
```

## 前置条件

运行集成测试、性能测试和错误处理测试需要：

1. **数据库运行中**
   - PostgreSQL 数据库已启动
   - 数据库连接配置正确（DATABASE_URL 或 PG_DATABASE_URL）

2. **Redis 运行中**
   - Redis 服务已启动
   - Redis 连接配置正确（REDIS_URL）

3. **测试用户**
   - 需要有效的管理员账户用于测试
   - 可以通过环境变量配置：
     - `TEST_ADMIN_EMAIL` (默认: admin@example.com)
     - `TEST_ADMIN_PASSWORD` (默认: admin123)

4. **环境变量**
   - `RUN_INTEGRATION_TESTS=true` - 启用集成测试
   - `RUN_PERFORMANCE_TESTS=true` - 启用性能测试

## 测试数据

测试会自动创建临时测试文件：
- `test/fixtures/integration-test-customers.xlsx`
- `test/fixtures/integration-test-customers.csv`
- `test/fixtures/large-import-test.xlsx` (5000+ 记录)
- `test/fixtures/mixed-data-import-test.xlsx`
- `test/fixtures/error-handling-test.xlsx`

测试完成后会自动清理这些文件。

## 注意事项

1. **集成测试会创建真实的数据库记录**，测试完成后可能需要清理
2. **性能测试会创建大量数据**（5000+ 记录），运行时间较长（可能 5-10 分钟）
3. **测试需要完整的后端服务**，确保所有依赖服务都已启动
4. **临时文件清理**：测试会自动清理临时文件，但如果测试中断，可能需要手动清理 `/tmp/imports/` 目录

## 测试覆盖率

运行测试覆盖率报告：
```bash
npm run test:cov -- --testPathPattern="import"
```

