# Twenty API Client Service

这个服务提供了与 Twenty CRM 集成的 GraphQL 客户端。

## 使用方法

### 在模块中注入服务

```typescript
import { Module } from '@nestjs/common';
import { TwentyClientService } from './services/twenty-client/twenty-client.service';

@Module({
  providers: [TwentyClientService],
  exports: [TwentyClientService],
})
export class AppModule {}
```

### 在服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { TwentyClientService } from '../services/twenty-client/twenty-client.service';

@Injectable()
export class ProductService {
  constructor(private readonly twentyClient: TwentyClientService) {}

  async getCustomers() {
    return this.twentyClient.getCompanies();
  }

  async createCustomer(data: { name: string }) {
    return this.twentyClient.createCompany(data);
  }
}
```

## 环境变量

```env
TWENTY_API_URL=http://localhost:3000/graphql
TWENTY_API_TOKEN=your_api_token_here
```

## 扩展

可以根据需要添加更多方法：

```typescript
// 添加自定义查询
async getCustomObjects() {
  const query = `
    query {
      customObjects {
        id
        name
        # ...
      }
    }
  `;
  return this.client.request(query);
}
```

## 参考

- Twenty CRM GraphQL API 文档
- GraphQL Client 文档：https://github.com/jasonkuhrt/graphql-request

