-- =====================================================
-- 🔄 MIGRAÇÃO: ROLES FIXOS → ROLES POR DEPARTAMENTO
-- =====================================================
-- ANTES: 3 roles fixos (admin, attendant, user)
-- DEPOIS: 27 roles (um para cada departamento)
-- =====================================================

SELECT '🔄 MIGRAÇÃO DE ROLES PARA DEPARTAMENTOS' as titulo;
SELECT 'Sistema Novo: role = department (27 departamentos)' as info;

-- =====================================================
-- VERIFICAR UTILIZADORES ATUAIS
-- =====================================================

SELECT '' as separador;
SELECT '📊 UTILIZADORES ATUAIS (ANTES DA MIGRAÇÃO)' as secao;

SELECT 
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role Antigo",
  value->>'department' as "Department Antigo"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- MAPEAMENTO: Role Antigo → Role Novo
-- =====================================================

SELECT '' as separador;
SELECT '🗺️ MAPEAMENTO DOS 8 UTILIZADORES' as secao;
SELECT '' as separador;

SELECT '1. admin@sistema.com' as usuario,
       'admin → administracao' as migracao,
       'Administração' as department_final;

SELECT '2. atendente@sistema.com' as usuario,
       'attendant → secretaria' as migracao,
       'Secretaria' as department_final;

SELECT '3. usuario@empresa.com' as usuario,
       'user → externo' as migracao,
       'Externo' as department_final;

SELECT '4. gerente@sistema.ao' as usuario,
       'admin → gestao' as migracao,
       'Gestão' as department_final;

SELECT '5. financeiro@sistema.ao' as usuario,
       'attendant → financeiro' as migracao,
       'Financeiro' as department_final;

SELECT '6. operador@sistema.ao' as usuario,
       'attendant → operacoes' as migracao,
       'Operações' as department_final;

SELECT '7. compras@sistema.com (NOVO)' as usuario,
       'user → compras' as migracao,
       'Compras' as department_final;

SELECT '8. motorista@sistema.com (NOVO)' as usuario,
       'user → operacional_frota' as migracao,
       'Operacional e Frota' as department_final;

-- =====================================================
-- EXECUTAR MIGRAÇÃO
-- =====================================================

SELECT '' as separador;
SELECT '⚡ EXECUTANDO MIGRAÇÃO...' as secao;

-- 1. admin@sistema.com: admin → administracao
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"administracao"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'admin@sistema.com';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"administracao"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'admin@sistema.com';

SELECT '✅ 1/8 - admin@sistema.com migrado' as status;

-- 2. atendente@sistema.com: attendant → secretaria
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"secretaria"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'atendente@sistema.com';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"secretaria"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'atendente@sistema.com';

SELECT '✅ 2/8 - atendente@sistema.com migrado' as status;

-- 3. usuario@empresa.com: user → externo
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"externo"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'usuario@empresa.com';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"externo"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'usuario@empresa.com';

SELECT '✅ 3/8 - usuario@empresa.com migrado' as status;

-- 4. gerente@sistema.ao: admin → gestao
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"gestao"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'gerente@sistema.ao';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"gestao"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'gerente@sistema.ao';

SELECT '✅ 4/8 - gerente@sistema.ao migrado' as status;

-- 5. financeiro@sistema.ao: attendant → financeiro
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"financeiro"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'financeiro@sistema.ao';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"financeiro"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'financeiro@sistema.ao';

SELECT '✅ 5/8 - financeiro@sistema.ao migrado' as status;

-- 6. operador@sistema.ao: attendant → operacoes
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"operacoes"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'operador@sistema.ao';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"operacoes"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'operador@sistema.ao';

SELECT '✅ 6/8 - operador@sistema.ao migrado' as status;

-- 7. compras@sistema.com (se existir): user → compras
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"compras"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'compras@sistema.com';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"compras"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'compras@sistema.com';

SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM kv_store_8b82752b WHERE value->>'email' = 'compras@sistema.com')
  THEN '✅ 7/8 - compras@sistema.com migrado'
  ELSE '⚠️ 7/8 - compras@sistema.com não existe (será criado depois)'
