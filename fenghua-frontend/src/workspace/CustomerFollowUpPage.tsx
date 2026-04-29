import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getCustomerAnalysis } from '../dashboard/services/customer-analysis.service';

type CustomerType = 'BUYER' | 'SUPPLIER' | '';

const getDaysColor = (days: number) => {
  if (days <= 30) return 'text-green-600 font-medium';
  if (days <= 60) return 'text-yellow-600 font-medium';
  if (days <= 90) return 'text-orange-500 font-medium';
  return 'text-red-600 font-semibold';
};

const getDaysLabel = (days: number) => {
  if (days <= 30) return '近期';
  if (days <= 60) return '偏久';
  if (days <= 90) return '较长';
  return '需跟进';
};

export const CustomerFollowUpPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<CustomerType>('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-follow-up', typeFilter, page],
    queryFn: () => {
      if (!token) throw new Error('未登录');
      return getCustomerAnalysis(token, {
        customerType: typeFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  // Sort by days DESC (most neglected first)
  const sorted = [...(data?.customers || [])].sort(
    (a, b) => b.daysSinceLastInteraction - a.daysSinceLastInteraction,
  );

  return (
    <MainLayout title="客户跟进">
      <div className="space-y-monday-4">
        {/* Filter bar */}
        <Card variant="default" className="p-monday-4">
          <div className="flex items-center gap-monday-4 flex-wrap">
            <div className="flex items-center gap-monday-2">
              <span className="text-monday-sm font-medium text-monday-text">客户类型</span>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as CustomerType); setPage(1); }}
                className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta"
              >
                <option value="">全部</option>
                <option value="BUYER">采购商</option>
                <option value="SUPPLIER">供应商</option>
              </select>
            </div>
            <div className="flex items-center gap-monday-3 ml-auto text-monday-xs text-monday-text-secondary">
              <span className="flex items-center gap-monday-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>≤30天</span>
              <span className="flex items-center gap-monday-1"><span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>≤60天</span>
              <span className="flex items-center gap-monday-1"><span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>≤90天</span>
              <span className="flex items-center gap-monday-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>&gt;90天</span>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card variant="default" className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-4">
            <h2 className="text-monday-lg font-semibold text-monday-text">客户联系跟进</h2>
            {data && (
              <span className="text-monday-sm text-monday-text-secondary">共 {data.total} 个客户</span>
            )}
          </div>

          {error && (
            <div className="p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-sm mb-monday-4">
              {error instanceof Error ? error.message : '加载失败'}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-monday-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-monday-12 text-monday-text-secondary">暂无数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-monday-bg">
                    <th className="text-left p-monday-3 text-monday-sm font-semibold text-monday-text-secondary">客户名称</th>
                    <th className="text-left p-monday-3 text-monday-sm font-semibold text-monday-text-secondary">类型</th>
                    <th className="text-left p-monday-3 text-monday-sm font-semibold text-monday-text-secondary">最后互动日期</th>
                    <th className="text-left p-monday-3 text-monday-sm font-semibold text-monday-text-secondary">距今</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c, i) => (
                    <tr
                      key={c.customerId}
                      className={`border-b border-gray-100 hover:bg-monday-bg/50 cursor-pointer transition-colors duration-150 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                      onClick={() => navigate(`/customers?customerId=${c.customerId}`)}
                    >
                      <td className="p-monday-3 text-monday-sm text-uipro-cta hover:underline">{c.customerName}</td>
                      <td className="p-monday-3">
                        <span className={`px-monday-2 py-0.5 rounded-full text-monday-xs font-medium ${
                          c.customerType === 'BUYER'
                            ? 'bg-uipro-cta/10 text-uipro-cta'
                            : 'bg-semantic-success/10 text-semantic-success'
                        }`}>
                          {c.customerType === 'BUYER' ? '采购商' : '供应商'}
                        </span>
                      </td>
                      <td className="p-monday-3 text-monday-sm text-monday-text">
                        {new Date(c.lastInteractionDate).toLocaleDateString('zh-CN')}
                      </td>
                      <td className={`p-monday-3 text-monday-sm ${getDaysColor(c.daysSinceLastInteraction)}`}>
                        {c.daysSinceLastInteraction} 天
                        <span className="ml-monday-1 text-monday-xs opacity-70">({getDaysLabel(c.daysSinceLastInteraction)})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-monday-6 pt-monday-4 border-t border-gray-200">
              <span className="text-monday-sm text-monday-text-secondary">第 {page} 页，共 {totalPages} 页</span>
              <div className="flex gap-monday-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};
