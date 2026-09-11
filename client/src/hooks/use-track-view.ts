import { useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

/**
 * Regista uma visualizacao de um registo (auditoria "quem abriu/visualizou X").
 * Falhas sao silenciosas - nunca deve bloquear a UI por causa de um erro de auditoria.
 */
export function trackView(module: string | undefined | null, resourceId: string | undefined | null) {
  if (!module || !resourceId) return;

  fetch(`${API_BASE_URL}/audit/view`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ module, resourceId }),
  }).catch(() => {
    // auditoria de visualizacao nao deve interromper a experiencia do utilizador
  });
}

/**
 * Versao em hook: regista a visualizacao assim que o componente de detalhe monta
 * (ou quando module/resourceId mudam). Use trackView() directamente para dialogs
 * controlados (onOpenChange) onde montagem != abertura.
 */
export function useTrackView(module: string | undefined | null, resourceId: string | undefined | null) {
  useEffect(() => {
    trackView(module, resourceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, resourceId]);
}
