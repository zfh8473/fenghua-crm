/**
 * Restore Operation Component
 * 
 * Displays restore progress
 * All custom code is proprietary and not open source.
 */

import { RestoreStatus } from '../../restore/restore.service';
// import './RestoreOperation.css'; // Removed

interface RestoreOperationProps {
  restoreStatus: RestoreStatus;
}

export const RestoreOperation: React.FC<RestoreOperationProps> = ({ restoreStatus }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="p-monday-6">
      <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-6 tracking-tight">恢复操作状态</h3>
      
      <div className="space-y-monday-4 mb-monday-6">
        <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
          <span className="text-monday-sm font-semibold text-monday-text">恢复 ID:</span>
          <span className="text-monday-base text-monday-text font-normal">{restoreStatus.restoreId}</span>
        </div>
        <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
          <span className="text-monday-sm font-semibold text-monday-text">状态:</span>
          <span className={`px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium ${
            restoreStatus.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
            restoreStatus.status === 'completed' ? 'bg-semantic-success/15 text-semantic-success' :
            'bg-semantic-error/15 text-semantic-error'
          }`}>
            {restoreStatus.status === 'running' ? '进行中' :
             restoreStatus.status === 'completed' ? '已完成' : '失败'}
          </span>
        </div>
        <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
          <span className="text-monday-sm font-semibold text-monday-text">进度:</span>
          <span className="text-monday-base text-monday-text font-normal">{restoreStatus.progress}%</span>
        </div>
        <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
          <span className="text-monday-sm font-semibold text-monday-text">消息:</span>
          <span className="text-monday-base text-monday-text font-normal">{restoreStatus.message}</span>
        </div>
        <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
          <span className="text-monday-sm font-semibold text-monday-text">开始时间:</span>
          <span className="text-monday-base text-monday-text font-normal">{formatDate(restoreStatus.startedAt)}</span>
        </div>
        {restoreStatus.completedAt && (
          <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
            <span className="text-monday-sm font-semibold text-monday-text">完成时间:</span>
            <span className="text-monday-base text-monday-text font-normal">{formatDate(restoreStatus.completedAt)}</span>
          </div>
        )}
        {restoreStatus.errorMessage && (
          <div className="flex justify-between items-center py-monday-3">
            <span className="text-monday-sm font-semibold text-monday-text">错误信息:</span>
            <span className="text-monday-base text-primary-red">{restoreStatus.errorMessage}</span>
          </div>
        )}
      </div>

      {restoreStatus.status === 'running' && (
        <div className="mt-monday-4">
          <div className="w-full h-6 bg-monday-bg rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-uipro-cta transition-all duration-300"
              style={{ width: `${restoreStatus.progress}%` }}
            />
          </div>
        </div>
      )}

      {restoreStatus.status === 'completed' && (
        <div className="bg-primary-green/20 border border-primary-green text-primary-green p-monday-3 rounded-monday-md text-center font-medium mt-monday-4">
          ✅ 数据恢复成功
        </div>
      )}

      {restoreStatus.status === 'failed' && (
        <div className="bg-semantic-error/10 border border-semantic-error text-semantic-error p-monday-3 rounded-monday-md text-center font-medium mt-monday-4" role="alert">
          ❌ 数据恢复失败: {restoreStatus.errorMessage}
        </div>
      )}
    </div>
  );
};

