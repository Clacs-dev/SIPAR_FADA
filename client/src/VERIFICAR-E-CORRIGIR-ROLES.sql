-- =====================================================
-- 🔍 VERIFICAR E CORRIGIR ROLES DOS UTILIZADORES
-- =====================================================

SELECT '🔍 VERIFICAR ESTADO ATUAL DOS UTILIZADORES' as titulo;
SELECT '' as separador;

-- Ver todos os utilizadores atuais
SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role Atual",
  value->>'department' as "Department",
  value->>'profiles' as "Profiles",
  CASE 
    WHEN value->>'role' = value->>'department' THEN '✅ CORRETO'
    ELSE '❌ Role ≠ Department'
  END as "Status"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

SELECT '' as separador;
SELECT '═══════════════════════════════════════════════════' as divisor;
SELECT '🔧 CORRIGIR ROLES (role = department)' as titulo_correcao;
SELECT '═══════════════════════════════════════════════════' as divisor;

-- =====================================================
-- CORREÇÃO: Atualizar role para ser igual ao department
-- =====================================================

-- Atualizar todos os utilizadores onde role ≠ department
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  value->'department'
)
WHERE key LIKE 'user_profile:%'
AND value->>'role' != value->>'department';

SELECT '✅ Roles atualizados (role = department)' as resultado;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '📊 ESTADO FINAL DOS UTILIZADORES' as titulo_final;
SELECT '' as separador;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role",
  value->>'department' as "Department",
  CASE 
    WHEN value->>'role' = value->>'department' THEN '✅ CORRETO'
    ELSE '❌ ERRO'
  END as "Status"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

SELECT '' as separador;
SELECT '✅ SCRIPT FINALIZADO!' as titulo_final;
