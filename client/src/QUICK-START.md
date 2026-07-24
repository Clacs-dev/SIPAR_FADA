# 🚀 Guia de Início Rápido

## Em 5 Minutos para o Sistema Funcionando

### Passo 1: Obter Credenciais do Supabase (2 min)

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie conta
3. Clique em "New Project"
4. Preencha:
   - **Name:** Sistema Audiências Angola
   - **Database Password:** (anote bem!)
   - **Region:** Escolha mais próximo de Angola
5. Clique em "Create new project"
6. Aguarde criação (1-2 minutos)

### Passo 2: Copiar Credenciais (30 segundos)

1. No painel do projeto, clique em **Settings** (⚙️) na lateral
2. Clique em **API**
3. Copie duas informações:

**Project URL:**
```
https://xyzabc123def.supabase.co
```
↓ Extraia o ID (parte antes de `.supabase.co`):
```
xyzabc123def
```

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```
(Começa com `eyJ` e é bem longo)

### Passo 3: Configurar o Sistema (1 min)

1. Abra o arquivo `/utils/supabase/info.tsx`
2. **Cole suas credenciais:**

```typescript
// ANTES (exemplo):
export const projectId = 'seu-project-id';
export const publicAnonKey = 'sua-chave-anon';

// DEPOIS (com seus valores reais):
export const projectId = 'xyzabc123def';
export const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

3. **Salve o arquivo** (Ctrl+S ou Cmd+S)

### Passo 4: Deploy do Servidor (1.5 min)

**Opção A: Via Terminal (Recomendado)**

```bash
# 1. Instalar CLI do Supabase
npm install -g supabase

# 2. Login
supabase login

# 3. Link com o projeto
supabase link --project-ref xyzabc123def

# 4. Deploy
supabase functions deploy make-server-8b82752b
```

**Opção B: Via Painel Web**

1. Painel Supabase > **Functions** > **Deploy new function**
2. Cole o código de `/supabase/functions/server/index.tsx`
3. Nome: `make-server-8b82752b`
4. Clique em **Deploy**

### Passo 5: Testar (30 segundos)

1. **Abra o Console do navegador** (F12 > Console)
2. **Cole e execute:**

```javascript
// SUBSTITUA xyzabc123def e eyJ... pelos seus valores reais!
fetch('https://xyzabc123def.supabase.co/functions/v1/make-server-8b82752b/health')
  .then(r => r.json())
 .then(d => console.log(' Servidor funcionando!', d))
 .catch(e => console.error(' Erro:', e));
```

**Resultado esperado:**
```
✅ Servidor funcionando! {status: "ok", timestamp: "..."}
```

### ✅ Sistema Pronto!

**Agora você pode:**

1. **Fazer Login** com usuário demo:
   - Email: `admin@sistema.com`
   - Senha: `123456`

2. **Explorar o sistema:**
   - Dashboard com estatísticas
   - Criar cartas de apresentação
   - Criar pedidos de audiência
   - Gerenciar solicitações
   - Agendar reuniões

---

## ⚠️ Se algo der errado

### Erro: "Failed to fetch"

**Problema:** Servidor não está acessível

**Solução:**
1. Confirme que fez deploy: `supabase functions list`
2. Deve aparecer: `make-server-8b82752b`
3. Se não aparecer, refaça o Passo 4

### Erro: "No authorization token provided"

**Problema:** Credenciais incorretas

**Solução:**
1. Volte ao Passo 2 e copie as credenciais novamente
2. Cole em `/utils/supabase/info.tsx`
3. **Salve o arquivo**
4. Recarregue a página (F5)

### Erro: "User profile not found"

**Problema:** Usuários demo não foram criados

