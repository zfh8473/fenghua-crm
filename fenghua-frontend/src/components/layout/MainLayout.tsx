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

import { useState, ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { Button } from '../ui';
import { AppLogo } from '../AppLogo';
import { HomeModuleIcon } from '../icons/HomeModuleIcons';
import { getDashboardOverview } from '../../dashboard/services/dashboard.service';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  toolbar?: ReactNode;
  detailPanel?: ReactNode;
  showDetailPanel?: boolean;
  onCloseDetailPanel?: () => void;
  detailPanelTitle?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  toolbar,
  detailPanel,
  showDetailPanel = false,
  onCloseDetailPanel,
  detailPanelTitle,
}) => {
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const userIsAdmin = isAdmin(user?.role);
  const userIsDirector = isDirector(user?.role);
  const canAccessDashboard = userIsAdmin || userIsDirector;

  // Prefetch dashboard data when user has access and is on a page that might lead to dashboard
  useEffect(() => {
    if (canAccessDashboard && token && location.pathname !== '/dashboard') {
      // Prefetch dashboard data in the background when user is on other pages
      // This improves perceived performance when user navigates to dashboard
      const prefetchDashboard = async () => {
        try {
          await queryClient.prefetchQuery({
            queryKey: ['dashboard-overview'],
            queryFn: () => getDashboardOverview(token),
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
        } catch (error) {
          // Silently fail - prefetch is optional
          console.debug('Dashboard prefetch failed (non-critical):', error);
        }
      };

      // Delay prefetch slightly to avoid blocking initial page load
      const timeoutId = setTimeout(prefetchDashboard, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [canAccessDashboard, token, location.pathname, queryClient]);

  const isActive = (path: string) => location.pathname === path;

  /** 19.4 login-nav-layout：emoji → iconName，HomeModuleIcon 渲染 SVG */
  const navigationItems = [
    { path: '/', label: '首页', iconName: 'home' },
    { path: '/dashboard', label: '业务仪表板', iconName: 'chartBar', directorOrAdminOnly: true },
    { path: '/dashboard/product-association-analysis', label: '产品关联分析', iconName: 'link', directorOrAdminOnly: true },
    { path: '/dashboard/customer-analysis', label: '客户分析', iconName: 'users', directorOrAdminOnly: true },
    { path: '/dashboard/supplier-analysis', label: '供应商分析', iconName: 'buildingOffice', directorOrAdminOnly: true },
    { path: '/dashboard/buyer-analysis', label: '采购商分析', iconName: 'shoppingCart', directorOrAdminOnly: true },
    { path: '/dashboard/business-trend-analysis', label: '业务趋势分析', iconName: 'arrowTrendingUp', directorOrAdminOnly: true },
    { path: '/users', label: '用户管理', iconName: 'users', adminOnly: true },
    { path: '/products', label: '产品管理', iconName: 'cube', adminOnly: false },
    { path: '/customers', label: '客户管理', iconName: 'briefcase', adminOnly: false },
    { path: '/interactions', label: '互动管理', iconName: 'chat', adminOnly: false },
    { path: '/settings', label: '系统', iconName: 'cog', adminOnly: true },
  ];

  const visibleNavItems = navigationItems.filter(
    (item) => {
      if (item.directorOrAdminOnly) {
        return userIsAdmin || userIsDirector;
      }
      if (item.adminOnly) {
        return userIsAdmin;
      }
      return true;
    }
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

  // Get user display name (firstName + lastName, or firstName, or lastName, or email username)
  const getUserDisplayName = (userToDisplay: typeof user): string => {
    if (!userToDisplay) return '用户';
    if (userToDisplay.firstName && userToDisplay.lastName) {
      return `${userToDisplay.firstName} ${userToDisplay.lastName}`;
    }
    if (userToDisplay.firstName) {
      return userToDisplay.firstName;
    }
    if (userToDisplay.lastName) {
      return userToDisplay.lastName;
    }
    // Fallback to email username (part before @)
    return userToDisplay.email?.split('@')[0] || '用户';
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
            sidebarCollapsed ? 'w-16' : 'w-52'
          } transition-all duration-300 flex flex-col mr-monday-4 flex-shrink-0 h-full`}
        >
          <div className="bg-monday-surface rounded-monday-lg shadow-monday-md border border-gray-200 flex flex-col h-full">
            <div className="p-monday-4 border-b border-gray-200 flex justify-center">
              <Link to="/" className="flex items-center justify-center w-full gap-monday-3 cursor-pointer transition-colors duration-200">
                <AppLogo
                  collapsed={sidebarCollapsed}
                  className="text-monday-3xl font-semibold tracking-tight text-gray-900"
                />
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
                      } p-monday-3 rounded-monday-md transition-colors duration-200 cursor-pointer ${
                        isActive(item.path)
                          ? 'bg-uipro-cta/10 text-uipro-cta'
                          : 'text-gray-950 hover:bg-monday-bg hover:text-black'
                      }`}
                    >
                      <HomeModuleIcon name={item.iconName} className="w-5 h-5 flex-shrink-0" />
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
                  <div className="w-9 h-9 rounded-full bg-uipro-cta flex items-center justify-center text-white text-monday-sm font-semibold shadow-monday-sm flex-shrink-0">
                    {getUserDisplayName(user).charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-monday-sm font-medium text-gray-950 truncate">{getUserDisplayName(user)}</p>
                    <p className="text-monday-xs text-gray-700">{getRoleLabel(user.role || null)}</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`w-full flex items-center gap-monday-2 p-monday-3 rounded-monday-md transition-colors duration-200 text-gray-950 hover:bg-monday-bg hover:text-black cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
                aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                {!sidebarCollapsed && (
                  <>
                    <span className="text-monday-sm font-medium">收起菜单</span>
                    <svg className="w-5 h-5 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  </>
                )}
              </button>

              {/* Logout Button */}
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full text-gray-950 hover:bg-monday-bg justify-start cursor-pointer transition-colors duration-200"
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
                  <h1 className="text-monday-2xl font-semibold text-uipro-text font-uipro-heading flex-shrink-0 tracking-tight">
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
                <h3 className="text-monday-lg font-semibold text-gray-900">{detailPanelTitle || '详情'}</h3>
                {onCloseDetailPanel && (
                  <button
                    onClick={onCloseDetailPanel}
                    className="p-monday-2 hover:bg-monday-bg rounded-monday-md transition-colors duration-200 text-uipro-secondary hover:text-uipro-text cursor-pointer"
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

