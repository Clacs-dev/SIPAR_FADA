/**
 * HOOK PERSONALIZADO PARA COMUNICAÇÕES INTERNAS
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../components/auth/auth-context';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Comunicacao, ComunicacaoFilters, ComunicacaoStats } from '../components/comunicacoes/types';

export function useComunicacoes() {
  const { accessToken } = useAuth();
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([]);
  const [stats, setStats] = useState<ComunicacaoStats>({
    total: 0,
    pendentes: 0,
    em_analise: 0,
    despachadas: 0,
    arquivadas: 0,
    urgentes: 0,
    confidenciais: 0,
  });
  const [loading, setLoading] = useState(false);

  // Calcular estatísticas
  const calculateStats = (data: Comunicacao[]): ComunicacaoStats => {
    return {
      total: data.length,
      pendentes: data.filter(c => c.status === 'pendente').length,
      em_analise: data.filter(c => c.status === 'em_analise').length,
      despachadas: data.filter(c => c.status === 'despachado').length,
      arquivadas: data.filter(c => c.status === 'arquivado').length,
      urgentes: data.filter(c => c.prioridade === 'urgente').length,
      confidenciais: data.filter(c => c.confidencial).length,
    };
  };

  // Buscar comunicações
  const fetchComunicacoes = useCallback(async (filters?: ComunicacaoFilters) => {
    try {
      setLoading(true);
 console.log(' Buscando comunicações...');

      const response = await fetch(
        `${API_BASE_URL}/comunicacoes`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar comunicações');
      }

      const data = await response.json();
 console.log(' Comunicações recebidas:', data.comunicacoes?.length || 0);
      
      let filtered = data.comunicacoes || [];

      // Aplicar filtros
      if (filters) {
        if (filters.status) {
          filtered = filtered.filter((c: Comunicacao) => c.status === filters.status);
        }
        if (filters.prioridade) {
          filtered = filtered.filter((c: Comunicacao) => c.prioridade === filters.prioridade);
        }
        if (filters.departamento_origem) {
          filtered = filtered.filter((c: Comunicacao) => c.departamento_origem === filters.departamento_origem);
        }
        if (filters.departamento_destino) {
          filtered = filtered.filter((c: Comunicacao) => c.departamento_destino === filters.departamento_destino);
        }
        if (filters.confidencial !== undefined) {
          filtered = filtered.filter((c: Comunicacao) => c.confidencial === filters.confidencial);
        }
      }

      setComunicacoes(filtered);
      setStats(calculateStats(filtered));
    } catch (error) {
 console.error(' Erro ao buscar comunicações:', error);
      toast.error('Erro ao carregar comunicações');
      setComunicacoes([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Criar comunicação
  const createComunicacao = useCallback(async (data: Partial<Comunicacao>) => {
    try {
      setLoading(true);
 console.log(' Criando comunicação...');

      const response = await fetch(
        `${API_BASE_URL}/comunicacoes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar comunicação');
      }

      const result = await response.json();
 console.log(' Comunicação criada:', result.comunicacao.numero);
      
      toast.success(`Comunicação ${result.comunicacao.numero} criada com sucesso!`);
      
      // Atualizar lista
      await fetchComunicacoes();
      
      return result.comunicacao;
    } catch (error) {
 console.error(' Erro ao criar comunicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar comunicação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchComunicacoes]);

  // Atualizar comunicação
  const updateComunicacao = useCallback(async (id: string, data: Partial<Comunicacao>) => {
    try {
      setLoading(true);
 console.log(' Atualizando comunicação:', id);

      const response = await fetch(
        `${API_BASE_URL}/comunicacoes/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar comunicação');
      }

      const result = await response.json();
 console.log(' Comunicação atualizada:', result.comunicacao.numero);
      
      toast.success('Comunicação atualizada com sucesso!');
      
      // Atualizar lista
      await fetchComunicacoes();
      
      return result.comunicacao;
    } catch (error) {
 console.error(' Erro ao atualizar comunicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar comunicação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchComunicacoes]);

  // Deletar comunicação
  const deleteComunicacao = useCallback(async (id: string) => {
    try {
      setLoading(true);
 console.log(' Deletando comunicação:', id);

      const response = await fetch(
        `${API_BASE_URL}/comunicacoes/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar comunicação');
      }

 console.log(' Comunicação deletada');
      toast.success('Comunicação deletada com sucesso!');
      
      // Atualizar lista
      await fetchComunicacoes();
    } catch (error) {
 console.error(' Erro ao deletar comunicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar comunicação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchComunicacoes]);

  // Adicionar despacho
  const despacharComunicacao = useCallback(async (id: string, despachoData: any) => {
    try {
      setLoading(true);
 console.log(' Adicionando despacho à comunicação:', id);

      const response = await fetch(
        `${API_BASE_URL}/comunicacoes/${id}/despacho`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(despachoData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar despacho');
      }

      const result = await response.json();
 console.log(' Despacho adicionado');
      
      toast.success('Despacho adicionado com sucesso!');
      
      // Atualizar lista
      await fetchComunicacoes();
      
      return result.comunicacao;
    } catch (error) {
 console.error(' Erro ao adicionar despacho:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar despacho');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchComunicacoes]);

  // Arquivar comunicação
  const arquivarComunicacao = useCallback(async (id: string) => {
    try {
      setLoading(true);
 console.log(' Arquivando comunicação:', id);

      const response = await fetch(
        `${API_BASE_URL}/comunicacoes/${id}/arquivar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao arquivar comunicação');
      }

 console.log(' Comunicação arquivada');
      toast.success('Comunicação arquivada com sucesso!');
      
      // Atualizar lista
      await fetchComunicacoes();
    } catch (error) {
 console.error(' Erro ao arquivar comunicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao arquivar comunicação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchComunicacoes]);

  // Compartilhar comunicação
  const compartilharComunicacao = useCallback(async (id: string, destinatarios: string[]) => {
    try {
      setLoading(true);
 console.log(' Compartilhando comunicação:', id);

      const response = await fetch(
        `${API_BASE_URL}/comunicacoes/${id}/compartilhar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ destinatarios }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao compartilhar comunicação');
      }

 console.log(' Comunicação compartilhada');
      toast.success('Comunicação compartilhada com sucesso!');
    } catch (error) {
 console.error(' Erro ao compartilhar comunicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao compartilhar comunicação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  return {
    comunicacoes,
    stats,
    loading,
    fetchComunicacoes,
    createComunicacao,
    updateComunicacao,
    deleteComunicacao,
    despacharComunicacao,
    arquivarComunicacao,
    compartilharComunicacao,
  };
}