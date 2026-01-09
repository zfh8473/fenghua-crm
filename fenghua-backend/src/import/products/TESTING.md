# 产品导入测试指南

## 测试文件说明

### 单元测试
- `services/mapping.service.spec.ts` - 产品列名映射服务测试
- `services/validation.service.spec.ts` - 产品数据验证服务测试

运行单元测试：
```bash
npm test -- --testPathPattern="products.*mapping|products.*validation"
```

### 集成测试
- `products-import.integration.spec.ts` - 完整导入流程测试
- `products-import-performance.spec.ts` - 性能测试（5000+ 记录）
- `products-import-partial-success.spec.ts` - 部分成功导入测试
- `products-import-error-handling.spec.ts` - 错误处理测试

## 运行集成测试

### 前置条件
1. 数据库运行中（PostgreSQL）
2. Redis 运行中（用于 BullMQ）
3. 后端服务配置正确（DATABASE_URL, REDIS_URL）

### 运行所有集成测试
```bash
RUN_INTEGRATION_TESTS=true npm test -- --testPathPattern="products-import.*integration|products-import.*partial|products-import.*error"
```

### 运行性能测试
```bash
RUN_PERFORMANCE_TESTS=true npm test -- --testPathPattern="products-import-performance"
```

### 运行特定测试文件
```bash
# 集成测试
RUN_INTEGRATION_TESTS=true npm test -- products-import.integration.spec.ts

# 性能测试
RUN_PERFORMANCE_TESTS=true npm test -- products-import-performance.spec.ts

# 部分成功测试
RUN_INTEGRATION_TESTS=true npm test -- products-import-partial-success.spec.ts

# 错误处理测试
RUN_INTEGRATION_TESTS=true npm test -- products-import-error-handling.spec.ts
```

## 测试环境变量

设置测试管理员账户：
```bash
export TEST_ADMIN_EMAIL=admin@example.com
export TEST_ADMIN_PASSWORD=admin123
```

## 测试覆盖范围

### 集成测试 (`products-import.integration.spec.ts`)
- ✅ 文件上传（Excel 和 CSV）
- ✅ 文件大小限制验证
- ✅ 映射预览（自动映射和自定义映射）
- ✅ 数据验证
- ✅ 导入任务启动
- ✅ 任务状态查询
- ✅ 导入历史查询

### 性能测试 (`products-import-performance.spec.ts`)
- ✅ 大文件上传性能（5000+ 记录）
- ✅ 映射预览性能
- ✅ 数据验证性能（批量优化）
- ✅ 完整导入流程性能
- ✅ 批量验证效率测试

### 部分成功测试 (`products-import-partial-success.spec.ts`)
- ✅ 混合有效/无效数据导入
- ✅ SAVEPOINT 部分回滚功能
- ✅ 成功和失败记录统计
- ✅ 错误报告生成

### 错误处理测试 (`products-import-error-handling.spec.ts`)
- ✅ 重复 HS 编码检测
- ✅ 无效产品类别检测
- ✅ 无效 HS 编码格式检测
- ✅ 错误报告下载功能

## 测试数据

测试文件会自动创建在 `test/fixtures/` 目录：
- `integration-test-products.xlsx` - 集成测试用 Excel 文件
- `integration-test-products.csv` - 集成测试用 CSV 文件
- `large-products-import-test.xlsx` - 性能测试用大文件（5000 条记录）
- `partial-success-products-test.xlsx` - 部分成功测试用文件
- `error-handling-products-test.xlsx` - 错误处理测试用文件

测试完成后会自动清理这些文件。

## 注意事项

1. **性能测试**需要较长时间（可能超过 5 分钟），请确保有足够的测试时间
2. **集成测试**需要真实的数据库和 Redis 连接，确保环境变量配置正确
3. 测试会创建真实的产品数据，建议在测试数据库中运行
4. 测试完成后会自动清理测试文件，但不会清理已导入的产品数据


