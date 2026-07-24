import { useState } from "react";
import { PedidosViaturaList } from "./pedidos-viatura-list";
import { PedidoViaturaForm, PedidoViaturaFormData } from "./pedido-viatura-form";
import { PedidoViaturaDetails } from "./pedido-viatura-details";
import { ApproveDialog, RejectDialog, AssignDialog } from "./pedido-viatura-actions";
import { PedidoViatura } from "./pedidos-viatura-types";
import { Viatura, Motorista } from "./types";
import { usePedidosViatura } from "../../hooks/use-pedidos-viatura";
import { useAuth } from "../auth/auth-context";
import { toast } from "sonner@2.0.3";

interface PedidosViaturaWrapperProps {
  viaturas: Viatura[];
  motoristas: Motorista[];
}

export function PedidosViaturaWrapper({ viaturas, motoristas }: PedidosViaturaWrapperProps) {
  const { user, accessToken } = useAuth();
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedPedido, setSelectedPedido] = useState<PedidoViatura | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // DEBUG: Verificar viaturas recebidas
 console.log('[PEDIDOS WRAPPER] Viaturas recebidas:', {
    total: viaturas.length,
    disponiveis: viaturas.filter(v => v.status === 'disponivel').length,
    viaturas: viaturas
  });

  const {
    pedidos,
    isLoading,
    error,
    createPedido,
    submitPedido,
    approvePedido,
    rejectPedido,
    assignPedido,
    cancelPedido,
    refetch
  } = usePedidosViatura(undefined, accessToken);
  
  // Mostrar mensagem de erro se houver
  if (error) {
 console.error('Erro nos pedidos de viatura:', error);
  }

  // Helper para verificar se usuário é admin (Gabinetes Executivos)
  const isAdminUser = (role: string) => {
    return [
      'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director',
      'gestao'
    ].includes(role);
  };

  // Permissões
  const canCreate = user?.role !== 'citizen'; // Todos exceto utente
  const canApprove = user?.role ? isAdminUser(user.role) : false;
  const canAssign = user?.role ? (isAdminUser(user.role) || (user as any)?.department === 'Operações') : false;
  const canEdit = (pedido: PedidoViatura) => 
    pedido.status === 'rascunho' && pedido.solicitante_id === user?.id;
  const canSubmit = (pedido: PedidoViatura) =>
    pedido.status === 'rascunho' && pedido.solicitante_id === user?.id;

  // Handlers
  const handleCreatePedido = async (data: PedidoViaturaFormData) => {
    if (!accessToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      await createPedido(data, accessToken);
      toast.success("Pedido criado como rascunho");
      setView('list');
      // Removido refetch() - o estado local já foi atualizado pelo hook
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar pedido");
    }
  };

  const handleSubmit = async () => {
    if (!selectedPedido || !accessToken) return;

    try {
 console.log('[WRAPPER] Submetendo pedido:', selectedPedido.id);
      const pedidoAtualizado = await submitPedido(selectedPedido.id, accessToken);
 console.log('[WRAPPER] Pedido submetido com sucesso:', pedidoAtualizado.id, 'Status:', pedidoAtualizado.status);
      toast.success("Pedido submetido para análise");
      setView('list');
      // Estado já atualizado pelo hook submitPedido
    } catch (error: any) {
 console.error('[WRAPPER] Erro ao submeter:', error);
      toast.error(error.message || "Erro ao submeter pedido");
    }
  };

  const handleApprove = async (notas?: string) => {
    if (!selectedPedido || !accessToken) return;

    try {
      await approvePedido(selectedPedido.id, notas, accessToken);
      toast.success("Pedido aprovado");
      setShowApproveDialog(false);
      // Estado já atualizado pelo hook approvePedido
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar pedido");
    }
  };

  const handleReject = async (motivo: string) => {
    if (!selectedPedido || !accessToken) return;

    try {
      await rejectPedido(selectedPedido.id, motivo, accessToken);
      toast.success("Pedido rejeitado");
      setShowRejectDialog(false);
      setView('list');
      // Estado já atualizado pelo hook rejectPedido
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar pedido");
    }
  };

  const handleAssign = async (viaturaId: string, motoristaId?: string) => {
    if (!selectedPedido || !accessToken) return;

    try {
      await assignPedido(selectedPedido.id, viaturaId, motoristaId, accessToken);
      toast.success("Viatura atribuída com sucesso");
      setShowAssignDialog(false);
      // Estado já atualizado pelo hook assignPedido
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir viatura");
    }
  };

  const handleCancel = async () => {
    if (!selectedPedido || !accessToken) return;

    try {
      await cancelPedido(selectedPedido.id, accessToken);
      toast.success("Pedido cancelado");
      setView('list');
      // Estado já atualizado pelo hook cancelPedido
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar pedido");
    }
  };

  // Views
  if (view === 'form') {
    return (
      <PedidoViaturaForm
        open={true}
        onOpenChange={(open) => !open && setView('list')}
        onSubmit={handleCreatePedido}
        userDepartment={(user as any)?.department || 'N/A'}
      />
    );
  }

  if (view === 'details' && selectedPedido) {
    const pedidoAtualizado = pedidos.find(p => p.id === selectedPedido.id) || selectedPedido;
    
    return (
      <>
        <PedidoViaturaDetails
          pedido={pedidoAtualizado}
          canEdit={canEdit(pedidoAtualizado)}
          canSubmit={canSubmit(pedidoAtualizado)}
          canApprove={canApprove}
          canAssign={canAssign}
          onBack={() => {
            setView('list');
            setSelectedPedido(null);
          }}
          onEdit={() => setView('form')}
          onSubmit={handleSubmit}
          onApprove={() => setShowApproveDialog(true)}
          onReject={() => setShowRejectDialog(true)}
          onAssign={() => setShowAssignDialog(true)}
          onCancel={handleCancel}
        />

        <ApproveDialog
          open={showApproveDialog}
          onOpenChange={setShowApproveDialog}
          onConfirm={handleApprove}
        />

        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          onConfirm={handleReject}
        />

        <AssignDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          viaturas={viaturas}
          motoristas={motoristas}
          pedidoNecessitaMotorista={!pedidoAtualizado.motorista_pretendido_id}
          onConfirm={handleAssign}
        />
      </>
    );
  }

  return (
    <PedidosViaturaList
      pedidos={pedidos}
      onNovoPedido={() => setView('form')}
      onViewDetails={(pedido) => {
        setSelectedPedido(pedido);
        setView('details');
      }}
      canCreate={canCreate}
    />
  );
}