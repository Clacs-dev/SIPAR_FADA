import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';
import { getFriendlyErrorMessage } from '@/services/api';
import { Mail, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';

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
      await resetPassword(email);
      setSuccess(true);
      toast.success('E-mail de recuperação enviado com sucesso!');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Erro ao enviar e-mail de recuperação. Tente novamente mais tarde.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-3xl">
        {/* Main Card */}
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: '0 30px 60px rgba(16, 29, 51, .14)' }}>
          <div className="flex flex-col md:flex-row">
            {/* Left Side - Branding */}
            <div
              className="md:w-2/5 p-9 flex flex-col justify-between relative overflow-hidden"
              style={{
                background: 'radial-gradient(120% 120% at 0% 0%, #1a2b4a 0%, var(--primary) 60%, #0b1526 100%)'
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: '-60px',
                  bottom: '-60px',
                  width: '220px',
                  height: '220px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(184,134,43,.28), transparent 70%)',
                  pointerEvents: 'none'
                }}
              />

              <div className="relative z-10">
                <h1 className="mb-2.5 text-white font-serif" style={{ fontSize: '30px', fontWeight: 600 }}>
                  SIPAR
                </h1>
                <div style={{
                  width: '36px',
                  height: '3px',
                  backgroundColor: 'var(--accent)',
                  marginBottom: '16px',
                  borderRadius: '2px'
                }}></div>
                <p style={{ color: '#b9c4d6', fontSize: '14px', lineHeight: 1.6, maxWidth: '30ch' }}>
                  Recuperação de acesso à sua conta, de forma rápida e segura.
                </p>
              </div>

              <div
                className="relative z-10 flex items-center gap-3 p-3.5 rounded-xl mt-8"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}
              >
                <div
                  className="w-[34px] h-[34px] rounded-md flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(184,134,43,.2)', color: 'var(--accent)' }}
                >
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Processo Seguro
                  </p>
                  <p style={{ fontSize: '11.5px', color: '#a9b6c8' }}>
                    O link expira em 1 hora e só pode ser usado uma vez
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="md:w-3/5 p-10 bg-white">
              <div className="max-w-md mx-auto">
                {success ? (
                  <div className="text-center space-y-4">
                    <div
                      className="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--status-aceite)' }}
                    >
                      <CheckCircle className="h-6 w-6" style={{ color: 'var(--status-aceite-foreground)' }} />
                    </div>
                    <div>
                      <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                        E-mail Enviado!
                      </h2>
                      <p style={{ fontSize: '13.5px', color: 'var(--login-text-secondary)' }}>
                        Enviamos um link de recuperação de senha para:
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginTop: '4px' }}>
                        {email}
                      </p>
                    </div>
                    <div className="rounded-md p-4 text-left" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--login-border)' }}>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
                        Próximos passos:
                      </h4>
                      <ol className="space-y-1 list-decimal list-inside" style={{ fontSize: '13px', color: 'var(--login-text-secondary)' }}>
                        <li>Verifique sua caixa de entrada</li>
                        <li>Clique no link recebido por e-mail</li>
                        <li>Defina uma nova senha</li>
                        <li>Faça login com a nova senha</li>
                      </ol>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                    </p>
                    <Button
                      onClick={onBack}
                      className="w-full h-11 transition-all hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--login-border)',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '9px'
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar ao Login
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-7">
                      <h2 className="flex items-center gap-2 font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                        <Mail className="h-5 w-5" />
                        Recuperar Senha
                      </h2>
                      <p style={{ fontSize: '13.5px', color: 'var(--login-text-secondary)' }}>
                        Digite seu e-mail para receber um link de recuperação de senha
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="email"
                          className="block mb-1.5"
                          style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}
                        >
                          E-mail
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          disabled={isLoading}
                          className="h-11 focus-visible:ring-[var(--ring)]"
                          style={{
                            backgroundColor: 'var(--background)',
                            borderColor: 'var(--login-border)',
                            borderRadius: '9px'
                          }}
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
                          disabled={isLoading}
                          className="w-full h-11 text-white transition-all hover:opacity-90"
                          style={{
                            backgroundColor: 'var(--primary)',
                            fontSize: '14px',
                            fontWeight: 600,
                            borderRadius: '9px'
                          }}
                        >
                          {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </Button>

                        <Button
                          type="button"
                          onClick={onBack}
                          disabled={isLoading}
                          className="w-full h-11 transition-all hover:opacity-90"
                          style={{
                            backgroundColor: 'var(--background)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--login-border)',
                            fontSize: '14px',
                            fontWeight: 600,
                            borderRadius: '9px'
                          }}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Voltar ao Login
                        </Button>
                      </div>
                    </form>

                    <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                        • O link de recuperação expira em 1 hora<br />
                        • Você só pode usar o link uma vez<br />
                        • Se não receber o e-mail, verifique a pasta de spam
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>
            © 2026 SIPAR. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
