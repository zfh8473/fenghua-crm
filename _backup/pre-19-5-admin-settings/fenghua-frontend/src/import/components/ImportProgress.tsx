/**
 * Import Progress Component
 * 
 * Component for displaying import progress and results
 * All custom code is proprietary and not open source.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getImportTaskStatus, ImportResult } from '../customers-import.service';
import { getImportTaskStatus as getProductImportTaskStatus } from '../products-import.service';
import { getImportTaskStatus as getInteractionImportTaskStatus } from '../interactions-import.service';
import { toast } from 'react-toastify';

export interface ImportProgressProps {
  taskId: string;
  onComplete: (result: ImportResult) => void;
  onCancel?: () => void;
  importType?: 'customer' | 'product' | 'interaction'; // Default: 'customer'
}

export const ImportProgress: React.FC<ImportProgressProps> = ({
  taskId,
  onComplete,
  onCancel,
  importType = 'customer',
}) => {
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  // Poll for import status every 2 seconds
  const { data: importResult, isLoading } = useQuery<ImportResult>({
    queryKey: ['import-task-status', taskId, importType],
    queryFn: () => {
      if (importType === 'product') {
        return getProductImportTaskStatus(taskId);
      } else if (importType === 'interaction') {
        return getInteractionImportTaskStatus(taskId);
      } else {
        return getImportTaskStatus(taskId);
      }
    },
    refetchInterval: (query) => {
      // Stop polling if import is completed or failed
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchIntervalInBackground: true,
  });

  // Calculate estimated time remaining
  useEffect(() => {
    if (importResult?.progress && importResult.progress > 0 && importResult.progress < 100) {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const rate = importResult.progress / elapsed; // progress per second
      const remaining = (100 - importResult.progress) / rate; // seconds
      setEstimatedTimeRemaining(Math.round(remaining));
    } else {
      setEstimatedTimeRemaining(null);
    }
  }, [importResult?.progress, startTime]);

  // Handle completion
  useEffect(() => {
    if (importResult?.status === 'completed') {
      toast.success('导入完成！');
      onComplete(importResult);
    } else if (importResult?.status === 'failed') {
      toast.error('导入失败，请查看错误详情');
      onComplete(importResult);
    }
  }, [importResult?.status, importResult, onComplete]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} 秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} 分 ${secs} 秒`;
  };

  if (isLoading && !importResult) {
    return (
      <Card variant="default">
        <div className="flex items-center justify-center py-monday-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-monday-4" />
            <p className="text-monday-base text-monday-text-secondary">正在启动导入任务...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!importResult) {
    return (
      <Card variant="default">
        <div className="text-center py-monday-12">
          <p className="text-monday-base text-monday-text-secondary">无法获取导入状态</p>
        </div>
      </Card>
    );
  }

  const progress = importResult.progress || 0;
  const isCompleted = importResult.status === 'completed';
  const isFailed = importResult.status === 'failed';
  const isProcessing = importResult.status === 'processing';

  return (
    <div className="space-y-monday-6">
      {/* Progress Card */}
      <Card title="导入进度" variant="default">
        <div className="space-y-monday-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-monday-2">
              <span className="text-monday-sm font-medium text-monday-text">
                {isCompleted ? '已完成' : isFailed ? '导入失败' : '处理中...'}
              </span>
              <span className="text-monday-sm text-monday-text-secondary">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-green-600'
                    : isFailed
                    ? 'bg-primary-red'
                    : 'bg-primary-blue'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-monday-4 pt-monday-4 border-t border-gray-200">
            <div>
              <div className="text-monday-sm text-monday-text-secondary">总记录数</div>
              <div className="text-monday-xl font-bold text-monday-text">
                {importResult.totalRecords}
              </div>
            </div>
            <div>
              <div className="text-monday-sm text-monday-text-secondary">已处理</div>
              <div className="text-monday-xl font-bold text-primary-blue">
                {importResult.successCount + importResult.failureCount}
              </div>
            </div>
            {isCompleted && (
              <>
                <div>
                  <div className="text-monday-sm text-monday-text-secondary">成功</div>
                  <div className="text-monday-xl font-bold text-green-600">
                    {importResult.successCount}
                  </div>
                </div>
                <div>
                  <div className="text-monday-sm text-monday-text-secondary">失败</div>
                  <div className="text-monday-xl font-bold text-primary-red">
                    {importResult.failureCount}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Estimated Time Remaining */}
          {isProcessing && estimatedTimeRemaining !== null && (
            <div className="text-monday-sm text-monday-text-secondary text-center pt-monday-2">
              预计剩余时间: {formatTime(estimatedTimeRemaining)}
            </div>
          )}
        </div>
      </Card>

      {/* Errors */}
      {importResult.errors && importResult.errors.length > 0 && (
        <Card title="错误详情" variant="default">
          <div className="space-y-monday-2 max-h-96 overflow-y-auto">
            {importResult.errors.slice(0, 10).map((error, idx) => (
              <div
                key={idx}
                className="p-monday-3 bg-red-50 border border-red-200 rounded-monday-md"
              >
                <div className="text-monday-sm font-medium text-primary-red">
                  行 {error.row} - {error.field}
                </div>
                <div className="text-monday-sm text-monday-text-secondary mt-monday-1">
                  {error.message}
                </div>
              </div>
            ))}
            {importResult.errors.length > 10 && (
              <div className="text-monday-sm text-monday-text-secondary text-center pt-monday-2">
                还有 {importResult.errors.length - 10} 个错误未显示...
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      {isCompleted && (
        <div className="flex justify-end gap-monday-4">
          {importResult.errorReportUrl && (
            <Button
              variant="outline"
              onClick={() => {
                window.open(importResult.errorReportUrl, '_blank');
              }}
            >
              下载错误报告
            </Button>
          )}
          <Button variant="primary" onClick={() => onComplete(importResult)}>
            查看结果
          </Button>
        </div>
      )}

      {isFailed && (
        <div className="flex justify-end gap-monday-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              返回
            </Button>
          )}
          {importResult.errorReportUrl && (
            <Button
              variant="outline"
              onClick={() => {
                window.open(importResult.errorReportUrl, '_blank');
              }}
            >
              下载错误报告
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

