/**
 * Hook customizado para gestão de Comunicações Internas
 * Integração completa com backend e gerenciamento de estado
 */

import { useState, useCallback, useMemo } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Comunicacao, ComunicacaoFilters } from '../components/comunicacoes/types';

interface ComunicacoesStats {
  total: number;
  pendentes: number;
  despachadas: number;
  urgentes: number;
}

export interface UtilizadorDepartamento {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
}

interface UseComunicacoesReturn {
  // Estado
  comunicacoes: Comunicacao[];
  stats: ComunicacoesStats;
  loading: boolean;
  error: string | null;
  
  // Ações
  fetchComunicacoes: (filters?: ComunicacaoFilters) => Promise<void>;
  fetchComunicacaoById: (id: string) => Promise<Comunicacao | null>;
  createComunicacao: (data: Partial<Comunicacao>) => Promise<Comunicacao | null>;
  updateComunicacao: (id: string, data: Partial<Comunicacao>) => Promise<Comunicacao | null>;
  deleteComunicacao: (id: string) => Promise<boolean>;
  despacharComunicacao: (id: string, despacho: any) => Promise<boolean>;
  arquivarComunicacao: (id: string) => Promise<boolean>;
  compartilharComunicacao: (id: string, usuarioIds: string[], permissao?: 'leitura' | 'edicao') => Promise<boolean>;
  responderComunicacao: (id: string, textoResposta: string, anexos?: any[]) => Promise<boolean>;
  delegarComunicacao: (id: string, delegadoParaId: string, motivoDelegacao: string) => Promise<boolean>;
  fetchUtilizadoresDepartamento: () => Promise<UtilizadorDepartamento[]>;
}

