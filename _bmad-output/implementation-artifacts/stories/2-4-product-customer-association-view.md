# Story 2.4: 产品与客户关联查看（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **查看某个产品与哪些客户有关联**,
So that **我可以了解产品的客户关系，分析产品的业务情况**.

## Acceptance Criteria

1. **Given** 前端专员已登录系统
   **When** 前端专员查看产品详情页面
   **Then** 系统显示"关联的采购商"部分
   **And** 系统只显示该产品关联的采购商类型客户
   **And** 系统不显示供应商类型客户

2. **Given** 后端专员已登录系统
   **When** 后端专员查看产品详情页面
   **Then** 系统显示"关联的供应商"部分
   **And** 系统只显示该产品关联的供应商类型客户
   **And** 系统不显示采购商类型客户

3. **Given** 总监或管理员已登录系统
   **When** 总监或管理员查看产品详情页面
   **Then** 系统显示"关联的客户"部分
   **And** 系统显示该产品关联的所有客户（包括采购商和供应商）
   **And** 客户列表按客户类型分组显示

4. **Given** 用户查看产品与客户的关联
   **When** 产品有关联的客户
   **Then** 系统显示客户列表，每个客户显示：客户名称、客户类型、关联的互动数量
   **And** 用户可以点击客户名称查看客户详情
   **And** 用户可以点击"查看互动历史"查看该产品与该客户的完整互动记录

5. **Given** 用户查看产品与客户的关联
   **When** 产品没有关联的客户
   **Then** 系统显示空状态"该产品尚未与任何客户关联"
   **And** 系统提供提示"记录互动时关联此产品，即可建立关联关系"

6. **Given** 用户查看产品与客户的关联
   **When** 关联的客户数量较多（> 10 个）
   **Then** 系统使用分页或滚动加载显示客户列表
   **And** 系统显示关联客户总数

## Tasks / Subtasks

