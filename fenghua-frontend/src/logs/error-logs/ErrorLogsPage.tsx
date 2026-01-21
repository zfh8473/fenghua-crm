/**
 * Error Logs Page
 * 
 * Displays error logs
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getErrorLogs, ErrorLogEntry, ErrorType, PaginatedErrorLogResponse } from '../error-logs.service';
import { UserRole } from '../../common/constants/roles';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MainLayout } from '../../components/layout';
import { getErrorMessage } from '../../utils/error-handling';
// import './ErrorLogsPage.css'; // Removed

export function ErrorLogsPage() {
  const { currentUser, token } = useAuth();
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    type: '' as ErrorType | '',
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
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data: PaginatedErrorLogResponse = await getErrorLogs(token, params);
      setLogs(data.data);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, '加载错误日志失败'));
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
      <MainLayout title="错误日志">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-4 bg-semantic-error/10 border border-semantic-error rounded-monday-md text-semantic-error text-monday-base" role="alert">
            只有管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="错误日志">
      <div className="space-y-monday-6">
        {error && (
          <div className="bg-semantic-error/10 border border-semantic-error text-semantic-error p-monday-4 rounded-monday-md" role="alert">
            {error}
          </div>
        )}

        {/* 筛选器卡片 */}
        <Card variant="default" className="w-full p-monday-5">
          <div className="flex items-center gap-monday-6 flex-nowrap">
            <div className="flex items-center gap-monday-3 min-w-0 flex-1">
              <label htmlFor="filter-error-type" className="text-monday-base text-uipro-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                错误类型
              </label>
              <select
                id="filter-error-type"
                value={filters.type}
                onChange={(e) => {
                  setFilters({ ...filters, type: e.target.value as ErrorType | '' });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="flex-1 min-w-0 py-monday-2 px-monday-3 text-monday-sm text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta font-normal hover:border-gray-300 cursor-pointer"
              >
                <option value="">全部类型</option>
                <option value={ErrorType.SYSTEM}>系统错误</option>
                <option value={ErrorType.BUSINESS}>业务错误</option>
                <option value={ErrorType.USER}>用户错误</option>
              </select>
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1">
              <label htmlFor="filter-error-start-date" className="text-monday-base text-uipro-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                开始日期
              </label>
              <Input
                id="filter-error-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1">
              <label htmlFor="filter-error-end-date" className="text-monday-base text-uipro-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                结束日期
              </label>
              <Input
                id="filter-error-end-date"
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

        {/* 错误日志列表卡片 */}
        <Card variant="default" className="w-full p-monday-6">
          {isLoading ? (
            <div className="p-monday-6 space-y-3" aria-busy="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-monday-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-monday-2xl font-bold text-uipro-text font-uipro-heading mb-monday-6 tracking-tight">错误日志列表</h2>

              {logs.length === 0 ? (
                <div className="text-center p-monday-12">
                  <div className="text-uipro-secondary text-monday-base font-medium">暂无错误日志</div>
                  <div className="text-uipro-secondary text-monday-sm mt-monday-2">当前筛选条件下没有找到错误日志</div>
                </div>
              ) : (
                <div className="space-y-monday-3 mb-monday-6">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="p-monday-5 border border-gray-200 rounded-monday-lg bg-monday-surface hover:border-gray-300 hover:shadow-monday-sm transition-all duration-200"
                    >
                      {/* 头部：时间、类型标签、操作按钮 */}
                      <div className="flex items-center gap-monday-3 mb-monday-3 flex-wrap">
                        <div className="flex items-center gap-monday-2">
                          <span className="text-monday-sm text-uipro-secondary font-mono">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        <span className={`inline-flex items-center px-monday-3 py-monday-1.5 rounded-monday-md text-monday-xs font-semibold ${
                          log.type === ErrorType.SYSTEM
                            ? 'bg-semantic-error/15 text-semantic-error border border-semantic-error/30'
                            : log.type === ErrorType.BUSINESS
                            ? 'bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30'
                            : 'bg-uipro-cta/15 text-uipro-cta border border-uipro-cta/30'
                        }`}>
                          {log.type === ErrorType.SYSTEM ? '系统错误' : log.type === ErrorType.BUSINESS ? '业务错误' : '用户错误'}
                        </span>
                        {log.stack && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            className="ml-auto text-uipro-cta hover:bg-uipro-cta/10 border border-transparent hover:border-uipro-cta/20 transition-colors duration-200 cursor-pointer"
                          >
                            {expandedIndex === index ? '收起堆栈' : '展开堆栈'}
                          </Button>
                        )}
                      </div>
                      
                      {/* 错误消息 */}
                      <div className="text-monday-base font-semibold text-monday-text mb-monday-3 leading-relaxed">
                        {log.message}
                      </div>
                      
                      {/* 附加信息 */}
                      <div className="space-y-monday-1.5">
                        {log.requestPath && (
                          <div className="flex items-center gap-monday-2 text-monday-sm text-uipro-secondary">
                            <span className="font-mono">路径: {log.requestPath}</span>
                          </div>
                        )}
                        {log.userId && (
                          <div className="flex items-center gap-monday-2 text-monday-sm text-uipro-secondary">
                            <span>用户 ID: {log.userId}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 堆栈跟踪 */}
                      {expandedIndex === index && log.stack && (
                        <div className="mt-monday-4 pt-monday-4 border-t border-gray-200">
                          <div className="flex items-center gap-monday-2 mb-monday-2">
                            <span className="text-monday-xs font-semibold text-uipro-secondary">堆栈跟踪</span>
                          </div>
                          <pre className="p-monday-4 bg-monday-bg rounded-monday-md font-mono text-monday-xs overflow-x-auto whitespace-pre-wrap break-all text-uipro-secondary border border-gray-200 leading-relaxed">
                            {log.stack}
                          </pre>
                        </div>
                      )}
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
                    className="bg-gray-50 hover:bg-gray-100 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                  >
                    ← 上一页
                  </Button>
                  <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-monday-bg rounded-monday-md border border-gray-200">
                    <span className="text-monday-sm font-semibold text-uipro-secondary">第</span>
                    <span className="text-monday-base font-bold text-uipro-cta">{pagination.page}</span>
                    <span className="text-monday-sm font-semibold text-uipro-secondary">页，共</span>
                    <span className="text-monday-base font-bold text-uipro-text">{pagination.totalPages}</span>
                    <span className="text-monday-sm font-semibold text-uipro-secondary">页</span>
                    <span className="text-monday-sm text-uipro-secondary mx-monday-2">|</span>
                    <span className="text-monday-sm font-semibold text-uipro-secondary">共</span>
                    <span className="text-monday-base font-bold text-uipro-text">{pagination.total}</span>
                    <span className="text-monday-sm font-semibold text-uipro-secondary">条</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    className="bg-gray-50 hover:bg-gray-100 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
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

