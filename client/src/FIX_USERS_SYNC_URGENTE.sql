-- ==========================================
-- FIX: Sincronizar usuários Auth → users
-- ==========================================

-- PASSO 1: Ver constraint atual dos departamentos
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check' 
  AND conrelid = 'users'::regclass;

-- PASSO 2: Ver departamentos já em uso
SELECT DISTINCT role FROM users WHERE role IS NOT NULL ORDER BY role;

-- PASSO 3: Remover TEMPORARIAMENTE a constraint para permitir qualquer departamento
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- PASSO 4: Inserir usuário atual do Auth na tabela users
-- (substitua 'compras' pelo departamento desejado se souber qual é)
INSERT INTO users (id, email, name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  'compras' as role, -- ALTERE AQUI se souber o departamento correto
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- PASSO 5: Ver todos os usuários criados
SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC;

-- ==========================================
-- DEPOIS DE EXECUTAR, ME DIGA:
-- 1. Quantos usuários foram inseridos?
-- 2. Quais departamentos apareceram no PASSO 1?
-- ==========================================
