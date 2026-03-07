import { Component, type ReactNode, type ErrorInfo } from 'react';
import type { ViewerError } from '../../core/types';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: ViewerError) => void;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary — catches renderer errors and shows a friendly error UI.
 * Provides a retry button to re-mount the child component.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const viewerError: ViewerError = {
      code: 'RENDERER_CRASH',
      message: error.message,
      originalError: error,
    };
    this.props.onError?.(viewerError);
    console.error('[UniView] Renderer error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8" role="alert">
          {/* Error icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {this.state.error?.message ?? 'An unexpected error occurred while rendering.'}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Error code: RENDERER_CRASH
            </p>
          </div>

          <button
            onClick={this.handleRetry}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Retry loading document"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
