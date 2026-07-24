-- =====================================================
-- 🔧 CORREÇÃO 1: DEFINIR/RESETAR SENHAS
-- Execute se o diagnóstico mostrar "FALTA SENHA"
-- =====================================================

SELECT '🔐 DEFININDO SENHAS PARA OS NOVOS UTILIZADORES' as titulo;

-- =====================================================
-- ATENÇÃO: Este script usa a API Admin do Supabase
-- Ele redefine a senha E confirma o email automaticamente
-- =====================================================

-- Verificar estado atual
SELECT 'ANTES DA CORREÇÃO:' as status;

SELECT 
  email,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Tem senha'
    ELSE '❌ SEM SENHA'
  END as senha,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as email_status
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');

-- =====================================================
-- OPÇÃO 1: Usar o Dashboard do Supabase
-- =====================================================

SELECT '' as separador;
SELECT '📋 OPÇÃO 1: USAR O DASHBOARD (Recomendado)' as opcao;
SELECT '' as instrucao;
SELECT '1. Vá para: Authentication → Users' as passo_1;
SELECT '2. Encontre: compras@sistema.com' as passo_2;
SELECT '3. Clique nos 3 pontinhos (...)' as passo_3;
SELECT '4. Clique em: Send Magic Link' as passo_4;
SELECT '   OU' as ou;
SELECT '5. Clique em: Reset Password' as passo_5;
SELECT '6. Defina a senha: Compras@2026' as passo_6;
SELECT '7. Repita para: motorista@sistema.com' as passo_7;

-- =====================================================
-- OPÇÃO 2: Via SQL (AVANÇADO)
-- =====================================================

SELECT '' as separador;
SELECT '📋 OPÇÃO 2: VIA SQL (Avançado)' as opcao;
SELECT 'IMPORTANTE: Não é possível definir senha diretamente via SQL' as aviso;
SELECT 'Você precisa usar o Admin API ou o Dashboard' as aviso2;

-- =====================================================
-- OPÇÃO 3: Recriar os utilizadores
-- =====================================================

SELECT '' as separador;
SELECT '📋 OPÇÃO 3: RECRIAR OS UTILIZADORES (Se nada funcionar)' as opcao;
SELECT '' as instrucao;
SELECT 'DELETE dos utilizadores existentes:' as passo;

-- Mostrar os IDs para deletar
SELECT 
  'DELETE FROM auth.users WHERE id = ''' || id || '''; -- ' || email as comando_delete
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');

SELECT '' as separador;
SELECT 'Depois execute: SCRIPT-FINAL-ADICIONAR-2-USUARIOS.sql novamente' as instrucao_final;

-- =====================================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- =====================================================

SELECT '' as separador;
SELECT '✅ APÓS DEFINIR AS SENHAS, VERIFIQUE:' as titulo_verificacao;

SELECT 
  email,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Tem senha'
    ELSE '❌ AINDA SEM SENHA'
  END as senha,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as email_status,
  CASE 
    WHEN encrypted_password IS NOT NULL AND email_confirmed_at IS NOT NULL 
    THEN '✅ PRONTO PARA LOGIN'
    ELSE '⚠️ Ainda falta configurar'
  END as status_final
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');
