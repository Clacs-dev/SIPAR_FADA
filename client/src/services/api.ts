import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
   * Tratamento centralizado de respostas e erros globais (como 401)
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
 console.warn(' [API] Token inválido ou expirado (401)');
      
      // Limpar sessão local
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('fornecedor_auth');
      
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      
      // Recarregar a página para forçar logout após breve atraso
      setTimeout(() => {
        window.location.hash = '/login';
        window.location.reload();
      }, 1500);
      
      throw new Error('Sessão Expirada');
    }

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
      headers: this.getHeaders()
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
      body: data ? JSON.stringify(data) : undefined
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
      body: data ? JSON.stringify(data) : undefined
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
export default api;

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
    if (isApiRequest && response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('fornecedor_auth');
      toast.error('Sessao expirada. Por favor, faca login novamente.');
      setTimeout(() => window.location.reload(), 1000);
    }

    return response;
  };
}
