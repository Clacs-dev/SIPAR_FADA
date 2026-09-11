import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export interface Department {
  id: string;
  nome: string;
  slug: string;
  categoria: string | null;
  descricao: string | null;
  cor: string | null;
  activo: boolean;
  total_utilizadores?: number;
  created_at: string;
  updated_at: string;
}

export function useDepartments(includeInactive = false) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/departments${includeInactive ? '?all=true' : ''}`,
        { headers: getAuthHeaders(false) }
      );
      if (!response.ok) throw new Error('Erro ao carregar departamentos');
      const data = await response.json();
      setDepartments(data.departamentos || []);
    } catch (error) {
 console.error('Erro ao carregar departamentos:', error);
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const createDepartment = async (payload: Partial<Department>) => {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao criar departamento');
    }
    await loadDepartments();
    return (await response.json()).departamento as Department;
  };

  const updateDepartment = async (id: string, payload: Partial<Department>) => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao actualizar departamento');
    }
    await loadDepartments();
    return (await response.json()).departamento as Department;
  };

  const deleteDepartment = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao eliminar departamento');
    }
    await loadDepartments();
  };

  return { departments, loading, loadDepartments, createDepartment, updateDepartment, deleteDepartment };
}
