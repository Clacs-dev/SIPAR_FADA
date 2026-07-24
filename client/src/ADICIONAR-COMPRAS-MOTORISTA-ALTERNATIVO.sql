-- =====================================================
-- SCRIPT ALTERNATIVO (se kv_store NÃO tiver sufixo)
-- Adicionar compras@sistema.com e motorista@sistema.com
-- =====================================================

-- ⚠️ USE ESTE SCRIPT SE A TABELA SE CHAMAR APENAS "kv_store"
-- (sem o sufixo _8b82752b)

-- =====================================================
-- UTILIZADOR 1: COMPRAS
-- =====================================================

-- 1.1 Criar perfil do utilizador de Compras
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:compras-001',
  jsonb_build_object(
    'id', 'compras-001',
    'email', 'compras@sistema.com',
    'name', 'Responsável de Compras',
    'role', 'user',
    'department', 'aquisicoes',
    'position', 'Responsável de Aquisições e Compras',
    'phone', '+244 923 100 001',
    'address', 'Luanda, Angola',
    'document', 'BI-COMPRAS001LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP,
    'profiles', jsonb_build_array('utilizador_interno')
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- 1.2 Criar lookup de email para Compras
INSERT INTO kv_store (key, value)
VALUES (
  'user_email_lookup:compras@sistema.com',
  jsonb_build_object('user_id', 'compras-001')
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- =====================================================
-- UTILIZADOR 2: MOTORISTA
-- =====================================================

-- 2.1 Criar perfil do utilizador Motorista
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:motorista-001',
  jsonb_build_object(
    'id', 'motorista-001',
    'email', 'motorista@sistema.com',
    'name', 'Motorista da Frota',
    'role', 'user',
    'department', 'operacional_frota',
    'position', 'Motorista',
    'phone', '+244 923 200 001',
    'address', 'Luanda, Angola',
    'document', 'BI-MOTORISTA001LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP,
    'profiles', jsonb_build_array('operacional_frota')
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- 2.2 Criar lookup de email para Motorista
INSERT INTO kv_store (key, value)
VALUES (
  'user_email_lookup:motorista@sistema.com',
  jsonb_build_object('user_id', 'motorista-001')
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- =====================================================
-- VERIFICAÇÃO: Confirmar que foram criados
-- =====================================================

SELECT 
  '✅ VERIFICAÇÃO - NOVOS UTILIZADORES CRIADOS' as status;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  key as chave,
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role,
  value->>'department' as departamento,
  value->>'position' as cargo,
  value->>'phone' as telefone,
  value->>'status' as status
FROM kv_store 
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001')
ORDER BY value->>'email';

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT 
  '📊 RESUMO APÓS INSERÇÃO' as info;

SELECT 
  'Total de Utilizadores no Sistema' as metrica,
  COUNT(*) as valor
FROM kv_store 
WHERE key LIKE 'user_profile:%';

-- =====================================================
-- VERIFICAR NOME DA TABELA
-- =====================================================

-- Se este script falhar, execute primeiro isto para saber o nome correto:
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%kv_store%';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
