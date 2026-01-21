/**
 * Data Retention Statistics Component
 * 
 * Displays data retention policy, expiring data statistics, and cleanup history
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import {
  getDataRetentionPolicy,
  getDataRetentionStatistics,
  getCleanupHistory,
  type DataRetentionPolicy,
  type DataRetentionStatistics,
  type CleanupHistoryEntry,
} from '../services/data-retention.service';
import { authService } from '../../auth/auth.service';

export function DataRetentionStatistics() {
  const [policy, setPolicy] = useState<DataRetentionPolicy | null>(null);
  const [statistics, setStatistics] = useState<DataRetentionStatistics | null>(null);
  const [cleanupHistory, setCleanupHistory] = useState<CleanupHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = authService.getToken();
      if (!token) {
        throw new Error('未登录');
      }

      const [policyData, statisticsData, historyData] = await Promise.all([
        getDataRetentionPolicy(token),
        getDataRetentionStatistics(token),
        getCleanupHistory(token),
      ]);

      setPolicy(policyData);
      setStatistics(statisticsData);
      setCleanupHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRetentionDays = (days: number): string => {
    if (days === -1) {
      return '永久保留';
    }
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      if (remainingDays === 0) {
        return `${years} 年`;
      }
      return `${years} 年 ${remainingDays} 天`;
    }
    return `${days} 天`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="p-monday-6 text-center text-monday-text-placeholder">加载中...</div>
    );
  }

  if (error) {
    return (
      <div className="p-monday-6 bg-primary-red/20 border border-primary-red text-primary-red rounded-monday-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-monday-6">
      {/* Policy Section */}
      {policy && (
        <div className="p-monday-6 bg-monday-surface rounded-monday-lg border border-gray-200">
          <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">
            当前保留策略配置
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-4">
            <div>
              <span className="text-monday-sm text-monday-text-placeholder">客户数据：</span>
              <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                {formatRetentionDays(policy.customerDataRetentionDays)}
              </span>
            </div>
            <div>
              <span className="text-monday-sm text-monday-text-placeholder">产品数据：</span>
              <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                {formatRetentionDays(policy.productDataRetentionDays)}
              </span>
            </div>
            <div>
              <span className="text-monday-sm text-monday-text-placeholder">互动记录：</span>
              <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                {formatRetentionDays(policy.interactionDataRetentionDays)}
              </span>
            </div>
            <div>
              <span className="text-monday-sm text-monday-text-placeholder">审计日志：</span>
              <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                {formatRetentionDays(policy.auditLogRetentionDays)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      {statistics && (
        <div className="p-monday-6 bg-monday-surface rounded-monday-lg border border-gray-200">
          <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">
            即将过期的数据统计
          </h3>
          <div className="space-y-monday-4">
            <div>
              <h4 className="text-monday-base font-semibold text-monday-text mb-monday-2">
                客户数据
              </h4>
              <div className="grid grid-cols-3 gap-monday-4">
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">30 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.customers.expiringIn30Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">60 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.customers.expiringIn60Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">90 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.customers.expiringIn90Days} 条
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-monday-base font-semibold text-monday-text mb-monday-2">
                产品数据
              </h4>
              <div className="grid grid-cols-3 gap-monday-4">
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">30 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.products.expiringIn30Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">60 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.products.expiringIn60Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">90 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.products.expiringIn90Days} 条
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-monday-base font-semibold text-monday-text mb-monday-2">
                互动记录
              </h4>
              <div className="grid grid-cols-3 gap-monday-4">
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">30 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.interactions.expiringIn30Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">60 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.interactions.expiringIn60Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">90 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.interactions.expiringIn90Days} 条
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-monday-base font-semibold text-monday-text mb-monday-2">
                审计日志
              </h4>
              <div className="grid grid-cols-3 gap-monday-4">
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">30 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.auditLogs.expiringIn30Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">60 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.auditLogs.expiringIn60Days} 条
                  </span>
                </div>
                <div>
                  <span className="text-monday-sm text-monday-text-placeholder">90 天后：</span>
                  <span className="text-monday-base font-semibold text-monday-text ml-monday-2">
                    {statistics.auditLogs.expiringIn90Days} 条
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup History Section */}
      <div className="p-monday-6 bg-monday-surface rounded-monday-lg border border-gray-200">
        <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">
          最近自动删除操作记录
        </h3>
        {cleanupHistory.length === 0 ? (
          <div className="text-monday-sm text-monday-text-placeholder">
            暂无自动删除操作记录
          </div>
        ) : (
          <div className="space-y-monday-3">
            {cleanupHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-monday-4 bg-gray-50 rounded-monday-md border border-gray-200"
              >
                <div className="flex justify-between items-start mb-monday-2">
                  <span className="text-monday-sm text-monday-text-placeholder">
                    {formatDate(entry.timestamp)}
                  </span>
                  {entry.summary.totalDuration && (
                    <span className="text-monday-sm text-monday-text-placeholder">
                      耗时: {entry.summary.totalDuration} 秒
                    </span>
                  )}
                </div>
                <div className="text-monday-sm text-monday-text">
                  {entry.summary.customers && (
                    <div>
                      客户: 软删除 {entry.summary.customers.deleted} 条，硬删除{' '}
                      {entry.summary.customers.hardDeleted} 条
                    </div>
                  )}
                  {entry.summary.products && (
                    <div>
                      产品: 软删除 {entry.summary.products.deleted} 条，硬删除{' '}
                      {entry.summary.products.hardDeleted} 条
                    </div>
                  )}
                  {entry.summary.interactions && (
                    <div>
                      互动: 软删除 {entry.summary.interactions.deleted} 条，硬删除{' '}
                      {entry.summary.interactions.hardDeleted} 条
                    </div>
                  )}
                  {entry.summary.auditLogs && (
                    <div>审计日志: 删除 {entry.summary.auditLogs.deleted} 条</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
