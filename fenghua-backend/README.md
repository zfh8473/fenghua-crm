# fenghua-crm Backend

**专有代码 - 不开源**

这是 fenghua-crm 项目的定制后端服务，通过 API 与 Twenty CRM 集成。

## 架构说明

- **技术栈：** NestJS + TypeScript + GraphQL
- **集成方式：** 通过 GraphQL API 调用 Twenty CRM
- **数据库：** 独立的 PostgreSQL 数据库（用于定制数据）
- **许可证：** 专有（不开源）

## 项目结构

```
fenghua-backend/
├── src/
│   ├── product/              # 产品管理模块
│   ├── interaction/           # 互动记录模块
│   ├── permission/           # 权限管理模块
│   ├── excel-import/         # Excel 导入导出
│   ├── offline-sync/         # 离线同步
│   └── services/
│       └── twenty-client/    # Twenty API 客户端
├── package.json
└── README.md
```

## 开发指南

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 运行开发服务器

```bash
npm run start:dev
# 或
yarn start:dev
```

### 环境变量

创建 `.env` 文件：

```env
# Twenty CRM API 配置
TWENTY_API_URL=http://localhost:3000/graphql
TWENTY_API_TOKEN=your_api_token

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/fenghua_crm

# 应用配置
PORT=3001
NODE_ENV=development
```

## Twenty API 集成

通过 `services/twenty-client` 模块调用 Twenty CRM API。

参考：`src/services/twenty-client/README.md`

## 开发规范

- 所有定制代码放在 `src/` 目录下
- 通过 API 与 Twenty CRM 通信，不直接修改 Twenty 代码
- 遵循 NestJS 最佳实践
- 参考架构文档：`../docs/architecture-compliance-update.md`

