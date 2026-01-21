/**
 * GDPR Export Page
 * 
 * Page for GDPR data export requests
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { gdprExportService, GdprExportFormat, GdprExportRequestResponseDto, GdprExportRequestListResponseDto } from './services/gdpr-export.service';
import { Card } from '../components/ui/Card';
import { MainLayout } from '../components/layout/MainLayout';
import { UserRole, isAdmin, isDirector, isFrontendSpecialist, isBackendSpecialist } from '../common/constants/roles';
import { getErrorMessage } from '../utils/error-handling';

export function GdprExportPage() {
  const { user, token } = useAuth();
  const [format, setFormat] = useState<GdprExportFormat>(GdprExportFormat.JSON);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requests, setRequests] = useState<GdprExportRequestResponseDto[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const requestsRef = useRef<GdprExportRequestResponseDto[]>([]);
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

  // Determine export option based on user role
  const getExportOption = (): string => {
    if (!user?.role) return '';
    const role = user.role.toUpperCase();
    if (role === UserRole.FRONTEND_SPECIALIST) {
      return '导出我的采购商数据';
    } else if (role === UserRole.BACKEND_SPECIALIST) {
      return '导出我的供应商数据';
    } else if (role === UserRole.DIRECTOR || role === UserRole.ADMIN) {
      return '导出我的所有数据';
    }
    return '';
  };

  // Load export requests
  const loadRequests = useCallback(async () => {
    if (!token) return false;

    try {
      setIsLoadingRequests(true);
      const response = await gdprExportService.getExportRequestList();
      setRequests(response.data);
      requestsRef.current = response.data; // Update ref
      // Clear error on success
      setError(null);
      return true; // Success
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, '加载导出请求列表失败');
      setError(errorMessage);
      
      // Enhanced error logging in development
      if (import.meta.env.DEV) {
        console.error('[GdprExportPage] Failed to load export requests:', {
          error: err,
          errorMessage: errorMessage,
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          stack: err instanceof Error ? err.stack : undefined,
        });
      } else {
        console.error('Failed to load export requests:', err);
      }
      
      return false; // Failed
    } finally {
      setIsLoadingRequests(false);
    }
  }, [token]);

  // Store loadRequests in ref to avoid dependency issues
  useEffect(() => {
    loadRequestsRef.current = loadRequests;
  }, [loadRequests]);

  useEffect(() => {
    if (!token) return;

    const MAX_CONSECUTIVE_ERRORS = 3;
    const polling = pollingStateRef.current;
    
    // Reset polling state
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
        // Stop polling after too many consecutive errors
        if (polling.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          polling.shouldPoll = false;
          if (polling.interval) {
            clearInterval(polling.interval);
            polling.interval = null;
          }
        }
        return;
      }

      // Reset error counter on success
      polling.consecutiveErrors = 0;

      // Check if all requests are terminal using ref (avoids closure issues)
      const currentRequests = requestsRef.current;
      const hasActiveRequests = currentRequests.some(
        (r) => r.status !== 'COMPLETED' && r.status !== 'FAILED'
      );

      if (!hasActiveRequests && currentRequests.length > 0) {
        // All requests are terminal, stop polling
        polling.shouldPoll = false;
        if (polling.interval) {
          clearInterval(polling.interval);
          polling.interval = null;
        }
      }
    };

    // Initial load
    pollRequests();

    // Set up polling
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
  }, [token]); // Remove loadRequests from dependencies to prevent loop

  // Handle export request submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('用户未登录');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await gdprExportService.createExportRequest({ format });
      setSuccess('导出请求已创建，系统将在30天内生成导出文件');
      await loadRequests();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '创建导出请求失败'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file download
  const handleDownload = async (request: GdprExportRequestResponseDto) => {
    if (!token) {
      setError('用户未登录');
      return;
    }

    try {
      // Fetch request detail to get downloadToken
      const requestDetail = await gdprExportService.getExportRequest(request.id);
      if (!requestDetail.downloadToken) {
        throw new Error('下载令牌不可用');
      }

      await gdprExportService.downloadExportFile(request.id, requestDetail.downloadToken);
      setSuccess('文件下载已开始');
    } catch (err: unknown) {
      setError(getErrorMessage(err, '下载文件失败'));
    }
  };

  // Get status label in Chinese
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: '待处理',
      QUEUED: '已排队',
      PROCESSING: '处理中',
      GENERATING_FILE: '生成文件中',
      COMPLETED: '已完成',
      FAILED: '失败',
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      PENDING: 'text-yellow-600',
      QUEUED: 'text-blue-600',
      PROCESSING: 'text-blue-600',
      GENERATING_FILE: 'text-blue-600',
      COMPLETED: 'text-green-600',
      FAILED: 'text-red-600',
    };
    return colorMap[status] || 'text-gray-600';
  };

  const exportOption = getExportOption();

  return (
    <MainLayout title="GDPR 数据导出">
      <div className="space-y-monday-6">
        {/* Export Request Form */}
        <Card variant="default" className="max-w-2xl mx-auto">
          <div className="p-monday-6">
            <h2 className="text-monday-xl font-semibold mb-monday-4">创建导出请求</h2>
            <p className="text-monday-sm text-monday-text-secondary mb-monday-6">
              根据您的角色，您可以请求导出相关的数据。系统将在30天内生成导出文件。
            </p>

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
                <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                  导出选项
                </label>
                <div className="p-monday-4 bg-blue-50 border border-blue-200 rounded-monday-md text-monday-sm text-blue-800">
                  {exportOption}
                </div>
              </div>

              <div>
                <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                  导出格式
                </label>
                <div className="flex gap-monday-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={GdprExportFormat.JSON}
                      checked={format === GdprExportFormat.JSON}
                      onChange={(e) => setFormat(e.target.value as GdprExportFormat)}
                      className="mr-monday-2"
                    />
                    <span className="text-monday-sm">JSON</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={GdprExportFormat.CSV}
                      checked={format === GdprExportFormat.CSV}
                      onChange={(e) => setFormat(e.target.value as GdprExportFormat)}
                      className="mr-monday-2"
                    />
                    <span className="text-monday-sm">CSV</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-monday-4 py-monday-2 bg-uipro-cta text-white rounded-monday-md hover:bg-uipro-cta/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
              >
                {isSubmitting ? '创建中...' : '创建导出请求'}
              </button>
            </form>
          </div>
        </Card>

        {/* Export Requests List */}
        <Card variant="default" className="max-w-4xl mx-auto">
          <div className="p-monday-6">
            <h2 className="text-monday-xl font-semibold mb-monday-4">导出请求历史</h2>

            {isLoadingRequests ? (
              <div className="text-center py-monday-8 text-monday-text-secondary">加载中...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-monday-8 text-monday-text-secondary">暂无导出请求</div>
            ) : (
              <div className="space-y-monday-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-monday-4 border border-monday-border rounded-monday-md hover:bg-monday-bg-secondary"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-monday-4 mb-monday-2">
                          <span className={`text-monday-sm font-medium ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                          <span className="text-monday-sm text-monday-text-secondary">
                            {request.fileFormat}
                          </span>
                          {request.fileSize && (
                            <span className="text-monday-sm text-monday-text-secondary">
                              {(request.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                        <div className="text-monday-xs text-monday-text-secondary">
                          创建时间: {new Date(request.requestedAt).toLocaleString('zh-CN')}
                        </div>
                        {request.completedAt && (
                          <div className="text-monday-xs text-monday-text-secondary">
                            完成时间: {new Date(request.completedAt).toLocaleString('zh-CN')}
                          </div>
                        )}
                        {request.expiresAt && (
                          <div className="text-monday-xs text-monday-text-secondary">
                            过期时间: {new Date(request.expiresAt).toLocaleString('zh-CN')}
                          </div>
                        )}
                      </div>
                      {request.status === 'COMPLETED' && request.downloadUrl && (
                        <button
                          onClick={() => handleDownload(request)}
                          className="px-monday-3 py-monday-2 bg-uipro-cta text-white rounded-monday-md hover:bg-uipro-cta/90 text-monday-sm cursor-pointer transition-colors duration-200"
                        >
                          下载
                        </button>
                      )}
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
