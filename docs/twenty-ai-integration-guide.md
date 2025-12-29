# Twenty CRM AI 分析功能 API 集成指南

**项目：** fenghua-crm  
**目的：** 详细说明实现 AI 分析功能所需的 API 集成  
**日期：** 2025-12-23

---

## 📊 重要澄清

### AI 客户分析的数据来源

**关键理解：** AI 客户分析主要使用 **CRM 内部数据**，而不是外部海关数据。

**数据来源分类：**

1. **CRM 内部数据（主要数据源）**
   - 客户基本信息（名称、行业、规模等）
   - 订单历史（订单频率、金额、产品类型等）
   - 沟通记录（邮件、电话、会议记录等）
   - 联系人信息（职位、部门、偏好等）
   - 客户行为（访问记录、询盘记录等）

2. **外部数据（可选增强）**
   - 海关数据（用于订单/合同管理，不是 AI 分析的核心）
   - 市场数据（用于销售预测增强）
   - 行业数据（用于客户画像增强）

**结论：** AI 客户分析的核心数据来自 Twenty CRM 内部，通过 GraphQL API 获取。

---

## 🔌 需要的 API 集成

### 1. Twenty CRM GraphQL API（数据源）

**用途：** 从 Twenty CRM 获取客户数据进行分析

**需要的查询：**

#### 1.1 获取客户列表和详情

```graphql
query GetCompaniesForAnalysis {
  companies {
    edges {
      node {
        id
        name
        domainName
        address
        employees
        # 自定义字段
        industry
        customerType
        # 关联数据
        people {
          edges {
            node {
              id
              firstName
              lastName
              email
              phone
              jobTitle
            }
          }
        }
        # 活动记录
        activities {
          edges {
            node {
              id
              type
              createdAt
              # ... 活动详情
            }
          }
        }
      }
    }
  }
}
```

#### 1.2 获取订单/交易数据（如果已创建订单对象）

```graphql
query GetOrdersForAnalysis {
  # 假设已创建订单自定义对象
  customObjects(filter: { objectType: { eq: "Order" } }) {
    edges {
      node {
        id
        customerId
        orderDate
        amount
        status
        products
        # ... 其他订单字段
      }
    }
  }
}
```

#### 1.3 获取沟通记录

```graphql
query GetCommunicationHistory {
  # 获取邮件、电话等沟通记录
  activities(filter: { type: { in: ["Email", "Call", "Meeting"] } }) {
    edges {
      node {
        id
        type
        subject
        body
        createdAt
        company {
          id
          name
        }
      }
    }
  }
}
```

---

### 2. AI 服务 API（分析引擎）

#### 2.1 OpenAI API（推荐）

**用途：** 客户画像分析、行为分析、销售预测

**需要的 API：**
- **Chat Completions API** - 用于生成客户画像和分析报告
- **Embeddings API** - 用于客户相似度分析和聚类

**示例调用：**

```typescript
// 客户画像分析
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '你是一个专业的 CRM 分析师，负责分析客户数据并生成客户画像。'
      },
      {
        role: 'user',
        content: `请分析以下客户数据并生成客户画像：
        客户名称：${company.name}
        行业：${company.industry}
        订单历史：${orders}
        沟通记录：${communications}
        
        请生成包含以下内容的客户画像：
        1. 客户类型和价值评估
        2. 购买行为模式
        3. 沟通偏好
        4. 风险评分
        5. 销售建议`
      }
    ]
  })
});
```

**成本：** 按使用量计费，约 $0.01-0.03 每客户分析

---

#### 2.2 Claude API（备选）

**用途：** 与 OpenAI 类似，可用于客户分析

**API 端点：**
- `https://api.anthropic.com/v1/messages`

**优势：**
- 更长的上下文窗口
- 更好的结构化输出

---

#### 2.3 数据分析服务 API（可选）

**用途：** 销售预测、趋势分析

**可选服务：**
- **Google Analytics API** - 如果有网站数据
- **自定义预测模型** - 使用 Python/ML 服务

---

### 3. 数据回写 API（存储分析结果）

#### 3.1 Twenty GraphQL Mutation API

**用途：** 将 AI 分析结果存储回 Twenty CRM

**示例：**

```graphql
mutation CreateCustomerAnalysis {
  createCustomObject(
    input: {
      objectType: "CustomerAnalysis"
      fields: {
        companyId: "xxx"
        analysisType: "CustomerProfile"
        analysisResult: {
          customerType: "VIP"
          valueScore: 9
          riskScore: 2
          behaviorPattern: "Regular buyer, quality-focused"
          recommendations: "Focus on quality, maintain relationship"
        }
        analyzedAt: "2025-12-23T10:00:00Z"
      }
    }
  ) {
    id
  }
}
```

#### 3.2 更新客户标签

```graphql
mutation UpdateCompanyTags {
  updateCompany(
    id: "xxx"
    input: {
      tags: ["VIP", "Quality-Focused", "High-Value"]
    }
  ) {
    id
  }
}
```

---

## 🏗️ 集成架构

### 架构图

```
┌─────────────────┐
│  Twenty CRM     │
│  (GraphQL API)  │
└────────┬────────┘
         │ 1. 获取客户数据
         ▼
┌─────────────────┐
│  AI 分析服务    │
│  (Node.js/      │
│   Python)       │
└────────┬────────┘
         │ 2. 调用 AI API
         ▼
┌─────────────────┐
│  OpenAI/Claude  │
│  API            │
└────────┬────────┘
         │ 3. 返回分析结果
         ▼
┌─────────────────┐
│  AI 分析服务    │
└────────┬────────┘
         │ 4. 存储分析结果
         ▼
┌─────────────────┐
│  Twenty CRM     │
│  (GraphQL       │
│   Mutation)     │
└─────────────────┘
```

