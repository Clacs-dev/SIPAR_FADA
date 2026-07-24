# 🚨 INSTRUÇÕES PARA CORRIGIR A TABELA internal_meetings

## ❌ Problema
A tabela `internal_meetings` foi criada com **camelCase** (ex: `organizerId`, `meetingDate`) mas o PostgreSQL converteu tudo para **minúsculas sem underscores** (ex: `organizerid`, `meetingdate`), causando erro `"Could not find the 'end_time' column"`.

## ✅ Solução
Você precisa **executar a migration manualmente** no Supabase para recriar a tabela com **snake_case explícito** (`organizer_id`, `meeting_date`, `start_time`, `end_time`).

---

## 📋 PASSO A PASSO

### **1. Acesse o Painel do Supabase**
- Abra: https://supabase.com/dashboard
- Selecione seu projeto
- Vá para: **Database** → **SQL Editor**

### **2. Execute o SQL abaixo:**

```sql
-- Drop tabela existente (se houver)
DROP TABLE IF EXISTS internal_meetings CASCADE;

-- Criar tabela de reuniões internas com snake_case explícito
CREATE TABLE internal_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES users_8b82752b(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users_8b82752b(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('presencial', 'online')),
  location TEXT,
  platform TEXT,
  meeting_link TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado', 'reagendado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX idx_internal_meetings_organizer ON internal_meetings(organizer_id);
CREATE INDEX idx_internal_meetings_participant ON internal_meetings(participant_id);
CREATE INDEX idx_internal_meetings_date ON internal_meetings(meeting_date);
CREATE INDEX idx_internal_meetings_status ON internal_meetings(status);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_internal_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER trigger_update_internal_meetings_updated_at
  BEFORE UPDATE ON internal_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_internal_meetings_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE internal_meetings ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver reuniões onde são organizadores ou participantes
CREATE POLICY "Users can view their own meetings" ON internal_meetings
  FOR SELECT
  USING (
    auth.uid() = organizer_id OR 
    auth.uid() = participant_id
  );

-- Política: Administradores e atendentes podem criar reuniões
CREATE POLICY "Admin and attendant can create meetings" ON internal_meetings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_8b82752b 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'atendente', 'secretaria')
    )
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
```

### **3. Clique em "Run" ou "Execute"**

### **4. Verifique se a Tabela Foi Criada Corretamente**
Execute este SQL para verificar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'internal_meetings'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
column_name       | data_type
------------------|------------------------
id                | uuid
organizer_id      | uuid
participant_id    | uuid
title             | text
description       | text
meeting_date      | date
start_time        | time without time zone
end_time          | time without time zone
meeting_type      | text
location          | text
platform          | text
meeting_link      | text
priority          | text
status            | text
created_at        | timestamp with time zone
updated_at        | timestamp with time zone
```

✅ Se você ver **`start_time`** e **`end_time`** (com underscores), está correto!
❌ Se você ver **`starttime`** e **`endtime`** (sem underscores), execute o SQL novamente.

---

## 🎯 Após Executar a Migration

1. **Recarregue a página** do seu aplicativo
2. **Tente criar uma nova reunião interna**
3. ✅ Deve funcionar perfeitamente!

---

## ⚠️ IMPORTANTE
- A migration **deleta** a tabela antiga e cria uma nova
- Se você tinha dados de teste, eles serão perdidos
- Após executar a migration, **NÃO** precisa reiniciar o servidor
- O schema cache do Supabase será atualizado automaticamente

---

## 🔧 Troubleshooting

### Se continuar dando erro:
1. Verifique se a migration foi executada com sucesso
2. Verifique se não há erros no console do Supabase
3. Verifique se a tabela `users_8b82752b` existe (necessária para as foreign keys)
4. Tente executar `REFRESH MATERIALIZED VIEW` no Supabase para limpar o cache

### Se precisar verificar o schema atual:
```sql
\d internal_meetings
```

Ou:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'internal_meetings'
ORDER BY ordinal_position;
```