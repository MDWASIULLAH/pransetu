import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-full w-full bg-error-container/20 text-on-error-container p-4 text-center rounded-xl border border-error">
          <h2 className="text-lg font-bold mb-2">Component Crashed</h2>
          <p className="text-sm">Something went wrong while rendering this module.</p>
          <pre className="mt-4 text-xs text-left bg-surface/50 p-2 rounded max-w-full overflow-auto">
            {this.state.error?.message}
          </pre>
          <button 
            className="mt-4 px-4 py-2 bg-error text-on-error rounded text-sm font-semibold hover:bg-error/90 transition-colors"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