END as status;

-- 8. motorista@sistema.com (se existir): user → operacional_frota
UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{role}',
  '"operacional_frota"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'motorista@sistema.com';

UPDATE kv_store_8b82752b
SET value = jsonb_set(
  value,
  '{department}',
  '"operacional_frota"'
)
WHERE key LIKE 'user_profile:%'
AND value->>'email' = 'motorista@sistema.com';

SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM kv_store_8b82752b WHERE value->>'email' = 'motorista@sistema.com')
  THEN '✅ 8/8 - motorista@sistema.com migrado'
  ELSE '⚠️ 8/8 - motorista@sistema.com não existe (será criado depois)'
END as status;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

SELECT '' as separador;
SELECT '📊 UTILIZADORES APÓS MIGRAÇÃO' as secao;

SELECT 
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role NOVO (deve = department)",
  value->>'department' as "Department",
  CASE 
    WHEN value->>'role' = value->>'department' THEN '✅ CORRETO'
    ELSE '❌ ERRO: role ≠ department'
  END as "Status"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';

-- =====================================================
-- VALIDAÇÃO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '🔍 VALIDAÇÃO FINAL' as secao;

-- Contar quantos foram migrados corretamente
SELECT 
  COUNT(*) as "Total de Utilizadores",
  SUM(CASE WHEN value->>'role' = value->>'department' THEN 1 ELSE 0 END) as "Migrados Corretamente",
  SUM(CASE WHEN value->>'role' != value->>'department' THEN 1 ELSE 0 END) as "Com Erro"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%';

-- Listar os 27 departamentos/roles disponíveis
SELECT '' as separador;
SELECT '📋 27 DEPARTAMENTOS/ROLES DISPONÍVEIS:' as info;

SELECT '1. gabinete_pca' as dept UNION ALL
SELECT '2. gabinete_pce' UNION ALL
SELECT '3. gabinete_administrador' UNION ALL
SELECT '4. gabinete_director' UNION ALL
SELECT '5. gabinete_ministro' UNION ALL
SELECT '6. gabinete_secretario_estado_1' UNION ALL
SELECT '7. gabinete_secretario_estado_2' UNION ALL
SELECT '8. gabinete_vice_governador_1' UNION ALL
SELECT '9. gabinete_vice_governador_2' UNION ALL
SELECT '10. financeiro' UNION ALL
SELECT '11. recursos_humanos' UNION ALL
SELECT '12. juridico' UNION ALL
SELECT '13. compras' UNION ALL
SELECT '14. tecnologia_informacao' UNION ALL
SELECT '15. administracao' UNION ALL
SELECT '16. administrativo' UNION ALL
SELECT '17. comunicacao_imagem' UNION ALL
SELECT '18. seguranca' UNION ALL
SELECT '19. planeamento' UNION ALL
SELECT '20. organizacao_qualidade' UNION ALL
SELECT '21. compliance' UNION ALL
SELECT '22. risco' UNION ALL
SELECT '23. secretaria (NOVO)' UNION ALL
SELECT '24. externo (NOVO)' UNION ALL
SELECT '25. gestao (NOVO)' UNION ALL
SELECT '26. operacoes (NOVO)' UNION ALL
SELECT '27. operacional_frota (NOVO)';

-- =====================================================
-- RESULTADO FINAL
-- =====================================================

SELECT '' as separador;
SELECT '✅ MIGRAÇÃO CONCLUÍDA!' as titulo;
SELECT '' as separador;
SELECT 'Todos os utilizadores agora têm: role = department' as info_1;
SELECT 'Total de departamentos/roles: 27' as info_2;
SELECT '' as separador;
SELECT '📌 PRÓXIMOS PASSOS:' as proximos;
SELECT '1. Criar os 2 novos utilizadores (compras e motorista)' as passo_1;
SELECT '2. Atualizar sistema de permissões no backend' as passo_2;
SELECT '3. Atualizar sistema de permissões no frontend' as passo_3;