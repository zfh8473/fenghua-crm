/**
 * Export Progress Component
 * 
 * Displays export progress and handles completion
 * All custom code is proprietary and not open source.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getExportTaskStatus, downloadExportFile, ExportTaskResponse, ExportTaskStatus } from '../export.service';
import { toast } from 'react-toastify';

export interface ExportProgressProps {
  taskId: string;
  onComplete: (fileId: string, fileName: string) => void;
  onCancel?: () => void;
}

export const ExportProgress: React.FC<ExportProgressProps> = ({
  taskId,
  onComplete,
  onCancel,
}) => {
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  // Poll for export status every 2 seconds
  const { data: exportResult, isLoading } = useQuery<ExportTaskResponse>({
    queryKey: ['export-task-status', taskId],
    queryFn: () => getExportTaskStatus(taskId),
    refetchInterval: (query) => {
      // Stop polling if export is completed or failed
      const data = query.state.data;
      if (data?.status === ExportTaskStatus.COMPLETED || data?.status === ExportTaskStatus.FAILED) {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (exportResult?.status === ExportTaskStatus.COMPLETED && exportResult.fileId && exportResult.fileName) {
      onComplete(exportResult.fileId, exportResult.fileName);
    }
  }, [exportResult, onComplete]);

  useEffect(() => {
    if (exportResult?.estimatedTimeRemaining) {
      setEstimatedTimeRemaining(exportResult.estimatedTimeRemaining);
    } else if (exportResult?.totalRecords && exportResult?.processedRecords) {
      const elapsed = Date.now() - startTime;
      const rate = exportResult.processedRecords / elapsed; // records per ms
      const remaining = (exportResult.totalRecords - exportResult.processedRecords) / rate;
      setEstimatedTimeRemaining(Math.round(remaining / 1000)); // Convert to seconds
    }
  }, [exportResult, startTime]);

  const progress = exportResult?.totalRecords
    ? Math.round((exportResult.processedRecords || 0) / exportResult.totalRecords * 100)
    : 0;

  const handleDownload = async () => {
    if (!exportResult?.fileId) {
      toast.error('文件 ID 不存在，无法下载');
      return;
    }

    try {
      await downloadExportFile(exportResult.fileId);
      toast.success('文件下载成功');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error(error instanceof Error ? error.message : '文件下载失败');
    }
  };

  if (isLoading && !exportResult) {
    return (
      <Card title="导出进度" variant="default">
        <div className="text-center py-monday-8">
          <p className="text-monday-sm text-monday-text-secondary">正在启动导出任务...</p>
        </div>
      </Card>
    );
  }

  if (exportResult?.status === ExportTaskStatus.FAILED) {
    return (
      <Card title="导出失败" variant="default">
        <div className="space-y-monday-4">
          <p className="text-monday-sm text-monday-text-danger">
            {exportResult.error || '导出任务失败'}
          </p>
          {onCancel && (
            <Button onClick={onCancel} variant="secondary">
              返回
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (exportResult?.status === ExportTaskStatus.COMPLETED) {
    return (
      <Card title="导出完成" variant="default">
        <div className="space-y-monday-4">
          <div className="space-y-monday-2">
            <p className="text-monday-sm text-monday-text">
              已成功导出 {exportResult.totalRecords || 0} 条记录
            </p>
            {exportResult.fileSize && (
              <p className="text-monday-sm text-monday-text-secondary">
                文件大小: {(exportResult.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <div className="flex gap-monday-3">
            <Button onClick={handleDownload} variant="primary">
              下载文件
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="secondary">
                返回
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="导出进度" variant="default">
      <div className="space-y-monday-4">
        <div>
          <div className="flex justify-between text-monday-sm text-monday-text-secondary mb-monday-2">
            <span>处理中...</span>
            <span>
              {exportResult?.processedRecords || 0} / {exportResult?.totalRecords || 0} 条记录
            </span>
          </div>
          <div className="w-full bg-monday-border rounded-full h-2">
            <div
              className="bg-semantic-success h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {estimatedTimeRemaining && (
          <p className="text-monday-sm text-monday-text-secondary">
            预计剩余时间: {Math.floor(estimatedTimeRemaining / 60)} 分 {estimatedTimeRemaining % 60} 秒
          </p>
        )}

        {onCancel && (
          <Button onClick={onCancel} variant="secondary">
            取消
          </Button>
        )}
      </div>
    </Card>
  );
};

