-- 🚀 SOLUÇÃO TEMPORÁRIA - POLÍTICA RLS PERMISSIVA PARA TESTE

-- PASSO 1: Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view their own meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Admin and attendant can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can update meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can delete meeting" ON internal_meetings;

-- PASSO 2: Criar política temporária PERMISSIVA para testar
-- Esta política permite qualquer usuário autenticado criar/ver/editar
CREATE POLICY "Temporary allow all authenticated" ON internal_meetings
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- PASSO 3: Verificar se a política foi criada
SELECT 
  policyname,
  cmd,
  qual::text,
  with_check::text
FROM pg_policies
WHERE tablename = 'internal_meetings';
