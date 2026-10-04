/**
 * Hook para gestão de Procurement
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Requisicao, OrdemCompra, CompraStats } from '../components/compras/types';

export function useCompras() {
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [ordensCompra, setOrdensCompra] = useState<OrdemCompra[]>([]);
  const [stats, setStats] = useState<CompraStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ requisicoes: Requisicao[]; ordens_compra: OrdemCompra[] }>('/compras');
      setRequisicoes(response.requisicoes || []);
      setOrdensCompra(response.ordens_compra || []);
    } catch (err: any) {
      toast.error('Erro ao carregar compras');
 console.error('Erro ao carregar compras:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ stats: CompraStats }>('/compras/stats/geral');
      setStats(response.stats);
    } catch (err: any) {
 console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const createRequisicao = useCallback(async (data: Partial<Requisicao>): Promise<Requisicao | null> => {
    try {
      const response = await apiClient.post<{ requisicao: Requisicao }>('/compras/requisicao', data);
      toast.success('Requisição criada com sucesso!');
      setRequisicoes(prev => [response.requisicao, ...prev]);
      return response.requisicao;
    } catch (err: any) {
      toast.error('Erro ao criar requisição');
      return null;
    }
  }, []);

  const createOrdemCompra = useCallback(async (data: Partial<OrdemCompra>): Promise<OrdemCompra | null> => {
    try {
      const response = await apiClient.post<{ ordem_compra: OrdemCompra }>('/compras/ordem-compra', data);
      toast.success('Autorização de Despesas criada com sucesso!');
      setOrdensCompra(prev => [response.ordem_compra, ...prev]);
      return response.ordem_compra;
    } catch (err: any) {
      toast.error('Erro ao criar autorização de despesas');
      return null;
    }
  }, []);

  const aprovarRequisicao = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ requisicao: Requisicao }>(`/compras/requisicao/${id}/aprovar`, {});
      toast.success('Requisição aprovada!');
      setRequisicoes(prev => prev.map(r => r.id === id ? response.requisicao : r));
      return true;
    } catch (err: any) {
      toast.error('Erro ao aprovar requisição');
      return false;
    }
  }, []);

  const cancelarRequisicao = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ requisicao: Requisicao }>(`/compras/requisicao/${id}/cancelar`, {});
      toast.success('Requisição cancelada!');
      setRequisicoes(prev => prev.map(r => r.id === id ? response.requisicao : r));
      return true;
    } catch (err: any) {
      toast.error('Erro ao cancelar requisição');
      return false;
    }
  }, []);

  const updateStatusOrdem = useCallback(async (id: string, status: string): Promise<boolean> => {
    try {
      const response = await apiClient.put<{ ordem_compra: OrdemCompra }>(`/compras/ordem-compra/${id}/status`, { status });
      toast.success('Status atualizado!');
      setOrdensCompra(prev => prev.map(o => o.id === id ? response.ordem_compra : o));
      return true;
    } catch (err: any) {
      toast.error('Erro ao atualizar status');
      return false;
    }
  }, []);

  return {
    requisicoes,
    ordensCompra,
    stats,
    loading,
    fetchCompras,
    fetchStats,
    createRequisicao,
    createOrdemCompra,
    aprovarRequisicao,
    cancelarRequisicao,
    updateStatusOrdem,
  };
}