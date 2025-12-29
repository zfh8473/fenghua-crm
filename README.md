# fenghua-crm

**专有项目 - 不开源**

基于 Twenty CRM 的定制化 CRM 系统，专为进出口公司设计。

## 项目架构

本项目采用 **API 集成架构**，确保 AGPL-3.0 许可证合规：

- **Twenty CRM**：保持原样，不修改（AGPL-3.0）
- **fenghua-backend**：定制后端服务（专有代码）
- **fenghua-frontend**：定制前端应用（专有代码）

## 项目结构

```
fenghua-crm/
├── fenghua-backend/          # 定制后端服务（专有）
├── fenghua-frontend/         # 定制前端应用（专有）
├── docs/                     # 项目文档
├── scripts/                  # 工具脚本
├── _bmad-output/            # BMad 工作流输出
└── README.md
```

## 快速开始

### 前置要求

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### 启动开发环境

1. **启动 Twenty CRM**：
   ```bash
   cd ~/Documents/GitHub/twenty/packages/twenty-docker
   docker-compose up -d
   ```

2. **启动定制后端**：
   ```bash
   cd fenghua-backend
   npm install
   npm run start:dev
   ```

3. **启动定制前端**：
   ```bash
   cd fenghua-frontend
   npm install
   npm run dev
   ```

## 许可证说明

- **Twenty CRM**：AGPL-3.0（保持原样，不修改）
- **定制代码**：专有（不开源）

详细说明请参考：`docs/license-compliance-guide.md`

## 文档

- [许可证合规指南](docs/license-compliance-guide.md)
- [API 集成架构](docs/api-integration-architecture.md)
- [架构更新说明](docs/architecture-compliance-update.md)
- [Fork 设置指南](docs/fork-setup-instructions.md)

## 开发规范

- 所有定制代码在 `fenghua-backend` 和 `fenghua-frontend` 中
- 通过 API 与 Twenty CRM 集成，不直接修改 Twenty 代码
- 参考架构文档进行开发

## 参考

- 架构文档：`_bmad-output/architecture.md`
- PRD：`_bmad-output/prd.md`
- Epic 和 Story：`_bmad-output/epics.md`

