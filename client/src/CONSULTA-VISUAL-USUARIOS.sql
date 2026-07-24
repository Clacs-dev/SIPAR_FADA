-- =====================================================
-- 🎨 CONSULTA VISUAL COMPLETA - TODOS OS UTILIZADORES
-- A consulta mais bonita e informativa
-- =====================================================

SELECT '🎯 SISTEMA DE GESTÃO - UTILIZADORES REGISTADOS' as titulo;

-- =====================================================
-- 📊 RESUMO EXECUTIVO
-- =====================================================

SELECT '📊 RESUMO EXECUTIVO' as secao;

SELECT 
  'Total de Utilizadores no Sistema' as metrica,
  COUNT(*) as valor,
  '👥' as icone
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'

UNION ALL

SELECT 
  'Administradores (Admin)',
  COUNT(*),
  '🔴'
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' AND value->>'role' = 'admin'

UNION ALL

SELECT 
  'Atendentes (Attendant)',
  COUNT(*),
  '🟡'
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' AND value->>'role' = 'attendant'

UNION ALL

SELECT 
  'Utilizadores Externos (User)',
  COUNT(*),
  '🟢'
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' AND value->>'role' = 'user';

-- =====================================================
-- 👥 LISTA COMPLETA DE UTILIZADORES
-- =====================================================

SELECT '👥 LISTA COMPLETA DE UTILIZADORES (ORDENADA POR EMAIL)' as secao;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  CASE 
    WHEN value->>'role' = 'admin' THEN '🔴'
    WHEN value->>'role' = 'attendant' THEN '🟡'
    WHEN value->>'role' = 'user' THEN '🟢'
  END as "",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome Completo",
  CASE value->>'role'
    WHEN 'admin' THEN 'ADMIN'
    WHEN 'attendant' THEN 'ATTENDANT'
    WHEN 'user' THEN 'USER'
  END as "🎭 Perfil",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo",
  value->>'phone' as "📞 Telefone",
  CASE value->>'status'
    WHEN 'active' THEN '✅ Ativo'
    ELSE '⚠️ ' || value->>'status'
  END as "Status"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- 🔴 ADMINISTRADORES
-- =====================================================

SELECT '🔴 ADMINISTRADORES (ADMIN)' as secao;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'department' as "Departamento",
  value->>'position' as "Cargo"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'role' = 'admin'
ORDER BY value->>'email';

-- =====================================================
-- 🟡 ATENDENTES
-- =====================================================

SELECT '🟡 ATENDENTES (ATTENDANT)' as secao;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'department' as "Departamento",
  value->>'position' as "Cargo"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'role' = 'attendant'
ORDER BY value->>'email';

-- =====================================================
-- 🟢 UTILIZADORES EXTERNOS
-- =====================================================

SELECT '🟢 UTILIZADORES EXTERNOS (USER)' as secao;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'department' as "Departamento",
  value->>'position' as "Cargo",
  CASE 
    WHEN value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com') 
    THEN '⭐ NOVO'
    ELSE '✅ Original'
  END as "Observação"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'role' = 'user'
ORDER BY value->>'email';

-- =====================================================
-- 🏢 DISTRIBUIÇÃO POR DEPARTAMENTO
-- =====================================================

SELECT '🏢 DISTRIBUIÇÃO POR DEPARTAMENTO' as secao;

SELECT 
  value->>'department' as "Departamento",
  COUNT(*) as "Total",
  CASE 
    WHEN COUNT(*) = 1 THEN '▪'
    WHEN COUNT(*) = 2 THEN '▪▪'
    WHEN COUNT(*) >= 3 THEN '▪▪▪'
  END as "Gráfico",
  string_agg(value->>'name', ' • ') as "Colaboradores"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'department'
ORDER BY COUNT(*) DESC, value->>'department';

-- =====================================================
-- ⭐ VERIFICAÇÃO DOS 8 UTILIZADORES PRINCIPAIS
-- =====================================================

SELECT '⭐ VERIFICAÇÃO DOS 8 UTILIZADORES PRINCIPAIS' as secao;

WITH esperados AS (
  SELECT 
    ROW_NUMBER() OVER () as ordem,
    unnest(ARRAY[
      'admin@sistema.com',
      'atendente@sistema.com',
      'usuario@empresa.com',
      'gerente@sistema.ao',
      'financeiro@sistema.ao',
      'operador@sistema.ao',
      'compras@sistema.com',
      'motorista@sistema.com'
    ]) as email
)
SELECT 
  e.ordem as "#",
  e.email as "Email Esperado",
  CASE 
    WHEN u.value IS NOT NULL THEN '✅ Encontrado'
    ELSE '❌ FALTA'
  END as "Status",
  u.value->>'name' as "Nome",
  u.value->>'role' as "Role"
FROM esperados e
LEFT JOIN kv_store_8b82752b u 
  ON u.key LIKE 'user_profile:%' 
  AND u.value->>'email' = e.email
ORDER BY e.ordem;

-- =====================================================
-- 📅 DATAS DE CRIAÇÃO
-- =====================================================

SELECT '📅 UTILIZADORES POR DATA DE CRIAÇÃO' as secao;

SELECT 
  value->>'email' as "Email",
  value->>'name' as "Nome",
  TO_CHAR(
    (value->>'created_at')::timestamp, 
    'DD/MM/YYYY HH24:MI'
  ) as "Data de Criação"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
  AND value->>'created_at' IS NOT NULL
ORDER BY (value->>'created_at')::timestamp DESC;

-- =====================================================
-- ✅ CONCLUSÃO
-- =====================================================

SELECT '✅ FIM DA CONSULTA - TODOS OS UTILIZADORES LISTADOS' as resultado;

-- Total final
SELECT 
  'Total de utilizadores consultados' as resumo_final,
  COUNT(*) as total,
  '👥 utilizadores ativos no sistema' as descricao
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%';
