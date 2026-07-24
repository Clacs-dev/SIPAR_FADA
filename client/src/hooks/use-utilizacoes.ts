import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Utilizacao } from '../components/frotas/types';

interface UseUtilizacoesReturn {
  utilizacoes: Utilizacao[];
  isLoading: boolean;
  error: string | null;
  createUtilizacao: (data: any, accessToken: string) => Promise<Utilizacao>;
  updateUtilizacao: (id: string, data: any, accessToken: string) => Promise<Utilizacao>;
  concluirUtilizacao: (id: string, data: any, accessToken: string) => Promise<Utilizacao>;
  refetch: () => void;
}

export function useUtilizacoes(
  viaturaId?: string,
  accessToken?: string
): UseUtilizacoesReturn {
  const [utilizacoes, setUtilizacoes] = useState<Utilizacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUtilizacoes = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      setUtilizacoes([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (viaturaId) {
        params.append('viatura_id', viaturaId);
      }

      const url = `${API_BASE_URL}/frotas/utilizacoes${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar utilizações');
      }

      const data = await response.json();
      setUtilizacoes(data.utilizacoes || []);
    } catch (err: any) {
 console.error('Erro ao carregar utilizações:', err);
      setError(err.message);
      setUtilizacoes([]);
    } finally {
      setIsLoading(false);
    }
  }, [viaturaId, accessToken]);

  useEffect(() => {
    fetchUtilizacoes();
  }, [fetchUtilizacoes]);

  const createUtilizacao = async (data: any, accessToken: string): Promise<Utilizacao> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/utilizacoes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar utilização');
      }

      const result = await response.json();
      
      // Atualizar lista local
      setUtilizacoes((prev) => [result.utilizacao, ...prev]);
      
      return result.utilizacao;
    } catch (err: any) {
 console.error('Erro ao criar utilização:', err);
      throw err;
    }
  };

  const updateUtilizacao = async (
    id: string,
    data: any,
    accessToken: string
  ): Promise<Utilizacao> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/utilizacoes/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar utilização');
      }

      const result = await response.json();
      
      // Atualizar lista local
      setUtilizacoes((prev) =>
        prev.map((u) => (u.id === id ? result.utilizacao : u))
      );
      
      return result.utilizacao;
    } catch (err: any) {
 console.error('Erro ao atualizar utilização:', err);
      throw err;
    }
  };

  const concluirUtilizacao = async (
    id: string,
    data: any,
    accessToken: string
  ): Promise<Utilizacao> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/utilizacoes/${id}/concluir`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao concluir utilização');
      }

      const result = await response.json();
      
      // Atualizar lista local
      setUtilizacoes((prev) =>
        prev.map((u) => (u.id === id ? result.utilizacao : u))
      );
      
      return result.utilizacao;
    } catch (err: any) {
 console.error('Erro ao concluir utilização:', err);
      throw err;
    }
  };

  return {
    utilizacoes,
    isLoading,
    error,
    createUtilizacao,
    updateUtilizacao,
    concluirUtilizacao,
    refetch: fetchUtilizacoes,
  };
}