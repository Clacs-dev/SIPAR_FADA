import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import type { Acta } from '../types/acta';

const API_URL = `${API_BASE_URL}`;

export function useActas() {
  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Não autenticado');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/actas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar actas');
      }

      const data = await response.json();
 console.log(' Actas carregadas:', data.actas.length);
      setActas(data.actas || []);
    } catch (err) {
 console.error(' Erro ao carregar actas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActas();
  }, [fetchActas]);

  const createActa = async (actaData: Partial<Acta>): Promise<Acta | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/actas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar acta');
      }

      const data = await response.json();
 console.log(' Acta criada:', data.acta.numero);
      
      // Atualizar lista
      await fetchActas();
      
      return data.acta;
    } catch (err) {
 console.error(' Erro ao criar acta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar acta');
      return null;
    }
  };

  const updateActa = async (id: string, actaData: Partial<Acta>): Promise<Acta | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/actas/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar acta');
      }

      const data = await response.json();
 console.log(' Acta atualizada:', data.acta.numero);
      
      // Atualizar lista
      await fetchActas();
      
      return data.acta;
    } catch (err) {
 console.error(' Erro ao atualizar acta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar acta');
      return null;
    }
  };

  const deleteActa = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/actas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar acta');
      }

 console.log(' Acta deletada');
      
      // Atualizar lista
      await fetchActas();
      
      return true;
    } catch (err) {
 console.error(' Erro ao deletar acta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar acta');
      return false;
    }
  };

  const enviarRevisao = async (id: string): Promise<Acta | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/actas/${id}/enviar-revisao`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar para revisão');
      }

      const data = await response.json();
 console.log(' Acta enviada para revisão');
      
      // Atualizar lista
      await fetchActas();
      
      return data.acta;
    } catch (err) {
 console.error(' Erro ao enviar para revisão:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar para revisão');
      return null;
    }
  };

  const aprovarActa = async (id: string, comentario?: string): Promise<Acta | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/actas/${id}/aprovar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comentario }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aprovar acta');
      }

      const data = await response.json();
 console.log(' Acta aprovada');
      
      // Atualizar lista
      await fetchActas();
      
      return data.acta;
    } catch (err) {
 console.error(' Erro ao aprovar acta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao aprovar acta');
      return null;
    }
  };

  const rejeitarActa = async (id: string, motivo: string): Promise<Acta | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/actas/${id}/rejeitar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao rejeitar acta');
      }

      const data = await response.json();
 console.log(' Acta rejeitada');
      
      // Atualizar lista
      await fetchActas();
      
      return data.acta;
    } catch (err) {
 console.error(' Erro ao rejeitar acta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar acta');
      return null;
    }
  };

  const arquivarActa = async (id: string): Promise<Acta | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/actas/${id}/arquivar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao arquivar acta');
      }

      const data = await response.json();
 console.log(' Acta arquivada');
      
      // Atualizar lista
      await fetchActas();
      
      return data.acta;
    } catch (err) {
 console.error(' Erro ao arquivar acta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao arquivar acta');
      return null;
    }
  };

  return {
    actas,
    loading,
    error,
    fetchActas,
    createActa,
    updateActa,
    deleteActa,
    enviarRevisao,
    aprovarActa,
    rejeitarActa,
    arquivarActa,
  };
}
