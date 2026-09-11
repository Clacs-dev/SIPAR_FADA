import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from './auth-context';
import { toast } from 'sonner';
import { getFriendlyErrorMessage } from '@/services/api';
import { KeyRound, CheckCircle, ShieldCheck } from 'lucide-react';

interface ResetPasswordConfirmFormProps {
  token: string;
  onDone: () => void;
}

export function ResetPasswordConfirmForm({ token, onDone }: ResetPasswordConfirmFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { confirmPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A nova password deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('As duas passwords não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(token, password);
      setSuccess(true);
      toast.success('Password redefinida com sucesso!');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível redefinir a password. O link pode ter expirado.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: '0 30px 60px rgba(16, 29, 51, .14)' }}>
          <div className="flex flex-col md:flex-row">
            <div
              className="md:w-2/5 p-9 flex flex-col justify-between relative overflow-hidden"
              style={{ background: 'radial-gradient(120% 120% at 0% 0%, #1a2b4a 0%, var(--primary) 60%, #0b1526 100%)' }}
            >
              <div
                aria-hidden="true"
                style={{ position: 'absolute', right: '-60px', bottom: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,134,43,.28), transparent 70%)', pointerEvents: 'none' }}
              />
              <div className="relative z-10">
                <h1 className="mb-2.5 text-white font-serif" style={{ fontSize: '30px', fontWeight: 600 }}>SIPAR</h1>
                <div style={{ width: '36px', height: '3px', backgroundColor: 'var(--accent)', marginBottom: '16px', borderRadius: '2px' }}></div>
                <p style={{ color: '#b9c4d6', fontSize: '14px', lineHeight: 1.6, maxWidth: '30ch' }}>
                  Defina a sua nova password de acesso.
                </p>
              </div>
              <div
                className="relative z-10 flex items-center gap-3 p-3.5 rounded-xl mt-8"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}
              >
                <div className="w-[34px] h-[34px] rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(184,134,43,.2)', color: 'var(--accent)' }}>
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Link de uso único</p>
                  <p style={{ fontSize: '11.5px', color: '#a9b6c8' }}>Este link deixa de funcionar depois de usado</p>
                </div>
              </div>
            </div>

            <div className="md:w-3/5 p-10 bg-white">
              <div className="max-w-md mx-auto">
                {success ? (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--status-aceite)' }}>
                      <CheckCircle className="h-6 w-6" style={{ color: 'var(--status-aceite-foreground)' }} />
                    </div>
                    <div>
                      <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                        Password redefinida!
                      </h2>
                      <p style={{ fontSize: '13.5px', color: 'var(--login-text-secondary)' }}>
                        Já pode iniciar sessão com a sua nova password.
                      </p>
                    </div>
                    <Button
                      onClick={onDone}
                      className="w-full h-11 text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: 'var(--primary)', fontSize: '14px', fontWeight: 600, borderRadius: '9px' }}
                    >
                      Ir para o login
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-7">
                      <h2 className="flex items-center gap-2 font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                        <KeyRound className="h-5 w-5" />
                        Nova password
                      </h2>
                      <p style={{ fontSize: '13.5px', color: 'var(--login-text-secondary)' }}>
                        Escolha uma nova password para a sua conta
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="password" className="block mb-1.5" style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                          Nova password
                        </label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          disabled={isLoading}
                          className="h-11 focus-visible:ring-[var(--ring)]"
                          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--login-border)', borderRadius: '9px' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block mb-1.5" style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                          Confirmar nova password
                        </label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a password"
                          disabled={isLoading}
                          className="h-11 focus-visible:ring-[var(--ring)]"
                          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--login-border)', borderRadius: '9px' }}
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
                          style={{ backgroundColor: 'var(--primary)', fontSize: '14px', fontWeight: 600, borderRadius: '9px' }}
                        >
                          {isLoading ? 'A guardar...' : 'Redefinir password'}
                        </Button>
                        <Button
                          type="button"
                          onClick={onDone}
                          disabled={isLoading}
                          className="w-full h-11 transition-all hover:opacity-90"
                          style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--login-border)', fontSize: '14px', fontWeight: 600, borderRadius: '9px' }}
                        >
                          Voltar ao login
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>© 2026 SIPAR. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
