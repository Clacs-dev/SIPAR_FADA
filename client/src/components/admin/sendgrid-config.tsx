import { useState, useEffect } from 'react';
import { Mail, Key, CheckCircle, AlertCircle, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from 'sonner@2.0.3';

export function SendGridConfig() {
  const [apiKey, setApiKey] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [fromEmail, setFromEmail] = useState('sistema@apresentacoes.gov.br');
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [showKey, setShowKey] = useState(false);

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
        toast.success('✅ SendGrid configurado corretamente!');
      } else {
        toast.error(data.message || 'Erro na configuração do SendGrid');
      }
    } catch (error) {
      setConfigStatus({
        success: false,
        message: `Erro ao verificar configuração: ${error.message}`,
      });
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setChecking(false);
    }
  };

  const testConfiguration = async () => {
    setTesting(true);
    setTestResult(null);

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
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro: ${error.message}`,
      });
    } finally {
      setTesting(false);
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
            subject: 'Teste de Configuração - SendGrid',
            message: 'Se você recebeu este email, o SendGrid está configurado corretamente!',
          }),
        }
      );

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast.success('Email de teste enviado! Verifique sua caixa de entrada.');
      } else {
        toast.error(`Falha ao enviar: ${data.error}`);
      }
    } catch (error) {
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
    toast.success('Copiado para área de transferência!');
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Configuração do SendGrid
        </h1>
        <p className="text-muted-foreground">
          Configure o serviço de envio de emails automáticos
        </p>
      </div>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testConfiguration}
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verificar Status Atual
              </>
            )}
          </Button>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              <AlertDescription className="space-y-2">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="font-medium">{testResult.message}</span>
                </div>
                {testResult.instructions && (
                  <pre className="text-xs whitespace-pre-wrap mt-2 p-3 bg-muted rounded">
                    {testResult.instructions}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Erro 401 - Instruções */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            Erro 401: API Key Inválida
          </CardTitle>
          <CardDescription className="text-orange-700">
            A chave API atual está inválida, expirada ou revogada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-orange-900">
          <div>
            <p className="font-medium mb-2">🔧 Como resolver:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Acesse o painel do SendGrid</li>
              <li>Crie uma nova API Key com permissões de "Mail Send"</li>
              <li>Configure a variável de ambiente no servidor Express</li>
              <li>Teste a configuração novamente</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Erro 403 - Sender Identity não verificado */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            Erro 403: Sender Identity não verificado
          </CardTitle>
          <CardDescription className="text-red-700">
            O endereço de email remetente não está verificado no SendGrid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-red-900">
          <Alert className="bg-white border-red-300">
            <AlertDescription>
              <strong>📧 Email padrão do sistema:</strong> sistema@apresentacoes.gov.br
              <br />
              Este email precisa ser verificado no SendGrid antes de enviar mensagens.
            </AlertDescription>
          </Alert>

          <div>
            <p className="font-medium mb-2">🔧 Como resolver:</p>
            <ol className="list-decimal list-inside space-y-3 ml-2">
              <li className="font-medium">
                Verifique seu Sender Identity no SendGrid
                <ol className="list-[lower-alpha] list-inside ml-4 mt-2 space-y-1 font-normal">
                  <li>Acesse: <a href="https://app.sendgrid.com/settings/sender_auth/senders" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sender Authentication → Single Sender Verification</a></li>
                  <li>Clique em <strong>"Create New Sender"</strong></li>
                  <li>Preencha com um <strong>email real que você tenha acesso</strong></li>
                  <li>Verifique o email clicando no link que o SendGrid enviar</li>
                </ol>
              </li>
              <li className="font-medium mt-2">
                Configure o email verificado no sistema
                <p className="font-normal mt-1 ml-4 text-xs">
                  ⚠️ O email verificado precisa ser o mesmo usado pelo sistema. <br />
                  Recomendamos usar um email real da sua organização (ex: noreply@suaempresa.com)
                </p>
              </li>
            </ol>
          </div>

          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertDescription className="text-yellow-900 text-xs">
              <strong>💡 Dica Importante:</strong> Em produção, use um domínio próprio verificado no SendGrid 
              (Domain Authentication) ao invés de Single Sender. Isso permite enviar de qualquer email do domínio.
              <br />
              <a href="https://app.sendgrid.com/settings/sender_auth" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mt-1 inline-block">
                Configurar Domain Authentication →
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 1: Gerar Nova API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              1
            </span>
            Gerar Nova API Key no SendGrid
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm">Siga estes passos no painel do SendGrid:</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Acesse as configurações de API Keys</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => window.open('https://app.sendgrid.com/settings/api_keys', '_blank')}
                  >
                    https://app.sendgrid.com/settings/api_keys
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <p>Clique em <strong>"Create API Key"</strong></p>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <p>Dê um nome (ex: "Sistema Gestão - Ofícios")</p>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <div>
                  <p>Selecione <strong>"Restricted Access"</strong></p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Em "Mail Send", marque <strong>"Full Access"</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">5</Badge>
                <p>Clique em <strong>"Create & View"</strong></p>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">6</Badge>
                <div>
                  <p className="font-medium text-orange-600">
                    ⚠️ COPIE a chave IMEDIATAMENTE
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Você só poderá ver a chave uma vez! Ela começa com "SG."
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Dica:</strong> A API key deve começar com "SG." seguido de uma longa sequência de caracteres.
                Exemplo: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Passo 2: Configurar no servidor Express */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              2
            </span>
            Configurar no servidor Express
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div className="flex-1">
                <p className="font-medium mb-2">Acesse as variaveis de ambiente do servidor Express</p>
                <div className="bg-muted p-3 rounded font-mono text-xs">
                  servidor Express Dashboard → API Express → variaveis de ambiente
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div className="flex-1">
                <p className="font-medium mb-2">Edite ou adicione a variável:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[120px]">Nome:</Label>
                    <div className="flex-1 flex items-center gap-2">
                      <Input value="SENDGRID_API_KEY" readOnly className="bg-muted" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard('SENDGRID_API_KEY')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[120px]">Valor:</Label>
                    <Input
                      type={showKey ? 'text' : 'password'}
                      placeholder="Cole aqui a API key do SendGrid (começa com SG.)"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? '🙈' : '👁️'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <p>Clique em <strong>"Save"</strong> ou <strong>"Update"</strong></p>
                <p className="text-muted-foreground text-xs mt-1">
                  ⚠️ Importante: Após salvar, aguarde alguns segundos para a API Express reiniciar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <p>Volte aqui e clique em <strong>"Verificar Status Atual"</strong> novamente</p>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Se a variável SENDGRID_API_KEY já existir no servidor Express, 
              você só precisa substituir o valor pela nova chave gerada.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 3: Testar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              3
            </span>
            Testar Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email para Teste</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="seu@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enviaremos um email de teste para este endereço
            </p>
          </div>

          <Button
            onClick={sendTestEmail}
            disabled={testing || !testEmail}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando Email de Teste...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email de Teste
              </>
            )}
          </Button>

          <Alert>
            <AlertDescription className="text-xs">
              Se o email chegar na sua caixa de entrada, a configuração está perfeita! 
              Lembre-se de verificar também a pasta de spam.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Link de Ajuda */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              window.open('https://docs.sendgrid.com/ui/account-and-settings/api-keys', '_blank')
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Documentação do SendGrid sobre API Keys
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