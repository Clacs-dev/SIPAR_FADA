/**
 * Hook customizado para gestão de Reclamações
 */

import { useState, useCallback, useMemo } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Reclamacao, ReclamacaoFilters, ReclamacaoStats } from '../components/reclamacoes/types';

interface UseReclamacoesReturn {
  reclamacoes: Reclamacao[];
  stats: ReclamacaoStats | null;
  loading: boolean;
  error: string | null;
  fetchReclamacoes: (filters?: ReclamacaoFilters) => Promise<void>;
  fetchReclamacaoById: (id: string) => Promise<Reclamacao | null>;
  createReclamacao: (data: Partial<Reclamacao>) => Promise<Reclamacao | null>;
  updateReclamacao: (id: string, data: Partial<Reclamacao>) => Promise<Reclamacao | null>;
  deleteReclamacao: (id: string) => Promise<boolean>;
  atribuirReclamacao: (id: string, responsavelId: string, responsavelNome: string) => Promise<boolean>;
  adicionarAcao: (id: string, descricao: string, tipoAcao?: string) => Promise<boolean>;
  resolverReclamacao: (id: string, solucao: string, acoesTomadas?: string[]) => Promise<boolean>;
  fecharReclamacao: (id: string, satisfacao?: number, comentario?: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
}

export function useReclamacoes(): UseReclamacoesReturn {
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [stats, setStats] = useState<ReclamacaoStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReclamacoes = useCallback(async (filters?: ReclamacaoFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ reclamacoes: Reclamacao[] }>('/reclamacoes');
      setReclamacoes(response.reclamacoes || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar reclamações');
      toast.error('Erro ao carregar reclamações');
      setReclamacoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReclamacaoById = useCallback(async (id: string): Promise<Reclamacao | null> => {
    try {
      const response = await apiClient.get<{ reclamacao: Reclamacao }>(`/reclamacoes/${id}`);
      return response.reclamacao;
    } catch (err: any) {
      toast.error('Erro ao carregar reclamação');
      return null;
    }
  }, []);

  const createReclamacao = useCallback(async (data: Partial<Reclamacao>): Promise<Reclamacao | null> => {
    setLoading(true);
    try {
 console.log(' Enviando dados da reclamação:', data);
      const response = await apiClient.post<{ reclamacao: Reclamacao }>('/reclamacoes', data);
 console.log(' Resposta recebida:', response);
      toast.success('Reclamação criada com sucesso!');
      setReclamacoes(prev => [response.reclamacao, ...prev]);
      return response.reclamacao;
    } catch (err: any) {
 console.error(' Erro ao criar reclamação:', err);
      toast.error(err.message || 'Erro ao criar reclamação');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReclamacao = useCallback(async (id: string, data: Partial<Reclamacao>): Promise<Reclamacao | null> => {
    try {
      const response = await apiClient.put<{ reclamacao: Reclamacao }>(`/reclamacoes/${id}`, data);
      toast.success('Reclamação atualizada com sucesso!');
      setReclamacoes(prev => prev.map(r => r.id === id ? response.reclamacao : r));
      return response.reclamacao;
    } catch (err: any) {
      toast.error('Erro ao atualizar reclamação');
      return null;
    }
  }, []);

  const deleteReclamacao = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/reclamacoes/${id}`);
      toast.success('Reclamação excluída com sucesso!');
      setReclamacoes(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err: any) {
      toast.error('Erro ao deletar reclamação');
      return false;
    }
  }, []);

  const atribuirReclamacao = useCallback(async (id: string, responsavelId: string, responsavelNome: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ reclamacao: Reclamacao }>(`/reclamacoes/${id}/atribuir`, {
        responsavel_id: responsavelId,
        responsavel_nome: responsavelNome
      });
      toast.success('Reclamação atribuída com sucesso!');
      setReclamacoes(prev => prev.map(r => r.id === id ? response.reclamacao : r));
      return true;
    } catch (err: any) {
      toast.error('Erro ao atribuir reclamação');
      return false;
    }
  }, []);

  const adicionarAcao = useCallback(async (id: string, descricao: string, tipoAcao = 'comentario'): Promise<boolean> => {
    try {
      await apiClient.post(`/reclamacoes/${id}/acao`, {
        descricao,
        tipo_acao: tipoAcao
      });
      toast.success('Ação adicionada com sucesso!');
      await fetchReclamacoes();
      return true;
    } catch (err: any) {
      toast.error('Erro ao adicionar ação');
      return false;
    }
  }, [fetchReclamacoes]);

  const resolverReclamacao = useCallback(async (id: string, solucao: string, acoesTomadas?: string[]): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ reclamacao: Reclamacao }>(`/reclamacoes/${id}/resolver`, {
        solucao,
        acoes_tomadas: acoesTomadas
      });
      toast.success('Reclamação resolvida com sucesso!');
      setReclamacoes(prev => prev.map(r => r.id === id ? response.reclamacao : r));
      return true;
    } catch (err: any) {
      toast.error('Erro ao resolver reclamação');
      return false;
    }
  }, []);

  const fecharReclamacao = useCallback(async (id: string, satisfacao?: number, comentario?: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ reclamacao: Reclamacao }>(`/reclamacoes/${id}/fechar`, {
        satisfacao_cliente: satisfacao,
        comentario_cliente: comentario
      });
      toast.success('Reclamação fechada com sucesso!');
      setReclamacoes(prev => prev.map(r => r.id === id ? response.reclamacao : r));
      return true;
    } catch (err: any) {
      toast.error('Erro ao fechar reclamação');
      return false;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ stats: ReclamacaoStats }>('/reclamacoes/stats/geral');
      setStats(response.stats);
    } catch (err: any) {
 console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  return {
    reclamacoes,
    stats,
    loading,
    error,
    fetchReclamacoes,
    fetchReclamacaoById,
    createReclamacao,
    updateReclamacao,
    deleteReclamacao,
    atribuirReclamacao,
    adicionarAcao,
    resolverReclamacao,
    fecharReclamacao,
    fetchStats,
  };
}