# 🔌 GUIA DE INTEGRAÇÃO FRONTEND-BACKEND

**Objetivo**: Conectar os componentes frontend existentes às APIs backend implementadas  
**Tempo Estimado**: 2-3 dias  
**Dificuldade**: ⭐⭐ Média

---

## 📋 **CHECKLIST DE INTEGRAÇÃO**

### **FASE 1: Setup Inicial**
- [ ] Criar API client helper
- [ ] Configurar variáveis de ambiente
- [ ] Adicionar loading states
- [ ] Adicionar error handling

### **FASE 2: Módulos**
- [ ] Integrar Ofícios
- [ ] Integrar Facturas
- [ ] Integrar Frotas
- [ ] Integrar Actas

### **FASE 3: Testes**
- [ ] Testar CRUD completo
- [ ] Testar aprovações/rejeições
- [ ] Testar permissões
- [ ] Testar logs de auditoria

---

## 1️⃣ **CRIAR API CLIENT**

### **Arquivo**: `/utils/api-client.tsx`

```typescript
import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8b82752b`;

export class ApiClient {
  private getToken(): string | null {
    // Obter token do contexto de autenticação
    // Implementar conforme seu AuthContext
    const token = localStorage.getItem('supabase_token'); // Exemplo simplificado
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('Não autenticado');
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error: any) {
 console.error('API Error:', error);
      throw error;
    }
  }

  // =================== MÉTODOS GENÉRICOS ===================

  async get<T>(endpoint: string): Promise<{ success: boolean; data?: T }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<{ success: boolean; data?: T }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<{ success: boolean; data?: T }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<{ success: boolean; data?: T }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // =================== OFÍCIOS ===================

  async getOficios() {
    return this.get('/oficios');
  }

  async getOficio(id: string) {
    return this.get(`/oficios/${id}`);
  }

  async createOficio(data: any) {
    return this.post('/oficios', data);
  }

  async updateOficio(id: string, data: any) {
    return this.put(`/oficios/${id}`, data);
  }

  async deleteOficio(id: string) {
    return this.delete(`/oficios/${id}`);
  }

  async submitOficio(id: string) {
    return this.post(`/oficios/${id}/submit`, {});
  }

  async approveOficio(id: string, data?: any) {
    return this.post(`/oficios/${id}/approve`, data || {});
  }

  async rejectOficio(id: string, reason: string) {
    return this.post(`/oficios/${id}/reject`, { reason });
  }

  async addDespacho(oficioId: string, descricao: string) {
    return this.post(`/oficios/${oficioId}/despachos`, { descricao });
  }

  // =================== FACTURAS ===================

  async getFacturas() {
    return this.get('/facturas');
  }

  async getFactura(id: string) {
    return this.get(`/facturas/${id}`);
  }

  async createFactura(data: any) {
    return this.post('/facturas', data);
  }

  async updateFactura(id: string, data: any) {
    return this.put(`/facturas/${id}`, data);
  }

  async deleteFactura(id: string) {
    return this.delete(`/facturas/${id}`);
  }

  async submitFactura(id: string) {
    return this.post(`/facturas/${id}/submit`, {});
  }

  async approveFactura(id: string, data?: any) {
    return this.post(`/facturas/${id}/approve`, data || {});
  }

  async rejectFactura(id: string, reason: string) {
    return this.post(`/facturas/${id}/reject`, { reason });
  }

  async payFactura(id: string, paymentData: any) {
    return this.post(`/facturas/${id}/pay`, paymentData);
  }

  async getFornecedores() {
    return this.get('/facturas/fornecedores/list');
  }

  async createFornecedor(data: any) {
    return this.post('/facturas/fornecedores', data);
  }

  // =================== FROTAS ===================

  async getViaturas() {
    return this.get('/frotas');
  }

  async getViatura(id: string) {
    return this.get(`/frotas/${id}`);
  }

  async createViatura(data: any) {
    return this.post('/frotas', data);
  }

  async updateViatura(id: string, data: any) {
    return this.put(`/frotas/${id}`, data);
  }

  async deleteViatura(id: string) {
    return this.delete(`/frotas/${id}`);
  }

  async submitViatura(id: string) {
    return this.post(`/frotas/${id}/submit`, {});
  }

  async approveViatura(id: string, data?: any) {
    return this.post(`/frotas/${id}/approve`, data || {});
  }

  async rejectViatura(id: string, reason: string) {
    return this.post(`/frotas/${id}/reject`, { reason });
  }

  async createUtilizacao(viaturaId: string, data: any) {
    return this.post(`/frotas/${viaturaId}/utilizacoes`, data);
  }

  async finalizarUtilizacao(utilizacaoId: string, data: any) {
    return this.put(`/frotas/utilizacoes/${utilizacaoId}/finalizar`, data);
  }

  async createManutencao(viaturaId: string, data: any) {
    return this.post(`/frotas/${viaturaId}/manutencoes`, data);
  }

  // =================== ACTAS ===================

  async getActas() {
    return this.get('/actas');
  }

  async getActa(id: string) {
    return this.get(`/actas/${id}`);
  }

  async createActa(data: any) {
    return this.post('/actas', data);
  }

  async updateActa(id: string, data: any) {
    return this.put(`/actas/${id}`, data);
  }

  async deleteActa(id: string) {
    return this.delete(`/actas/${id}`);
  }

  async submitActa(id: string) {
    return this.post(`/actas/${id}/submit`, {});
  }

  async approveActa(id: string, data?: any) {
    return this.post(`/actas/${id}/approve`, data || {});
  }

  async rejectActa(id: string, reason: string) {
    return this.post(`/actas/${id}/reject`, { reason });
  }

  async addParticipante(actaId: string, data: any) {
    return this.post(`/actas/${actaId}/participantes`, data);
  }

  async marcarPresenca(actaId: string, participanteId: string, presente: boolean) {
    return this.put(`/actas/${actaId}/participantes/${participanteId}/presenca`, { presente });
  }

  async addPontoAgenda(actaId: string, data: any) {
    return this.post(`/actas/${actaId}/pontos-agenda`, data);
  }

  async addDecisao(actaId: string, data: any) {
    return this.post(`/actas/${actaId}/decisoes`, data);
  }

  async addVotacao(actaId: string, data: any) {
    return this.post(`/actas/${actaId}/votacoes`, data);
  }
}

