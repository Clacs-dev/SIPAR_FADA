import { useState, useEffect } from 'react';
import { Mail, Key, CheckCircle, AlertCircle, ExternalLink, Copy, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from 'sonner@2.0.3';

export function GmailConfig() {
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Verificar status da configuração ao carregar
  const checkConfiguration = async () => {
    setChecking(true);
    setConfigStatus(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/email/test`,
        {
          method: 'GET',
          headers: {
            ...getAuthHeaders(false),
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setConfigStatus(data);
      
      if (data.success) {
        toast.success('✅ Gmail configurado corretamente!');
      } else {
        toast.warning(data.message || 'Gmail ainda não configurado');
      }
    } catch (error: any) {
      setConfigStatus({
        success: false,
        message: `Erro ao verificar configuração: ${error.message}`,
      });
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setChecking(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Por favor, insira um email de teste');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/email/send-test`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(false),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: testEmail,
            subject: 'Teste de Configuração - Gmail SMTP',
            message: 'Se você recebeu este email, o Gmail SMTP está configurado corretamente! 🎉',
          }),
        }
      );

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast.success('✅ Email de teste enviado! Verifique sua caixa de entrada.');
      } else {
        toast.error(`❌ Falha ao enviar: ${data.error || data.message}`);
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
      });
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('✅ Copiado para área de transferência!');
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Mail className="h-8 w-8" />
          Configuração do Gmail SMTP
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure o envio de emails automáticos usando sua conta Gmail
        </p>
      </div>

      {/* Status Atual */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Status da Configuração
          </CardTitle>
          <CardDescription>
            Verifique se o Gmail SMTP está configurado corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={checkConfiguration}
            disabled={checking}
            className="w-full"
            size="lg"
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Verificar Status Atual
              </>
            )}
          </Button>

          {configStatus && (
            <Alert variant={configStatus.success ? 'default' : 'destructive'} className="border-2">
              <AlertDescription className="space-y-3">
                <div className="flex items-center gap-2">
                  {configStatus.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="font-bold text-base">{configStatus.message}</span>
                </div>
                
                {configStatus.details && (
                  <div className="bg-muted p-3 rounded text-sm space-y-1">
                    {Object.entries(configStatus.details).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                )}
                
                {configStatus.instructions && (
                  <pre className="text-xs whitespace-pre-wrap mt-2 p-3 bg-muted rounded border">
                    {configStatus.instructions}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Guia de Configuração Rápida */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Mail className="h-5 w-5" />
            🚀 Configuração Rápida (2 minutos)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <Alert className="bg-white border-blue-300">
            <AlertDescription>
              <strong>✅ Vantagens do Gmail SMTP:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                <li><strong>100% Gratuito</strong> - Sem custos adicionais</li>
                <li><strong>Fácil de configurar</strong> - Pronto em 2 minutos</li>
                <li><strong>Confiável</strong> - Infraestrutura do Google</li>
                <li><strong>500 emails/dia</strong> - Suficiente para desenvolvimento e testes</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="bg-white p-4 rounded border border-blue-300">
            <p className="font-bold mb-2">📋 Resumo dos Passos:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Ativar verificação em 2 etapas no Gmail</li>
              <li>Gerar uma "Senha de App"</li>
              <li>Configurar as variáveis no servidor Express</li>
              <li>Testar o envio</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Passo 1: Ativar Verificação em 2 Etapas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
              1
            </span>
            Ativar Verificação em 2 Etapas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              ⚠️ <strong>Importante:</strong> Você precisa ter a verificação em 2 etapas ativada na sua conta Google para gerar senhas de app.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div className="flex-1">
                <p className="font-medium mb-2">Acesse as configurações de segurança do Google:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Configurações de Segurança
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <p>Procure por <strong>"Verificação em duas etapas"</strong> e clique</p>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <p>Clique em <strong>"Começar"</strong> e siga as instruções</p>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <div>
                <p>Configure um método de verificação (SMS ou App Google Authenticator)</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Recomendamos usar o Google Authenticator para maior segurança
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passo 2: Gerar Senha de App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
              2
            </span>
            Gerar Senha de App do Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertDescription className="text-yellow-900">
              <strong>🔑 O que é uma Senha de App?</strong><br />
              É uma senha especial de 16 caracteres que permite aplicações (como este sistema) enviarem emails pela sua conta Gmail de forma segura, sem usar sua senha principal.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div className="flex-1">
                <p className="font-medium mb-2">Acesse a página de Senhas de App:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://myaccount.google.com/apppasswords', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Gerar Senha de App
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <p>Faça login com sua conta Google (se necessário)</p>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <p>No campo <strong>"Nome do app"</strong>, digite:</p>
                <div className="bg-muted p-2 rounded font-mono text-xs mt-1 flex items-center justify-between">
                  <span>Sistema Gestão Ofícios</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('Sistema Gestão Ofícios')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <p>Clique em <strong>"Criar"</strong></p>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">5</Badge>
              <div className="flex-1">
                <p className="font-bold text-orange-600">
                  ⚠️ COPIE A SENHA IMEDIATAMENTE!
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Será algo como: <code className="bg-muted px-1 py-0.5 rounded">abcd efgh ijkl mnop</code>
                  <br />
                  Você só poderá ver esta senha uma vez!
                </p>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-300">
            <AlertDescription className="text-blue-900 text-xs">
              💡 <strong>Dica:</strong> A senha de app tem 16 caracteres divididos em 4 grupos de 4. 
              Você pode copiar com ou sem os espaços - ambos funcionam.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 3: Configurar no servidor Express */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
              3
            </span>
            Configurar no servidor Express
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Configure duas variáveis de ambiente no servidor Express com suas credenciais do Gmail.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div className="flex-1">
                <p className="font-medium mb-2">Acesse as variaveis de ambiente do servidor Express:</p>
                <div className="bg-muted p-3 rounded font-mono text-xs">
                  servidor Express Dashboard → Settings → API Express → variaveis de ambiente
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div className="flex-1">
                <p className="font-medium mb-3">Adicione a primeira variável:</p>
                <div className="space-y-2 bg-white p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[140px] font-bold">Nome da Secret:</Label>
                    <div className="flex-1 flex items-center gap-2">
                      <Input value="GMAIL_USER" readOnly className="bg-muted font-mono" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard('GMAIL_USER')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[140px] font-bold">Valor:</Label>
                    <Input
                      type="email"
                      placeholder="seu-email@gmail.com"
                      value={gmailUser}
                      onChange={(e) => setGmailUser(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground ml-[140px]">
                    Digite seu endereço de email do Gmail completo
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div className="flex-1">
                <p className="font-medium mb-3">Adicione a segunda variável:</p>
                <div className="space-y-2 bg-white p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[140px] font-bold">Nome da Secret:</Label>
                    <div className="flex-1 flex items-center gap-2">
                      <Input value="GMAIL_APP_PASSWORD" readOnly className="bg-muted font-mono" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard('GMAIL_APP_PASSWORD')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[140px] font-bold">Valor:</Label>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="abcdefghijklmnop (senha de app de 16 caracteres)"
                        value={gmailAppPassword}
                        onChange={(e) => setGmailAppPassword(e.target.value)}
                        className="font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground ml-[140px]">
                    Cole a senha de app de 16 caracteres (pode incluir ou remover os espaços)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <p>Clique em <strong>"Save"</strong> ou <strong>"Add Secret"</strong> para cada variável</p>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">5</Badge>
              <div>
                <p className="font-medium">Aguarde a API Express reiniciar</p>
                <p className="text-muted-foreground text-xs mt-1">
                  ⏱️ Pode levar 10-30 segundos para as mudanças serem aplicadas
                </p>
              </div>
            </div>
          </div>

          <Alert className="bg-orange-50 border-orange-300">
            <AlertDescription className="text-orange-900 text-xs">
              ⚠️ <strong>Importante:</strong> Remova todos os espaços da senha de app antes de salvar, 
              ou mantenha-os - o Nodemailer aceita ambos os formatos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 4: Testar Configuração */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold">
              4
            </span>
            Testar Configuração
          </CardTitle>
          <CardDescription className="text-green-700">
            Envie um email de teste para confirmar que tudo está funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email" className="text-base font-semibold">
              Email para Teste
            </Label>
            <Input
              id="test-email"
              type="email"
              placeholder="seu@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Enviaremos um email de teste para este endereço
            </p>
          </div>

          <Button
            onClick={sendTestEmail}
            disabled={testing || !testEmail}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando Email de Teste...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" />
                Enviar Email de Teste
              </>
            )}
          </Button>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'} className="border-2">
              <AlertDescription>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="font-bold">
                    {testResult.success ? '✅ Email enviado com sucesso!' : '❌ Falha no envio'}
                  </span>
                </div>
                {testResult.error && (
                  <p className="mt-2 text-sm">
                    <strong>Erro:</strong> {testResult.error}
                  </p>
                )}
                {testResult.messageId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Message ID: {testResult.messageId}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-white border-green-300">
            <AlertDescription className="text-xs">
              ✅ Se o email chegar na sua caixa de entrada, a configuração está perfeita! 
              Lembre-se de verificar também a pasta de spam/lixo eletrônico.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Problemas Comuns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <p className="font-semibold">❌ "Invalid login" ou "Username and Password not accepted"</p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
              <li>Verifique se a verificação em 2 etapas está ativada</li>
              <li>Confirme que está usando uma <strong>Senha de App</strong>, não sua senha normal</li>
              <li>Remova todos os espaços da senha de app</li>
              <li>Gere uma nova senha de app e tente novamente</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">❌ "Gmail não configurado"</p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
              <li>Confirme que adicionou ambas as variáveis (GMAIL_USER e GMAIL_APP_PASSWORD)</li>
              <li>Aguarde 30 segundos após salvar para a API Express reiniciar</li>
              <li>Clique em "Verificar Status Atual" novamente</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">❌ Email não chegou</p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
              <li>Verifique a pasta de spam/lixo eletrônico</li>
              <li>Aguarde alguns minutos (pode haver delay)</li>
              <li>Tente enviar para outro email</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Links Úteis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Links Úteis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://support.google.com/accounts/answer/185833', '_blank')
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Como criar Senhas de App do Google
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://support.google.com/accounts/answer/185839', '_blank')
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Como ativar verificação em 2 etapas
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://docs.sendgrid.com/ui/account-and-settings/api-keys', '_blank')
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Documentacao de configuracao do servidor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
