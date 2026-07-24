-- =====================================================
-- 🔍 DIAGNÓSTICO RÁPIDO - O que aconteceu?
-- =====================================================

SELECT '🔍 DIAGNÓSTICO RÁPIDO - Verificando o que falhou' as titulo;

-- =====================================================
-- 1. VERIFICAR SE EXISTEM NO AUTH
-- =====================================================

SELECT '' as separador;
SELECT '1️⃣ VERIFICANDO AUTH.USERS' as secao;

SELECT 
  email as "Email",
  id as "UUID",
  CASE WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado' ELSE '❌ NÃO confirmado' END as "Email Status",
  CASE WHEN encrypted_password IS NOT NULL AND encrypted_password != '' THEN '✅ Tem senha' ELSE '❌ SEM senha' END as "Senha Status",
  created_at as "Criado em"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;

-- Contar quantos existem
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ PROBLEMA: Nenhum utilizador existe no Auth'
    WHEN COUNT(*) = 1 THEN '⚠️ ATENÇÃO: Só 1 utilizador existe no Auth'
    WHEN COUNT(*) = 2 THEN '✅ OK: Ambos existem no Auth'
    ELSE '❓ ESTRANHO: Mais de 2 encontrados'
  END as resultado_auth
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');

-- =====================================================
-- 2. VERIFICAR SE PERFIS EXISTEM NO KV_STORE
-- =====================================================

SELECT '' as separador;
SELECT '2️⃣ VERIFICANDO KV_STORE' as secao;

-- Buscar por email
SELECT 
  key as "Chave",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'department' as "Departamento",
  value->>'position' as "Posição"
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
AND key LIKE 'user_profile:%';

-- Contar quantos existem
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ PROBLEMA: Nenhum perfil existe no KV_STORE'
    WHEN COUNT(*) = 1 THEN '⚠️ ATENÇÃO: Só 1 perfil existe no KV_STORE'
    WHEN COUNT(*) = 2 THEN '✅ OK: Ambos os perfis existem no KV_STORE'
    ELSE '❓ ESTRANHO: Mais de 2 perfis encontrados'
  END as resultado_kv
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
AND key LIKE 'user_profile:%';

-- =====================================================
-- 3. VERIFICAR SE CHAVES ESTÃO CORRETAS (UUID match)
-- =====================================================

SELECT '' as separador;
SELECT '3️⃣ VERIFICANDO SE CHAVES BATEM (Auth UUID = KV_STORE key)' as secao;

SELECT 
  au.email as "Email",
  au.id as "UUID no Auth",
  'user_profile:' || au.id::text as "Chave esperada",
  kv.key as "Chave real no KV_STORE",
  CASE 
    WHEN kv.key IS NULL THEN '❌ Perfil NÃO EXISTE no KV_STORE'
    WHEN 'user_profile:' || au.id::text = kv.key THEN '✅ CORRETO'
    ELSE '❌ CHAVE ERRADA'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.key = 'user_profile:' || au.id::text
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- 4. VERIFICAR LOOKUPS
-- =====================================================

SELECT '' as separador;
SELECT '4️⃣ VERIFICANDO LOOKUPS (email → user_id)' as secao;

SELECT 
  au.email as "Email",
  au.id::text as "UUID Real",
  lookup.value->>'user_id' as "User ID no Lookup",
  CASE 
    WHEN lookup.value IS NULL THEN '❌ Lookup NÃO EXISTE'
    WHEN au.id::text = lookup.value->>'user_id' THEN '✅ CORRETO'
    ELSE '❌ Lookup COM ID ERRADO'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b lookup 
  ON lookup.key = 'user_email_lookup:' || au.email
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- 5. BUSCAR TODOS OS PERFIS COM ESSES EMAILS (mesmo com chave errada)
-- =====================================================

SELECT '' as separador;
SELECT '5️⃣ BUSCANDO TODOS OS PERFIS COM ESSES EMAILS (qualquer chave)' as secao;

SELECT 
  key as "Chave",
  value->>'id' as "ID no JSON",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  CASE 
    WHEN key LIKE 'user_profile:00000000-%' THEN '❌ UUID FIXO (ERRADO!)'
    WHEN key LIKE 'user_profile:%' THEN '✅ Parece correto'
    ELSE '❓ Chave estranha'
  END as "Tipo de Chave"
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com');

-- =====================================================
-- 6. BUSCAR TODOS OS LOOKUPS COM ESSES EMAILS
-- =====================================================

SELECT '' as separador;
SELECT '6️⃣ BUSCANDO TODOS OS LOOKUPS COM ESSES EMAILS' as secao;

SELECT 
  key as "Chave Lookup",
  value->>'user_id' as "User ID",
  CASE 
    WHEN value->>'user_id' LIKE '00000000-%' THEN '❌ UUID FIXO (ERRADO!)'
    ELSE '✅ Parece UUID real'
  END as "Tipo de UUID"
FROM kv_store_8b82752b
WHERE key IN (
  'user_email_lookup:compras@sistema.com',
  'user_email_lookup:motorista@sistema.com'
);

-- =====================================================
-- 7. DIAGNÓSTICO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '📊 DIAGNÓSTICO FINAL' as secao;

WITH auth_check AS (
  SELECT COUNT(*) as auth_count
  FROM auth.users
  WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
),
kv_check AS (
  SELECT COUNT(*) as kv_count
  FROM kv_store_8b82752b
  WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%'
),
match_check AS (
  SELECT COUNT(*) as match_count
  FROM auth.users au
  INNER JOIN kv_store_8b82752b kv 
    ON kv.key = 'user_profile:' || au.id::text
  WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
)
SELECT 
  auth_check.auth_count as "Quantos no Auth",
  kv_check.kv_count as "Quantos no KV_STORE",
  match_check.match_count as "Quantos com chave CORRETA",
  CASE 
    WHEN auth_check.auth_count = 0 THEN '❌ PASSO 1 NÃO FOI EXECUTADO - Precisa criar no Dashboard'
    WHEN auth_check.auth_count > 0 AND kv_check.kv_count = 0 THEN '❌ PASSO 2 NÃO FOI EXECUTADO - Precisa executar o SQL'
    WHEN kv_check.kv_count > 0 AND match_check.match_count = 0 THEN '❌ CHAVES ERRADAS - Perfis criados com UUID fixo'
    WHEN match_check.match_count = 2 THEN '✅ TUDO CORRETO - Problema deve ser outro'
    ELSE '⚠️ SITUAÇÃO PARCIAL - Verifique detalhes acima'
  END as "Diagnóstico"
FROM auth_check, kv_check, match_check;

-- =====================================================
-- 8. MENSAGEM FINAL
-- =====================================================

SELECT '' as separador;
SELECT '💡 PRÓXIMOS PASSOS (baseado no diagnóstico acima):' as titulo;
SELECT '' as separador;
SELECT 'Se "Diagnóstico" diz:' as instrucao;
SELECT '' as separador;
SELECT '❌ PASSO 1 NÃO FOI EXECUTADO → Crie os utilizadores no Dashboard (Authentication → Users)' as opcao_1;
SELECT '' as separador;
SELECT '❌ PASSO 2 NÃO FOI EXECUTADO → Execute o script CRIAR-2-USUARIOS-CORRETO.sql' as opcao_2;
SELECT '' as separador;
SELECT '❌ CHAVES ERRADAS → Execute o script de CORREÇÃO que vou criar agora' as opcao_3;
SELECT '' as separador;
SELECT '✅ TUDO CORRETO → Problema está no login. Me diga o erro exato que aparece' as opcao_4;
