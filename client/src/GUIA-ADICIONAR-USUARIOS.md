# 🎯 Guia para Adicionar Novos Utilizadores

## 📋 Resumo

Este guia explica como adicionar os 3 novos utilizadores ao sistema:
1. **Gerente** (João Gerente)
2. **Financeiro** (Maria Financeira)
3. **Operador** (Carlos Operador)

---

## 🚀 Passo a Passo

### **PASSO 1: Executar a Migration SQL**

1. Aceda ao **Supabase Dashboard**
2. Navegue para **SQL Editor**
3. Abra o ficheiro `/supabase/migrations/add-additional-users.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **RUN** para executar

✅ **Resultado esperado**: Mensagem de sucesso com os 6 utilizadores listados.

---

### **PASSO 2: Criar Contas de Autenticação no Supabase**

Agora precisa criar as contas de autenticação no Supabase Auth para cada utilizador:

#### **2.1 - Gerente**
1. Aceda **Authentication** > **Users** no Supabase Dashboard
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - **Email**: `gerente@sistema.ao`
   - **Password**: `gerente123` (ou outra senha segura)
   - **Auto Confirm User**: ✅ Marcar (para confirmar automaticamente)
4. Clique em **Create user**

#### **2.2 - Financeiro**
1. Clique novamente em **Add user** > **Create new user**
2. Preencha:
   - **Email**: `financeiro@sistema.ao`
   - **Password**: `financeiro123` (ou outra senha segura)
   - **Auto Confirm User**: ✅ Marcar
3. Clique em **Create user**

#### **2.3 - Operador**
1. Clique novamente em **Add user** > **Create new user**
2. Preencha:
   - **Email**: `operador@sistema.ao`
   - **Password**: `operador123` (ou outra senha segura)
   - **Auto Confirm User**: ✅ Marcar
3. Clique em **Create user**

---

### **PASSO 3: Verificar Utilizadores**

Execute esta query no SQL Editor para verificar todos os utilizadores:

```sql
SELECT 
  id,
  email,
  name,
  role,
  department,
  position,
  created_at
FROM users
ORDER BY created_at;
```

✅ **Deverá ver 6 utilizadores**:
- admin@sistema.ao (Administrador)
- secretaria@sistema.ao (Secretária)
- utente@sistema.ao (Utente)
- gerente@sistema.ao (Gerente) ⭐ NOVO
- financeiro@sistema.ao (Financeiro) ⭐ NOVO
- operador@sistema.ao (Operador) ⭐ NOVO

---

## 👥 Credenciais dos Novos Utilizadores

### **Gerente**
- 📧 **Email**: `gerente@sistema.ao`
- 🔑 **Senha**: `gerente123` (definida por si)
- 👤 **Nome**: João Gerente
- 🏢 **Departamento**: Gestão
- 📍 **Posição**: Gerente Geral
- 🔐 **Role**: `admin` (privilégios administrativos)

### **Financeiro**
- 📧 **Email**: `financeiro@sistema.ao`
- 🔑 **Senha**: `financeiro123` (definida por si)
- 👤 **Nome**: Maria Financeira
- 🏢 **Departamento**: Financeiro
- 📍 **Posição**: Responsável Financeiro
- 🔐 **Role**: `attendant` (atendente)

### **Operador**
- 📧 **Email**: `operador@sistema.ao`
- 🔑 **Senha**: `operador123` (definida por si)
- 👤 **Nome**: Carlos Operador
- 🏢 **Departamento**: Operações
- 📍 **Posição**: Operador de Frota
- 🔐 **Role**: `attendant` (atendente)

---

## 🎯 Perfis e Permissões

### **Gerente (admin)**
✅ Acesso total ao sistema
✅ Gestão de utilizadores
✅ Aprovação de pedidos
✅ Acesso a todos os módulos
✅ Gestão de reuniões internas

### **Financeiro (attendant)**
✅ Gestão de solicitações
✅ Criação de reuniões
✅ Visualização de pedidos
✅ Acesso ao módulo financeiro
⛔ Não pode criar novos utilizadores

### **Operador (attendant)**
✅ Gestão de solicitações
✅ Criação de reuniões
✅ Visualização de pedidos
✅ Gestão de frota/operações
⛔ Não pode criar novos utilizadores

---

## ✅ Teste de Login

Após criar as contas, teste o login com cada utilizador:

1. Aceda à aplicação
2. Faça logout (se estiver logado)
3. Teste cada credencial:
   - `gerente@sistema.ao` / `gerente123`
   - `financeiro@sistema.ao` / `financeiro123`
   - `operador@sistema.ao` / `operador123`

---

## 🔧 Resolução de Problemas

### **Erro: "User not found"**
➡️ **Solução**: Certifique-se de que criou a conta no Supabase Auth (Passo 2)

### **Erro: "Invalid login credentials"**
➡️ **Solução**: Verifique se a senha está correta ou redefina no Dashboard

### **Utilizador não aparece na lista**
➡️ **Solução**: Execute novamente a migration SQL (Passo 1)

---

## 📊 Resumo Final

✅ **6 utilizadores no total** no sistema:

| Email | Nome | Role | Departamento |
|-------|------|------|--------------|
| admin@sistema.ao | Administrador do Sistema | admin | Administração |
| secretaria@sistema.ao | Secretária Administrativa | attendant | Secretaria |
| utente@sistema.ao | Utilizador Teste | user | Externo |
| **gerente@sistema.ao** | **João Gerente** | **admin** | **Gestão** |
| **financeiro@sistema.ao** | **Maria Financeira** | **attendant** | **Financeiro** |
| **operador@sistema.ao** | **Carlos Operador** | **attendant** | **Operações** |

---

## 🎉 Pronto!

Agora tem 6 utilizadores configurados e prontos para testar diferentes cenários e funcionalidades do sistema!

---

**Data de criação**: Janeiro 2026  
**Última atualização**: Janeiro 2026
