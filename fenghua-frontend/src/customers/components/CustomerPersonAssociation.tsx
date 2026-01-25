/**
 * Customer Person Association Component
 * 
 * Displays a summary card for customer contacts (people) with a button to open the management modal
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { Customer } from '../customers.service';
import { CustomerPersonManagementModal } from './CustomerPersonManagementModal';
import { peopleService } from '../../people/people.service';

interface CustomerPersonAssociationProps {
  customerId: string;
  customer: Customer;
}

/**
 * Main Component
 * 
 * Displays a summary card with statistics and a button to open the management modal
 */
export const CustomerPersonAssociation: React.FC<CustomerPersonAssociationProps> = ({
  customerId,
  customer,
}) => {
  const { token } = useAuth();
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  // 获取联系人统计信息
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-people-summary', customerId],
    queryFn: async () => {
      // 获取足够大的 limit (100) 来确保能统计所有联系人
      return await peopleService.getPeople({
        companyId: customerId,
        limit: 100,
        offset: 0,
      });
    },
    enabled: !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // 计算统计信息
  const stats = {
    total: data?.total || 0,
    important: data?.people?.filter((p) => p.isImportant).length || 0,
  };

  if (isLoading) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-center py-monday-4">
          <HomeModuleIcon name="arrowPath" className="w-5 h-5 animate-spin text-uipro-secondary" />
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
          <h4 className="text-monday-base font-semibold text-gray-900">
            联系人
          </h4>
        </div>

        {/* 统计信息 */}
        <div className="space-y-monday-2 mb-monday-4">
          <p className="text-monday-sm text-gray-900 font-medium">
            {stats.total === 0 ? (
              <span>该客户尚未添加任何联系人</span>
            ) : (
              <span>共 {stats.total} 个联系人</span>
            )}
          </p>
          {stats.total > 0 && stats.important > 0 && (
            <p className="text-monday-xs text-monday-text-placeholder">
              {stats.important} 个重要联系人
            </p>
          )}
        </div>

        {/* 显示联系人按钮 - 使用与"显示关联产品"相同的颜色（primary，蓝色） */}
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setIsManagementModalOpen(true)}
          title={stats.total === 0 ? '添加联系人' : '显示联系人'}
          aria-label={stats.total === 0 ? '添加联系人' : '显示联系人'}
          className="w-full"
        >
          {stats.total === 0 ? '添加联系人' : '显示联系人'}
        </Button>
      </Card>

      {/* Person Management Modal */}
      <CustomerPersonManagementModal
        customerId={customerId}
        customerType={customer.customerType}
        isOpen={isManagementModalOpen}
        onClose={() => {
          setIsManagementModalOpen(false);
          // Refetch people when modal closes
          refetch();
        }}
      />
    </>
  );
};
