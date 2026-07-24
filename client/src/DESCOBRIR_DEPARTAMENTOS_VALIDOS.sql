-- ==========================================
-- DESCOBRIR DEPARTAMENTOS VÁLIDOS (ROLES)
-- ==========================================

-- 1. Ver definição EXATA da constraint de role (mostra os 27 departamentos)
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check' 
  AND conrelid = 'users'::regclass;

-- 2. Ver todos os departamentos/roles atualmente em uso
SELECT DISTINCT role 
FROM users 
WHERE role IS NOT NULL
ORDER BY role;

-- 3. Contar usuários por departamento
SELECT role, COUNT(*) as total
FROM users
WHERE role IS NOT NULL
GROUP BY role
ORDER BY total DESC;
