/**
 * Export History Component
 * 
 * Displays export history list
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getExportHistory, downloadExportFile, ExportHistoryItem, ExportDataType, ExportFormat, ExportTaskStatus } from '../export.service';
import { toast } from 'react-toastify';

export interface ExportHistoryProps {
  onBack: () => void;
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({ onBack }) => {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['export-history', page],
    queryFn: () => getExportHistory({
      limit,
      offset: (page - 1) * limit,
    }),
  });

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadExportFile(fileId);
      toast.success('文件下载成功');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error(error instanceof Error ? error.message : '下载失败');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('zh-CN');
  };

  const getStatusLabel = (status: ExportTaskStatus): string => {
    const statusMap: Record<ExportTaskStatus, string> = {
      [ExportTaskStatus.PENDING]: '等待中',
      [ExportTaskStatus.PROCESSING]: '处理中',
      [ExportTaskStatus.COMPLETED]: '已完成',
      [ExportTaskStatus.FAILED]: '失败',
    };
    return statusMap[status] || status;
  };

  const getDataTypeLabel = (type: ExportDataType): string => {
    const typeMap: Record<ExportDataType, string> = {
      [ExportDataType.CUSTOMER]: '客户',
      [ExportDataType.PRODUCT]: '产品',
      [ExportDataType.INTERACTION]: '互动记录',
    };
    return typeMap[type] || type;
  };

  const getFormatLabel = (format: ExportFormat): string => {
    return format;
  };

  if (isLoading) {
    return (
      <Card title="导出历史" variant="default">
        <div className="text-center py-monday-8">
          <p className="text-monday-sm text-monday-text-secondary">加载中...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="导出历史" variant="default">
      <div className="space-y-monday-4">
        {historyData && historyData.history.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-monday-border">
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      文件名
                    </th>
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      类型
                    </th>
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      格式
                    </th>
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      记录数
                    </th>
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      文件大小
                    </th>
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      状态
                    </th>
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      创建时间
                    </th>
                    <th className="text-left py-monday-2 px-monday-3 text-monday-sm font-medium text-monday-text">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.history.map((item: ExportHistoryItem) => (
                    <tr key={item.id} className="border-b border-monday-border">
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        {item.file_name}
                      </td>
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        {getDataTypeLabel(item.export_type)}
                      </td>
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        {getFormatLabel(item.export_format)}
                      </td>
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        {item.total_records}
                      </td>
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        {formatFileSize(item.file_size)}
                      </td>
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        <span
                          className={`px-monday-2 py-monday-1 rounded text-monday-xs ${
                            item.status === ExportTaskStatus.COMPLETED
                              ? 'bg-green-100 text-green-800'
                              : item.status === ExportTaskStatus.FAILED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="py-monday-2 px-monday-3 text-monday-sm text-monday-text">
                        {item.status === ExportTaskStatus.COMPLETED && (
                          <Button
                            onClick={() => handleDownload(item.id, item.file_name)}
                            variant="primary"
                            size="sm"
                          >
                            下载
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-monday-sm text-monday-text-secondary">
                共 {historyData.total} 条记录
              </p>
              <div className="flex gap-monday-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="secondary"
                  size="sm"
                >
                  上一页
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= historyData.total}
                  variant="secondary"
                  size="sm"
                >
                  下一页
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-monday-8">
            <p className="text-monday-sm text-monday-text-secondary">暂无导出历史</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onBack} variant="secondary">
            返回
          </Button>
        </div>
      </div>
    </Card>
  );
};

