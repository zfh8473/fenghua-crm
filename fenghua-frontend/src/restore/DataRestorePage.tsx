/**
 * Data Restore Page
 * 
 * Allows administrators to restore database from backup
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getBackupHistory, BackupMetadata } from '../backup/backup.service';
import { executeRestore, getRestoreStatus, RestoreStatus } from './restore.service';
import { RestoreOperation } from './components/RestoreOperation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/layout';
import { getErrorMessage } from '../utils/error-handling';
// import './DataRestorePage.css'; // Removed

export const DataRestorePage: React.FC = () => {
  const { token } = useAuth();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadBackups = useCallback(async () => {
    if (!token) {
      setError('未认证，请重新登录');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const history = await getBackupHistory(token, { limit: 100, status: 'success' });
      setBackups(history.backups);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '加载备份列表失败'));
      console.error('Failed to load backups:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadBackups();
    }
  }, [token, loadBackups]);

  useEffect(() => {
    // Poll restore status if restore is in progress
    if (restoreId && token) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const pollStatus = async () => {
        try {
          const status = await getRestoreStatus(token, restoreId);
          setRestoreStatus(status);
          
          if (status.status !== 'running') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        } catch (err) {
          console.error('Failed to get restore status:', err);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      };

      // Poll immediately, then every 2 seconds
      pollStatus();
      intervalRef.current = setInterval(pollStatus, 2000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [restoreId, token]);

  const handleRestore = async () => {
    if (!selectedBackup || !token) return;

    try {
      setError(null);
      setShowConfirmDialog(false);
      
      const result = await executeRestore(token, selectedBackup.id);
      setRestoreId(result.restoreId);
      
      // Get initial status
      const status = await getRestoreStatus(token, result.restoreId);
      setRestoreStatus(status);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '恢复操作失败'));
      console.error('Failed to execute restore:', err);
    }
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <MainLayout title="数据恢复">
        <Card variant="default" className="w-full">
          <div className="text-center p-monday-8 text-monday-text-secondary">加载中...</div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="数据恢复">
      <div className="space-y-monday-4">
        {error && (
          <div className="bg-semantic-error/10 border border-semantic-error text-semantic-error p-monday-4 rounded-monday-md flex justify-between items-center" role="alert">
            <span>{error}</span>
            <Button onClick={loadBackups} variant="outline" size="sm" className="bg-gray-50 hover:bg-gray-100 border-gray-300">
              重试
            </Button>
          </div>
        )}

        {restoreStatus && (
          <Card variant="default" className="w-full">
            <RestoreOperation restoreStatus={restoreStatus} />
          </Card>
        )}

        <Card variant="default" className="w-full">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6 tracking-tight">选择备份文件</h2>
          
          {backups.length === 0 ? (
            <div className="text-center p-monday-12 text-monday-text-secondary text-monday-base">暂无可用的备份文件</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-monday-bg border-b border-gray-200">
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">时间</th>
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">文件大小</th>
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">数据库</th>
                    <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b border-gray-200 hover:bg-monday-bg transition-colors duration-150">
                      <td className="p-monday-2 px-monday-4 text-monday-sm text-monday-text">{formatDate(backup.timestamp)}</td>
                      <td className="p-monday-2 px-monday-4 text-monday-sm text-monday-text">{formatFileSize(backup.fileSize)}</td>
                      <td className="p-monday-2 px-monday-4 text-monday-sm text-monday-text">{backup.databaseName}</td>
                      <td className="p-monday-2 px-monday-4 text-monday-sm">
                        <Button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowConfirmDialog(true);
                          }}
                          variant="primary"
                          size="sm"
                          disabled={restoreStatus?.status === 'running'}
                        >
                          恢复
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {showConfirmDialog && selectedBackup && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50" 
            onClick={() => setShowConfirmDialog(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowConfirmDialog(false);
              }
            }}
            role="presentation"
            tabIndex={-1}
          >
            <Card variant="default" className="max-w-md w-full bg-monday-surface" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="restore-confirm-title">
              <h3 id="restore-confirm-title" className="text-monday-xl font-semibold text-monday-text mb-monday-4">确认恢复</h3>
              <p className="text-monday-base text-monday-text mb-monday-2">
                确定要从备份 <strong>{formatDate(selectedBackup.timestamp)}</strong> 恢复数据吗？
              </p>
              <p className="text-monday-base text-semantic-error font-medium mb-monday-6">
                此操作将覆盖当前数据。系统会在恢复前自动创建快照备份。
              </p>
              <div className="flex justify-end gap-monday-3">
                <Button
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                  className="bg-gray-50 hover:bg-gray-100 border-gray-300"
                >
                  取消
                </Button>
                <Button
                  onClick={handleRestore}
                  variant="primary"
                >
                  确认恢复
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

