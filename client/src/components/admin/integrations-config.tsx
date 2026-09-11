import { useState, useEffect } from 'react';
import { Mail, Video, CheckCircle, AlertCircle, Eye, EyeOff, Save, Loader2, TestTube, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from 'sonner@2.0.3';

const MASK = '••••••••';

type FieldDef = { key: string; label: string; placeholder?: string; secret?: boolean; type?: string };

function SecretField({
  def, value, onChange,
}: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={def.key}>{def.label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={def.key}
          type={def.secret && !show ? 'password' : (def.type || 'text')}
          placeholder={def.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {def.secret && (
          <Button type="button" size="sm" variant="outline" onClick={() => setShow((s) => !s)}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function useJson(path: string) {
  const load = async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { ...getAuthHeaders(false), 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };
  return load;
}

async function putJson(path: string, body: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(false), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

const EMAIL_FIELDS: FieldDef[] = [
  { key: 'gmail_user', label: 'Utilizador Gmail', placeholder: 'seu-email@gmail.com' },
  { key: 'gmail_app_password', label: 'Senha de App do Gmail', placeholder: '16 caracteres', secret: true },
  { key: 'smtp_host', label: 'Servidor SMTP (alternativa ao Gmail)', placeholder: 'smtp.exemplo.com' },
  { key: 'smtp_port', label: 'Porta SMTP', placeholder: '587' },
  { key: 'smtp_user', label: 'Utilizador SMTP', placeholder: 'utilizador' },
  { key: 'smtp_pass', label: 'Senha SMTP', placeholder: '••••••••', secret: true },
  { key: 'from', label: 'Endereço de remetente', placeholder: 'sistema@fada.gov.ao' },
];

function EmailTab() {
  const loadConfig = useJson('/email/config');
  const [values, setValues] = useState<Record<string, string>>({});
  const [hasOverrides, setHasOverrides] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await loadConfig();
      const next: Record<string, string> = {};
      for (const field of EMAIL_FIELDS) next[field.key] = data.config?.[field.key] ?? '';
      setValues(next);
      setHasOverrides(Boolean(data.hasOverrides));
    } catch (error: any) {
      toast.error(`Erro ao carregar configuração de e-mail: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await putJson('/email/config', values);
      toast.success('Configuração de e-mail guardada.');
      await load();
    } catch (error: any) {
      toast.error(`Erro ao guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/email/test`, {
        method: 'GET',
        headers: { ...getAuthHeaders(false), 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setTestResult(data);
      if (data.email?.configured) toast.success('E-mail configurado corretamente.');
      else toast.warning('E-mail ainda não configurado.');
    } catch (error: any) {
      toast.error(`Erro ao testar: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription className="text-sm">
          Preencha <strong>Gmail</strong> (mais simples, requer{' '}
          <button
            type="button"
            className="underline"
            onClick={() => window.open('https://myaccount.google.com/apppasswords', '_blank')}
          >
            senha de app do Google
          </button>
          ) <strong>ou</strong> um servidor <strong>SMTP</strong> próprio — não é preciso preencher os dois.
          Campos deixados em branco caem para o que estiver definido no <code>.env</code> do servidor, se existir.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Credenciais de envio
          </CardTitle>
          <CardDescription>
            {hasOverrides ? (
              <span className="inline-flex items-center gap-1.5"><Badge className="bg-tone-success-soft text-tone-success">Configurado pelo admin</Badge> os campos de senha mostram {MASK} — deixe assim para manter o valor atual.</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Badge variant="outline">A usar .env / não configurado</Badge></span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {EMAIL_FIELDS.map((field) => (
            <SecretField
              key={field.key}
              def={field}
              value={values[field.key] ?? ''}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
          Verificar ligação
        </Button>
      </div>

      {testResult && (
        <Alert variant={testResult.email?.configured ? 'default' : 'destructive'}>
          <AlertDescription className="flex items-start gap-2">
            {testResult.email?.configured ? <CheckCircle className="h-4 w-4 mt-0.5 text-tone-success" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
            <span>
              {testResult.email?.configured
                ? `Servidor detetado: ${testResult.email.host} (${testResult.email.provider}).`
                : 'Nenhum servidor de e-mail configurado.'}
              {testResult.verification && !testResult.verification.ok && testResult.verification.error && (
                <> — {testResult.verification.error}</>
              )}
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

const PLATFORM_META: Record<string, { label: string; fields: FieldDef[] }> = {
  googlemeet: {
    label: 'Google Meet',
    fields: [
      { key: 'google_client_id', label: 'Client ID' },
      { key: 'google_client_secret', label: 'Client Secret', secret: true },
      { key: 'google_refresh_token', label: 'Refresh Token', secret: true },
      { key: 'google_calendar_id', label: 'Calendar ID', placeholder: 'primary' },
      { key: 'meeting_googlemeet_default_link', label: 'Link fixo de fallback' },
    ],
  },
  zoom: {
    label: 'Zoom',
    fields: [
      { key: 'zoom_account_id', label: 'Account ID' },
      { key: 'zoom_client_id', label: 'Client ID' },
      { key: 'zoom_client_secret', label: 'Client Secret', secret: true },
      { key: 'meeting_zoom_default_link', label: 'Link fixo de fallback' },
    ],
  },
  teams: {
    label: 'Microsoft Teams',
    fields: [
      { key: 'teams_tenant_id', label: 'Tenant ID' },
      { key: 'teams_client_id', label: 'Client ID' },
      { key: 'teams_client_secret', label: 'Client Secret', secret: true },
      { key: 'teams_user_id', label: 'User ID (organizador)' },
      { key: 'meeting_teams_default_link', label: 'Link fixo de fallback' },
    ],
  },
};

const GENERAL_FIELDS: FieldDef[] = [
  { key: 'meeting_default_link', label: 'Link fixo geral (usado se nenhuma plataforma acima estiver ligada)' },
  { key: 'meeting_timezone', label: 'Fuso horário', placeholder: 'Africa/Luanda' },
];

function MeetingsTab() {
  const loadConfig = useJson('/meeting-integrations');
  const [platforms, setPlatforms] = useState<Record<string, Record<string, string>>>({});
  const [general, setGeneral] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, { configured: boolean; fallbackLink: boolean }> & { generalFallbackLink?: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await loadConfig();
      const nextPlatforms: Record<string, Record<string, string>> = {};
      for (const [platform, meta] of Object.entries(PLATFORM_META)) {
        nextPlatforms[platform] = {};
        for (const field of meta.fields) nextPlatforms[platform][field.key] = data.platforms?.[platform]?.[field.key] ?? '';
      }
      const nextGeneral: Record<string, string> = {};
      for (const field of GENERAL_FIELDS) nextGeneral[field.key] = data.general?.[field.key] ?? '';
      setPlatforms(nextPlatforms);
      setGeneral(nextGeneral);
      setStatus(data.status ?? {});
    } catch (error: any) {
      toast.error(`Erro ao carregar plataformas de reunião: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = { ...general };
      for (const values of Object.values(platforms)) Object.assign(body, values);
      await putJson('/meeting-integrations', body);
      toast.success('Configuração de plataformas de reunião guardada.');
      await load();
    } catch (error: any) {
      toast.error(`Erro ao guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription className="text-sm">
          Cada plataforma só gera links reais quando todos os seus campos estiverem preenchidos.
          Sem isso, usa-se o link fixo da própria plataforma, depois o link fixo geral abaixo.
          Se <strong>nenhuma</strong> plataforma nem o link fixo geral estiverem configurados, o sistema
          <strong> não cria reuniões online</strong> — quem agendar vê um aviso a pedir para configurar aqui primeiro.
        </AlertDescription>
      </Alert>

      {Object.entries(PLATFORM_META).map(([platform, meta]) => {
        const platformStatus = status[platform];
        return (
          <Card key={platform}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4" />
                {meta.label}
                {platformStatus?.configured ? (
                  <Badge className="bg-tone-success-soft text-tone-success">Ligado (links reais)</Badge>
                ) : platformStatus?.fallbackLink ? (
                  <Badge variant="outline">Apenas link fixo</Badge>
                ) : status.generalFallbackLink ? (
                  <Badge variant="outline">A usar o link fixo geral</Badge>
                ) : (
                  <Badge className="bg-tone-danger-soft text-tone-danger">Não configurado</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {meta.fields.map((field) => (
                <SecretField
                  key={field.key}
                  def={field}
                  value={platforms[platform]?.[field.key] ?? ''}
                  onChange={(v) => setPlatforms((prev) => ({ ...prev, [platform]: { ...prev[platform], [field.key]: v } }))}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Definições gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {GENERAL_FIELDS.map((field) => (
            <SecretField
              key={field.key}
              def={field}
              value={general[field.key] ?? ''}
              onChange={(v) => setGeneral((prev) => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar
      </Button>
    </div>
  );
}

export function IntegrationsConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ExternalLink className="h-8 w-8" />
          Integrações
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure o envio de e-mails e as plataformas de reunião. Estes valores ficam guardados na base de dados
          desta instalação (não no ficheiro <code>.env</code> do servidor).
        </p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList>
          <TabsTrigger value="email">E-mail</TabsTrigger>
          <TabsTrigger value="meetings">Plataformas de reunião</TabsTrigger>
        </TabsList>
        <TabsContent value="email" className="mt-6">
          <EmailTab />
        </TabsContent>
        <TabsContent value="meetings" className="mt-6">
          <MeetingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
