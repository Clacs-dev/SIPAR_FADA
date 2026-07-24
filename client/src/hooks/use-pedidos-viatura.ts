import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { PedidoViatura } from '../components/frotas/pedidos-viatura-types';

interface UsePedidosViaturaReturn {
  pedidos: PedidoViatura[];
  isLoading: boolean;
  error: string | null;
  createPedido: (data: any, accessToken: string) => Promise<PedidoViatura>;
  updatePedido: (id: string, data: any, accessToken: string) => Promise<PedidoViatura>;
  submitPedido: (id: string, accessToken: string) => Promise<PedidoViatura>;
  approvePedido: (id: string, notas: string | undefined, accessToken: string) => Promise<PedidoViatura>;
  rejectPedido: (id: string, motivo: string, accessToken: string) => Promise<PedidoViatura>;
  assignPedido: (id: string, viaturaId: string, motoristaId: string | undefined, accessToken: string) => Promise<PedidoViatura>;
  cancelPedido: (id: string, accessToken: string) => Promise<PedidoViatura>;
  refetch: () => void;
}

export function usePedidosViatura(
  userId?: string,
  accessToken?: string
): UsePedidosViaturaReturn {
  const [pedidos, setPedidos] = useState<PedidoViatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      setPedidos([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) {
        params.append('user_id', userId);
      }

      const url = `${API_BASE_URL}/frotas/pedidos-viatura${
        params.toString() ? `?${params.toString()}` : ''
      }`;

 console.log('[PEDIDOS VIATURA HOOK] Buscando pedidos...');
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao carregar pedidos de viatura');
      }

      const data = await response.json();
 console.log('[PEDIDOS VIATURA HOOK] Pedidos recebidos:', data.pedidos?.length || 0);
      
      // Log detalhado dos pedidos
      if (data.pedidos && data.pedidos.length > 0) {
 console.log('[PEDIDOS VIATURA HOOK] IDs e status:');
        data.pedidos.forEach((p: any) => {
 console.log(` - ID: ${p.id}, Status: ${p.status}, Destino: ${p.destino}`);
        });
      }
      
      setPedidos(data.pedidos || []);
    } catch (err: any) {
 console.error('Erro ao carregar pedidos de viatura:', err);
      setError(err.message);
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, accessToken]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const createPedido = async (data: any, accessToken: string): Promise<PedidoViatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/pedidos-viatura`,
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
        throw new Error(errorData.error || 'Erro ao criar pedido');
      }

      const result = await response.json();
      setPedidos((prev) => [result.pedido, ...prev]);
      return result.pedido;
    } catch (err: any) {
 console.error('Erro ao criar pedido:', err);
      throw err;
    }
  };

  const updatePedido = async (
    id: string,
    data: any,
    accessToken: string
  ): Promise<PedidoViatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/pedidos-viatura/${id}`,
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
        throw new Error(errorData.error || 'Erro ao atualizar pedido');
      }

      const result = await response.json();
      setPedidos((prev) => prev.map((p) => (p.id === id ? result.pedido : p)));
      return result.pedido;
    } catch (err: any) {
 console.error('Erro ao atualizar pedido:', err);
      throw err;
    }
  };

  const submitPedido = async (id: string, accessToken: string): Promise<PedidoViatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/pedidos-viatura/${id}/submit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao submeter pedido');
      }

      const result = await response.json();
      setPedidos((prev) => prev.map((p) => (p.id === id ? result.pedido : p)));
      return result.pedido;
    } catch (err: any) {
 console.error('Erro ao submeter pedido:', err);
      throw err;
    }
  };

  const approvePedido = async (
    id: string,
    notas: string | undefined,
    accessToken: string
  ): Promise<PedidoViatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/pedidos-viatura/${id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ notas }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aprovar pedido');
      }

      const result = await response.json();
      setPedidos((prev) => prev.map((p) => (p.id === id ? result.pedido : p)));
      return result.pedido;
    } catch (err: any) {
 console.error('Erro ao aprovar pedido:', err);
      throw err;
    }
  };

  const rejectPedido = async (
    id: string,
    motivo: string,
    accessToken: string
  ): Promise<PedidoViatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/pedidos-viatura/${id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ motivo }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao rejeitar pedido');
      }

      const result = await response.json();
      setPedidos((prev) => prev.map((p) => (p.id === id ? result.pedido : p)));
      return result.pedido;
    } catch (err: any) {
 console.error('Erro ao rejeitar pedido:', err);
      throw err;
    }
  };

  const assignPedido = async (
    id: string,
    viaturaId: string,
    motoristaId: string | undefined,
    accessToken: string
  ): Promise<PedidoViatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/pedidos-viatura/${id}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ viatura_id: viaturaId, motorista_id: motoristaId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atribuir viatura');
      }

      const result = await response.json();
      setPedidos((prev) => prev.map((p) => (p.id === id ? result.pedido : p)));
      return result.pedido;
    } catch (err: any) {
 console.error('Erro ao atribuir viatura:', err);
      throw err;
    }
  };

  const cancelPedido = async (id: string, accessToken: string): Promise<PedidoViatura> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/frotas/pedidos-viatura/${id}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cancelar pedido');
      }

      const result = await response.json();
      setPedidos((prev) => prev.map((p) => (p.id === id ? result.pedido : p)));
      return result.pedido;
    } catch (err: any) {
 console.error('Erro ao cancelar pedido:', err);
      throw err;
    }
  };

  return {
    pedidos,
    isLoading,
    error,
    createPedido,
    updatePedido,
    submitPedido,
    approvePedido,
    rejectPedido,
    assignPedido,
    cancelPedido,
    refetch: fetchPedidos,
  };
}