// Exportar instância singleton
export const apiClient = new ApiClient();
```

---

## 2️⃣ **ATUALIZAR COMPONENTES - EXEMPLO: OFÍCIOS**

### **Arquivo**: `/components/oficios/oficios-main.tsx`

```typescript
import { useState, useEffect } from "react";
import { apiClient } from "../../utils/api-client";
import { toast } from "sonner";
import { Oficio, OficioFilters, OficioStats } from "./types";
import { useAuth } from "../auth/auth-context";

export function OficiosMain() {
  const { user } = useAuth();
  
  // Estados
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedOficio, setSelectedOficio] = useState<Oficio | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<OficioFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para dados backend
  const [oficios, setOficios] = useState<Oficio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar ofícios ao montar componente
  useEffect(() => {
    loadOficios();
  }, []);

  async function loadOficios() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getOficios();
      
      if (response.success && response.data) {
        setOficios(response.data as Oficio[]);
      } else {
        throw new Error(response.error || 'Erro ao carregar ofícios');
      }
    } catch (err: any) {
 console.error('Erro ao carregar ofícios:', err);
      setError(err.message);
      toast.error('Erro ao carregar ofícios');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOficio(data: Partial<Oficio>) {
    try {
      const response = await apiClient.createOficio(data);
      
      if (response.success && response.data) {
        toast.success('Ofício criado com sucesso');
        setOficios([response.data as Oficio, ...oficios]);
        setView('list');
      } else {
        throw new Error(response.error || 'Erro ao criar ofício');
      }
    } catch (err: any) {
 console.error('Erro ao criar ofício:', err);
      toast.error(err.message || 'Erro ao criar ofício');
    }
  }

  async function handleUpdateOficio(id: string, data: Partial<Oficio>) {
    try {
      const response = await apiClient.updateOficio(id, data);
      
      if (response.success && response.data) {
        toast.success('Ofício atualizado com sucesso');
        setOficios(oficios.map(o => o.id === id ? response.data as Oficio : o));
        setView('list');
      } else {
        throw new Error(response.error || 'Erro ao atualizar ofício');
      }
    } catch (err: any) {
 console.error('Erro ao atualizar ofício:', err);
      toast.error(err.message || 'Erro ao atualizar ofício');
    }
  }

  async function handleDeleteOficio(id: string) {
    if (!confirm('Tem certeza que deseja eliminar este ofício?')) {
      return;
    }

    try {
      const response = await apiClient.deleteOficio(id);
      
      if (response.success) {
        toast.success('Ofício eliminado com sucesso');
        setOficios(oficios.filter(o => o.id !== id));
      } else {
        throw new Error(response.error || 'Erro ao eliminar ofício');
      }
    } catch (err: any) {
 console.error('Erro ao eliminar ofício:', err);
      toast.error(err.message || 'Erro ao eliminar ofício');
    }
  }

  async function handleApproveOficio(id: string) {
    try {
      const response = await apiClient.approveOficio(id);
      
      if (response.success && response.data) {
        toast.success('Ofício aprovado com sucesso');
        setOficios(oficios.map(o => o.id === id ? response.data as Oficio : o));
      } else {
        throw new Error(response.error || 'Erro ao aprovar ofício');
      }
    } catch (err: any) {
 console.error('Erro ao aprovar ofício:', err);
      toast.error(err.message || 'Erro ao aprovar ofício');
    }
  }

  async function handleRejectOficio(id: string, reason: string) {
    try {
      const response = await apiClient.rejectOficio(id, reason);
      
      if (response.success && response.data) {
        toast.success('Ofício rejeitado');
        setOficios(oficios.map(o => o.id === id ? response.data as Oficio : o));
      } else {
        throw new Error(response.error || 'Erro ao rejeitar ofício');
      }
    } catch (err: any) {
 console.error('Erro ao rejeitar ofício:', err);
      toast.error(err.message || 'Erro ao rejeitar ofício');
    }
  }

  // Calcular estatísticas
  const stats: OficioStats = {
    total: oficios.length,
    pendentes: oficios.filter(o => o.status === 'pendente').length,
    em_analise: oficios.filter(o => o.status === 'em_analise').length,
    despachados: oficios.filter(o => o.status === 'aprovado').length,
    arquivados: oficios.filter(o => o.status === 'arquivado').length,
    atrasados: 0, // Calcular baseado em prazo_resposta
    entrada: oficios.filter(o => o.tipo === 'entrada').length,
    saida: oficios.filter(o => o.tipo === 'saida').length,
  };

  // Filtrar ofícios
  const filteredOficios = oficios.filter(oficio => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        oficio.numero?.toLowerCase().includes(searchLower) ||
        oficio.assunto?.toLowerCase().includes(searchLower) ||
        oficio.destinatario?.toLowerCase().includes(searchLower) ||
        oficio.remetente?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Renderizar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar ofícios...</p>
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadOficios}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  // Resto do componente...
  return (
    <div>
      {/* Renderizar conforme o estado atual */}
      {view === 'list' && (
        <OficiosList 
          oficios={filteredOficios}
          stats={stats}
          onView={(oficio) => {
            setSelectedOficio(oficio);
            setView('details');
          }}
          onEdit={(oficio) => {
            setSelectedOficio(oficio);
            setView('form');
          }}
          onDelete={handleDeleteOficio}
          onApprove={handleApproveOficio}
          onReject={handleRejectOficio}
        />
      )}
      
      {view === 'form' && (
        <OficioForm
          oficio={selectedOficio}
          onSubmit={(data) => {
            if (selectedOficio) {
              handleUpdateOficio(selectedOficio.id, data);
            } else {
              handleCreateOficio(data);
            }
          }}
          onCancel={() => {
            setSelectedOficio(null);
            setView('list');
          }}
        />
      )}
      
      {view === 'details' && selectedOficio && (
        <OficioDetails
          oficio={selectedOficio}
          onBack={() => {
            setSelectedOficio(null);
            setView('list');
          }}
          onEdit={() => setView('form')}
          onApprove={() => handleApproveOficio(selectedOficio.id)}
          onReject={(reason) => handleRejectOficio(selectedOficio.id, reason)}
        />
      )}
    </div>
  );
}
```

---

## 3️⃣ **PADRÕES COMUNS**

### **Loading State**
```typescript
const [loading, setLoading] = useState(true);

