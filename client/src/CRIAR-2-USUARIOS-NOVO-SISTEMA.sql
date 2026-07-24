-- =====================================================
-- 👥 CRIAR 2 NOVOS UTILIZADORES (Sistema Novo)
-- João Ferreira (Compras) e Carlos Silva (Motorista)
-- =====================================================
-- ⚠️ ATENÇÃO: Este script usa o NOVO SISTEMA de roles
-- Role = Department (27 departamentos disponíveis)
-- =====================================================

SELECT '👥 CRIAR 2 NOVOS UTILIZADORES - SISTEMA NOVO (role = department)' as titulo;

-- =====================================================
-- INFORMAÇÕES DOS NOVOS UTILIZADORES
-- =====================================================

SELECT '' as separador;
SELECT '📋 UTILIZADORES A CRIAR:' as secao;
SELECT '' as separador;

SELECT '👤 UTILIZADOR 7: João Ferreira' as info;
SELECT '   Email: compras@sistema.com' as detalhe_1;
SELECT '   Role: compras (= department)' as detalhe_2;
SELECT '   Perfil: Utilizador Interno' as detalhe_3;
SELECT '   Departamento: compras' as detalhe_4;
SELECT '   Posição: Responsável de Compras' as detalhe_5;

SELECT '' as separador;

SELECT '👤 UTILIZADOR 8: Carlos Silva' as info;
SELECT '   Email: motorista@sistema.com' as detalhe_1;
SELECT '   Role: operacional_frota (= department)' as detalhe_2;
SELECT '   Perfil: Operacional/Frota' as detalhe_3;
SELECT '   Departamento: operacional_frota' as detalhe_4;
SELECT '   Posição: Motorista' as detalhe_5;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================

SELECT '' as separador;
SELECT '📋 INSTRUÇÕES - 2 PASSOS' as secao;
SELECT '' as separador;
SELECT 'PASSO 1: Criar no Dashboard do Supabase' as instrucao;
SELECT '  1. Vá para: Authentication → Users' as sub_1;
SELECT '  2. Clique: Add user → Create new user' as sub_2;
SELECT '  3. Criar João Ferreira:' as sub_3;
SELECT '     Email: compras@sistema.com' as campo_1;
SELECT '     Password: Compras@2026' as campo_2;
SELECT '     ✅ Auto Confirm User' as campo_3;
SELECT '  4. Criar Carlos Silva:' as sub_4;
SELECT '     Email: motorista@sistema.com' as campo_4;
SELECT '     Password: Motorista@2026' as campo_5;
SELECT '     ✅ Auto Confirm User' as campo_6;
SELECT '' as separador;
SELECT 'PASSO 2: Executar esta PARTE 2 (abaixo)' as instrucao_2;

-- =====================================================
-- VERIFICAR SE JÁ EXISTEM NO AUTH
-- =====================================================

SELECT '' as separador;
SELECT '🔍 VERIFICAR SE JÁ EXISTEM NO AUTH' as secao;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'compras@sistema.com')
    THEN '✅ compras@sistema.com JÁ EXISTE no Auth'
    ELSE '❌ compras@sistema.com NÃO EXISTE - Precisa criar (PASSO 1)'
  END as status_compras;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'motorista@sistema.com')
    THEN '✅ motorista@sistema.com JÁ EXISTE no Auth'
    ELSE '❌ motorista@sistema.com NÃO EXISTE - Precisa criar (PASSO 1)'
  END as status_motorista;

-- =====================================================
-- PARTE 2: CRIAR PERFIS NO KV_STORE
-- =====================================================

SELECT '' as separador;
SELECT '═══════════════════════════════════════════════════' as divisor;
SELECT '📦 PARTE 2: CRIAR PERFIS NO KV_STORE (SISTEMA NOVO)' as titulo_parte_2;
SELECT '═══════════════════════════════════════════════════' as divisor;

-- Deletar perfis antigos se existirem
DELETE FROM kv_store_8b82752b 
WHERE key IN (
  SELECT key 
  FROM kv_store_8b82752b 
  WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%'
);

DELETE FROM kv_store_8b82752b 
WHERE key IN (
  'user_email_lookup:compras@sistema.com',
  'user_email_lookup:motorista@sistema.com'
);