export function useComunicacoes(): UseComunicacoesReturn {
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcular estatísticas das comunicações
   */
  const stats = useMemo<ComunicacoesStats>(() => {
    return {
      total: comunicacoes.length,
      pendentes: comunicacoes.filter(c => c.status === 'pendente' || c.status === 'em_analise').length,
      despachadas: comunicacoes.filter(c => c.status === 'despachado').length,
      urgentes: comunicacoes.filter(c => c.prioridade === 'urgente' && c.status !== 'arquivado').length,
    };
  }, [comunicacoes]);

  /**
   * Buscar todas as comunicações com filtros opcionais
   */
  const fetchComunicacoes = useCallback(async (filters?: ComunicacaoFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Construir query string com filtros. "all=true" pede o conjunto
      // completo ao backend (que agora pagina a 50/pagina por defeito) -
      // os separadores por estado neste ecrã filtram em memoria sobre TODAS
      // as comunicacoes, por isso precisam do conjunto inteiro, nao so da
      // 1ª pagina.
      const queryParams = new URLSearchParams();
      queryParams.append('all', 'true');
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.prioridade) queryParams.append('prioridade', filters.prioridade);
      if (filters?.departamento_origem) queryParams.append('departamento_origem', filters.departamento_origem);
      if (filters?.departamento_destino) queryParams.append('departamento_destino', filters.departamento_destino);
      if (filters?.data_inicio) queryParams.append('data_inicio', filters.data_inicio);
      if (filters?.data_fim) queryParams.append('data_fim', filters.data_fim);

      const query = queryParams.toString();
      const endpoint = `/comunicacoes${query ? `?${query}` : ''}`;

      const response = await apiClient.get<{ comunicacoes: Comunicacao[] }>(endpoint);
      setComunicacoes(response.comunicacoes || []);
    } catch (err: any) {
 console.error(' Erro ao buscar comunicações:', err);
      const errorMessage = err.message || 'Erro ao carregar comunicações';
      setError(errorMessage);
      toast.error('Erro ao carregar comunicações');
      // Definir array vazio em caso de erro
      setComunicacoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar comunicação por ID
   */
  const fetchComunicacaoById = useCallback(async (id: string): Promise<Comunicacao | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ comunicacao: Comunicacao }>(`/comunicacoes/${id}`);
      return response.comunicacao;
    } catch (err: any) {
 console.error('Erro ao buscar comunicação:', err);
      setError(err.message || 'Erro ao carregar comunicação');
      toast.error('Erro ao carregar comunicação');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Criar nova comunicação
   */
  const createComunicacao = useCallback(async (data: Partial<Comunicacao>): Promise<Comunicacao | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ comunicacao: Comunicacao }>('/comunicacoes', data);
      toast.success('Comunicação criada com sucesso!');
      
      // Atualizar lista local
      setComunicacoes(prev => [response.comunicacao, ...prev]);
      
      return response.comunicacao;
    } catch (err: any) {
 console.error('Erro ao criar comunicação:', err);
      setError(err.message || 'Erro ao criar comunicação');
      toast.error('Erro ao criar comunicação');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualizar comunicação
   */
  const updateComunicacao = useCallback(async (id: string, data: Partial<Comunicacao>): Promise<Comunicacao | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ comunicacao: Comunicacao }>(`/comunicacoes/${id}`, data);
      toast.success('Comunicação atualizada com sucesso!');
      
      // Atualizar lista local
      setComunicacoes(prev => 
        prev.map(com => com.id === id ? response.comunicacao : com)
      );
      
      return response.comunicacao;
    } catch (err: any) {
 console.error('Erro ao atualizar comunicação:', err);
      setError(err.message || 'Erro ao atualizar comunicação');
      toast.error('Erro ao atualizar comunicação');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deletar comunicação
   */
  const deleteComunicacao = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/comunicacoes/${id}`);
      toast.success('Comunicação excluída com sucesso!');
      
      // Remover da lista local
      setComunicacoes(prev => prev.filter(com => com.id !== id));
      
      return true;
    } catch (err: any) {
 console.error('Erro ao deletar comunicação:', err);
      setError(err.message || 'Erro ao deletar comunicação');
      toast.error('Erro ao deletar comunicação');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Despachar comunicação
   */
  const despacharComunicacao = useCallback(async (id: string, despacho: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Se despacho for um objeto com texto_despacho, extrair o valor
      const payload = typeof despacho === 'string' ? { texto_despacho: despacho } : despacho;
      
      const response = await apiClient.post<{ comunicacao: Comunicacao }>(`/comunicacoes/${id}/despacho`, payload);
      toast.success('Despacho adicionado com sucesso!');
      
      // Atualizar lista local
      setComunicacoes(prev => 
        prev.map(com => com.id === id ? response.comunicacao : com)
      );
      
      return true;
    } catch (err: any) {
 console.error('Erro ao despachar comunicação:', err);
      const message = err.message || 'Erro ao despachar comunicação';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Arquivar comunicação
   */
  const arquivarComunicacao = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ comunicacao: Comunicacao }>(`/comunicacoes/${id}/arquivar`);
      toast.success('Comunicação arquivada com sucesso!');
      
      // Atualizar lista local
      setComunicacoes(prev => 
        prev.map(com => com.id === id ? response.comunicacao : com)
      );
      
      return true;
    } catch (err: any) {
 console.error('Erro ao arquivar comunicação:', err);
      setError(err.message || 'Erro ao arquivar comunicação');
      toast.error('Erro ao arquivar comunicação');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Compartilhar comunicação
   */
  const compartilharComunicacao = useCallback(async (
    id: string, 
    usuarioIds: string[], 
    permissao?: 'leitura' | 'edicao'
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // A rota de compartilhamento espera destinatarios (emails)
      await apiClient.post(`/comunicacoes/${id}/compartilhar`, { 
        destinatarios: usuarioIds, // Estes devem ser emails, não IDs
        permissao: permissao || 'leitura'
      });
      toast.success('Comunicação compartilhada com sucesso!');
      return true;
    } catch (err: any) {
 console.error('Erro ao compartilhar comunicação:', err);
      setError(err.message || 'Erro ao compartilhar comunicação');
      toast.error('Erro ao compartilhar comunicação');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Responder comunicação
   */
  const responderComunicacao = useCallback(async (
    id: string, 
    textoResposta: string, 
    anexos?: any[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const payload: { texto_resposta: string, anexos?: any[] } = { texto_resposta: textoResposta };
      if (anexos) payload.anexos = anexos;
      
      const response = await apiClient.post<{ success: boolean, resposta: Comunicacao, comunicacao_original: Comunicacao }>(`/comunicacoes/${id}/responder`, payload);
      toast.success('Resposta enviada com sucesso!');
      
      // Atualizar lista local
      setComunicacoes(prev => 
        prev.map(com => com.id === id ? response.comunicacao_original : com)
      );
      
      return true;
    } catch (err: any) {
 console.error('Erro ao responder comunicação:', err);
      setError(err.message || 'Erro ao responder comunicação');
      toast.error('Erro ao responder comunicação');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delegar comunicação
   */
  const delegarComunicacao = useCallback(async (
    id: string, 
    delegadoParaId: string, 
    motivoDelegacao: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const payload = { delegado_para_id: delegadoParaId, motivo_delegacao: motivoDelegacao };
      
      const response = await apiClient.post<{ comunicacao: Comunicacao }>(`/comunicacoes/${id}/delegar`, payload);
      toast.success('Comunicação delegada com sucesso!');
      
      // Atualizar lista local
      setComunicacoes(prev => 
        prev.map(com => com.id === id ? response.comunicacao : com)
      );
      
      return true;
    } catch (err: any) {
 console.error('Erro ao delegar comunicação:', err);
      const message = err.message || 'Erro ao delegar comunicação';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar utilizadores do departamento
   */
  const fetchUtilizadoresDepartamento = useCallback(async (): Promise<UtilizadorDepartamento[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ utilizadores: UtilizadorDepartamento[] }>(`/comunicacoes/utilizadores/departamento`);
      return response.utilizadores || [];
    } catch (err: any) {
 console.error('Erro ao buscar utilizadores do departamento:', err);
      setError(err.message || 'Erro ao buscar utilizadores do departamento');
      toast.error('Erro ao buscar utilizadores do departamento');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    comunicacoes,
    stats,
    loading,
    error,
    fetchComunicacoes,
    fetchComunicacaoById,
    createComunicacao,
    updateComunicacao,
    deleteComunicacao,
    despacharComunicacao,
    arquivarComunicacao,
    compartilharComunicacao,
    responderComunicacao,
    delegarComunicacao,
    fetchUtilizadoresDepartamento,
  };
}