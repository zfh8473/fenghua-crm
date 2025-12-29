> ⚠️ **文档已过时**
> 
> 本文档描述的是基于 Twenty CRM 的 API 集成架构，该项目已决定移除 Twenty CRM 依赖。
> 
> **状态：** 已过时（保留作为历史参考）  
> **替代文档：** `docs/api-integration-architecture.md`（原生技术栈架构）  
> **重构计划：** `_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`
> 
> **最后更新：** 2025-12-26
> 
> ---

# 架构更新：API 集成架构（许可证合规）

**日期：** 2025-12-25  
**原因：** 确保 AGPL-3.0 许可证合规，保护专有代码  
**状态：** ⚠️ 已过时 - 项目已决定移除 Twenty CRM 依赖

## 架构变更说明

### 原架构（需要调整）

原架构文档假设直接在 Twenty CRM 代码中添加定制模块：
```
twenty-fenghua/
└── packages/
    ├── twenty-server/src/custom/  # 定制代码
    └── twenty-front/src/custom/   # 定制代码
```

**问题：** 这种方式会触发 AGPL-3.0 的开源要求

### 新架构（合规）

采用 API 集成架构，保持 Twenty CRM 原样，定制功能作为独立服务：

```
fenghua-crm/
├── twenty/                        # Twenty CRM（未修改，AGPL-3.0）
│   └── (保持原样，不修改)
│
├── fenghua-backend/              # 定制后端服务（专有）
│   ├── src/
│   │   ├── product/              # 产品管理模块
│   │   ├── interaction/          # 互动记录模块
│   │   ├── permission/           # 权限管理模块
│   │   ├── excel-import/         # Excel 导入导出
│   │   ├── offline-sync/        # 离线同步
│   │   └── services/
│   │       └── twenty-client/    # Twenty API 客户端
│   └── package.json
│
└── fenghua-frontend/             # 定制前端（专有）
    ├── src/
    │   ├── product/              # 产品管理组件
    │   ├── quick-record/         # 快速记录组件
    │   ├── interaction/         # 互动记录组件
    │   ├── offline-sync/        # 离线同步组件
    │   └── services/
    │       └── twenty-api/      # Twenty API 调用
    └── package.json
```

## 技术实现

### 后端架构

**fenghua-backend** - NestJS 服务：
- 独立的 NestJS 应用
- 通过 GraphQL 客户端调用 Twenty API
- 实现所有定制业务逻辑
- 完全专有，不开源

**Twenty API 集成：**
```typescript
// fenghua-backend/src/services/twenty-client.service.ts
@Injectable()
export class TwentyClientService {
  private client: GraphQLClient;

  async getCompanies() {
    // 调用 Twenty GraphQL API
  }

  async createCompany(data) {
    // 创建客户
  }
}
```

### 前端架构

**fenghua-frontend** - React 应用：
- 独立的 React 应用
- 通过 HTTP 调用 Twenty GraphQL API
- 实现所有定制 UI 组件
- 完全专有，不开源

**Twenty API 集成：**
```typescript
// fenghua-frontend/src/services/twenty-api.ts
export const twentyClient = new GraphQLClient(
  'http://localhost:3000/graphql'
);

export async function fetchCompanies() {
  return twentyClient.request(COMPANIES_QUERY);
}
```

## 数据流

```
用户操作
  ↓
fenghua-frontend (定制前端)
  ↓ HTTP/GraphQL
fenghua-backend (定制后端)
  ↓ GraphQL API
Twenty CRM (未修改)
  ↓
PostgreSQL 数据库
```

## 部署架构

```
┌─────────────────────────────────┐
│   Docker Compose                │
│                                 │
│   ┌──────────────────────┐     │
│   │  fenghua-frontend    │     │
│   │  (定制前端)          │     │
│   └──────────┬───────────┘     │
│              │                  │
│   ┌──────────▼───────────┐     │
│   │  fenghua-backend     │     │
│   │  (定制后端)          │     │
│   └──────────┬───────────┘     │
│              │                  │
│   ┌──────────▼───────────┐     │
│   │  Twenty CRM         │     │
│   │  (未修改)           │     │
│   └──────────┬───────────┘     │
│              │                  │
│   ┌──────────▼───────────┐     │
│   │  PostgreSQL         │     │
│   └──────────────────────┘     │
└─────────────────────────────────┘
```

## 优势

1. **完全合规**：不修改 AGPL 代码，无需开源定制部分
2. **代码保护**：定制代码完全专有
3. **独立部署**：可以独立部署和升级
4. **清晰边界**：架构边界清晰，易于维护

## 实施步骤

1. **保持 Twenty CRM 原样**：
   - 使用官方 Docker 镜像或源代码（不修改）
   - 只用于运行，不进行任何代码修改

2. **创建定制服务**：
   - 创建 `fenghua-backend` 和 `fenghua-frontend`
   - 通过 API 与 Twenty 集成

3. **更新开发流程**：
   - 所有定制开发在独立服务中进行
   - 通过 API 调用 Twenty 功能

## 参考

- 许可证合规指南：`docs/license-compliance-guide.md`
- 原架构文档：`_bmad-output/architecture.md`

