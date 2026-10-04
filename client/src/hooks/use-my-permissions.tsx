/**
 * Permissoes RBAC efectivas do utilizador autenticado (GET /auth/me/permissions),
 * tal como o Administrador do Sistema as definiu em "Roles e Permissoes".
 *
 * Servem so para mostrar/esconder menus e botoes - o servidor valida sempre
 * cada accao. Partilhadas entre componentes (uma unica chamada por
 * utilizador), e recarregadas quando o utilizador muda.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { API_BASE_URL, getAuthHeaders } from "@/services/api";
import { useAuth } from "../components/auth/auth-context";

export interface PermissaoModulo {
  module: string;
  actions: string[];
}

interface Estado {
  userId: string | null;
  permissoes: PermissaoModulo[] | null; // null = ainda a carregar
}

let estado: Estado = { userId: null, permissoes: null };
let pedidoEmCurso: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitir(proximo: Estado) {
  estado = proximo;
  listeners.forEach((l) => l());
}

function subscrever(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function carregar(userId: string) {
  if (pedidoEmCurso && estado.userId === userId) return pedidoEmCurso;
  emitir({ userId, permissoes: null });
  pedidoEmCurso = fetch(`${API_BASE_URL}/auth/me/permissions`, { headers: getAuthHeaders(false) })
    .then((res) => (res.ok ? res.json() : { permissions: [] }))
    .then((body) => {
      if (estado.userId === userId) emitir({ userId, permissoes: Array.isArray(body.permissions) ? body.permissions : [] });
    })
    .catch(() => {
      if (estado.userId === userId) emitir({ userId, permissoes: [] });
    })
    .finally(() => { pedidoEmCurso = null; });
  return pedidoEmCurso;
}

/** Volta a pedir as permissoes (ex: depois de o admin alterar o role). */
export function recarregarPermissoes() {
  if (estado.userId) {
    pedidoEmCurso = null;
    carregar(estado.userId);
  }
}

export function temPermissaoEm(permissoes: PermissaoModulo[] | null | undefined, module: string, actions: string | string[]) {
  if (!permissoes) return false;
  const lista = Array.isArray(actions) ? actions : [actions];
  const mod = permissoes.find((p) => p.module === module);
  return !!mod && lista.some((a) => mod.actions.includes(a));
}

export function useMyPermissions() {
  const { user } = useAuth();
  const atual = useSyncExternalStore(subscrever, () => estado, () => estado);

  useEffect(() => {
    if (!user?.id) {
      if (estado.userId !== null) emitir({ userId: null, permissoes: null });
      return;
    }
    if (estado.userId !== user.id || (estado.permissoes === null && !pedidoEmCurso)) {
      carregar(user.id);
    }
  }, [user?.id]);

  const permissoes = atual.userId === user?.id ? atual.permissoes : null;
  const pode = useCallback(
    (module: string, actions: string | string[]) => temPermissaoEm(permissoes, module, actions),
    [permissoes],
  );

  return { permissoes, carregado: permissoes !== null, pode };
}
