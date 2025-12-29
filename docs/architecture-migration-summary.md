> ⚠️ **文档已过时**
> 
> 本文档描述的是从直接修改 Twenty 代码迁移到 API 集成架构的过程，该项目已决定移除 Twenty CRM 依赖。
> 
> **状态：** 已过时（保留作为历史参考）  
> **替代文档：** `docs/api-integration-architecture.md`（原生技术栈架构）  
> **重构计划：** `_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`
> 
> **最后更新：** 2025-12-26
> 
> ---

# 架构迁移总结

**日期：** 2025-12-25  
**变更：** 从直接修改 Twenty 代码迁移到 API 集成架构  
**状态：** ⚠️ 已过时 - 项目已决定移除 Twenty CRM 依赖

## 变更原因

- **许可证合规**：AGPL-3.0 要求修改代码必须开源
- **代码保护**：需要保护专有定制代码
- **架构清晰**：API 集成架构边界更清晰

## 已完成的设置

### 1. 项目结构

```
fenghua-crm/
├── fenghua-backend/          # 定制后端服务（专有）
│   ├── src/
│   │   └── services/
│   │       └── twenty-client/  # Twenty API 客户端
│   └── README.md
│
├── fenghua-frontend/         # 定制前端应用（专有）
│   ├── src/
│   │   └── services/
│   │       └── twenty-api/    # Twenty API 客户端
│   └── README.md
│
└── docs/
    ├── license-compliance-guide.md
    ├── api-integration-architecture.md
    └── architecture-compliance-update.md
```

### 2. 基础代码

- ✅ Twenty API 客户端（后端）：`fenghua-backend/src/services/twenty-client/`
- ✅ Twenty API 客户端（前端）：`fenghua-frontend/src/services/twenty-api/`
- ✅ 项目文档和 README

### 3. 文档

- ✅ 许可证合规指南
- ✅ API 集成架构详细说明
- ✅ 架构更新说明

## 架构对比

### 原架构（已废弃）

```
twenty-fenghua/
└── packages/
    ├── twenty-server/src/custom/  # 定制代码（会触发开源要求）
    └── twenty-front/src/custom/   # 定制代码（会触发开源要求）
```

**问题：** 直接修改 AGPL 代码，需要开源定制部分

### 新架构（当前）

```
fenghua-crm/
├── twenty/              # Twenty CRM（未修改，保持原样）
├── fenghua-backend/    # 定制后端（专有，不开源）
└── fenghua-frontend/   # 定制前端（专有，不开源）
```

**优势：** 不修改 AGPL 代码，定制代码完全专有

## 下一步行动

### 1. 初始化项目（立即）

**后端：**
```bash
cd fenghua-backend
npm init -y
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install graphql-request
npm install --save-dev @types/node typescript
```

**前端：**
```bash
cd fenghua-frontend
npm create vite@latest . -- --template react-ts
npm install graphql-request
npm install @tanstack/react-query
```

### 2. 配置环境变量

**后端 `.env`：**
```env
TWENTY_API_URL=http://localhost:3000/graphql
TWENTY_API_TOKEN=your_token
PORT=3001
```

**前端 `.env`：**
```env
VITE_TWENTY_API_URL=http://localhost:3000/graphql
VITE_TWENTY_API_TOKEN=your_token
```

### 3. 开始开发

按照 Epic 和 Story 开始实施：
- Story 1.2: 用户认证系统
- Epic 2: 产品管理
- Epic 3: 客户管理和数据隔离

## 开发工作流

### 日常开发

1. **启动 Twenty CRM**（如果未运行）：
   ```bash
   cd ~/Documents/GitHub/twenty/packages/twenty-docker
   docker-compose up -d
   ```

2. **开发定制后端**：
   ```bash
   cd fenghua-backend
   npm run start:dev
   ```

3. **开发定制前端**：
   ```bash
   cd fenghua-frontend
   npm run dev
   ```

### API 集成

- 通过 `TwentyClientService`（后端）调用 Twenty API
- 通过 `twenty-api.ts`（前端）调用 Twenty API
- 所有定制业务逻辑在 `fenghua-backend` 中实现
- 所有定制 UI 在 `fenghua-frontend` 中实现

## 重要提醒

1. **不要修改 Twenty 代码**：保持 Twenty CRM 原样
2. **通过 API 集成**：所有与 Twenty 的交互通过 GraphQL API
3. **代码保护**：定制代码完全专有，不开源
4. **持续合规**：定期审查架构，确保合规

## 参考文档

- [许可证合规指南](license-compliance-guide.md)
- [API 集成架构](api-integration-architecture.md)
- [架构更新说明](architecture-compliance-update.md)
- [原架构文档](../_bmad-output/architecture.md)

