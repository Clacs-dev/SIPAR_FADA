/**
 * Hook customizado para gestão de Fornecedores
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import type { Fornecedor } from '../components/compras/types';

interface UseFornecedoresReturn {
  fornecedores: Fornecedor[];
  loading: boolean;
  error: string | null;
  fetchFornecedores: () => Promise<void>;
  fetchFornecedorById: (id: string) => Promise<Fornecedor | null>;
  createFornecedor: (data: Partial<Fornecedor>) => Promise<Fornecedor | null>;
  updateFornecedor: (id: string, data: Partial<Fornecedor>) => Promise<Fornecedor | null>;
  deleteFornecedor: (id: string) => Promise<boolean>;
  ativarFornecedor: (id: string) => Promise<boolean>;
  desativarFornecedor: (id: string) => Promise<boolean>;
  bloquearFornecedor: (id: string, motivo: string) => Promise<boolean>;
  enviarCredenciais: (id: string) => Promise<boolean>;
}

export function useFornecedores(): UseFornecedoresReturn {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFornecedores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ fornecedores: Fornecedor[] }>('/procurement/fornecedores');
      setFornecedores(response.fornecedores || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fornecedores');
      toast.error('Erro ao carregar fornecedores');
      setFornecedores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFornecedorById = useCallback(async (id: string): Promise<Fornecedor | null> => {
    try {
      const response = await apiClient.get<{ fornecedor: Fornecedor }>(`/procurement/fornecedores/${id}`);
      return response.fornecedor;
    } catch (err: any) {
      toast.error('Erro ao carregar fornecedor');
      return null;
    }
  }, []);

  const createFornecedor = useCallback(async (data: Partial<Fornecedor>): Promise<Fornecedor | null> => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ fornecedor: Fornecedor }>('/procurement/fornecedores', data);
      toast.success('Fornecedor criado com sucesso!');
      setFornecedores(prev => [response.fornecedor, ...prev]);
      return response.fornecedor;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar fornecedor');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFornecedor = useCallback(async (id: string, data: Partial<Fornecedor>): Promise<Fornecedor | null> => {
    try {
      const response = await apiClient.put<{ fornecedor: Fornecedor }>(`/procurement/fornecedores/${id}`, data);
      toast.success('Fornecedor atualizado com sucesso!');
      setFornecedores(prev => prev.map(f => f.id === id ? response.fornecedor : f));
      return response.fornecedor;
    } catch (err: any) {
      toast.error('Erro ao atualizar fornecedor');
      return null;
    }
  }, []);

  const deleteFornecedor = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/procurement/fornecedores/${id}`);
      toast.success('Fornecedor excluído com sucesso!');
      setFornecedores(prev => prev.filter(f => f.id !== id));
      return true;
    } catch (err: any) {
      toast.error('Erro ao excluir fornecedor');
      return false;
    }
  }, []);

  const ativarFornecedor = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ fornecedor: Fornecedor }>(`/procurement/fornecedores/${id}/ativar`);
      toast.success('Fornecedor ativado');
      setFornecedores(prev => prev.map(f => f.id === id ? response.fornecedor : f));
      return true;
    } catch (err: any) {
      toast.error('Erro ao ativar fornecedor');
      return false;
    }
  }, []);

  const desativarFornecedor = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ fornecedor: Fornecedor }>(`/procurement/fornecedores/${id}/desativar`);
      toast.success('Fornecedor desativado');
      setFornecedores(prev => prev.map(f => f.id === id ? response.fornecedor : f));
      return true;
    } catch (err: any) {
      toast.error('Erro ao desativar fornecedor');
      return false;
    }
  }, []);

  const bloquearFornecedor = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ fornecedor: Fornecedor }>(
        `/procurement/fornecedores/${id}/bloquear`,
        { motivo }
      );
      toast.success('Fornecedor bloqueado');
      setFornecedores(prev => prev.map(f => f.id === id ? response.fornecedor : f));
      return true;
    } catch (err: any) {
      toast.error('Erro ao bloquear fornecedor');
      return false;
    }
  }, []);

  const enviarCredenciais = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.post(`/procurement/fornecedores/${id}/enviar-credenciais`);
      toast.success('Credenciais enviadas com sucesso!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao enviar credenciais');
      return false;
    }
  }, []);

  return {
    fornecedores,
    loading,
    error,
    fetchFornecedores,
    fetchFornecedorById,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    ativarFornecedor,
    desativarFornecedor,
    bloquearFornecedor,
    enviarCredenciais,
  };
}