/**
 * Authentication Service Unit Tests
 * 
 * Tests for frontend auth service
 * All custom code is proprietary and not open source.
 * 
 * Note: This test file uses Jest syntax. If using Vitest, adjust imports accordingly.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { authService } from './auth.service';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login and store token', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'ADMIN',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(localStorageMock.getItem('auth_token')).toBe('mock-token');
      expect(localStorageMock.getItem('user')).toBe(JSON.stringify(mockResponse.user));
    });

    it('should throw error on login failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear token and user from localStorage', async () => {
      localStorageMock.setItem('auth_token', 'mock-token');
      localStorageMock.setItem('user', JSON.stringify({ id: 'user-123' }));

      await authService.logout();

      expect(localStorageMock.getItem('auth_token')).toBeNull();
      expect(localStorageMock.getItem('user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.setItem('auth_token', 'mock-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      localStorageMock.removeItem('auth_token');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getUser', () => {
    it('should return user from localStorage', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      expect(authService.getUser()).toEqual(mockUser);
    });

    it('should return null when user does not exist', () => {
      localStorageMock.removeItem('user');
      expect(authService.getUser()).toBeNull();
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user', async () => {
      localStorageMock.setItem('auth_token', 'mock-token');
      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'ADMIN' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await authService.validateToken();
      expect(result).toEqual(mockUser);
    });

    it('should throw error when token is invalid', async () => {
      localStorageMock.setItem('auth_token', 'invalid-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(authService.validateToken()).rejects.toThrow();
    });
  });
});

