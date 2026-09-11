import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export interface Role {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  sistema: boolean;
  total_utilizadores?: number;
  created_at: string;
  updated_at: string;
}

export interface RolePermissionRow {
  module: string;
  action: string;
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar roles');
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
 console.error('Erro ao carregar roles:', error);
      toast.error('Erro ao carregar roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const createRole = async (payload: { nome: string; descricao?: string }) => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao criar role');
    }
    await loadRoles();
    return (await response.json()).role as Role;
  };

  const updateRole = async (id: string, payload: { nome?: string; descricao?: string }) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao actualizar role');
    }
    await loadRoles();
    return (await response.json()).role as Role;
  };

  const deleteRole = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao eliminar role');
    }
    await loadRoles();
  };

  const getRolePermissions = async (id: string): Promise<RolePermissionRow[]> => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}/permissions`, { headers: getAuthHeaders(false) });
    if (!response.ok) throw new Error('Erro ao carregar permissões do role');
    const data = await response.json();
    return data.permissoes || [];
  };

  const saveRolePermissions = async (id: string, permissoes: RolePermissionRow[]) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissoes }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao guardar permissões');
    }
    await loadRoles();
    return (await response.json()).permissoes as RolePermissionRow[];
  };

  return { roles, loading, loadRoles, createRole, updateRole, deleteRole, getRolePermissions, saveRolePermissions };
}
