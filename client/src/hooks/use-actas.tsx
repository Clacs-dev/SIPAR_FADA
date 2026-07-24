/**
 * Hook customizado para gestão de Actas
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Acta, ActaFilters, ActaStats } from '../components/actas/types';

interface UseActasReturn {
  actas: Acta[];
  stats: ActaStats | null;
  loading: boolean;
  error: string | null;
  fetchActas: (filters?: ActaFilters) => Promise<void>;
  fetchActaById: (id: string) => Promise<Acta | null>;
  createActa: (data: Partial<Acta>) => Promise<Acta | null>;
  updateActa: (id: string, data: Partial<Acta>) => Promise<Acta | null>;
  deleteActa: (id: string) => Promise<boolean>;
  finalizarActa: (id: string) => Promise<boolean>;
  aprovarActa: (id: string) => Promise<boolean>;
  arquivarActa: (id: string) => Promise<boolean>;
  compartilharActa: (id: string, usuarioIds: string[], permissao: 'leitura' | 'edicao') => Promise<boolean>;
}

export function useActas(): UseActasReturn {
  const [actas, setActas] = useState<Acta[]>([]);
  const [stats, setStats] = useState<ActaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActas = useCallback(async (filters?: ActaFilters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.tipo_reuniao) queryParams.append('tipo_reuniao', filters.tipo_reuniao);
      if (filters?.departamento) queryParams.append('departamento', filters.departamento);
      if (filters?.data_inicio) queryParams.append('data_inicio', filters.data_inicio);
      if (filters?.data_fim) queryParams.append('data_fim', filters.data_fim);

      const query = queryParams.toString();
      const endpoint = `/actas${query ? `?${query}` : ''}`;

 console.log(' Buscando actas no endpoint:', endpoint);
      const response = await apiClient.get<{ actas: Acta[] }>(endpoint);
 console.log(' Actas carregadas:', response.actas?.length || 0);
      setActas(response.actas || []);
    } catch (err: any) {
 console.error(' Erro ao buscar actas:', err);
 console.error(' Detalhes do erro:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      const errorMessage = err.message || 'Erro ao carregar actas';
      setError(errorMessage);
      toast.error(`Erro ao carregar actas: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActaById = useCallback(async (id: string): Promise<Acta | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ acta: Acta }>(`/actas/${id}`);
      return response.acta;
    } catch (err: any) {
 console.error('Erro ao buscar acta:', err);
      setError(err.message || 'Erro ao carregar acta');
      toast.error('Erro ao carregar acta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createActa = useCallback(async (data: Partial<Acta>): Promise<Acta | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ acta: Acta }>('/actas', data);
      toast.success('Acta criada com sucesso!');
      setActas(prev => [response.acta, ...prev]);
      return response.acta;
    } catch (err: any) {
 console.error('Erro ao criar acta:', err);
      setError(err.message || 'Erro ao criar acta');
      toast.error(err.message || 'Erro ao criar acta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateActa = useCallback(async (id: string, data: Partial<Acta>): Promise<Acta | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ acta: Acta }>(`/actas/${id}`, data);
      toast.success('Acta atualizada com sucesso!');
      setActas(prev => prev.map(a => a.id === id ? response.acta : a));
      return response.acta;
    } catch (err: any) {
 console.error('Erro ao atualizar acta:', err);
      setError(err.message || 'Erro ao atualizar acta');
      toast.error(err.message || 'Erro ao atualizar acta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteActa = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/actas/${id}`);
      toast.success('Acta excluída com sucesso!');
      setActas(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err: any) {
 console.error('Erro ao deletar acta:', err);
      setError(err.message || 'Erro ao deletar acta');
      toast.error(err.message || 'Erro ao deletar acta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizarActa = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ acta: Acta }>(`/actas/${id}/finalizar`, {});
      toast.success('Acta finalizada com sucesso!');
      setActas(prev => prev.map(a => a.id === id ? response.acta : a));
      return true;
    } catch (err: any) {
 console.error('Erro ao finalizar acta:', err);
      setError(err.message || 'Erro ao finalizar acta');
      toast.error(err.message || 'Erro ao finalizar acta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const aprovarActa = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ acta: Acta }>(`/actas/${id}/aprovar`, {});
      toast.success('Acta aprovada com sucesso!');
      setActas(prev => prev.map(a => a.id === id ? response.acta : a));
      return true;
    } catch (err: any) {
 console.error('Erro ao aprovar acta:', err);
      setError(err.message || 'Erro ao aprovar acta');
      toast.error(err.message || 'Erro ao aprovar acta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const arquivarActa = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ acta: Acta }>(`/actas/${id}/arquivar`, {});
      toast.success('Acta arquivada com sucesso!');
      setActas(prev => prev.map(a => a.id === id ? response.acta : a));
      return true;
    } catch (err: any) {
 console.error('Erro ao arquivar acta:', err);
      setError(err.message || 'Erro ao arquivar acta');
      toast.error(err.message || 'Erro ao arquivar acta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const compartilharActa = useCallback(async (
    id: string,
    usuarioIds: string[],
    permissao: 'leitura' | 'edicao'
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/actas/${id}/compartilhar`, {
        usuario_ids: usuarioIds,
        permissao,
      });
      toast.success('Acta compartilhada com sucesso!');
      return true;
    } catch (err: any) {
 console.error('Erro ao compartilhar acta:', err);
      setError(err.message || 'Erro ao compartilhar acta');
      toast.error(err.message || 'Erro ao compartilhar acta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular estatísticas
  useEffect(() => {
    if (actas.length === 0) {
      setStats(null);
      return;
    }

    const newStats: ActaStats = {
      total: actas.length,
      rascunho: actas.filter(a => a.status === 'rascunho').length,
      pendente: actas.filter(a => a.status === 'pendente').length,
      aprovado: actas.filter(a => a.status === 'aprovado').length,
      arquivado: actas.filter(a => a.status === 'arquivado').length,
      ordinaria: actas.filter(a => a.tipo_reuniao === 'ordinaria').length,
      extraordinaria: actas.filter(a => a.tipo_reuniao === 'extraordinaria').length,
      emergencia: actas.filter(a => a.tipo_reuniao === 'emergencia').length,
    };

    setStats(newStats);
  }, [actas]);

  return {
    actas,
    stats,
    loading,
    error,
    fetchActas,
    fetchActaById,
    createActa,
    updateActa,
    deleteActa,
    finalizarActa,
    aprovarActa,
    arquivarActa,
    compartilharActa,
  };
}