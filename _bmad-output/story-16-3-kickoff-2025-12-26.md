# Story 16.3 启动报告

**Story:** 16.3 - 替换用户和角色管理  
**启动日期：** 2025-12-26  
**状态：** in-progress

---

## 📋 Story 概述

**目标：** 替换用户和角色管理系统，移除 Twenty CRM 依赖，使用原生数据库查询实现所有功能。

**Acceptance Criteria：**
1. ✅ 查看用户列表（包含角色信息、筛选、搜索）
2. ✅ 创建用户（验证邮箱、加密密码、分配角色）
3. ✅ 更新用户（更新用户信息和角色）
4. ✅ 删除用户（软删除）
5. ✅ 管理角色（查看角色列表、分配/移除角色）

---

## 🔧 技术实现策略

基于 Story 16.2 的实现经验，我们将使用：
- **`pg.Pool`** 直接查询数据库（不使用 Prisma）
- **`bcrypt`** 密码加密
- **事务** 确保数据一致性（角色分配）

---

## 📝 实施计划

### Task 1: 重构 UsersService
- 移除 `TwentyClientService` 依赖
- 添加 `pg.Pool` 数据库连接
- 实现 `findAll()` - 查询用户列表（包含角色）
- 实现 `create()` - 创建用户（加密密码、分配角色）
- 实现 `update()` - 更新用户和角色
- 实现 `remove()` - 软删除用户

### Task 2: 重构 RolesService
- 移除 `TwentyClientService` 依赖
- 添加 `pg.Pool` 数据库连接
- 实现 `findAll()` - 查询角色列表
- 实现 `assignRole()` - 分配角色
- 实现 `removeRole()` - 移除角色

### Task 3: 更新模块导入
- 更新 `UsersModule` - 移除 `TwentyClientModule`
- 更新 `RolesModule` - 移除 `TwentyClientModule`

### Task 4: 初始化角色数据
- 创建迁移脚本 `007-seed-roles.sql`
- 插入默认角色（ADMIN, DIRECTOR, FRONTEND_SPECIALIST, BACKEND_SPECIALIST）

### Task 5-6: 更新前端
- 更新用户管理页面 API 调用
- 更新角色管理页面 API 调用

### Task 7: 测试
- 单元测试
- 集成测试
- E2E 测试

---

## 🎯 开始执行

**下一步：** 开始 Task 1 - 重构 UsersService

---

**启动时间：** 2025-12-26

