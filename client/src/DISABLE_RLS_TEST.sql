-- 🧪 TESTE: DESABILITAR RLS COMPLETAMENTE
-- ⚠️ ISSO É APENAS PARA TESTE - NÃO DEIXE ASSIM EM PRODUÇÃO

-- Desabilitar RLS na tabela
ALTER TABLE internal_meetings DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desabilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'internal_meetings';

-- Resultado esperado: rowsecurity = false
