/**
 * Error Boundary - Componente para capturar erros React
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.state = { hasError: true, error, errorInfo };

    // Log do erro
    console.error('[ErrorBoundary]', error);
    console.error('[ErrorBoundary]', errorInfo);

    // Callback opcional
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
          <div className="max-w-md w-full bg-card rounded-lg border border-border p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6 text-destructive">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-xl font-bold">Algo deu errado</h1>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente novamente.
              </p>

              {this.state.error && (
                <details className="text-sm bg-muted/50 rounded p-3">
                  <summary className="cursor-pointer font-medium">
                    Ver detalhes do erro
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Ir ao Painel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar ErrorBoundary como componente funcional
import { useState } from 'react';

export function useErrorHandler() {
  const [, setError] = useState<Error | null>(null);

  return function handleError(error: Error) {
    setError(() => {
      console.error('[ErrorHandler]', error);
      return error;
    });
  };
}
