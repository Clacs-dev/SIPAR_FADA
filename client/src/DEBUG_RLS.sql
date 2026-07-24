-- 🔍 DIAGNÓSTICO RLS - EXECUTAR NO SUPABASE SQL EDITOR

-- 1. Verificar se a tabela users existe e tem dados
SELECT 'Tabela USERS - Dados:' as info;
SELECT id, email, role, department FROM users LIMIT 10;

-- 2. Verificar qual é o auth.uid() atual
SELECT 'AUTH.UID atual:' as info;
SELECT auth.uid() as current_user_id;

-- 3. Verificar se o usuário atual está na tabela users
SELECT 'Usuário atual existe na tabela users?' as info;
SELECT * FROM users WHERE id = auth.uid();

-- 4. Verificar políticas RLS ativas
SELECT 'Políticas RLS ativas:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text,
  with_check::text
FROM pg_policies
WHERE tablename = 'internal_meetings';

-- 5. Verificar se RLS está habilitado
SELECT 'RLS habilitado?' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'internal_meetings';
