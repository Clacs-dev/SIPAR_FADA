import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { ResetPasswordForm } from './reset-password-form';
import { ResetPasswordConfirmForm } from './reset-password-confirm-form';
import { RegisterForm } from './register-form';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { getFriendlyErrorMessage } from '@/services/api';
import { ClipboardList, CalendarClock, Zap, Settings, Eye, EyeOff } from 'lucide-react';
import { ServerUrlDialog } from './server-url-dialog';
import { PERMITIR_ENDERECO_SERVIDOR } from '@/services/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showServerUrl, setShowServerUrl] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(() => new URLSearchParams(window.location.search).get('resetToken'));
  const [currentFeature, setCurrentFeature] = useState(0);
  const { login, isLoading } = useAuth();

  const features = [
    {
      icon: ClipboardList,
      title: 'Gestão Completa',
      description: 'Controle total de apresentações e pedidos'
    },
    {
      icon: CalendarClock,
      title: 'Agenda Integrada',
      description: 'Marcação e acompanhamento de reuniões'
    },
    {
      icon: Zap,
      title: 'Processos Automatizados',
      description: 'Fluxo de aprovação simplificado'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const clearResetTokenFromUrl = () => {
    setResetToken(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('resetToken');
    window.history.replaceState({}, '', url.toString());
  };

  if (resetToken) {
    return <ResetPasswordConfirmForm token={resetToken} onDone={clearResetTokenFromUrl} />;
  }

  if (showResetPassword) {
    return <ResetPasswordForm onBack={() => setShowResetPassword(false)} />;
  }

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setError('');

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível iniciar sessão. Tente novamente.'));
    }
  };

  const CurrentIcon = features[currentFeature].icon;

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
                  Sistema Integrado de Processos, Aprovações &amp; Registos.
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
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentFeature}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CurrentIcon className="h-[18px] w-[18px]" />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {features[currentFeature].title}
                    </p>
                    <p style={{ fontSize: '11.5px', color: '#a9b6c8' }}>
                      {features[currentFeature].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="md:w-3/5 p-10 bg-white">
              <div className="max-w-md mx-auto">
                <div className="mb-7">
                  <h2 className="font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                    Bem-vindo de volta
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--login-text-secondary)' }}>
                    Entre com as suas credenciais para continuar
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

                  <div>
                    <label
                      htmlFor="password"
                      className="block mb-1.5"
                      style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite a sua senha"
                        disabled={isLoading}
                        className="h-11 pr-10 focus-visible:ring-[var(--ring)]"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--login-border)',
                          borderRadius: '9px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--accent)', borderColor: 'var(--login-border)' }}
                      />
                      <span className="ml-2" style={{ fontSize: '13.5px', color: 'var(--login-text-secondary)' }}>
                        Lembrar-me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="hover:underline transition-all"
                      style={{ fontSize: '13.5px', color: 'var(--ring)', fontWeight: 600 }}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

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
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>

                <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-center" style={{ fontSize: '13px', color: 'var(--login-text-secondary)' }}>
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className="hover:underline transition-all"
                      style={{ color: 'var(--ring)', fontWeight: 600 }}
                    >
                      Criar conta
                    </button>
                  </p>

                </div>
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

      {/* Configurar o endereco do servidor: so com VITE_PERMITIR_ENDERECO_SERVIDOR=true (na web usa-se sempre o VITE_API_URL). */}
      {PERMITIR_ENDERECO_SERVIDOR && (
        <>
          <button
            type="button"
            onClick={() => setShowServerUrl(true)}
            title="Configurar endereço do servidor"
            aria-label="Configurar endereço do servidor"
            className="fixed bottom-4 left-4 flex items-center justify-center rounded-full transition-opacity hover:opacity-100"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'var(--login-border)',
              color: 'var(--login-text-secondary)',
              opacity: 0.55,
            }}
          >
            <Settings className="h-4 w-4" />
          </button>
          <ServerUrlDialog open={showServerUrl} onOpenChange={setShowServerUrl} />
        </>
      )}
    </div>
  );
}
