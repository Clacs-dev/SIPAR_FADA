-- =====================================================
-- 🔧 CORREÇÃO FINAL - PERFIS COM CHAVES CORRETAS
-- Execute este script para corrigir os perfis
-- =====================================================

SELECT '🔧 INICIANDO CORREÇÃO DOS PERFIS' as titulo;

-- =====================================================
-- PASSO 1: Verificar UUIDs reais do Auth
-- =====================================================

SELECT '1️⃣ UUIDs REAIS DO AUTH' as secao;

SELECT 
  email as "Email",
  id as "UUID Real"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;

-- =====================================================
-- PASSO 2: Deletar perfis com chaves erradas
-- =====================================================

SELECT '' as separador;
SELECT '2️⃣ DELETANDO PERFIS ANTIGOS (se existirem)...' as secao;

-- Deletar qualquer perfil existente destes emails
DELETE FROM kv_store_8b82752b 
WHERE key IN (
  SELECT key 
  FROM kv_store_8b82752b 
  WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%'
);

-- Deletar lookups antigos
DELETE FROM kv_store_8b82752b 
WHERE key IN (
  'user_email_lookup:compras@sistema.com',
  'user_email_lookup:motorista@sistema.com'
);

SELECT '✅ Perfis antigos deletados' as resultado;

-- =====================================================
-- PASSO 3: Recriar perfis com chaves CORRETAS
-- =====================================================

SELECT '' as separador;
SELECT '3️⃣ CRIANDO PERFIS COM CHAVES CORRETAS...' as secao;

-- Criar perfil COMPRAS com UUID correto do Auth
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_profile:' || au.id,
  jsonb_build_object(
    'id', au.id::text,
    'email', 'compras@sistema.com',
    'name', 'Responsável de Compras',
    'role', 'user',
    'department', 'aquisicoes',
    'position', 'Responsável de Aquisições e Compras',
    'phone', '+244 923 100 001',
    'address', 'Luanda, Angola',
    'document', 'BI-COMPRAS001LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP::text
  )
FROM auth.users au
WHERE au.email = 'compras@sistema.com';

-- Criar lookup COMPRAS
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_email_lookup:compras@sistema.com',
  jsonb_build_object('user_id', au.id::text)
FROM auth.users au
WHERE au.email = 'compras@sistema.com';

SELECT '✅ Perfil COMPRAS criado' as resultado;

-- Criar perfil MOTORISTA com UUID correto do Auth
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_profile:' || au.id,
  jsonb_build_object(
    'id', au.id::text,
    'email', 'motorista@sistema.com',
    'name', 'Motorista da Frota',
    'role', 'user',
    'department', 'operacional_frota',
    'position', 'Motorista',
    'phone', '+244 923 200 001',
    'address', 'Luanda, Angola',
    'document', 'BI-MOTORISTA001LA045',
    'status', 'active',
    'created_at', CURRENT_TIMESTAMP::text
  )
FROM auth.users au
WHERE au.email = 'motorista@sistema.com';

-- Criar lookup MOTORISTA
INSERT INTO kv_store_8b82752b (key, value)
SELECT 
  'user_email_lookup:motorista@sistema.com',
  jsonb_build_object('user_id', au.id::text)
FROM auth.users au
WHERE au.email = 'motorista@sistema.com';

SELECT '✅ Perfil MOTORISTA criado' as resultado;

-- =====================================================
-- PASSO 4: VERIFICAÇÃO AUTOMÁTICA
-- =====================================================

SELECT '' as separador;
SELECT '4️⃣ VERIFICANDO SE FICOU CORRETO...' as secao;

-- Verificar se as chaves batem
SELECT 
  au.email as "Email",
  au.id as "UUID no Auth",
  kv.key as "Chave no KV_STORE",
  kv.value->>'id' as "ID no Perfil",
  CASE 
    WHEN 'user_profile:' || au.id::text = kv.key THEN '✅ CORRETO!'
    WHEN kv.key IS NULL THEN '❌ Perfil não foi criado!'
    ELSE '❌ Chave ainda errada'
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
  au.id as "UUID no Auth",
  lookup.value->>'user_id' as "User ID no Lookup",
  CASE 
    WHEN au.id::text = lookup.value->>'user_id' THEN '✅ CORRETO!'
    WHEN lookup.value->>'user_id' IS NULL THEN '❌ Lookup não existe'
    ELSE '❌ Lookup errado'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b lookup 
  ON lookup.key = 'user_email_lookup:' || au.email
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- PASSO 5: RESULTADO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '📊 RESULTADO FINAL' as secao;

SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ CORREÇÃO BEM SUCEDIDA! Ambos os perfis foram criados corretamente!'
    WHEN COUNT(*) = 1 THEN '⚠️ Apenas 1 perfil foi criado. Verifique o outro.'
    ELSE '❌ ERRO: Nenhum perfil foi criado. Verifique se os utilizadores existem no Auth.'
  END as resultado
FROM auth.users au
INNER JOIN kv_store_8b82752b kv 
  ON kv.key = 'user_profile:' || au.id::text
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com');

-- =====================================================
-- PASSO 6: TESTE FINAL
-- =====================================================

SELECT '' as separador;
SELECT '🧪 TESTE FINAL - Os perfis podem ser encontrados?' as secao;

SELECT 
  au.email as "Email",
  CASE 
    WHEN kv.value IS NOT NULL THEN '✅ getUserProfile(' || au.id || ') vai FUNCIONAR'
    ELSE '❌ getUserProfile() vai FALHAR'
  END as "Teste getUserProfile",
  CASE 
    WHEN kv.value->>'name' IS NOT NULL THEN kv.value->>'name'
    ELSE 'Perfil não encontrado'
  END as "Nome do Utilizador"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.key = 'user_profile:' || au.id::text
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- =====================================================
-- CONCLUSÃO
-- =====================================================

SELECT '' as separador;
SELECT '✅ CORREÇÃO FINALIZADA!' as titulo_final;
SELECT 'Agora tente fazer login com:' as instrucao;
SELECT 'compras@sistema.com / Compras@2026' as credencial_1;
SELECT 'motorista@sistema.com / Motorista@2026' as credencial_2;
SELECT '' as separador_final;
SELECT 'Se ainda não funcionar, verifique:' as troubleshoot;
SELECT '1. A senha correta no Auth (pode precisar redefinir)' as dica_1;
SELECT '2. O console do browser para ver erros do frontend' as dica_2;
SELECT '3. Os logs do servidor' as dica_3;
