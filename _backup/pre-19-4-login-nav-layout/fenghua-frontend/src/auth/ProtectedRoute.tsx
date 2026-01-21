/**
 * Protected Route Component
 * 
 * Protects routes that require authentication
 * All custom code is proprietary and not open source.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRoleType } from '../common/constants/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Optional array of allowed roles. If provided, only users with these roles can access the route.
   */
  allowedRoles?: UserRoleType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is provided
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role as UserRoleType)) {
      // User doesn't have required role, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

