/**
 * Hook customizado para gestão de Facturas
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Factura, FacturaFilters, FacturaStats } from '../components/facturas/types';

interface UseFacturasReturn {
  facturas: Factura[];
  stats: FacturaStats | null;
  loading: boolean;
  error: string | null;
  fetchFacturas: (filters?: FacturaFilters) => Promise<void>;
  fetchFacturaById: (id: string) => Promise<Factura | null>;
  createFactura: (data: Partial<Factura>) => Promise<Factura | null>;
  updateFactura: (id: string, data: Partial<Factura>) => Promise<Factura | null>;
  deleteFactura: (id: string) => Promise<boolean>;
  aprovarFactura: (id: string) => Promise<boolean>;
  pagarFactura: (id: string, comprovativo?: File) => Promise<boolean>;
  rejeitarFactura: (id: string, motivo: string) => Promise<boolean>;
  compartilharFactura: (id: string, usuarioIds: string[], permissao: 'leitura' | 'edicao') => Promise<boolean>;
}

export function useFacturas(): UseFacturasReturn {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [stats, setStats] = useState<FacturaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFacturas = useCallback(async (filters?: FacturaFilters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.fornecedor) queryParams.append('fornecedor', filters.fornecedor);
      if (filters?.data_inicio) queryParams.append('data_inicio', filters.data_inicio);
      if (filters?.data_fim) queryParams.append('data_fim', filters.data_fim);
      if (filters?.valor_min) queryParams.append('valor_min', filters.valor_min.toString());
      if (filters?.valor_max) queryParams.append('valor_max', filters.valor_max.toString());

      const query = queryParams.toString();
      const endpoint = `/facturas${query ? `?${query}` : ''}`;

      const response = await apiClient.get<{ facturas: Factura[] }>(endpoint);
      setFacturas(response.facturas || []);
    } catch (err: any) {
 console.error('Erro ao buscar facturas:', err);
      setError(err.message || 'Erro ao carregar facturas');
      toast.error('Erro ao carregar facturas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFacturaById = useCallback(async (id: string): Promise<Factura | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ factura: Factura }>(`/facturas/${id}`);
      return response.factura;
    } catch (err: any) {
 console.error('Erro ao buscar factura:', err);
      setError(err.message || 'Erro ao carregar factura');
      toast.error('Erro ao carregar factura');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createFactura = useCallback(async (data: Partial<Factura>): Promise<Factura | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ factura: Factura }>('/facturas', data);
      toast.success('Factura criada com sucesso!');
      setFacturas(prev => [response.factura, ...prev]);
      return response.factura;
    } catch (err: any) {
 console.error('Erro ao criar factura:', err);
      setError(err.message || 'Erro ao criar factura');
      toast.error(err.message || 'Erro ao criar factura');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFactura = useCallback(async (id: string, data: Partial<Factura>): Promise<Factura | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ factura: Factura }>(`/facturas/${id}`, data);
      toast.success('Factura atualizada com sucesso!');
      setFacturas(prev => prev.map(f => f.id === id ? response.factura : f));
      return response.factura;
    } catch (err: any) {
 console.error('Erro ao atualizar factura:', err);
      setError(err.message || 'Erro ao atualizar factura');
      toast.error(err.message || 'Erro ao atualizar factura');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFactura = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/facturas/${id}`);
      toast.success('Factura excluída com sucesso!');
      setFacturas(prev => prev.filter(f => f.id !== id));
      return true;
    } catch (err: any) {
 console.error('Erro ao deletar factura:', err);
      setError(err.message || 'Erro ao deletar factura');
      toast.error(err.message || 'Erro ao deletar factura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const aprovarFactura = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ factura: Factura }>(`/facturas/${id}/aprovar`, {});
      toast.success('Factura aprovada com sucesso!');
      setFacturas(prev => prev.map(f => f.id === id ? response.factura : f));
      return true;
    } catch (err: any) {
 console.error('Erro ao aprovar factura:', err);
      setError(err.message || 'Erro ao aprovar factura');
      toast.error(err.message || 'Erro ao aprovar factura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const pagarFactura = useCallback(async (id: string, comprovativo?: File): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (comprovativo) {
        const formData = new FormData();
        formData.append('comprovativo', comprovativo);
        response = await apiClient.upload<{ factura: Factura }>(`/facturas/${id}/pagar`, formData);
      } else {
        response = await apiClient.post<{ factura: Factura }>(`/facturas/${id}/pagar`, {});
      }
      
      toast.success('Factura marcada como paga!');
      setFacturas(prev => prev.map(f => f.id === id ? response.factura : f));
      return true;
    } catch (err: any) {
 console.error('Erro ao pagar factura:', err);
      setError(err.message || 'Erro ao processar pagamento');
      toast.error(err.message || 'Erro ao processar pagamento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejeitarFactura = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ factura: Factura }>(`/facturas/${id}/rejeitar`, {
        motivo,
      });
      toast.success('Factura rejeitada');
      setFacturas(prev => prev.map(f => f.id === id ? response.factura : f));
      return true;
    } catch (err: any) {
 console.error('Erro ao rejeitar factura:', err);
      setError(err.message || 'Erro ao rejeitar factura');
      toast.error(err.message || 'Erro ao rejeitar factura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const compartilharFactura = useCallback(async (
    id: string,
    usuarioIds: string[],
    permissao: 'leitura' | 'edicao'
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/facturas/${id}/compartilhar`, {
        usuario_ids: usuarioIds,
        permissao,
      });
      toast.success('Factura compartilhada com sucesso!');
      return true;
    } catch (err: any) {
 console.error('Erro ao compartilhar factura:', err);
      setError(err.message || 'Erro ao compartilhar factura');
      toast.error(err.message || 'Erro ao compartilhar factura');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular estatísticas
  useEffect(() => {
    if (facturas.length === 0) {
      setStats(null);
      return;
    }

    const now = new Date();
    const newStats: FacturaStats = {
      total: facturas.length,
      pendentes: facturas.filter(f => f.status === 'pendente').length,
      aprovadas: facturas.filter(f => f.status === 'aprovado').length,
      pagas: facturas.filter(f => f.status === 'pago').length,
      rejeitadas: facturas.filter(f => f.status === 'rejeitado').length,
      vencidas: facturas.filter(f => {
        return new Date(f.data_vencimento) < now && f.status !== 'pago' && f.status !== 'rejeitado';
      }).length,
      valor_total: facturas.reduce((sum, f) => sum + f.valor_total, 0),
      valor_pago: facturas.filter(f => f.status === 'pago').reduce((sum, f) => sum + f.valor_total, 0),
      valor_pendente: facturas.filter(f => f.status !== 'pago' && f.status !== 'rejeitado').reduce((sum, f) => sum + f.valor_total, 0),
    };

    setStats(newStats);
  }, [facturas]);

  return {
    facturas,
    stats,
    loading,
    error,
    fetchFacturas,
    fetchFacturaById,
    createFactura,
    updateFactura,
    deleteFactura,
    aprovarFactura,
    pagarFactura,
    rejeitarFactura,
    compartilharFactura,
  };
}
