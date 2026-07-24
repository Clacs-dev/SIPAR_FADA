# Solução de Erros 401 - Guia Completo

## ✅ Correções Implementadas

### 1. **API Client Centralizado** (`/utils/api-client.tsx`)
Criamos um cliente de API que:
- Gerencia automaticamente tokens de autenticação
- Trata erros 401 de forma consistente
- Limpa sessão expirada automaticamente
- Exibe mensagens de erro amigáveis

```typescript
import { apiClient } from './utils/api-client';

// Exemplo de uso
const data = await apiClient.get('/presentations');
const result = await apiClient.post('/audiences', audienceData);
```

### 2. **Dashboard com Loading States**
O Dashboard agora:
- Verifica se o usuário está autenticado antes de carregar dados
- Exibe indicador de loading enquanto busca informações
- Mostra dados reais do backend (em vez de mock)
- Trata graciosamente quando não há dados

### 3. **Autenticação Melhorada**
O `auth-context.tsx` foi atualizado para:
- Não bloquear inicialização com chamadas síncronas
- Limpar sessão automaticamente em erros 401
- Validar sessão de forma mais robusta
- Garantir que localStorage está sempre sincronizado

### 4. **Error Boundary Global**
Adicionamos `ErrorBoundary` que:
- Captura erros de autenticação em toda aplicação
- Exibe mensagens específicas para erros 401
- Oferece botão para recarregar aplicação
- Limpa sessão automaticamente em erros de auth

## 🔍 Diagnóstico de Erros 401

### Causas Comuns:

1. **Usuário não autenticado**
   - Sintoma: Erro 401 ao acessar qualquer tela
   - Solução: Fazer login novamente

2. **Token expirado**
   - Sintoma: Estava logado, mas começou a receber 401
   - Solução: Sistema limpa automaticamente e pede novo login

3. **Token não enviado**
   - Sintoma: Componente faz requisição sem token
   - Solução: Usar `apiClient` ou verificar `accessToken` do contexto

4. **Sistema não inicializado**
   - Sintoma: 401 ao fazer login (usuários demo não existem)
   - Solução: O sistema inicializa automaticamente, mas pode levar alguns segundos

## 🛠️ Como Usar Corretamente

### ✅ CORRETO - Usar API Client

```typescript
import { apiClient } from '../utils/api-client';

const loadData = async () => {
  try {
    const response = await apiClient.get('/presentations');
    setPresentations(response.data);
  } catch (error) {
 console.error('Erro ao carregar:', error);
    toast.error('Erro ao carregar dados');
  }
};
```

### ✅ CORRETO - Verificar Autenticação

```typescript
import { useAuth } from '../auth/auth-context';

function MyComponent() {
  const { user, accessToken } = useAuth();
  
  useEffect(() => {
    if (user && accessToken) {
      loadData();
    }
  }, [user, accessToken]);
  
  if (!user) {
    return <p>Faça login para ver este conteúdo</p>;
  }
  
  // Render normal...
}
```

### ❌ INCORRETO - Usar publicAnonKey

```typescript
// NÃO FAÇA ISSO!
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${publicAnonKey}` // ❌ Errado!
  }
});
```

### ❌ INCORRETO - Não verificar autenticação

```typescript
// NÃO FAÇA ISSO!
useEffect(() => {
  loadData(); // ❌ Pode executar sem usuário logado!
}, []);
```

## 🔧 Checklist de Depuração

Ao encontrar erro 401, verifique:

- [ ] Usuário está logado? (`user` no contexto não é null)
- [ ] Token existe? (`localStorage.getItem('access_token')`)
- [ ] Token é válido? (não expirou)
- [ ] Requisição está enviando token? (verificar Network tab)
- [ ] Endpoint está correto? (URL do Supabase)
- [ ] Sistema foi inicializado? (usuários demo criados)

## 📋 Fluxo de Autenticação

```
1. Usuário acessa aplicação
   ↓
2. AuthContext verifica sessão no Supabase
   ↓
3. Se sessão existe, valida token no backend
   ↓
4. Se válido: carrega perfil do usuário
   Se inválido: limpa sessão e mostra login
   ↓
5. Usuário faz login
   ↓
6. Token é salvo em localStorage e contexto
   ↓
7. Componentes usam token para requisições
   ↓
8. Se token expira: 401 → limpa sessão → volta ao login
```

## 🚨 Tratamento de Erros

### Erro 401 em Componente

O `apiClient` trata automaticamente:
```typescript
// Internamente, quando recebe 401:
if (response.status === 401) {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  toast.error('Sessão expirada. Por favor, faça login novamente.');
  setTimeout(() => window.location.reload(), 1500);
  throw new Error('Unauthorized');
}
```

### Erro 401 em ErrorBoundary

Se erro não for capturado no componente:
```typescript
// ErrorBoundary detecta e:
if (error.message.includes('401')) {
  // Limpa sessão
  // Exibe mensagem amigável
  // Oferece botão para relogin
}
```

## 💡 Dicas

1. **Sempre use `apiClient`** para chamadas ao backend
2. **Verifique autenticação** antes de carregar dados
3. **Mostre loading states** enquanto busca dados
4. **Trate erros graciosamente** com toast/alert
5. **Não armazene dados sensíveis** no localStorage além do token

## 📝 Exemplo Completo

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/auth-context';
import { apiClient } from '../utils/api-client';
import { toast } from 'sonner@2.0.3';
import { Loader2 } from 'lucide-react';

export function MyComponent() {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && accessToken) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, accessToken]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/my-endpoint');
      setData(response.data);
    } catch (error) {
 console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <p>Por favor, faça login para ver este conteúdo.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Seu conteúdo aqui */}
    </div>
  );
}
```

## 🎯 Resultado Esperado

Após as correções:
- ✅ Sem erros 401 quando não logado (mostra tela de login)
- ✅ Sem erros 401 quando logado (token válido)
- ✅ Sessão limpa automaticamente quando token expira
- ✅ Mensagens claras para o usuário
- ✅ Experiência fluida sem crashes

## 📞 Precisa de Ajuda?

Se ainda tiver erros 401:

1. Abra o Console do navegador (F12)
2. Vá para aba Network
3. Reproduza o erro
4. Verifique a requisição que falhou:
   - Tem header Authorization?
   - Token está presente?
   - Qual endpoint?
5. Compartilhe essas informações para debug
