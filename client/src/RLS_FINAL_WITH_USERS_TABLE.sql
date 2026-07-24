-- ==========================================
-- SOLUÇÃO DEFINITIVA: RLS COM TABELA USERS
-- ==========================================
-- Este script cria políticas RLS que funcionam COM a tabela users
-- após sincronizar os usuários do Auth para a tabela users

-- PASSO 1: Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Admin and attendant can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can update meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can delete meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Temporary allow all authenticated" ON internal_meetings;
DROP POLICY IF EXISTS "Authenticated users can view their meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Authenticated users can create meetings" ON internal_meetings;

-- PASSO 2: Criar políticas RLS corrigidas

-- Política SELECT: Usuários podem ver reuniões onde são organizadores ou participantes
CREATE POLICY "Users can view their meetings" ON internal_meetings
  FOR SELECT
  USING (
    auth.uid() = organizer_id OR 
    auth.uid() = participant_id
  );

-- Política INSERT: Apenas usuários autenticados que existem na tabela users podem criar
CREATE POLICY "Authenticated users with profile can create meetings" ON internal_meetings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = organizer_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

-- Política UPDATE: Apenas organizador pode atualizar
CREATE POLICY "Organizer can update meeting" ON internal_meetings
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Política DELETE: Apenas organizador pode deletar
CREATE POLICY "Organizer can delete meeting" ON internal_meetings
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- PASSO 3: Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'internal_meetings'
ORDER BY policyname;

-- PASSO 4: Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'internal_meetings';

-- ==========================================
-- INFORMAÇÕES
-- ==========================================
-- ✅ Estas políticas permitem:
--    1. Qualquer usuário ver suas próprias reuniões
--    2. Criar reuniões apenas se existir na tabela users
--    3. Atualizar/Deletar apenas se for o organizador
--
-- 🔄 O sistema agora sincroniza automaticamente:
--    - No login: sincroniza usuário atual
--    - Endpoint /sync-all-users: sincroniza todos (admin)
--
-- 📝 Para sincronizar manualmente todos os usuários:
--    POST /make-server-8b82752b/sync-all-users
--    (Requer token de admin)
