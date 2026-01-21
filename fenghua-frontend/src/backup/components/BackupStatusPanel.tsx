/**
 * Backup Status Panel Component
 * 
 * Displays current backup status
 * All custom code is proprietary and not open source.
 */

import { BackupStatus } from '../backup.service';
// import './BackupStatusPanel.css'; // Removed

interface BackupStatusPanelProps {
  status: BackupStatus | null;
}

export const BackupStatusPanel: React.FC<BackupStatusPanelProps> = ({ status }) => {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '暂无';
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

  if (!status) {
    return (
      <div className="p-monday-6">
        <div className="flex justify-between items-center py-monday-3">
          <span className="text-monday-sm font-medium text-monday-text-secondary">最近一次备份:</span>
          <span className="text-monday-base text-monday-text">暂无备份记录</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-monday-6">
      <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6 tracking-tight">备份状态</h2>
      <div className="space-y-monday-4">
        <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
          <span className="text-monday-sm font-semibold text-monday-text">最近一次备份时间:</span>
          <span className="text-monday-base text-monday-text font-normal">{formatDate(status.lastBackupTime)}</span>
        </div>
        <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
          <span className="text-monday-sm font-semibold text-monday-text">备份状态:</span>
          <span className={`px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium ${
            status.lastBackupStatus === 'success' ? 'bg-primary-green/20 text-primary-green' :
            status.lastBackupStatus === 'failed' ? 'bg-primary-red/20 text-primary-red' :
            'bg-gray-100 text-monday-text-secondary'
          }`}>
            {status.lastBackupStatus === 'success' ? '成功' : 
             status.lastBackupStatus === 'failed' ? '失败' : '未知'}
          </span>
        </div>
        {status.lastBackupFileSize !== undefined && (
          <div className="flex justify-between items-center py-monday-3 border-b border-gray-200">
            <span className="text-monday-sm font-semibold text-monday-text">备份文件大小:</span>
            <span className="text-monday-base text-monday-text font-normal">{formatFileSize(status.lastBackupFileSize)}</span>
          </div>
        )}
        {status.lastBackupError && (
          <div className="flex justify-between items-center py-monday-3">
            <span className="text-monday-sm font-semibold text-monday-text">错误信息:</span>
            <span className="text-monday-base text-semantic-error">{status.lastBackupError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

