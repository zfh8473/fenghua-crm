/**
 * Audit Logs Page
 * 
 * Displays audit logs
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getAuditLogs, AuditLogEntry, PaginatedAuditLogResponse } from './audit-logs.service';
import { UserRole } from '../common/constants/roles';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/layout';
// import './AuditLogsPage.css'; // Removed

export function AuditLogsPage() {
  const { currentUser, token } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    operatorId: '',
    operatorEmail: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isAdmin || !token) {
      return;
    }

    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token, filters, pagination.page]);

  const loadLogs = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.action) params.action = filters.action;
      if (filters.operatorId) params.operatorId = filters.operatorId;
      if (filters.operatorEmail) params.operatorEmail = filters.operatorEmail;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data: PaginatedAuditLogResponse = await getAuditLogs(token, params);
      setLogs(data.data);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '加载审计日志失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
          <div className="p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-base" role="alert">
            只有管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="审计日志">
      <div className="space-y-monday-6">
        {error && (
          <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md" role="alert">
            {error}
          </div>
        )}

        {/* 筛选器卡片 */}
        <Card variant="default" className="w-full p-monday-5">
          <div className="flex items-center gap-monday-6 flex-wrap">
            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-action" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
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
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-operator-id" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
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
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-operator-email" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                <span>📧</span>
                <span>操作者邮箱</span>
              </label>
              <Input
                id="filter-operator-email"
                type="text"
                value={filters.operatorEmail}
                onChange={(e) => {
                  setFilters({ ...filters, operatorEmail: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="搜索操作者邮箱"
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-start-date" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                <span>📅</span>
                <span>开始日期</span>
              </label>
              <Input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-end-date" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                <span>📅</span>
                <span>结束日期</span>
              </label>
              <Input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>
          </div>
        </Card>

        {/* 审计日志列表卡片 */}
        <Card variant="default" className="w-full p-monday-6">
          {isLoading ? (
            <div className="text-center p-monday-12">
              <div className="inline-block animate-spin text-monday-4xl mb-monday-4">⏳</div>
              <div className="text-monday-text-secondary text-monday-base font-medium">加载中...</div>
            </div>
          ) : (
            <>
              <h2 className="text-monday-2xl font-bold text-monday-text mb-monday-6 tracking-tight">审计日志列表</h2>
              
              {logs.length === 0 ? (
                <div className="text-center p-monday-12">
                  <div className="text-monday-4xl mb-monday-4">📋</div>
                  <div className="text-monday-text-secondary text-monday-base font-medium">暂无审计日志</div>
                  <div className="text-monday-text-placeholder text-monday-sm mt-monday-2">当前筛选条件下没有找到审计日志</div>
                </div>
              ) : (
                <div className="space-y-monday-3 mb-monday-6">
                  {logs.map((log, index) => (
                    <div key={index} className="p-monday-5 border border-gray-200 rounded-monday-lg bg-monday-surface hover:border-gray-300 hover:shadow-monday-sm transition-all duration-200">
                      <div className="flex items-center gap-monday-3 mb-monday-3">
                        <span className="text-monday-sm text-monday-text-secondary font-mono">{formatTimestamp(log.timestamp)}</span>
                        <span className="px-monday-3 py-monday-1.5 bg-primary-blue text-white rounded-monday-md text-monday-xs font-semibold">
                          {log.action}
                        </span>
                      </div>
                      <div className="text-monday-sm text-monday-text space-y-monday-2">
                        <div>操作者 ID: {log.operatorId}</div>
                        {log.operatorEmail && (
                          <div>操作者邮箱: {log.operatorEmail}</div>
                        )}
                        <div>实体类型: {log.entityType}</div>
                        <div>实体 ID: {log.entityId}</div>
                        {log.oldValue && (
                          <div className="mt-monday-2 p-monday-3 bg-monday-bg rounded-monday-md font-mono text-monday-xs whitespace-pre-wrap break-all text-monday-text-secondary border border-gray-200">
                            <strong className="text-monday-text">变更前:</strong> {JSON.stringify(log.oldValue, null, 2)}
                          </div>
                        )}
                        {log.newValue && (
                          <div className="mt-monday-2 p-monday-3 bg-monday-bg rounded-monday-md font-mono text-monday-xs whitespace-pre-wrap break-all text-monday-text-secondary border border-gray-200">
                            <strong className="text-monday-text">变更后:</strong> {JSON.stringify(log.newValue, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {pagination.totalPages > 0 && (
                <div className="flex justify-center items-center gap-monday-4 pt-monday-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    className="bg-gray-50 hover:bg-gray-100 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← 上一页
                  </Button>
                  <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-monday-bg rounded-monday-md border border-gray-200">
                    <span className="text-monday-sm font-semibold text-monday-text-secondary">第</span>
                    <span className="text-monday-base font-bold text-primary-blue">{pagination.page}</span>
                    <span className="text-monday-sm font-semibold text-monday-text-secondary">页，共</span>
                    <span className="text-monday-base font-bold text-monday-text">{pagination.totalPages}</span>
                    <span className="text-monday-sm font-semibold text-monday-text-secondary">页</span>
                    <span className="text-monday-sm text-monday-text-placeholder mx-monday-2">|</span>
                    <span className="text-monday-sm font-semibold text-monday-text-secondary">共</span>
                    <span className="text-monday-base font-bold text-monday-text">{pagination.total}</span>
                    <span className="text-monday-sm font-semibold text-monday-text-secondary">条</span>
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
      </div>
    </MainLayout>
  );
}

