# Story 16.2 启动报告

**Story:** 16.2 - 替换认证系统  
**启动日期：** 2025-12-26  
**状态：** in-progress

---

## 📋 Story 概述

替换当前的 Twenty CRM 认证系统为原生认证系统，使用 `users` 表和 JWT token。

---

## 🎯 主要任务

1. **重构 AuthService** - 移除 TwentyClientService 依赖，使用 pg.Pool 查询 users 表
2. **更新 AuthModule** - 移除 TwentyClientModule，添加 JwtModule
3. **更新 AuthController** - 使用新的 AuthService
4. **更新 JWT Guard** - 使用新的 validateToken 方法
5. **更新前端认证服务** - 适配新的 API
6. **更新环境变量** - 添加 JWT_SECRET
7. **测试认证系统** - 验证所有功能

---

## 🔧 技术栈

- `@nestjs/jwt` - JWT 生成和验证
- `bcrypt` - 密码加密和验证（已安装）
- `pg.Pool` - 数据库查询（不使用 Prisma）

---

## 📝 关键实现点

1. **数据库连接：** 使用 `DATABASE_URL`（fenghua-crm 数据库），不再是 `TWENTY_DATABASE_URL`
2. **用户查询：** 从 `users` 表查询，包含 `user_roles` 关联
3. **JWT Payload：** `{ sub: user.id, email: user.email, roles: user.roles }`
4. **密码验证：** 使用 `bcrypt.compare()`
5. **Token 生成：** 使用 `JwtService.sign()`

---

**启动时间：** 2025-12-26

