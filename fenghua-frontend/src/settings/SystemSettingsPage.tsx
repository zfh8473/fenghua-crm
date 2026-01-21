/**
 * System Settings Page
 * 
 * Page for managing system settings and accessing system-related features
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getSettings, updateSettings } from './settings.service';
import { SettingsResponseDto, UpdateSettingsDto } from './types/settings.types';
import { SettingsForm } from './components/SettingsForm';
import { DataRetentionStatistics } from './components/DataRetentionStatistics';
import { UserRole } from '../common/constants/roles';
import { Card } from '../components/ui/Card';
import { MainLayout } from '../components/layout';
import { getErrorMessage } from '../utils/error-handling';
import { HomeModuleIcon } from '../components/icons/HomeModuleIcons';
// import './SystemSettingsPage.css'; // Removed

export function SystemSettingsPage() {
  const { currentUser, token } = useAuth();
  const [settings, setSettings] = useState<SettingsResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'data-retention'>('overview');

  // Check if user is admin
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // System sub-menu items
  /** 19.5 admin-settings：emoji → iconName，用 HomeModuleIcon 渲染 */
  const systemMenuItems = [
    { path: '/monitoring', label: '系统监控', iconName: 'chartBar', description: '查看系统运行状态和性能指标' },
    { path: '/logs', label: '系统日志', iconName: 'documentText', description: '查看系统运行日志' },
    { path: '/error-logs', label: '错误日志', iconName: 'exclamationTriangle', description: '查看系统错误和异常日志' },
    { path: '/audit-logs', label: '审计日志', iconName: 'magnifyingGlass', description: '查看系统操作审计记录' },
    { path: '/backup', label: '数据备份', iconName: 'circleStack', description: '管理数据备份任务' },
    { path: '/restore', label: '数据恢复', iconName: 'arrowPath', description: '恢复备份数据' },
  ];

  useEffect(() => {
    if (!isAdmin || !token) {
      return;
    }

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]); // loadSettings is stable and doesn't need to be in deps

  const loadSettings = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getSettings(token);
      setSettings(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '加载系统设置失败'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (updateDto: UpdateSettingsDto) => {
    if (!token) return;

    try {
      setIsSaving(true);
      setError(null);
      const updatedSettings = await updateSettings(token, updateDto);
      setSettings(updatedSettings);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '更新系统设置失败'));
      throw err; // Re-throw to let form handle it
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <MainLayout title="系统设置">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-4 bg-semantic-error/10 border border-semantic-error rounded-monday-md text-semantic-error text-monday-base" role="alert">
            只有管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="">
      <div className="space-y-monday-6">
        {/* Toolbar Card with tabs */}
        <Card variant="default" className="w-full p-monday-4">
            <div className="flex items-center justify-between gap-monday-4">
            <div className="flex items-center gap-monday-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-monday-4 py-monday-2 text-monday-sm font-semibold rounded-monday-md transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-uipro-cta text-white shadow-monday-sm'
                    : 'bg-monday-bg text-uipro-secondary hover:bg-gray-200'
                }`}
              >
                系统功能
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-monday-4 py-monday-2 text-monday-sm font-semibold rounded-monday-md transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-uipro-cta text-white shadow-monday-sm'
                    : 'bg-monday-bg text-uipro-secondary hover:bg-gray-200'
                }`}
              >
                系统配置
              </button>
              <button
                onClick={() => setActiveTab('data-retention')}
                className={`px-monday-4 py-monday-2 text-monday-sm font-semibold rounded-monday-md transition-all cursor-pointer ${
                  activeTab === 'data-retention'
                    ? 'bg-uipro-cta text-white shadow-monday-sm'
                    : 'bg-monday-bg text-uipro-secondary hover:bg-gray-200'
                }`}
              >
                数据保留策略
              </button>
            </div>
          </div>
        </Card>

        {/* Overview Tab - System Menu Items */}
        {activeTab === 'overview' && (
          <Card variant="default" className="w-full">
            <h2 className="text-monday-2xl font-semibold text-uipro-text font-uipro-heading mb-monday-6 tracking-tight">系统功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
              {systemMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group block cursor-pointer transition-colors duration-200"
                >
                  <Card
                    variant="default"
                    hoverable
                    className="p-monday-5 h-full transition-all duration-200 hover:shadow-monday-md border border-gray-200 hover:border-uipro-cta/30"
                  >
                    <div className="flex items-start gap-monday-4">
                      <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                        <HomeModuleIcon name={item.iconName} className="w-8 h-8 text-uipro-cta" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-monday-base font-semibold text-uipro-text mb-monday-1 group-hover:text-uipro-cta transition-colors tracking-tight">
                          {item.label}
                        </h3>
                        <p className="text-monday-sm text-uipro-secondary font-normal">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-uipro-secondary group-hover:text-uipro-cta transition-colors flex-shrink-0 text-monday-lg">
                        →
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Settings Tab - System Settings Form */}
        {activeTab === 'settings' && (
          <Card variant="default" className="w-full">
            <h2 className="text-monday-2xl font-semibold text-uipro-text font-uipro-heading mb-monday-6 tracking-tight">系统配置</h2>
            {error && (
              <div className="bg-semantic-error/10 border border-semantic-error rounded-monday-md text-semantic-error p-monday-3 mb-monday-4" role="alert">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center p-monday-8 text-uipro-secondary">加载中...</div>
            ) : settings ? (
              <SettingsForm
                settings={settings}
                onSubmit={handleSubmit}
                isLoading={isSaving}
              />
            ) : (
              <div className="text-center p-monday-8 text-uipro-secondary">
                无法加载系统设置
              </div>
            )}
          </Card>
        )}

        {/* Data Retention Tab - Statistics and History */}
        {activeTab === 'data-retention' && (
          <Card variant="default" className="w-full">
            <h2 className="text-monday-2xl font-semibold text-uipro-text font-uipro-heading mb-monday-6 tracking-tight">
              数据保留策略
            </h2>
            <DataRetentionStatistics />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