// Durante fetch
setLoading(true);
try {
  // ... fetch
} finally {
  setLoading(false);
}

// Renderizar
if (loading) return <LoadingSpinner />;
```

### **Error Handling**
```typescript
try {
  const response = await apiClient.someAction();
  if (!response.success) {
    throw new Error(response.error);
  }
  // Sucesso
  toast.success('Operação concluída');
} catch (error: any) {
 console.error('Error:', error);
  toast.error(error.message || 'Erro desconhecido');
}
```

### **Validação de Permissões (Frontend)**
```typescript
import { hasPermission } from "../auth/permissions";

function MyComponent() {
  const { user } = useAuth();
  
  const canApprove = user && hasPermission(user, 'oficios', 'approve');
  const canDelete = user && hasPermission(user, 'oficios', 'delete');
  
  return (
    <div>
      {canApprove && (
        <Button onClick={handleApprove}>Aprovar</Button>
      )}
      {canDelete && (
        <Button onClick={handleDelete}>Eliminar</Button>
      )}
    </div>
  );
}
```

### **Refresh Automático**
```typescript
useEffect(() => {
  loadData();
  
  // Refresh a cada 30 segundos
  const interval = setInterval(loadData, 30000);
  
  return () => clearInterval(interval);
}, []);
```

---

## 4️⃣ **TESTES RECOMENDADOS**

### **Teste 1: Criar Registo**
1. Fazer login com utilizador autorizado
2. Criar novo registo
3. Verificar se aparece na lista
4. Verificar log de auditoria

### **Teste 2: Editar Registo**
1. Selecionar registo existente (status != aprovado)
2. Editar campos
3. Salvar
4. Verificar alterações
5. Verificar log de auditoria

### **Teste 3: Aprovar Registo**
1. Fazer login com utilizador com permissão de aprovação
2. Selecionar registo pendente
3. Aprovar
4. Verificar status mudou para 'aprovado'
5. Tentar editar (deve falhar)
6. Verificar log de auditoria

### **Teste 4: Tentar Editar Aprovado**
1. Selecionar registo aprovado
2. Tentar editar
3. Verificar erro: "Registo aprovado não pode ser alterado"
4. Verificar log de auditoria da tentativa

### **Teste 5: Permissões**
1. Fazer login com utilizador sem permissões
2. Tentar acessar módulo
3. Verificar erro 403
4. Verificar log de auditoria da tentativa

---

## 5️⃣ **TROUBLESHOOTING**

### **Erro 401: Não autorizado**
- **Causa**: Token inválido ou ausente
- **Solução**: Verificar se token está sendo enviado corretamente no header

### **Erro 403: Sem permissão**
- **Causa**: Utilizador não tem permissão para a ação
- **Solução**: Verificar permissões do utilizador no sistema

### **Erro 400: Registo aprovado não pode ser alterado**
- **Causa**: Tentativa de editar/eliminar registo aprovado
- **Solução**: Normal, imutabilidade funcionando corretamente

### **Erro 404: Recurso não encontrado**
- **Causa**: ID inválido ou registo não existe
- **Solução**: Verificar se ID está correto

### **Erro 500: Erro interno do servidor**
- **Causa**: Erro no backend
- **Solução**: Verificar logs do servidor no Supabase

---

## 6️⃣ **PRÓXIMOS PASSOS**

1. **Implementar API Client** ✅
2. **Atualizar oficios-main.tsx** ⏳
3. **Atualizar facturas-main.tsx** ⏳
4. **Atualizar frotas-main.tsx** ⏳
5. **Atualizar actas-main.tsx** ⏳
6. **Testar todos os fluxos** ⏳
7. **Deploy em produção** ⏳

---

**Boa sorte com a integração!** 🚀

Se encontrar problemas, verifique:
1. Token está sendo enviado?
2. Permissões do utilizador estão corretas?
3. Logs do servidor no Supabase
4. Mensagens de erro no console do navegador
