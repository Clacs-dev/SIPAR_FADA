# 🔍 ENTENDER UTILIZADORES NO SISTEMA

## 📚 Onde Estão Armazenados os Utilizadores?

### 🗄️ Sistema de Armazenamento Duplo

O sistema usa **2 locais diferentes** para armazenar utilizadores:

```
┌─────────────────────────────────────────────┐
│  1️⃣ SUPABASE AUTH (Autenticação)           │
│     • Email e senha                         │
│     • Tokens de acesso                      │
│     • Estado de confirmação de email        │
│     • Localização: Authentication → Users   │
└─────────────────────────────────────────────┘
                    ⬇️
┌─────────────────────────────────────────────┐
│  2️⃣ KV_STORE (Perfis e Dados)              │
│     • Nome, departamento, cargo             │
│     • Role (admin/attendant/user)           │
│     • Perfis múltiplos                      │
│     • Localização: Table Editor → kv_store  │
└─────────────────────────────────────────────┘
```

---

## 🔑 Estrutura de Chaves no KV_STORE

### Padrão de Chaves

```sql
-- PERFIS DE UTILIZADOR
user_profile:{user_id}
Exemplo: user_profile:123e4567-e89b-12d3-a456-426614174000

-- LOOKUP DE EMAIL
user_email_lookup:{email}
Exemplo: user_email_lookup:admin@sistema.ao
```

---

## 📋 COMO VER OS UTILIZADORES ATUAIS

### 1️⃣ Ver TODOS os Utilizadores no Sistema

```sql
-- Listar todos os perfis de utilizador
SELECT 
  key,
  value->>'id' as id,
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role,
  value->>'department' as departamento,
  value->>'position' as cargo,
  value->'profiles' as perfis,
  value->>'created_at' as criado_em
FROM kv_store 
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';
```

### 2️⃣ Contar Total de Utilizadores

```sql
-- Quantos utilizadores existem?
SELECT COUNT(*) as total_utilizadores
FROM kv_store 
WHERE key LIKE 'user_profile:%';
```

### 3️⃣ Ver Utilizadores por Departamento

```sql
-- Listar utilizadores agrupados por departamento
SELECT 
  value->>'department' as departamento,
  COUNT(*) as quantidade,
  string_agg(value->>'email', ', ') as emails
FROM kv_store 
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'department'
ORDER BY quantidade DESC;
```

### 4️⃣ Ver Utilizadores por Role

```sql
-- Listar utilizadores por role (admin/attendant/user)
SELECT 
  value->>'role' as role,
  COUNT(*) as quantidade,
  string_agg(value->>'email', ', ') as emails
FROM kv_store 
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'role'
ORDER BY quantidade DESC;
```

---

## 🔍 VERIFICAR UTILIZADORES ESPECÍFICOS

### Por Email

```sql
-- Buscar utilizador por email
SELECT 
  key,
  value
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND value->>'email' = 'admin@sistema.ao';
```

### Por Departamento

```sql
-- Buscar utilizadores de um departamento específico
SELECT 
  value->>'email' as email,
  value->>'name' as nome,
  value->>'position' as cargo
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND value->>'department' = 'financeiro';
```

### Por ID

```sql
-- Buscar utilizador por ID
SELECT 
  key,
  value
FROM kv_store 
WHERE key = 'user_profile:123e4567-e89b-12d3-a456-426614174000';
```

---

## 🚨 DIAGNOSTICAR ERRO DO SQL

### Erro Comum 1: "relation kv_store does not exist"

**Causa:** A tabela `kv_store` não existe ou o script está sendo executado no banco errado.

**Solução:**
```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'kv_store';

-- Se não existir, criar a tabela
-- (Normalmente já existe no seu sistema)
```

### Erro Comum 2: "syntax error near INSERT"

**Causa:** Sintaxe PostgreSQL incorreta ou problema com JSONB.

**Solução:** Use este formato correto:

```sql
-- FORMATO CORRETO
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:dept-pca-001',
  jsonb_build_object(
    'id', 'dept-pca-001',
    'email', 'pca@sistema.ao',
    'name', 'Paulo Presidente - PCA',
    'role', 'admin'
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
```

### Erro Comum 3: "duplicate key value violates unique constraint"

**Causa:** Já existe um utilizador com o mesmo email ou ID.

**Solução:** 
```sql
-- Ver se o utilizador já existe
SELECT * FROM kv_store WHERE key = 'user_profile:dept-pca-001';

-- Se existir, pode deletar e recriar:
DELETE FROM kv_store WHERE key = 'user_profile:dept-pca-001';

-- Ou usar ON CONFLICT (já incluído no script)
```

---

