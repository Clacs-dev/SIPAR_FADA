# Guia de Resolução: Erros 401 (Autenticação)

## 🔍 Diagnóstico Rápido

### Passo 1: Verificar Credenciais

Abra `/utils/supabase/info.tsx` e confirme:

```typescript
export const projectId = 'seu-project-id-aqui';
export const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Sua chave anon
```

**Como encontrar suas credenciais:**

1. Acesse [supabase.com](https://supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL**: Extraia o ID (parte antes de `.supabase.co`)
   - **anon/public key**: Chave que começa com `eyJ...`

**Exemplo:**
- URL: `https://xyzabc123def.supabase.co`
- Project ID: `xyzabc123def`

### Passo 2: Verificar Deploy do Servidor

Execute no terminal:

```bash
# 1. Instalar CLI do Supabase (se não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link com o projeto
supabase link --project-ref SEU_PROJECT_ID

# 4. Deploy da função
supabase functions deploy make-server-8b82752b
```

**Confirme o deploy:**
```bash
supabase functions list
```

Deve aparecer: `make-server-8b82752b`

### Passo 3: Testar Servidor Manualmente

Abra o Console do navegador (F12) e execute:

```javascript
// 1. Health Check
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/health')
  .then(r => r.json())
 .then(console.log)
 .catch(console.error)

// Deve retornar: {status: "ok", timestamp: "..."}
```

```javascript
// 2. Inicialização
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_ANON_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
 .then(console.log)
 .catch(console.error)

// Deve retornar: {success: true, message: "..."}
```

```javascript
// 3. Login de Teste
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/auth/login', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@sistema.com',
    password: '123456'
  })
})
  .then(r => r.json())
 .then(console.log)
 .catch(console.error)

// Deve retornar: {user: {...}, session: {...}}
```

## 🐛 Erros Comuns e Soluções

### Erro 1: "Failed to fetch"

**Causa:** Servidor não está acessível

**Soluções:**

1. **Verificar URL do servidor:**
   ```javascript
   // No console do navegador
 console.log(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/health`)
   ```
   Copie a URL e abra em outra aba. Deve retornar JSON.

2. **Verificar CORS:**
   - Confirme que o servidor tem `app.use("*", cors())`
   - Redeploy: `supabase functions deploy make-server-8b82752b`

3. **Verificar Firewall/Proxy:**
   - Tente acessar de outro navegador
   - Desative extensões do navegador temporariamente
   - Tente em modo anônimo

### Erro 2: "No authorization token provided"

**Causa:** Token não está sendo enviado corretamente

**Soluções:**

1. **Verificar se está logado:**
   ```javascript
   // No console
   localStorage.getItem('supabase.auth.token')
   ```
   Deve retornar um token JWT.

2. **Limpar cache e tentar novamente:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

3. **Verificar auth-context.tsx:**
   - Confirme que `accessToken` está sendo salvo após login
   - Verifique se está sendo passado no header Authorization

### Erro 3: "Invalid token" ou "User profile not found"

**Causa:** Usuário não foi criado corretamente

**Soluções:**

1. **Recriar usuários demo:**
   ```javascript
   // No console do navegador
   fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/initialize', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer SUA_ANON_KEY',
       'Content-Type': 'application/json'
     }
   })
   .then(r => r.json())
 .then(console.log)
   ```

2. **Verificar KV Store:**
   - Acesse o painel do Supabase
   - Vá em **Database** > **Tables** > `kv_store_8b82752b`
   - Verifique se existem registros com chaves `user_profile:*`

3. **Criar usuário manualmente:**
   ```javascript
   fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/auth/register', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer SUA_ANON_KEY',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       name: 'Teste Admin',
       email: 'teste@admin.com',
       password: '123456',
       role: 'admin',
       organization: 'Organização Teste',
       phone: '+244 923 000 000',
       document: '123456789'
     })
   })
   .then(r => r.json())
 .then(console.log)
   ```

### Erro 4: "Session expired"

**Causa:** Token de autenticação expirou

**Solução:**
1. Faça logout
2. Faça login novamente
3. O sistema criará uma nova sessão válida

### Erro 5: Status 500 (Internal Server Error)

**Causa:** Erro no servidor

**Soluções:**

1. **Verificar logs do servidor:**
   - Painel Supabase > **Functions** > `make-server-8b82752b` > **Logs**
   - Procure por mensagens de erro

2. **Verificar variáveis de ambiente:**
   - Painel Supabase > **Settings** > **Functions** > **Secrets**
   - Confirme que existem:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

3. **Verificar código do servidor:**
   - Revise `/supabase/functions/server/index.tsx`
   - Confirme que não há erros de sintaxe
   - Redeploy se necessário

## 🔧 Script de Diagnóstico Completo

Execute este script no Console do navegador para diagnóstico completo:

```javascript
async function diagnosticar() {
  const projectId = 'SEU_PROJECT_ID';
  const anonKey = 'SUA_ANON_KEY';
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-8b82752b`;
  
 console.log('=== DIAGNÓSTICO DO SISTEMA ===\n');
  
  // 1. Health Check
 console.log('1. Testando Health Check...');
  try {
    const health = await fetch(`${baseUrl}/health`);
    const healthData = await health.json();
 console.log(' Health Check OK:', healthData);
  } catch (e) {
 console.error(' Health Check FALHOU:', e.message);
    return;
  }
  
  // 2. Inicialização
 console.log('\n2. Testando Inicialização...');
  try {
    const init = await fetch(`${baseUrl}/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const initData = await init.json();
 console.log(' Inicialização:', initData);
  } catch (e) {
 console.error(' Inicialização FALHOU:', e.message);
  }
  
  // 3. Login
 console.log('\n3. Testando Login...');
  try {
    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@sistema.com',
        password: '123456'
      })
    });
    
    if (login.ok) {
      const loginData = await login.json();
 console.log(' Login OK:', loginData.user);
      
      // 4. Validar Token
 console.log('\n4. Testando Validação de Token...');
      const me = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (me.ok) {
        const meData = await me.json();
 console.log(' Validação de Token OK:', meData.user);
      } else {
        const error = await me.json();
 console.error(' Validação de Token FALHOU:', error);
      }
    } else {
      const error = await login.json();
 console.error(' Login FALHOU:', error);
    }
  } catch (e) {
 console.error(' Login FALHOU:', e.message);
  }
  
 console.log('\n=== DIAGNÓSTICO CONCLUÍDO ===');
}

