-- =====================================================
-- 🔍 DIAGNÓSTICO COMPLETO - Por que o login não funciona?
-- Execute este script para descobrir o problema
-- =====================================================

SELECT '🔍 DIAGNÓSTICO COMPLETO DOS NOVOS UTILIZADORES' as titulo;

-- =====================================================
-- 1. VERIFICAR SE EXISTEM NO AUTH
-- =====================================================

SELECT '1️⃣ VERIFICAR EXISTÊNCIA NO AUTH' as secao;

SELECT 
  email as "Email",
  id as "UUID",
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmado'
    ELSE '❌ Email NÃO confirmado'
  END as "Email Confirmado?",
  CASE 
    WHEN banned_until IS NULL THEN '✅ Não banido'
    ELSE '❌ BANIDO até ' || banned_until
  END as "Status Banimento",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as "Criado em",
  TO_CHAR(last_sign_in_at, 'DD/MM/YYYY HH24:MI') as "Último Login",
  raw_app_meta_data as "Metadata",
  raw_user_meta_data as "User Metadata"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;

-- =====================================================
-- 2. VERIFICAR SENHA (se foi definida)
-- =====================================================

SELECT '' as separador;
SELECT '2️⃣ VERIFICAR SE SENHA FOI DEFINIDA' as secao;

SELECT 
  email as "Email",
  CASE 
    WHEN encrypted_password IS NOT NULL AND encrypted_password != '' 
    THEN '✅ Senha Definida'
    ELSE '❌ SEM SENHA!'
  END as "Status Senha",
  CASE 
    WHEN encrypted_password IS NOT NULL 
    THEN '🔒 Senha encriptada existe (' || length(encrypted_password) || ' chars)'
    ELSE '⚠️ Nenhuma senha definida'
  END as "Detalhes"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;

-- =====================================================
-- 3. VERIFICAR SE EXISTEM NO KV_STORE
-- =====================================================

SELECT '' as separador;
SELECT '3️⃣ VERIFICAR PERFIS NO KV_STORE' as secao;

SELECT 
  value->>'email' as "Email",
  value->>'id' as "UUID no Perfil",
  value->>'name' as "Nome",
  value->>'role' as "Role",
  value->>'department' as "Departamento",
  value->>'status' as "Status",
  key as "Chave no KV"
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- 4. COMPARAR UUIDs (Auth vs KV_STORE)
-- =====================================================

SELECT '' as separador;
SELECT '4️⃣ COMPARAR UUIDs (DEVEM SER IGUAIS)' as secao;

SELECT 
  au.email as "Email",
  au.id::text as "UUID no Auth",
  kv.value->>'id' as "UUID no KV_STORE",
  CASE 
    WHEN au.id::text = kv.value->>'id' THEN '✅ IGUAIS - OK'
    WHEN kv.value->>'id' IS NULL THEN '❌ Perfil não existe no KV_STORE'
    ELSE '❌ DIFERENTES - Problema!'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.value->>'email' = au.email 
  AND kv.key LIKE 'user_profile:%'
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- 5. VERIFICAR EMAIL LOOKUPS
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
)
ORDER BY key;

-- =====================================================
-- 6. TESTAR SE OS 6 UTILIZADORES ORIGINAIS FUNCIONAM
-- =====================================================

SELECT '' as separador;
SELECT '6️⃣ COMPARAR COM UTILIZADORES QUE FUNCIONAM' as secao;

SELECT 
  au.email as "Email",
  CASE 
    WHEN au.email IN ('compras@sistema.com', 'motorista@sistema.com') THEN '⭐ NOVO'
    ELSE '✅ Original'
  END as "Tipo",
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN '✅ Senha'
    ELSE '❌ Sem senha'
  END as "Senha",
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email OK'
    ELSE '❌ Email não confirmado'
  END as "Email",
  CASE 
    WHEN kv.value->>'id' IS NOT NULL THEN '✅ Perfil'
    ELSE '❌ Sem perfil'
  END as "Perfil KV"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.value->>'email' = au.email 
  AND kv.key LIKE 'user_profile:%'
