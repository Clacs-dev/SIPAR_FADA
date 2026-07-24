/**
 * Router Inteligente de Procurement
 * Detecta se o usuário é fornecedor ou comprador e renderiza interface apropriada
 */

import { useEffect, useState } from "react";
import { ComprasMain } from "./compras-main";
import { FornecedorPortal } from "./fornecedor-portal";
import { Loader2 } from "lucide-react";

interface ProcurementRouterProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  userDepartment?: string;
}

export function ProcurementRouter({ 
  userId, 
  userEmail, 
  userName,
  userRole,
  userDepartment 
}: ProcurementRouterProps) {
  const [isFornecedor, setIsFornecedor] = useState(false);
  const [fornecedorData, setFornecedorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserType = () => {
 console.log(' [ProcurementRouter] Verificando tipo de usuário...');
      
      // OTIMIZAÇÃO: Verificar primeiro se há dados de fornecedor no localStorage
      // Isso evita fazer fetch desnecessário de todos os fornecedores
      const fornecedorAuth = localStorage.getItem('fornecedor_auth');
      
      if (fornecedorAuth) {
        try {
          const authData = JSON.parse(fornecedorAuth);
          if (authData.fornecedor) {
 console.log(' [ProcurementRouter] Fornecedor detectado no localStorage:', authData.fornecedor.nome);
            setIsFornecedor(true);
            setFornecedorData(authData.fornecedor);
            setLoading(false);
            return;
          }
        } catch (e) {
 console.error(' [ProcurementRouter] Erro ao parsear fornecedor_auth:', e);
        }
      }

      // Se não é fornecedor, é um usuário normal (comprador/admin)
 console.log(' [ProcurementRouter] Usuário normal detectado');
      setIsFornecedor(false);
      setFornecedorData(null);
      setLoading(false);
    };

    checkUserType();
  }, [userId, userEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Se é fornecedor, mostrar portal do fornecedor
  if (isFornecedor && fornecedorData) {
    return (
      <FornecedorPortal 
        fornecedorId={fornecedorData.id}
        fornecedorNome={fornecedorData.nome}
      />
    );
  }

  // Caso contrário, mostrar interface de comprador (admin/gestor)
  return <ComprasMain />;
}