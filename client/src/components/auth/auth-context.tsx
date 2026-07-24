import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../../services/api';
import { toast } from 'sonner';

export type UserRole = 
  | 'gabinete_pca'
  | 'gabinete_pce'
  | 'gabinete_administrador'
  | 'gabinete_director'
  | 'gestao'
  | 'gabinete_ministro'
  | 'gabinete_secretario_estado_1'
  | 'gabinete_secretario_estado_2'
  | 'gabinete_vice_governador_1'
  | 'gabinete_vice_governador_2'
  | 'financeiro'
  | 'recursos_humanos'
  | 'juridico'
  | 'compras'
  | 'tecnologia_informacao'
  | 'operacoes'
  | 'operacional_frota'
  | 'administracao'
  | 'administrativo'
  | 'comunicacao_imagem'
  | 'seguranca'
  | 'secretaria'
  | 'externo'
  | 'planeamento'
  | 'organizacao_qualidade'
  | 'compliance'
  | 'risco';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organization: string;
  phone: string;
  department?: string;
  position?: string;
  address?: string;
  document: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  register: (userData: RegisterUserData) => Promise<any>;
  isLoading: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
 console.log(' [Auth] Inicializando sistema de autenticação local (JWT)...');
      
      // 1. Verificar se há um fornecedor logado
      const fornecedorAuth = localStorage.getItem('fornecedor_auth');
      if (fornecedorAuth) {
        try {
          const { fornecedor } = JSON.parse(fornecedorAuth);
          const userObj = {
            id: fornecedor.id,
            name: fornecedor.nome,
            email: fornecedor.email,
            role: 'externo' as UserRole,
            created_at: new Date().toISOString(),
          };
          setUser(userObj);
          setAccessToken('fornecedor_token');
          setIsLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('fornecedor_auth');
        }
      }

      // 2. Verificar se há token JWT salvo para utilizador normal
      const savedToken = localStorage.getItem('access_token');
      if (savedToken) {
        try {
          setAccessToken(savedToken);
          // Buscar perfil atual do utilizador no backend Express
          const res = await api.get<{ user: User }>('/auth/me');
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        } catch (error) {
 console.warn(' Falha ao validar sessão salva (JWT expirado ou servidor offline):', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
 console.error('Erro na inicialização da autenticação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post<{ user: User; session: { access_token: string } }>('/auth/login', {
        email,
        password
      });

      if (res && res.session?.access_token) {
        setUser(res.user);
        setAccessToken(res.session.access_token);
        
        // Guardar credenciais no localStorage
        localStorage.setItem('access_token', res.session.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
 console.error('Erro ao efetuar login:', error);
      toast.error(error instanceof Error ? error.message : 'E-mail ou senha incorretos.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    try {
      // Notificar opcionalmente o servidor
      api.post('/auth/logout').catch(() => {});
    } catch (e) {}

    // Limpar estados locais
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('fornecedor_auth');
    toast.success('Sessão encerrada.');
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await api.post('/auth/reset-password', { email });
      return true;
    } catch (error) {
 console.error('Erro ao solicitar reset de senha:', error);
      return false;
    }
  };

  const register = async (userData: RegisterUserData): Promise<any> => {
    try {
      const res = await api.post<any>('/auth/register', userData);
      return res;
    } catch (error) {
 console.error('Erro ao registrar utilizador:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, resetPassword, register, isLoading, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}