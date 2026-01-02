/**
 * Customer Product Association Component
 * 
 * Displays customer-product associations with role-based filtering
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Customer } from '../customers.service';

interface CustomerProductAssociationProps {
  customerId: string;
  customer: Customer;
}

interface ProductAssociation {
  id: string;
  name: string;
  hsCode: string;
  interactionCount: number;
}

/**
 * Product Card Sub-component
 */
const ProductCard: React.FC<{ product: ProductAssociation; customerId: string }> = ({ product, customerId }) => {
  return (
    <Card variant="outlined" className="p-monday-3 hover:shadow-monday-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Link
            to={`/products/${product.id}`}
            className="text-monday-base font-semibold text-monday-text hover:text-primary-blue transition-colors truncate block"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-monday-2 mt-monday-1">
            <span className="text-monday-xs text-monday-text-secondary font-mono">
              HS: {product.hsCode}
            </span>
            <span className="text-monday-xs text-monday-text-secondary">
              {product.interactionCount} 次互动
            </span>
          </div>
        </div>
        <div className="ml-monday-4 flex gap-monday-2">
          <Link to={`/customers/${customerId}/interactions?productId=${product.id}`}>
            <Button 
              size="sm" 
              variant="secondary" 
              className="text-monday-xs"
            >
              查看互动历史
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
export const CustomerProductAssociation: React.FC<CustomerProductAssociationProps> = ({
  customerId,
  customer,
}) => {
  const { user, token } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 10;

  // 使用 React Query 获取产品列表
  const { data, isLoading, error, refetch } = useQuery<{
    products: ProductAssociation[];
    total: number;
  }>({
    queryKey: ['customer-products', customerId, page, limit],
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiBaseUrl}/customers/${customerId}/products?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('您没有权限查看产品信息');
        }
        if (response.status === 404) {
          throw new Error('客户不存在');
        }
        throw new Error('获取产品列表失败');
      }
      return response.json();
    },
    enabled: !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

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

  if (!data || data.products.length === 0) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">
          关联的产品
        </h4>
        <div className="text-center py-monday-8">
          <div className="text-monday-4xl mb-monday-4 opacity-50">📦</div>
          <p className="text-monday-base text-monday-text-secondary mb-monday-2">
            该客户尚未与任何产品关联
          </p>
          <p className="text-monday-sm text-monday-text-secondary">
            记录互动时关联产品，即可建立关联关系
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="outlined" className="p-monday-4">
      <div className="flex items-center justify-between mb-monday-3">
        <h4 className="text-monday-base font-semibold text-monday-text">
          关联的产品
        </h4>
        {data.total > 0 && (
          <span className="text-monday-sm text-monday-text-secondary">
            共 {data.total} 个产品
          </span>
        )}
      </div>

      {/* 产品列表 */}
      <div className="space-y-monday-2">
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} customerId={customerId} />
        ))}
      </div>

      {/* 分页 */}
      {data.total > limit && (
        <div className="flex items-center justify-between mt-monday-4 pt-monday-4 border-t border-gray-200">
          <span className="text-monday-sm text-monday-text-secondary">
            第 {page} 页，共 {Math.ceil(data.total / limit)} 页
          </span>
          <div className="flex gap-monday-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.min(Math.ceil(data.total / limit), p + 1))}
              disabled={page >= Math.ceil(data.total / limit)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