WHERE au.email IN (
  'admin@sistema.com',
  'compras@sistema.com',
  'motorista@sistema.com'
)
ORDER BY au.email;

-- =====================================================
-- 7. VERIFICAR IDENTITIES
-- =====================================================

SELECT '' as separador;
SELECT '7️⃣ VERIFICAR IDENTITIES (AUTH PROVIDERS)' as secao;

SELECT 
  u.email as "Email",
  i.provider as "Provider",
  i.identity_data as "Identity Data",
  TO_CHAR(i.created_at, 'DD/MM/YYYY HH24:MI') as "Criado em"
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE u.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY u.email;

-- =====================================================
-- 8. RESUMO DO PROBLEMA
-- =====================================================

SELECT '' as separador;
SELECT '📊 RESUMO - O QUE ESTÁ ERRADO?' as secao;

WITH diagnostico AS (
  SELECT 
    au.email,
    CASE WHEN au.encrypted_password IS NOT NULL THEN 1 ELSE 0 END as tem_senha,
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN 1 ELSE 0 END as email_confirmado,
    CASE WHEN kv.value->>'id' IS NOT NULL THEN 1 ELSE 0 END as tem_perfil,
    CASE WHEN au.id::text = kv.value->>'id' THEN 1 ELSE 0 END as uuid_bate,
    CASE WHEN lookup.value->>'user_id' IS NOT NULL THEN 1 ELSE 0 END as tem_lookup
  FROM auth.users au
  LEFT JOIN kv_store_8b82752b kv 
    ON kv.value->>'email' = au.email 
    AND kv.key LIKE 'user_profile:%'
  LEFT JOIN kv_store_8b82752b lookup 
    ON lookup.key = 'user_email_lookup:' || au.email
  WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
)
SELECT 
  email as "Email",
  CASE WHEN tem_senha = 1 THEN '✅' ELSE '❌' END as "Senha",
  CASE WHEN email_confirmado = 1 THEN '✅' ELSE '❌' END as "Email Confirmado",
  CASE WHEN tem_perfil = 1 THEN '✅' ELSE '❌' END as "Perfil",
  CASE WHEN uuid_bate = 1 THEN '✅' ELSE '❌' END as "UUID Bate",
  CASE WHEN tem_lookup = 1 THEN '✅' ELSE '❌' END as "Lookup",
  CASE 
    WHEN tem_senha = 0 THEN '❌ FALTA SENHA'
    WHEN email_confirmado = 0 THEN '❌ EMAIL NÃO CONFIRMADO'
    WHEN tem_perfil = 0 THEN '❌ FALTA PERFIL'
    WHEN uuid_bate = 0 THEN '❌ UUID INCOMPATÍVEL'
    WHEN tem_lookup = 0 THEN '❌ FALTA LOOKUP'
    ELSE '✅ TUDO OK'
  END as "PROBLEMA"
FROM diagnostico;

-- =====================================================
-- 9. SUGESTÃO DE CORREÇÃO
-- =====================================================

SELECT '' as separador;
SELECT '💡 SUGESTÃO DE CORREÇÃO' as secao;

SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
      AND encrypted_password IS NOT NULL
    ) THEN 'As contas não têm senha definida. Execute: CORRECAO-1-DEFINIR-SENHAS.sql'
    
    WHEN NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
      AND email_confirmed_at IS NOT NULL
    ) THEN 'Os emails não estão confirmados. Execute: CORRECAO-2-CONFIRMAR-EMAILS.sql'
    
    WHEN NOT EXISTS (
      SELECT 1 FROM kv_store_8b82752b 
      WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
      AND key LIKE 'user_profile:%'
    ) THEN 'Os perfis não existem no KV_STORE. Execute: CORRECAO-3-CRIAR-PERFIS.sql'
    
    ELSE 'Tudo parece OK. O problema pode estar no frontend. Verifique o console do browser.'
  END as "Próximo Passo";

-- =====================================================
-- FIM DO DIAGNÓSTICO
-- =====================================================

SELECT '' as separador;
SELECT '✅ DIAGNÓSTICO COMPLETO' as resultado;
SELECT 'Analise os resultados acima e identifique o problema' as instrucao;
