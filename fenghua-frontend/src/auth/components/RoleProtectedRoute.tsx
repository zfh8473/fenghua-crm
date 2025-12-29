/**
 * Role Protected Route Component
 * 
 * Protects routes based on user role
 * All custom code is proprietary and not open source.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'DIRECTOR' | 'FRONTEND_SPECIALIST' | 'BACKEND_SPECIALIST';
  requiredPermission?: string;
  requiredResource?: string;
  fallbackPath?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredResource,
  fallbackPath = '/',
}) => {
  const { user, isAuthenticated, isLoading, hasPermission, canAccess } = useAuth();

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && user.role?.toUpperCase() !== requiredRole.toUpperCase()) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check resource access requirement
  if (requiredResource && !canAccess(requiredResource)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

