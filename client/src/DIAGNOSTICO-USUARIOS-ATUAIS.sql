-- =====================================================
-- DIAGNÓSTICO COMPLETO - UTILIZADORES ATUAIS
-- Execute este script para entender o estado atual
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE A TABELA KV_STORE EXISTE
-- =====================================================
SELECT 
  '✅ TABELA KV_STORE' as verificacao,
  table_name as nome_tabela,
  table_schema as schema
FROM information_schema.tables 
WHERE table_name = 'kv_store';

-- =====================================================
-- 2. TOTAL DE UTILIZADORES NO SISTEMA
-- =====================================================
SELECT 
  '📊 TOTAL DE UTILIZADORES' as verificacao,
  COUNT(*) as total_utilizadores
FROM kv_store 
WHERE key LIKE 'user_profile:%';

-- =====================================================
-- 3. LISTAR TODOS OS UTILIZADORES
-- =====================================================
SELECT 
  '👥 LISTA COMPLETA DE UTILIZADORES' as secao,
  ROW_NUMBER() OVER (ORDER BY value->>'email') as numero,
  key as chave_kv,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role,
  value->>'department' as departamento,
  value->>'position' as cargo,
  value->>'phone' as telefone,
  value->>'status' as status,
  value->>'created_at' as criado_em
FROM kv_store 
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- 4. DISTRIBUIÇÃO POR ROLE
-- =====================================================
SELECT 
  '📊 UTILIZADORES POR ROLE' as secao,
  value->>'role' as role,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:%'), 1) as percentagem
FROM kv_store 
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'role'
ORDER BY quantidade DESC;

-- =====================================================
-- 5. DISTRIBUIÇÃO POR DEPARTAMENTO
-- =====================================================
SELECT 
  '🏢 UTILIZADORES POR DEPARTAMENTO' as secao,
  COALESCE(value->>'department', 'SEM DEPARTAMENTO') as departamento,
  COUNT(*) as quantidade,
  string_agg(value->>'email', ', ' ORDER BY value->>'email') as emails
FROM kv_store 
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'department'
ORDER BY quantidade DESC;

-- =====================================================
-- 6. VERIFICAR LOOKUPS DE EMAIL
-- =====================================================
SELECT 
  '🔍 LOOKUPS DE EMAIL' as secao,
  COUNT(*) as total_lookups
FROM kv_store 
WHERE key LIKE 'user_email_lookup:%';

-- Detalhes dos lookups
SELECT 
  '📧 DETALHES DOS LOOKUPS' as secao,
  key as lookup_key,
  value as user_id_reference
FROM kv_store 
WHERE key LIKE 'user_email_lookup:%'
ORDER BY key
LIMIT 10;

-- =====================================================
-- 7. VERIFICAR PERFIS MÚLTIPLOS (se existir)
-- =====================================================
SELECT 
  '🎭 UTILIZADORES COM PERFIS MÚLTIPLOS' as secao,
  value->>'email' as email,
  value->>'name' as nome,
  value->'profiles' as perfis
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND value ? 'profiles'
ORDER BY value->>'email';

-- =====================================================
-- 8. UTILIZADORES SEM DEPARTAMENTO
-- =====================================================
SELECT 
  '⚠️ UTILIZADORES SEM DEPARTAMENTO' as secao,
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND (value->>'department' IS NULL OR value->>'department' = '')
ORDER BY value->>'email';

-- =====================================================
-- 9. UTILIZADORES CRIADOS RECENTEMENTE (últimos 7 dias)
-- =====================================================
SELECT 
  '🆕 UTILIZADORES RECENTES (7 dias)' as secao,
  value->>'email' as email,
  value->>'name' as nome,
  value->>'created_at' as criado_em
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND (value->>'created_at')::timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY (value->>'created_at')::timestamp DESC;

-- =====================================================
-- 10. VERIFICAR ESTRUTURA DE UM UTILIZADOR (exemplo)
-- =====================================================
SELECT 
  '🔬 ESTRUTURA COMPLETA DE 1 UTILIZADOR (EXEMPLO)' as secao,
  key,
  jsonb_pretty(value) as estrutura_json
FROM kv_store 
WHERE key LIKE 'user_profile:%'
ORDER BY key
LIMIT 1;

-- =====================================================
-- 11. VERIFICAR TODAS AS CHAVES NO KV_STORE
-- =====================================================
SELECT 
  '🔑 TIPOS DE CHAVES NO KV_STORE' as secao,
  CASE 
    WHEN key LIKE 'user_profile:%' THEN 'user_profile'
    WHEN key LIKE 'user_email_lookup:%' THEN 'user_email_lookup'
    WHEN key LIKE 'presentation:%' THEN 'presentation'
    WHEN key LIKE 'audience:%' THEN 'audience'
    WHEN key LIKE 'acta:%' THEN 'acta'
    WHEN key LIKE 'oficio:%' THEN 'oficio'
    WHEN key LIKE 'factura:%' THEN 'factura'
    WHEN key LIKE 'viatura:%' THEN 'viatura'
    ELSE 'outro'
  END as tipo_chave,
  COUNT(*) as quantidade
FROM kv_store
GROUP BY tipo_chave
ORDER BY quantidade DESC;

-- =====================================================
-- 12. RESUMO GERAL DO SISTEMA
-- =====================================================
SELECT 
  '📋 RESUMO GERAL' as info,
  'Total de Registos no KV_STORE' as metrica,
  COUNT(*) as valor
FROM kv_store
UNION ALL
SELECT 
  '📋 RESUMO GERAL',
  'Total de Utilizadores',
  COUNT(*)
FROM kv_store 
WHERE key LIKE 'user_profile:%'
UNION ALL
SELECT 
  '📋 RESUMO GERAL',
  'Total de Lookups de Email',
  COUNT(*)
FROM kv_store 
WHERE key LIKE 'user_email_lookup:%'
UNION ALL
SELECT 
  '📋 RESUMO GERAL',
  'Utilizadores Admin',
  COUNT(*)
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND value->>'role' = 'admin'
UNION ALL
SELECT 
  '📋 RESUMO GERAL',
  'Utilizadores Attendant',
  COUNT(*)
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND value->>'role' = 'attendant'
UNION ALL
SELECT 
  '📋 RESUMO GERAL',
  'Utilizadores User',
  COUNT(*)
FROM kv_store 
WHERE key LIKE 'user_profile:%'
  AND value->>'role' = 'user';

-- =====================================================
-- FIM DO DIAGNÓSTICO
-- =====================================================
