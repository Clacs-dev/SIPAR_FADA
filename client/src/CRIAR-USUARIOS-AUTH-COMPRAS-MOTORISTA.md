# 🔐 CRIAR UTILIZADORES NO SUPABASE AUTH

## ⚠️ IMPORTANTE: 2 PASSOS NECESSÁRIOS

Para que os utilizadores **compras@sistema.com** e **motorista@sistema.com** possam fazer login, você precisa:

1. ✅ **Criar perfil no KV_STORE** (já temos o script SQL)
2. ✅ **Criar autenticação no Supabase Auth** (via API ou Dashboard)

---

## 🎯 OPÇÃO 1: Via Supabase Dashboard (Mais Fácil)

### Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Entre no seu projeto Supabase
   - Vá para **Authentication** → **Users**

2. **Clique em "Add user"**
   - Escolha: **Create new user**

3. **Preencha os dados:**

   **UTILIZADOR 1: COMPRAS**
   ```
   Email: compras@sistema.com
   Password: Compras@2026
   Auto Confirm User: ✅ SIM (marque esta opção)
   ```

   **UTILIZADOR 2: MOTORISTA**
   ```
   Email: motorista@sistema.com
   Password: Motorista@2026
   Auto Confirm User: ✅ SIM (marque esta opção)
   ```

4. **Clique em "Create user"**

---

## 🎯 OPÇÃO 2: Via SQL (Executar no Backend)

Se preferir criar via código, execute isto no **SQL Editor** do Supabase:

### ⚠️ ATENÇÃO: Use a Service Role Key

Este script usa a **SUPABASE_SERVICE_ROLE_KEY**, então deve ser executado no backend ou via Supabase SQL Editor com permissões de admin.

```sql
-- =====================================================
-- CRIAR UTILIZADORES NO SUPABASE AUTH
-- =====================================================

-- Nota: Este script usa extensões do Supabase
-- Execute no SQL Editor com permissões de admin

-- Criar utilizador COMPRAS
SELECT extensions.create_user(
  'compras@sistema.com'::text,
  'Compras@2026'::text,
  jsonb_build_object('name', 'Responsável de Compras'),
  true -- email_confirmed
);

-- Criar utilizador MOTORISTA
SELECT extensions.create_user(
  'motorista@sistema.com'::text,
  'Motorista@2026'::text,
  jsonb_build_object('name', 'Motorista da Frota'),
  true -- email_confirmed
);
```

---

## 🎯 OPÇÃO 3: Via Endpoint no Servidor (Recomendado)

### Criar endpoint no servidor para registar utilizadores

Já existe a rota `/make-server-8b82752b/auth/signup` no seu sistema.

Você pode chamar esta rota para criar os utilizadores:

### Via cURL (Terminal)

```bash
# Criar utilizador COMPRAS
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -d '{
    "email": "compras@sistema.com",
    "password": "Compras@2026",
    "name": "Responsável de Compras",
    "role": "user",
    "department": "aquisicoes",
    "position": "Responsável de Aquisições e Compras"
  }'

# Criar utilizador MOTORISTA
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -d '{
    "email": "motorista@sistema.com",
    "password": "Motorista@2026",
    "name": "Motorista da Frota",
    "role": "user",
    "department": "operacional_frota",
    "position": "Motorista"
  }'
```

### Via Frontend (React)

```typescript
// Criar utilizador COMPRAS
const response1 = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/auth/signup`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({
      email: 'compras@sistema.com',
      password: 'Compras@2026',
      name: 'Responsável de Compras',
      role: 'user',
      department: 'aquisicoes',
      position: 'Responsável de Aquisições e Compras'
    })
  }
);

// Criar utilizador MOTORISTA
const response2 = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/auth/signup`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({
      email: 'motorista@sistema.com',
      password: 'Motorista@2026',
      name: 'Motorista da Frota',
      role: 'user',
      department: 'operacional_frota',
      position: 'Motorista'
    })
  }
);
```

---

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

### 1️⃣ PRIMEIRO: Criar perfis no KV_STORE

Execute o ficheiro: **`ADICIONAR-COMPRAS-MOTORISTA.sql`**

Isto cria:
- ✅ `user_profile:compras-001`
- ✅ `user_profile:motorista-001`
- ✅ Lookups de email

### 2️⃣ SEGUNDO: Criar autenticação

Escolha UMA das opções acima:
- 🟢 **Opção 1** (mais fácil): Via Dashboard
- 🟡 **Opção 2** (intermediário): Via SQL
- 🔵 **Opção 3** (recomendado): Via API do servidor

---

## 🔍 VERIFICAR SE FUNCIONOU

### No Supabase Dashboard

1. **Verificar Auth:**
   - Authentication → Users
   - Deve aparecer: compras@sistema.com e motorista@sistema.com

2. **Verificar KV_STORE:**
   - SQL Editor → Execute:
   ```sql
   SELECT 
     value->>'email' as email,
     value->>'name' as nome,
     value->>'department' as departamento
   FROM kv_store_8b82752b 
   WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001');
   ```

### Testar Login

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'compras@sistema.com',
  password: 'Compras@2026'
});

console.log('Login bem sucedido:', data);
```

---

## 📊 RESUMO DOS DADOS

| Campo | Compras | Motorista |
|-------|---------|-----------|
| **Email** | compras@sistema.com | motorista@sistema.com |
| **Password** | Compras@2026 | Motorista@2026 |
| **Nome** | Responsável de Compras | Motorista da Frota |
| **Role** | user | user |
| **Departamento** | aquisicoes | operacional_frota |
| **Cargo** | Responsável de Aquisições e Compras | Motorista |
| **Telefone** | +244 923 100 001 | +244 923 200 001 |
| **ID** | compras-001 | motorista-001 |
| **Perfil** | utilizador_interno | operacional_frota |

---

## ✅ CHECKLIST COMPLETO

- [ ] Executar `ADICIONAR-COMPRAS-MOTORISTA.sql` no SQL Editor
- [ ] Criar autenticação para compras@sistema.com
- [ ] Criar autenticação para motorista@sistema.com
- [ ] Verificar no Dashboard → Authentication → Users
- [ ] Verificar no kv_store se os perfis foram criados
- [ ] Testar login com compras@sistema.com
- [ ] Testar login com motorista@sistema.com

---

## 🎯 PRÓXIMO PASSO

**Execute agora:**
1. O script SQL `ADICIONAR-COMPRAS-MOTORISTA.sql`
2. Crie a autenticação (escolha uma das 3 opções)
3. Me confirme se funcionou! ✅
