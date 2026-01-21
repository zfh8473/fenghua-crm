/**
 * Import Task Detail Component
 * 
 * Component for displaying detailed information about an import task
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getImportTaskDetail, getErrorDetails, retryImport, ImportTaskDetail as ImportTaskDetailType, ErrorDetailItem } from '../customers-import.service';
import { toast } from 'react-toastify';
import { authService } from '../../auth/auth.service';

export interface ImportTaskDetailProps {
  taskId: string;
  onClose?: () => void;
  onRetry?: (taskId: string) => void;
}

export const ImportTaskDetail: React.FC<ImportTaskDetailProps> = ({ taskId, onClose, onRetry }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [errorDetailsPage, setErrorDetailsPage] = useState({ limit: 50, offset: 0 });

  const { data: taskDetail, isLoading, error } = useQuery({
    queryKey: ['import-task-detail', taskId],
    queryFn: () => getImportTaskDetail(taskId),
  });

  const { data: errorDetailsData } = useQuery({
    queryKey: ['import-error-details', taskId, errorDetailsPage],
    queryFn: () => getErrorDetails(taskId, errorDetailsPage),
    enabled: !!taskDetail && (taskDetail.failureCount > 0 || (taskDetail.errorDetails && taskDetail.errorDetails.length > 0)),
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

  const toggleRowExpansion = (row: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(row)) {
      newExpanded.delete(row);
    } else {
      newExpanded.add(row);
    }
    setExpandedRows(newExpanded);
  };

  const handleDownloadReport = (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (!taskDetail?.errorReportPath) {
      toast.warning('该导入任务没有错误报告');
      return;
    }

    const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) ||
      (import.meta.env?.VITE_BACKEND_URL as string) || '/api';
    const token = authService.getToken();
    const url = `${API_URL}/import/customers/reports/${taskId}?format=${format}`;

    if (token) {
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
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', `import-error-${taskId}.${format}`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          toast.success('错误报告下载成功');
        })
        .catch((error) => {
          console.error('Failed to download error report:', error);
          toast.error('下载错误报告失败');
        });
    }
  };

  const handleRetry = async () => {
    try {
      toast.info('正在重新导入失败记录...');
      const result = await retryImport(taskId);
      toast.success(`重新导入任务已创建: ${result.taskId}`);
      if (onRetry) {
        onRetry(result.taskId);
      }
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || '重新导入失败');
    }
  };

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

  if (error || !taskDetail) {
    return (
      <Card variant="default">
        <div className="text-center py-monday-12">
          <p className="text-monday-base text-primary-red mb-monday-4">
            加载导入任务详情失败
          </p>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const errorDetails = errorDetailsData?.items || taskDetail.errorDetails || [];
  const hasErrors = taskDetail.failureCount > 0;

  return (
    <Card title="导入任务详情" variant="default">
      <div className="space-y-monday-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-monday-4">
          <div>
            <label className="text-monday-sm font-medium text-monday-text-secondary">文件名</label>
            <p className="text-monday-base">{taskDetail.fileName}</p>
          </div>
          <div>
            <label className="text-monday-sm font-medium text-monday-text-secondary">状态</label>
            <div className="mt-monday-1">{getStatusBadge(taskDetail.status)}</div>
          </div>
          <div>
            <label className="text-monday-sm font-medium text-monday-text-secondary">开始时间</label>
            <p className="text-monday-base">{formatDate(taskDetail.startedAt)}</p>
          </div>
          {taskDetail.completedAt && (
            <div>
              <label className="text-monday-sm font-medium text-monday-text-secondary">完成时间</label>
              <p className="text-monday-base">{formatDate(taskDetail.completedAt)}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-200 pt-monday-4">
          <h3 className="text-monday-base font-semibold mb-monday-4">导入结果摘要</h3>
          <div className="grid grid-cols-3 gap-monday-4">
            <div className="bg-gray-50 p-monday-4 rounded-monday-md">
              <label className="text-monday-sm text-monday-text-secondary">总记录数</label>
              <p className="text-monday-lg font-semibold">{taskDetail.totalRecords}</p>
            </div>
            <div className="bg-green-50 p-monday-4 rounded-monday-md">
              <label className="text-monday-sm text-monday-text-secondary">成功数</label>
              <p className="text-monday-lg font-semibold text-green-600">{taskDetail.successCount}</p>
            </div>
            <div className="bg-red-50 p-monday-4 rounded-monday-md">
              <label className="text-monday-sm text-monday-text-secondary">失败数</label>
              <p className="text-monday-lg font-semibold text-red-600">{taskDetail.failureCount}</p>
            </div>
          </div>
        </div>

        {/* Error Details */}
        {hasErrors && (
          <div className="border-t border-gray-200 pt-monday-4">
            <div className="flex items-center justify-between mb-monday-4">
              <h3 className="text-monday-base font-semibold">错误详情</h3>
              <div className="flex gap-monday-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport('xlsx')}
                >
                  下载 Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport('csv')}
                >
                  下载 CSV
                </Button>
                {onRetry && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRetry}
                  >
                    重新导入
                  </Button>
                )}
              </div>
            </div>

            {errorDetails.length > 0 ? (
              <div className="space-y-monday-2">
                {errorDetails.map((errorItem: ErrorDetailItem, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-monday-md p-monday-4"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleRowExpansion(errorItem.row)}
                    >
                      <div className="flex items-center gap-monday-4">
                        <span className="text-monday-sm font-medium">行号: {errorItem.row}</span>
                        <span className="text-monday-sm text-monday-text-secondary">
                          {errorItem.errors.length} 个错误
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {expandedRows.has(errorItem.row) ? '收起' : '展开'}
                      </Button>
                    </div>

                    {expandedRows.has(errorItem.row) && (
                      <div className="mt-monday-4 space-y-monday-2">
                        <div className="bg-gray-50 p-monday-3 rounded-monday-md">
                          <label className="text-monday-sm font-medium text-monday-text-secondary">原始数据</label>
                          <pre className="text-monday-sm mt-monday-2 whitespace-pre-wrap">
                            {JSON.stringify(errorItem.data, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <label className="text-monday-sm font-medium text-monday-text-secondary">错误信息</label>
                          <div className="mt-monday-2 space-y-monday-2">
                            {errorItem.errors.map((err, errIndex) => (
                              <div
                                key={errIndex}
                                className="bg-red-50 border border-red-200 rounded-monday-md p-monday-3"
                              >
                                <span className="text-monday-sm font-medium text-red-800">
                                  {err.field}:
                                </span>
                                <span className="text-monday-sm text-red-700 ml-monday-2">
                                  {err.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {errorDetailsData && errorDetailsData.total > errorDetailsPage.limit && (
                  <div className="flex items-center justify-between pt-monday-4 border-t border-gray-200">
                    <div className="text-monday-sm text-monday-text-secondary">
                      显示 {errorDetailsPage.offset + 1} - {Math.min(errorDetailsPage.offset + errorDetailsPage.limit, errorDetailsData.total)} / {errorDetailsData.total}
                    </div>
                    <div className="flex gap-monday-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setErrorDetailsPage({
                            ...errorDetailsPage,
                            offset: Math.max(0, errorDetailsPage.offset - errorDetailsPage.limit),
                          })
                        }
                        disabled={errorDetailsPage.offset === 0}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setErrorDetailsPage({
                            ...errorDetailsPage,
                            offset: errorDetailsPage.offset + errorDetailsPage.limit,
                          })
                        }
                        disabled={errorDetailsPage.offset + errorDetailsPage.limit >= errorDetailsData.total}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-monday-sm text-monday-text-secondary">暂无错误详情</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-monday-2 border-t border-gray-200 pt-monday-4">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