SELECT '🗑️ Perfis antigos deletados (se existiam)' as resultado;

-- Criar perfil de João Ferreira (Compras)
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_profile:' || au.id,
  jsonb_build_object(
    'id', au.id::text,
    'email', 'compras@sistema.com',
    'name', 'João Ferreira',
    'role', 'compras',
    'profiles', jsonb_build_array('utilizador_interno'),
    'department', 'compras',
    'position', 'Responsável de Compras',
    'phone', '+244 923 456 001',
    'address', 'Luanda, Angola',
    'document', 'BI-004567890LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP::text,
    'created_by', 'admin@sistema.com'
  )
FROM auth.users au
WHERE au.email = 'compras@sistema.com';

-- Criar lookup de João Ferreira
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_email_lookup:compras@sistema.com',
  jsonb_build_object('user_id', au.id::text)
FROM auth.users au
WHERE au.email = 'compras@sistema.com';

SELECT '✅ João Ferreira (Compras) criado com role=compras' as resultado;

-- Criar perfil de Carlos Silva (Motorista)
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_profile:' || au.id,
  jsonb_build_object(
    'id', au.id::text,
    'email', 'motorista@sistema.com',
    'name', 'Carlos Silva',
    'role', 'operacional_frota',
    'profiles', jsonb_build_array('operacional_frota'),
    'department', 'operacional_frota',
    'position', 'Motorista',
    'phone', '+244 923 456 002',
    'address', 'Luanda, Angola',
    'document', 'BI-004567891LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP::text,
    'created_by', 'admin@sistema.com'
  )
FROM auth.users au
WHERE au.email = 'motorista@sistema.com';

-- Criar lookup de Carlos Silva
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_email_lookup:motorista@sistema.com',
  jsonb_build_object('user_id', au.id::text)
FROM auth.users au
WHERE au.email = 'motorista@sistema.com';

SELECT '✅ Carlos Silva (Motorista) criado com role=operacional_frota' as resultado;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '🔍 VERIFICAÇÃO FINAL' as secao;

-- Verificar se os perfis foram criados corretamente
SELECT 
  au.email as "Email",
  au.id as "UUID no Auth",
  kv.value->>'name' as "Nome",
  kv.value->>'role' as "Role",
  kv.value->>'department' as "Department",
  CASE 
    WHEN kv.value->>'role' = kv.value->>'department' THEN '✅ CORRETO'
    WHEN kv.key IS NULL THEN '❌ Perfil não criado'
    ELSE '❌ Role ≠ Department'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.key = 'user_profile:' || au.id::text
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- RESULTADO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '📊 RESULTADO FINAL' as secao;

SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ SUCESSO! Ambos os utilizadores foram criados corretamente!'
    WHEN COUNT(*) = 1 THEN '⚠️ Apenas 1 utilizador foi criado. Verifique o outro.'
    ELSE '❌ ERRO: Nenhum utilizador foi criado. Execute o PASSO 1 primeiro.'
  END as resultado
FROM auth.users au
INNER JOIN kv_store_8b82752b kv 
  ON kv.key = 'user_profile:' || au.id::text
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
AND kv.value->>'role' = kv.value->>'department';

-- =====================================================
-- CREDENCIAIS PARA LOGIN
-- =====================================================

SELECT '' as separador;
SELECT '🔑 CREDENCIAIS PARA LOGIN:' as secao;
SELECT '' as separador;
SELECT '👤 João Ferreira (Compras):' as user_1;
SELECT '   Email: compras@sistema.com' as email_1;
SELECT '   Senha: Compras@2026' as senha_1;
SELECT '   Role: compras' as role_1;
SELECT '' as separador;
SELECT '👤 Carlos Silva (Motorista):' as user_2;
SELECT '   Email: motorista@sistema.com' as email_2;
SELECT '   Senha: Motorista@2026' as senha_2;
SELECT '   Role: operacional_frota' as role_2;

-- =====================================================
-- RESUMO DOS 8 UTILIZADORES
-- =====================================================

SELECT '' as separador;
SELECT '📊 RESUMO: TODOS OS 8 UTILIZADORES' as titulo;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role",
  value->>'department' as "Department"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

SELECT '' as separador;
SELECT '✅ SCRIPT FINALIZADO!' as titulo_final;