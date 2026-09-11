import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../auth/auth-context';
import { hasPermission } from '../auth/permissions';
import { toast } from 'sonner@2.0.3';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Calendar, 
  User, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  level: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  success: boolean;
  details: Record<string, any>;
  errorMessage?: string;
}

interface SecurityAlert {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  description: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface AuditStats {
  totalLogs: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  byAction: Record<string, number>;
  byLevel: Record<string, number>;
  bySeverity: Record<string, number>;
  byDay: Record<string, { logs: number; alerts: number }>;
  recentActivity: AuditLog[];
}

export function AuditDashboard() {
  const { accessToken, user } = useAuth();
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    totalAlerts: 0,
    unresolvedAlerts: 0,
    criticalAlerts: 0,
    byAction: {},
    byLevel: {},
    bySeverity: {},
    byDay: {},
    recentActivity: []
  });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  
  // Filtros
  const [logFilters, setLogFilters] = useState({
    action: '',
    level: '',
    userId: '',
    search: ''
  });
  
  const [alertFilters, setAlertFilters] = useState({
    severity: '',
    type: '',
    resolved: ''
  });

  useEffect(() => {
    if (user && hasPermission(user.role, 'MANAGE_SETTINGS') && accessToken) {
      loadAuditData();
    }
  }, [user, accessToken]);

  const loadAuditData = async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      
      // Carregar estatísticas
      const statsResponse = await fetch(`${API_BASE_URL}/audit/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Carregar logs
      const logsResponse = await fetch(`${API_BASE_URL}/audit/logs?limit=50`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData.logs || []);
      }

      // Carregar alertas
      const alertsResponse = await fetch(`${API_BASE_URL}/audit/alerts?limit=30`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }

    } catch (error) {
 console.error('Error loading audit data:', error);
      toast.error('Erro ao carregar dados de auditoria');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/audit/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Alerta resolvido com sucesso');
        loadAuditData(); // Recarregar dados
      } else {
        toast.error('Erro ao resolver alerta');
      }
    } catch (error) {
 console.error('Error resolving alert:', error);
      toast.error('Erro ao resolver alerta');
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Activity className="h-4 w-4 text-tone-info" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-tone-gold" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-tone-danger" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-tone-accent" />;
      default:
        return <Activity className="h-4 w-4 text-tone-neutral" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-tone-info-soft text-tone-info';
      case 'warning':
        return 'bg-tone-gold-soft text-tone-gold';
      case 'error':
        return 'bg-tone-danger-soft text-tone-danger';
      case 'critical':
        return 'bg-tone-accent-soft text-tone-accent';
      default:
        return 'bg-tone-neutral-soft text-tone-neutral';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-tone-success-soft text-tone-success';
      case 'medium':
        return 'bg-tone-gold-soft text-tone-gold';
      case 'high':
        return 'bg-tone-warn-soft text-tone-warn';
      case 'critical':
        return 'bg-tone-danger-soft text-tone-danger';
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
          <AlertDescription>Acesso negado. Apenas administradores do sistema podem acessar esta seção.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Dashboard de Auditoria</h1>
          <p className="text-muted-foreground">Carregando dados de auditoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard de Auditoria & Segurança</h1>
          <p className="text-muted-foreground">
            Monitoramento de atividades e alertas de segurança
          </p>
        </div>
        
        <Button onClick={loadAuditData}>
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total de Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Alertas de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unresolvedAlerts} não resolvidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-tone-danger" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tone-danger">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-tone-success" />
              Taxa de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tone-success">
              {stats.totalAlerts > 0 ? 
                Math.round(((stats.totalAlerts - stats.unresolvedAlerts) / stats.totalAlerts) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Alertas resolvidos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="alerts">Alertas de Segurança</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Registro detalhado de todas as ações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros para logs */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar logs..."
                    value={logFilters.search}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                
                <Select value={logFilters.level} onValueChange={(value) => setLogFilters(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {logs
                    .filter(log => {
                      if (logFilters.level && log.level !== logFilters.level) return false;
                      if (logFilters.search && 
                          !log.action.toLowerCase().includes(logFilters.search.toLowerCase()) &&
                          !log.userEmail?.toLowerCase().includes(logFilters.search.toLowerCase())) return false;
                      return true;
                    })
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex-shrink-0">
                          {getLevelIcon(log.level)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{log.action.replace(/_/g, ' ')}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getLevelColor(log.level)}>
                                {log.level}
                              </Badge>
                              {log.success ? (
                                <CheckCircle className="h-4 w-4 text-tone-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-tone-danger" />
                              )}
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedLog(log)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes do Log</DialogTitle>
                                    <DialogDescription>
                                      ID: {log.id}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div>
                                        <h4 className="font-medium">Informações Básicas</h4>
                                        <div className="space-y-2 text-sm">
                                          <div><strong>Ação:</strong> {log.action}</div>
                                          <div><strong>Nível:</strong> {log.level}</div>
                                          <div><strong>Sucesso:</strong> {log.success ? 'Sim' : 'Não'}</div>
                                          <div><strong>Data:</strong> {formatDate(log.timestamp)}</div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Usuário</h4>
                                        <div className="space-y-2 text-sm">
                                          <div><strong>Email:</strong> {log.userEmail || 'N/A'}</div>
                                          <div><strong>Role:</strong> {log.userRole || 'N/A'}</div>
                                          <div><strong>IP:</strong> {log.ipAddress || 'N/A'}</div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {log.errorMessage && (
                                      <div>
                                        <h4 className="font-medium text-tone-danger">Erro</h4>
                                        <p className="text-sm text-tone-danger">{log.errorMessage}</p>
                                      </div>
                                    )}
                                    
                                    <div>
                                      <h4 className="font-medium">Detalhes</h4>
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2">
                            {log.userEmail && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.userEmail} ({log.userRole})
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {formatDate(log.timestamp)} | IP: {log.ipAddress || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Segurança</CardTitle>
              <CardDescription>
                Alertas automáticos baseados em atividades suspeitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros para alertas */}
              <div className="flex gap-4 mb-4">
                <Select value={alertFilters.severity} onValueChange={(value) => setAlertFilters(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-severity">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={alertFilters.resolved} onValueChange={(value) => setAlertFilters(prev => ({ ...prev, resolved: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-resolved">Todos</SelectItem>
                    <SelectItem value="false">Não Resolvidos</SelectItem>
                    <SelectItem value="true">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {alerts
                    .filter(alert => {
                      if (alertFilters.severity && alert.severity !== alertFilters.severity) return false;
                      if (alertFilters.resolved && String(alert.resolved) !== alertFilters.resolved) return false;
                      return true;
                    })
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-4 p-4 border rounded-lg ${
                          alert.severity === 'critical' ? 'border-tone-danger/30 bg-tone-danger-soft' :
                          alert.severity === 'high' ? 'border-tone-warn/30 bg-tone-warn-soft' : ''
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.severity === 'critical' ? 'text-tone-danger' :
                            alert.severity === 'high' ? 'text-tone-warn' :
                            alert.severity === 'medium' ? 'text-tone-gold' :
                            'text-tone-success'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{alert.description}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              
                              {alert.resolved ? (
                                <Badge className="bg-tone-success-soft text-tone-success">
                                  Resolvido
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => resolveAlert(alert.id)}
                                >
                                  Resolver
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2">
                            Tipo: {alert.type.replace(/_/g, ' ')} | 
                            {alert.userEmail && ` Usuário: ${alert.userEmail} | `}
                            IP: {alert.ipAddress || 'N/A'}
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {formatDate(alert.timestamp)}
                            {alert.resolved && alert.resolvedAt && (
                              <span> | Resolvido em {formatDate(alert.resolvedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ações mais comuns */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Mais Comuns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byAction || {})
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center">
                        <span className="text-sm">{action.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Atividade por dia */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byDay || {})
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 7)
                    .map(([date, data]) => (
                      <div key={date} className="flex justify-between items-center">
                        <span className="text-sm">{new Date(date).toLocaleDateString('pt-BR')}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">{data.logs} logs</Badge>
                          {data.alerts > 0 && (
                            <Badge className="bg-tone-danger-soft text-tone-danger">{data.alerts} alertas</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}