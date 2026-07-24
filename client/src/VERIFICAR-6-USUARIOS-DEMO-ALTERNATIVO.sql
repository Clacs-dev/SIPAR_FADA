-- =====================================================
-- VERIFICAÇÃO DOS 6 UTILIZADORES DEMO (ALTERNATIVO)
-- Use este script se a tabela for apenas "kv_store"
-- (sem o sufixo _8b82752b)
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
FROM kv_store
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
-- 2. LISTAGEM COMPLETA DOS 6 UTILIZADORES
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
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo"
FROM kv_store
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
-- 3. CHECKLIST INDIVIDUAL
-- =====================================================
SELECT '✅ CHECKLIST - VERIFICAR CADA UTILIZADOR' as info;

SELECT 
  '1️⃣ ADMIN@SISTEMA.COM' as utilizador,
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END as status
FROM kv_store WHERE key LIKE 'user_profile:%' AND value->>'email' = 'admin@sistema.com'
UNION ALL
SELECT '2️⃣ ATENDENTE@SISTEMA.COM', CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store WHERE key LIKE 'user_profile:%' AND value->>'email' = 'atendente@sistema.com'
UNION ALL
SELECT '3️⃣ USUARIO@EMPRESA.COM', CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store WHERE key LIKE 'user_profile:%' AND value->>'email' = 'usuario@empresa.com'
UNION ALL
SELECT '4️⃣ GERENTE@SISTEMA.AO', CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store WHERE key LIKE 'user_profile:%' AND value->>'email' = 'gerente@sistema.ao'
UNION ALL
SELECT '5️⃣ FINANCEIRO@SISTEMA.AO', CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store WHERE key LIKE 'user_profile:%' AND value->>'email' = 'financeiro@sistema.ao'
UNION ALL
SELECT '6️⃣ OPERADOR@SISTEMA.AO', CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store WHERE key LIKE 'user_profile:%' AND value->>'email' = 'operador@sistema.ao';

-- =====================================================
-- FIM DA VERIFICAÇÃO
-- =====================================================
