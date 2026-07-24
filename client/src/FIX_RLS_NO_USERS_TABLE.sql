-- ✅ SOLUÇÃO DEFINITIVA - RLS SEM DEPENDER DA TABELA USERS

-- PASSO 1: Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Admin and attendant can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can update meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can delete meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Temporary allow all authenticated" ON internal_meetings;

-- PASSO 2: Criar políticas que NÃO dependem da tabela users
-- Qualquer usuário AUTENTICADO pode criar reuniões

-- Política: Usuários autenticados podem ver reuniões onde são organizadores ou participantes
CREATE POLICY "Authenticated users can view their meetings" ON internal_meetings
  FOR SELECT
  USING (
    auth.uid() = organizer_id OR 
    auth.uid() = participant_id
  );

-- Política: Qualquer usuário AUTENTICADO pode criar reuniões
CREATE POLICY "Authenticated users can create meetings" ON internal_meetings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = organizer_id
  );

-- Política: Apenas o organizador pode atualizar a reunião
CREATE POLICY "Organizer can update meeting" ON internal_meetings
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Política: Apenas o organizador pode deletar a reunião
CREATE POLICY "Organizer can delete meeting" ON internal_meetings
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- PASSO 3: Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'internal_meetings';
