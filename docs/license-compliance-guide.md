# Twenty CRM 许可证合规指南

**日期：** 2025-12-25  
**项目：** fenghua-crm  
**重要：** 本文档提供许可证合规建议，但不构成法律建议。请咨询专业律师以获得法律意见。

## Twenty CRM 许可证概述

### 许可证类型

**Twenty CRM 使用：AGPL-3.0 (GNU Affero General Public License v3.0)**

### AGPL-3.0 关键要求

1. **网络服务条款（Copyleft）**：
   - 如果你修改了 AGPL 代码并通过网络服务提供给用户，**必须开源你的修改**
   - 这包括通过互联网、内网或任何网络方式提供的服务

2. **代码分发**：
   - 如果你分发修改后的代码，必须使用相同的 AGPL 许可证
   - 必须保留原始版权声明和许可证文件

3. **内部使用**：
   - 如果你只是内部使用，不对外提供服务，**可能不需要开源**
   - 但一旦通过网络服务提供给第三方，就必须开源修改

## 你的需求分析

**需求：**
- ✅ 使用 Twenty CRM 作为基础平台
- ✅ 添加专有定制代码
- ❌ **不想开源定制部分**

**挑战：**
- AGPL-3.0 要求修改后的代码在提供网络服务时必须开源
- 直接修改 Twenty 代码会触发开源要求

## 合规方案

### 方案 A：API 集成架构（推荐 - 完全合规）

**核心思想：** 不修改 Twenty CRM 代码，而是通过 API 集成定制功能

**架构设计：**
```
┌─────────────────────────────────────┐
│   fenghua-crm 定制服务（专有）      │
│   - 产品管理模块                    │
│   - 业务逻辑                        │
│   - 专有功能                      │
│   (专有代码，不开源)                │
└──────────────┬──────────────────────┘
               │ GraphQL API
               │ REST API
┌──────────────▼──────────────────────┐
│   Twenty CRM (未修改)               │
│   - 客户管理                        │
│   - 联系人管理                      │
│   - 基础 CRM 功能                   │
│   (AGPL-3.0，保持原样)              │
└─────────────────────────────────────┘
```

**实施方式：**

1. **Twenty CRM 保持原样**：
   - 不修改任何 Twenty 源代码
   - 使用官方 Docker 镜像或源代码（不修改）
   - 通过 GraphQL API 调用 Twenty 功能

2. **定制功能作为独立服务**：
   - 创建独立的 NestJS 服务（fenghua-crm-backend）
   - 实现产品管理、业务逻辑等定制功能
   - 通过 API 与 Twenty CRM 通信

3. **前端集成**：
   - 创建独立的前端应用（fenghua-crm-frontend）
   - 或通过 iframe/微前端方式集成 Twenty 前端
   - 定制 UI 组件完全独立

**优点：**
- ✅ **完全合规**：不修改 AGPL 代码，无需开源
- ✅ 定制代码完全专有
- ✅ 可以独立部署和升级
- ✅ 清晰的架构边界

**缺点：**
- ⚠️ 需要维护两个系统
- ⚠️ 需要处理 API 集成
- ⚠️ 可能增加系统复杂度

**代码组织：**
```
fenghua-crm/
├── twenty/                    # Twenty CRM（未修改，AGPL-3.0）
│   └── (保持原样)
│
├── fenghua-backend/           # 定制后端服务（专有）
│   ├── src/
│   │   ├── product/           # 产品管理
│   │   ├── interaction/       # 互动记录
│   │   └── services/
│   │       └── twenty-client/ # Twenty API 客户端
│   └── package.json
│
└── fenghua-frontend/          # 定制前端（专有）
    ├── src/
    │   ├── product/           # 产品管理组件
    │   ├── quick-record/      # 快速记录
    │   └── services/
    │       └── twenty-api/    # Twenty API 调用
    └── package.json
```

### 方案 B：插件/扩展架构（部分合规）

**核心思想：** 将定制代码作为独立的插件/扩展，通过 Twenty 的扩展机制集成

**实施方式：**

1. **利用 Twenty 的扩展机制**：
   - 使用 Twenty 的 Custom Objects API
   - 使用 GraphQL Resolver 扩展点
   - 使用前端组件扩展机制

2. **定制代码独立管理**：
   - 定制代码作为独立的 npm 包
   - 通过依赖注入方式集成
   - 保持代码边界清晰

**优点：**
- ✅ 代码组织清晰
- ✅ 相对容易维护

**缺点：**
- ⚠️ **可能仍需开源**：如果深度集成到 Twenty 运行时，可能触发 AGPL 要求
- ⚠️ 需要仔细评估集成方式

