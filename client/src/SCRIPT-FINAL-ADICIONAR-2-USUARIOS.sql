-- =====================================================
-- 🚀 SCRIPT PRONTO PARA COPIAR E EXECUTAR
-- Adiciona compras@sistema.com e motorista@sistema.com
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Clique em RUN
-- 4. Veja a confirmação no final
--
-- =====================================================

-- =====================================================
-- UTILIZADOR 1: COMPRAS@SISTEMA.COM
-- =====================================================

-- Criar perfil
INSERT INTO kv_store_8b82752b (key, value)
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
    'created_at', CURRENT_TIMESTAMP
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Criar lookup de email
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:compras@sistema.com',
  jsonb_build_object('user_id', 'compras-001')
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- =====================================================
-- UTILIZADOR 2: MOTORISTA@SISTEMA.COM
-- =====================================================

-- Criar perfil
INSERT INTO kv_store_8b82752b (key, value)
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
    'created_at', CURRENT_TIMESTAMP
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Criar lookup de email
INSERT INTO kv_store_8b82752b (key, value)
VALUES (
  'user_email_lookup:motorista@sistema.com',
  jsonb_build_object('user_id', 'motorista-001')
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- =====================================================
-- ✅ VERIFICAÇÃO AUTOMÁTICA
-- =====================================================

SELECT '✅ SCRIPT EXECUTADO COM SUCESSO!' as resultado;
SELECT '';
SELECT '📊 NOVOS UTILIZADORES CRIADOS:' as info;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo",
  value->>'phone' as "📞 Telefone"
FROM kv_store_8b82752b 
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001')
ORDER BY value->>'email';

SELECT '';
SELECT '📊 TOTAL DE UTILIZADORES NO SISTEMA:' as info;

SELECT 
  COUNT(*) as "Total de Utilizadores"
FROM kv_store_8b82752b 
WHERE key LIKE 'user_profile:%';

SELECT '';
SELECT '🔐 CREDENCIAIS DE ACESSO:' as info;
SELECT 'IMPORTANTE: Agora crie a autenticação no Supabase Auth!' as instrucao;
SELECT '';
SELECT 'compras@sistema.com | Senha: Compras@2026' as "Utilizador 1";
SELECT 'motorista@sistema.com | Senha: Motorista@2026' as "Utilizador 2";
SELECT '';
SELECT '📝 PRÓXIMO PASSO:' as info;
SELECT 'Vá para Authentication → Users → Add user e crie as contas com as credenciais acima' as instrucao;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
