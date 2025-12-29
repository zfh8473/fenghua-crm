# fenghua-crm Frontend

**专有代码 - 不开源**

这是 fenghua-crm 项目的定制前端应用，通过 API 与 Twenty CRM 集成。

## 架构说明

- **技术栈：** React + TypeScript + Vite
- **集成方式：** 通过 GraphQL API 调用 Twenty CRM
- **UI 框架：** Tailwind CSS（与 Twenty 设计系统兼容）
- **许可证：** 专有（不开源）

## 项目结构

```
fenghua-frontend/
├── src/
│   ├── product/              # 产品管理组件
│   ├── quick-record/         # 快速记录组件
│   ├── interaction/          # 互动记录组件
│   ├── offline-sync/        # 离线同步组件
│   └── services/
│       └── twenty-api/      # Twenty API 调用
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
npm run dev
# 或
yarn dev
```

### 环境变量

创建 `.env` 文件：

```env
# Twenty CRM API 配置
VITE_TWENTY_API_URL=http://localhost:3000/graphql
VITE_TWENTY_API_TOKEN=your_api_token

# 应用配置
VITE_APP_NAME=fenghua-crm
```

## Twenty API 集成

通过 `services/twenty-api` 模块调用 Twenty CRM API。

参考：`src/services/twenty-api/README.md`

## 开发规范

- 所有定制代码放在 `src/` 目录下
- 通过 API 与 Twenty CRM 通信，不直接修改 Twenty 代码
- 遵循 React 和 TypeScript 最佳实践
- 参考架构文档：`../docs/architecture-compliance-update.md`

