/**
 * Customer Timeline Summary Component
 * 
 * Displays a summary card for customer timeline with a button to open the timeline modal
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { customersService } from '../customers.service';
import { CustomerTimelineModal } from './CustomerTimelineModal';

interface CustomerTimelineSummaryProps {
  customerId: string;
}

/**
 * Main Component
 * 
 * Displays a summary card with statistics and a button to open the timeline modal
 */
export const CustomerTimelineSummary: React.FC<CustomerTimelineSummaryProps> = ({
  customerId,
}) => {
  const { token } = useAuth();
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  // 获取时间线统计信息（只获取第一页用于统计）
  const { data, isLoading, error, refetch } = useQuery<{
    interactions: unknown[];
    total: number;
  }>({
    queryKey: ['customer-timeline-summary', customerId],
    queryFn: async () => {
      // Use relative path /api to leverage Vite proxy in development
      // In production, set VITE_API_BASE_URL to the full backend URL
      const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                        (import.meta.env?.VITE_BACKEND_URL as string) || 
                        '/api';
      const response = await fetch(
        `${apiBaseUrl}/customers/${customerId}/timeline?page=1&limit=1&sortOrder=desc&dateRange=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('没有权限查看客户互动记录');
        }
        if (response.status === 404) {
          throw new Error('客户不存在');
        }
        throw new Error('获取客户互动记录失败');
      }
      return response.json();
    },
    enabled: !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // 计算统计信息
  const stats = {
    total: data?.total || 0,
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
          <h4 className="text-monday-base font-semibold text-gray-900">
            时间线视图
          </h4>
        </div>

        {/* 统计信息 */}
        <div className="space-y-monday-2 mb-monday-4">
          <p className="text-monday-sm text-gray-900 font-medium">
            {stats.total === 0 ? (
              <span>该客户尚未有任何互动记录</span>
            ) : (
              <span>共 {stats.total} 条记录</span>
            )}
          </p>
        </div>

        {/* 显示时间线按钮（与详情页编辑/删除统一：outline、uipro-cta、图标） */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsTimelineModalOpen(true)}
          title={stats.total === 0 ? '记录新互动' : '显示时间线'}
          aria-label={stats.total === 0 ? '记录新互动' : '显示时间线'}
          leftIcon={<HomeModuleIcon name="chartBar" className="w-4 h-4 flex-shrink-0" />}
          className="w-full text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
        >
          {stats.total === 0 ? '记录新互动' : '显示时间线'}
        </Button>
      </Card>

      {/* Timeline Modal */}
      <CustomerTimelineModal
        customerId={customerId}
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        onInteractionChange={() => {
          // Refetch timeline summary when modal closes
          refetch();
        }}
      />
    </>
  );
};




