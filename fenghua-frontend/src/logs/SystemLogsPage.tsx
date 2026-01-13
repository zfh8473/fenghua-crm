/**
 * System Logs Page
 * 
 * Displays system logs
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getLogs, LogEntry, LogLevel, PaginatedLogResponse } from './logs.service';
import { LogsList } from './components/LogsList';
import { UserRole } from '../common/constants/roles';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/layout';
import { getErrorMessage } from '../utils/error-handling';
// import './SystemLogsPage.css'; // Removed

export function SystemLogsPage() {
  const { currentUser, token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: '' as LogLevel | '',
    startDate: '',
    endDate: '',
    userId: '',
    keyword: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const loadLogs = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.level) params.level = filters.level;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.userId) params.userId = filters.userId;
      if (filters.keyword) params.keyword = filters.keyword;

      const data: PaginatedLogResponse = await getLogs(token, params);
      setLogs(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
      retryCountRef.current = 0; // Reset retry count on success
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, '加载日志失败');
      // Check for retryable server errors
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number } }).response;
        if (response?.status === 401) {
          setError('认证失败，请重新登录');
        } else if (response?.status === 403) {
          setError('权限不足，只有管理员可以查看日志');
        } else if (response?.status && response.status >= 500) {
          setError('服务器错误，请稍后重试');
          // Retry on server errors
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            setTimeout(() => loadLogs(), 2000 * retryCountRef.current);
            return;
          }
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
      retryCountRef.current = 0; // Reset retry count on success or non-retryable error
      console.error('Failed to load logs', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (!isAdmin || !token) {
      return;
    }

    loadLogs();
  }, [isAdmin, token, loadLogs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };

  if (!isAdmin) {
    return (
      <MainLayout title="系统日志">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-base" role="alert">
            只有管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="系统日志">
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
              <label htmlFor="filter-log-level" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                <span>📊</span>
                <span>日志级别</span>
              </label>
              <select
                id="filter-log-level"
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="flex-1 min-w-0 py-monday-2 px-monday-3 text-monday-sm text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-normal hover:border-gray-300"
              >
                <option value="">全部</option>
                <option value={LogLevel.ERROR}>Error</option>
                <option value={LogLevel.WARN}>Warn</option>
                <option value={LogLevel.INFO}>Info</option>
                <option value={LogLevel.DEBUG}>Debug</option>
              </select>
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
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
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
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-user-id" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                <span>👤</span>
                <span>用户 ID</span>
              </label>
              <Input
                id="filter-user-id"
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="搜索用户 ID"
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>

            <div className="flex items-center gap-monday-3 min-w-0 flex-1 min-w-[200px]">
              <label htmlFor="filter-keyword" className="text-monday-base text-monday-text-secondary font-semibold flex items-center gap-monday-1.5 whitespace-nowrap flex-shrink-0">
                <span>🔍</span>
                <span>关键词</span>
              </label>
              <Input
                id="filter-keyword"
                type="text"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                placeholder="搜索日志内容"
                className="flex-1 min-w-0 font-normal py-monday-2 text-monday-sm"
              />
            </div>
          </div>
        </Card>

        {/* 日志列表卡片 */}
        <Card variant="default" className="w-full p-monday-6">
          {isLoading ? (
            <div className="text-center p-monday-12">
              <div className="inline-block animate-spin text-monday-4xl mb-monday-4">⏳</div>
              <div className="text-monday-text-secondary text-monday-base font-medium">加载中...</div>
            </div>
          ) : (
            <>
              <h2 className="text-monday-2xl font-bold text-monday-text mb-monday-6 tracking-tight">系统日志列表</h2>
              <LogsList logs={logs} />
              
              {/* 分页 */}
              {pagination.totalPages > 0 && (
                <div className="flex justify-center items-center gap-monday-4 pt-monday-6 border-t border-gray-200 mt-monday-6">
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