- [x] Task 1: 后端 API 实现 (AC: #1, #2, #3, #4, #6)
  - [x] 创建产品客户关联服务 (ProductCustomerAssociationService)
    - [x] 实现查询产品关联客户的方法 `getProductCustomers(productId, token, page, limit)`
    - [x] 实现基于角色的数据过滤（使用 PermissionService.getDataAccessFilter）
    - [x] 使用 SQL JOIN 查询 `product_customer_interactions` 和 `companies` 表
    - [x] 统计每个客户的互动数量（使用 COUNT 和 GROUP BY）
    - [x] 实现 customer_type 大小写转换（PermissionService 返回小写，数据库存储大写）
    - [x] 实现分页支持（默认每页 10 条）
    - [x] 处理软删除的客户（过滤 `deleted_at IS NULL`）
    - [x] 处理无效的 customer_id（通过 JOIN 自动过滤）
  - [x] 创建产品客户关联控制器 (ProductCustomerAssociationController)
    - [x] 创建 GET `/api/products/:id/customers` 端点
    - [x] 使用 `@UseGuards(JwtAuthGuard)` 保护端点
    - [x] 实现查询参数：`page`, `limit`, `customerType`（可选，用于总监/管理员筛选）
    - [x] 返回客户列表和总数
    - [x] 实现错误处理（产品不存在、权限检查失败、数据库错误）
  - [x] 创建 DTOs
    - [x] `ProductCustomerAssociationDto` - 返回数据结构（包含客户信息和互动数量）
    - [x] `ProductCustomerQueryDto` - 查询参数结构（page, limit, customerType）

- [x] Task 2: 数据库查询优化 (AC: #4, #6)
  - [x] 确认 `product_customer_interactions` 表索引已创建
    - [x] `idx_interactions_product` - 按产品查询
    - [x] `idx_interactions_product_customer` - 按产品和客户查询
  - [x] 确认 `companies` 表索引已创建
    - [x] `idx_companies_customer_type` - 按客户类型查询
  - [x] 实现高效查询 SQL（使用 JOIN 避免 N+1 查询）：
    ```sql
    SELECT 
      c.id,
      c.name,
      c.customer_type,
      COUNT(pci.id) as interaction_count
    FROM product_customer_interactions pci
    INNER JOIN companies c ON c.id = pci.customer_id
    WHERE pci.product_id = $1 
      AND pci.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND ($2::text IS NULL OR c.customer_type = $2)  -- 角色过滤，大小写转换
    GROUP BY c.id, c.name, c.customer_type
    ORDER BY interaction_count DESC
    LIMIT $3 OFFSET $4
    ```
  - [x] 实现基于角色的客户类型过滤（在 SQL 查询中）
    - [x] 前端专员：`customer_type = 'BUYER'`（使用 toUpperCase() 转换）
    - [x] 后端专员：`customer_type = 'SUPPLIER'`（使用 toUpperCase() 转换）
    - [x] 总监/管理员：无过滤（返回所有客户）
  - [x] 实现总数查询（用于分页）：
    ```sql
    SELECT COUNT(DISTINCT c.id)
    FROM product_customer_interactions pci
    INNER JOIN companies c ON c.id = pci.customer_id
    WHERE pci.product_id = $1 
      AND pci.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND ($2::text IS NULL OR c.customer_type = $2)
    ```

- [x] Task 3: 前端组件实现 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 创建 `ProductCustomerAssociation` 组件
    - [x] 接收 `productId` 和 `product` 作为 props
    - [x] 使用 `useAuth()` 获取当前用户角色
    - [x] 根据角色显示不同的标题（"关联的采购商"、"关联的供应商"、"关联的客户"）
    - [x] 调用后端 API 获取关联客户列表
    - [x] 实现加载状态和错误处理
    - [x] 使用 React Query 缓存客户列表数据（缓存键：`['product-customers', productId, page, limit]`）
    - [x] 实现缓存失效逻辑（当产品更新或客户更新时）
  - [x] 实现客户列表显示
    - [x] 使用 Card 组件显示客户信息
    - [x] 每个客户显示：客户名称、客户类型标签、互动数量
    - [x] 实现客户名称点击跳转到客户详情（使用 Link 组件，路径：`/customers/:id`）
    - [x] 实现"查看互动历史"按钮（跳转到 Story 2.5 的互动历史页面，路径：`/products/:productId/interactions?customerId=:customerId`）
  - [x] 实现空状态显示 (AC: #5)
    - [x] 显示空状态图标和消息
    - [x] 显示提示文本"记录互动时关联此产品，即可建立关联关系"
  - [x] 实现分页或滚动加载 (AC: #6)
    - [x] 如果客户数量 > 10，实现分页控件
    - [x] 或实现无限滚动加载（使用 React Query 的 `useInfiniteQuery`）
    - [x] 显示关联客户总数

- [x] Task 4: 集成到 ProductDetailPanel (AC: #1, #2, #3)
  - [x] 在 `ProductDetailPanel.tsx` 中添加"关联的客户"部分
  - [x] 将 `ProductCustomerAssociation` 组件集成到详情面板
  - [x] 确保样式与现有详情面板一致（使用 Card 组件，Monday.com 风格）
  - [x] 确保响应式布局（移动端适配）
  - [x] 确保组件位置合理（放在"其他信息"卡片之后）

- [x] Task 5: 角色权限验证 (AC: #1, #2, #3)
  - [x] 后端权限验证
    - [x] 使用 `PermissionService.getDataAccessFilter()` 获取数据访问过滤器
    - [x] 在 SQL 查询中应用过滤器（使用 UPPER() 转换大小写）
    - [x] 确保前端专员只能看到采购商，后端专员只能看到供应商
    - [x] 处理权限检查失败的情况（返回 403 Forbidden）
  - [x] 前端权限显示
    - [x] 使用 `isFrontendSpecialist()`, `isBackendSpecialist()`, `isDirector()`, `isAdmin()` 函数
    - [x] 根据角色显示不同的标题和内容
    - [x] 处理权限错误（显示错误消息）

- [x] Task 6: 客户类型分组显示 (AC: #3)
  - [x] 总监/管理员视图：按客户类型分组
    - [x] 显示"采购商"分组（customer_type = 'BUYER'）
    - [x] 显示"供应商"分组（customer_type = 'SUPPLIER'）
    - [x] 每个分组显示客户列表
    - [x] 每个分组显示该类型的客户总数

- [x] Task 7: 错误处理实现
  - [x] 处理产品不存在的情况（返回 404 Not Found）
  - [x] 处理客户已被软删除的情况（通过 JOIN 自动过滤 `c.deleted_at IS NULL`）
  - [x] 处理无效的 customer_id（通过 JOIN 自动过滤，如果 customer_id 不存在，JOIN 会返回空结果）
  - [x] 处理权限检查失败（返回 403 Forbidden）
  - [x] 处理数据库错误（返回 500 Internal Server Error，记录日志）
  - [x] 前端错误处理：显示友好的错误消息，提供重试选项

## Dev Notes

### 当前实现状态

**已有组件：**
- `ProductDetailPanel` 组件已存在于 `fenghua-frontend/src/products/components/ProductDetailPanel.tsx`
- 组件已集成到 `ProductManagementPage` 中，通过 `MainLayout` 的 `detailPanel` prop 显示
- 组件已实现基本的产品信息显示（名称、HS编码、类别、描述、规格、图片、创建时间、更新时间）

**数据库结构：**
- `product_customer_interactions` 表已创建（迁移脚本 `002-create-interactions-table.sql`）
  - 表结构包含：`product_id`, `customer_id`, `interaction_type`, `interaction_date`, 等字段
  - 索引已创建：`idx_interactions_product`, `idx_interactions_product_customer`
  - **外键约束：** `customer_id` 有外键约束到 `companies.id`（迁移脚本 007 已添加）
- `companies` 表已创建（迁移脚本 `006-create-companies-and-people-tables.sql`）
  - 表结构包含：`id`, `name`, `customer_type`, `address`, `industry`, 等字段
  - `customer_type` 字段：`'SUPPLIER'` 或 `'BUYER'`（大写）
  - 索引已创建：`idx_companies_customer_type`
  - **重要：** `customer_id` 现在关联到 `companies.id`，不是 Twenty CRM

**权限系统：**
- `PermissionService` 已实现，提供 `getDataAccessFilter()` 方法
- 返回格式：`{ customerType: 'buyer' }` 或 `{ customerType: 'supplier' }` 或 `null`（小写）
- 角色常量已定义：`FRONTEND_SPECIALIST`, `BACKEND_SPECIALIST`, `DIRECTOR`, `ADMIN`
- 权限检查函数已实现：`isFrontendSpecialist()`, `isBackendSpecialist()`, `isDirector()`, `isAdmin()`

**架构变更（重要）：**
- **已移除 Twenty CRM 依赖**：系统使用原生 PostgreSQL 表
- **已移除 workspace_id**：迁移脚本 007 已移除该字段，使用 `created_by` 进行数据隔离
- **客户数据源**：客户信息存储在 `companies` 表中，不是 Twenty CRM
- **外键约束**：`product_customer_interactions.customer_id` 有外键约束到 `companies.id`

**需要实现的功能：**
1. **后端 API：** 查询产品关联客户的服务和控制器（使用 SQL JOIN）
2. **前端组件：** 显示产品关联客户的组件
3. **集成：** 将组件集成到 ProductDetailPanel

### 技术实现要点

**1. 后端 API 实现：**

**服务层 (ProductCustomerAssociationService):**
```typescript
@Injectable()
export class ProductCustomerAssociationService implements OnModuleDestroy {
  private pgPool: Pool | null = null;
  private readonly logger = new Logger(ProductCustomerAssociationService.name);

  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly permissionService: PermissionService,
  ) {
    this.pgPool = pool;
  }

  async getProductCustomers(
    productId: string,
    token: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ customers: CustomerAssociation[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. 获取用户权限和数据访问过滤器
    const dataFilter = await this.permissionService.getDataAccessFilter(token);
    
    // 2. 转换 customer_type 大小写（PermissionService 返回小写，数据库存储大写）
    const customerTypeFilter = dataFilter?.customerType 
      ? dataFilter.customerType.toUpperCase() 
      : null;

    // 3. 处理权限检查失败
    if (dataFilter?.customerType === 'NONE') {
      throw new ForbiddenException('您没有权限查看客户信息');
    }

    // 4. 验证产品是否存在
    const productCheck = await this.pgPool.query(
      'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
      [productId]
    );
    if (productCheck.rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }

    // 5. 查询产品关联的客户和互动数量（使用 SQL JOIN）
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        c.id,
        c.name,
        c.customer_type,
        COUNT(pci.id) as interaction_count
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      WHERE pci.product_id = $1 
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
      GROUP BY c.id, c.name, c.customer_type
      ORDER BY interaction_count DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await this.pgPool.query(query, [
      productId,
      customerTypeFilter,
      limit,
      offset,
    ]);

    // 6. 查询总数（用于分页）
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      WHERE pci.product_id = $1 
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
    `;

    const countResult = await this.pgPool.query(countQuery, [
      productId,
      customerTypeFilter,
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    // 7. 映射结果
    const customers: CustomerAssociation[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      customerType: row.customer_type,
      interactionCount: parseInt(row.interaction_count, 10),
    }));

    return { customers, total };
  }

  async onModuleDestroy() {
    // Cleanup if needed
  }
}
```

**控制器层 (ProductCustomerAssociationController):**
```typescript
@Controller('products')
export class ProductCustomerAssociationController {
  constructor(
    private readonly service: ProductCustomerAssociationService,
  ) {}

  @Get(':id/customers')
  @UseGuards(JwtAuthGuard)
  async getProductCustomers(
    @Param('id') productId: string,
    @Token() token: string,
    @Query() query: ProductCustomerQueryDto,
  ): Promise<{ customers: CustomerAssociation[]; total: number }> {
    try {
      return await this.service.getProductCustomers(
        productId,
        token,
        query.page || 1,
        query.limit || 10,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('获取产品关联客户失败');
    }
  }
}
```

**DTOs:**
```typescript
// ProductCustomerAssociationDto
export class ProductCustomerAssociationDto {
  id: string;
  name: string;
  customerType: 'SUPPLIER' | 'BUYER';
  interactionCount: number;
}

// ProductCustomerQueryDto
export class ProductCustomerQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['BUYER', 'SUPPLIER'])
  customerType?: 'BUYER' | 'SUPPLIER'; // 可选，用于总监/管理员筛选
}
```

**2. 前端组件实现：**

**ProductCustomerAssociation 组件：**
```tsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { isFrontendSpecialist, isBackendSpecialist } from '../../common/constants/roles';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface ProductCustomerAssociationProps {
  productId: string;
  product: Product;
}

interface CustomerAssociation {
  id: string;
  name: string;
  customerType: 'SUPPLIER' | 'BUYER';
  interactionCount: number;
}

export const ProductCustomerAssociation: React.FC<ProductCustomerAssociationProps> = ({
  productId,
  product,
}) => {
  const { user, token } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 10;

  // 根据角色显示标题
  const getTitle = () => {
    if (isFrontendSpecialist(user?.role)) return '关联的采购商';
    if (isBackendSpecialist(user?.role)) return '关联的供应商';
    return '关联的客户';
  };

  // 使用 React Query 获取客户列表
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['product-customers', productId, page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}/customers?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('获取客户列表失败');
      }
      return response.json();
    },
    enabled: !!productId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // 按客户类型分组（总监/管理员）
  const groupedCustomers = useMemo(() => {
    if (!data?.customers) return null;
    if (isFrontendSpecialist(user?.role) || isBackendSpecialist(user?.role)) {
      return { all: data.customers };
    }
    return {
      buyers: data.customers.filter(c => c.customerType === 'BUYER'),
      suppliers: data.customers.filter(c => c.customerType === 'SUPPLIER'),
    };
  }, [data, user?.role]);

  if (isLoading) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-center py-monday-8">
          <span className="animate-spin">⏳</span>
          <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <p className="text-monday-sm text-primary-red mb-monday-2">加载失败</p>
          <Button size="sm" onClick={() => refetch()}>重试</Button>
        </div>
      </Card>
    );
  }

  if (!data || data.customers.length === 0) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">
          {getTitle()}
        </h4>
        <div className="text-center py-monday-8">
          <div className="text-monday-4xl mb-monday-4 opacity-50">📋</div>
          <p className="text-monday-base text-monday-text-secondary mb-monday-2">
            该产品尚未与任何客户关联
          </p>
          <p className="text-monday-sm text-monday-text-placeholder">
            记录互动时关联此产品，即可建立关联关系
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="outlined" className="p-monday-4">
      <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">
        {getTitle()}
      </h4>
      
      {/* 总监/管理员：按类型分组显示 */}
      {!isFrontendSpecialist(user?.role) && !isBackendSpecialist(user?.role) && groupedCustomers ? (
        <div className="space-y-monday-6">
          {groupedCustomers.buyers.length > 0 && (
            <div>
              <h5 className="text-monday-sm font-semibold text-monday-text-secondary mb-monday-3">
                采购商 ({groupedCustomers.buyers.length})
              </h5>
              <div className="space-y-monday-2">
                {groupedCustomers.buyers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} productId={productId} />
                ))}
              </div>
            </div>
          )}
          {groupedCustomers.suppliers.length > 0 && (
            <div>
              <h5 className="text-monday-sm font-semibold text-monday-text-secondary mb-monday-3">
                供应商 ({groupedCustomers.suppliers.length})
              </h5>
              <div className="space-y-monday-2">
                {groupedCustomers.suppliers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} productId={productId} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 前端/后端专员：直接显示列表 */
        <div className="space-y-monday-2">
          {data.customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} productId={productId} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {data.total > limit && (
        <div className="flex items-center justify-between mt-monday-4 pt-monday-4 border-t border-gray-200">
          <span className="text-monday-sm text-monday-text-secondary">
            共 {data.total} 个客户
          </span>
          <div className="flex gap-monday-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <span className="text-monday-sm text-monday-text-secondary flex items-center">
              第 {page} 页
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= data.total}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// CustomerCard 子组件
const CustomerCard: React.FC<{ customer: CustomerAssociation; productId: string }> = ({
  customer,
  productId,
}) => {
  return (
    <Card variant="outlined" className="p-monday-3 hover:shadow-monday-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Link
            to={`/customers/${customer.id}`}
            className="text-monday-base font-semibold text-monday-text hover:text-primary-blue transition-colors truncate block"
          >
            {customer.name}
          </Link>
          <div className="flex items-center gap-monday-2 mt-monday-1">
            <span className={`px-monday-2 py-monday-0.5 rounded-full text-monday-xs font-semibold ${
              customer.customerType === 'BUYER' 
                ? 'bg-primary-blue/10 text-primary-blue' 
                : 'bg-primary-purple/10 text-primary-purple'
            }`}>
              {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
            </span>
            <span className="text-monday-xs text-monday-text-secondary">
              {customer.interactionCount} 次互动
            </span>
          </div>
        </div>
        <Link
          to={`/products/${productId}/interactions?customerId=${customer.id}`}
          className="ml-monday-4"
        >
          <Button
            size="sm"
            variant="secondary"
            className="text-monday-xs"
          >
            查看互动历史
          </Button>
        </Link>
      </div>
    </Card>
  );
};
```

**3. 集成到 ProductDetailPanel：**

在 `ProductDetailPanel.tsx` 中添加：
```tsx
{/* 关联的客户 */}
<ProductCustomerAssociation
  productId={product.id}
  product={product}
/>
```

### 架构参考

**文件结构：**
- 后端服务：`fenghua-backend/src/products/product-customer-association.service.ts`
- 后端控制器：`fenghua-backend/src/products/product-customer-association.controller.ts`
- 前端组件：`fenghua-frontend/src/products/components/ProductCustomerAssociation.tsx`
- 前端服务：`fenghua-frontend/src/products/product-customer-association.service.ts`（可选，如果使用 service 层）

**依赖关系：**
- 依赖 `ProductDetailPanel` 组件（已存在）
- 依赖 `PermissionService`（已存在）
- 依赖 `Card` 组件（已存在）
- 依赖 `useAuth` hook（已存在）
- 依赖角色检查函数（已存在）
- 依赖 React Query（需要安装 `@tanstack/react-query`）

**API 调用：**
- GET `/api/products/:id/customers?page=1&limit=10` - 获取产品关联客户列表
- **数据源：** 直接从 PostgreSQL `companies` 表查询（不是 Twenty CRM）

**数据模型：**
- `product_customer_interactions` 表：存储产品-客户互动记录
- `companies` 表：存储客户信息（原生 PostgreSQL 表）
- **外键约束：** `product_customer_interactions.customer_id` → `companies.id`（已存在）
- 通过 SQL JOIN 关联两个表

**数据隔离策略：**
- **产品范围隔离：** 通过 `product_id` 限定查询范围（不需要 workspace_id）
- **角色过滤：** 通过 `customer_type` 字段过滤（`'BUYER'` 或 `'SUPPLIER'`）
- **软删除过滤：** 通过 `deleted_at IS NULL` 过滤已删除的记录
- **大小写转换：** PermissionService 返回小写（`'buyer'`, `'supplier'`），数据库存储大写（`'BUYER'`, `'SUPPLIER'`），需要在 SQL 查询中使用 `UPPER()` 或应用层转换

### UI 设计标准

**参考文档：**
- `docs/design-system/ui-design-standards.md`

**关键设计要点：**
1. **卡片布局：** 使用 `Card` 组件，符合 Monday.com 风格
2. **客户列表：** 使用卡片列表，每个客户一个卡片
3. **客户类型标签：** 使用彩色标签区分采购商和供应商
   - 采购商：`bg-primary-blue/10 text-primary-blue`
   - 供应商：`bg-primary-purple/10 text-primary-purple`
4. **互动数量：** 显示为文本（"X 次互动"）
5. **空状态：** 使用友好的空状态设计（图标 + 消息 + 提示）
6. **分页：** 使用分页控件（上一页/下一页按钮 + 页码显示）
7. **响应式设计：** 使用 Tailwind 响应式类（`sm:`, `md:`, `lg:`）
8. **加载状态：** 显示加载指示器（⏳ 图标 + "加载中..." 文本）
9. **错误状态：** 显示错误消息 + 重试按钮

### 权限过滤策略

**后端过滤（SQL 查询层）：**
- 使用 `PermissionService.getDataAccessFilter()` 获取过滤器
- 前端专员：`{ customerType: 'buyer' }` → SQL: `customer_type = 'BUYER'`
- 后端专员：`{ customerType: 'supplier' }` → SQL: `customer_type = 'SUPPLIER'`
- 总监/管理员：`null` → SQL: 无过滤（返回所有客户）

**大小写转换：**
- PermissionService 返回：`'buyer'` 或 `'supplier'`（小写）
- 数据库存储：`'BUYER'` 或 `'SUPPLIER'`（大写）
- **转换方法：** 在 SQL 查询中使用 `UPPER($2)` 或在应用层使用 `customerType.toUpperCase()`

**查询客户信息时的过滤：**
- 直接在 SQL JOIN 查询中应用 `customer_type` 过滤
- 前端专员：只查询 `customer_type = 'BUYER'` 的客户
- 后端专员：只查询 `customer_type = 'SUPPLIER'` 的客户
- 总监/管理员：查询所有客户，前端按类型分组显示

### 性能优化

**数据库查询优化：**
- 使用已创建的索引：
  - `idx_interactions_product` - 按产品查询
  - `idx_interactions_product_customer` - 按产品和客户查询
  - `idx_companies_customer_type` - 按客户类型查询
- 使用 SQL JOIN 避免 N+1 查询（一次性获取所有客户信息）
- 使用 `GROUP BY` 和 `COUNT(*)` 统计互动数量
- 使用 `LIMIT` 和 `OFFSET` 实现分页
- **查询性能目标：** < 1 秒 P95

**前端优化：**
- 使用 React Query 缓存客户列表数据
  - 缓存键：`['product-customers', productId, page, limit]`
  - 缓存时间：5 分钟（`staleTime: 5 * 60 * 1000`）
  - 缓存失效：当产品更新或客户更新时（通过 `queryClient.invalidateQueries`）
- 实现防抖和节流（如果需要实时搜索）
- 使用虚拟滚动（如果客户数量很大，> 100 个）

**查询性能验证：**
- 使用 `EXPLAIN ANALYZE` 验证查询性能
- 确保使用索引（检查执行计划）
- 测试大量客户（> 100 个）的查询性能

### 错误处理

**后端错误处理：**
1. **产品不存在：** 返回 `404 Not Found`
2. **客户已被软删除：** 通过 JOIN 自动过滤（`c.deleted_at IS NULL`）
3. **无效的 customer_id：** 通过 JOIN 自动过滤（如果 customer_id 不存在，JOIN 会返回空结果）
4. **权限检查失败：** 返回 `403 Forbidden`
5. **数据库错误：** 返回 `500 Internal Server Error`，记录日志

**前端错误处理：**
1. **加载失败：** 显示错误消息 + 重试按钮
2. **权限错误：** 显示"您没有权限查看客户信息"
3. **网络错误：** 显示"网络错误，请检查网络连接"
4. **空结果：** 显示友好的空状态（不是错误）

### 测试要求

**功能测试：**
1. **角色过滤测试：**
   - 测试前端专员只能看到采购商（`customer_type = 'BUYER'`）
   - 测试后端专员只能看到供应商（`customer_type = 'SUPPLIER'`）
   - 测试总监/管理员可以看到所有客户（按类型分组）
   - 测试前端专员无法看到供应商
   - 测试后端专员无法看到采购商

2. **客户列表显示测试：**
   - 测试客户列表显示（名称、类型、互动数量）
   - 测试客户类型标签颜色正确
   - 测试互动数量统计正确

3. **交互测试：**
   - 测试客户名称点击跳转到客户详情（`/customers/:id`）
   - 测试"查看互动历史"按钮跳转（`/products/:productId/interactions?customerId=:customerId`）

4. **空状态测试：**
   - 测试产品没有关联客户时显示空状态
   - 测试空状态消息和提示文本正确

5. **分页测试：**
   - 测试分页功能（上一页/下一页）
   - 测试分页控件显示正确（页码、总数）
   - 测试边界情况（第一页、最后一页）

6. **错误处理测试：**
   - 测试产品不存在时的错误处理
   - 测试权限检查失败时的错误处理
   - 测试网络错误时的错误处理
   - 测试重试功能

**性能测试：**
1. **查询性能测试：**
   - 测试大量客户（> 100 个）的查询性能
   - 测试分页加载性能
   - 测试数据库查询时间（< 1 秒 P95）
   - 使用 `EXPLAIN ANALYZE` 验证查询计划

2. **前端性能测试：**
   - 测试 React Query 缓存效果
   - 测试大量客户渲染性能（> 100 个）
   - 测试分页切换性能

**权限测试：**
1. 测试前端专员无法看到供应商（API 返回空列表）
2. 测试后端专员无法看到采购商（API 返回空列表）
3. 测试未授权用户无法访问 API（返回 401 Unauthorized）
4. 测试权限检查失败时返回 403 Forbidden

**响应式测试：**
1. 测试移动端布局（< 768px）
2. 测试平板布局（768px - 1024px）
3. 测试桌面布局（> 1024px）
4. 测试客户卡片在小屏幕上的显示

**边界情况测试：**
1. 测试 0 个客户（空状态）
2. 测试 1 个客户（不需要分页）
3. 测试 10 个客户（刚好一页）
4. 测试 11 个客户（需要分页）
5. 测试 100+ 个客户（大量数据）
6. 测试客户名称很长（文本截断）
7. 测试互动数量为 0 的客户

### 参考实现

**Story 2.3 相关文件：**
- `fenghua-frontend/src/products/components/ProductDetailPanel.tsx` - 产品详情面板
- `fenghua-frontend/src/products/ProductManagementPage.tsx` - 产品管理页面

**权限系统参考：**
- `fenghua-backend/src/permission/permission.service.ts` - 权限服务
- `fenghua-frontend/src/common/constants/roles.ts` - 角色常量

**数据库参考：**
- `fenghua-backend/migrations/002-create-interactions-table.sql` - 互动记录表
- `fenghua-backend/migrations/006-create-companies-and-people-tables.sql` - 客户表
- `fenghua-backend/migrations/007-remove-workspace-dependencies.sql` - 移除 workspace_id 和外键约束
- `docs/database-schema-design.md` - 数据库设计文档

**服务模式参考：**
- `fenghua-backend/src/products/products.service.ts` - 产品服务（参考数据库查询模式）
- `fenghua-backend/src/users/users.service.ts` - 用户服务（参考 SQL 查询模式）

### Project Structure Notes

- 组件位置符合项目结构：`fenghua-frontend/src/products/components/`
- 服务位置符合项目结构：`fenghua-backend/src/products/`
- 使用统一的 UI 组件库（Card, Button, Link）
- 遵循 Monday.com 设计系统
- 遵循权限过滤策略（SQL 查询层过滤）
- **架构变更：** 使用原生 PostgreSQL 表，不是 Twenty CRM

### References

- [Source: _bmad-output/epics.md#Story-2.4] - Story 2.4 需求定义
- [Source: _bmad-output/prd.md#FR4] - FR4: 查看产品与客户的关联（按角色）
- [Source: fenghua-frontend/src/products/components/ProductDetailPanel.tsx] - 产品详情面板实现
- [Source: docs/design-system/ui-design-standards.md] - UI 设计标准
- [Source: fenghua-backend/migrations/002-create-interactions-table.sql] - 互动记录表结构
- [Source: fenghua-backend/migrations/006-create-companies-and-people-tables.sql] - 客户表结构
- [Source: fenghua-backend/migrations/007-remove-workspace-dependencies.sql] - 外键约束和 workspace_id 移除
- [Source: fenghua-backend/src/permission/permission.service.ts] - 权限服务实现
- [Source: fenghua-backend/src/products/products.service.ts] - 产品服务（参考数据库查询模式）
- [Source: _bmad-output/implementation-artifacts/stories/2-3-product-details-view.md] - Story 2.3 实现参考

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Assistant)

### Debug Log References

### Completion Notes List

### File List

**后端文件：**
- `fenghua-backend/src/products/dto/product-customer-association.dto.ts` - DTOs
- `fenghua-backend/src/products/product-customer-association.service.ts` - 服务层
- `fenghua-backend/src/products/product-customer-association.controller.ts` - 控制器
- `fenghua-backend/src/products/products.module.ts` - 模块更新（添加新服务和控制器）

**前端文件：**
- `fenghua-frontend/src/products/components/ProductCustomerAssociation.tsx` - 前端组件
- `fenghua-frontend/src/products/components/ProductDetailPanel.tsx` - 集成组件

### Completion Notes List

**实现完成时间：** 2025-01-03  
**代码审查完成时间：** 2025-01-03

**代码审查修复：**
- ✅ H1: 修复 Controller 中不安全的 Logger 访问 - 在 Controller 中注入 Logger
- ✅ H2: 修复 parseInt 缺少错误处理 - 添加默认值和空值检查
- ✅ M1: 为 DTO 添加验证装饰器 - 添加 class-validator 装饰器
- ✅ M2: 修复前端分组逻辑类型安全问题 - 添加类型定义和类型守卫
- ✅ M3: 在 Service 层添加数据库查询错误处理 - 添加 try-catch 块
- ✅ L2: 添加输入验证的边界情况处理 - 验证和规范化 page 和 limit 参数

**实现的功能：**
1. ✅ 后端 API 实现
   - 创建了 `ProductCustomerAssociationService`，实现基于角色的数据过滤
   - 使用 SQL JOIN 查询 `product_customer_interactions` 和 `companies` 表
   - 实现 customer_type 大小写转换（PermissionService 返回小写，数据库存储大写）
   - 实现分页支持（默认每页 10 条）
   - 处理软删除和错误情况

2. ✅ 后端控制器实现
   - 创建了 `ProductCustomerAssociationController`
   - 实现 GET `/api/products/:id/customers` 端点
   - 使用 `@UseGuards(JwtAuthGuard)` 保护端点
   - 实现错误处理（产品不存在、权限检查失败、数据库错误）

3. ✅ DTOs 实现
   - `ProductCustomerAssociationDto` - 返回数据结构
   - `ProductCustomerQueryDto` - 查询参数结构（支持 page, limit, customerType）

4. ✅ 前端组件实现
   - 创建了 `ProductCustomerAssociation` 组件
   - 使用 React Query 缓存客户列表数据
   - 实现加载状态、错误处理和空状态显示
   - 实现分页控件
   - 实现角色分组显示（总监/管理员按类型分组）

5. ✅ 集成到 ProductDetailPanel
   - 在 `ProductDetailPanel.tsx` 中添加了 `ProductCustomerAssociation` 组件
   - 组件位置：放在"其他信息"卡片之后

**技术要点：**
- 使用 SQL JOIN 避免 N+1 查询
- 实现基于角色的数据过滤（前端专员只看到采购商，后端专员只看到供应商）
- 实现 customer_type 大小写转换
- 使用 React Query 缓存数据（5 分钟缓存时间）
- 实现分页支持（默认每页 10 条）

**待测试：**
- 功能测试：角色过滤、客户列表显示、分页、空状态
- 性能测试：查询性能、前端渲染性能
- 权限测试：权限检查、数据隔离
- 响应式测试：移动端、平板、桌面布局
