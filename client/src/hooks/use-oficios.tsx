/**
 * Hook customizado para gestão de Ofícios
 * Integração completa com backend e gerenciamento de estado
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Oficio, OficioFilters, OficioStats } from '../components/oficios/types';

interface UseOficiosReturn {
  // Estado
  oficios: Oficio[];
  stats: OficioStats | null;
  loading: boolean;
  error: string | null;
  
  // Ações
  fetchOficios: (filters?: OficioFilters) => Promise<void>;
  fetchOficioById: (id: string) => Promise<Oficio | null>;
  createOficio: (data: Partial<Oficio>) => Promise<Oficio | null>;
  updateOficio: (id: string, data: Partial<Oficio>) => Promise<Oficio | null>;
  deleteOficio: (id: string) => Promise<boolean>;
  despacharOficio: (id: string, despacho: string) => Promise<boolean>;
  arquivarOficio: (id: string) => Promise<boolean>;
  compartilharOficio: (id: string, usuarioIds: string[], permissao: 'leitura' | 'edicao') => Promise<boolean>;
}

export function useOficios(): UseOficiosReturn {
  const [oficios, setOficios] = useState<Oficio[]>([]);
  const [stats, setStats] = useState<OficioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar todos os ofícios com filtros opcionais
   */
  const fetchOficios = useCallback(async (filters?: OficioFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Construir query string com filtros
      const queryParams = new URLSearchParams();
      if (filters?.tipo) queryParams.append('tipo', filters.tipo);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.prioridade) queryParams.append('prioridade', filters.prioridade);
      if (filters?.departamento) queryParams.append('departamento', filters.departamento);
      if (filters?.data_inicio) queryParams.append('data_inicio', filters.data_inicio);
      if (filters?.data_fim) queryParams.append('data_fim', filters.data_fim);

      const query = queryParams.toString();
      const endpoint = `/oficios${query ? `?${query}` : ''}`;

 console.log(' Buscando ofícios...', endpoint);
      const response = await apiClient.get<{ oficios: Oficio[] }>(endpoint);
 console.log(' Ofícios recebidos:', response.oficios?.length || 0);
 console.log(' Dados dos ofícios:', response.oficios);
      setOficios(response.oficios || []);
    } catch (err: any) {
 console.error(' Erro ao buscar ofícios:', err);
      setError(err.message || 'Erro ao carregar ofícios');
      toast.error('Erro ao carregar ofícios');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar ofício por ID
   */
  const fetchOficioById = useCallback(async (id: string): Promise<Oficio | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ oficio: Oficio }>(`/oficios/${id}`);
      return response.oficio;
    } catch (err: any) {
 console.error('Erro ao buscar ofício:', err);
      setError(err.message || 'Erro ao carregar ofício');
      toast.error('Erro ao carregar ofício');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Criar novo ofício
   */
  const createOficio = useCallback(async (data: Partial<Oficio>): Promise<Oficio | null> => {
    setLoading(true);
    setError(null);

    try {
 console.log(' Criando ofício com dados:', data);
      const response = await apiClient.post<{ oficio: Oficio }>('/oficios', data);
 console.log(' Ofício criado com sucesso:', response.oficio);
      toast.success('Ofício criado com sucesso!');
      
      // Atualizar lista local
      setOficios(prev => [response.oficio, ...prev]);
      
      return response.oficio;
    } catch (err: any) {
 console.error(' Erro ao criar ofício:', err);
      setError(err.message || 'Erro ao criar ofício');
      toast.error(err.message || 'Erro ao criar ofício');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualizar ofício existente
   */
  const updateOficio = useCallback(async (id: string, data: Partial<Oficio>): Promise<Oficio | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ oficio: Oficio }>(`/oficios/${id}`, data);
      toast.success('Ofício atualizado com sucesso!');
      
      // Atualizar lista local
      setOficios(prev => prev.map(o => o.id === id ? response.oficio : o));
      
      return response.oficio;
    } catch (err: any) {
 console.error('Erro ao atualizar ofício:', err);
      setError(err.message || 'Erro ao atualizar ofício');
      toast.error(err.message || 'Erro ao atualizar ofício');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deletar ofício (apenas rascunhos)
   */
  const deleteOficio = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/oficios/${id}`);
      toast.success('Ofício excluído com sucesso!');
      
      // Remover da lista local
      setOficios(prev => prev.filter(o => o.id !== id));
      
      return true;
    } catch (err: any) {
 console.error('Erro ao deletar ofício:', err);
      setError(err.message || 'Erro ao deletar ofício');
      toast.error(err.message || 'Erro ao deletar ofício');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adicionar despacho a um ofício
   */
  const despacharOficio = useCallback(async (id: string, despacho: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
 console.log(' [DESPACHO] Iniciando...', { id, despacho });

    try {
 console.log(' [DESPACHO] Enviando POST para /oficios/${id}/despachos');
      const response = await apiClient.post<{ oficio: Oficio }>(`/oficios/${id}/despachos`, {
        descricao: despacho,
      });
 console.log(' [DESPACHO] Resposta recebida:', response);
      
      toast.success('Despacho adicionado com sucesso!');
      
      // Atualizar lista local
      setOficios(prev => prev.map(o => o.id === id ? response.oficio : o));
 console.log(' [DESPACHO] Lista de ofícios atualizada');
      
      return true;
    } catch (err: any) {
 console.error(' [DESPACHO] Erro:', err);
 console.error(' [DESPACHO] Erro detalhado:', err.message);
      setError(err.message || 'Erro ao adicionar despacho');
      toast.error(err.message || 'Erro ao adicionar despacho');
      return false;
    } finally {
      setLoading(false);
 console.log(' [DESPACHO] Finalizado');
    }
  }, []);

  /**
   * Arquivar ofício
   */
  const arquivarOficio = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ oficio: Oficio }>(`/oficios/${id}/arquivar`, {});
      toast.success('Ofício arquivado com sucesso!');
      
      // Atualizar lista local
      setOficios(prev => prev.map(o => o.id === id ? response.oficio : o));
      
      return true;
    } catch (err: any) {
 console.error('Erro ao arquivar ofício:', err);
      setError(err.message || 'Erro ao arquivar ofício');
      toast.error(err.message || 'Erro ao arquivar ofício');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Compartilhar ofício com outros usuários
   */
  const compartilharOficio = useCallback(async (
    id: string,
    usuarioIds: string[],
    permissao: 'leitura' | 'edicao'
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/oficios/${id}/compartilhar`, {
        usuario_ids: usuarioIds,
        permissao,
      });
      toast.success('Ofício compartilhado com sucesso!');
      return true;
    } catch (err: any) {
 console.error('Erro ao compartilhar ofício:', err);
      setError(err.message || 'Erro ao compartilhar ofício');
      toast.error(err.message || 'Erro ao compartilhar ofício');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calcular estatísticas dos ofícios
   */
  useEffect(() => {
    if (oficios.length === 0) {
      setStats(null);
      return;
    }

    // Filtrar valores inválidos (undefined, null)
    const validOficios = oficios.filter(o => o && typeof o === 'object');

    const newStats: OficioStats = {
      total: validOficios.length,
      pendentes: validOficios.filter(o => o.status === 'pendente').length,
      em_analise: validOficios.filter(o => o.status === 'em_analise').length,
      despachados: validOficios.filter(o => o.status === 'despachado').length,
      arquivados: validOficios.filter(o => o.status === 'arquivado').length,
      atrasados: validOficios.filter(o => {
        if (!o.prazo_resposta) return false;
        return new Date(o.prazo_resposta) < new Date() && o.status !== 'despachado' && o.status !== 'arquivado';
      }).length,
      entrada: validOficios.filter(o => o.tipo === 'entrada').length,
      saida: validOficios.filter(o => o.tipo === 'saida').length,
    };

    setStats(newStats);
  }, [oficios]);

  return {
    oficios,
    stats,
    loading,
    error,
    fetchOficios,
    fetchOficioById,
    createOficio,
    updateOficio,
    deleteOficio,
    despacharOficio,
    arquivarOficio,
    compartilharOficio,
  };
}