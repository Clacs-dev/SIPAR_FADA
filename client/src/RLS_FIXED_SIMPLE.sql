-- ==========================================
-- RLS CORRIGIDO - VERSÃO SIMPLIFICADA
-- ==========================================

-- PASSO 1: Remover todas as políticas antigas de internal_meetings
DROP POLICY IF EXISTS "Users can view their own meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Admin and attendant can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can update meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can delete meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Temporary allow all authenticated" ON internal_meetings;
DROP POLICY IF EXISTS "Authenticated users can view their meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Authenticated users can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Authenticated users with profile can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Users can view their meetings" ON internal_meetings;

-- PASSO 2: Criar políticas simplificadas

-- SELECT: Usuários veem reuniões onde são organizadores ou participantes
CREATE POLICY "view_own_meetings" ON internal_meetings
  FOR SELECT
  USING (
    auth.uid() = organizer_id OR 
    auth.uid() = participant_id
  );

-- INSERT: Usuários autenticados que existem na tabela users podem criar
CREATE POLICY "create_meetings" ON internal_meetings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = organizer_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
  );

-- UPDATE: Apenas organizador pode atualizar
CREATE POLICY "update_own_meetings" ON internal_meetings
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- DELETE: Apenas organizador pode deletar
CREATE POLICY "delete_own_meetings" ON internal_meetings
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- PASSO 3: Garantir que RLS está habilitado
ALTER TABLE internal_meetings ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Verificar políticas
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'internal_meetings'
ORDER BY policyname;
