-- =====================================================
-- SCRIPT DE VERIFICAÇÃO RÁPIDA
-- Verificar se todos os 23 utilizadores foram criados
-- =====================================================

-- 1. CONTAR TOTAL DE UTILIZADORES DEPARTAMENTAIS
SELECT COUNT(*) as total_usuarios
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%';

-- Resultado esperado: 23

-- =====================================================
-- 2. LISTAR TODOS OS UTILIZADORES POR CATEGORIA
-- =====================================================

-- GABINETES EXECUTIVOS (4)
SELECT 
  '🟣 GABINETES EXECUTIVOS' as categoria,
  value->>'name' as nome,
  value->>'email' as email,
  value->>'department' as departamento
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%' 
  AND value->>'department' IN ('gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director')
ORDER BY value->>'email';

-- GABINETES GOVERNAMENTAIS (5)
SELECT 
  '🔵 GABINETES GOVERNAMENTAIS' as categoria,
  value->>'name' as nome,
  value->>'email' as email,
  value->>'department' as departamento
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%' 
  AND value->>'department' IN ('gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2', 'gabinete_vice_governador_1', 'gabinete_vice_governador_2')
ORDER BY value->>'email';

-- DEPARTAMENTOS OPERACIONAIS (5)
SELECT 
  '🟢 DEPARTAMENTOS OPERACIONAIS' as categoria,
  value->>'name' as nome,
  value->>'email' as email,
  value->>'department' as departamento
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%' 
  AND value->>'department' IN ('financeiro', 'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao')
ORDER BY value->>'email';

-- DEPARTAMENTOS DE APOIO (4)
SELECT 
  '🟠 DEPARTAMENTOS DE APOIO' as categoria,
  value->>'name' as nome,
  value->>'email' as email,
  value->>'department' as departamento
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%' 
  AND value->>'department' IN ('administracao', 'administrativo', 'comunicacao_imagem', 'seguranca')
ORDER BY value->>'email';

-- DEPARTAMENTOS ESTRATÉGICOS (4)
SELECT 
  '🟣 DEPARTAMENTOS ESTRATÉGICOS' as categoria,
  value->>'name' as nome,
  value->>'email' as email,
  value->>'department' as departamento
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%' 
  AND value->>'department' IN ('planeamento', 'organizacao_qualidade', 'compliance', 'risco')
ORDER BY value->>'email';

-- UTILIZADOR EXTERNO (1)
SELECT 
  '👤 UTILIZADOR EXTERNO' as categoria,
  value->>'name' as nome,
  value->>'email' as email,
  value->>'department' as departamento
FROM kv_store 
WHERE key = 'user_profile:dept-externo-023';

-- =====================================================
-- 3. VERIFICAR DISTRIBUIÇÃO DE PERFIS
-- =====================================================

SELECT 
  value->>'role' as role,
  value->'profiles'->>0 as perfil_principal,
  COUNT(*) as quantidade
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%'
GROUP BY value->>'role', value->'profiles'->>0
ORDER BY quantidade DESC;

-- =====================================================
-- 4. VERIFICAR LOOKUPS DE EMAIL
-- =====================================================

SELECT COUNT(*) as total_lookups
FROM kv_store 
WHERE key LIKE 'user_email_lookup:%@sistema.ao' 
   OR key LIKE 'user_email_lookup:%@exemplo.ao';

-- Resultado esperado: 23

-- =====================================================
-- 5. LISTAR TODOS COM DETALHES COMPLETOS
-- =====================================================

SELECT 
  ROW_NUMBER() OVER (ORDER BY key) as numero,
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role,
  value->'profiles'->>0 as perfil,
  value->>'department' as departamento,
  value->>'position' as cargo,
  value->>'phone' as telefone
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%'
ORDER BY key;

-- =====================================================
-- 6. VERIFICAR SE HÁ EMAILS DUPLICADOS
-- =====================================================

SELECT 
  value->>'email' as email,
  COUNT(*) as quantidade
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%'
GROUP BY value->>'email'
HAVING COUNT(*) > 1;

-- Resultado esperado: 0 linhas (sem duplicados)

-- =====================================================
-- 7. VERIFICAR DEPARTAMENTOS SEM UTILIZADOR
-- =====================================================

WITH departamentos_sistema AS (
  SELECT unnest(ARRAY[
    'gabinete_pca',
    'gabinete_pce',
    'gabinete_administrador',
    'gabinete_director',
    'gabinete_ministro',
    'gabinete_secretario_estado_1',
    'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1',
    'gabinete_vice_governador_2',
    'financeiro',
    'recursos_humanos',
    'juridico',
    'compras',
    'tecnologia_informacao',
    'administracao',
    'administrativo',
    'comunicacao_imagem',
    'seguranca',
    'planeamento',
    'organizacao_qualidade',
    'compliance',
    'risco'
  ]) as dept_id
),
departamentos_com_usuario AS (
  SELECT DISTINCT value->>'department' as dept_id
  FROM kv_store 
  WHERE key LIKE 'user_profile:dept-%'
    AND value->>'department' IS NOT NULL
)
SELECT 
  ds.dept_id as departamento_sem_usuario
FROM departamentos_sistema ds
LEFT JOIN departamentos_com_usuario du ON ds.dept_id = du.dept_id
WHERE du.dept_id IS NULL;

-- Resultado esperado: 0 linhas (todos os departamentos têm utilizador)

-- =====================================================
-- 8. RESUMO GERAL
-- =====================================================

SELECT 
  'VERIFICAÇÃO COMPLETA' as status,
  (SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%') as total_usuarios,
  (SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_email_lookup:%@sistema.ao' OR key LIKE 'user_email_lookup:%@exemplo.ao') as total_lookups,
  (SELECT COUNT(DISTINCT value->>'department') FROM kv_store WHERE key LIKE 'user_profile:dept-%' AND value->>'department' IS NOT NULL) as departamentos_com_usuario,
  CASE 
    WHEN (SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%') = 23 THEN '✅ SUCESSO'
    ELSE '❌ FALTAM UTILIZADORES'
  END as resultado;
