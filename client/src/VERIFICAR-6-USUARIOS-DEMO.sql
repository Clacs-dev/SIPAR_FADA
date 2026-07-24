-- =====================================================
-- VERIFICAÇÃO COMPLETA DOS 6 UTILIZADORES DEMO
-- Execute este script para ver onde estão localizados
-- =====================================================

-- =====================================================
-- 1. RESUMO RÁPIDO
-- =====================================================
SELECT '📊 RESUMO DOS 6 UTILIZADORES DEMO' as info;

SELECT 
  'Total de Utilizadores Demo Esperados' as metrica,
  6 as esperado,
  COUNT(*) as encontrado,
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ TODOS PRESENTES'
    WHEN COUNT(*) < 6 THEN '⚠️ FALTAM ' || (6 - COUNT(*))::text || ' UTILIZADORES'
    ELSE '⚠️ MAIS QUE 6 ENCONTRADOS'
  END as status
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' IN (
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao'
  );

-- =====================================================
-- 2. CHECKLIST INDIVIDUAL
-- =====================================================
SELECT '✅ CHECKLIST - VERIFICAR CADA UTILIZADOR' as info;

SELECT 
  '1️⃣ ADMIN@SISTEMA.COM' as utilizador,
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END as status,
  MAX(value->>'name') as nome,
  MAX(value->>'role') as role,
  MAX(value->>'department') as departamento
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'admin@sistema.com'

UNION ALL

SELECT 
  '2️⃣ ATENDENTE@SISTEMA.COM',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END,
  MAX(value->>'name'),
  MAX(value->>'role'),
  MAX(value->>'department')
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'atendente@sistema.com'

UNION ALL

SELECT 
  '3️⃣ USUARIO@EMPRESA.COM',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END,
  MAX(value->>'name'),
  MAX(value->>'role'),
  MAX(value->>'department')
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'usuario@empresa.com'

UNION ALL

SELECT 
  '4️⃣ GERENTE@SISTEMA.AO',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END,
  MAX(value->>'name'),
  MAX(value->>'role'),
  MAX(value->>'department')
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'gerente@sistema.ao'

UNION ALL

SELECT 
  '5️⃣ FINANCEIRO@SISTEMA.AO',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END,
  MAX(value->>'name'),
  MAX(value->>'role'),
  MAX(value->>'department')
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'financeiro@sistema.ao'

UNION ALL

SELECT 
  '6️⃣ OPERADOR@SISTEMA.AO',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END,
  MAX(value->>'name'),
  MAX(value->>'role'),
  MAX(value->>'department')
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'operador@sistema.ao';

-- =====================================================
-- 3. LISTAGEM COMPLETA DOS 6 UTILIZADORES
-- =====================================================
SELECT '📋 DETALHES COMPLETOS DOS 6 UTILIZADORES' as info;

SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    CASE value->>'email'
      WHEN 'admin@sistema.com' THEN 1
      WHEN 'atendente@sistema.com' THEN 2
      WHEN 'usuario@empresa.com' THEN 3
      WHEN 'gerente@sistema.ao' THEN 4
      WHEN 'financeiro@sistema.ao' THEN 5
      WHEN 'operador@sistema.ao' THEN 6
    END
  ) as "#",
  key as chave_kv,
  value->>'id' as user_id,
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo",
  value->>'created_at' as "📅 Criado Em"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' IN (
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao'
  )
ORDER BY 
  CASE value->>'email'
    WHEN 'admin@sistema.com' THEN 1
    WHEN 'atendente@sistema.com' THEN 2
    WHEN 'usuario@empresa.com' THEN 3
    WHEN 'gerente@sistema.ao' THEN 4
    WHEN 'financeiro@sistema.ao' THEN 5
    WHEN 'operador@sistema.ao' THEN 6
  END;

-- =====================================================
-- 4. DISTRIBUIÇÃO POR ROLE
-- =====================================================
SELECT '📊 DISTRIBUIÇÃO POR ROLE' as info;

SELECT 
  value->>'role' as "🎭 Role",
  COUNT(*) as "Quantidade",
  string_agg(value->>'email', ', ' ORDER BY value->>'email') as "📧 Emails"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' IN (
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao'
  )
GROUP BY value->>'role'
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 5. VERIFICAR LOOKUPS DE EMAIL
-- =====================================================
SELECT '🔍 LOOKUPS DE EMAIL DOS 6 UTILIZADORES' as info;

SELECT 
  key as lookup_key,
  value as user_id_reference
FROM kv_store_8b82752b
WHERE key IN (
  'user_email_lookup:admin@sistema.com',
  'user_email_lookup:atendente@sistema.com',
  'user_email_lookup:usuario@empresa.com',
  'user_email_lookup:gerente@sistema.ao',
  'user_email_lookup:financeiro@sistema.ao',
  'user_email_lookup:operador@sistema.ao'
)
ORDER BY key;

-- =====================================================
-- 6. ESTRUTURA COMPLETA DE 1 UTILIZADOR (EXEMPLO)
-- =====================================================
SELECT '🔬 ESTRUTURA JSON COMPLETA (EXEMPLO: ADMIN)' as info;

SELECT 
  key as chave,
  jsonb_pretty(value) as estrutura_json_completa
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'admin@sistema.com'
LIMIT 1;

-- =====================================================
-- 7. COMPARAÇÃO: ESPERADO vs ENCONTRADO
-- =====================================================
SELECT '📊 COMPARAÇÃO FINAL' as info;

WITH esperados AS (
  SELECT unnest(ARRAY[
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao'
  ]) as email
),
encontrados AS (
  SELECT value->>'email' as email
  FROM kv_store_8b82752b
  WHERE key LIKE 'user_profile:%'
)
SELECT 
  e.email as "📧 Email Esperado",
  CASE 
    WHEN f.email IS NOT NULL THEN '✅ Encontrado'
    ELSE '❌ FALTA CRIAR'
  END as status
FROM esperados e
LEFT JOIN encontrados f ON e.email = f.email
ORDER BY e.email;

-- =====================================================
-- FIM DA VERIFICAÇÃO
-- =====================================================

SELECT '✅ VERIFICAÇÃO COMPLETA FINALIZADA!' as resultado;
