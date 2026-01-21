/**
 * Product Integrity Validation Page
 * 
 * Page component for integrity validation of product-customer interactions
 * All custom code is proprietary and not open source.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { Column } from '../components/ui/Table';
import { useAuth } from '../auth/AuthContext';
import { isAdmin } from '../common/constants/roles';

/**
 * Integrity issue interface
 */
interface IntegrityIssue {
  interactionId: string;
  issueType: string;
  severity: 'critical' | 'warning';
  productId?: string;
  customerId?: string;
  description: string;
  suggestedFix: string;
}

/**
 * Integrity validation result interface
 */
interface IntegrityValidationResult {
  reportId?: string;
  validationTime: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  issues: IntegrityIssue[];
  taskId?: string;
  progress?: number;
}

/**
 * Fix integrity issues request interface
 */
interface FixIntegrityIssuesRequest {
  issueIds: string[];
  fixAction: 'delete' | 'mark_fixed';
}

/**
 * Fix integrity issues result interface
 */
interface FixIntegrityIssuesResult {
  successCount: number;
  failureCount: number;
  failedIssueIds: string[];
}

export const ProductIntegrityValidationPage: React.FC = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFixAction, setPendingFixAction] = useState<'delete' | 'mark_fixed' | null>(null);

  // Use relative path /api to leverage Vite proxy in development
  // In production, set VITE_API_BASE_URL to the full backend URL
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';

  // Check if user is admin
  const userIsAdmin = isAdmin(user?.role);

  // Query validation result
  const {
    data: validationResult,
    isLoading: validationLoading,
    error: validationError,
    refetch: refetchValidation,
  } = useQuery<IntegrityValidationResult>({
    queryKey: ['integrity-validation'],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/products/integrity/validate`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('您没有权限查看完整性验证');
        }
        throw new Error('获取验证结果失败');
      }
      return response.json();
    },
    enabled: !!token && userIsAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Poll task status if async validation
  const { data: taskStatus } = useQuery<{
    taskId: string;
    status: string;
    progress: number;
    message: string;
    result?: IntegrityValidationResult;
    error?: string;
  }>({
    queryKey: ['integrity-validation-task', validationResult?.taskId],
    queryFn: async () => {
      if (!validationResult?.taskId) return null;
      const response = await fetch(
        `${apiBaseUrl}/products/integrity/validate/${validationResult.taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        throw new Error('获取验证任务状态失败');
      }
      return response.json();
    },
    enabled: !!validationResult?.taskId && !!token,
    refetchInterval: (data) => {
      // Poll every 2 seconds if task is running
      return data?.status === 'running' ? 2000 : false;
    },
  });

  // Use task result if available, otherwise use direct result
  const effectiveResult = taskStatus?.result || validationResult;

  // Filter issues by type
  const filteredIssues = useMemo(() => {
    if (!effectiveResult?.issues) return [];
    if (issueTypeFilter === 'all') return effectiveResult.issues;
    return effectiveResult.issues.filter((issue) => issue.issueType === issueTypeFilter);
  }, [effectiveResult?.issues, issueTypeFilter]);

  // Fix issues mutation
  const fixIssuesMutation = useMutation<FixIntegrityIssuesResult, Error, FixIntegrityIssuesRequest>({
    mutationFn: async (request: FixIntegrityIssuesRequest) => {
      const response = await fetch(`${apiBaseUrl}/products/integrity/fix`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('您没有权限修复完整性问题');
        }
        throw new Error('修复完整性问题失败');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch validation result
      queryClient.invalidateQueries({ queryKey: ['integrity-validation'] });
      setSelectedIssueIds(new Set());
      setShowConfirmDialog(false);
      setPendingFixAction(null);
    },
  });

  // Handle issue selection
  const handleIssueToggle = (issueId: string) => {
    const newSelected = new Set(selectedIssueIds);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssueIds(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIssueIds.size === filteredIssues.length) {
      setSelectedIssueIds(new Set());
    } else {
      setSelectedIssueIds(new Set(filteredIssues.map((issue) => issue.interactionId)));
    }
  };

  // Handle fix action
  const handleFixAction = (action: 'delete' | 'mark_fixed') => {
    if (selectedIssueIds.size === 0) {
      alert('请至少选择一个问题');
      return;
    }
    setPendingFixAction(action);
    setShowConfirmDialog(true);
  };

  // Confirm fix
  const handleConfirmFix = () => {
    if (!pendingFixAction) return;
    fixIssuesMutation.mutate({
      issueIds: Array.from(selectedIssueIds),
      fixAction: pendingFixAction,
    });
  };

  // Export report to CSV
  const handleExportCSV = () => {
    if (!effectiveResult?.issues) return;

    const csvHeaders = ['互动记录ID', '问题类型', '严重性', '产品ID', '客户ID', '描述', '建议修复方案'];
    const csvRows = effectiveResult.issues.map((issue) => [
      issue.interactionId,
      issue.issueType,
      issue.severity,
      issue.productId || '',
      issue.customerId || '',
      issue.description,
      issue.suggestedFix,
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => {
        return row.map((cell) => {
          const escapedCell = String(cell).replace(/"/g, '""');
          return `"${escapedCell}"`;
        }).join(',');
      })
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `integrity-validation-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Issue type labels
  const issueTypeLabels: Record<string, string> = {
    invalid_product: '无效产品关联',
    invalid_customer: '无效客户关联',
    deleted_product: '关联产品已删除',
    deleted_customer: '关联客户已删除',
    inactive_product: '非活跃产品关联',
  };

  // Table columns
  const columns: Column<IntegrityIssue & { selected?: boolean }>[] = [
    {
      key: 'selected',
      header: (
        <input
          type="checkbox"
          checked={selectedIssueIds.size === filteredIssues.length && filteredIssues.length > 0}
          onChange={handleSelectAll}
          className="cursor-pointer"
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIssueIds.has(row.interactionId)}
          onChange={() => handleIssueToggle(row.interactionId)}
          className="cursor-pointer"
        />
      ),
    },
    {
      key: 'interactionId',
      header: '互动记录ID',
      render: (value) => <span className="font-mono text-monday-xs">{String(value).slice(0, 8)}...</span>,
    },
    {
      key: 'issueType',
      header: '问题类型',
      render: (value) => (
        <span className="text-monday-sm">{issueTypeLabels[String(value)] || String(value)}</span>
      ),
    },
    {
      key: 'severity',
      header: '严重性',
      render: (value) => {
        const severity = String(value);
        const colorClass = severity === 'critical' ? 'text-primary-red' : 'text-primary-yellow';
        return <span className={`text-monday-sm font-semibold ${colorClass}`}>{severity === 'critical' ? '严重' : '警告'}</span>;
      },
    },
    {
      key: 'productId',
      header: '产品ID',
      render: (value) => (value ? <span className="font-mono text-monday-xs">{String(value).slice(0, 8)}...</span> : '-'),
    },
    {
      key: 'customerId',
      header: '客户ID',
      render: (value) => (value ? <span className="font-mono text-monday-xs">{String(value).slice(0, 8)}...</span> : '-'),
    },
    {
      key: 'description',
      header: '描述',
      render: (value) => <span className="text-monday-sm">{String(value)}</span>,
    },
    {
      key: 'suggestedFix',
      header: '建议修复方案',
      render: (value) => <span className="text-monday-sm text-monday-text-secondary">{String(value)}</span>,
    },
  ];

  if (!userIsAdmin) {
    return (
      <MainLayout>
        <Card variant="outlined" className="p-monday-4">
          <div className="text-center py-monday-8">
            <p className="text-monday-sm text-primary-red">您没有权限访问此页面</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-monday-4">
        <div className="flex items-center justify-between mb-monday-6">
          <h1 className="text-monday-xl font-bold text-monday-text">产品关联完整性验证</h1>
          <div className="flex gap-monday-2">
            <Button size="sm" onClick={() => refetchValidation()} disabled={validationLoading}>
              {validationLoading ? '验证中...' : '运行验证'}
            </Button>
            {effectiveResult && effectiveResult.issues.length > 0 && (
              <Button size="sm" variant="secondary" onClick={handleExportCSV}>
                导出报告 (CSV)
              </Button>
            )}
          </div>
        </div>

        {/* Auto-validation status */}
        <Card variant="outlined" className="p-monday-3 mb-monday-4">
          <p className="text-monday-sm text-monday-text-secondary">
            自动验证：每天凌晨 2:00 自动运行
            {effectiveResult?.validationTime && (
              <> | 最近验证时间：{new Date(effectiveResult.validationTime).toLocaleString('zh-CN')}</>
            )}
          </p>
        </Card>

        {/* Validation progress (for async validation) */}
        {taskStatus && taskStatus.status === 'running' && (
          <Card variant="outlined" className="p-monday-4 mb-monday-4">
            <div className="flex items-center gap-monday-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-monday-2">
                  <span className="text-monday-sm font-semibold text-monday-text">{taskStatus.message}</span>
                  <span className="text-monday-sm text-monday-text-secondary">{taskStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskStatus.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error state */}
        {validationError && (
          <Card variant="outlined" className="p-monday-4 mb-monday-4">
            <div className="text-center py-monday-8">
              <p className="text-monday-sm text-primary-red mb-monday-2">
                {validationError instanceof Error ? validationError.message : '加载失败'}
              </p>
              <Button size="sm" onClick={() => refetchValidation()}>
                重试
              </Button>
            </div>
          </Card>
        )}

        {/* Loading state */}
        {validationLoading && !effectiveResult && (
          <Card variant="outlined" className="p-monday-4">
            <div className="flex items-center justify-center py-monday-8">
              <span className="animate-spin">⏳</span>
              <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">验证中...</span>
            </div>
          </Card>
        )}

        {/* Validation results */}
        {effectiveResult && !validationLoading && (
          <>
            {/* Summary statistics */}
            <div className="grid grid-cols-4 gap-monday-4 mb-monday-6">
              <Card variant="outlined" className="p-monday-4">
                <div className="text-monday-xs text-monday-text-secondary mb-monday-1">总记录数</div>
                <div className="text-monday-2xl font-bold text-monday-text">{effectiveResult.totalRecords}</div>
              </Card>
              <Card variant="outlined" className="p-monday-4">
                <div className="text-monday-xs text-monday-text-secondary mb-monday-1">有效记录</div>
                <div className="text-monday-2xl font-bold text-primary-green">{effectiveResult.validRecords}</div>
              </Card>
              <Card variant="outlined" className="p-monday-4">
                <div className="text-monday-xs text-monday-text-secondary mb-monday-1">无效记录</div>
                <div className="text-monday-2xl font-bold text-primary-red">{effectiveResult.invalidRecords}</div>
              </Card>
              <Card variant="outlined" className="p-monday-4">
                <div className="text-monday-xs text-monday-text-secondary mb-monday-1">问题数量</div>
                <div className="text-monday-2xl font-bold text-monday-text">{effectiveResult.issues.length}</div>
              </Card>
            </div>

            {/* Issue filter */}
            {effectiveResult.issues.length > 0 && (
              <div className="flex items-center gap-monday-2 mb-monday-4">
                <span className="text-monday-sm text-monday-text-secondary">筛选问题类型：</span>
                <select
                  value={issueTypeFilter}
                  onChange={(e) => setIssueTypeFilter(e.target.value)}
                  className="px-monday-2 py-monday-1 border border-gray-300 rounded-monday-md text-monday-sm"
                >
                  <option value="all">全部</option>
                  {Object.entries(issueTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Batch fix actions */}
            {selectedIssueIds.size > 0 && (
              <div className="flex items-center gap-monday-2 mb-monday-4 p-monday-3 bg-primary-blue/5 rounded-monday-md">
                <span className="text-monday-sm text-monday-text">
                  已选择 {selectedIssueIds.size} 个问题
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleFixAction('delete')}
                  disabled={fixIssuesMutation.isPending}
                >
                  批量删除
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleFixAction('mark_fixed')}
                  disabled={fixIssuesMutation.isPending}
                >
                  批量标记为已修复
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setSelectedIssueIds(new Set())}
                >
                  取消选择
                </Button>
              </div>
            )}

            {/* Issues table */}
            {filteredIssues.length > 0 ? (
              <Table
                columns={columns}
                data={filteredIssues.map((issue) => ({ ...issue, selected: selectedIssueIds.has(issue.interactionId) }))}
                rowKey={(row) => row.interactionId}
                aria-label="完整性验证问题列表"
              />
            ) : (
              <Card variant="outlined" className="p-monday-4">
                <div className="text-center py-monday-8">
                  <div className="text-monday-4xl mb-monday-4 opacity-50">✅</div>
                  <p className="text-monday-base text-monday-text-secondary">
                    {effectiveResult.issues.length === 0
                      ? '未发现完整性问题'
                      : '当前筛选条件下没有问题'}
                  </p>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Confirm dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card variant="outlined" className="p-monday-6 max-w-md">
              <h3 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
                确认修复操作
              </h3>
              <p className="text-monday-sm text-monday-text-secondary mb-monday-4">
                您确定要对 {selectedIssueIds.size} 个问题执行
                {pendingFixAction === 'delete' ? '删除' : '标记为已修复'} 操作吗？
              </p>
              <div className="flex gap-monday-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setPendingFixAction(null);
                  }}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmFix}
                  disabled={fixIssuesMutation.isPending}
                >
                  {fixIssuesMutation.isPending ? '处理中...' : '确认'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Fix result message */}
        {fixIssuesMutation.isSuccess && (
          <Card variant="outlined" className="p-monday-4 mt-monday-4 bg-primary-green/10">
            <p className="text-monday-sm text-primary-green">
              修复完成：成功 {fixIssuesMutation.data.successCount} 个，失败 {fixIssuesMutation.data.failureCount} 个
            </p>
          </Card>
        )}

        {fixIssuesMutation.isError && (
          <Card variant="outlined" className="p-monday-4 mt-monday-4 bg-primary-red/10">
            <p className="text-monday-sm text-primary-red">
              {fixIssuesMutation.error instanceof Error
                ? fixIssuesMutation.error.message
                : '修复失败'}
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

