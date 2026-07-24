-- =====================================================
-- 📊 CONSULTAR TODOS OS UTILIZADORES DO SISTEMA
-- Scripts prontos para copiar e executar
-- =====================================================

-- =====================================================
-- 1️⃣ LISTAGEM SIMPLES - TODOS OS UTILIZADORES
-- =====================================================

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- 2️⃣ LISTAGEM COMPLETA - COM TODOS OS CAMPOS
-- =====================================================

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'id' as "ID",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo",
  value->>'phone' as "📞 Telefone",
  value->>'status' as "Status",
  value->>'created_at' as "📅 Criado em"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- 3️⃣ AGRUPADO POR ROLE
-- =====================================================

SELECT 
  value->>'role' as "🎭 Role",
  COUNT(*) as "Total",
  string_agg(value->>'email', ', ' ORDER BY value->>'email') as "Utilizadores"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'role'
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 4️⃣ AGRUPADO POR DEPARTAMENTO
-- =====================================================

SELECT 
  value->>'department' as "🏢 Departamento",
  COUNT(*) as "Total",
  string_agg(value->>'name', ', ' ORDER BY value->>'name') as "Colaboradores"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'department'
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 5️⃣ TOTAL DE UTILIZADORES
-- =====================================================

SELECT 
  COUNT(*) as "Total de Utilizadores no Sistema"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%';

-- =====================================================
-- 6️⃣ APENAS OS 8 UTILIZADORES PRINCIPAIS
-- =====================================================

SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    CASE value->>'email'
      WHEN 'admin@sistema.com' THEN 1
      WHEN 'atendente@sistema.com' THEN 2
      WHEN 'usuario@empresa.com' THEN 3
      WHEN 'gerente@sistema.ao' THEN 4
      WHEN 'financeiro@sistema.ao' THEN 5
      WHEN 'operador@sistema.ao' THEN 6
      WHEN 'compras@sistema.com' THEN 7
      WHEN 'motorista@sistema.com' THEN 8
      ELSE 999
    END
  ) as "#",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  CASE 
    WHEN value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com') THEN '⭐ NOVO'
    ELSE '✅ Original'
  END as "Status"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
  AND value->>'email' IN (
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao',
    'compras@sistema.com',
    'motorista@sistema.com'
  )
ORDER BY 
  CASE value->>'email'
    WHEN 'admin@sistema.com' THEN 1
    WHEN 'atendente@sistema.com' THEN 2
    WHEN 'usuario@empresa.com' THEN 3
    WHEN 'gerente@sistema.ao' THEN 4
    WHEN 'financeiro@sistema.ao' THEN 5
    WHEN 'operador@sistema.ao' THEN 6
    WHEN 'compras@sistema.com' THEN 7
    WHEN 'motorista@sistema.com' THEN 8
  END;

-- =====================================================
-- 7️⃣ VERIFICAR LOOKUPS DE EMAIL
-- =====================================================

SELECT 
  key as "Chave Lookup",
  value->>'user_id' as "User ID"
FROM kv_store_8b82752b
WHERE key LIKE 'user_email_lookup:%'
ORDER BY key;

-- =====================================================
-- 8️⃣ JSON COMPLETO DE UM UTILIZADOR (EXEMPLO)
-- =====================================================

SELECT 
  value->>'email' as email,
  jsonb_pretty(value) as "Estrutura JSON Completa"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
  AND value->>'email' = 'compras@sistema.com'
LIMIT 1;

-- =====================================================
-- 9️⃣ ESTATÍSTICAS GERAIS
-- =====================================================

SELECT 
  '📊 ESTATÍSTICAS DO SISTEMA' as info;

SELECT 
  'Total de Utilizadores' as metrica,
  COUNT(*) as valor
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'

UNION ALL

SELECT 
  'Total de Admins',
  COUNT(*)
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' AND value->>'role' = 'admin'

UNION ALL

SELECT 
  'Total de Attendants',
  COUNT(*)
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' AND value->>'role' = 'attendant'

UNION ALL

SELECT 
  'Total de Users',
  COUNT(*)
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' AND value->>'role' = 'user'

UNION ALL

SELECT 
  'Total de Departamentos Únicos',
  COUNT(DISTINCT value->>'department')
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%';

-- =====================================================
-- 🔟 LISTA TODOS COM CORES (VISUAL)
-- =====================================================

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  CASE 
    WHEN value->>'role' = 'admin' THEN '🔴 ADMIN'
    WHEN value->>'role' = 'attendant' THEN '🟡 ATTENDANT'
    WHEN value->>'role' = 'user' THEN '🟢 USER'
    ELSE '⚪ OUTRO'
  END as "Role",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'department' as "Departamento"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY 
  CASE value->>'role'
    WHEN 'admin' THEN 1
    WHEN 'attendant' THEN 2
    WHEN 'user' THEN 3
  END,
  value->>'email';

-- =====================================================
-- FIM DAS CONSULTAS
-- =====================================================
