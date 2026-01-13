/**
 * Customer Product Interaction History Page
 * 
 * Page for displaying customer-product interaction history
 * All custom code is proprietary and not open source.
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout';
import { CustomerProductInteractionHistory } from './components/CustomerProductInteractionHistory';
import { useAuth } from '../auth/AuthContext';
import { productsService } from '../products/products.service';

export const CustomerProductInteractionHistoryPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const { token } = useAuth();

  // 获取客户信息
  const {
    data: customerData,
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('客户ID不能为空');
      // Use relative path /api to leverage Vite proxy in development
      // In production, set VITE_API_BASE_URL to the full backend URL
      const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                        (import.meta.env?.VITE_BACKEND_URL as string) || 
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

  if (!customerId || !productId) {
    return (
      <MainLayout title="客户与产品互动历史">
        <div className="p-monday-4">
          <p className="text-monday-sm text-primary-red">缺少必要参数</p>
        </div>
      </MainLayout>
    );
  }

  if (customerLoading || productLoading) {
    return (
      <MainLayout title="客户与产品互动历史">
        <div className="p-monday-4">
          <div className="flex items-center justify-center py-monday-8">
            <span className="animate-spin">⏳</span>
            <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Handle errors
  if (customerError || productError) {
    return (
      <MainLayout title="客户与产品互动历史">
        <div className="p-monday-4">
          <div className="text-center py-monday-8">
            <p className="text-monday-sm text-primary-red mb-monday-2">
              {customerError instanceof Error
                ? customerError.message
                : productError instanceof Error
                  ? productError.message
                  : '加载失败'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="客户与产品互动历史">
      <div className="p-monday-4">
        <h1 className="text-monday-xl font-bold text-monday-text mb-monday-4">
          客户与产品互动历史
        </h1>
        {customerData && productData && (
          <p className="text-monday-base text-monday-text-secondary mb-monday-6">
            客户：{customerData.name} | 产品：{productData.name}
          </p>
        )}
        <CustomerProductInteractionHistory customerId={customerId} productId={productId} />
      </div>
    </MainLayout>
  );
};

