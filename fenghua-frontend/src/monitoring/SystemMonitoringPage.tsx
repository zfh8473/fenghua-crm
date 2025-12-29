/**
 * System Monitoring Page
 * 
 * Displays system health monitoring
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getHealthStatus, HealthStatus } from './monitoring.service';
import { HealthStatusPanel } from './components/HealthStatusPanel';
import { UserRole } from '../common/constants/roles';
import { Card } from '../components/ui/Card';
import { MainLayout } from '../components/layout';
// import './SystemMonitoringPage.css'; // Removed

export function SystemMonitoringPage() {
  const { currentUser, token } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const loadHealth = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getHealthStatus(token);
      setHealth(data);
    } catch (err: unknown) {
      setError(err.message || '加载健康状态失败');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin || !token) {
      return;
    }

    loadHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, token, loadHealth]);

  if (!isAdmin) {
    return (
      <MainLayout title="系统监控">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-base" role="alert">
            只有管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (isLoading && !health) {
    return (
      <MainLayout title="系统监控">
        <Card variant="default" className="w-full">
          <div className="text-center p-monday-8 text-monday-text-secondary">加载中...</div>
        </Card>
      </MainLayout>
    );
  }

  if (error && !health) {
    return (
      <MainLayout title="系统监控">
        <Card variant="default" className="w-full">
          <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md" role="alert">
            {error}
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (!health) {
    return (
      <MainLayout title="系统监控">
        <Card variant="default" className="w-full">
          <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md" role="alert">
            无法加载健康状态
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="系统监控">
      <div className="space-y-monday-6">
        {error && (
          <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md" role="alert">
            {error}
          </div>
        )}
        <Card variant="default" className="w-full">
          <HealthStatusPanel health={health} />
        </Card>
      </div>
    </MainLayout>
  );
}

