/**
 * Hook customizado para Gestão de Frota
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Viatura, ViaturaFilters, FrotaStats } from '../components/frotas/types';

interface UseFrotasReturn {
  viaturas: Viatura[];
  stats: FrotaStats | null;
  loading: boolean;
  error: string | null;
  fetchViaturas: (filters?: ViaturaFilters) => Promise<void>;
  fetchViaturaById: (id: string) => Promise<Viatura | null>;
  createViatura: (data: Partial<Viatura>) => Promise<Viatura | null>;
  updateViatura: (id: string, data: Partial<Viatura>) => Promise<Viatura | null>;
  deleteViatura: (id: string) => Promise<boolean>;
  ativarViatura: (id: string) => Promise<boolean>;
  desativarViatura: (id: string, motivo: string) => Promise<boolean>;
  registrarManutencao: (id: string, manutencao: any) => Promise<boolean>;
  registrarAbastecimento: (id: string, abastecimento: any) => Promise<boolean>;
  compartilharViatura: (id: string, usuarioIds: string[], permissao: 'leitura' | 'edicao') => Promise<boolean>;
}

export function useFrotas(): UseFrotasReturn {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [stats, setStats] = useState<FrotaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViaturas = useCallback(async (filters?: ViaturaFilters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.tipo) queryParams.append('tipo', filters.tipo);
      if (filters?.departamento) queryParams.append('departamento', filters.departamento);
      if (filters?.marca) queryParams.append('marca', filters.marca);

      const query = queryParams.toString();
      const endpoint = `/frotas${query ? `?${query}` : ''}`;

      const response = await apiClient.get<{ viaturas: Viatura[] }>(endpoint);
      setViaturas(response.viaturas || []);
    } catch (err: any) {
 console.error('Erro ao buscar viaturas:', err);
      setError(err.message || 'Erro ao carregar viaturas');
      toast.error('Erro ao carregar viaturas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchViaturaById = useCallback(async (id: string): Promise<Viatura | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ viatura: Viatura }>(`/frotas/${id}`);
      return response.viatura;
    } catch (err: any) {
 console.error('Erro ao buscar viatura:', err);
      setError(err.message || 'Erro ao carregar viatura');
      toast.error('Erro ao carregar viatura');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createViatura = useCallback(async (data: Partial<Viatura>): Promise<Viatura | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ viatura: Viatura }>('/frotas', data);
      toast.success('Viatura cadastrada com sucesso!');
      setViaturas(prev => [response.viatura, ...prev]);
      return response.viatura;
    } catch (err: any) {
 console.error('Erro ao criar viatura:', err);
      setError(err.message || 'Erro ao cadastrar viatura');
      toast.error(err.message || 'Erro ao cadastrar viatura');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateViatura = useCallback(async (id: string, data: Partial<Viatura>): Promise<Viatura | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ viatura: Viatura }>(`/frotas/${id}`, data);
      toast.success('Viatura atualizada com sucesso!');
      setViaturas(prev => prev.map(v => v.id === id ? response.viatura : v));
      return response.viatura;
    } catch (err: any) {
 console.error('Erro ao atualizar viatura:', err);
      setError(err.message || 'Erro ao atualizar viatura');
      toast.error(err.message || 'Erro ao atualizar viatura');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteViatura = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/frotas/${id}`);
      toast.success('Viatura excluída com sucesso!');
      setViaturas(prev => prev.filter(v => v.id !== id));
      return true;
    } catch (err: any) {
 console.error('Erro ao deletar viatura:', err);
      setError(err.message || 'Erro ao deletar viatura');
      toast.error(err.message || 'Erro ao deletar viatura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const ativarViatura = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ viatura: Viatura }>(`/frotas/${id}/ativar`, {});
      toast.success('Viatura ativada com sucesso!');
      setViaturas(prev => prev.map(v => v.id === id ? response.viatura : v));
      return true;
    } catch (err: any) {
 console.error('Erro ao ativar viatura:', err);
      setError(err.message || 'Erro ao ativar viatura');
      toast.error(err.message || 'Erro ao ativar viatura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const desativarViatura = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ viatura: Viatura }>(`/frotas/${id}/desativar`, {
        motivo,
      });
      toast.success('Viatura desativada');
      setViaturas(prev => prev.map(v => v.id === id ? response.viatura : v));
      return true;
    } catch (err: any) {
 console.error('Erro ao desativar viatura:', err);
      setError(err.message || 'Erro ao desativar viatura');
      toast.error(err.message || 'Erro ao desativar viatura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarManutencao = useCallback(async (id: string, manutencao: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ viatura: Viatura }>(`/frotas/${id}/manutencoes`, manutencao);
      toast.success('Manutenção registrada com sucesso!');
      setViaturas(prev => prev.map(v => v.id === id ? response.viatura : v));
      return true;
    } catch (err: any) {
 console.error('Erro ao registrar manutenção:', err);
      setError(err.message || 'Erro ao registrar manutenção');
      toast.error(err.message || 'Erro ao registrar manutenção');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarAbastecimento = useCallback(async (id: string, abastecimento: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ viatura: Viatura }>(`/frotas/${id}/abastecimentos`, abastecimento);
      toast.success('Abastecimento registrado com sucesso!');
      setViaturas(prev => prev.map(v => v.id === id ? response.viatura : v));
      return true;
    } catch (err: any) {
 console.error('Erro ao registrar abastecimento:', err);
      setError(err.message || 'Erro ao registrar abastecimento');
      toast.error(err.message || 'Erro ao registrar abastecimento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const compartilharViatura = useCallback(async (
    id: string,
    usuarioIds: string[],
    permissao: 'leitura' | 'edicao'
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/frotas/${id}/compartilhar`, {
        usuario_ids: usuarioIds,
        permissao,
      });
      toast.success('Viatura compartilhada com sucesso!');
      return true;
    } catch (err: any) {
 console.error('Erro ao compartilhar viatura:', err);
      setError(err.message || 'Erro ao compartilhar viatura');
      toast.error(err.message || 'Erro ao compartilhar viatura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular estatísticas
  useEffect(() => {
    if (viaturas.length === 0) {
      setStats(null);
      return;
    }

    const newStats: FrotaStats = {
      total: viaturas.length,
      ativas: viaturas.filter(v => v.status === 'ativo').length,
      em_manutencao: viaturas.filter(v => v.status === 'em_manutencao').length,
      inativas: viaturas.filter(v => v.status === 'inativo').length,
      disponiveis: viaturas.filter(v => v.status === 'ativo' && !v.em_uso).length,
      em_uso: viaturas.filter(v => v.em_uso).length,
      manutencoes_pendentes: viaturas.filter(v => {
        // Verificar se há manutenção programada próxima
        const kmAtual = v.quilometragem;
        const proximaManutencao = v.proxima_manutencao_km || (kmAtual + 5000);
        return proximaManutencao - kmAtual < 1000;
      }).length,
    };

    setStats(newStats);
  }, [viaturas]);

  return {
    viaturas,
    stats,
    loading,
    error,
    fetchViaturas,
    fetchViaturaById,
    createViatura,
    updateViatura,
    deleteViatura,
    ativarViatura,
    desativarViatura,
    registrarManutencao,
    registrarAbastecimento,
    compartilharViatura,
  };
}