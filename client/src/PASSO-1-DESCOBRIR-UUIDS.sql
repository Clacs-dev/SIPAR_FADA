-- =====================================================
-- 🔍 PASSO 1: DESCOBRIR UUIDs REAIS
-- Execute este script PRIMEIRO
-- =====================================================

SELECT '🔍 DESCOBRINDO UUIDs DOS UTILIZADORES NO AUTH' as info;

-- Ver TODOS os usuários
SELECT 
  '📊 TODOS OS UTILIZADORES NO AUTH:' as secao;

SELECT 
  id as "UUID (Copie isto!)",
  email as "Email",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as "Criado em",
  CASE WHEN confirmed_at IS NOT NULL THEN '✅ Confirmado' ELSE '⚠️ Não confirmado' END as "Status"
FROM auth.users
ORDER BY created_at DESC;

-- Filtrar APENAS compras e motorista
SELECT '' as separador;
SELECT '🎯 APENAS OS 2 NOVOS UTILIZADORES:' as secao;

SELECT 
  email as "📧 Email",
  id as "🔑 UUID REAL (COPIE ESTE!)",
  '👉 Copie este UUID e use no próximo passo' as "Instrução"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;

-- Contar quantos existem
SELECT '' as separador;
SELECT '📊 RESUMO:' as secao;

SELECT 
  COUNT(*) as "Total de utilizadores com estes emails no Auth"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');

-- Verificar se existem no KV_STORE (com IDs errados)
SELECT '' as separador;
SELECT '⚠️ PERFIS ATUAIS NO KV_STORE (com IDs errados):' as secao;

SELECT 
  key as "Chave no KV_STORE",
  value->>'id' as "ID Atual (errado)",
  value->>'email' as "Email"
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%';

-- Comparação
SELECT '' as separador;
SELECT '🔄 COMPARAÇÃO - O QUE PRECISA SER CORRIGIDO:' as secao;

SELECT 
  au.email as "Email",
  au.id as "UUID no Auth (CORRETO)",
  kv.value->>'id' as "ID no KV_STORE (ERRADO)",
  CASE 
    WHEN au.id::text = kv.value->>'id' THEN '✅ IGUAL - OK'
    ELSE '❌ DIFERENTE - PRECISA CORRIGIR'
  END as "Status"
FROM auth.users au
LEFT JOIN kv_store_8b82752b kv 
  ON kv.value->>'email' = au.email 
  AND kv.key LIKE 'user_profile:%'
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY au.email;

-- Instruções finais
SELECT '' as separador;
SELECT '📝 PRÓXIMOS PASSOS:' as secao;
SELECT '1. Copie os UUIDs da seção "APENAS OS 2 NOVOS UTILIZADORES"' as passo;
UNION ALL
SELECT '2. Abra o arquivo: CORRIGIR-UUIDS-USUARIOS.sql' as passo;
UNION ALL
SELECT '3. Substitua os UUIDs no script' as passo;
UNION ALL
SELECT '4. Execute o script de correção' as passo;
UNION ALL
SELECT '5. Teste o login novamente' as passo;