---

## 💻 实现方案

### 方案 1：独立 AI 分析服务（推荐）

**架构：**
- 创建独立的 Node.js/TypeScript 服务
- 定期从 Twenty 获取数据
- 调用 AI API 进行分析
- 将结果写回 Twenty

**技术栈：**
- Node.js + TypeScript
- GraphQL Client (Apollo Client 或 fetch)
- OpenAI/Claude SDK

**代码结构：**

```typescript
// ai-analysis-service/
// ├── src/
// │   ├── services/
// │   │   ├── twenty-client.ts      // Twenty GraphQL 客户端
// │   │   ├── openai-service.ts     // OpenAI API 服务
// │   │   └── analysis-service.ts   // 分析逻辑
// │   ├── models/
// │   │   └── customer-analysis.ts  // 数据模型
// │   └── index.ts                   // 入口文件
// └── package.json
```

**实现步骤：**
1. 从 Twenty GraphQL API 获取客户数据
2. 调用 OpenAI API 进行分析
3. 处理分析结果
4. 通过 GraphQL Mutation 存储结果

---

### 方案 2：使用 Twenty 工作流

**架构：**
- 使用 Twenty 内置工作流功能
- HTTP 节点调用 AI 服务
- 代码节点处理数据

**优势：**
- 无需额外服务
- 可视化配置
- 易于维护

**限制：**
- 功能可能受限
- 复杂逻辑可能难以实现

---

## 📋 关于海关数据

### 海关数据的作用

**重要澄清：** 海关数据不是 AI 客户分析的核心数据源，但可能是进出口业务的其他需求。

**海关数据的用途：**

1. **订单/合同管理（下一阶段）**
   - 报关单管理
   - 物流跟踪
   - 关税计算
   - 合规性检查

2. **客户验证（可选）**
   - 验证客户进出口资质
   - 查看客户历史进出口记录
   - 评估客户贸易能力

3. **市场分析（可选）**
   - 行业进出口趋势
   - 竞争对手分析
   - 市场机会识别

### 海关数据 API（如果需要）

**中国海关数据 API：**
- **中国海关总署 API**（需要申请）
- **第三方数据服务**（如：天眼查、企查查等）

**国际海关数据：**
- **各国海关 API**（需要分别申请）
- **第三方贸易数据服务**

**注意：** 海关数据通常需要：
- 官方申请和审核
- 可能需要付费
- 数据更新可能有延迟

---

## 🔧 完整集成清单

### 必需的 API

1. ✅ **Twenty GraphQL API**
   - 用途：获取客户数据，存储分析结果
   - 位置：http://localhost:3000/graphql
   - 认证：JWT Token

2. ✅ **OpenAI API 或 Claude API**
   - 用途：AI 分析引擎
   - 位置：https://api.openai.com/v1 或 https://api.anthropic.com/v1
   - 认证：API Key

### 可选的 API

3. ⚠️ **海关数据 API**（如果需要）
   - 用途：订单管理、客户验证
   - 注意：需要申请，可能需要付费
   - 优先级：低（下一阶段）

4. ⚠️ **市场数据 API**（如果需要）
   - 用途：销售预测增强
   - 注意：可选，不是必需的

---

## 💰 成本估算

### API 调用成本

**OpenAI API：**
- GPT-4：约 $0.01-0.03 每客户分析
- 100 个客户：约 $1-3
- 每月 1000 次分析：约 $10-30

**Claude API：**
- Claude 3：类似价格
- 成本可接受

**海关数据 API：**
- 通常需要付费订阅
- 价格因服务商而异
- 建议：先实现核心功能，再考虑海关数据

---

## 🚀 实施建议

### 第一阶段：核心 AI 分析（推荐先做）

**需要的 API：**
1. ✅ Twenty GraphQL API（获取数据）
2. ✅ OpenAI/Claude API（AI 分析）

**不需要：**
- ❌ 海关数据 API（不是 AI 分析的核心）

**工作量：** 5-10 人天

---

### 第二阶段：增强功能（可选）

**如果需要海关数据：**
- 申请海关数据 API
- 集成到订单/合同管理模块
- 用于客户验证和市场分析

**工作量：** 额外 3-5 人天

---

## 📝 总结

### 关键要点

1. **AI 客户分析的核心数据来自 Twenty CRM 内部**
   - 客户信息
   - 订单历史
   - 沟通记录
   - 行为数据

2. **需要的 API：**
   - ✅ Twenty GraphQL API（必需）
   - ✅ OpenAI/Claude API（必需）
   - ⚠️ 海关数据 API（可选，用于其他功能）

3. **海关数据不是 AI 分析的核心**
   - 海关数据主要用于订单/合同管理
   - 可以后续集成
   - 不是 AI 客户分析的必需数据

4. **实现成本可控**
   - 核心 AI 分析：5-10 人天
   - API 调用成本：每月 $10-30（1000 次分析）

---

**建议：** 先实现核心 AI 分析功能（使用 CRM 内部数据），海关数据可以在下一阶段的订单/合同管理模块中集成。

---

**文档完成日期：** 2025-12-23

