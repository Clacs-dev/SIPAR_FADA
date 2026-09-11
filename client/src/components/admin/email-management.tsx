import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '../auth/auth-context';
import { hasPermission } from '../auth/permissions';
import { toast } from 'sonner@2.0.3';
import { Mail, Send, CheckCircle, XCircle, Clock, BarChart3, TestTube, AlertTriangle } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  byDay: Record<string, { sent: number; failed: number; total: number }>;
  recent: Array<{
    id: string;
    to: string;
    subject: string;
    status: string;
    timestamp: string;
    error?: string;
  }>;
}

interface TestResult {
  success: boolean;
  message: string;
  instructions?: string;
}

export function EmailManagement() {
  const { accessToken, user } = useAuth();
  const [stats, setStats] = useState<EmailStats>({ total: 0, sent: 0, failed: 0, byDay: {}, recent: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (user && hasPermission(user.role, 'MANAGE_SETTINGS') && accessToken) {
      loadEmailStats();
    }
  }, [user, accessToken]);

  const loadEmailStats = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/email/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('Erro ao carregar estatísticas de email');
      }
    } catch (error) {
 console.error('Error loading email stats:', error);
      toast.error('Erro ao carregar estatísticas de email');
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    if (!accessToken) return;

    setIsTestingConfig(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/email/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
        
        if (result.success) {
          toast.success('Teste de email enviado com sucesso!');
        } else {
          toast.error('Falha no teste de email');
        }
      } else {
        const error = await response.json();
        setTestResult({ 
          success: false, 
          message: error.error || 'Erro desconhecido', 
          instructions: error.instructions 
        });
        toast.error('Erro ao testar configuração de email');
      }
    } catch (error) {
 console.error('Error testing email config:', error);
      setTestResult({ success: false, message: 'Erro de conexão' });
      toast.error('Erro ao testar configuração de email');
    } finally {
      setIsTestingConfig(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-tone-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-tone-danger" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-tone-gold" />;
      default:
        return <Clock className="h-4 w-4 text-tone-neutral" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-tone-success-soft text-tone-success';
      case 'failed':
        return 'bg-tone-danger-soft text-tone-danger';
      case 'pending':
        return 'bg-tone-gold-soft text-tone-gold';
      default:
        return 'bg-tone-neutral-soft text-tone-neutral';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!user || !hasPermission(user.role, 'MANAGE_SETTINGS')) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>Acesso negado. Apenas administradores podem acessar esta seção.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Gerenciamento de Email</h1>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Gerenciamento de Email</h1>
          <p className="text-muted-foreground">
            Monitoramento do serviço de e-mail (Gmail/SMTP)
          </p>
        </div>
        
        <Button onClick={testEmailConfiguration} disabled={isTestingConfig}>
          <TestTube className="h-4 w-4 mr-2" />
          {isTestingConfig ? 'Testando...' : 'Testar Configuração'}
        </Button>
      </div>

      {/* Resultado do teste */}
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-tone-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-tone-danger" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
              
              {testResult.instructions && (
                <div className="bg-muted/50 p-3 rounded-md mt-3">
                  <h4 className="font-medium mb-2 text-sm">
                    {testResult.success ? 'Informações:' : 'Como resolver:'}
                  </h4>
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                    {testResult.instructions}
                  </pre>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Total de Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-tone-success" />
              Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tone-success">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}% de sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-tone-danger" />
              Falharam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tone-danger">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}% de falha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Taxa de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Últimos envios</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração atual */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Configuração</CardTitle>
          <CardDescription>
            Informações sobre a configuração atual de envio de e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Serviço de Email</h4>
              <div className="flex items-center gap-2">
                <Badge className="bg-tone-info-soft text-tone-info">Gmail / SMTP</Badge>
                <span className="text-sm text-muted-foreground">
                  Gerido em Configurações → Integrações
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Recursos Disponíveis</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-tone-success" />
                <span className="text-sm">Templates HTML</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-tone-success" />
                <span className="text-sm">Logs detalhados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-tone-success" />
                <span className="text-sm">Fallback para logs em desenvolvimento</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emails recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Emails Recentes</CardTitle>
          <CardDescription>
            Últimos 10 emails enviados pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum email encontrado</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {stats.recent.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(email.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{email.subject}</h4>
                        <Badge className={getStatusColor(email.status)}>
                          {email.status === 'sent' ? 'Enviado' : 
                           email.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        Para: {email.to}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(email.timestamp)}</span>
                        {email.error && (
                          <span className="text-tone-danger">Erro: {email.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas por dia */}
      {Object.keys(stats.byDay).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas por Dia</CardTitle>
            <CardDescription>
              Volume de emails enviados nos últimos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byDay)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 7)
                .map(([date, data]) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="font-medium">{new Date(date).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        Total: {data.total}
                      </div>
                      <div className="text-sm text-tone-success">
                        Enviados: {data.sent}
                      </div>
                      <div className="text-sm text-tone-danger">
                        Falhas: {data.failed}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}