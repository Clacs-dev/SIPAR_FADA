-- =====================================================
-- 🎯 CRIAR 2 NOVOS UTILIZADORES - SCRIPT CORRETO
-- João Ferreira (Compras) e Carlos Silva (Motorista)
-- =====================================================

SELECT '🎯 CRIANDO 2 NOVOS UTILIZADORES' as titulo;

-- =====================================================
-- INFORMAÇÕES DOS NOVOS UTILIZADORES
-- =====================================================

SELECT '📋 UTILIZADORES A CRIAR:' as secao;
SELECT '' as separador;
SELECT '👤 UTILIZADOR 7: João Ferreira' as info;
SELECT '   Email: compras@sistema.com' as detalhe_1;
SELECT '   Perfil: Utilizador Interno' as detalhe_2;
SELECT '   Departamento: Aquisições e Compras' as detalhe_3;
SELECT '   Posição: Responsável de Compras' as detalhe_4;
SELECT '' as separador;
SELECT '👤 UTILIZADOR 8: Carlos Silva' as info;
SELECT '   Email: motorista@sistema.com' as detalhe_1;
SELECT '   Perfil: Operacional/Frota' as detalhe_2;
SELECT '   Departamento: Operacional e Frota' as detalhe_3;
SELECT '   Posição: Motorista' as detalhe_4;

-- =====================================================
-- ATENÇÃO: Este script NÃO PODE criar no Auth via SQL
-- Você precisa usar o Supabase Dashboard ou Edge Function
-- =====================================================

SELECT '' as separador;
SELECT '⚠️ ATENÇÃO: PASSOS OBRIGATÓRIOS' as aviso;
SELECT '' as separador;
SELECT 'Este script tem 2 partes:' as info;
SELECT '1️⃣ CRIAR no Auth (via Dashboard)' as passo_1;
SELECT '2️⃣ CRIAR perfis no KV_STORE (via SQL)' as passo_2;
SELECT '' as separador;
SELECT '❌ NÃO É POSSÍVEL criar utilizadores no Auth via SQL direto' as limitacao;
SELECT '✅ MAS vou te dar os 2 métodos para fazer' as solucao;

-- =====================================================
-- MÉTODO 1: Via Dashboard do Supabase (RECOMENDADO)
-- =====================================================

SELECT '' as separador;
SELECT '📋 MÉTODO 1: VIA DASHBOARD (Mais Fácil)' as metodo;
SELECT '' as separador;
SELECT 'PASSO 1A: Criar João Ferreira (Compras)' as instrucao;
SELECT '1. Vá para: Authentication → Users' as sub_1;
SELECT '2. Clique: Add user → Create new user' as sub_2;
SELECT '3. Preencha:' as sub_3;
SELECT '   Email: compras@sistema.com' as campo_1;
SELECT '   Password: Compras@2026' as campo_2;
SELECT '   ✅ Auto Confirm User (marcar!)' as campo_3;
SELECT '4. Clique: Create user' as sub_4;
SELECT '5. COPIE o UUID gerado' as sub_5;
SELECT '' as separador;
SELECT 'PASSO 1B: Criar Carlos Silva (Motorista)' as instrucao;
SELECT '1. Repita os passos acima com:' as sub_1;
SELECT '   Email: motorista@sistema.com' as campo_1;
SELECT '   Password: Motorista@2026' as campo_2;
SELECT '   ✅ Auto Confirm User (marcar!)' as campo_3;
SELECT '2. COPIE o UUID gerado' as sub_2;

-- =====================================================
-- VERIFICAR SE JÁ EXISTEM NO AUTH
-- =====================================================

SELECT '' as separador;
SELECT '🔍 VERIFICAR SE JÁ EXISTEM NO AUTH' as secao;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'compras@sistema.com')
    THEN '✅ compras@sistema.com JÁ EXISTE'
    ELSE '❌ compras@sistema.com NÃO EXISTE - Precisa criar'
  END as status_compras;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'motorista@sistema.com')
    THEN '✅ motorista@sistema.com JÁ EXISTE'
    ELSE '❌ motorista@sistema.com NÃO EXISTE - Precisa criar'
  END as status_motorista;

-- =====================================================
-- SE JÁ EXISTEM: Mostrar UUIDs
-- =====================================================

SELECT '' as separador;
SELECT '📌 UUIDs DOS UTILIZADORES (se já existem):' as secao;

SELECT 
  email as "Email",
  id as "UUID",
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
    ELSE '❌ Não confirmado'
  END as "Status Email",
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Tem senha'
    ELSE '❌ Sem senha'
  END as "Status Senha"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;

