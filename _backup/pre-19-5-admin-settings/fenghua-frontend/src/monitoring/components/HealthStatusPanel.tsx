/**
 * Health Status Panel Component
 * 
 * Displays system health status
 * All custom code is proprietary and not open source.
 */

import { HealthStatus } from '../monitoring.service';
// import './HealthStatusPanel.css'; // Removed

interface HealthStatusPanelProps {
  health: HealthStatus;
}

export function HealthStatusPanel({ health }: HealthStatusPanelProps) {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="p-monday-6">
      <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6 tracking-tight">系统健康状态</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
        <div className="p-monday-4 bg-monday-surface rounded-monday-md border border-gray-200">
          <div className="text-monday-sm text-monday-text-secondary mb-monday-2 font-medium">数据库状态</div>
          <div className={`text-monday-lg font-semibold ${health.database.status === 'connected' ? 'text-primary-green' : 'text-primary-red'}`}>
            {health.database.status === 'connected' ? '正常' : '异常'}
            {health.database.latency && (
              <span className="text-monday-xs text-monday-text-secondary font-normal ml-monday-1">({health.database.latency}ms)</span>
            )}
          </div>
        </div>

        {health.redis && (
          <div className="p-monday-4 bg-monday-surface rounded-monday-md border border-gray-200">
            <div className="text-monday-sm text-monday-text-secondary mb-monday-2 font-medium">Redis 状态</div>
            <div className={`text-monday-lg font-semibold ${health.redis.status === 'connected' ? 'text-primary-green' : 'text-primary-red'}`}>
              {health.redis.status === 'connected' ? '正常' : '异常'}
              {health.redis.latency && (
                <span className="text-monday-xs text-monday-text-secondary font-normal ml-monday-1">({health.redis.latency}ms)</span>
              )}
            </div>
          </div>
        )}

        <div className="p-monday-4 bg-monday-surface rounded-monday-md border border-gray-200">
          <div className="text-monday-sm text-monday-text-secondary mb-monday-2 font-medium">服务状态</div>
          <div className={`text-monday-lg font-semibold ${health.service.status === 'running' ? 'text-primary-green' : 'text-primary-red'}`}>
            {health.service.status === 'running' ? '运行中' : '已停止'}
          </div>
        </div>

        <div className="p-monday-4 bg-monday-surface rounded-monday-md border border-gray-200">
          <div className="text-monday-sm text-monday-text-secondary mb-monday-2 font-medium">系统运行时间</div>
          <div className="text-monday-lg font-semibold text-monday-text">{formatUptime(health.service.uptime)}</div>
        </div>

        {health.memory && (
          <div className="p-monday-4 bg-monday-surface rounded-monday-md border border-gray-200">
            <div className="text-monday-sm text-monday-text-secondary mb-monday-2 font-medium">内存使用</div>
            <div className="text-monday-lg font-semibold text-monday-text">
              {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
              <span className="text-monday-sm text-monday-text-secondary font-normal ml-monday-1">({health.memory.percentage}%)</span>
            </div>
          </div>
        )}

        <div className="p-monday-4 bg-primary-blue/10 rounded-monday-md border border-primary-blue/30 col-span-1 md:col-span-2 lg:col-span-3">
          <div className="text-monday-sm text-monday-text-secondary mb-monday-2 font-medium">整体状态</div>
          <div className={`text-monday-xl font-semibold ${health.status === 'healthy' ? 'text-primary-green' : 'text-primary-red'}`}>
            {health.status === 'healthy' ? '健康' : '异常'}
          </div>
        </div>
      </div>
    </div>
  );
}