**风险：** ⚠️ **中等风险** - 需要法律咨询确认

### 方案 C：商业许可证（完全合规）

**核心思想：** 联系 Twenty CRM 获取商业许可证

**实施方式：**

1. **联系 Twenty CRM 团队**：
   - 访问：https://twenty.com
   - 联系销售团队
   - 申请商业许可证

2. **商业许可证优势**：
   - 可以修改代码而不开源
   - 可以用于商业用途
   - 获得官方支持

**优点：**
- ✅ **完全合规**
- ✅ 可以自由修改代码
- ✅ 获得官方支持

**缺点：**
- ⚠️ 需要支付许可证费用
- ⚠️ 需要与 Twenty 团队协商

### 方案 D：架构分离 + 最小修改（需要法律咨询）

**核心思想：** 最小化对 Twenty 的修改，将定制功能作为独立模块

**实施方式：**

1. **Twenty 核心保持原样**：
   - 只修改必要的配置文件
   - 不修改核心业务逻辑

2. **定制代码完全独立**：
   - 定制代码在独立的目录（如 `custom/`）
   - 通过接口/抽象层与 Twenty 通信
   - 保持代码边界清晰

**风险：** ⚠️ **高风险** - 即使代码分离，如果深度集成可能仍需开源

**建议：** 不推荐，除非获得法律确认

## 推荐方案：方案 A（API 集成架构）

### 实施步骤

1. **保持 Twenty CRM 原样**：
   ```bash
   # 使用官方 Docker 镜像或源代码（不修改）
   cd ~/Documents/GitHub/twenty
   # 不进行任何修改，只用于运行
   ```

2. **创建独立的定制服务**：
   ```bash
   cd ~/Documents/GitHub/fenghua-crm
   
   # 创建后端服务
   mkdir -p fenghua-backend
   cd fenghua-backend
   npm init -y
   # 安装 NestJS 等依赖
   
   # 创建前端应用
   cd ..
   mkdir -p fenghua-frontend
   cd fenghua-frontend
   npm init -y
   # 安装 React 等依赖
   ```

3. **通过 API 集成**：
   - 后端：通过 GraphQL 客户端调用 Twenty API
   - 前端：通过 HTTP 请求调用 Twenty GraphQL API

### 代码示例

**后端 - Twenty API 客户端：**
```typescript
// fenghua-backend/src/services/twenty-client.service.ts
import { Injectable } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';

@Injectable()
export class TwentyClientService {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient('http://localhost:3000/graphql', {
      headers: {
        authorization: `Bearer ${process.env.TWENTY_API_TOKEN}`,
      },
    });
  }

  async getCustomers() {
    const query = `
      query {
        companies {
          id
          name
          # ...
        }
      }
    `;
    return this.client.request(query);
  }
}
```

**前端 - Twenty API 调用：**
```typescript
// fenghua-frontend/src/services/twenty-api.ts
import { GraphQLClient } from 'graphql-request';

export const twentyClient = new GraphQLClient('http://localhost:3000/graphql');

export async function fetchCustomers() {
  const query = `
    query {
      companies {
        id
        name
      }
    }
  `;
  return twentyClient.request(query);
}
```

## 许可证合规检查清单

- [ ] 确认 Twenty CRM 使用方式（修改 vs 不修改）
- [ ] 确认定制代码的组织方式（独立服务 vs 集成）
- [ ] 确认是否通过网络服务提供给第三方
- [ ] 咨询法律专业人士
- [ ] 选择合规方案并实施
- [ ] 建立代码审查流程确保合规

## 重要提醒

1. **这不是法律建议**：本文档提供技术方案，但不构成法律建议
2. **咨询专业人士**：在做出决定前，请咨询知识产权律师
3. **持续合规**：定期审查代码和架构，确保持续合规
4. **文档化**：记录所有决策和合规措施

## 参考资源

- AGPL-3.0 许可证全文：https://www.gnu.org/licenses/agpl-3.0.html
- Twenty CRM 许可证：`~/Documents/GitHub/twenty/LICENSE`
- Twenty CRM 商业许可证：https://twenty.com（联系销售团队）

## 下一步行动

1. **立即行动**：
   - 评估你的使用场景（内部使用 vs 对外服务）
   - 选择合规方案（推荐方案 A）

2. **短期（1-2 周）**：
   - 咨询法律专业人士
   - 确认合规方案
   - 开始实施架构设计

3. **长期**：
   - 建立合规审查流程
   - 定期审查代码和架构
   - 保持与 Twenty 社区的沟通

