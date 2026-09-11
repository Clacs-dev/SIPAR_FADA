import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import {
  Activity, Database, HardDrive, Mail, Bell, ShieldCheck, Download, RefreshCw,
  Loader2, AlertTriangle, Wrench, CheckCircle, XCircle, Archive, Save,
} from 'lucide-react';
import {
  useSystemHealth, useSystemDiagnostics, useSystemLogs, useMaintenanceMode, useBackups, HealthStatus,
} from '../../hooks/use-system-diagnostics';
import { getAuthHeaders } from '@/services/api';

const STATUS_TONE: Record<HealthStatus, string> = {
  healthy: 'var(--tone-success)',
  warning: 'var(--tone-warn)',
  degraded: 'var(--tone-gold)',
  critical: 'var(--tone-danger)',
  offline: 'var(--tone-neutral)',
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Saudável',
  warning: 'Atenção',
  degraded: 'Degradado',
  critical: 'Crítico',
  offline: 'Indisponível / N/A',
};

const COMPONENT_LABEL: Record<string, string> = {
  api: 'API',
  database: 'Base de Dados',
  auth: 'Autenticação',
  email: 'Email',
  push: 'Notificações Push',
  meeting_integrations: 'Integrações de Reunião',
  storage: 'Storage',
  jobs_queues: 'Filas / Jobs',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-PT');
}

