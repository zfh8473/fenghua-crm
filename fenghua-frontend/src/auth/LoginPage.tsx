/**
 * Login Page Component
 * 
 * Modern, beautiful user login interface with glassmorphism
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Input, Button } from '../components/ui';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Redirect to the page user was trying to access, or home
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '用户名或密码错误';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-uipro-bg p-monday-4 overflow-hidden">
      {/* 19.4 login-nav-layout：禁止紫/粉；仅 uipro-cta、uipro-primary、uipro-secondary 浅色装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] -top-[300px] -left-[300px] rounded-full bg-gradient-to-br from-uipro-cta/30 to-transparent blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute w-[500px] h-[500px] top-1/2 right-0 rounded-full bg-gradient-to-bl from-uipro-secondary/30 to-transparent blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute w-[400px] h-[400px] bottom-0 left-1/2 rounded-full bg-gradient-to-t from-uipro-cta/20 to-transparent blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <Card variant="default" className="relative z-10 w-full max-w-md">
        <div className="text-center mb-monday-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-uipro-cta text-white text-monday-2xl font-bold mb-monday-4">
            F
          </div>
          <h1 className="text-monday-3xl font-bold text-uipro-text font-uipro-heading mb-monday-2">欢迎回来</h1>
          <p className="text-monday-base text-uipro-secondary">登录您的账户以继续</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-linear-4">
          {error && (
            <div className="p-monday-3 bg-semantic-error/10 border border-semantic-error rounded-monday-md flex items-center gap-monday-2 text-semantic-error text-monday-sm" role="alert">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <Input
            label="邮箱地址"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="name@example.com"
            autoComplete="email"
            leftIcon={
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            }
          />

          <div className="relative">
            <Input
              label="密码"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="请输入密码"
              minLength={6}
              autoComplete="current-password"
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  className="text-uipro-secondary hover:text-uipro-text transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 rounded-monday-sm cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full !bg-uipro-cta hover:!bg-uipro-cta/90 cursor-pointer transition-colors duration-200"
          >
            {!isLoading && '登录'}
          </Button>
        </form>

        <div className="mt-monday-6 text-center">
          <p className="text-monday-sm text-uipro-secondary">© 2025 峰华AIO. 专有代码，不开源。</p>
        </div>
      </Card>
    </div>
  );
};
