/**
 * Product Business Process Page
 * 
 * Page component for viewing product-customer business process
 * All custom code is proprietary and not open source.
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout';
import { ProductBusinessProcess } from './components/ProductBusinessProcess';
import { useAuth } from '../auth/AuthContext';
import { productsService } from './products.service';
import { Card } from '../components/ui/Card';

export const ProductBusinessProcessPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId');
  const { token } = useAuth();

  // 获取产品信息
  const {
    data: productData,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) throw new Error('产品ID不能为空');
      return await productsService.getProduct(productId);
    },
    enabled: !!productId && !!token,
  });

  // 获取客户信息
  const {
    data: customerData,
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('客户ID不能为空');
      const apiBaseUrl =
        import.meta.env?.VITE_API_BASE_URL ||
        import.meta.env?.VITE_BACKEND_URL ||
        '/api';
      const response = await fetch(`${apiBaseUrl}/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('客户不存在');
        }
        throw new Error('获取客户信息失败');
      }
      return response.json();
    },
    enabled: !!customerId && !!token,
  });

  if (!productId || !customerId) {
    return (
      <MainLayout>
        <div className="p-monday-4">
          <p className="text-monday-sm text-primary-red">缺少必要参数</p>
        </div>
      </MainLayout>
    );
  }

  // 错误处理
  if (productError || customerError) {
    return (
      <MainLayout>
        <Card variant="outlined" className="p-monday-4">
          <div className="text-center py-monday-8">
            <p className="text-monday-sm text-primary-red mb-monday-2">
              {productError instanceof Error
                ? productError.message
                : customerError instanceof Error
                  ? customerError.message
                  : '加载失败'}
            </p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (productLoading || customerLoading) {
    return (
      <MainLayout>
        <Card variant="outlined" className="p-monday-4">
          <div className="flex items-center justify-center py-monday-8">
            <span className="animate-spin">⏳</span>
            <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-monday-4">
        <h1 className="text-monday-xl font-bold text-monday-text mb-monday-4">
          产品业务流程
        </h1>
        {productData && customerData && (
          <p className="text-monday-base text-monday-text-secondary mb-monday-6">
            产品：{productData.name} | 客户：{customerData.name}
          </p>
        )}
        <ProductBusinessProcess productId={productId} customerId={customerId} />
      </div>
    </MainLayout>
  );
};

