import { toast } from 'sonner';

// Endereco do servidor central. Por omissao, vem compilado no build
// (VITE_API_URL) - mas pode ser substituido em runtime, persistido em
// localStorage, a partir do icone de configuracao no ecra de login. Isto
// existe precisamente porque o endereco de build nem sempre bate com o
// servidor real de uma instalacao especifica, e antes de fazer login nao
// ha nenhum outro sitio (ex.: admin_sistema) onde o corrigir.
const API_BASE_URL_STORAGE_KEY = 'sipar_api_base_url_override';
export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Na versao web (Vercel) o endereco vem sempre do VITE_API_URL do build: o
// icone de configuracao fica escondido e qualquer endereco guardado antes no
// browser e ignorado (e apagado). Para voltar a permitir a alteracao manual
// (ex: versao desktop/instalacao local), definir VITE_PERMITIR_ENDERECO_SERVIDOR=true.
export const PERMITIR_ENDERECO_SERVIDOR = import.meta.env.VITE_PERMITIR_ENDERECO_SERVIDOR === 'true';

if (!PERMITIR_ENDERECO_SERVIDOR) {
  try {
    localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
  } catch {
    // localStorage indisponivel (ex: modo privado) - nada a limpar
  }
}

function readStoredApiBaseUrl(): string | null {
  if (!PERMITIR_ENDERECO_SERVIDOR) return null;
  try {
    const stored = localStorage.getItem(API_BASE_URL_STORAGE_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  } catch {
    return null;
  }
}

export let API_BASE_URL = readStoredApiBaseUrl() || DEFAULT_API_BASE_URL;

/** Devolve o valor guardado manualmente, ou null se a app estiver a usar o endereco de build. */
export function getApiBaseUrlOverride(): string | null {
  return readStoredApiBaseUrl();
}

/** Define um endereco de servidor novo, persiste-o, e atualiza o valor em memoria usado pelo resto da app. */
export function setApiBaseUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, '');
  localStorage.setItem(API_BASE_URL_STORAGE_KEY, trimmed);
  API_BASE_URL = trimmed;
}

/** Remove o endereco guardado manualmente, voltando ao valor de build (VITE_API_URL). */
export function resetApiBaseUrl(): void {
  localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
  API_BASE_URL = DEFAULT_API_BASE_URL;
}

export function getStoredAuthHeader(): string | null {
  const userToken = localStorage.getItem('access_token');
  if (userToken) return `Bearer ${userToken}`;

  const fornecedorAuth = localStorage.getItem('fornecedor_auth');
  if (fornecedorAuth) {
    try {
      const authData = JSON.parse(fornecedorAuth);
      if (authData.token) return `Fornecedor ${authData.token}`;
    } catch {}
  }

  return null;
}

export function getAuthHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  const authHeader = getStoredAuthHeader();
  if (authHeader) headers.Authorization = authHeader;
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
}

export function apiUrl(path = ''): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Tempo maximo de espera por um pedido antes de desistir e mostrar erro.
// Sem isto, um servidor inalcancavel de forma "silenciosa" (rede que deixa
// cair os pacotes, em vez de recusar a ligacao de imediato) faz o fetch()
// ficar pendurado indefinidamente - nem sucesso, nem erro, nunca - e o
// utilizador ve o botao em "Entrando..." para sempre, sem nenhuma mensagem.
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Converte um erro de rede/fetch (ex.: "Failed to fetch", quando o
 * servidor esta offline ou nao ha internet; ou um timeout de pedido) numa
 * mensagem legivel em portugues. Mensagens que ja vieram do backend (com
 * texto proprio) sao devolvidas sem alteracao.
 */
export function getFriendlyErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (!(error instanceof Error)) return fallback;

  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return 'O servidor não respondeu a tempo. Verifique se o servidor está disponível e tente novamente.';
  }

  const raw = error.message || '';
  const looksLikeNetworkError = /failed to fetch|networkerror|load failed|network request failed/i.test(raw);

  if (looksLikeNetworkError) {
    return 'Não foi possível ligar ao servidor. Verifique a sua ligação à internet e tente novamente.';
  }

  return raw || fallback;
}

/**
 * Cliente de API Centralizador para o SIPAR20
 */
export class ApiClient {
  private baseUrl: string = API_BASE_URL;

