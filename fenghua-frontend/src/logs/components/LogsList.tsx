/**
 * Logs List Component
 * 
 * Displays system logs
 * All custom code is proprietary and not open source.
 */

import { LogEntry, LogLevel } from '../logs.service';
// import './LogsList.css'; // Removed

interface LogsListProps {
  logs: LogEntry[];
}

export function LogsList({ logs }: LogsListProps) {
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    // Format as YYYY-MM-DD HH:mm:ss as required by AC #2
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  /** 19.5 admin-settings：级别用 semantic-*、uipro-cta */
  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.ERROR: return 'text-semantic-error';
      case LogLevel.WARN: return 'text-semantic-warning';
      case LogLevel.INFO: return 'text-uipro-cta';
      case LogLevel.DEBUG: return 'text-uipro-secondary';
      default: return 'text-uipro-text';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr className="bg-monday-bg border-b border-gray-200">
            <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-uipro-secondary uppercase tracking-wider">时间戳</th>
            <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-uipro-secondary uppercase tracking-wider">级别</th>
            <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-uipro-secondary uppercase tracking-wider">消息</th>
            <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-uipro-secondary uppercase tracking-wider">上下文</th>
            <th className="p-monday-2 px-monday-4 text-left text-monday-xs font-semibold text-uipro-secondary uppercase tracking-wider">用户 ID</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-monday-6 text-center text-uipro-secondary text-monday-sm">
                暂无日志
              </td>
            </tr>
          ) : (
            logs.map((log, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-monday-bg transition-colors duration-150">
                <td className="p-monday-2 px-monday-4 text-monday-sm text-monday-text font-mono whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                <td className="p-monday-2 px-monday-4 text-monday-sm">
                  <span className={`font-semibold text-monday-xs px-monday-2 py-monday-1 rounded-monday-sm ${getLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                </td>
                <td className="p-monday-2 px-monday-4 text-monday-sm text-monday-text max-w-[400px] break-words">{log.message}</td>
                <td className="p-monday-2 px-monday-4 text-monday-sm text-uipro-secondary">{log.context || '-'}</td>
                <td className="p-monday-2 px-monday-4 text-monday-sm text-uipro-secondary font-mono">{log.userId || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

