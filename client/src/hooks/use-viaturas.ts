import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Viatura } from '../components/frotas/types';

interface UseViaturasReturn {
  viaturas: Viatura[];
  isLoading: boolean;
  error: string | null;
  createViatura: (data: any, accessToken: string) => Promise<Viatura>;
  updateViatura: (id: string, data: any, accessToken: string) => Promise<Viatura>;
  deleteViatura: (id: string, accessToken: string) => Promise<void>;
  ativarViatura: (id: string, accessToken: string) => Promise<Viatura>;
  refetch: () => void;
}

function toNumber(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeViatura(raw: any): Viatura {
  return {
    ...raw,
    matricula: raw.matricula || raw.plate || '',
    marca: raw.marca || raw.brand || '',
    modelo: raw.modelo || raw.model || '',
    ano: toNumber(raw.ano ?? raw.year),
    cor: raw.cor || raw.color || '',
    tipo: raw.tipo || raw.type || 'Ligeiro',
    combustivel: raw.combustivel || raw.fuel || 'gasolina',
    status: raw.status || 'disponivel',
    lugares: toNumber(raw.lugares ?? raw.seats, 0),
    km_atual: toNumber(raw.km_atual ?? raw.currentKm, 0),
    km_proxima_revisao: raw.km_proxima_revisao ?? raw.kmProximaRevisao,
    localizacao_atual: raw.localizacao_atual || raw.localizacaoAtual || raw.assignedTo || '',
    departamento: raw.departamento || raw.department || '',
    custo_total_manutencao: toNumber(raw.custo_total_manutencao, 0),
    custo_total_combustivel: toNumber(raw.custo_total_combustivel, 0),
    created_by_id: raw.created_by_id || raw.createdById || '',
    created_by_name: raw.created_by_name || raw.createdByName || '',
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

export function useViaturas(accessToken?: string): UseViaturasReturn {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViaturas = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      setViaturas([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const url = `${API_BASE_URL}/frotas`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao carregar viaturas');
      }

      const data = await response.json();
 console.log('[VIATURAS HOOK] Resposta do backend:', data);
      setViaturas((data.viaturas || data.data || []).map(normalizeViatura));
    } catch (err: any) {
 console.error('[VIATURAS] Erro ao carregar:', err);
      setError(err.message);
      setViaturas([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchViaturas();
  }, [fetchViaturas]);

  const createViatura = async (data: any, accessToken: string): Promise<Viatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas`,
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
        throw new Error(errorData.error || 'Erro ao criar viatura');
      }

      const result = await response.json();
      const viatura = normalizeViatura(result.viatura || result.data);
 console.log('[VIATURAS HOOK] Viatura criada:', viatura);
      setViaturas((prev) => [...prev, viatura]);
      return viatura;
    } catch (err: any) {
 console.error('[VIATURAS HOOK] Erro ao criar viatura:', err);
      throw err;
    }
  };

  const updateViatura = async (id: string, data: any, accessToken: string): Promise<Viatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/${id}`,
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
        throw new Error(errorData.error || 'Erro ao atualizar viatura');
      }

      const result = await response.json();
      const viatura = normalizeViatura(result.viatura || result.data);
 console.log('[VIATURAS HOOK] Viatura atualizada:', viatura);
      setViaturas((prev) => prev.map((v) => (v.id === id ? viatura : v)));
      return viatura;
    } catch (err: any) {
 console.error('[VIATURAS HOOK] Erro ao atualizar viatura:', err);
      throw err;
    }
  };

  const deleteViatura = async (id: string, accessToken: string): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao eliminar viatura');
      }

      setViaturas((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
 console.error('Erro ao eliminar viatura:', err);
      throw err;
    }
  };

  const ativarViatura = async (id: string, accessToken: string): Promise<Viatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/${id}/ativar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao ativar viatura');
      }

      const result = await response.json();
      const viatura = normalizeViatura(result.viatura || result.data);
 console.log('[VIATURAS HOOK] Viatura ativada:', viatura);
      setViaturas((prev) => prev.map((v) => (v.id === id ? viatura : v)));
      return viatura;
    } catch (err: any) {
 console.error('[VIATURAS HOOK] Erro ao ativar viatura:', err);
      throw err;
    }
  };

  return {
    viaturas,
    isLoading,
    error,
    createViatura,
    updateViatura,
    deleteViatura,
    ativarViatura,
    refetch: fetchViaturas,
  };
}
