/**
 * Audit Logs Page
 * 
 * Displays audit logs
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AuditLogService, AuditLog, AuditLogQueryParams } from '../audit/services/audit-log.service';
import { UserRole } from '../common/constants/roles';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/layout';
import { AuditLogDetailDialog } from '../audit/components/AuditLogDetailDialog';
import { getErrorMessage } from '../utils/error-handling';
// import './AuditLogsPage.css'; // Removed

export function AuditLogsPage() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    action: '',
    operatorId: '',
    operatorEmail: '',
    entityType: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filters.action, filters.operatorId, filters.operatorEmail, filters.entityType, filters.startDate, filters.endDate, pagination.page]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: AuditLogQueryParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      const data = await AuditLogService.getAuditLogs(params);
      setLogs(data.data);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err) || '加载审计日志失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setIsExporting(true);
      const params: AuditLogQueryParams & { format?: 'csv' | 'excel' } = {
        ...filters,
        format,
      };

      const blob = await AuditLogService.exportAuditLogs(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogClick = async (log: AuditLog) => {
    // If log has an ID, fetch detailed information; otherwise, use the log we have
    if (log.id) {
      try {
        const detailedLog = await AuditLogService.getAuditLogById(log.id);
        setSelectedLog(detailedLog);
        setIsDetailDialogOpen(true);
      } catch (err: unknown) {
        // If getAuditLogById fails, just show the log we have
        console.error('Failed to fetch audit log details:', getErrorMessage(err));
        setSelectedLog(log);
        setIsDetailDialogOpen(true);
      }
    } else {
      // No ID available, just show the log we have
      setSelectedLog(log);
      setIsDetailDialogOpen(true);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  if (!isAdmin) {
    return (
      <MainLayout title="审计日志">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-linear-4 bg-primary-red/20 border border-primary-red rounded-linear-md text-primary-red text-linear-base" role="alert">
            只有管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="审计日志">
      <div className="space-y-linear-6">
        {error && (
          <div className="bg-primary-red/20 border border-primary-red text-primary-red p-linear-4 rounded-linear-md" role="alert">
            {error}
          </div>
        )}

        {/* 筛选器卡片 */}
        <Card variant="default" className="w-full p-linear-5">
          <div className="flex items-center gap-linear-6 flex-wrap">
            <div className="flex items-center gap-linear-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-action" className="text-linear-base text-linear-text-secondary font-semibold flex items-center gap-linear-1.5 whitespace-nowrap flex-shrink-0">
                <span>⚡</span>
                <span>操作类型</span>
              </label>
              <Input
                id="filter-action"
                type="text"
                value={filters.action}
                onChange={(e) => {
                  setFilters({ ...filters, action: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="如: CREATE, UPDATE, DELETE"
                className="flex-1 min-w-0 font-normal py-linear-2 text-linear-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-operator-id" className="text-linear-base text-linear-text-secondary font-semibold flex items-center gap-linear-1.5 whitespace-nowrap flex-shrink-0">
                <span>👤</span>
                <span>操作者 ID</span>
              </label>
              <Input
                id="filter-operator-id"
                type="text"
                value={filters.operatorId}
                onChange={(e) => {
                  setFilters({ ...filters, operatorId: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="搜索操作者 ID"
                className="flex-1 min-w-0 font-normal py-linear-2 text-linear-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-operator-email" className="text-linear-base text-linear-text-secondary font-semibold flex items-center gap-linear-1.5 whitespace-nowrap flex-shrink-0">
                <span>📧</span>
                <span>操作者邮箱</span>
              </label>
              <Input
                id="filter-operator-email"
                type="text"
                value={filters.operatorEmail || ''}
                onChange={(e) => {
                  setFilters({ ...filters, operatorEmail: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="搜索操作者邮箱"
                className="flex-1 min-w-0 font-normal py-linear-2 text-linear-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-entity-type" className="text-linear-base text-linear-text-secondary font-semibold flex items-center gap-linear-1.5 whitespace-nowrap flex-shrink-0">
                <span>📦</span>
                <span>资源类型</span>
              </label>
              <select
                id="filter-entity-type"
                value={filters.entityType || ''}
                onChange={(e) => {
                  setFilters({ ...filters, entityType: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="flex-1 min-w-0 py-linear-2 px-linear-3 text-linear-sm text-linear-text bg-linear-surface border border-gray-200 rounded-linear-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-normal hover:border-gray-300"
              >
                <option value="">全部</option>
                <option value="CUSTOMER">客户</option>
                <option value="PRODUCT">产品</option>
                <option value="INTERACTION">互动记录</option>
                <option value="USER">用户</option>
                <option value="DASHBOARD">仪表盘</option>
              </select>
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-start-date" className="text-linear-base text-linear-text-secondary font-semibold flex items-center gap-linear-1.5 whitespace-nowrap flex-shrink-0">
                <span>📅</span>
                <span>开始日期</span>
              </label>
              <Input
                id="filter-start-date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="flex-1 min-w-0 font-normal py-linear-2 text-linear-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-end-date" className="text-linear-base text-linear-text-secondary font-semibold flex items-center gap-linear-1.5 whitespace-nowrap flex-shrink-0">
                <span>📅</span>
                <span>结束日期</span>
              </label>
              <Input
                id="filter-end-date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="flex-1 min-w-0 font-normal py-linear-2 text-linear-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-linear-3 mt-linear-4 pt-linear-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              {isExporting ? '导出中...' : '导出 CSV'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              {isExporting ? '导出中...' : '导出 Excel'}
            </Button>
          </div>
        </Card>

        {/* 审计日志列表卡片 */}
        <Card variant="default" className="w-full p-linear-6">
          {isLoading ? (
            <div className="text-center p-linear-12">
              <div className="inline-block animate-spin text-linear-4xl mb-linear-4">⏳</div>
              <div className="text-linear-text-secondary text-linear-base font-medium">加载中...</div>
            </div>
          ) : (
            <>
              <h2 className="text-linear-2xl font-bold text-linear-text mb-linear-6 tracking-tight">审计日志列表</h2>
              
              {logs.length === 0 ? (
                <div className="text-center p-linear-12">
                  <div className="text-linear-4xl mb-linear-4">📋</div>
                  <div className="text-linear-text-secondary text-linear-base font-medium">暂无审计日志</div>
                  <div className="text-linear-text-placeholder text-linear-sm mt-linear-2">当前筛选条件下没有找到审计日志</div>
                </div>
              ) : (
                <div className="space-y-linear-3 mb-linear-6">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="p-linear-5 border border-gray-200 rounded-linear-lg bg-linear-surface hover:border-gray-300 hover:shadow-linear-sm transition-all duration-200 cursor-pointer"
                      onClick={() => handleLogClick(log)}
                    >
                      <div className="flex items-center gap-linear-3 mb-linear-3">
                        <span className="text-linear-sm text-linear-text-secondary font-mono">{formatTimestamp(log.timestamp)}</span>
                        <span className="px-linear-3 py-linear-1.5 bg-primary-blue text-white rounded-linear-md text-linear-xs font-semibold">
                          {log.action}
                        </span>
                        {log.metadata?.operationResult && (
                          <span className={`px-linear-3 py-linear-1.5 rounded-linear-md text-linear-xs font-semibold ${
                            log.metadata.operationResult === 'SUCCESS' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.metadata.operationResult === 'SUCCESS' ? '成功' : '失败'}
                          </span>
                        )}
                      </div>
                      <div className="text-linear-sm text-linear-text space-y-linear-2">
                        <div className="grid grid-cols-2 gap-linear-4">
                          <div>
                            <span className="text-linear-text-secondary">操作者:</span>{' '}
                            {log.operatorEmail || log.operatorId}
                          </div>
                          <div>
                            <span className="text-linear-text-secondary">资源类型:</span>{' '}
                            {log.entityType}
                          </div>
                          {log.ipAddress && (
                            <div>
                              <span className="text-linear-text-secondary">IP地址:</span>{' '}
                              <span className="font-mono">{log.ipAddress}</span>
                            </div>
                          )}
                        </div>
                        {log.reason && (
                          <div className="text-linear-xs text-primary-red bg-primary-red/10 p-linear-2 rounded-linear-md">
                            失败原因: {log.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {pagination.totalPages > 0 && (
                <div className="flex justify-center items-center gap-linear-4 pt-linear-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    className="bg-gray-50 hover:bg-gray-100 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← 上一页
                  </Button>
                  <div className="flex items-center gap-linear-2 px-linear-4 py-linear-2 bg-linear-surface rounded-linear-md border border-gray-200">
                    <span className="text-linear-sm font-semibold text-linear-text-secondary">第</span>
                    <span className="text-linear-base font-bold text-primary-blue">{pagination.page}</span>
                    <span className="text-linear-sm font-semibold text-linear-text-secondary">页，共</span>
                    <span className="text-linear-base font-bold text-linear-text">{pagination.totalPages}</span>
                    <span className="text-linear-sm font-semibold text-linear-text-secondary">页</span>
                    <span className="text-linear-sm text-linear-text-placeholder mx-linear-2">|</span>
                    <span className="text-linear-sm font-semibold text-linear-text-secondary">共</span>
                    <span className="text-linear-base font-bold text-linear-text">{pagination.total}</span>
                    <span className="text-linear-sm font-semibold text-linear-text-secondary">条</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    className="bg-gray-50 hover:bg-gray-100 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    下一页 →
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Detail Dialog */}
        <AuditLogDetailDialog
          log={selectedLog}
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setSelectedLog(null);
          }}
        />
      </div>
    </MainLayout>
  );
}