**Solução:**
```javascript
// No console do navegador:
fetch('https://xyzabc123def.supabase.co/functions/v1/make-server-8b82752b/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJ...',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

(Substitua `xyzabc123def` e `eyJ...` pelos seus valores)

---

## 📚 Próximos Passos

### Para Testar o Sistema

1. **Login como Admin**
   - Email: `admin@sistema.com`
   - Senha: `123456`
   - Explore: Dashboard, Gerenciamento, Usuários

2. **Login como Atendente**
   - Email: `atendente@sistema.com`
   - Senha: `123456`
   - Teste: Aprovar/Rejeitar, Agendar reuniões

3. **Login como Usuário**
   - Email: `usuario@empresa.com`
   - Senha: `123456`
   - Crie: Carta de apresentação, Pedido de audiência

### Para Criar Novos Usuários

1. Faça login como Admin
2. Vá em **Usuários** no menu lateral
3. Clique em **Adicionar Usuário**
4. Preencha os dados:
   - Nome completo
   - Email válido
   - Senha (mínimo 6 caracteres)
   - Tipo: Usuário ou Atendente
   - Organização
   - Telefone: `+244 923 000 000`
   - NIF/BI

### Para Configurar Emails

1. Crie conta no [SendGrid](https://sendgrid.com)
2. Obtenha API Key
3. Configure no Supabase:
   - Settings > Secrets
   - Adicione: `SENDGRID_API_KEY`
4. Teste enviando uma notificação

---

## 🎯 Fluxo Básico de Uso

### Criar Pedido de Audiência (Usuário)

1. Login como usuário
2. Menu lateral > **Pedidos de Audiência**
3. Preencha:
   - Nome da empresa
   - Nome do contacto
   - Cargo
   - Email
   - Telefone (+244 XXX XXX XXX)
   - Motivo da audiência
   - Descrição detalhada
   - Upload de documento (opcional)
4. Clique em **Enviar Pedido**

### Agendar Reunião (Admin)

1. Login como admin
2. Menu lateral > **Gerenciamento**
3. Aba **Pedidos de Audiência**
4. Encontre o pedido
5. Clique no ícone de calendário
6. Preencha no modal:
   - Tipo: Online ou Presencial
   - Data e hora
   - Duração
   - Se online: Plataforma e link
   - Se presencial: Local
   - Agenda/Notas
7. Clique em **Agendar Reunião**

### Ver Agenda

1. Menu lateral > **Agenda**
2. Visualize:
   - Calendário mensal
   - Lista de reuniões
   - Filtros por status
3. Clique em uma reunião para ver detalhes

---

## 📞 Suporte e Documentação

### Documentação Completa
- **README-SETUP.md** - Configuração detalhada
- **TROUBLESHOOTING-401.md** - Resolver erros 401
- **CHECK-SYSTEM.md** - Verificação do sistema
- **README-AUDIENCE-WORKFLOW.md** - Fluxo de audiências
- **README-AUTHENTICATION.md** - Sistema de autenticação

### Verificação Rápida

Execute no console:
```javascript
// Copie o script de CHECK-SYSTEM.md
// Substitua as credenciais e execute
```

### Checklist Pré-Produção

- [ ] Todos os testes passam
- [ ] Login funciona
- [ ] Criar carta funciona
- [ ] Criar pedido funciona
- [ ] Aprovar/Rejeitar funciona
- [ ] Agendar funciona
- [ ] Upload de documentos funciona
- [ ] SendGrid configurado
- [ ] Usuários admin criados

---

## 🔒 Segurança

### Antes de Produção

1. **Mudar senhas dos usuários demo:**
   ```javascript
   // No painel Supabase > Authentication > Users
   // Clique em cada usuário e "Reset Password"
   ```

2. **Criar usuários reais:**
   - Remova ou desative usuários demo
   - Crie usuários com emails reais
   - Use senhas fortes

3. **Configurar domínio:**
   - Settings > URL Configuration
   - Adicione seu domínio
   - Configure SSL/HTTPS

4. **Habilitar RLS:**
   - Database > Tables > kv_store_8b82752b
   - Enable Row Level Security
   - Configure políticas de acesso

---

## 🎉 Pronto!

Seu sistema está funcionando! 

**Tempo total:** ~5 minutos

**Usuários criados:** 3 (Admin, Atendente, Usuário)

**Próximo passo:** Fazer login e explorar!

---

**Precisa de ajuda?** Consulte os arquivos de documentação listados acima.

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Sistema:** Gestão de Audiências e Apresentações para Angola
