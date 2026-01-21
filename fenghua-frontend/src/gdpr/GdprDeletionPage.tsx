/**
 * GDPR Deletion Page
 * 
 * Page for GDPR data deletion requests
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { gdprDeletionService, GdprDeletionRequestResponseDto, GdprDeletionRequestListResponseDto } from './services/gdpr-deletion.service';
import { Card } from '../components/ui/Card';
import { MainLayout } from '../components/layout/MainLayout';
import { UserRole } from '../common/constants/roles';
import { getErrorMessage } from '../utils/error-handling';

export function GdprDeletionPage() {
  const { user, token } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requests, setRequests] = useState<GdprDeletionRequestResponseDto[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const requestsRef = useRef<GdprDeletionRequestResponseDto[]>([]);
  const loadRequestsRef = useRef<(() => Promise<boolean>) | null>(null);
  const pollingStateRef = useRef<{
    interval: NodeJS.Timeout | null;
    shouldPoll: boolean;
    consecutiveErrors: number;
  }>({
    interval: null,
    shouldPoll: true,
    consecutiveErrors: 0,
  });

  // Determine deletion option based on user role
  const getDeletionOption = (): string => {
    if (!user?.role) return '';
    const role = user.role.toUpperCase();
    if (role === UserRole.FRONTEND_SPECIALIST) {
      return '删除我的采购商数据';
    } else if (role === UserRole.BACKEND_SPECIALIST) {
      return '删除我的供应商数据';
    } else if (role === UserRole.DIRECTOR || role === UserRole.ADMIN) {
      return '删除我的所有数据';
    }
    return '';
  };

  // Load deletion requests
  const loadRequests = useCallback(async () => {
    if (!token) return false;

    try {
      setIsLoadingRequests(true);
      const response = await gdprDeletionService.getDeletionRequestList();
      setRequests(response.data);
      requestsRef.current = response.data;
      setError(null);
      return true;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, '加载删除请求列表失败');
      setError(errorMessage);
      
      if (import.meta.env.DEV) {
        console.error('[GdprDeletionPage] Failed to load deletion requests:', {
          error: err,
          errorMessage: errorMessage,
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          stack: err instanceof Error ? err.stack : undefined,
        });
      } else {
        console.error('Failed to load deletion requests:', err);
      }
      
      return false;
    } finally {
      setIsLoadingRequests(false);
    }
  }, [token]);

  // Store loadRequests in ref to avoid dependency issues
  useEffect(() => {
    loadRequestsRef.current = loadRequests;
  }, [loadRequests]);

  // Polling logic (10s interval, stops on terminal states)
  useEffect(() => {
    if (!token) return;

    const MAX_CONSECUTIVE_ERRORS = 3;
    const polling = pollingStateRef.current;
    
    polling.shouldPoll = true;
    polling.consecutiveErrors = 0;
    if (polling.interval) {
      clearInterval(polling.interval);
      polling.interval = null;
    }

    const pollRequests = async () => {
      if (!polling.shouldPoll || !loadRequestsRef.current) return;
      
      const success = await loadRequestsRef.current();
      
      if (!success) {
        polling.consecutiveErrors++;
        if (polling.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          polling.shouldPoll = false;
          if (polling.interval) {
            clearInterval(polling.interval);
            polling.interval = null;
          }
        }
        return;
      }

      polling.consecutiveErrors = 0;

      const currentRequests = requestsRef.current;
      const hasActiveRequests = currentRequests.some(
        (r) => r.status !== 'COMPLETED' && r.status !== 'FAILED' && r.status !== 'PARTIALLY_COMPLETED'
      );

      if (!hasActiveRequests && currentRequests.length > 0) {
        polling.shouldPoll = false;
        if (polling.interval) {
          clearInterval(polling.interval);
          polling.interval = null;
        }
      }
    };

    pollRequests();

    polling.interval = setInterval(() => {
      if (!polling.shouldPoll) {
        if (polling.interval) {
          clearInterval(polling.interval);
          polling.interval = null;
        }
        return;
      }
      pollRequests();
    }, 10000); // Poll every 10 seconds

    return () => {
      polling.shouldPoll = false;
      if (polling.interval) {
        clearInterval(polling.interval);
        polling.interval = null;
      }
    };
  }, [token]);

  // Handle deletion request submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('用户未登录');
      return;
    }

    if (confirmation !== '确认删除' && confirmation !== 'DELETE') {
      setError('必须输入"确认删除"或"DELETE"以确认删除操作');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await gdprDeletionService.createDeletionRequest({ confirmation });
      setSuccess('删除请求已创建，系统将根据数据保留策略处理您的数据');
      setConfirmation('');
      await loadRequests();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '创建删除请求失败'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status label in Chinese
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: '待处理',
      QUEUED: '已排队',
      PROCESSING: '处理中',
      COMPLETED: '已完成',
      FAILED: '失败',
      PARTIALLY_COMPLETED: '部分完成',
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      PENDING: 'text-yellow-600',
      QUEUED: 'text-blue-600',
      PROCESSING: 'text-blue-600',
      COMPLETED: 'text-green-600',
      FAILED: 'text-red-600',
      PARTIALLY_COMPLETED: 'text-orange-600',
    };
    return colorMap[status] || 'text-gray-600';
  };

  const deletionOption = getDeletionOption();

  return (
    <MainLayout title="GDPR 数据删除">
      <div className="space-y-monday-6">
        {/* Deletion Request Form */}
        <Card variant="default" className="max-w-2xl mx-auto">
          <div className="p-monday-6">
            <h2 className="text-monday-xl font-semibold mb-monday-4">创建删除请求</h2>
            <p className="text-monday-sm text-monday-text-secondary mb-monday-6">
              根据您的角色，您可以请求删除相关的数据。系统将根据数据保留策略和业务规则处理您的请求。
            </p>

            {/* Warning */}
            <div className="mb-monday-6 p-monday-4 bg-red-50 border border-red-200 rounded-monday-md">
              <div className="flex items-start gap-monday-3">
                <span className="text-red-600 text-monday-xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-monday-sm font-semibold text-red-800 mb-monday-2">重要警告</h3>
                  <ul className="text-monday-sm text-red-700 space-y-monday-1 list-disc list-inside">
                    <li>删除操作是不可逆的，请谨慎操作</li>
                    <li>系统将根据数据保留策略决定删除方式（软删除、硬删除或匿名化）</li>
                    <li>财务相关数据可能被匿名化而非完全删除</li>
                    <li>删除操作将记录到审计日志</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-monday-4 p-monday-3 bg-red-50 border border-red-200 rounded-monday-md text-red-700 text-monday-sm" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-monday-4 p-monday-3 bg-green-50 border border-green-200 rounded-monday-md text-green-700 text-monday-sm" role="alert">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-monday-4">
              <div>
                <label htmlFor="deletion-option" className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
                  删除选项
                </label>
                <input
                  id="deletion-option"
                  type="text"
                  value={deletionOption}
                  disabled
                  className="w-full px-monday-3 py-monday-2 border border-gray-300 rounded-monday-md bg-gray-50 text-monday-sm text-gray-600"
                />
                <p className="mt-monday-1 text-monday-xs text-monday-text-placeholder">
                  根据您的角色自动确定
                </p>
              </div>

              <div>
                <label htmlFor="confirmation" className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
                  确认删除 <span className="text-red-600">*</span>
                </label>
                <input
                  id="confirmation"
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder='请输入"确认删除"或"DELETE"以确认'
                  required
                  className="w-full px-monday-3 py-monday-2 border border-gray-300 rounded-monday-md text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-transparent"
                />
                <p className="mt-monday-1 text-monday-xs text-monday-text-placeholder">
                  必须输入"确认删除"或"DELETE"以确认删除操作
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !confirmation}
                className="w-full px-monday-4 py-monday-2 bg-red-600 text-white rounded-monday-md font-semibold text-monday-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '提交中...' : '提交删除请求'}
              </button>
            </form>
          </div>
        </Card>

        {/* Deletion Request List */}
        <Card variant="default" className="max-w-4xl mx-auto">
          <div className="p-monday-6">
            <h2 className="text-monday-xl font-semibold mb-monday-4">删除请求历史</h2>

            {isLoadingRequests ? (
              <div className="text-center py-monday-8 text-monday-text-secondary">
                加载中...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-monday-8 text-monday-text-secondary">
                暂无删除请求
              </div>
            ) : (
              <div className="space-y-monday-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-monday-4 border border-gray-200 rounded-monday-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-monday-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-monday-3 mb-monday-2">
                          <span className={`text-monday-sm font-semibold ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                          <span className="text-monday-xs text-monday-text-placeholder">
                            {new Date(request.requestedAt).toLocaleString('zh-CN')}
                          </span>
                        </div>

                        {request.deletionSummary && (
                          <div className="mt-monday-2 text-monday-sm text-monday-text-secondary">
                            <p>
                              已删除: {request.deletionSummary.deletedCount} 条记录
                              {request.deletionSummary.anonymizedCount > 0 && (
                                <> | 已匿名化: {request.deletionSummary.anonymizedCount} 条记录</>
                              )}
                              {request.deletionSummary.failedCount > 0 && (
                                <> | 失败: {request.deletionSummary.failedCount} 条记录</>
                              )}
                            </p>
                          </div>
                        )}

                        {request.completedAt && (
                          <p className="mt-monday-1 text-monday-xs text-monday-text-placeholder">
                            完成时间: {new Date(request.completedAt).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
