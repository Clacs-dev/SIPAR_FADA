-- =====================================================
-- 📊 CONSULTA RÁPIDA - TODOS OS UTILIZADORES
-- Use este para ver rapidamente todos
-- =====================================================

-- ✅ OPÇÃO 1: TABELA COM SUFIXO (kv_store_8b82752b)
SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "Role",
  value->>'department' as "Departamento",
  value->>'position' as "Cargo"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- OU (se der erro, use esta versão sem sufixo)
-- =====================================================

-- ✅ OPÇÃO 2: TABELA SEM SUFIXO (kv_store)
/*
SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "Role",
  value->>'department' as "Departamento",
  value->>'position' as "Cargo"
FROM kv_store
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';
*/

-- =====================================================
-- CONTAR TOTAL
-- =====================================================

SELECT 
  COUNT(*) as "Total de Utilizadores"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%';

-- =====================================================
-- VER OS 8 UTILIZADORES PRINCIPAIS
-- =====================================================

SELECT 
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role"
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
ORDER BY value->>'email';