-- =====================================================
-- SE JÁ EXISTEM: Executar PARTE 2 (Criar Perfis)
-- =====================================================

SELECT '' as separador;
SELECT '⚡ SE OS UTILIZADORES JÁ EXISTEM NO AUTH:' as instrucao;
SELECT 'Execute a PARTE 2 deste script (abaixo)' as acao;
SELECT 'Ela vai criar os perfis no KV_STORE automaticamente' as detalhe;

-- =====================================================
-- PARTE 2: CRIAR PERFIS NO KV_STORE
-- (Execute isto DEPOIS de criar no Auth)
-- =====================================================

SELECT '' as separador;
SELECT '═══════════════════════════════════════════════════' as divisor;
SELECT '📦 PARTE 2: CRIAR PERFIS NO KV_STORE' as titulo_parte_2;
SELECT '═══════════════════════════════════════════════════' as divisor;
SELECT '' as separador;
SELECT '⚠️ ATENÇÃO: Só execute esta parte se:' as aviso;
SELECT '   ✅ Criou os utilizadores no Auth (Método 1)' as condicao_1;
SELECT '   ✅ Os UUIDs aparecem na verificação acima' as condicao_2;

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
    'role', 'user',
    'profiles', jsonb_build_array('utilizador_interno'),
    'department', 'aquisicoes',
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

SELECT '✅ Perfil de João Ferreira (Compras) criado' as resultado;

-- Criar perfil de Carlos Silva (Motorista)
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_profile:' || au.id,
  jsonb_build_object(
    'id', au.id::text,
    'email', 'motorista@sistema.com',
    'name', 'Carlos Silva',
    'role', 'user',
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

SELECT '✅ Perfil de Carlos Silva (Motorista) criado' as resultado;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '🔍 VERIFICAÇÃO FINAL' as secao;

-- Verificar se os perfis foram criados corretamente
SELECT 
  au.email as "Email",
  au.id as "UUID no Auth",
  kv.key as "Chave no KV_STORE",
  kv.value->>'name' as "Nome",
  kv.value->>'department' as "Departamento",
  kv.value->>'position' as "Posição",
  CASE 
    WHEN 'user_profile:' || au.id::text = kv.key THEN '✅ CORRETO'
    WHEN kv.key IS NULL THEN '❌ Perfil não criado'
    ELSE '❌ Chave errada'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.key = 'user_profile:' || au.id::text
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- Verificar lookups
SELECT '' as separador;
SELECT 'Verificando lookups...' as acao;

SELECT 
  au.email as "Email",
  lookup.value->>'user_id' as "User ID no Lookup",
  CASE 
    WHEN au.id::text = lookup.value->>'user_id' THEN '✅ CORRETO'
    WHEN lookup.value->>'user_id' IS NULL THEN '❌ Lookup não existe'
    ELSE '❌ Lookup errado'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b lookup 
  ON lookup.key = 'user_email_lookup:' || au.email
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
    ELSE '❌ ERRO: Nenhum utilizador foi criado. Verifique se existem no Auth primeiro.'
  END as resultado
FROM auth.users au
INNER JOIN kv_store_8b82752b kv 
  ON kv.key = 'user_profile:' || au.id::text
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com');

-- =====================================================
-- CREDENCIAIS PARA LOGIN
-- =====================================================

SELECT '' as separador;
SELECT '🔑 CREDENCIAIS PARA LOGIN:' as secao;
SELECT '' as separador;
SELECT '👤 João Ferreira (Compras):' as user_1;
SELECT '   Email: compras@sistema.com' as email_1;
SELECT '   Senha: Compras@2026' as senha_1;
SELECT '' as separador;
SELECT '👤 Carlos Silva (Motorista):' as user_2;
SELECT '   Email: motorista@sistema.com' as email_2;
SELECT '   Senha: Motorista@2026' as senha_2;

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================

SELECT '' as separador;
SELECT '✅ SCRIPT FINALIZADO!' as titulo_final;
SELECT '' as separador;
SELECT 'Se viu "✅ SUCESSO!", pode testar o login!' as instrucao_1;
SELECT 'Se viu "❌ ERRO", crie primeiro os utilizadores no Auth' as instrucao_2;
SELECT '' as separador;
SELECT '📚 Próximos passos:' as proximos;
SELECT '1. Teste o login com as credenciais acima' as passo_1;
SELECT '2. Verifique se os departamentos estão corretos' as passo_2;
SELECT '3. Configure as permissões específicas (se necessário)' as passo_3;
