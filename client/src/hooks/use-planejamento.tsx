/**
 * Hook para Planeamento e Gestão (consolidado)
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';

export function usePlanejamento() {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [contasReceber, setContasReceber] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrcamentos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ orcamentos: any[] }>('/planejamento/orcamentos');
      setOrcamentos(response.orcamentos || []);
    } catch (err: any) {
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRelatorios = useCallback(async () => {
    try {
      const response = await apiClient.get<{ relatorios: any[] }>('/planejamento/relatorios');
      setRelatorios(response.relatorios || []);
    } catch (err: any) {
      toast.error('Erro ao carregar relatórios');
    }
  }, []);

  const fetchContasPagar = useCallback(async () => {
    try {
      const response = await apiClient.get<{ contas_pagar: any[] }>('/planejamento/contas-pagar');
      setContasPagar(response.contas_pagar || []);
    } catch (err: any) {
      toast.error('Erro ao carregar contas a pagar');
    }
  }, []);

  const fetchContasReceber = useCallback(async () => {
    try {
      const response = await apiClient.get<{ contas_receber: any[] }>('/planejamento/contas-receber');
      setContasReceber(response.contas_receber || []);
    } catch (err: any) {
      toast.error('Erro ao carregar contas a receber');
    }
  }, []);

  const fetchMetas = useCallback(async () => {
    try {
      const response = await apiClient.get<{ metas: any[] }>('/planejamento/metas');
      setMetas(response.metas || []);
    } catch (err: any) {
      toast.error('Erro ao carregar metas');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ stats: any }>('/planejamento/stats/geral');
      setStats(response.stats);
    } catch (err: any) {
 console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const createOrcamento = useCallback(async (data: any): Promise<any | null> => {
    try {
      const response = await apiClient.post<{ orcamento: any }>('/planejamento/orcamentos', data);
      toast.success('Orçamento criado com sucesso!');
      setOrcamentos(prev => [response.orcamento, ...prev]);
      return response.orcamento;
    } catch (err: any) {
      toast.error('Erro ao criar orçamento');
      return null;
    }
  }, []);

  const createRelatorio = useCallback(async (data: any): Promise<any | null> => {
    try {
      const response = await apiClient.post<{ relatorio: any }>('/planejamento/relatorios', data);
      toast.success('Relatório criado com sucesso!');
      setRelatorios(prev => [response.relatorio, ...prev]);
      return response.relatorio;
    } catch (err: any) {
      toast.error('Erro ao criar relatório');
      return null;
    }
  }, []);

  const createContaPagar = useCallback(async (data: any): Promise<any | null> => {
    try {
      const response = await apiClient.post<{ conta_pagar: any }>('/planejamento/contas-pagar', data);
      toast.success('Conta a pagar criada!');
      setContasPagar(prev => [response.conta_pagar, ...prev]);
      return response.conta_pagar;
    } catch (err: any) {
      toast.error('Erro ao criar conta a pagar');
      return null;
    }
  }, []);

  const createMeta = useCallback(async (data: any): Promise<any | null> => {
    try {
      const response = await apiClient.post<{ meta: any }>('/planejamento/metas', data);
      toast.success('Meta criada com sucesso!');
      setMetas(prev => [response.meta, ...prev]);
      return response.meta;
    } catch (err: any) {
      toast.error('Erro ao criar meta');
      return null;
    }
  }, []);

  const registrarProgressoMeta = useCallback(async (metaId: string, dados: any): Promise<any | null> => {
    try {
      const response = await apiClient.post<{ meta: any }>(`/planejamento/metas/${metaId}/progresso`, dados);
      toast.success('Progresso registrado!');
      // Atualizar a meta na lista
      setMetas(prev => prev.map(m => m.id === metaId ? response.meta : m));
      return response.meta;
    } catch (err: any) {
      toast.error('Erro ao registrar progresso');
      return null;
    }
  }, []);

  return {
    orcamentos,
    relatorios,
    contasPagar,
    contasReceber,
    metas,
    stats,
    loading,
    fetchOrcamentos,
    fetchRelatorios,
    fetchContasPagar,
    fetchContasReceber,
    fetchMetas,
    fetchStats,
    createOrcamento,
    createRelatorio,
    createContaPagar,
    createMeta,
    registrarProgressoMeta,
  };
}