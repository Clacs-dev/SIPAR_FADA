import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export interface Area {
  id: string;
  nome: string;
  slug: string;
  departamento_id: string;
  departamento_nome?: string;
  descricao: string | null;
  activo: boolean;
  total_utilizadores?: number;
  created_at: string;
  updated_at: string;
}

export function useAreas(departmentId?: string, includeInactive = false) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAreas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (includeInactive) params.set('all', 'true');
      if (departmentId) params.set('departmentId', departmentId);
      const response = await fetch(
        `${API_BASE_URL}/areas${params.toString() ? `?${params.toString()}` : ''}`,
        { headers: getAuthHeaders(false) }
      );
      if (!response.ok) throw new Error('Erro ao carregar áreas');
      const data = await response.json();
      setAreas(data.areas || []);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      setAreas([]);
      toast.error('Erro ao carregar áreas');
    } finally {
      setLoading(false);
    }
  }, [departmentId, includeInactive]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const createArea = async (payload: { nome: string; departmentId: string; descricao?: string | null; activo?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao criar área');
    }
    await loadAreas();
    return (await response.json()).area as Area;
  };

  const updateArea = async (id: string, payload: Partial<{ nome: string; departmentId: string; descricao: string | null; activo: boolean }>) => {
    const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao actualizar área');
    }
    await loadAreas();
    return (await response.json()).area as Area;
  };

  const deleteArea = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao eliminar área');
    }
    await loadAreas();
  };

  return { areas, loading, loadAreas, createArea, updateArea, deleteArea };
}
