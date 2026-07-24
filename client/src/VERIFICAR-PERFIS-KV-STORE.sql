-- =====================================================
-- 🔍 VERIFICAR PERFIS NO KV_STORE
-- Descubra se os perfis existem com as chaves corretas
-- =====================================================

SELECT '🔍 VERIFICAÇÃO COMPLETA DOS PERFIS NO KV_STORE' as titulo;

-- =====================================================
-- 1. VERIFICAR TODOS OS PERFIS
-- =====================================================

SELECT '1️⃣ TODOS OS PERFIS NO KV_STORE' as secao;

SELECT 
  key as "Chave no KV_STORE",
  value->>'id' as "ID no Perfil",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- 2. VERIFICAR SE AS CHAVES BATEM COM OS UUIDs DO AUTH
-- =====================================================

SELECT '' as separador;
SELECT '2️⃣ VERIFICAR SE CHAVES ESTÃO CORRETAS' as secao;

SELECT 
  au.email as "Email",
  au.id as "UUID no Auth",
  'user_profile:' || au.id as "Chave Esperada",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM kv_store_8b82752b 
      WHERE key = 'user_profile:' || au.id::text
    ) THEN '✅ Chave EXISTE'
    ELSE '❌ Chave NÃO EXISTE!'
  END as "Status Chave",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM kv_store_8b82752b 
      WHERE value->>'email' = au.email
      AND key LIKE 'user_profile:%'
    ) THEN '✅ Perfil existe (mas chave pode estar errada)'
    ELSE '❌ Perfil NÃO existe'
  END as "Status Perfil"
FROM auth.users au
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- 3. LISTAR PERFIS DOS 2 NOVOS (se existirem)
-- =====================================================

SELECT '' as separador;
SELECT '3️⃣ PERFIS DOS NOVOS UTILIZADORES (se existirem)' as secao;

SELECT 
  key as "Chave Real",
  value->>'id' as "ID no Perfil",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role",
  value->>'department' as "Departamento"
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%';

-- =====================================================
-- 4. COMPARAR: O QUE O AUTH ESPERA vs O QUE EXISTE
-- =====================================================

SELECT '' as separador;
SELECT '4️⃣ COMPARAÇÃO: Auth vs KV_STORE' as secao;

SELECT 
  au.email as "Email",
  'user_profile:' || au.id::text as "Chave que o Sistema Procura",
  (SELECT key FROM kv_store_8b82752b 
   WHERE value->>'email' = au.email 
   AND key LIKE 'user_profile:%' 
   LIMIT 1) as "Chave que Realmente Existe",
  CASE 
    WHEN 'user_profile:' || au.id::text = (
      SELECT key FROM kv_store_8b82752b 
      WHERE value->>'email' = au.email 
      AND key LIKE 'user_profile:%' 
      LIMIT 1
    ) THEN '✅ MATCH!'
    ELSE '❌ NÃO BATE! Este é o problema!'
  END as "Resultado"
FROM auth.users au
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- 5. VERIFICAR LOOKUPS
-- =====================================================

SELECT '' as separador;
SELECT '5️⃣ VERIFICAR EMAIL LOOKUPS' as secao;

SELECT 
  key as "Chave Lookup",
  value->>'user_id' as "User ID",
  CASE 
    WHEN value->>'user_id' IS NOT NULL THEN '✅ Lookup OK'
    ELSE '❌ Lookup vazio'
  END as "Status"
FROM kv_store_8b82752b
WHERE key IN (
  'user_email_lookup:compras@sistema.com',
  'user_email_lookup:motorista@sistema.com'
);

-- =====================================================
-- 6. COMPARAR COM UTILIZADOR QUE FUNCIONA
-- =====================================================

SELECT '' as separador;
SELECT '6️⃣ COMPARAR COM ADMIN (que funciona)' as secao;

-- Admin (funciona)
SELECT 
  'ADMIN (funciona)' as tipo,
  au.email as email,
  au.id as uuid_auth,
  kv.key as chave_kv,
  kv.value->>'id' as id_perfil,
  CASE 
    WHEN 'user_profile:' || au.id::text = kv.key THEN '✅ Correto'
    ELSE '❌ Errado'
  END as status
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.value->>'email' = au.email 
  AND kv.key LIKE 'user_profile:%'
WHERE au.email = 'admin@sistema.com'

UNION ALL

-- Compras (não funciona)
SELECT 
  'COMPRAS (não funciona)' as tipo,
  au.email as email,
  au.id as uuid_auth,
  kv.key as chave_kv,
  kv.value->>'id' as id_perfil,
  CASE 
    WHEN 'user_profile:' || au.id::text = kv.key THEN '✅ Correto'
    ELSE '❌ Errado'
  END as status
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.value->>'email' = au.email 
  AND kv.key LIKE 'user_profile:%'
WHERE au.email = 'compras@sistema.com'

UNION ALL

-- Motorista (não funciona)
SELECT 
  'MOTORISTA (não funciona)' as tipo,
  au.email as email,
  au.id as uuid_auth,
  kv.key as chave_kv,
  kv.value->>'id' as id_perfil,
  CASE 
    WHEN 'user_profile:' || au.id::text = kv.key THEN '✅ Correto'
    ELSE '❌ Errado'
  END as status
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.value->>'email' = au.email 
  AND kv.key LIKE 'user_profile:%'
WHERE au.email = 'motorista@sistema.com';

-- =====================================================
-- 7. DIAGNÓSTICO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '📊 DIAGNÓSTICO FINAL' as secao;

SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM auth.users au
      INNER JOIN kv_store_8b82752b kv 
        ON kv.key = 'user_profile:' || au.id::text
      WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
    ) THEN '❌ PROBLEMA ENCONTRADO: As chaves no KV_STORE não batem com os UUIDs do Auth!'
    ELSE '✅ Chaves estão corretas'
  END as problema,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM auth.users au
      INNER JOIN kv_store_8b82752b kv 
        ON kv.key = 'user_profile:' || au.id::text
      WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
    ) THEN 'Execute: CORRECAO-FINAL-PERFIS.sql para corrigir'
    ELSE 'Tudo OK. Se ainda não funciona, o problema está no frontend.'
  END as solucao;

-- =====================================================
-- FIM DA VERIFICAÇÃO
-- =====================================================

SELECT '' as separador;
SELECT '✅ VERIFICAÇÃO COMPLETA' as resultado;
