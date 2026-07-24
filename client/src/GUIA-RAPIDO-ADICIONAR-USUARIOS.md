# ⚡ GUIA RÁPIDO - Adicionar Compras e Motorista

## 🎯 O QUE VAMOS FAZER

Adicionar 2 novos utilizadores ao sistema:
- ✅ compras@sistema.com
- ✅ motorista@sistema.com

---

## 📋 PASSO 1: Verificar Nome da Tabela

Antes de executar, veja qual nome da tabela KV você usa:

```sql
-- Execute isto primeiro no SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%kv_store%';
```

**Resultado esperado:**
- `kv_store_8b82752b` → Use o ficheiro `ADICIONAR-COMPRAS-MOTORISTA.sql`
- `kv_store` → Use o ficheiro `ADICIONAR-COMPRAS-MOTORISTA-ALTERNATIVO.sql`

---

## 📋 PASSO 2: Executar Script SQL

### Se a tabela for `kv_store_8b82752b`:

1. Abra o Supabase SQL Editor
2. Copie TODO o conteúdo de: **`ADICIONAR-COMPRAS-MOTORISTA.sql`**
3. Cole no SQL Editor
4. Clique em **RUN**
5. Verifique se apareceu: "✅ VERIFICAÇÃO - NOVOS UTILIZADORES CRIADOS"

### Se a tabela for apenas `kv_store`:

1. Abra o Supabase SQL Editor
2. Copie TODO o conteúdo de: **`ADICIONAR-COMPRAS-MOTORISTA-ALTERNATIVO.sql`**
3. Cole no SQL Editor
4. Clique em **RUN**
5. Verifique se apareceu: "✅ VERIFICAÇÃO - NOVOS UTILIZADORES CRIADOS"

---

## 📋 PASSO 3: Criar Autenticação

⚠️ **IMPORTANTE:** Os utilizadores já têm perfil no sistema, mas precisam de conta de autenticação para fazer login.

### Opção Mais Fácil: Via Dashboard

1. **Acesse:** Supabase Dashboard → **Authentication** → **Users**
2. **Clique:** "Add user" → "Create new user"
3. **Preencha:**

   **COMPRAS:**
   ```
   Email: compras@sistema.com
   Password: Compras@2026
   Auto Confirm User: ✅ (marque isto!)
   ```

4. **Clique:** "Create user"
5. **Repita para MOTORISTA:**
   ```
   Email: motorista@sistema.com
   Password: Motorista@2026
   Auto Confirm User: ✅ (marque isto!)
   ```

---

## 📋 PASSO 4: Verificar se Funcionou

Execute isto no SQL Editor:

```sql
-- Ver os 2 novos utilizadores
SELECT 
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo"
FROM kv_store_8b82752b  -- ou apenas kv_store
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001');
```

**Resultado esperado:**

| 📧 Email | 👤 Nome | 🏢 Departamento | 💼 Cargo |
|---------|---------|----------------|---------|
| compras@sistema.com | Responsável de Compras | aquisicoes | Responsável de Aquisições e Compras |
| motorista@sistema.com | Motorista da Frota | operacional_frota | Motorista |

---

## ✅ CHECKLIST

- [ ] Verificar nome da tabela (`kv_store` ou `kv_store_8b82752b`)
- [ ] Executar script SQL correspondente
- [ ] Ver mensagem de sucesso "✅ VERIFICAÇÃO"
- [ ] Criar autenticação para compras@sistema.com no Dashboard
- [ ] Criar autenticação para motorista@sistema.com no Dashboard
- [ ] Verificar no SQL se os utilizadores aparecem
- [ ] Testar login (opcional)

---

## 🚨 SE DER ERRO

### Erro: "relation kv_store does not exist"

**Solução:** Você usou o script errado. Verifique o nome da tabela:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%kv_store%';
```

E use o script correto:
- `kv_store_8b82752b` → `ADICIONAR-COMPRAS-MOTORISTA.sql`
- `kv_store` → `ADICIONAR-COMPRAS-MOTORISTA-ALTERNATIVO.sql`

### Erro: "duplicate key value"

**Solução:** Os utilizadores já existem. Para atualizar, o script já tem `ON CONFLICT`, então deve funcionar. Se persistir, delete primeiro:

```sql
DELETE FROM kv_store_8b82752b 
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001');
```

### Erro: "syntax error"

**Solução:** Verifique se copiou TODO o conteúdo do ficheiro SQL. Não copie apenas parte dele.

---

## 📊 DADOS DOS UTILIZADORES

| Campo | Compras | Motorista |
|-------|---------|-----------|
| **Email** | compras@sistema.com | motorista@sistema.com |
| **Password** | Compras@2026 | Motorista@2026 |
| **Nome** | Responsável de Compras | Motorista da Frota |
| **Departamento** | aquisicoes | operacional_frota |
| **Telefone** | +244 923 100 001 | +244 923 200 001 |

---

## 🎯 PRONTO!

Depois de executar estes 4 passos, seus utilizadores estarão prontos para usar:
- ✅ Perfis criados no sistema
- ✅ Autenticação configurada
- ✅ Podem fazer login
- ✅ Associados aos departamentos corretos

---

**Executou? Me confirme se funcionou!** 🚀
