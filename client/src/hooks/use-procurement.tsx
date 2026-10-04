/**
 * Hook customizado para gestão de Procurement
 * Sistema de pedidos de compra com cotações de fornecedores
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { 
  PedidoCompra, 
  CotacaoFornecedor, 
  OrdemCompra,
  ProcurementStats,
  PedidoCompraFilters 
} from '../components/compras/types';

interface UseProcurementReturn {
  pedidos: PedidoCompra[];
  ordensCompra: OrdemCompra[];
  stats: ProcurementStats | null;
  loading: boolean;
  error: string | null;
  
  // Pedidos de Compra
  fetchPedidos: (filters?: PedidoCompraFilters) => Promise<void>;
  fetchPedidoById: (id: string) => Promise<PedidoCompra | null>;
  createPedido: (data: Partial<PedidoCompra>) => Promise<PedidoCompra | null>;
  updatePedido: (id: string, data: Partial<PedidoCompra>) => Promise<PedidoCompra | null>;
  deletePedido: (id: string) => Promise<boolean>;
  
  // Workflow do Pedido
  publicarPedido: (id: string) => Promise<boolean>; // criado → aguardando_cotacoes
  cancelarPedido: (id: string, motivo: string) => Promise<boolean>;
  
  // Cotações de Fornecedores
  submitCotacao: (pedidoId: string, cotacao: Partial<CotacaoFornecedor>) => Promise<boolean>;
  editarCotacao: (pedidoId: string, cotacaoId: string, dados: Partial<CotacaoFornecedor>) => Promise<boolean>;
  anularCotacao: (pedidoId: string, cotacaoId: string, motivo?: string) => Promise<boolean>;
  eliminarCotacao: (pedidoId: string, cotacaoId: string) => Promise<boolean>;
  fetchCotacoes: (pedidoId: string) => Promise<CotacaoFornecedor[]>;
  
  // Análise e Aprovação
  analisarCotacoes: (pedidoId: string) => Promise<boolean>; // Muda para em_analise
  aprovarCotacao: (pedidoId: string, cotacaoId: string, justificativa: string) => Promise<boolean>;
  
  // Autorização de Despesas
  fetchOrdens: () => Promise<void>;
  emitirOrdemCompra: (pedidoId: string) => Promise<OrdemCompra | null>;
  updateStatusOrdem: (ordemId: string, status: string) => Promise<boolean>;
  confirmarRecebimento: (pedidoId: string, observacoes?: string) => Promise<boolean>;
  
  // Estatísticas
  fetchStats: () => Promise<void>;
}

export function useProcurement(): UseProcurementReturn {
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [ordensCompra, setOrdensCompra] = useState<OrdemCompra[]>([]);
  const [stats, setStats] = useState<ProcurementStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== PEDIDOS DE COMPRA ====================

  const fetchPedidos = useCallback(async (filters?: PedidoCompraFilters) => {
    setLoading(true);
    setError(null);
 console.log(' [useProcurement] Iniciando fetchPedidos...');
    try {
 console.log(' [useProcurement] Chamando GET /procurement/pedidos');
      const response = await apiClient.get<{ pedidos: PedidoCompra[] }>('/procurement/pedidos', filters);
 console.log(' [useProcurement] Resposta recebida:', response);
 console.log(' [useProcurement] Total de pedidos:', response.pedidos?.length || 0);
      
      if (response.pedidos && response.pedidos.length > 0) {
 console.log(' [useProcurement] Pedidos:', response.pedidos.map(p => ({
          id: p.id,
          numero: p.numero,
          titulo: p.titulo,
          status: p.status
        })));
      } else {
 console.warn(' [useProcurement] Nenhum pedido retornado');
      }
      
      setPedidos(response.pedidos || []);
    } catch (err: any) {
 console.error(' [useProcurement] Erro ao carregar pedidos:', err);
 console.error(' Mensagem:', err.message);
 console.error(' Stack:', err.stack);
      setError(err.message || 'Erro ao carregar pedidos');
      toast.error('Erro ao carregar pedidos: ' + err.message);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPedidoById = useCallback(async (id: string): Promise<PedidoCompra | null> => {
    try {
      const response = await apiClient.get<{ pedido: PedidoCompra }>(`/procurement/pedidos/${id}`);
      return response.pedido;
    } catch (err: any) {
      toast.error('Erro ao carregar pedido');
      return null;
    }
  }, []);

  const createPedido = useCallback(async (data: Partial<PedidoCompra>): Promise<PedidoCompra | null> => {
    setLoading(true);
    try {
 console.log(' Criando pedido de compra:', data);
      const response = await apiClient.post<{ pedido: PedidoCompra }>('/procurement/pedidos', data);
 console.log(' Pedido criado:', response);
      toast.success('Pedido de compra criado com sucesso!');
      setPedidos(prev => [response.pedido, ...prev]);
      return response.pedido;
    } catch (err: any) {
 console.error(' Erro ao criar pedido:', err);
      toast.error(err.message || 'Erro ao criar pedido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePedido = useCallback(async (id: string, data: Partial<PedidoCompra>): Promise<PedidoCompra | null> => {
    try {
      const response = await apiClient.put<{ pedido: PedidoCompra }>(`/procurement/pedidos/${id}`, data);
      toast.success('Pedido atualizado com sucesso!');
      setPedidos(prev => prev.map(p => p.id === id ? response.pedido : p));
      return response.pedido;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar pedido');
      return null;
    }
  }, []);

  const deletePedido = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/procurement/pedidos/${id}`);
      toast.success('Pedido excluído com sucesso!');
      setPedidos(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir pedido');
      return false;
    }
  }, []);

  // ==================== WORKFLOW ====================

  const publicarPedido = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ pedido: PedidoCompra }>(`/procurement/pedidos/${id}/publicar`);
      toast.success('Pedido publicado! Fornecedores foram notificados.');
      setPedidos(prev => prev.map(p => p.id === id ? response.pedido : p));
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao publicar pedido');
      return false;
    }
  }, []);

  const cancelarPedido = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ pedido: PedidoCompra }>(`/procurement/pedidos/${id}/cancelar`, { motivo });
      toast.success('Pedido cancelado');
      setPedidos(prev => prev.map(p => p.id === id ? response.pedido : p));
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao cancelar pedido');
      return false;
    }
  }, []);

  // ==================== COTAÇÕES ====================

  const submitCotacao = useCallback(async (pedidoId: string, cotacao: Partial<CotacaoFornecedor>): Promise<boolean> => {
    try {
 console.log(' [submitCotacao] Submetendo cotação:', { pedidoId, cotacao });
      await apiClient.post(`/procurement/pedidos/${pedidoId}/cotacoes`, cotacao);
      toast.success('Cotação submetida com sucesso!');
      await fetchPedidos(); // Recarregar lista
      return true;
    } catch (err: any) {
 console.error(' [submitCotacao] Erro ao submeter cotação:', err);
      const errorMessage = err?.message || 'Erro ao submeter cotação';
      toast.error(errorMessage);
      return false;
    }
  }, [fetchPedidos]);

  // Editar / anular / eliminar uma cotacao (o servidor so aceita enquanto
  // ninguem actuou sobre ela - e, para update_own/delete_own, so as proprias).
  const editarCotacao = useCallback(async (pedidoId: string, cotacaoId: string, dados: Partial<CotacaoFornecedor>): Promise<boolean> => {
    try {
      await apiClient.put(`/procurement/pedidos/${pedidoId}/cotacoes/${cotacaoId}`, dados);
      toast.success('Cotação actualizada');
      await fetchPedidos();
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao actualizar cotação');
      return false;
    }
  }, [fetchPedidos]);

  const anularCotacao = useCallback(async (pedidoId: string, cotacaoId: string, motivo?: string): Promise<boolean> => {
    try {
      await apiClient.post(`/procurement/pedidos/${pedidoId}/cotacoes/${cotacaoId}/anular`, { motivo });
      toast.success('Cotação anulada');
      await fetchPedidos();
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao anular cotação');
      return false;
    }
  }, [fetchPedidos]);

  const eliminarCotacao = useCallback(async (pedidoId: string, cotacaoId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/procurement/pedidos/${pedidoId}/cotacoes/${cotacaoId}`);
      toast.success('Cotação eliminada');
      await fetchPedidos();
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao eliminar cotação');
      return false;
    }
  }, [fetchPedidos]);

  const fetchCotacoes = useCallback(async (pedidoId: string): Promise<CotacaoFornecedor[]> => {
    try {
      const response = await apiClient.get<{ cotacoes: CotacaoFornecedor[] }>(
        `/procurement/pedidos/${pedidoId}/cotacoes`
      );
      return response.cotacoes || [];
    } catch (err: any) {
      toast.error('Erro ao carregar cotações');
      return [];
    }
  }, []);

  // ==================== ANÁLISE E APROVAÇÃO ====================

  const analisarCotacoes = useCallback(async (pedidoId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ pedido: PedidoCompra }>(
        `/procurement/pedidos/${pedidoId}/analisar`
      );
      toast.success('Análise de cotações iniciada');
      setPedidos(prev => prev.map(p => p.id === pedidoId ? response.pedido : p));
      return true;
    } catch (err: any) {
      toast.error('Erro ao analisar cotações');
      return false;
    }
  }, []);

  const aprovarCotacao = useCallback(async (
    pedidoId: string,
    cotacaoId: string,
    justificativa: string
  ): Promise<boolean> => {
    try {
      // O backend so aceita esta chamada quando o pedido esta em "em_analise"
      // (depois de "Analisar as Cotações"). Ao aprovar, o pedido passa a
      // "concluido" e a ordem de compra correspondente e emitida automaticamente.
      const response = await apiClient.post<{ pedido: PedidoCompra; ordem?: OrdemCompra }>(
        `/procurement/pedidos/${pedidoId}/aprovar`,
        { cotacao_id: cotacaoId, justificativa }
      );
      toast.success('Cotação aprovada! Autorização de Despesas gerada.');
      setPedidos(prev => prev.map(p => p.id === pedidoId ? response.pedido : p));
      if (response.ordem) {
        setOrdensCompra(prev => [response.ordem as OrdemCompra, ...prev]);
      }
      return true;
    } catch (err: any) {
      toast.error('Erro ao aprovar cotação');
      return false;
    }
  }, []);

  // ==================== AUTORIZAÇÃO DE DESPESAS ====================

  const emitirOrdemCompra = useCallback(async (pedidoId: string): Promise<OrdemCompra | null> => {
    try {
      const response = await apiClient.post<{ ordem: OrdemCompra; pedido: PedidoCompra }>(
        `/procurement/pedidos/${pedidoId}/emitir-ordem`
      );
      toast.success('Autorização de Despesas emitida!');
      setPedidos(prev => prev.map(p => p.id === pedidoId ? response.pedido : p));
      setOrdensCompra(prev => [response.ordem, ...prev]);
      return response.ordem;
    } catch (err: any) {
      toast.error('Erro ao emitir autorização de despesas');
      return null;
    }
  }, []);

  const fetchOrdens = useCallback(async () => {
    try {
      const response = await apiClient.get<{ ordens: OrdemCompra[] }>('/procurement/ordens');
      setOrdensCompra(response.ordens || []);
    } catch (err: any) {
 console.error('Erro ao carregar ordens de compra:', err);
    }
  }, []);

  const updateStatusOrdem = useCallback(async (ordemId: string, status: string): Promise<boolean> => {
    try {
      const response = await apiClient.put<{ ordem: OrdemCompra }>(
        `/procurement/ordens/${ordemId}/status`,
        { status }
      );
      toast.success('Status da ordem atualizado');
      setOrdensCompra(prev => prev.map(o => o.id === ordemId ? response.ordem : o));
      return true;
    } catch (err: any) {
      toast.error('Erro ao atualizar status');
      return false;
    }
  }, []);

  const confirmarRecebimento = useCallback(async (
    pedidoId: string, 
    observacoes?: string
  ): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ pedido: PedidoCompra }>(
        `/procurement/pedidos/${pedidoId}/confirmar-recebimento`,
        { observacoes }
      );
      toast.success('Recebimento confirmado! Pedido concluído.');
      setPedidos(prev => prev.map(p => p.id === pedidoId ? response.pedido : p));
      return true;
    } catch (err: any) {
      toast.error('Erro ao confirmar recebimento');
      return false;
    }
  }, []);

  // ==================== ESTATÍSTICAS ====================

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ stats: ProcurementStats }>('/procurement/stats');
      setStats(response.stats);
    } catch (err: any) {
 console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  return {
    pedidos,
    ordensCompra,
    stats,
    loading,
    error,
    fetchPedidos,
    fetchPedidoById,
    createPedido,
    updatePedido,
    deletePedido,
    publicarPedido,
    cancelarPedido,
    submitCotacao,
    editarCotacao,
    anularCotacao,
    eliminarCotacao,
    fetchCotacoes,
    analisarCotacoes,
    aprovarCotacao,
    fetchOrdens,
    emitirOrdemCompra,
    updateStatusOrdem,
    confirmarRecebimento,
    fetchStats,
  };
}