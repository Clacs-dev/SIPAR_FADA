# 🚨 PROBLEMA: NÃO CONSIGO FAZER LOGIN NOS NOVOS UTILIZADORES

## 🔍 DIAGNÓSTICO DO PROBLEMA

O problema mais comum é a **incompatibilidade de IDs** entre:
- ✅ Supabase Auth (UUID gerado automaticamente)
- ❌ KV_STORE (IDs fixos que criamos: 'compras-001' e 'motorista-001')

### O que acontece:
1. Você criou a conta no Auth → Supabase gerou UUID automático (ex: `a1b2c3d4-e5f6-...`)
2. Criamos o perfil no KV_STORE → Usamos ID fixo (`compras-001`)
3. Sistema tenta fazer login → Auth diz "UUID é a1b2c3d4..."
4. Sistema busca perfil → Procura por `user_profile:a1b2c3d4...`
5. **NÃO ENCONTRA!** Porque salvamos como `user_profile:compras-001` ❌

---

## 🔧 SOLUÇÃO EM 3 PASSOS

### PASSO 1: Descobrir os UUIDs Reais do Auth

Execute este script para descobrir os UUIDs:

```sql
-- =====================================================
-- DESCOBRIR UUIDs DOS UTILIZADORES NO AUTH
-- =====================================================

-- Ver TODOS os usuários no Auth
SELECT 
  id as uuid_real,
  email,
  created_at,
  confirmed_at
FROM auth.users
ORDER BY email;

-- Filtrar apenas compras e motorista
SELECT 
  id as uuid_real,
  email,
  '👉 COPIE ESTE UUID!' as instrucao
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;
```

**IMPORTANTE:** Copie os UUIDs que aparecerem!

---

### PASSO 2: Atualizar os Perfis com UUIDs Corretos

Depois de copiar os UUIDs, execute este script **SUBSTITUINDO** os UUIDs:

```sql
-- =====================================================
-- CORRIGIR PERFIS COM UUIDs REAIS
-- =====================================================

-- IMPORTANTE: Substitua 'UUID-COMPRAS-AQUI' e 'UUID-MOTORISTA-AQUI' 
-- pelos UUIDs reais que você copiou no PASSO 1

-- =====================================================
-- 1. DELETAR perfis antigos (com IDs errados)
-- =====================================================

DELETE FROM kv_store_8b82752b 
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001');

DELETE FROM kv_store_8b82752b 
WHERE key IN ('user_email_lookup:compras@sistema.com', 'user_email_lookup:motorista@sistema.com');

-- =====================================================
-- 2. CRIAR perfis novos com UUIDs CORRETOS
-- =====================================================

-- COMPRAS (SUBSTITUA O UUID!)
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_profile:UUID-COMPRAS-AQUI',  -- ⚠️ SUBSTITUA ESTE UUID!
  jsonb_build_object(
    'id', 'UUID-COMPRAS-AQUI',  -- ⚠️ SUBSTITUA ESTE UUID!
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
);

INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:compras@sistema.com',
  jsonb_build_object('user_id', 'UUID-COMPRAS-AQUI')  -- ⚠️ SUBSTITUA ESTE UUID!
);

-- MOTORISTA (SUBSTITUA O UUID!)
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_profile:UUID-MOTORISTA-AQUI',  -- ⚠️ SUBSTITUA ESTE UUID!
  jsonb_build_object(
    'id', 'UUID-MOTORISTA-AQUI',  -- ⚠️ SUBSTITUA ESTE UUID!
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
);

INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:motorista@sistema.com',
  jsonb_build_object('user_id', 'UUID-MOTORISTA-AQUI')  -- ⚠️ SUBSTITUA ESTE UUID!
);

-- Verificação
SELECT '✅ PERFIS ATUALIZADOS COM SUCESSO!' as resultado;

SELECT 
  value->>'email' as email,
  value->>'name' as nome,
  value->>'id' as uuid_no_perfil
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%';
```

---

### PASSO 3: Testar Login

1. Vá para o sistema
2. Tente fazer login:
   - Email: `compras@sistema.com`
   - Senha: `Compras@2026`
3. Deve funcionar! ✅

---

## ⚡ SOLUÇÃO RÁPIDA (SEMI-AUTOMÁTICA)

Se preferir, use este script que tenta corrigir automaticamente:

```sql
-- =====================================================
-- CORREÇÃO AUTOMÁTICA (Requer acesso à tabela auth.users)
-- =====================================================

-- 1. Buscar UUIDs do Auth
WITH auth_users AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
)
-- 2. Mostrar o que precisa ser feito
SELECT 
  'Para ' || email || ' use UUID: ' || id as instrucao
FROM auth_users;

-- Execute isto para ver os comandos de correção prontos:
SELECT 
  'DELETE FROM kv_store_8b82752b WHERE key = ''user_profile:' || 
  CASE email 
    WHEN 'compras@sistema.com' THEN 'compras-001'
    WHEN 'motorista@sistema.com' THEN 'motorista-001'
  END || ''';' as comando_delete,
  'INSERT INTO kv_store_8b82752b (key, value) VALUES (''user_profile:' || id || ''', ...' as comando_insert_exemplo
FROM auth.users 
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');
```

---

## 🔍 VERIFICAÇÃO APÓS CORREÇÃO

Execute isto para confirmar que está correto:

```sql
-- Verificar se os UUIDs batem
SELECT 
  'AUTH' as origem,
  au.id as uuid,
  au.email
FROM auth.users au
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')

UNION ALL

SELECT 
  'KV_STORE' as origem,
  (kv.value->>'id') as uuid,
  (kv.value->>'email') as email
FROM kv_store_8b82752b kv
WHERE kv.key LIKE 'user_profile:%'
  AND kv.value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')

ORDER BY email, origem;
```

**Os UUIDs devem ser IGUAIS** para Auth e KV_STORE! ✅

---

## 📋 CHECKLIST DE CORREÇÃO

- [ ] Executei PASSO 1 e copiei os UUIDs
- [ ] Substituí os UUIDs no script do PASSO 2
- [ ] Executei o PASSO 2 completo
- [ ] Verifiquei que os perfis foram atualizados
- [ ] Testei o login de compras@sistema.com
- [ ] Testei o login de motorista@sistema.com
- [ ] Ambos funcionam! ✅

---

## 🆘 SE AINDA NÃO FUNCIONAR

Me diga:
1. Qual é a mensagem de erro exata?
2. Executou o PASSO 1? Quais foram os UUIDs?
3. Conseguiu executar o PASSO 2?

---

**PRÓXIMO PASSO: Execute o PASSO 1 e me diga quais UUIDs apareceram!**