  /**
   * Obtém o token JWT guardado no localStorage
   */
  private getToken(): { token: string; type: 'Bearer' | 'Fornecedor' } | null {
    // 1. Tentar token de usuário normal
    const userToken = localStorage.getItem('access_token');
    if (userToken) {
      return { token: userToken, type: 'Bearer' };
    }

    // 2. Tentar autenticação de fornecedor
    const fornecedorAuth = localStorage.getItem('fornecedor_auth');
    if (fornecedorAuth) {
      try {
        const authData = JSON.parse(fornecedorAuth);
        if (authData.token) {
          return { token: authData.token, type: 'Fornecedor' };
        }
      } catch (e) {
 console.error('Erro ao ler fornecedor_auth:', e);
      }
    }

    return null;
  }

  /**
   * Prepara os headers com token JWT injetado automaticamente
   */
  private getHeaders(includeContentType = true): HeadersInit {
    const tokenInfo = this.getToken();
    const headers: Record<string, string> = {};

    if (tokenInfo) {
      headers['Authorization'] = `${tokenInfo.type} ${tokenInfo.token}`;
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Tratamento centralizado de respostas e erros globais.
   * O 401 de sessao expirada e tratado de forma centralizada pelo
   * interceptor global (installApiFetchInterceptor), que exclui os
   * endpoints publicos de autenticacao (login/registo/reset). Aqui so
   * propagamos a mensagem real devolvida pelo backend, para qualquer
   * status de erro, incluindo 401.
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Erro na comunicação com o servidor';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * GET
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null) acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      if (query) url += `?${query}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * UPLOAD DE ARQUIVOS (Multer)
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const tokenInfo = this.getToken();
    const headers: Record<string, string> = {};

    if (tokenInfo) {
      headers['Authorization'] = `${tokenInfo.type} ${tokenInfo.token}`;
    }

    // Uploads podem legitimamente demorar mais que um pedido normal
    // (ficheiros maiores) - janela mais larga que REQUEST_TIMEOUT_MS.
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS * 4),
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
export default api;

// Endpoints publicos de autenticacao: um 401 aqui significa credenciais
// invalidas/conta inativa/etc, nunca uma sessao expirada - nao deve
// disparar o fluxo de "sessao expirada" (limpar sessao + recarregar a
// pagina), que so faz sentido para pedidos feitos com um token existente.
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/refresh'];

function isPublicAuthRequest(url: string) {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

// Troca silenciosa do access_token expirado por um novo, usando o refresh_token
// guardado no login. Deduplica pedidos concorrentes (varios 401 em simultaneo
// so disparam UM pedido de refresh).
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshAccessToken(originalFetch: typeof fetch): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await originalFetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return false;
        const data = await response.json();
        if (!data?.session?.access_token) return false;
        localStorage.setItem('access_token', data.session.access_token);
        if (data.session.refresh_token) {
          localStorage.setItem('refresh_token', data.session.refresh_token);
        }
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export function installApiFetchInterceptor() {
  if (typeof window === 'undefined') return;
  const marker = '__sipar20_api_fetch_interceptor__';
  if ((window as any)[marker]) return;

  const originalFetch = window.fetch.bind(window);
  (window as any)[marker] = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isApiRequest = url.startsWith(API_BASE_URL);
    const nextInit: RequestInit = { ...(init || {}) };

    if (isApiRequest) {
      const headers = new Headers(nextInit.headers || {});
      if (!headers.has('Authorization')) {
        const authHeader = getStoredAuthHeader();
        if (authHeader) headers.set('Authorization', authHeader);
      }

      nextInit.headers = headers;
    }

    const response = await originalFetch(url, nextInit);
    if (isApiRequest && response.status === 401 && !isPublicAuthRequest(url)) {
      const refreshed = await tryRefreshAccessToken(originalFetch);
      if (refreshed) {
        const retryHeaders = new Headers(nextInit.headers || {});
        const authHeader = getStoredAuthHeader();
        if (authHeader) retryHeaders.set('Authorization', authHeader);
        return originalFetch(url, { ...nextInit, headers: retryHeaders });
      }

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('fornecedor_auth');
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      setTimeout(() => window.location.reload(), 1000);
    }

    return response;
  };
}