diagnosticar();
```

**Substitua:**
- `SEU_PROJECT_ID` pelo seu Project ID
- `SUA_ANON_KEY` pela sua chave anon

## 📋 Checklist de Verificação

Antes de pedir ajuda, confirme:

- [ ] `info.tsx` tem as credenciais corretas
- [ ] Servidor foi deployado com sucesso
- [ ] Health check retorna `{status: "ok"}`
- [ ] Inicialização retorna `{success: true}`
- [ ] Login retorna usuário e sessão
- [ ] Não há erros no Console do navegador
- [ ] Não há erros nos logs do Supabase

## 🆘 Ainda com Problemas?

### Método 1: Reset Completo

```javascript
// 1. Limpar tudo
localStorage.clear();
sessionStorage.clear();

// 2. Reinicializar
await fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_ANON_KEY',
    'Content-Type': 'application/json'
  }
});

// 3. Recarregar página
location.reload();
```

### Método 2: Verificar Permissões da Tabela

1. Painel Supabase > **Database** > **Tables** > `kv_store_8b82752b`
2. Clique em **Policies** (RLS)
3. Verifique se há políticas ativas
4. Se necessário, desative RLS temporariamente para teste:
   ```sql
   ALTER TABLE kv_store_8b82752b DISABLE ROW LEVEL SECURITY;
   ```

### Método 3: Logs Detalhados

Ative logs detalhados no código:

```javascript
// No auth-context.tsx, adicione mais console.log
console.log('Login URL:', url);
console.log('Headers:', headers);
console.log('Body:', JSON.stringify({ email, password }));
```

## 📞 Informações para Suporte

Se precisar pedir ajuda, forneça:

1. **Project ID** (sem a chave secreta!)
2. **Mensagem de erro exata** do console
3. **Status HTTP** da requisição falha
4. **Response body** se disponível
5. **Screenshot** dos logs do Supabase Functions
6. **Resultado** do script de diagnóstico

## ✅ Teste Final

Depois de resolver os problemas, teste:

```javascript
// Login bem-sucedido
const result = await fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/auth/login', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@sistema.com',
    password: '123456'
  })
});

const data = await result.json();
console.log(' Sistema funcionando!', data.user.name);
```

Se aparecer o nome do usuário, **o sistema está funcionando!**

---

**Última Atualização:** Outubro 2025  
**Versão:** 1.0.0
