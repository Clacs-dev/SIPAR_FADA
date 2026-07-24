import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  onBack: () => void;
}

export function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Por favor, digite seu e-mail');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, digite um e-mail válido');
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPassword(email);
      
      if (result) {
        setSuccess(true);
        toast.success('E-mail de recuperação enviado com sucesso!');
      } else {
        setError('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.');
      }
    } catch (error) {
      setError('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">E-mail Enviado!</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enviamos um link de recuperação de senha para:
                  </p>
                  <p className="font-medium text-primary">{email}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Verifique sua caixa de entrada</li>
                    <li>Clique no link recebido por e-mail</li>
                    <li>Defina uma nova senha</li>
                    <li>Faça login com a nova senha</li>
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground">
                  Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                </p>
                <Button onClick={onBack} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recuperar Senha
            </CardTitle>
            <CardDescription>
              Digite seu e-mail para receber um link de recuperação de senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={onBack}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Informações importantes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• O link de recuperação expira em 1 hora</li>
            <li>• Você só pode usar o link uma vez</li>
            <li>• Se não receber o e-mail, verifique a pasta de spam</li>
          </ul>
        </div>
      </div>
    </div>
  );
}