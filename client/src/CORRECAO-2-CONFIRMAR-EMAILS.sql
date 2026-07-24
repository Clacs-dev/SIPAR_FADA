-- =====================================================
-- 🔧 CORREÇÃO 2: CONFIRMAR EMAILS
-- Execute se o diagnóstico mostrar "EMAIL NÃO CONFIRMADO"
-- =====================================================

SELECT '📧 CONFIRMANDO EMAILS DOS NOVOS UTILIZADORES' as titulo;

-- =====================================================
-- Confirmar email_confirmed_at
-- =====================================================

-- Verificar estado atual
SELECT 'ANTES DA CORREÇÃO:' as status;

SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
    ELSE '❌ NÃO CONFIRMADO'
  END as status
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');

-- =====================================================
-- CORREÇÃO: Confirmar emails
-- =====================================================

SELECT '' as separador;
SELECT '🔧 APLICANDO CORREÇÃO...' as acao;

-- Confirmar compras
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = NULL,
  confirmation_sent_at = NULL
WHERE email = 'compras@sistema.com'
  AND email_confirmed_at IS NULL;

-- Confirmar motorista
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = NULL,
  confirmation_sent_at = NULL
WHERE email = 'motorista@sistema.com'
  AND email_confirmed_at IS NULL;

-- =====================================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- =====================================================

SELECT '' as separador;
SELECT 'DEPOIS DA CORREÇÃO:' as status;

SELECT 
  email,
  TO_CHAR(email_confirmed_at, 'DD/MM/YYYY HH24:MI:SS') as "Data Confirmação",
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMADO'
    ELSE '❌ AINDA NÃO CONFIRMADO'
  END as status
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');

-- =====================================================
-- RESULTADO
-- =====================================================

SELECT '' as separador;
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users 
          WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
          AND email_confirmed_at IS NOT NULL) = 2
    THEN '✅ EMAILS CONFIRMADOS COM SUCESSO!'
    ELSE '⚠️ Alguns emails ainda não foram confirmados'
  END as resultado;

SELECT 'Agora tente fazer login novamente' as proxima_acao;
