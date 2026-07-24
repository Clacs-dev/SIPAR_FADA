-- 🚨 EXECUTAR ESTE SQL NO SUPABASE SQL EDITOR
-- Este SQL corrige APENAS as políticas RLS sem deletar dados

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Admin and attendant can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can update meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can delete meeting" ON internal_meetings;

-- 2. Recriar políticas com a tabela correta
CREATE POLICY "Users can view their own meetings" ON internal_meetings
  FOR SELECT
  USING (
    auth.uid() = organizer_id OR 
    auth.uid() = participant_id
  );

CREATE POLICY "Admin and attendant can create meetings" ON internal_meetings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'atendente', 'secretaria')
    )
  );

CREATE POLICY "Organizer can update meeting" ON internal_meetings
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizer can delete meeting" ON internal_meetings
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- 3. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'internal_meetings';