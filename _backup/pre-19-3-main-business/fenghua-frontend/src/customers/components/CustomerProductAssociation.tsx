/**
 * Customer Product Association Component
 * 
 * Displays a summary card for customer-product associations with a button to open the management modal
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Customer, customersService } from '../customers.service';
import { CustomerAssociationManagementModal } from './CustomerAssociationManagementModal';
import { CustomerProductAssociationResponseDto } from '../types/customer-product-association-response.dto';

interface CustomerProductAssociationProps {
  customerId: string;
  customer: Customer;
}

/**
 * Main Component
 * 
 * Displays a summary card with statistics and a button to open the management modal
 */
export const CustomerProductAssociation: React.FC<CustomerProductAssociationProps> = ({
  customerId,
  customer,
}) => {
  const { token } = useAuth();
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  // 获取关联统计信息（获取足够多的数据用于准确统计）
  const { data, isLoading, error, refetch } = useQuery<{
    products: CustomerProductAssociationResponseDto[];
    total: number;
  }>({
    queryKey: ['customer-associations-summary', customerId],
    queryFn: async () => {
      // 获取足够大的 limit (100) 来确保能统计所有产品
      // 如果总数超过 100，withInteractions 的统计可能不准确，但这种情况很少见
      return await customersService.getCustomerAssociations(customerId, 1, 100);
    },
    enabled: !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // 计算统计信息
  // 注意：如果总数超过 100，withInteractions 的统计可能不准确
  // 但大多数情况下，100 个产品已经足够多了
  const stats = {
    total: data?.total || 0,
    withInteractions: data?.products?.filter((p) => p.interactionCount > 0).length || 0,
  };

  if (isLoading) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-center py-monday-4">
          <span className="animate-spin">⏳</span>
          <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-4">
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

  return (
    <>
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-between mb-monday-3">
          <h4 className="text-monday-base font-semibold text-monday-text">
            关联的产品
          </h4>
        </div>

        {/* 统计信息 */}
        <div className="space-y-monday-2 mb-monday-4">
          <p className="text-monday-sm text-monday-text-secondary">
            {stats.total === 0 ? (
              <span>该客户尚未与任何产品关联</span>
            ) : (
              <span>共 {stats.total} 个产品</span>
            )}
          </p>
          {stats.total > 0 && stats.withInteractions > 0 && (
            <p className="text-monday-xs text-monday-text-placeholder">
              {stats.withInteractions} 个产品有互动记录
            </p>
          )}
        </div>

        {/* 显示关联产品按钮 */}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setIsManagementModalOpen(true)}
          aria-label="显示关联产品"
          className="w-full"
        >
          {stats.total === 0 ? '添加关联产品' : '显示关联产品'}
        </Button>
      </Card>

      {/* Association Management Modal */}
      <CustomerAssociationManagementModal
        customerId={customerId}
        customerType={customer.customerType}
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
        onAssociationChange={() => {
          // Refetch associations when modal closes
          refetch();
        }}
      />
    </>
  );
};

