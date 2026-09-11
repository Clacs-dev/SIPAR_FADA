import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export interface MeetingRoom {
  id: string;
  nome: string;
  capacidade: number;
  localizacao: string | null;
  recursos: string[];
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomConflict {
  id: string;
  titulo: string;
  hora_inicio: string;
  hora_fim: string;
}

export function useMeetingRooms(includeInactive = false) {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/meeting-rooms${includeInactive ? '?all=true' : ''}`,
        { headers: getAuthHeaders(false) }
      );
      if (!response.ok) throw new Error('Erro ao carregar salas de reunião');
      const data = await response.json();
      setRooms(data.salas || []);
    } catch (error) {
      console.error('Erro ao carregar salas de reunião:', error);
      toast.error('Erro ao carregar salas de reunião');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const createRoom = async (payload: Partial<MeetingRoom>) => {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao criar sala');
    }
    await loadRooms();
    return (await response.json()).sala as MeetingRoom;
  };

  const updateRoom = async (id: string, payload: Partial<MeetingRoom>) => {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao actualizar sala');
    }
    await loadRooms();
    return (await response.json()).sala as MeetingRoom;
  };

  const deleteRoom = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao eliminar sala');
    }
    await loadRooms();
  };

  return { rooms, loading, loadRooms, createRoom, updateRoom, deleteRoom };
}

export async function checkRoomAvailability(params: {
  roomId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  excludeMeetingId?: string;
}): Promise<{ disponivel: boolean; conflitos: RoomConflict[] }> {
  const query = new URLSearchParams({
    roomId: params.roomId,
    data: params.data,
    horaInicio: params.horaInicio,
    horaFim: params.horaFim,
    ...(params.excludeMeetingId ? { excludeMeetingId: params.excludeMeetingId } : {}),
  });

  const response = await fetch(`${API_BASE_URL}/meeting-rooms/disponibilidade?${query.toString()}`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) {
    throw new Error('Erro ao verificar disponibilidade da sala');
  }
  return response.json();
}
