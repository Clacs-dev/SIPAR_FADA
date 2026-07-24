/**
 * Hook para gestão de Contratos
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Contrato, ContratoStats, AlertaContrato } from '../components/contratos/types';

export function useContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [stats, setStats] = useState<ContratoStats | null>(null);
  const [alertas, setAlertas] = useState<AlertaContrato[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContratos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ contratos: Contrato[] }>('/contratos');
      setContratos(response.contratos || []);
    } catch (err: any) {
      toast.error('Erro ao carregar contratos');
      setContratos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ stats: ContratoStats }>('/contratos/stats/geral');
      setStats(response.stats);
    } catch (err: any) {
 console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const fetchAlertas = useCallback(async () => {
    try {
      const response = await apiClient.get<{ alertas: AlertaContrato[] }>('/contratos/alertas/vencimento');
      setAlertas(response.alertas || []);
    } catch (err: any) {
 console.error('Erro ao carregar alertas:', err);
    }
  }, []);

  const createContrato = useCallback(async (data: Partial<Contrato>): Promise<Contrato | null> => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ contrato: Contrato }>('/contratos', data);
      toast.success('Contrato criado com sucesso!');
      setContratos(prev => [response.contrato, ...prev]);
      return response.contrato;
    } catch (err: any) {
      toast.error('Erro ao criar contrato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContrato = useCallback(async (id: string, data: Partial<Contrato>): Promise<Contrato | null> => {
    try {
      const response = await apiClient.put<{ contrato: Contrato }>(`/contratos/${id}`, data);
      toast.success('Contrato atualizado com sucesso!');
      setContratos(prev => prev.map(c => c.id === id ? response.contrato : c));
      return response.contrato;
    } catch (err: any) {
      toast.error('Erro ao atualizar contrato');
      return null;
    }
  }, []);

  const aprovarContrato = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ contrato: Contrato }>(`/contratos/${id}/aprovar`, {});
      toast.success('Contrato aprovado com sucesso!');
      setContratos(prev => prev.map(c => c.id === id ? response.contrato : c));
      return true;
    } catch (err: any) {
      toast.error('Erro ao aprovar contrato');
      return false;
    }
  }, []);

  // NOVAS FUNÇÕES - Validação Jurídica
  const enviarParaValidacaoJuridica = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ contrato: Contrato }>(`/contratos/${id}/enviar-validacao-juridica`, {});
      toast.success('Contrato enviado para validação jurídica!');
      setContratos(prev => prev.map(c => c.id === id ? response.contrato : c));
      return true;
    } catch (err: any) {
      toast.error('Erro ao enviar para validação jurídica');
      return false;
    }
  }, []);

  const validarJuridico = useCallback(async (id: string, observacoes?: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ contrato: Contrato }>(`/contratos/${id}/validar-juridico`, {
        observacoes_juridicas: observacoes
      });
      toast.success('Contrato validado juridicamente!');
      setContratos(prev => prev.map(c => c.id === id ? response.contrato : c));
      return true;
    } catch (err: any) {
      toast.error('Erro ao validar contrato');
      return false;
    }
  }, []);

  const rejeitarJuridico = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ contrato: Contrato }>(`/contratos/${id}/rejeitar-juridico`, {
        motivo_rejeicao_juridica: motivo
      });
      toast.success('Contrato rejeitado pelo jurídico');
      setContratos(prev => prev.map(c => c.id === id ? response.contrato : c));
      return true;
    } catch (err: any) {
      toast.error('Erro ao rejeitar contrato');
      return false;
    }
  }, []);

  const renovarContrato = useCallback(async (id: string, novaDataFim: string, novoValor?: number): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ contrato: Contrato }>(`/contratos/${id}/renovar`, {
        nova_data_fim: novaDataFim,
        novo_valor: novoValor
      });
      toast.success('Contrato renovado com sucesso!');
      setContratos(prev => prev.map(c => c.id === id ? response.contrato : c));
      return true;
    } catch (err: any) {
      toast.error('Erro ao renovar contrato');
      return false;
    }
  }, []);

  const cancelarContrato = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ contrato: Contrato }>(`/contratos/${id}/cancelar`, {
        motivo_cancelamento: motivo
      });
      toast.success('Contrato cancelado com sucesso!');
      setContratos(prev => prev.map(c => c.id === id ? response.contrato : c));
      return true;
    } catch (err: any) {
      toast.error('Erro ao cancelar contrato');
      return false;
    }
  }, []);

  const deleteContrato = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/contratos/${id}`);
      toast.success('Contrato excluído com sucesso!');
      setContratos(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err: any) {
      toast.error('Erro ao deletar contrato');
      return false;
    }
  }, []);

  return {
    contratos,
    stats,
    alertas,
    loading,
    fetchContratos,
    fetchStats,
    fetchAlertas,
    createContrato,
    updateContrato,
    aprovarContrato,
    enviarParaValidacaoJuridica,
    validarJuridico,
    rejeitarJuridico,
    renovarContrato,
    cancelarContrato,
    deleteContrato,
  };
}