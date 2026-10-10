import { api } from '../services/api';

/**
 * Classe adaptadora ApiClient que preserva chamadas legadas
 * sobre o cliente de API do Express
 */
export class ApiClientAdapter {
  
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return api.get<T>(endpoint, params);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return api.post<T>(endpoint, data);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return api.put<T>(endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return api.delete<T>(endpoint);
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return api.upload<T>(endpoint, formData);
  }

  /**
   * Buscar todos os usuários (compatibilidade)
   */
  async getAllUsers(accessToken: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; users: any[] }>('/users/all');
    return res.users || [];
  }

  /**
   * Atualizar status de um usuário (compatibilidade)
   */
  async updateUserStatus(accessToken: string, userId: string, status: 'active' | 'pending' | 'inactive'): Promise<void> {
    await api.put(`/users/${userId}/status`, { status });
  }

  /**
   * Editar utilizador (nome, e-mail, nova senha, telefone, organização,
   * cargo, papel). Senha vazia = manter a actual.
   */
  async updateUser(accessToken: string, userId: string, userData: any): Promise<any> {
    return api.put(`/users/${userId}`, userData);
  }

  /**
   * Eliminar utilizador de vez (o histórico que criou mantém-se).
   */
  async deleteUser(accessToken: string, userId: string): Promise<any> {
    return api.delete(`/users/${userId}`);
  }

  /**
   * Criar novo usuário (compatibilidade)
   */
  async createUser(accessToken: string, userData: any): Promise<any> {
    return api.post('/users/create', userData);
  }

  /**
   * Limpar usuários de demonstração (compatibilidade)
   */
  async clearDemoUsers(accessToken: string): Promise<any> {
    return { success: true };
  }

  /**
   * Listar usuários órfãos (compatibilidade)
   */
  async getOrphanedUsers(accessToken: string): Promise<any> {
    return { users: [] };
  }

  /**
   * Deletar usuário órfão (compatibilidade)
   */
  async deleteOrphanedUser(accessToken: string, userId: string): Promise<any> {
    return { success: true };
  }
}

// Exportar instância singleton legada
export const apiClient = new ApiClientAdapter();
export default apiClient;