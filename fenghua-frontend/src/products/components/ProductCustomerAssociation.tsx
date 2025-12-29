/**
 * Product Customer Association Component
 * 
 * Displays product-customer associations with role-based filtering
 * All custom code is proprietary and not open source.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isFrontendSpecialist, isBackendSpecialist } from '../../common/constants/roles';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Product } from '../products.service';

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

/**
 * Customer Card Sub-component
 */
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
            <span
              className={`px-monday-2 py-monday-0.5 rounded-full text-monday-xs font-semibold ${
                customer.customerType === 'BUYER'
                  ? 'bg-primary-blue/10 text-primary-blue'
                  : 'bg-primary-purple/10 text-primary-purple'
              }`}
            >
              {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
            </span>
            <span className="text-monday-xs text-monday-text-secondary">
              {customer.interactionCount} 次互动
            </span>
          </div>
        </div>
        <div className="ml-monday-4 flex gap-monday-2">
          <Link to={`/products/${productId}/interactions?customerId=${customer.id}`}>
            <Button size="sm" variant="secondary" className="text-monday-xs">
              查看互动历史
            </Button>
          </Link>
          <Link to={`/products/${productId}/business-process?customerId=${customer.id}`}>
            <Button size="sm" variant="secondary" className="text-monday-xs">
              查看业务流程
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

/**
 * Main Component
 */
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
  const { data, isLoading, error, refetch } = useQuery<{
    customers: CustomerAssociation[];
    total: number;
  }>({
    queryKey: ['product-customers', productId, page, limit],
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3006';
      const response = await fetch(
        `${apiBaseUrl}/api/products/${productId}/customers?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('您没有权限查看客户信息');
        }
        if (response.status === 404) {
          throw new Error('产品不存在');
        }
        throw new Error('获取客户列表失败');
      }
      return response.json();
    },
    enabled: !!productId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // 按客户类型分组（总监/管理员）
  type GroupedCustomers =
    | { all: CustomerAssociation[] }
    | { buyers: CustomerAssociation[]; suppliers: CustomerAssociation[] }
    | null;

  const groupedCustomers = useMemo<GroupedCustomers>(() => {
    if (!data?.customers) return null;
    if (isFrontendSpecialist(user?.role) || isBackendSpecialist(user?.role)) {
      return { all: data.customers };
    }
    return {
      buyers: data.customers.filter((c) => c.customerType === 'BUYER'),
      suppliers: data.customers.filter((c) => c.customerType === 'SUPPLIER'),
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
          <p className="text-monday-sm text-primary-red mb-monday-2">
            {error instanceof Error ? error.message : '加载失败'}
          </p>
          <Button size="sm" onClick={() => refetch()}>
            重试
          </Button>
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
      {!isFrontendSpecialist(user?.role) &&
        !isBackendSpecialist(user?.role) &&
        groupedCustomers &&
        'buyers' in groupedCustomers &&
        (groupedCustomers.buyers || groupedCustomers.suppliers) ? (
        <div className="space-y-monday-6">
          {groupedCustomers.buyers && groupedCustomers.buyers.length > 0 && (
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
          {groupedCustomers.suppliers && groupedCustomers.suppliers.length > 0 && (
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
          <span className="text-monday-sm text-monday-text-secondary">共 {data.total} 个客户</span>
          <div className="flex gap-monday-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setPage((p) => p + 1)}
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

