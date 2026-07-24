# 🔧 Troubleshooting - Pedidos não aparecem

## Problema: Admin não vê pedidos criados por usuários

### Causa Identificada
O `access_token` não estava sendo salvo no `localStorage`, então as requisições falhavam silenciosamente.

### Solução Aplicada ✅

Atualizamos o `auth-context.tsx` para:
1. Salvar `access_token` no localStorage após login
2. Salvar `access_token` ao validar sessão existente
3. Limpar localStorage no logout

### Como Verificar se Funcionou

#### 1. Teste o Login
```javascript
// Abra Console (F12 > Console)
// Faça login no sistema
// Execute:
localStorage.getItem('access_token')
// Deve retornar uma string longa começando com 'eyJ...'
```

#### 2. Verifique o Usuário
```javascript
// No console:
localStorage.getItem('user')
// Deve retornar um JSON com dados do usuário
```

#### 3. Teste a Busca de Audiências
```javascript
// No console:
const token = localStorage.getItem('access_token');
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/audiences', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);

// Deve retornar: {success: true, data: [...]}
```

### Passos para Testar

1. **Logout** (se estiver logado)
   - Isso limpa o localStorage antigo

2. **Login como usuário**
   - Email: `usuario@empresa.com`
   - Senha: `123456`

3. **Criar um pedido de audiência**
   - Menu > Pedidos de Audiência
   - Preencher todos os campos
   - Enviar

4. **Logout**

5. **Login como admin**
   - Email: `admin@sistema.com`
   - Senha: `123456`

6. **Ir para Gerenciamento**
   - Deve ver o pedido criado pelo usuário

### Debug no Console

Se ainda não aparecer, verifique o console (F12):

```javascript
// 1. Token está salvo?
console.log('Token:', localStorage.getItem('access_token'));

// 2. Usuário está salvo?
console.log('User:', localStorage.getItem('user'));

// 3. Teste a requisição manualmente
const token = localStorage.getItem('access_token');
const projectId = 'SEU_PROJECT_ID'; // Substitua!

fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/audiences`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(async r => {
 console.log('Status:', r.status);
  const data = await r.json();
 console.log('Data:', data);
  return data;
})
.catch(console.error);
```

### Possíveis Problemas Adicionais

#### 1. Token Expirado
**Sintoma:** Requisição retorna 401
**Solução:** Fazer logout e login novamente

#### 2. Servidor não Deployado
**Sintoma:** Erro de rede / CORS
**Solução:** 
```bash
supabase functions deploy make-server-8b82752b
```

#### 3. Dados não Salvos
**Sintoma:** Array vazio `data: []`
**Solução:** Criar novos pedidos após fazer deploy

#### 4. Prefixo Errado no KV Store
**Sintoma:** Dados salvos mas não aparecem
**Solução:** Verificar no código do servidor se usa `audience_` como prefixo

### Verificar Dados no KV Store

```javascript
// Script para listar todas as audiências diretamente
// Cole no console após login como admin

const token = localStorage.getItem('access_token');
const projectId = 'SEU_PROJECT_ID'; // Substitua!

fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/audiences`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(result => {
 console.log('Total de audiências:', result.data?.length || 0);
 console.log('Audiências:', result.data);
  
  // Agrupar por status
  const byStatus = {};
  result.data?.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });
 console.log('Por status:', byStatus);
});
```

### Forçar Reload dos Dados

Se os dados existem mas não aparecem na interface:

1. Vá para Gerenciamento
2. Abra o console (F12)
3. Execute:
```javascript
location.reload();
```

Ou force um re-fetch:
```javascript
// Encontre o botão de refresh e clique
// Ou recarregue a página
```

### Limpar Cache e Tentar Novamente

```javascript
// Limpar tudo
localStorage.clear();
sessionStorage.clear();

// Fazer login novamente
location.reload();
```

### Estrutura Esperada dos Dados

Audiência salva deve ter:
```json
{
  "id": "audience_1234567890",
  "company": "Nome da Empresa",
  "contact": "Nome do Contacto",
  "position": "Cargo",
  "email": "email@empresa.com",
  "phone": "+244 923 000 000",
  "reason": "Motivo da Audiência",
  "description": "Descrição detalhada...",
  "userId": "uuid-do-usuario",
  "userEmail": "usuario@empresa.com",
  "status": "pendente",
  "createdAt": "2025-10-07T...",
  "updatedAt": "2025-10-07T...",
  "documentPath": "...",
  "documentName": "..."
}
```

### Logs Adicionados

Agora o `requests-list.tsx` tem logs no console:
- "Fetching presentations and audiences..."
- "Presentations fetched: X items"
- "Audiences fetched: X items"
- Erros detalhados se falhar

### Checklist Final

- [ ] Fez logout completo
- [ ] Fez login novamente
- [ ] Token está no localStorage
- [ ] Criou novo pedido como usuário
- [ ] Fez logout do usuário
- [ ] Fez login como admin
- [ ] Foi para Gerenciamento
- [ ] Vê o pedido criado
- [ ] Console não mostra erros

### Se Ainda Não Funcionar

1. Copie todo o log do console (F12 > Console)
2. Copie a resposta do fetch manual das audiências
3. Verifique se o servidor está respondendo corretamente
4. Confirme que o projectId em `info.tsx` está correto

---

**Atualizado:** Outubro 2025  
**Fix Aplicado:** auth-context.tsx + requests-list.tsx
