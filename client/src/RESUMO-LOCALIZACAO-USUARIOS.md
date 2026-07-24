# 📍 RESUMO - LOCALIZAÇÃO DOS UTILIZADORES

## 🎯 RESPOSTA DIRETA À SUA PERGUNTA

Você perguntou onde estão as contas:
- ✅ admin
- ✅ gerente
- ✅ financeiro
- ✅ atendente
- ✅ operador
- ✅ utilizador

---

## 📂 LOCALIZAÇÃO PRINCIPAL

### 🔧 Código Fonte

```
📁 /supabase/functions/server/auth.tsx
   └── Função: initializeDemoUsers() (linhas 143-205)
```

**Este arquivo contém a definição dos 6 utilizadores demonstração.**

---

## 👥 OS 6 UTILIZADORES

| # | Email | Senha | Nome | Role | Tipo |
|---|-------|-------|------|------|------|
| 1 | admin@sistema.com | 123456 | Administrador Sistema | admin | ✅ ADMIN |
| 2 | gerente@sistema.ao | gerente123 | João Gerente | admin | ✅ GERENTE |
| 3 | atendente@sistema.com | 123456 | Maria Atendente | attendant | ✅ ATENDENTE |
| 4 | financeiro@sistema.ao | financeiro123 | Maria Financeira | attendant | ✅ FINANCEIRO |
| 5 | operador@sistema.ao | operador123 | Carlos Operador | attendant | ✅ OPERADOR |
| 6 | usuario@empresa.com | 123456 | João Usuário | user | ✅ UTILIZADOR |

---

## 🗄️ ONDE OS DADOS ESTÃO ARMAZENADOS

### 1️⃣ Supabase Auth (Autenticação)
```
Dashboard → Authentication → Users
```
- Email e senha
- Estado de confirmação
- Tokens de acesso

### 2️⃣ KV_STORE (Perfis)
```
Dashboard → Table Editor → kv_store_8b82752b
```
- Perfis completos
- Departamentos
- Cargos
- Metadados

**Padrão das chaves:**
```
user_profile:{UUID}
user_email_lookup:{email}
```

---

## 🔍 COMO VERIFICAR

### Opção 1: Script SQL Completo
Execute: **`VERIFICAR-6-USUARIOS-DEMO.sql`**
- Mostra todos os 6 utilizadores
- Verifica se estão todos presentes
- Lista detalhes completos

### Opção 2: Script SQL Simples
```sql
SELECT 
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role,
  value->>'department' as departamento
FROM kv_store_8b82752b
WHERE value->>'email' IN (
  'admin@sistema.com',
  'gerente@sistema.ao',
  'atendente@sistema.com',
  'financeiro@sistema.ao',
  'operador@sistema.ao',
  'usuario@empresa.com'
)
ORDER BY value->>'email';
```

### Opção 3: Via Dashboard
1. Supabase Dashboard
2. **Table Editor**
3. Selecione tabela **kv_store_8b82752b**
4. Filtre por: `key LIKE 'user_profile:%'`

---

## 📊 DISTRIBUIÇÃO POR ROLE

```
┌─────────────────────────────────────────┐
│  ADMIN (2 utilizadores)                 │
│  ├─ admin@sistema.com                   │
│  └─ gerente@sistema.ao                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ATTENDANT (3 utilizadores)             │
│  ├─ atendente@sistema.com               │
│  ├─ financeiro@sistema.ao               │
│  └─ operador@sistema.ao                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  USER (1 utilizador)                    │
│  └─ usuario@empresa.com                 │
└─────────────────────────────────────────┘
```

---

## 🚀 QUANDO FORAM CRIADOS

Os 6 utilizadores são criados automaticamente quando:

1. **Sistema inicia pela primeira vez**
2. **Rota `/initialize` é chamada**
3. **Frontend carrega e executa inicialização**

---

## 🔑 CREDENCIAIS DE ACESSO

### ADMIN
- Email: `admin@sistema.com`
- Senha: `123456`

### GERENTE
- Email: `gerente@sistema.ao`
- Senha: `gerente123`

### ATENDENTE
- Email: `atendente@sistema.com`
- Senha: `123456`

### FINANCEIRO
- Email: `financeiro@sistema.ao`
- Senha: `financeiro123`

### OPERADOR
- Email: `operador@sistema.ao`
- Senha: `operador123`

### UTILIZADOR
- Email: `usuario@empresa.com`
- Senha: `123456`

---

## 📋 CHECKLIST RÁPIDO

Execute este SQL para verificar rapidamente:

```sql
-- Quantos dos 6 utilizadores existem?
SELECT COUNT(*) as total_encontrado
FROM kv_store_8b82752b
WHERE value->>'email' IN (
  'admin@sistema.com',
  'gerente@sistema.ao',
  'atendente@sistema.com',
  'financeiro@sistema.ao',
  'operador@sistema.ao',
  'usuario@empresa.com'
);

-- Deve retornar: 6
```

---

## 📁 FICHEIROS DE APOIO CRIADOS

Para entender melhor, consulte:

1. **`MAPA-COMPLETO-USUARIOS.md`** - Documentação completa
2. **`VERIFICAR-6-USUARIOS-DEMO.sql`** - Script de verificação SQL
3. **`VERIFICAR-6-USUARIOS-DEMO-ALTERNATIVO.sql`** - Para tabela sem sufixo

---

## 🎯 RESPOSTA RESUMIDA

**Onde estão os utilizadores?**

✅ **Código:** `/supabase/functions/server/auth.tsx` (função `initializeDemoUsers`)  
✅ **Auth:** Supabase Authentication → Users  
✅ **Dados:** Tabela `kv_store_8b82752b` (chaves `user_profile:*`)  
✅ **Total:** 6 utilizadores (2 admin, 3 attendant, 1 user)

---

## 🔄 PRÓXIMOS PASSOS

1. ✅ Execute **`VERIFICAR-6-USUARIOS-DEMO.sql`** para confirmar
2. ✅ Veja o resultado no SQL Editor
3. ✅ Me diga quantos utilizadores foram encontrados

---

**Execute o script de verificação e me confirme se os 6 utilizadores estão presentes!** 🔍
