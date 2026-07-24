-- ==========================================
-- CRIAR TABELA USERS SE NÃO EXISTIR
-- ==========================================

-- Verificar se tabela users existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Criar tabela users com estrutura básica
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'atendente',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Criar política para permitir leitura por usuários autenticados
        CREATE POLICY "Users can read all users" ON public.users
            FOR SELECT
            USING (auth.uid() IS NOT NULL);

        -- Criar política para permitir atualização do próprio perfil
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);

        -- Criar política para permitir inserção pelo SERVICE_ROLE (sync)
        CREATE POLICY "Service role can insert users" ON public.users
            FOR INSERT
            WITH CHECK (true);

        RAISE NOTICE 'Tabela users criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela users já existe';
    END IF;
END $$;

-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public';
