import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export interface TrashItem {
  module: string;
  moduleDisplayName: string;
  id: string;
  label: string;
  deletedAt: string;
  deletedById: string | null;
  deletedByName: string | null;
}

export function useTrash() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/trash`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar a lixeira');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error: any) {
      console.error('Erro ao carregar a lixeira:', error);
      setItems([]);
      setError(error?.message || 'Erro ao carregar a lixeira');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (module: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/trash/${module}/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao restaurar registo');
    }
    await load();
  };

  const permanentlyDelete = async (module: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/trash/${module}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao eliminar definitivamente');
    }
    await load();
  };

  return { items, loading, error, reload: load, restore, permanentlyDelete };
}
