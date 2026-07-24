import { useEffect, useState } from 'react';
import { ComprasMain } from '../compras/compras-main';
import { FornecedorPortal } from '../compras/fornecedor-portal';
import { useAuth } from '../auth/auth-context';
import { apiClient } from '../../utils/api-client';
import { toast } from 'sonner@2.0.3';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface ComprasProps {
  mode?: 'procurement' | 'cotacoes';
}

export function Compras({ mode = 'procurement' }: ComprasProps) {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
 console.log(' [Compras] Modo:', mode);
 console.log(' [Compras] Utilizador:', user?.name, '| Email:', user?.email);
    
    if (mode === 'cotacoes' && user) {
      // Criar/obter fornecedor para usuário interno
      criarOuObterFornecedor();
    } else {
      setIsChecking(false);
    }
  }, [mode, user]);

  const criarOuObterFornecedor = async () => {
    if (!user) {
      setError('Usuário não autenticado');
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      setError(null);
      
 console.log(' [Compras] Criando/obtendo fornecedor para usuário:', user.email);
      
      // Criar fornecedor automático vinculado ao usuário
      const response = await apiClient.post<{ fornecedor: any }>('/procurement/fornecedores/auto-create', {
        user_id: user.id,
        nome: user.name || user.email,
        email: user.email,
        telefone: user.phone || '',
        empresa: 'Usuário Interno',
        nif: '',
        endereco: '',
        tipo: 'interno'
      });

 console.log(' [Compras] Fornecedor criado/obtido:', response.fornecedor.id);
      setFornecedorId(response.fornecedor.id);
      
    } catch (err: any) {
 console.error(' [Compras] Erro ao criar fornecedor:', err);
      const errorMsg = err?.message || 'Erro ao configurar acesso de fornecedor';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsChecking(false);
    }
  };

  // Enquanto verifica, mostrar loading
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">A configurar acesso...</p>
        </div>
      </div>
    );
  }

  // Se houver erro ao criar fornecedor
  if (error && mode === 'cotacoes') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao Configurar Acesso</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={criarOuObterFornecedor}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Se o modo é "cotacoes", mostrar portal de cotações
  if (mode === 'cotacoes' && user && fornecedorId) {
 console.log(' [Compras] Renderizando Portal de Cotações para:', user.name);
    return (
      <FornecedorPortal 
        fornecedorId={fornecedorId}
        fornecedorNome={user.name || user.email}
      />
    );
  }

  // Caso contrário, mostrar interface de comprador (admin/gestor)
 console.log(' [Compras] Renderizando ComprasMain (Procurement)');
  return <ComprasMain />;
}