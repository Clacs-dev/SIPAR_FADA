import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { KeyRound, RefreshCw, Upload, Copy, Loader2, ShieldCheck } from 'lucide-react';
import { useLicense } from '../../hooks/use-license';
import { licenseApi, LicenseHistoryEntry, LicenseStatus } from '../../services/license-api';

const STATUS_LABEL: Record<LicenseStatus, string> = {
  UNLICENSED: 'Sem licenca ativada',
  PENDING: 'Pendente de ativacao',
  ACTIVE: 'Ativa',
  EXPIRING: 'A expirar',
  EXPIRED: 'Expirada',
  SUSPENDED: 'Suspensa',
  REVOKED: 'Revogada',
  INVALID: 'Invalida',
};

const STATUS_TONE: Record<LicenseStatus, string> = {
  UNLICENSED: 'var(--tone-info)',
  PENDING: 'var(--tone-gold)',
  ACTIVE: 'var(--tone-success)',
  EXPIRING: 'var(--tone-warn)',
  EXPIRED: 'var(--tone-danger)',
  SUSPENDED: 'var(--tone-danger)',
  REVOKED: 'var(--tone-danger)',
  INVALID: 'var(--tone-danger)',
};

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-PT');
}

export function LicenseManagement() {
  const { data, loading, reload, refresh } = useLicense();
  const [history, setHistory] = useState<LicenseHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await licenseApi.getHistory();
      setHistory(response.history || []);
    } catch (error) {
      console.error('Erro ao carregar historico de licenca:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleUpload = async () => {
    const licenseFile = licenseInputRef.current?.files?.[0] || null;
    const certFile = certInputRef.current?.files?.[0] || null;

    if (!licenseFile && !certFile) {
      toast.error('Selecione o ficheiro de licenca (.lic) e/ou o certificado de ativacao (.cert)');
      return;
    }

    setUploading(true);
    try {
      await licenseApi.activate(licenseFile, certFile);
      toast.success('Licenca atualizada com sucesso');
      if (licenseInputRef.current) licenseInputRef.current.value = '';
      if (certInputRef.current) certInputRef.current.value = '';
      await reload();
      await loadHistory();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar licenca');
    } finally {
      setUploading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      await loadHistory();
      toast.success('Licenca revalidada');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao revalidar a licenca');
    }
  };

  const handleCopyFingerprint = async () => {
    if (!data?.fingerprint) return;
    try {
      await navigator.clipboard.writeText(data.fingerprint);
      toast.success('Fingerprint copiado');
    } catch {
      toast.error('Nao foi possivel copiar o fingerprint');
    }
  };

  const status = data?.status || 'UNLICENSED';
  const license = data?.license;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
            Administração
          </div>
          <h1 className="flex items-center gap-2 font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>
            <KeyRound className="h-6 w-6" />
            Gestão de Licença
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
            Ativação, validade, módulos e histórico da licença deste sistema
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Revalidar agora
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Estado atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Estado:</span>
                <Badge className="text-white" style={{ backgroundColor: STATUS_TONE[status] }}>
                  {STATUS_LABEL[status]}
                </Badge>
                {data?.reason && <span className="text-xs text-muted-foreground">({data.reason})</span>}
              </div>

              {license ? (
                <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t">
                  <div><span className="text-muted-foreground">Cliente:</span> {license.customerName}</div>
                  <div><span className="text-muted-foreground">Tipo:</span> {license.licenseType}</div>
                  <div><span className="text-muted-foreground">Validade:</span> {formatDate(license.startsAt)} → {license.expiresAt ? formatDate(license.expiresAt) : 'vitalícia'}</div>
                  <div><span className="text-muted-foreground">Ativada em:</span> {formatDate(license.activatedAt)}</div>
                  <div><span className="text-muted-foreground">Limite de utilizadores:</span> {license.maxUsers ?? 'ilimitado'}</div>
                  <div><span className="text-muted-foreground">Limite de admins:</span> {license.maxAdmins ?? 'ilimitado'}</div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Módulos:</span>{' '}
                    {license.modules.length === 0 ? 'todos incluídos' : license.modules.join(', ')}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground pt-2 border-t">Nenhuma licença carregada nesta instalação ainda.</p>
              )}

              {data?.fingerprint && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-muted-foreground">Fingerprint desta instalação:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">{data.fingerprint}</code>
                  <Button variant="ghost" size="sm" onClick={handleCopyFingerprint}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carregar licença / certificado de ativação</CardTitle>
          <CardDescription>
            Carregue o ficheiro de licença (.lic) recebido do fornecedor. Se ainda não tiver o certificado de
            ativação, o fingerprint acima ficará disponível para enviar ao fornecedor — quando o receber, volte
            aqui e carregue o ficheiro .cert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="license-file">Ficheiro de licença (.lic)</Label>
              <input id="license-file" ref={licenseInputRef} type="file" accept=".lic,application/json" className="block w-full text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-file">Certificado de ativação (.cert)</Label>
              <input id="cert-file" ref={certInputRef} type="file" accept=".cert,application/json" className="block w-full text-sm" />
            </div>
          </div>
          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Carregar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de eventos</CardTitle>
          <CardDescription>Ativações, renovações, revogações e tentativas bloqueadas</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento registado ainda.</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{entry.action}</Badge>
                      {entry.success === false && (
                        <Badge className="text-white" style={{ backgroundColor: 'var(--tone-danger)' }}>falhou</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)} {entry.userEmail ? `por ${entry.userEmail}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
