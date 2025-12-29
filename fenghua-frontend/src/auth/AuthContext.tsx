/**
 * Authentication Context
 * 
 * Provides authentication state management
 * All custom code is proprietary and not open source.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { authService, User } from './auth.service';
import { UserRole } from '../roles/role-descriptions';

interface AuthContextType {
  user: User | null;
  currentUser: User | null; // Alias for user (for backward compatibility)
  token: string | null; // Current authentication token
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(authService.getToken());

  useEffect(() => {
    // Check if user is already authenticated on mount
    const initAuth = async () => {
      const currentUser = authService.getUser();
      if (currentUser && authService.isAuthenticated()) {
        // Validate token
        const validatedUser = await authService.validateToken();
        setUser(validatedUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
    setToken(response.token);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    const validatedUser = await authService.validateToken();
    setUser(validatedUser);
  };

  /**
   * Check if user has a specific permission
   * Based on role-based permissions
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.role) {
      return false;
    }

    const role = user.role.toUpperCase() as UserRole;

    // Permission mapping based on PRD RBAC matrix
    const rolePermissions: Record<UserRole, string[]> = {
      ADMIN: [
        'MANAGE_USERS',
        'MANAGE_SYSTEM',
        'EXPORT_DATA',
        'ACCESS_ALL_CUSTOMERS',
        'ACCESS_BUYERS',
        'ACCESS_SUPPLIERS',
      ],
      DIRECTOR: ['EXPORT_DATA', 'ACCESS_ALL_CUSTOMERS', 'ACCESS_BUYERS', 'ACCESS_SUPPLIERS'],
      FRONTEND_SPECIALIST: ['ACCESS_BUYERS'],
      BACKEND_SPECIALIST: ['ACCESS_SUPPLIERS'],
    };

    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission.toUpperCase());
  }, [user]);

  /**
   * Check if user can access a specific resource
   */
  const canAccess = useCallback((resource: string): boolean => {
    if (!user || !user.role) {
      return false;
    }

    const role = user.role.toUpperCase() as UserRole;

    // Resource access mapping
    switch (resource.toLowerCase()) {
      case 'users':
      case 'user-management':
        return role === 'ADMIN';
      case 'system':
      case 'system-settings':
        return role === 'ADMIN';
      case 'buyers':
      case 'buyer':
        return role === 'ADMIN' || role === 'DIRECTOR' || role === 'FRONTEND_SPECIALIST';
      case 'suppliers':
      case 'supplier':
        return role === 'ADMIN' || role === 'DIRECTOR' || role === 'BACKEND_SPECIALIST';
      case 'all':
      case 'all-customers':
        return role === 'ADMIN' || role === 'DIRECTOR';
      default:
        return false;
    }
  }, [user]);

  const contextValue = useMemo(
    () => ({
      user,
      currentUser: user, // Alias for backward compatibility
      token, // Use state-managed token
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
      hasPermission,
      canAccess,
    }),
    [user, token, isLoading, hasPermission, canAccess],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