## 📊 SCRIPT COMPLETO DE DIAGNÓSTICO

Execute este script para ver TUDO sobre os utilizadores atuais:

```sql
-- =====================================================
-- DIAGNÓSTICO COMPLETO DE UTILIZADORES
-- =====================================================

-- 1. TOTAL DE UTILIZADORES
SELECT '1. TOTAL DE UTILIZADORES' as info;
SELECT COUNT(*) as total
FROM kv_store 
WHERE key LIKE 'user_profile:%';

-- 2. LISTAR TODOS OS UTILIZADORES
SELECT '2. TODOS OS UTILIZADORES' as info;
SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as num,
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role,
  value->>'department' as departamento,
  value->>'position' as cargo
FROM kv_store 
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- 3. UTILIZADORES POR ROLE
SELECT '3. UTILIZADORES POR ROLE' as info;
SELECT 
  value->>'role' as role,
  COUNT(*) as quantidade
FROM kv_store 
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'role'
ORDER BY quantidade DESC;

-- 4. UTILIZADORES POR DEPARTAMENTO
SELECT '4. UTILIZADORES POR DEPARTAMENTO' as info;
SELECT 
  COALESCE(value->>'department', 'SEM DEPARTAMENTO') as departamento,
  COUNT(*) as quantidade
FROM kv_store 
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'department'
ORDER BY quantidade DESC;

-- 5. VERIFICAR LOOKUPS DE EMAIL
SELECT '5. LOOKUPS DE EMAIL' as info;
SELECT 
  key as lookup_key,
  value->>'user_id' as user_id
FROM kv_store 
WHERE key LIKE 'user_email_lookup:%'
ORDER BY key;

-- 6. VERIFICAR ESTRUTURA DA TABELA
SELECT '6. ESTRUTURA DA TABELA KV_STORE' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'kv_store'
ORDER BY ordinal_position;

-- 7. VERIFICAR ÍNDICES
SELECT '7. ÍNDICES NA TABELA' as info;
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'kv_store';
```

---

## 🔧 CORRIGIR SCRIPT SQL DE CRIAÇÃO

Se o script `CREATE-USERS-DEPARTMENTS.sql` deu erro, pode ser por um destes motivos:

### Problema: Sintaxe JSONB

**Errado:**
```sql
-- ❌ NÃO FUNCIONA
INSERT INTO kv_store (key, value)
VALUES ('user_profile:dept-pca-001', {
  "id": "dept-pca-001",
  "email": "pca@sistema.ao"
});
```

**Correto:**
```sql
-- ✅ FUNCIONA
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:dept-pca-001',
  jsonb_build_object(
    'id', 'dept-pca-001',
    'email', 'pca@sistema.ao',
    'name', 'Paulo PCA',
    'role', 'admin'
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
```

### Problema: Arrays JSONB

**Para adicionar arrays (como profiles):**

```sql
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:dept-pca-001',
  jsonb_build_object(
    'id', 'dept-pca-001',
    'email', 'pca@sistema.ao',
    'name', 'Paulo PCA',
    'role', 'admin',
    'profiles', jsonb_build_array('admin_sistema')
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
```

---

## 📝 SCRIPT SIMPLES PARA TESTAR

Teste primeiro com 1 utilizador para ver se funciona:

```sql
-- TESTE: Criar apenas 1 utilizador
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:teste-001',
  jsonb_build_object(
    'id', 'teste-001',
    'email', 'teste@sistema.ao',
    'name', 'Utilizador Teste',
    'role', 'user',
    'department', 'teste',
    'position', 'Testador',
    'phone', '+244 923 456 999',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Verificar se foi criado
SELECT * FROM kv_store WHERE key = 'user_profile:teste-001';

-- Deletar o teste
DELETE FROM kv_store WHERE key = 'user_profile:teste-001';
```

Se este teste funcionar, então o problema pode estar em:
- Sintaxe de algum utilizador específico
- Caracteres especiais nos nomes
- Estrutura do JSON

---

## ❓ QUAL FOI O ERRO EXATO?

Para ajudá-lo melhor, preciso saber:

1. **Qual foi a mensagem de erro exata?**
2. **Em que linha do SQL deu erro?**
3. **Você está executando no Supabase SQL Editor?**
4. **A tabela kv_store existe no seu banco?**

Execute este comando para verificar se a tabela existe:

```sql
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'kv_store';
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Execute o script de diagnóstico acima** para ver utilizadores atuais
2. **Me diga qual foi o erro exato** do SQL
3. **Teste com 1 utilizador** usando o script de teste
4. **Verificamos juntos** o que está a causar o problema

---

**Me envie o erro exato que apareceu e continuamos a resolver!** 🚀
