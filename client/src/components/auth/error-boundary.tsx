import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Se for erro de autenticação, limpar sessão
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Recarregar a página
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message.includes('401') || 
                          this.state.error?.message.includes('Unauthorized') ||
                          this.state.error?.message.includes('authentication');

      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>
                  {isAuthError ? 'Erro de Autenticação' : 'Ocorreu um Erro'}
                </CardTitle>
              </div>
              <CardDescription>
                {isAuthError 
                  ? 'Sua sessão expirou ou é inválida'
                  : 'Algo deu errado. Por favor, tente novamente.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAuthError ? (
                <Alert>
                  <AlertDescription>
                    Por favor, faça login novamente para continuar usando o sistema.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    {this.state.error?.message || 'Erro desconhecido'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Recarregar Página
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 p-4 bg-muted rounded-md">
                  <summary className="cursor-pointer text-sm font-medium">
                    Detalhes do Erro (Desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
