/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays a fallback UI
 * All custom code is proprietary and not open source.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component to catch and handle React component errors
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-6">
            <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md mb-monday-4" role="alert">
              <h3 className="font-semibold mb-monday-2">仪表板加载出错</h3>
              <p className="text-monday-sm mb-monday-2">
                {this.state.error?.message || '发生了未知错误'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-monday-2">
                  <summary className="cursor-pointer text-monday-sm">查看错误详情</summary>
                  <pre className="mt-monday-2 text-monday-xs overflow-auto bg-gray-100 p-monday-2 rounded">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <Button
              onClick={this.handleReset}
              variant="primary"
            >
              重试
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

