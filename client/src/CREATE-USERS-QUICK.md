# 🚀 Criação Rápida de Utilizadores - Guia Express

## ⚡ Método Mais Rápido (2 minutos)

### **PASSO 1: Executar SQL no Supabase**

1. Aceda ao **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor** (menu lateral esquerdo)
4. Cole o seguinte SQL:

```sql
-- Inserir 3 novos utilizadores
INSERT INTO users (id, email, name, role, department, position)
VALUES 
  -- Gerente
  (
    '00000000-0000-0000-0000-000000000004', 
    'gerente@sistema.ao', 
    'João Gerente', 
    'admin',
    'Gestão', 
    'Gerente Geral'
  ),
  
  -- Financeiro
  (
    '00000000-0000-0000-0000-000000000005', 
    'financeiro@sistema.ao', 
    'Maria Financeira', 
    'attendant',
    'Financeiro', 
    'Responsável Financeiro'
  ),
  
  -- Operador
  (
    '00000000-0000-0000-0000-000000000006', 
    'operador@sistema.ao', 
    'Carlos Operador', 
    'attendant',
    'Operações', 
    'Operador de Frota'
  )
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT id, email, name, role, department, position FROM users ORDER BY created_at;
```

5. Clique em **RUN** (ou Ctrl+Enter)
6. ✅ Deverá ver os 6 utilizadores listados

---

### **PASSO 2: Criar Contas no Supabase Auth**

Agora precisa criar as contas de autenticação:

1. Vá para **Authentication** > **Users** (menu lateral)
2. Para cada utilizador abaixo, clique em **Add user** > **Create new user**:

#### **Gerente**
```
Email: gerente@sistema.ao
Password: gerente123
✅ Auto Confirm User: MARCAR
```
Clique em **Create user**

#### **Financeiro**
```
Email: financeiro@sistema.ao
Password: financeiro123
✅ Auto Confirm User: MARCAR
```
Clique em **Create user**

#### **Operador**
```
Email: operador@sistema.ao
Password: operador123
✅ Auto Confirm User: MARCAR
```
Clique em **Create user**

---

### **PASSO 3: Testar Login**

Abra sua aplicação e teste:

```
Gerente:
✉️ gerente@sistema.ao
🔑 gerente123

Financeiro:
✉️ financeiro@sistema.ao
🔑 financeiro123

Operador:
✉️ operador@sistema.ao
🔑 operador123
```

---

## ✅ Verificação Rápida

Execute este SQL para verificar:

```sql
SELECT 
  email, 
  name, 
  role, 
  department,
  position,
  created_at
FROM users 
ORDER BY created_at;
```

**Deverá ver 6 utilizadores:**
1. admin@sistema.ao
2. secretaria@sistema.ao
3. utente@sistema.ao
4. gerente@sistema.ao ⭐ NOVO
5. financeiro@sistema.ao ⭐ NOVO
6. operador@sistema.ao ⭐ NOVO

---

## 🎯 Tabela de Referência Rápida

| Email | Senha | Role | Departamento |
|-------|-------|------|--------------|
| gerente@sistema.ao | gerente123 | admin | Gestão |
| financeiro@sistema.ao | financeiro123 | attendant | Financeiro |
| operador@sistema.ao | operador123 | attendant | Operações |

---

## 🔧 Se Encontrar Problemas

### "User already exists"
➡️ **Normal!** Os utilizadores já foram criados. Pode ignorar.

### "User not found" ao fazer login
➡️ **Solução**: Certifique-se de ter executado o PASSO 2 (criar no Auth)

### "Invalid credentials"
➡️ **Solução**: Verifique se a senha está correta ou redefina no Dashboard

---

## 📱 Interface Visual (Alternativa)

Se preferir usar a interface web:

1. Abra `/test-create-users.html` no navegador
2. Faça login como admin
3. Clique em "Criar 3 Utilizadores"
4. Aguarde confirmação

---

## 🎉 Pronto!

Agora tem **6 utilizadores** no sistema prontos para testar!

---

**Tempo total:** ~2-3 minutos  
**Dificuldade:** ⭐ Muito Fácil  
**Última atualização:** Janeiro 2026
