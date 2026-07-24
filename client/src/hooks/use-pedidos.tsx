/**
 * Hook para gestão de Pedido e Helpdesk
 * Sistema de Tickets de Suporte Técnico
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Ticket, TicketStats } from '../components/pedidos/types';

export function usePedidos() {
  const [pedidos, setPedidos] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ pedidos: Ticket[] }>('/pedidos');
      setPedidos(response.pedidos || []);
    } catch (err: any) {
      toast.error('Erro ao carregar tickets');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ stats: TicketStats }>('/pedidos/stats/geral');
      setStats(response.stats);
    } catch (err: any) {
 console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const createPedido = useCallback(async (data: Partial<Ticket>): Promise<Ticket | null> => {
    setLoading(true);
    try {
 console.log(' Criando ticket:', data);
      const response = await apiClient.post<{ pedido: Ticket }>('/pedidos', data);
 console.log(' Ticket criado:', response.pedido);
      toast.success('Ticket criado com sucesso! A equipe de TI foi notificada.');
      setPedidos(prev => [response.pedido, ...prev]);
      return response.pedido;
    } catch (err: any) {
 console.error(' Erro ao criar ticket:', err);
      toast.error(err.message || 'Erro ao criar ticket');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePedido = useCallback(async (id: string, data: Partial<Ticket>): Promise<Ticket | null> => {
    try {
      const response = await apiClient.put<{ pedido: Ticket }>(`/pedidos/${id}`, data);
      toast.success('Ticket atualizado com sucesso!');
      setPedidos(prev => prev.map(p => p.id === id ? response.pedido : p));
      return response.pedido;
    } catch (err: any) {
      toast.error('Erro ao atualizar ticket');
      return null;
    }
  }, []);

  // ABRIR TICKET (IT)
  const abrirTicket = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ pedido: Ticket }>(`/pedidos/${id}/abrir`, {});
      toast.success('Ticket aberto! Você pode começar a trabalhar nele.');
      setPedidos(prev => prev.map(p => p.id === id ? response.pedido : p));
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir ticket');
      return false;
    }
  }, []);

  // RESOLVER TICKET (IT)
  const resolverTicket = useCallback(async (id: string, solucao: string, anexos?: any[]): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ pedido: Ticket }>(`/pedidos/${id}/resolver`, { 
        solucao,
        anexos 
      });
      toast.success('Ticket marcado como resolvido! O solicitante será notificado.');
      setPedidos(prev => prev.map(p => p.id === id ? response.pedido : p));
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resolver ticket');
      return false;
    }
  }, []);

  // FECHAR TICKET (Solicitante)
  const fecharTicket = useCallback(async (id: string, comentario?: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ pedido: Ticket }>(`/pedidos/${id}/fechar`, { 
        comentario_fechamento: comentario 
      });
      toast.success('Ticket fechado com sucesso!');
      setPedidos(prev => prev.map(p => p.id === id ? response.pedido : p));
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fechar ticket');
      return false;
    }
  }, []);

  const deletePedido = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/pedidos/${id}`);
      toast.success('Ticket excluído com sucesso!');
      setPedidos(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      toast.error('Erro ao deletar ticket');
      return false;
    }
  }, []);

  return {
    pedidos,
    stats,
    loading,
    fetchPedidos,
    fetchStats,
    createPedido,
    updatePedido,
    abrirTicket,
    resolverTicket,
    fecharTicket,
    deletePedido,
  };
}
