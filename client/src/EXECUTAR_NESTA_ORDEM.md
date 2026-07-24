# 🎯 EXECUTAR NESTA ORDEM - SOLUÇÃO DEFINITIVA

## ⚠️ PROBLEMA ATUAL
```
❌ Erro: Could not find the 'departamento' column of 'users'
```

**Causa:** O código estava tentando usar colunas que não existem na tabela `users`.

## ✅ SOLUÇÃO

Execute os comandos SQL **NESTA ORDEM** no Supabase SQL Editor:

---

### **1️⃣ VERIFICAR SE TABELA USERS EXISTE**

Execute o conteúdo de:
```
/CHECK_USERS_TABLE_STRUCTURE.sql
```

**Resultado esperado:**
- Se aparecer colunas → Tabela existe ✅
- Se aparecer vazio → Tabela NÃO existe → Siga para passo 2

---

### **2️⃣ CRIAR TABELA USERS (se não existir)**

Execute o conteúdo de:
```
/CREATE_USERS_TABLE_IF_NOT_EXISTS.sql
```

**Resultado esperado:**
```
NOTICE: Tabela users criada com sucesso!
```

ou

```
NOTICE: Tabela users já existe
```

---

### **3️⃣ CORRIGIR POLÍTICAS RLS DE INTERNAL_MEETINGS**

Execute o conteúdo de:
```
/RLS_FIXED_SIMPLE.sql
```

**Resultado esperado:**
```
Políticas criadas com sucesso (4 políticas)
```

---

### **4️⃣ TESTAR NO NAVEGADOR**

1. Recarregue a aplicação (Ctrl+Shift+R ou Cmd+Shift+R)
2. Faça **LOGOUT**
3. Faça **LOGIN** novamente
4. Veja no console:
   ```
   ✅ Usuário sincronizado: created
   ```
5. Tente **agendar uma reunião**
6. **DEVE FUNCIONAR!** 🎉

---

## 📝 O QUE FOI CORRIGIDO

### **Antes (ERRO):**
```typescript
// Tentava usar colunas que não existem
insert({
  id: user.id,
  email: user.email,
  name: user.name,
  role: 'atendente',
  departamento: null,  // ❌ Coluna não existe
  telefone: null,      // ❌ Coluna não existe
})
```

### **Depois (CORRIGIDO):**
```typescript
// Usa apenas colunas básicas que existem
insert({
  id: user.id,
  email: user.email,
  name: user.name,
  role: 'atendente',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
```

---

## 🔍 ESTRUTURA DA TABELA USERS

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'atendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Colunas:**
- `id` - UUID do Supabase Auth
- `email` - Email do usuário
- `name` - Nome do usuário
- `role` - Role/perfil (admin, atendente, etc)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

---

## 🆘 TROUBLESHOOTING

### Se aparecer "tabela users não encontrada":
```sql
-- Execute o script de criação
/CREATE_USERS_TABLE_IF_NOT_EXISTS.sql
```

### Se aparecer "coluna X não existe":
O código já foi corrigido para usar apenas:
- `id`, `email`, `name`, `role`, `created_at`, `updated_at`

### Se ainda der erro RLS:
```sql
-- Verificar se usuário foi criado
SELECT * FROM users WHERE email = 'seu-email@exemplo.com';
```

Se não aparecer, faça logout/login para forçar sincronização.

---

## ✅ CHECKLIST

- [ ] Executei `/CHECK_USERS_TABLE_STRUCTURE.sql`
- [ ] Executei `/CREATE_USERS_TABLE_IF_NOT_EXISTS.sql`
- [ ] Executei `/RLS_FIXED_SIMPLE.sql`
- [ ] Recarreguei a aplicação
- [ ] Fiz logout
- [ ] Fiz login novamente
- [ ] Vi "✅ Usuário sincronizado" no console
- [ ] Consegui agendar uma reunião

---

## 🎉 PRONTO!

Após executar os 3 SQLs nesta ordem, o sistema estará funcionando perfeitamente!

**Execute agora e me diga o resultado!** 🚀
