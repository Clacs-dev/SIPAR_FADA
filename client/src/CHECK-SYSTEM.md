# ✅ Verificação Rápida do Sistema

## 🎯 Checklist de Configuração

### 1. Credenciais Configuradas
```typescript
// Arquivo: /utils/supabase/info.tsx
export const projectId = 'SEU_PROJECT_ID_AQUI';
export const publicAnonKey = 'SUA_CHAVE_ANON_AQUI';
```

**Como verificar:**
- [ ] Project ID não é uma string vazia
- [ ] Project ID não contém espaços ou caracteres especiais
- [ ] Anon Key começa com `eyJ`
- [ ] Anon Key é uma string longa (várias linhas)

### 2. Servidor Deployado

**Comando para verificar:**
```bash
supabase functions list
```

**Deve aparecer:**
```
make-server-8b82752b
```

- [ ] Função aparece na lista
- [ ] Status é "ACTIVE" ou similar
- [ ] Última modificação é recente

### 3. Teste Manual do Servidor

**No Console do navegador (F12 > Console):**

```javascript
// SUBSTITUA SEU_PROJECT_ID e SUA_ANON_KEY pelas suas credenciais reais

const projectId = 'SEU_PROJECT_ID';
const anonKey = 'SUA_ANON_KEY';

// Teste 1: Health Check
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/health`)
  .then(r => r.json())
 .then(d => console.log(' Health:', d))
 .catch(e => console.error(' Health falhou:', e));
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T..."
}
```

- [ ] Retorna status "ok"
- [ ] Não há erros no console
- [ ] Resposta é rápida (< 2 segundos)

### 4. Teste de Inicialização

```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/initialize`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
 .then(d => console.log(' Init:', d))
 .catch(e => console.error(' Init falhou:', e));
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "System initialized" // ou "System already initialized"
}
```

- [ ] success é true
- [ ] message aparece
- [ ] Não há erros

### 5. Teste de Login

```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/auth/login`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@sistema.com',
    password: '123456'
  })
})
  .then(r => r.json())
  .then(d => {
    if (d.user) {
 console.log(' Login OK! Usuário:', d.user.name);
 console.log('Token:', d.session.access_token.substring(0, 20) + '...');
    } else {
 console.error(' Login falhou:', d);
    }
  })
 .catch(e => console.error(' Erro de rede:', e));
```

**Resultado esperado:**
```
✅ Login OK! Usuário: Administrador Sistema
Token: eyJhbGciOiJIUzI1NiI...
```

- [ ] Retorna objeto user
- [ ] Nome do usuário aparece
- [ ] Token de sessão é retornado
- [ ] Não há erro 401

## 🔍 Verificação de Problemas Comuns

### Problema: Erro 404

**Sintomas:**
```
GET https://xxx.supabase.co/functions/v1/make-server-8b82752b/health 404 (Not Found)
```

**Causa:** Servidor não está deployado

**Solução:**
```bash
supabase functions deploy make-server-8b82752b
```

- [ ] Executei o comando de deploy
- [ ] Aguardei conclusão
- [ ] Não houve erros no deploy

### Problema: Erro 401

**Sintomas:**
```json
{
  "error": "No authorization token provided"
}
```

**Causa:** Credenciais incorretas em info.tsx

**Verificação:**
1. Abrir `/utils/supabase/info.tsx`
2. Copiar o projectId
3. Copiar o publicAnonKey
4. Colar no teste acima
5. Verificar se funciona

- [ ] ProjectId está correto
- [ ] AnonKey está correta
- [ ] Arquivo foi salvo
- [ ] Página foi recarregada

### Problema: Erro CORS

**Sintomas:**
```
Access to fetch at '...' has been blocked by CORS policy
```

**Causa:** CORS não configurado no servidor

**Verificação em `/supabase/functions/server/index.tsx`:**
```typescript
app.use("*", cors());  // Deve estar presente
```

**Solução:**
```bash
supabase functions deploy make-server-8b82752b
```

- [ ] Linha `app.use("*", cors())` existe
- [ ] Fiz redeploy do servidor

### Problema: Usuários não criados

**Sintomas:**
```json
{
  "error": "User profile not found"
}
```

**Solução:** Executar inicialização

```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/initialize`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  }
})
```

**Depois:** Tentar login novamente

- [ ] Inicialização executada
- [ ] Retornou success: true
- [ ] Login funcionou após isso

## 🧪 Teste Completo do Sistema

Execute este script completo:

