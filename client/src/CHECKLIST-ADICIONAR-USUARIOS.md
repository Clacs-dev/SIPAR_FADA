# ✅ CHECKLIST - Adicionar Compras e Motorista

## 📋 CHECKLIST COMPLETO

### PASSO 1: Executar Script SQL

- [ ] Abrir Supabase Dashboard
- [ ] Clicar em **SQL Editor**
- [ ] Clicar em **New query**
- [ ] Abrir ficheiro **SCRIPT-FINAL-ADICIONAR-2-USUARIOS.sql**
- [ ] Copiar TODO o conteúdo do ficheiro
- [ ] Colar no SQL Editor
- [ ] Clicar em **RUN**
- [ ] Ver mensagem: "✅ SCRIPT EXECUTADO COM SUCESSO!"
- [ ] Confirmar que aparecem 2 utilizadores na verificação

### PASSO 2: Criar Autenticação para COMPRAS

- [ ] Clicar em **Authentication** (menu lateral)
- [ ] Clicar em **Users**
- [ ] Clicar em **Add user** (botão verde)
- [ ] Clicar em **Create new user**
- [ ] Digitar email: `compras@sistema.com`
- [ ] Digitar senha: `Compras@2026`
- [ ] ✅ Marcar: **Auto Confirm User**
- [ ] Clicar em **Create user**
- [ ] Ver mensagem de sucesso

### PASSO 3: Criar Autenticação para MOTORISTA

- [ ] Clicar em **Add user** novamente
- [ ] Clicar em **Create new user**
- [ ] Digitar email: `motorista@sistema.com`
- [ ] Digitar senha: `Motorista@2026`
- [ ] ✅ Marcar: **Auto Confirm User**
- [ ] Clicar em **Create user**
- [ ] Ver mensagem de sucesso

### PASSO 4: Verificação Final

- [ ] Ir para **Authentication → Users**
- [ ] Confirmar que `compras@sistema.com` aparece na lista
- [ ] Confirmar que `motorista@sistema.com` aparece na lista
- [ ] Executar SQL de verificação (abaixo)

---

## 🔍 SQL DE VERIFICAÇÃO FINAL

Execute isto para confirmar:

```sql
-- Ver os 2 novos utilizadores
SELECT 
  value->>'email' as email,
  value->>'name' as nome,
  value->>'department' as departamento
FROM kv_store_8b82752b
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001');

-- Contar total de utilizadores
SELECT COUNT(*) as total
FROM kv_store_8b82752b 
WHERE key LIKE 'user_profile:%';
-- Deve retornar: 8
```

**Resultado esperado:**
- ✅ 2 utilizadores aparecem
- ✅ Total = 8 utilizadores

---

## ✅ TUDO PRONTO!

Se todos os checkboxes estiverem marcados:

🎉 **PARABÉNS!** Você adicionou com sucesso:
- ✅ compras@sistema.com
- ✅ motorista@sistema.com

---

## 📊 SISTEMA AGORA TEM 8 UTILIZADORES

| # | Email | Tipo |
|---|-------|------|
| 1 | admin@sistema.com | Admin |
| 2 | atendente@sistema.com | Attendant |
| 3 | usuario@empresa.com | User |
| 4 | gerente@sistema.ao | Admin |
| 5 | financeiro@sistema.ao | Attendant |
| 6 | operador@sistema.ao | Attendant |
| 7 | **compras@sistema.com** ⭐ | **User (NOVO)** |
| 8 | **motorista@sistema.com** ⭐ | **User (NOVO)** |

---

## 🧪 TESTE DE LOGIN

- [ ] Fazer logout do sistema
- [ ] Tentar login com: `compras@sistema.com` / `Compras@2026`
- [ ] Confirmar que login funciona
- [ ] Fazer logout
- [ ] Tentar login com: `motorista@sistema.com` / `Motorista@2026`
- [ ] Confirmar que login funciona

---

**Marque os checkboxes conforme vai completando!** ✅
