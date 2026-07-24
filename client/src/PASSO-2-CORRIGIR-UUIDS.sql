-- =====================================================
-- 🔧 PASSO 2: CORRIGIR UUIDs DOS UTILIZADORES
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Execute PRIMEIRO o arquivo PASSO-1-DESCOBRIR-UUIDS.sql
-- 2. Copie os UUIDs que aparecerem
-- 3. SUBSTITUA abaixo onde está escrito:
--    - 'UUID-COMPRAS-AQUI'
--    - 'UUID-MOTORISTA-AQUI'
-- 4. Execute TODO este script
--
-- =====================================================

-- =====================================================
-- EXEMPLO DE COMO SUBSTITUIR:
-- =====================================================
-- Se o UUID for: a1b2c3d4-e5f6-7890-1234-567890abcdef
-- Substitua: 'UUID-COMPRAS-AQUI'
-- Por: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
-- =====================================================

BEGIN;

-- =====================================================
-- 1. DELETAR PERFIS ANTIGOS (com IDs errados)
-- =====================================================

SELECT '🗑️ DELETANDO PERFIS ANTIGOS...' as status;

DELETE FROM kv_store_8b82752b 
WHERE key IN (
  'user_profile:compras-001', 
  'user_profile:motorista-001'
);

DELETE FROM kv_store_8b82752b 
WHERE key IN (
  'user_email_lookup:compras@sistema.com', 
  'user_email_lookup:motorista@sistema.com'
);

SELECT '✅ Perfis antigos deletados' as resultado;

-- =====================================================
-- 2. CRIAR PERFIL COMPRAS COM UUID CORRETO
-- =====================================================

SELECT '📝 CRIANDO PERFIL COMPRAS COM UUID CORRETO...' as status;

-- ⚠️⚠️⚠️ SUBSTITUA 'UUID-COMPRAS-AQUI' PELO UUID REAL! ⚠️⚠️⚠️
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_profile:UUID-COMPRAS-AQUI',  -- ⚠️ SUBSTITUA!
  jsonb_build_object(
    'id', 'UUID-COMPRAS-AQUI',  -- ⚠️ SUBSTITUA!
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

-- Lookup
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:compras@sistema.com',
  jsonb_build_object('user_id', 'UUID-COMPRAS-AQUI')  -- ⚠️ SUBSTITUA!
);

SELECT '✅ Perfil COMPRAS criado' as resultado;

-- =====================================================
-- 3. CRIAR PERFIL MOTORISTA COM UUID CORRETO
-- =====================================================

SELECT '📝 CRIANDO PERFIL MOTORISTA COM UUID CORRETO...' as status;

-- ⚠️⚠️⚠️ SUBSTITUA 'UUID-MOTORISTA-AQUI' PELO UUID REAL! ⚠️⚠️⚠️
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_profile:UUID-MOTORISTA-AQUI',  -- ⚠️ SUBSTITUA!
  jsonb_build_object(
    'id', 'UUID-MOTORISTA-AQUI',  -- ⚠️ SUBSTITUA!
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

-- Lookup
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:motorista@sistema.com',
  jsonb_build_object('user_id', 'UUID-MOTORISTA-AQUI')  -- ⚠️ SUBSTITUA!
);

SELECT '✅ Perfil MOTORISTA criado' as resultado;

-- =====================================================
-- 4. VERIFICAÇÃO AUTOMÁTICA
-- =====================================================

SELECT '🔍 VERIFICANDO SE OS UUIDs ESTÃO CORRETOS...' as status;

-- Comparar Auth vs KV_STORE
SELECT 
  au.email as "Email",
  au.id as "UUID no Auth",
  kv.value->>'id' as "UUID no KV_STORE",
  CASE 
    WHEN au.id::text = kv.value->>'id' THEN '✅ CORRETO'
    WHEN kv.value->>'id' LIKE 'UUID-%' THEN '❌ VOCÊ ESQUECEU DE SUBSTITUIR O UUID!'
    ELSE '❌ UUIDs NÃO BATEM'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.value->>'email' = au.email 
  AND kv.key LIKE 'user_profile:%'
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- 5. CONFIRMAR CORREÇÃO
-- =====================================================

SELECT '📊 PERFIS CORRIGIDOS:' as secao;

SELECT 
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'id' as "UUID",
  value->>'department' as "Departamento"
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%'
ORDER BY value->>'email';

COMMIT;

-- =====================================================
-- ✅ CONCLUSÃO
-- =====================================================

SELECT '✅ CORREÇÃO CONCLUÍDA!' as resultado;
SELECT 'Agora tente fazer login com:' as proximos_passos;
SELECT 'compras@sistema.com / Compras@2026' as credencial_1;
SELECT 'motorista@sistema.com / Motorista@2026' as credencial_2;
