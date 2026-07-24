import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, XCircle, Users, RefreshCw } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface SyncResult {
  success: boolean;
  message: string;
  results?: {
    created: number;
    updated: number;
    errors: number;
    total: number;
  };
}

export function UserSyncPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const syncAllUsers = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setResult({
          success: false,
          message: 'Você precisa estar autenticado'
        });
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/sync-all-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          results: data.results
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro ao sincronizar usuários'
        });
      }
    } catch (error) {
 console.error('Sync error:', error);
      setResult({
        success: false,
        message: 'Erro de conexão ao sincronizar usuários'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sincronização de Usuários
        </CardTitle>
        <CardDescription>
          Sincronizar utilizadores locais para a tabela do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            Esta função sincroniza todos os usuários do sistema de autenticação local
            para a tabela de utilizadores da base de dados.
          </p>
          <p className="font-medium">
            Quando usar:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Após criar usuários manualmente no sistema local</li>
            <li>Se houver usuários autenticados mas sem perfil no sistema</li>
            <li>Para resolver erros de RLS relacionados a usuários não encontrados</li>
          </ul>
        </div>

        <Button 
          onClick={syncAllUsers} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Todos os Usuários
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <div className="flex-1 space-y-2">
                <AlertDescription className="font-medium">
                  {result.message}
                </AlertDescription>
                {result.results && (
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{result.results.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Criados:</span>
                        <span className="font-medium text-green-600">{result.results.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Atualizados:</span>
                        <span className="font-medium text-blue-600">{result.results.updated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Erros:</span>
                        <span className="font-medium text-red-600">{result.results.errors}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="font-medium mb-1">Nota Técnica:</p>
          <p>
            Os usuários sincronizados automaticamente recebem o role "atendente" por padrão.
            Você pode alterar os roles manualmente após a sincronização.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
