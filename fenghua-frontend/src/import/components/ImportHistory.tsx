/**
 * Import History Component
 * 
 * Component for displaying import history records
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { getImportHistory, getImportHistoryStats, ImportHistoryItem, ImportHistoryQuery, ImportType } from '../customers-import.service';
import { ImportTaskDetail } from './ImportTaskDetail';
import { toast } from 'react-toastify';
import { authService } from '../../auth/auth.service';

export interface ImportHistoryProps {
  onSelectTask?: (taskId: string) => void;
}

export const ImportHistory: React.FC<ImportHistoryProps> = ({ onSelectTask }) => {
  const [query, setQuery] = useState<ImportHistoryQuery>({
    limit: 20,
    offset: 0,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['import-history', query],
    queryFn: () => getImportHistory(query),
  });

  const { data: stats } = useQuery({
    queryKey: ['import-history-stats', query.startDate, query.endDate],
    queryFn: () => getImportHistoryStats(query.startDate, query.endDate),
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      processing: { label: '处理中', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-800' },
      failed: { label: '失败', className: 'bg-red-100 text-red-800' },
      partial: { label: '部分成功', className: 'bg-yellow-100 text-yellow-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`inline-flex items-center px-monday-2 py-monday-1 rounded-full text-monday-sm font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getImportTypeLabel = (type?: ImportType): string => {
    const typeMap: Record<ImportType, string> = {
      CUSTOMER: '客户',
      PRODUCT: '产品',
      INTERACTION: '互动记录',
    };
    return type ? typeMap[type] || type : '-';
  };

  const handleDownloadReport = (item: ImportHistoryItem) => {
    if (!item.errorReportPath) {
      toast.warning('该导入任务没有错误报告');
      return;
    }

    // Generate download URL
    const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) ||
      (import.meta.env?.VITE_BACKEND_URL as string) || '/api';
    const token = authService.getToken();
    const url = `${API_URL}/import/customers/reports/${item.taskId}`;

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `import-error-${item.taskId}.xlsx`);
    if (token) {
      // For authenticated downloads, we need to use fetch
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error('下载失败');
          return response.blob();
        })
        .then((blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          link.href = downloadUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        })
        .catch((error) => {
          console.error('Failed to download error report:', error);
          toast.error('下载错误报告失败');
        });
    }
  };

  const historyTableColumns = [
    {
      key: 'fileName',
      header: '文件名',
      render: (value: string) => (
        <span className="font-medium text-monday-sm">{value}</span>
      ),
    },
    {
      key: 'importType',
      header: '导入类型',
      render: (value: ImportType | undefined) => (
        <span className="text-monday-sm">{getImportTypeLabel(value)}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'totalRecords',
      header: '总记录数',
      render: (value: number) => <span className="text-monday-sm">{value}</span>,
    },
    {
      key: 'successCount',
      header: '成功',
      render: (value: number) => (
        <span className="text-monday-sm text-green-600 font-medium">{value}</span>
      ),
    },
    {
      key: 'failureCount',
      header: '失败',
      render: (value: number) => (
        <span className="text-monday-sm text-red-600 font-medium">{value}</span>
      ),
    },
    {
      key: 'startedAt',
      header: '开始时间',
      render: (value: string) => (
        <span className="text-monday-sm text-monday-text-secondary">{formatDate(value)}</span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (_: any, row: ImportHistoryItem) => (
        <div className="flex gap-monday-2">
          {row.errorReportPath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadReport(row)}
            >
              下载报告
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onSelectTask) {
                onSelectTask(row.taskId);
              } else {
                setSelectedTaskId(row.taskId);
              }
            }}
          >
            查看详情
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card variant="default">
        <div className="flex items-center justify-center py-monday-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-monday-4" />
            <p className="text-monday-base text-monday-text-secondary">加载中...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="default">
        <div className="text-center py-monday-12">
          <p className="text-monday-base text-primary-red mb-monday-4">
            加载导入历史失败
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            重试
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="导入历史" variant="default">
      <div className="space-y-monday-4">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-5 gap-monday-4 p-monday-4 bg-gray-50 rounded-monday-md">
            <div className="text-center">
              <div className="text-monday-sm text-monday-text-secondary mb-monday-1">总任务数</div>
              <div className="text-monday-lg font-semibold">{stats.total}</div>
            </div>
            <div className="text-center">
              <div className="text-monday-sm text-monday-text-secondary mb-monday-1">已完成</div>
              <div className="text-monday-lg font-semibold text-green-600">{stats.completed}</div>
            </div>
            <div className="text-center">
              <div className="text-monday-sm text-monday-text-secondary mb-monday-1">部分成功</div>
              <div className="text-monday-lg font-semibold text-yellow-600">{stats.partial}</div>
            </div>
            <div className="text-center">
              <div className="text-monday-sm text-monday-text-secondary mb-monday-1">失败</div>
              <div className="text-monday-lg font-semibold text-red-600">{stats.failed}</div>
            </div>
            <div className="text-center">
              <div className="text-monday-sm text-monday-text-secondary mb-monday-1">处理中</div>
              <div className="text-monday-lg font-semibold text-blue-600">{stats.processing}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-monday-4 items-center">
          <select
            className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            value={query.status || ''}
            onChange={(e) =>
              setQuery({
                ...query,
                status: e.target.value || undefined,
                offset: 0,
              })
            }
          >
            <option value="">全部状态</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
            <option value="partial">部分成功</option>
          </select>

          <select
            className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            value={query.importType || ''}
            onChange={(e) =>
              setQuery({
                ...query,
                importType: e.target.value || undefined,
                offset: 0,
              })
            }
          >
            <option value="">全部类型</option>
            <option value="CUSTOMER">客户</option>
            <option value="PRODUCT">产品</option>
            <option value="INTERACTION">互动记录</option>
          </select>

          <input
            type="date"
            className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            value={query.startDate || ''}
            onChange={(e) =>
              setQuery({
                ...query,
                startDate: e.target.value || undefined,
                offset: 0,
              })
            }
            placeholder="开始日期"
          />

          <input
            type="date"
            className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            value={query.endDate || ''}
            onChange={(e) =>
              setQuery({
                ...query,
                endDate: e.target.value || undefined,
                offset: 0,
              })
            }
            placeholder="结束日期"
          />

          <input
            type="text"
            className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            value={query.search || ''}
            onChange={(e) =>
              setQuery({
                ...query,
                search: e.target.value || undefined,
                offset: 0,
              })
            }
            placeholder="搜索文件名或任务ID"
          />
        </div>

        {/* Table */}
        {data && data.items.length > 0 ? (
          <>
            <Table columns={historyTableColumns} data={data.items} />
            {/* Pagination */}
            {data.total > (query.limit || 20) && (
              <div className="flex items-center justify-between pt-monday-4 border-t border-gray-200">
                <div className="text-monday-sm text-monday-text-secondary">
                  显示 {(query.offset || 0) + 1} - {Math.min((query.offset || 0) + (query.limit || 20), data.total)} / {data.total}
                </div>
                <div className="flex gap-monday-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setQuery({ ...query, offset: Math.max(0, (query.offset || 0) - (query.limit || 20)) })
                    }
                    disabled={(query.offset || 0) === 0}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery({ ...query, offset: (query.offset || 0) + (query.limit || 20) })}
                    disabled={(query.offset || 0) + (query.limit || 20) >= data.total}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-monday-12">
            <p className="text-monday-base text-monday-text-secondary">暂无导入历史</p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-monday-4">
          <div className="bg-white rounded-monday-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ImportTaskDetail
              taskId={selectedTaskId}
              onClose={() => setSelectedTaskId(null)}
              onRetry={(newTaskId) => {
                toast.success(`新的导入任务已创建: ${newTaskId}`);
                setSelectedTaskId(null);
                refetch();
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

