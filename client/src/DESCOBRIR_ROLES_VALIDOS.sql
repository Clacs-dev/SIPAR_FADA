-- ==========================================
-- DESCOBRIR CONSTRAINT DE ROLES
-- ==========================================

-- 1. Ver definição da constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check' 
  AND conrelid = 'users'::regclass;

-- 2. Ver estrutura completa da tabela users
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver todos os roles atualmente em uso
SELECT DISTINCT role 
FROM users 
WHERE role IS NOT NULL
ORDER BY role;

-- 4. Ver todas as constraints da tabela users
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
ORDER BY conname;
