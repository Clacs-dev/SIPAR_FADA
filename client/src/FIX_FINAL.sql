# ✅ CORREÇÃO FINAL - EXECUTAR ESTE SQL NO SUPABASE

## 🎯 EXECUTE APENAS ESTE SQL:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Admin and attendant can create meetings" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can update meeting" ON internal_meetings;
DROP POLICY IF EXISTS "Organizer can delete meeting" ON internal_meetings;

-- Recriar políticas com a tabela correta (users)
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
```

---

## ✅ APÓS EXECUTAR:

1. ✅ Execute o SQL no **Supabase Dashboard → Database → SQL Editor**
2. ✅ Aguarde o sucesso (deve retornar sem erros)
3. ✅ Recarregue a página do aplicativo
4. ✅ Tente criar uma nova reunião interna
5. 🚀 **Deve funcionar perfeitamente agora!**

---

## 🔍 O QUE FOI CORRIGIDO:

### Problema:
- ❌ As políticas RLS estavam procurando na tabela **`users_8b82752b`**
- ❌ Mas a tabela real é **`users`** (sem sufixo)

### Solução:
- ✅ Políticas RLS agora usam **`users`** (nome correto da tabela)
- ✅ Frontend e backend já estavam corretos
- ✅ Migration atualizada para usar `users` nas foreign keys

---

## 📊 VERIFICAÇÃO:

Para verificar se as políticas foram criadas corretamente:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'internal_meetings';
```

**Resultado esperado:**
```
policyname                              | cmd    | qual                                  | with_check
----------------------------------------|--------|---------------------------------------|------------
Users can view their own meetings       | SELECT | (auth.uid() = organizer_id) OR ...    | NULL
Admin and attendant can create meetings | INSERT | NULL                                  | (EXISTS...)
Organizer can update meeting            | UPDATE | (auth.uid() = organizer_id)           | (auth.uid() = organizer_id)
Organizer can delete meeting            | DELETE | (auth.uid() = organizer_id)           | NULL
```

✅ Se você ver estas 4 políticas, está **PERFEITO**!
