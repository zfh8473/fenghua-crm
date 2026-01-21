/**
 * Backup Status Page
 * 
 * Displays backup status and history
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getBackupStatus, getBackupHistory, BackupStatus, BackupMetadata } from './backup.service';
import { BackupStatusPanel } from './components/BackupStatusPanel';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/layout';
// import './BackupStatusPage.css'; // Removed

export const BackupStatusPage: React.FC = () => {
  const { token } = useAuth();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [history, setHistory] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      setError('未认证，请重新登录');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [statusData, historyData] = await Promise.all([
        getBackupStatus(token),
        getBackupHistory(token, { limit: 50 }),
      ]);

      setStatus(statusData);
      setHistory(historyData.backups);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '加载备份状态失败';
      setError(errorMessage);
      console.error('Failed to load backup data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
      // Auto-refresh every 60 seconds
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
    }
  }, [token, loadData]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

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

  if (loading && !status) {
    return (
      <MainLayout title="数据备份状态">
        <Card variant="default" className="w-full">
          <div className="text-center p-monday-8 text-monday-text-secondary">加载中...</div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="数据备份状态">
      <div className="space-y-monday-4">
        {error && (
          <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md flex justify-between items-center" role="alert">
            <span>{error}</span>
            <Button onClick={loadData} variant="outline" size="sm" className="bg-gray-50 hover:bg-gray-100 border-gray-300">
              重试
            </Button>
          </div>
        )}

        <Card variant="default" className="w-full">
          <BackupStatusPanel status={status} />
        </Card>

        <Card variant="default" className="w-full">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6 tracking-tight">备份历史（最近 30 天）</h2>
          
          {history.length === 0 ? (
            <div className="text-center p-monday-12 text-monday-text-secondary text-monday-base">暂无备份记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-monday-bg border-b border-gray-200">
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">时间</th>
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">状态</th>
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">文件大小</th>
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((backup) => (
                    <tr key={backup.id} className={`border-b border-gray-200 hover:bg-monday-bg transition-colors duration-150 ${backup.status === 'failed' ? 'bg-semantic-error/5' : ''}`}>
                      <td className="p-monday-2 px-monday-4 text-monday-sm text-monday-text">{formatDate(backup.timestamp)}</td>
                      <td className="p-monday-2 px-monday-4 text-monday-sm">
                        <span className={`px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium ${
                          backup.status === 'success' ? 'bg-semantic-success/15 text-semantic-success' :
                          backup.status === 'failed' ? 'bg-semantic-error/15 text-semantic-error' :
                          'bg-gray-100 text-monday-text-secondary'
                        }`}>
                          {backup.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td className="p-monday-2 px-monday-4 text-monday-sm text-monday-text">{formatFileSize(backup.fileSize)}</td>
                      <td className="p-monday-2 px-monday-4 text-monday-sm">
                        <Button
                          onClick={() => setSelectedBackup(backup)}
                          variant="secondary"
                          size="sm"
                          className="bg-primary-blue/10 border-primary-blue/30 text-primary-blue hover:bg-primary-blue/20 hover:border-primary-blue/50"
                        >
                          查看详情
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selectedBackup && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50" 
            onClick={() => setSelectedBackup(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSelectedBackup(null);
              }
            }}
            role="presentation"
            tabIndex={-1}
          >
            <Card variant="default" className="max-w-2xl w-full max-h-[80vh] overflow-y-auto bg-monday-surface" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="backup-details-title">
              <div className="flex justify-between items-center mb-monday-6 pb-monday-4 border-b border-gray-200">
                <h3 id="backup-details-title" className="text-monday-xl font-semibold text-monday-text">备份详情</h3>
                <Button
                  onClick={() => setSelectedBackup(null)}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-monday-text hover:text-semantic-error cursor-pointer transition-colors duration-200"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-monday-4">
                <div className="flex flex-col gap-monday-2">
                  <div className="text-monday-sm font-semibold text-monday-text">备份 ID:</div>
                  <span className="text-monday-base text-monday-text font-normal">{selectedBackup.id}</span>
                </div>
                <div className="flex flex-col gap-monday-2">
                  <div className="text-monday-sm font-semibold text-monday-text">时间:</div>
                  <span className="text-monday-base text-monday-text font-normal">{formatDate(selectedBackup.timestamp)}</span>
                </div>
                <div className="flex flex-col gap-monday-2">
                  <div className="text-monday-sm font-semibold text-monday-text">状态:</div>
                  <span className={`px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium inline-block w-fit ${
                    selectedBackup.status === 'success' ? 'bg-primary-green/20 text-primary-green' :
                    selectedBackup.status === 'failed' ? 'bg-primary-red/20 text-primary-red' :
                    'bg-gray-100 text-monday-text-secondary'
                  }`}>
                    {selectedBackup.status === 'success' ? '成功' : '失败'}
                  </span>
                </div>
                <div className="flex flex-col gap-monday-2">
                  <div className="text-monday-sm font-semibold text-monday-text">文件大小:</div>
                  <span className="text-monday-base text-monday-text font-normal">{formatFileSize(selectedBackup.fileSize)}</span>
                </div>
                <div className="flex flex-col gap-monday-2">
                  <div className="text-monday-sm font-semibold text-monday-text">文件路径:</div>
                  <span className="text-monday-sm font-mono bg-monday-bg p-monday-2 rounded-monday-md text-monday-text-secondary break-all border border-gray-200">{selectedBackup.filePath}</span>
                </div>
                <div className="flex flex-col gap-monday-2">
                  <div className="text-monday-sm font-semibold text-monday-text">校验和:</div>
                  <span className="text-monday-sm font-mono bg-monday-bg p-monday-2 rounded-monday-md text-monday-text-secondary break-all border border-gray-200">{selectedBackup.checksum}</span>
                </div>
                <div className="flex flex-col gap-monday-2">
                  <div className="text-monday-sm font-semibold text-monday-text">数据库:</div>
                  <span className="text-monday-base text-monday-text font-normal">{selectedBackup.databaseName}</span>
                </div>
                {selectedBackup.errorMessage && (
                  <div className="flex flex-col gap-monday-2">
                    <div className="text-monday-sm font-semibold text-monday-text">错误信息:</div>
                    <span className="text-monday-base text-semantic-error">{selectedBackup.errorMessage}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

