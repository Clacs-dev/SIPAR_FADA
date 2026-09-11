import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api-client';

export interface CategoriaProcurement {
  id: string;
  nome: string;
}

/**
 * Categorias de produtos/servicos do Procurement, geridas na base de dados
 * (usadas tanto no cadastro de fornecedores como nos pedidos de compra).
 */
export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaProcurement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ categorias: CategoriaProcurement[] }>('/procurement/categorias');
      setCategorias(response.categorias || []);
    } catch (error) {
 console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategoria = useCallback(async (nome: string) => {
    const response = await apiClient.post<{ categoria: CategoriaProcurement }>('/procurement/categorias', { nome });
    setCategorias((prev) => {
      if (prev.some((c) => c.nome === response.categoria.nome)) return prev;
      return [...prev, response.categoria].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    return response.categoria;
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  return { categorias, loading, fetchCategorias, createCategoria };
}
