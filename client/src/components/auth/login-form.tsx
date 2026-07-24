import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { ResetPasswordForm } from './reset-password-form';
import { RegisterForm } from './register-form';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const { login, isLoading } = useAuth();

  const features = [
    {
      icon: '📋',
      title: 'Gestão Completa',
      description: 'Controle total de apresentações e pedidos'
    },
    {
      icon: '🗓️',
      title: 'Agenda Integrada',
      description: 'Marcação e acompanhamento de reuniões'
    },
    {
      icon: '⚡',
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
 console.log(' Tentando login...');
    
    const success = await login(email, password);
    if (success) {
      toast.success('Login realizado com sucesso!');
    } else {
      setError('Email ou senha incorretos. Verifique suas credenciais.');
 console.error('Login failed - check credentials');
    }
  };

  const handleResetAdminUser = async () => {
    if (!confirm('⚠️ Isso vai deletar e recriar o usuário admin@sistema.com. Tem certeza?')) {
      return;
    }

    toast.info('Resetando usuário admin...');

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/reset-admin-user`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(false),
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Usuário admin resetado com sucesso!');
 console.log('Novo perfil:', data.profile);
      } else {
        toast.error(`❌ Erro: ${data.error}`);
 console.error('Reset error:', data);
      }
    } catch (error) {
      toast.error('❌ Erro ao resetar admin');
 console.error('Reset error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f2f2f2' }}>
      <div className="w-full max-w-3xl">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left Side - Branding */}
            <div className="md:w-2/5 p-8 flex flex-col justify-center" style={{ 
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)'
            }}>
              <div className="mb-6">
                <h1 className="mb-3 text-white" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '2px' }}>
                  SIPAR
                </h1>
                <div style={{ 
                  width: '50px', 
                  height: '3px', 
                  backgroundColor: '#888',
                  marginBottom: '16px'
                }}></div>
                <p className="text-gray-300" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                  Sistema Integrado de Gestão Processos, Aprovações e Registos
                </p>
              </div>

              <div className="mt-6" style={{ height: '80px', position: 'relative' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="rounded-lg p-2 mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: '18px' }}>{features[currentFeature].icon}</span>
                    </div>
                    <div>
                      <p className="text-white" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                        {features[currentFeature].title}
                      </p>
                      <p className="text-gray-400" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                        {features[currentFeature].description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Indicators */}
                <div className="flex gap-2 mt-4 justify-center">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: index === currentFeature ? '#888' : 'rgba(255,255,255,0.3)',
                        transition: 'background-color 0.3s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="md:w-3/5 p-8 bg-white">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>
                    Bem-vindo de volta
                  </h2>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Entre com suas credenciais para continuar
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2"
                      style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}
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
                      className="h-10 border-gray-300 focus:border-gray-800 focus:ring-gray-800"
                      style={{ 
                        backgroundColor: '#fafafa',
                        borderColor: '#e0e0e0'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block mb-2"
                      style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}
                    >
                      Senha
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      disabled={isLoading}
                      className="h-10 border-gray-300 focus:border-gray-800 focus:ring-gray-800"
                      style={{ 
                        backgroundColor: '#fafafa',
                        borderColor: '#e0e0e0'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-gray-300 rounded focus:ring-gray-800"
                        style={{ accentColor: '#333' }}
                      />
                      <span className="ml-2" style={{ fontSize: '14px', color: '#666' }}>
                        Lembrar-me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="hover:underline transition-all"
                      style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}
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
                    className="w-full h-10 text-white transition-all hover:opacity-90"
                    style={{ 
                      backgroundColor: '#1a1a1a',
                      fontSize: '15px', 
                      fontWeight: 600 
                    }}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e5e5' }}>
                  <p className="text-center" style={{ fontSize: '14px', color: '#666' }}>
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className="hover:underline transition-all"
                      style={{ color: '#1a1a1a', fontWeight: 600 }}
                    >
                      Criar conta
                    </button>
                  </p>
                  
                  {/* Botão temporário de reset do admin */}
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={handleResetAdminUser}
                      className="text-xs text-gray-400 hover:text-red-600 underline"
                      title="Resetar usuário admin@sistema.com"
                    >
                      🔧 Resetar Admin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p style={{ fontSize: '13px', color: '#888' }}>
            © 2025 SIGAA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}