# 🚀 PASSO A PASSO - Adicionar Compras e Motorista

## 🎯 OBJETIVO

Adicionar 2 novos utilizadores:
- ✅ compras@sistema.com
- ✅ motorista@sistema.com

---

## 📋 PASSO 1: Executar Script SQL

### 1.1 Abra o Supabase SQL Editor

1. Entre no Supabase Dashboard
2. Clique em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New query**

### 1.2 Copie e Execute o Script

Copie TODO o conteúdo abaixo e cole no SQL Editor:

```sql
-- =====================================================
-- ADICIONAR 2 NOVOS UTILIZADORES
-- compras@sistema.com e motorista@sistema.com
-- =====================================================

-- UTILIZADOR 1: COMPRAS
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_profile:compras-001',
  jsonb_build_object(
    'id', 'compras-001',
    'email', 'compras@sistema.com',
    'name', 'Responsável de Compras',
    'role', 'user',
    'department', 'aquisicoes',
    'position', 'Responsável de Aquisições e Compras',
    'phone', '+244 923 100 001',
    'address', 'Luanda, Angola',
    'document', 'BI-COMPRAS001LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:compras@sistema.com',
  jsonb_build_object('user_id', 'compras-001')
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- UTILIZADOR 2: MOTORISTA
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_profile:motorista-001',
  jsonb_build_object(
    'id', 'motorista-001',
    'email', 'motorista@sistema.com',
    'name', 'Motorista da Frota',
    'role', 'user',
    'department', 'operacional_frota',
    'position', 'Motorista',
    'phone', '+244 923 200 001',
    'address', 'Luanda, Angola',
    'document', 'BI-MOTORISTA001LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:motorista@sistema.com',
  jsonb_build_object('user_id', 'motorista-001')
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- VERIFICAÇÃO
SELECT 
  '✅ NOVOS UTILIZADORES CRIADOS' as status;

SELECT 
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo"
FROM kv_store_8b82752b 
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001')
ORDER BY value->>'email';
```

### 1.3 Clique em RUN

Você deve ver:
```
✅ NOVOS UTILIZADORES CRIADOS

📧 Email                | 👤 Nome                  | 🎭 Role | 🏢 Departamento    | 💼 Cargo
compras@sistema.com     | Responsável de Compras   | user    | aquisicoes        | Responsável de Aquisições e Compras
motorista@sistema.com   | Motorista da Frota       | user    | operacional_frota | Motorista
```

✅ **PASSO 1 COMPLETO!** Os perfis foram criados no KV_STORE.

---

## 📋 PASSO 2: Criar Autenticação

Agora precisamos criar as contas de login no Supabase Auth.

### 2.1 Abra Authentication → Users

1. No Supabase Dashboard
2. Clique em **Authentication** (menu lateral esquerdo)
3. Clique em **Users**
4. Clique em **Add user** (botão verde no canto superior direito)

### 2.2 Criar Utilizador COMPRAS

1. Clique em **Create new user**
2. Preencha:
   ```
   Email: compras@sistema.com
   Password: Compras@2026
   ```
3. ✅ **IMPORTANTE:** Marque a opção **"Auto Confirm User"**
4. Clique em **Create user**

### 2.3 Criar Utilizador MOTORISTA

1. Clique novamente em **Add user**
2. Clique em **Create new user**
3. Preencha:
   ```
   Email: motorista@sistema.com
   Password: Motorista@2026
   ```
4. ✅ **IMPORTANTE:** Marque a opção **"Auto Confirm User"**
5. Clique em **Create user**

✅ **PASSO 2 COMPLETO!** As contas de autenticação foram criadas.

---

## 📋 PASSO 3: Verificar se Funcionou

### 3.1 Verificar no SQL

Execute este SQL para confirmar:

```sql
SELECT 
  '📊 VERIFICAÇÃO FINAL' as info;

SELECT 
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'department' as "🏢 Departamento"
FROM kv_store_8b82752b
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001')
ORDER BY value->>'email';

-- Contar total de utilizadores agora
SELECT 
  'Total de Utilizadores no Sistema' as metrica,
  COUNT(*) as valor
FROM kv_store_8b82752b 
WHERE key LIKE 'user_profile:%';
```

**Resultado esperado:**
- ✅ 2 utilizadores aparecem (compras e motorista)
- ✅ Total de utilizadores = 8 (6 originais + 2 novos)

### 3.2 Verificar no Dashboard

1. **Authentication → Users**
2. Você deve ver na lista:
   - ✅ compras@sistema.com
   - ✅ motorista@sistema.com

---

## ✅ PRONTO! RESUMO FINAL

### 🎉 Você adicionou com sucesso:

| Email | Password | Nome | Departamento |
|-------|----------|------|--------------|
| compras@sistema.com | Compras@2026 | Responsável de Compras | aquisicoes |
| motorista@sistema.com | Motorista@2026 | Motorista da Frota | operacional_frota |

### 📊 Sistema agora tem 8 utilizadores:

1. admin@sistema.com
2. atendente@sistema.com
3. usuario@empresa.com
4. gerente@sistema.ao
5. financeiro@sistema.ao
6. operador@sistema.ao
7. **compras@sistema.com** ⭐ NOVO
8. **motorista@sistema.com** ⭐ NOVO

---

## 🧪 TESTAR LOGIN (Opcional)

Você pode testar se o login funciona:

1. Faça logout do sistema
2. Tente fazer login com:
   - Email: `compras@sistema.com`
   - Senha: `Compras@2026`
3. Ou com:
   - Email: `motorista@sistema.com`
   - Senha: `Motorista@2026`

---

## 🚨 SE DER ERRO

### Erro: "relation kv_store_8b82752b does not exist"

**Solução:** Use a tabela sem sufixo. Execute este SQL em vez do anterior:

```sql
-- APENAS SE DER ERRO COM kv_store_8b82752b
-- Use kv_store sem sufixo

INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:compras-001',
  jsonb_build_object(
    'id', 'compras-001',
    'email', 'compras@sistema.com',
    'name', 'Responsável de Compras',
    'role', 'user',
    'department', 'aquisicoes',
    'position', 'Responsável de Aquisições e Compras',
    'phone', '+244 923 100 001',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP
  )
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO kv_store (key, value)
VALUES ('user_email_lookup:compras@sistema.com', jsonb_build_object('user_id', 'compras-001'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:motorista-001',
  jsonb_build_object(
    'id', 'motorista-001',
    'email', 'motorista@sistema.com',
    'name', 'Motorista da Frota',
    'role', 'user',
    'department', 'operacional_frota',
    'position', 'Motorista',
    'phone', '+244 923 200 001',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP
  )
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO kv_store (key, value)
VALUES ('user_email_lookup:motorista@sistema.com', jsonb_build_object('user_id', 'motorista-001'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verificar
SELECT * FROM kv_store WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001');
```

### Erro: "Email already exists" no Auth

**Solução:** O utilizador já existe no Auth. Pode pular o PASSO 2 ou deletar o utilizador existente primeiro.

---

## 📞 PRÓXIMO PASSO

**Execute os 3 passos acima e me confirme:**
1. ✅ Script SQL executou com sucesso?
2. ✅ Criou os 2 utilizadores no Auth?
3. ✅ Verificação mostrou os 2 novos utilizadores?

Depois podemos avançar! 🚀
