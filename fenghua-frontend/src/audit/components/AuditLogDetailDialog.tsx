/**
 * Audit Log Detail Dialog
 * 
 * Displays detailed information about an audit log entry
 */

import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AuditLog } from '../services/audit-log.service';

interface AuditLogDetailDialogProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDetailDialog: React.FC<AuditLogDetailDialogProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !log) {
    return null;
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action: string): string => {
    const actionMap: Record<string, string> = {
      DATA_ACCESS: '数据访问',
      ROLE_CHANGE: '角色变更',
      PERMISSION_VIOLATION: '权限违规',
      PERMISSION_VERIFICATION: '权限验证',
    };
    return actionMap[action] || action;
  };

  const getEntityTypeLabel = (entityType: string): string => {
    const typeMap: Record<string, string> = {
      CUSTOMER: '客户',
      PRODUCT: '产品',
      INTERACTION: '互动记录',
      USER: '用户',
      DASHBOARD: '仪表盘',
    };
    return typeMap[entityType] || entityType;
  };

  const getOperationResult = (): string => {
    if (log.metadata?.operationResult) {
      return log.metadata.operationResult === 'SUCCESS' ? '成功' : '失败';
    }
    return '未知';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card
        variant="default"
        className="max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-linear-6">
          <div className="flex items-center justify-between mb-linear-6">
            <h2 className="text-linear-2xl font-bold text-linear-text">审计日志详情</h2>
            <Button variant="secondary" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>

          <div className="space-y-linear-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-linear-4">
              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  操作类型
                </label>
                <div className="text-linear-base text-linear-text">
                  <span className="px-linear-2 py-linear-1 bg-primary-blue text-white rounded-linear-md text-linear-xs font-semibold">
                    {getActionLabel(log.action)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  操作结果
                </label>
                <div className="text-linear-base text-linear-text">
                  {getOperationResult()}
                </div>
              </div>

              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  资源类型
                </label>
                <div className="text-linear-base text-linear-text">
                  {getEntityTypeLabel(log.entityType)}
                </div>
              </div>

              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  资源ID
                </label>
                <div className="text-linear-base text-linear-text font-mono">
                  {log.entityId}
                </div>
              </div>

              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  用户ID
                </label>
                <div className="text-linear-base text-linear-text font-mono">
                  {log.userId}
                </div>
              </div>

              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  操作者邮箱
                </label>
                <div className="text-linear-base text-linear-text">
                  {log.operatorEmail || '未知'}
                </div>
              </div>

              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  操作时间
                </label>
                <div className="text-linear-base text-linear-text">
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>

              {log.ipAddress && (
                <div>
                  <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                    IP地址
                  </label>
                  <div className="text-linear-base text-linear-text font-mono">
                    {log.ipAddress}
                  </div>
                </div>
              )}
            </div>

            {/* 用户代理 */}
            {log.userAgent && (
              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  用户代理
                </label>
                <div className="text-linear-base text-linear-text font-mono text-linear-sm bg-linear-surface p-linear-3 rounded-linear-md border border-gray-200 break-all">
                  {log.userAgent}
                </div>
              </div>
            )}

            {/* 失败原因 */}
            {log.reason && (
              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  失败原因
                </label>
                <div className="text-linear-base text-linear-text bg-primary-red/10 p-linear-3 rounded-linear-md border border-primary-red/20">
                  {log.reason}
                </div>
              </div>
            )}

            {/* 变更前值 */}
            {log.metadata && (log.metadata as any).oldValue && (
              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  变更前值
                </label>
                <div className="text-linear-xs text-linear-text-secondary bg-linear-surface p-linear-3 rounded-linear-md border border-gray-200 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                  {JSON.stringify((log.metadata as any).oldValue, null, 2)}
                </div>
              </div>
            )}

            {/* 变更后值 */}
            {log.metadata && (log.metadata as any).newValue && (
              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  变更后值
                </label>
                <div className="text-linear-xs text-linear-text-secondary bg-linear-surface p-linear-3 rounded-linear-md border border-gray-200 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                  {JSON.stringify((log.metadata as any).newValue, null, 2)}
                </div>
              </div>
            )}

            {/* 元数据 */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <label className="text-linear-sm font-semibold text-linear-text-secondary mb-linear-1 block">
                  元数据
                </label>
                <div className="text-linear-xs text-linear-text-secondary bg-linear-surface p-linear-3 rounded-linear-md border border-gray-200 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

