import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  Users as UsersIcon, 
  MessageSquare, 
  Activity,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '../../utils/api-client';

interface DatabaseStats {
  presentations: number;
  audiences: number;
  messages: number;
  audits: number;
  users: number;
  total: number;
}

interface ResetResults {
  presentationsDeleted: number;
  audiencesDeleted: number;
  messagesDeleted: number;
  auditsDeleted: number;
  usersDeleted: number;
  storageCleared: boolean;
  demoUsersRecreated: boolean;
  errors: string[];
}

export function DatabaseManagement() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetResults, setResetResults] = useState<ResetResults | null>(null);
  
  // Opções de reset
  const [options, setOptions] = useState({
    keepUsers: false,
    keepDemoUsers: true,
    resetStorage: true
  });

  useEffect(() => {
    // Verificar se o usuário está autenticado antes de carregar stats
    const token = localStorage.getItem('access_token');
    if (!token) {
 console.error(' [DatabaseManagement] Usuário não autenticado');
      toast.error('É necessário fazer login para acessar esta página');
      setLoading(false);
      return;
    }
    
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; stats: DatabaseStats }>('/admin/database/stats');
      setStats(response.stats);
    } catch (error) {
 console.error('Erro ao carregar estatísticas:', error);
      
      // Verificar se o erro é de autenticação
      if (error instanceof Error && error.message.includes('authentication token')) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
      } else {
        toast.error('Erro ao carregar estatísticas do banco de dados');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (confirmText !== 'RESETAR') {
      toast.error('Digite "RESETAR" para confirmar');
      return;
    }

    try {
      setResetting(true);
      setShowConfirmDialog(false);
      
      toast.loading('Resetando banco de dados... Isso pode levar alguns segundos.', {
        id: 'reset-db'
      });

      const response = await apiClient.post<{ 
        success: boolean; 
        message: string; 
        results: ResetResults 
      }>('/admin/database/reset', options);

      if (response.success) {
        setResetResults(response.results);
        toast.success('Banco de dados resetado com sucesso!', {
          id: 'reset-db'
        });
        
        // Recarregar estatísticas
        await loadStats();
        
        // Limpar confirmação
        setConfirmText('');
      } else {
        toast.error('Erro ao resetar banco de dados', {
          id: 'reset-db'
        });
      }
    } catch (error) {
 console.error('Erro ao resetar banco de dados:', error);
      toast.error('Erro ao resetar banco de dados', {
        id: 'reset-db'
      });
    } finally {
      setResetting(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    setConfirmText('');
    setResetResults(null);
    setShowConfirmDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Gerenciamento do Banco de Dados</h1>
        <p className="text-muted-foreground">
          Visualize estatísticas e gerencie os dados do sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cartas de Apresentação
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.presentations || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Registros no banco
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Audiências
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.audiences || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Registros no banco
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mensagens
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.messages || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Registros no banco
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Logs de Auditoria
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.audits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Registros no banco
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.users || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Contas criadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Registros
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              No KV Store
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resultados do último reset */}
      {resetResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>Reset Concluído com Sucesso</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Apresentações deletadas:</div>
              <div className="font-medium">{resetResults.presentationsDeleted}</div>
              
              <div>Audiências deletadas:</div>
              <div className="font-medium">{resetResults.audiencesDeleted}</div>
              
              <div>Mensagens deletadas:</div>
              <div className="font-medium">{resetResults.messagesDeleted}</div>
              
              <div>Auditorias deletadas:</div>
              <div className="font-medium">{resetResults.auditsDeleted}</div>
              
              <div>Usuários deletados:</div>
              <div className="font-medium">{resetResults.usersDeleted}</div>
              
              <div>Storage limpo:</div>
              <div className="font-medium">{resetResults.storageCleared ? 'Sim' : 'Não'}</div>
              
              <div>Usuários demo recriados:</div>
              <div className="font-medium">{resetResults.demoUsersRecreated ? 'Sim' : 'Não'}</div>
            </div>

            {resetResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Erros encontrados:</div>
                  <ul className="mt-2 space-y-1 text-xs">
                    {resetResults.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ações de Reset */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Zona de Perigo</CardTitle>
          </div>
          <CardDescription>
            Ações irreversíveis que afetam o banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> O reset do banco de dados é uma ação <strong>irreversível</strong>.
              Todos os dados selecionados serão permanentemente deletados.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keepUsers"
                checked={options.keepUsers}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, keepUsers: checked as boolean })
                }
              />
              <Label htmlFor="keepUsers" className="cursor-pointer">
                Manter todos os usuários (incluindo registros criados manualmente)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="keepDemoUsers"
                checked={options.keepDemoUsers}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, keepDemoUsers: checked as boolean })
                }
                disabled={options.keepUsers}
              />
              <Label 
                htmlFor="keepDemoUsers" 
                className={options.keepUsers ? 'text-muted-foreground' : 'cursor-pointer'}
              >
                Manter apenas usuários demo (admin@exemplo.ao, atendente@exemplo.ao, usuario@exemplo.ao)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="resetStorage"
                checked={options.resetStorage}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, resetStorage: checked as boolean })
                }
              />
              <Label htmlFor="resetStorage" className="cursor-pointer">
                Limpar storage (deletar todos os documentos enviados)
              </Label>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              variant="destructive"
              onClick={handleOpenConfirmDialog}
              disabled={resetting || loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Resetar Banco de Dados
            </Button>

            <Button
              variant="outline"
              onClick={loadStats}
              disabled={loading || resetting}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Estatísticas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Reset do Banco de Dados
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong> e irá deletar permanentemente:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Todas as {stats?.presentations || 0} cartas de apresentação</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Todos os {stats?.audiences || 0} pedidos de audiência</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Todas as {stats?.messages || 0} mensagens</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Todos os {stats?.audits || 0} logs de auditoria</span>
              </li>
              {!options.keepUsers && (
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>
                    {options.keepDemoUsers 
                      ? `${(stats?.users || 0) - 3} usuários (mantendo 3 demos)`
                      : `Todos os ${stats?.users || 0} usuários`
                    }
                  </span>
                </li>
              )}
              {options.resetStorage && (
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>Todos os documentos no storage</span>
                </li>
              )}
            </ul>

            <div className="space-y-2">
              <Label htmlFor="confirm-text">
                Digite <strong>"RESETAR"</strong> para confirmar:
              </Label>
              <input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESETAR"
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={resetting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetDatabase}
              disabled={confirmText !== 'RESETAR' || resetting}
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirmar Reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}