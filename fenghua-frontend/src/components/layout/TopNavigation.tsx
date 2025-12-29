/**
 * Top Navigation Component
 * 
 * Modern top navigation bar with horizontal layout
 * Inspired by Tendata and Monday.com design
 * 
 * All custom code is proprietary and not open source.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui';

export const TopNavigation: React.FC = () => {
  const { user, logout } = useAuth();

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
    <div className="px-monday-6 pb-monday-4 pt-0">
      <nav className="bg-monday-surface rounded-t-none rounded-b-monday-lg shadow-monday-md border-x border-b border-gray-200">
        <div className="px-monday-6 py-monday-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-monday-3">
                <div className="text-monday-2xl font-bold text-monday-text tracking-tight">
                  峰华CRM系统
                </div>
              </Link>
            </div>

            {/* Right: User Info and Actions */}
            <div className="flex items-center gap-monday-4">
              {user && (
                <div className="hidden md:flex items-center gap-monday-3 text-monday-text">
                  <div className="text-right">
                    <p className="text-monday-sm font-medium">{user.email}</p>
                    <p className="text-monday-xs text-monday-text-secondary">{getRoleLabel(user.role || null)}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-blue to-primary-purple flex items-center justify-center text-white text-monday-sm font-semibold shadow-monday-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-monday-text hover:text-monday-text hover:bg-monday-bg"
              >
                登出
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

