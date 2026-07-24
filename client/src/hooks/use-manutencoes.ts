import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Manutencao } from '../components/frotas/types';

interface UseManuntencoesReturn {
  manutencoes: Manutencao[];
  isLoading: boolean;
  error: string | null;
  createManutencao: (data: any, accessToken: string) => Promise<Manutencao>;
  updateManutencao: (id: string, data: any, accessToken: string) => Promise<Manutencao>;
  concluirManutencao: (id: string, data: any, accessToken: string) => Promise<Manutencao>;
  refetch: () => void;
}

export function useManutencoes(
  viaturaId?: string,
  accessToken?: string
): UseManuntencoesReturn {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManutencoes = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      setManutencoes([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (viaturaId) {
        params.append('viatura_id', viaturaId);
      }

      const url = `${API_BASE_URL}/frotas/manutencoes${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar manutenções');
      }

      const data = await response.json();
      setManutencoes(data.manutencoes || []);
    } catch (err: any) {
 console.error('Erro ao carregar manutenções:', err);
      setError(err.message);
      setManutencoes([]);
    } finally {
      setIsLoading(false);
    }
  }, [viaturaId, accessToken]);

  useEffect(() => {
    fetchManutencoes();
  }, [fetchManutencoes]);

  const createManutencao = async (data: any, accessToken: string): Promise<Manutencao> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/manutencoes`,
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
        throw new Error(errorData.error || 'Erro ao criar manutenção');
      }

      const result = await response.json();
      
      // Atualizar lista local
      setManutencoes((prev) => [result.manutencao, ...prev]);
      
      return result.manutencao;
    } catch (err: any) {
 console.error('Erro ao criar manutenção:', err);
      throw err;
    }
  };

  const updateManutencao = async (
    id: string,
    data: any,
    accessToken: string
  ): Promise<Manutencao> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/manutencoes/${id}`,
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
        throw new Error(errorData.error || 'Erro ao atualizar manutenção');
      }

      const result = await response.json();
      
      // Atualizar lista local
      setManutencoes((prev) =>
        prev.map((m) => (m.id === id ? result.manutencao : m))
      );
      
      return result.manutencao;
    } catch (err: any) {
 console.error('Erro ao atualizar manutenção:', err);
      throw err;
    }
  };

  const concluirManutencao = async (
    id: string,
    data: any,
    accessToken: string
  ): Promise<Manutencao> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/manutencoes/${id}/concluir`,
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
        throw new Error(errorData.error || 'Erro ao concluir manutenção');
      }

      const result = await response.json();
      
      // Atualizar lista local
      setManutencoes((prev) =>
        prev.map((m) => (m.id === id ? result.manutencao : m))
      );
      
      return result.manutencao;
    } catch (err: any) {
 console.error('Erro ao concluir manutenção:', err);
      throw err;
    }
  };

  return {
    manutencoes,
    isLoading,
    error,
    createManutencao,
    updateManutencao,
    concluirManutencao,
    refetch: fetchManutencoes,
  };
}