/**
 * Main Layout Component
 * 
 * Implements modern layout with top navigation and left sidebar:
 * - Top navigation bar: Full-width horizontal navigation
 * - Left sidebar: Navigation menu below top bar
 * - Main content area: With optional toolbar
 * - Right panel: Detail panel for selected item (optional, closable)
 * 
 * All custom code is proprietary and not open source.
 */

import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  toolbar?: ReactNode;
  detailPanel?: ReactNode;
  showDetailPanel?: boolean;
  onCloseDetailPanel?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  toolbar,
  detailPanel,
  showDetailPanel = false,
  onCloseDetailPanel,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Simplified sidebar navigation - only main items
  const navigationItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/users', label: '用户管理', icon: '👥', adminOnly: true },
    { path: '/products', label: '产品管理', icon: '📦', adminOnly: true },
    { path: '/settings', label: '系统', icon: '⚙️', adminOnly: true },
  ];

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const visibleNavItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Get role label in Chinese
  const getRoleLabel = (role: string | null): string => {
    if (!role) return '无角色';
    const roleMap: Record<string, string> = {
      ADMIN: '管理员',
      DIRECTOR: '总监',
      FRONTEND_SPECIALIST: '前端专员',
      BACKEND_SPECIALIST: '后端专员',
    };
    return roleMap[role] || role;
  };

  return (
    <>
      {/* 装饰性几何图形 */}
      <div className="decorative-circle-1" />
      <div className="decorative-circle-2" />
      
      <div className="flex flex-col min-h-screen relative z-10">
        {/* Main Content Area with Sidebar */}
        <div className="flex-1 flex min-h-0 px-monday-6 pb-monday-6 pt-monday-6">
        {/* Left Sidebar - Card Style - Full Height */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-60'
          } transition-all duration-300 flex flex-col mr-monday-4 h-full`}
        >
          <div className="bg-monday-surface rounded-monday-lg shadow-monday-md border border-gray-200 flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-monday-4 border-b border-gray-200">
              <Link to="/" className="flex items-center gap-monday-3">
                {sidebarCollapsed ? (
                  <div className="text-monday-2xl font-bold text-primary-blue">峰</div>
                ) : (
                  <div className="text-monday-2xl font-bold text-monday-text tracking-tight">
                    峰华CRM系统
                  </div>
                )}
              </Link>
            </div>

            {/* Navigation Items - Better Spacing */}
            <nav className="flex-1 flex items-start p-monday-3">
              <ul className="w-full space-y-monday-2">
                {visibleNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center ${
                        sidebarCollapsed ? 'justify-center' : 'gap-monday-3'
                      } p-monday-3 rounded-monday-md transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-primary-blue'
                          : 'text-monday-text-secondary hover:bg-monday-bg hover:text-monday-text'
                      }`}
                    >
                      <span className="text-monday-xl flex-shrink-0">{item.icon}</span>
                      {!sidebarCollapsed && (
                        <span className="text-monday-sm font-medium tracking-tight">{item.label}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User Info and Actions at Bottom */}
            <div className="p-monday-3 border-t border-gray-200 space-y-monday-2">
              {/* User Info */}
              {user && !sidebarCollapsed && (
                <div className="flex items-center gap-monday-3 p-monday-3 rounded-monday-md bg-monday-bg">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-blue to-primary-purple flex items-center justify-center text-white text-monday-sm font-semibold shadow-monday-sm flex-shrink-0">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-monday-sm font-medium text-monday-text truncate">{user.email}</p>
                    <p className="text-monday-xs text-monday-text-secondary">{getRoleLabel(user.role || null)}</p>
                  </div>
                </div>
              )}
              
              {/* Collapse Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center gap-monday-2 p-monday-3 rounded-monday-md transition-colors text-monday-text-secondary hover:bg-monday-bg hover:text-monday-text"
                aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
              >
                <span className="text-monday-lg">☰</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="text-monday-sm font-medium">收起菜单</span>
                    <span className="ml-auto text-monday-text-secondary">←</span>
                  </>
                )}
              </button>

              {/* Logout Button */}
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full text-monday-text hover:text-monday-text hover:bg-monday-bg justify-start"
                >
                  登出
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col min-h-0 ${showDetailPanel ? 'mr-0' : ''}`}>
          {/* Page Header with Toolbar - Only show if title or toolbar exists */}
          {(title || toolbar) && (
            <div className="bg-monday-surface p-monday-4 shadow-monday-sm rounded-monday-lg border border-gray-200 flex-shrink-0 mb-monday-6">
              <div className="flex items-center justify-between gap-monday-4">
                {title && (
                  <h1 className="text-monday-2xl font-semibold text-monday-text flex-shrink-0 tracking-tight">
                    {title}
                  </h1>
                )}
                {toolbar && (
                  <div className={`flex items-center gap-monday-3 ${title ? 'flex-1 justify-end' : 'w-full justify-end'}`}>
                    {toolbar}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {children}
          </div>
        </main>

        {/* Right Detail Panel - Card Style - Full Height */}
        {showDetailPanel && detailPanel && (
          <aside className="w-80 ml-monday-4 transition-all duration-300 flex flex-col h-full">
            <div className="bg-monday-surface rounded-monday-lg shadow-monday-md border border-gray-200 flex flex-col h-full">
              {/* Panel Header */}
              <div className="p-monday-4 flex items-center justify-between border-b border-gray-200">
                <h3 className="text-monday-lg font-semibold text-monday-text">产品详情</h3>
                {onCloseDetailPanel && (
                  <button
                    onClick={onCloseDetailPanel}
                    className="p-monday-2 hover:bg-monday-bg rounded-monday-md transition-colors text-monday-text-secondary hover:text-monday-text"
                    aria-label="关闭详情面板"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-monday-4">
                {detailPanel}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
    </>
  );
};