function formatBytes(bytes: number | null) {
  if (bytes === null || bytes === undefined) return 'N/D';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function SystemDiagnostics() {
  const { health, loading: loadingHealth, error: errorHealth, reload: reloadHealth } = useSystemHealth();
  const { diagnostics, loading: loadingDiag, error: errorDiag, reload: reloadDiag } = useSystemDiagnostics();
  const { logs, loading: loadingLogs, error: errorLogs, reload: reloadLogs } = useSystemLogs();
  const { maintenance, loading: loadingMaintenance, error: errorMaintenance, toggle } = useMaintenanceMode();
  const { backups, loading: loadingBackups, error: errorBackups, creating: creatingBackup, createBackup, downloadUrl } = useBackups();

  const [logLevel, setLogLevel] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<{ enabled: boolean; message: string; eta: string }>({
    enabled: false, message: '', eta: '',
  });

  const currentMaintenance = maintenance ?? maintenanceForm;

  const handleRefreshAll = () => {
    reloadHealth();
    reloadDiag();
    reloadLogs({ level: logLevel === 'all' ? undefined : logLevel, search: logSearch || undefined });
  };

  const handleExportReport = () => {
    if (!health || !diagnostics) {
      toast.error('Aguarde os dados carregarem antes de exportar');
      return;
    }
    const report = { generatedAt: new Date().toISOString(), health, diagnostics };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-diagnostico-fada-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleMaintenance = async (enabled: boolean) => {
    setSavingMaintenance(true);
    try {
      await toggle({ enabled, message: currentMaintenance.message, eta: currentMaintenance.eta });
      toast.success(enabled ? 'Modo de manutenção ativado' : 'Modo de manutenção desativado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar modo de manutenção');
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup();
      toast.success('Cópia de segurança criada com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar cópia de segurança');
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const response = await fetch(downloadUrl(filename), { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao descarregar a cópia de segurança');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao descarregar a cópia de segurança');
    }
  };

  const handleSaveMaintenanceDetails = async () => {
    setSavingMaintenance(true);
    try {
      await toggle({
        enabled: currentMaintenance.enabled,
        message: maintenanceForm.message || currentMaintenance.message,
        eta: maintenanceForm.eta || currentMaintenance.eta,
      });
      toast.success('Detalhes do modo de manutenção guardados');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar detalhes');
    } finally {
      setSavingMaintenance(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
            Administração
          </div>
          <h1 className="font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>Diagnóstico do Sistema</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
            Saúde, integridade e operação técnica do SIPAR-FADA — dados reais, sem simulação
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Saude geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde Geral do Sistema
          </CardTitle>
          <CardDescription>Verificação em tempo real de cada componente</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHealth ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !health ? (
            <Alert variant="destructive"><AlertDescription>Não foi possível carregar o estado de saúde{errorHealth ? `: ${errorHealth}` : ''}.</AlertDescription></Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{health.overallPercent}%</div>
                <span className="text-sm text-muted-foreground">de componentes saudáveis</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {health.components.map((c) => (
                  <div
                    key={c.name}
                    className="p-3 rounded-lg border"
                    style={{ borderColor: STATUS_TONE[c.status], backgroundColor: `color-mix(in srgb, ${STATUS_TONE[c.status]} 12%, transparent)` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{COMPONENT_LABEL[c.name] || c.name}</span>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: STATUS_TONE[c.status], color: STATUS_TONE[c.status] }}>
                        {STATUS_LABEL[c.status]}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-80">{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="diagnostics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diagnostics">Diagnóstico Detalhado</TabsTrigger>
          <TabsTrigger value="logs">Logs Técnicos</TabsTrigger>
          <TabsTrigger value="maintenance">Modo de Manutenção</TabsTrigger>
          <TabsTrigger value="backups">Cópias de Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          {loadingDiag ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !diagnostics ? (
            <Alert variant="destructive"><AlertDescription>Não foi possível carregar o diagnóstico{errorDiag ? `: ${errorDiag}` : ''}.</AlertDescription></Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Base de Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tamanho do ficheiro</span><span>{formatBytes(diagnostics.database.dbFileSizeBytes)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Migrations aplicadas</span><span>{diagnostics.database.migrations.length}</span></div>
                  <div className="pt-2 border-t space-y-1">
                    {Object.entries(diagnostics.database.counts).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{key}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total de ficheiros</span><span>{diagnostics.storage.totalFiles}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Espaço usado</span><span>{formatBytes(diagnostics.storage.totalSizeBytes)}</span></div>
                  {(diagnostics.storage.integrity.missingOnDisk > 0 || diagnostics.storage.integrity.orphanOnDisk > 0) && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {diagnostics.storage.integrity.missingOnDisk > 0 && <div>{diagnostics.storage.integrity.missingOnDisk} ficheiro(s) registados na BD mas ausentes em disco</div>}
                        {diagnostics.storage.integrity.orphanOnDisk > 0 && <div>{diagnostics.storage.integrity.orphanOnDisk} ficheiro(s) em disco sem registo na BD</div>}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="pt-2 border-t space-y-1">
                    {Object.entries(diagnostics.storage.byModule).map(([mod, data]) => (
                      <div key={mod} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{mod}</span>
                        <span>{data.count} ficheiro(s) · {formatBytes(data.sizeBytes)}</span>
                      </div>
                    ))}
                    {Object.keys(diagnostics.storage.byModule).length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum ficheiro carregado ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Configurado</span><span>{diagnostics.email.configured ? 'Sim' : 'Não'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Enviados</span><span style={{ color: 'var(--tone-success)' }}>{diagnostics.email.sent}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Falhados</span><span style={{ color: 'var(--tone-danger)' }}>{diagnostics.email.failed}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Push &amp; Notificações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">VAPID configurado</span><span>{diagnostics.push.configured ? 'Sim' : 'Não'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subscrições ativas</span><span>{diagnostics.push.activeSubscriptions}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Notificações totais</span><span>{diagnostics.notifications.total}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Não lidas</span><span>{diagnostics.notifications.unread}</span></div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Integridade de RBAC</CardTitle>
                  <CardDescription>Verificação de consistência sobre a matriz de permissões já existente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-1">Roles sem nenhum utilizador ({diagnostics.rbac.unusedRoles.length})</p>
                    {diagnostics.rbac.unusedRoles.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {diagnostics.rbac.unusedRoles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium mb-1">Permissões órfãs ({diagnostics.rbac.orphanPermissions.length})</p>
                    {diagnostics.rbac.orphanPermissions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {diagnostics.rbac.orphanPermissions.map((p) => <Badge key={p} variant="destructive">{p}</Badge>)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex gap-2">
            <Select value={logLevel} onValueChange={(v) => { setLogLevel(v); reloadLogs({ level: v === 'all' ? undefined : v, search: logSearch || undefined }); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warn">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Buscar nos logs..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') reloadLogs({ level: logLevel === 'all' ? undefined : logLevel, search: logSearch || undefined }); }}
            />
            <Button variant="outline" onClick={() => reloadLogs({ level: logLevel === 'all' ? undefined : logLevel, search: logSearch || undefined })}>
              Buscar
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4">
              {loadingLogs ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : errorLogs ? (
                <Alert variant="destructive"><AlertDescription>Não foi possível carregar os logs: {errorLogs}.</AlertDescription></Alert>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum registo de log encontrado</p>
              ) : (
                <ScrollArea className="h-[420px]">
                  <div className="space-y-2 font-mono text-xs">
                    {logs.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded border"
                        style={log.level === 'error'
                          ? { borderColor: 'var(--tone-danger)', backgroundColor: 'var(--tone-danger-soft)' }
                          : log.level === 'warn'
                            ? { borderColor: 'var(--tone-warn)', backgroundColor: 'var(--tone-warn-soft)' }
                            : undefined}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{log.level}</Badge>
                          <span className="text-muted-foreground">{log.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{log.message || log.stack}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Modo de Manutenção</CardTitle>
              <CardDescription>
                Bloqueia o acesso de todos os utilizadores exceto o Administrador do Sistema, que nunca fica trancado fora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingMaintenance ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : errorMaintenance && !maintenance ? (
                <Alert variant="destructive"><AlertDescription>Não foi possível carregar o estado do modo de manutenção: {errorMaintenance}. O estado apresentado abaixo pode não refletir a realidade.</AlertDescription></Alert>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {currentMaintenance.enabled
                        ? <XCircle className="h-5 w-5" style={{ color: 'var(--tone-danger)' }} />
                        : <CheckCircle className="h-5 w-5" style={{ color: 'var(--tone-success)' }} />}
                      <div>
                        <p className="font-medium">{currentMaintenance.enabled ? 'Sistema em manutenção' : 'Sistema operacional'}</p>
                        <p className="text-xs text-muted-foreground">
                          {currentMaintenance.enabled ? 'Apenas o Administrador do Sistema tem acesso agora' : 'Todos os utilizadores têm acesso normal'}
                        </p>
                      </div>
                    </div>
                    <Switch checked={currentMaintenance.enabled} disabled={savingMaintenance} onCheckedChange={handleToggleMaintenance} />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="maintenance-message">Mensagem exibida aos utilizadores</Label>
                      <Textarea
                        id="maintenance-message"
                        placeholder="Ex: Estamos a realizar manutenção programada. Voltamos em breve."
                        defaultValue={currentMaintenance.message}
                        onChange={(e) => setMaintenanceForm((f) => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maintenance-eta">Previsão de conclusão (opcional)</Label>
                      <Input
                        id="maintenance-eta"
                        placeholder="Ex: 2026-09-30 18:00"
                        defaultValue={currentMaintenance.eta || ''}
                        onChange={(e) => setMaintenanceForm((f) => ({ ...f, eta: e.target.value }))}
                      />
                    </div>
                    <Button variant="outline" onClick={handleSaveMaintenanceDetails} disabled={savingMaintenance}>
                      Guardar mensagem/ETA
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5" /> Cópias de Segurança</CardTitle>
              <CardDescription>
                Cada instalação guarda os seus dados num único ficheiro local — sem cópia de segurança, um disco
                corrompido ou um erro apaga os dados de forma permanente. Crie uma cópia manual aqui, ou agende a
                execução periódica deste botão (ver instruções abaixo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateBackup} disabled={creatingBackup} className="gap-2">
                {creatingBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Criar cópia de segurança agora
              </Button>

              {loadingBackups ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : errorBackups ? (
                <Alert variant="destructive"><AlertDescription>Não foi possível carregar as cópias de segurança: {errorBackups}.</AlertDescription></Alert>
              ) : backups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma cópia de segurança criada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.filename} className="flex items-center justify-between p-3 border rounded-lg gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{backup.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(backup.createdAt)} · {formatBytes(backup.sizeBytes)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(backup.filename)} className="gap-2 shrink-0">
                        <Download className="h-3.5 w-3.5" />
                        Descarregar
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  São mantidas apenas as 30 cópias mais recentes neste servidor. Descarregue periodicamente as cópias
                  importantes para um local fora desta máquina (disco externo, rede, armazenamento na nuvem). No
                  Windows, pode agendar uma cópia diária automática com o Agendador de Tarefas a copiar o ficheiro{' '}
                  <code>server/prisma/dev.db</code> para outro local.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