```javascript
async function testarSistemaCompleto() {
  // ⚠️ SUBSTITUA AQUI COM SUAS CREDENCIAIS REAIS
  const projectId = 'SEU_PROJECT_ID';
  const anonKey = 'SUA_ANON_KEY';
  
  const base = `https://${projectId}.supabase.co/functions/v1/make-server-8b82752b`;
  let passou = 0;
  let falhou = 0;
  
 console.log(' INICIANDO TESTES DO SISTEMA\n');
  
  // Teste 1: Health
 console.log('Teste 1: Health Check...');
  try {
    const r = await fetch(`${base}/health`);
    if (r.ok) {
 console.log(' PASSOU: Health Check');
      passou++;
    } else {
 console.error(' FALHOU: Health retornou', r.status);
      falhou++;
    }
  } catch (e) {
 console.error(' FALHOU: Health -', e.message);
    falhou++;
    return; // Parar se nem health funciona
  }
  
  // Teste 2: Inicialização
 console.log('\nTeste 2: Inicialização...');
  try {
    const r = await fetch(`${base}/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const d = await r.json();
    if (d.success) {
 console.log(' PASSOU: Inicialização -', d.message);
      passou++;
    } else {
 console.error(' FALHOU: Inicialização -', d);
      falhou++;
    }
  } catch (e) {
 console.error(' FALHOU: Inicialização -', e.message);
    falhou++;
  }
  
  // Teste 3: Login Admin
 console.log('\nTeste 3: Login Administrador...');
  let token = null;
  try {
    const r = await fetch(`${base}/auth/login`, {
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
    const d = await r.json();
    if (d.user && d.session) {
 console.log(' PASSOU: Login Admin -', d.user.name);
      token = d.session.access_token;
      passou++;
    } else {
 console.error(' FALHOU: Login Admin -', d);
      falhou++;
    }
  } catch (e) {
 console.error(' FALHOU: Login Admin -', e.message);
    falhou++;
  }
  
  // Teste 4: Validação de Token
  if (token) {
 console.log('\nTeste 4: Validação de Token...');
    try {
      const r = await fetch(`${base}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const d = await r.json();
      if (d.user) {
 console.log(' PASSOU: Validação de Token -', d.user.name);
        passou++;
      } else {
 console.error(' FALHOU: Validação de Token -', d);
        falhou++;
      }
    } catch (e) {
 console.error(' FALHOU: Validação de Token -', e.message);
      falhou++;
    }
  }
  
  // Teste 5: Login Atendente
 console.log('\nTeste 5: Login Atendente...');
  try {
    const r = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'atendente@sistema.com',
        password: '123456'
      })
    });
    const d = await r.json();
    if (d.user) {
 console.log(' PASSOU: Login Atendente -', d.user.name);
      passou++;
    } else {
 console.error(' FALHOU: Login Atendente -', d);
      falhou++;
    }
  } catch (e) {
 console.error(' FALHOU: Login Atendente -', e.message);
    falhou++;
  }
  
  // Teste 6: Login Usuário
 console.log('\nTeste 6: Login Usuário...');
  try {
    const r = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'usuario@empresa.com',
        password: '123456'
      })
    });
    const d = await r.json();
    if (d.user) {
 console.log(' PASSOU: Login Usuário -', d.user.name);
      passou++;
    } else {
 console.error(' FALHOU: Login Usuário -', d);
      falhou++;
    }
  } catch (e) {
 console.error(' FALHOU: Login Usuário -', e.message);
    falhou++;
  }
  
  // Resultado Final
 console.log('\n' + '='.repeat(50));
 console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
  
  if (falhou === 0) {
 console.log(' TODOS OS TESTES PASSARAM!');
 console.log(' Sistema está pronto para uso!');
  } else if (passou > 0) {
 console.log(' Alguns testes falharam');
 console.log('Verifique os erros acima e corrija');
  } else {
 console.log(' TODOS OS TESTES FALHARAM');
 console.log('Verifique:');
 console.log('1. Credenciais em info.tsx');
 console.log('2. Servidor está deployado');
 console.log('3. Variáveis de ambiente configuradas');
  }
 console.log('='.repeat(50));
}

testarSistemaCompleto();
```

## 📊 Interpretação dos Resultados

### ✅ 6/6 Testes Passaram
**Status:** Sistema 100% funcional!

**Próximos passos:**
1. Fazer login na interface
2. Explorar funcionalidades
3. Criar primeira carta de apresentação
4. Testar fluxo de audiência

### ⚠️ 3-5 Testes Passaram
**Status:** Sistema parcialmente funcional

**Ações:**
1. Revisar testes que falharam
2. Verificar logs do Supabase
3. Corrigir erros específicos
4. Executar testes novamente

### ❌ 0-2 Testes Passaram
**Status:** Problema de configuração

**Ações urgentes:**
1. Verificar credenciais em info.tsx
2. Fazer deploy do servidor
3. Verificar variáveis de ambiente
4. Consultar TROUBLESHOOTING-401.md

## 🎓 Usuários de Teste

### Administrador
- **Email:** admin@sistema.com
- **Senha:** 123456
- **Permissões:** Todas

### Atendente
- **Email:** atendente@sistema.com
- **Senha:** 123456
- **Permissões:** Gerenciar solicitações e agenda

### Usuário
- **Email:** usuario@empresa.com
- **Senha:** 123456
- **Permissões:** Criar cartas e pedidos

## 📝 Log de Verificação

```
Data: ____/____/____
Hora: ____:____

[ ] Credenciais configuradas
[ ] Servidor deployado
[ ] Health Check OK
[ ] Inicialização OK
[ ] Login Admin OK
[ ] Validação Token OK
[ ] Login Atendente OK
[ ] Login Usuário OK

Observações:
_________________________________
_________________________________
_________________________________
```

## 🚀 Pronto para Produção?

Antes de liberar para usuários:

- [ ] Todos os 6 testes passaram
- [ ] Testei login manual na interface
- [ ] Testei criar carta de apresentação
- [ ] Testei criar pedido de audiência
- [ ] Testei aprovação/rejeição
- [ ] Testei agendamento
- [ ] Testei upload de documentos
- [ ] Testei sistema de mensagens
- [ ] Configurei SendGrid para emails
- [ ] Testei notificações

---

**Lembre-se:** Execute os testes sempre que:
- Fizer deploy de nova versão
- Mudar credenciais
- Reportar problemas
- Após manutenção do servidor

**Arquivo:** /CHECK-SYSTEM.md  
**Versão:** 1.0.0  
**Data:** Outubro 2025
