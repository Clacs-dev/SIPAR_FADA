import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export interface AvailableMeetingPlatform {
  key: string;
  label: string;
  usable: boolean;
}

/**
 * Plataformas de reunião que de facto produzem um link ao agendar (API real
 * configurada, ou link fixo definido pelo admin em Configurações →
 * Integrações). Nunca inclui uma plataforma "por defeito" que não vá
 * funcionar - se nada estiver configurado, a lista vem vazia.
 */
export function useAvailableMeetingPlatforms() {
  const [platforms, setPlatforms] = useState<AvailableMeetingPlatform[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/meeting-integrations/available`, {
        headers: getAuthHeaders(false),
      });
      if (!response.ok) throw new Error('Erro ao carregar plataformas de reunião');
      const data = await response.json();
      setPlatforms((data.platforms || []).filter((p: AvailableMeetingPlatform) => p.usable));
    } catch (error) {
      console.error('Erro ao carregar plataformas de reunião disponíveis:', error);
      setPlatforms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { platforms, loading, reload: load };
}
