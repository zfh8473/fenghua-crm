# Twenty API Client

这个模块提供了与 Twenty CRM 集成的 GraphQL 客户端。

## 使用方法

### 在组件中使用

```typescript
import { fetchCompanies, createCompany } from '@/services/twenty-api/twenty-api';

function CustomerList() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies().then(setCompanies);
  }, []);

  const handleCreate = async (data: { name: string }) => {
    const newCompany = await createCompany(data);
    setCompanies([...companies, newCompany]);
  };

  return (
    <div>
      {companies.map(company => (
        <div key={company.id}>{company.name}</div>
      ))}
    </div>
  );
}
```

### 使用 React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchCompanies, createCompany } from '@/services/twenty-api/twenty-api';

function CustomerList() {
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  return (
    <div>
      {companies?.map(company => (
        <div key={company.id}>{company.name}</div>
      ))}
    </div>
  );
}
```

## 环境变量

```env
VITE_TWENTY_API_URL=http://localhost:3000/graphql
VITE_TWENTY_API_TOKEN=your_api_token_here
```

## 扩展

可以根据需要添加更多方法：

```typescript
// 添加自定义查询
export async function fetchCustomObjects() {
  const query = `
    query {
      customObjects {
        id
        name
        # ...
      }
    }
  `;
  return twentyClient.request(query);
}
```

## 参考

- Twenty CRM GraphQL API 文档
- GraphQL Client 文档：https://github.com/jasonkuhrt/graphql-request

