# 🗺️ MAPA COMPLETO DE UTILIZADORES DO SISTEMA

## 📍 LOCALIZAÇÃO PRINCIPAL

Todos os utilizadores demonstração estão definidos em:

**📂 Arquivo:** `/supabase/functions/server/auth.tsx`  
**🔧 Função:** `initializeDemoUsers()` (linhas 143-205)

---

## 👥 6 UTILIZADORES EXISTENTES NO SISTEMA

### 📊 TABELA RESUMIDA

| # | Email | Password | Nome | Role | Departamento | Cargo |
|---|-------|----------|------|------|--------------|-------|
| 1 | admin@sistema.com | 123456 | Administrador Sistema | **admin** | Administração | Governador |
| 2 | atendente@sistema.com | 123456 | Maria Atendente | **attendant** | Secretaria | Assistente Administrativa |
| 3 | usuario@empresa.com | 123456 | João Usuário | **user** | Externo | Utente |
| 4 | gerente@sistema.ao | gerente123 | João Gerente | **admin** | Gestão | Gerente Geral |
| 5 | financeiro@sistema.ao | financeiro123 | Maria Financeira | **attendant** | Financeiro | Responsável Financeiro |
| 6 | operador@sistema.ao | operador123 | Carlos Operador | **attendant** | Operações | Operador de Frota |

---

## 🔍 DETALHES DE CADA UTILIZADOR

### 1️⃣ ADMIN (Administrador Sistema)

```typescript
{
  email: 'admin@sistema.com',
  password: '123456',
  name: 'Administrador Sistema',
  role: 'admin',
  department: 'Administração',
  position: 'Governador'
}
```

**Perfil:** Administrador principal do sistema  
**Acesso:** Total (todos os módulos)  
**Criado em:** Primeira inicialização do sistema

---

### 2️⃣ ATENDENTE (Maria Atendente)

```typescript
{
  email: 'atendente@sistema.com',
  password: '123456',
  name: 'Maria Atendente',
  role: 'attendant',
  department: 'Secretaria',
  position: 'Assistente Administrativa'
}
```

**Perfil:** Atendente/Secretária  
**Acesso:** Gestão de apresentações, audiências, actas  
**Criado em:** Primeira inicialização do sistema

---

### 3️⃣ UTILIZADOR (João Usuário)

```typescript
{
  email: 'usuario@empresa.com',
  password: '123456',
  name: 'João Usuário',
  role: 'user',
  department: 'Externo',
  position: 'Utente'
}
```

**Perfil:** Utilizador externo  
**Acesso:** Solicitar apresentações, ver status  
**Criado em:** Primeira inicialização do sistema

---

### 4️⃣ GERENTE (João Gerente)

```typescript
{
  email: 'gerente@sistema.ao',
  password: 'gerente123',
  name: 'João Gerente',
  role: 'admin',
  department: 'Gestão',
  position: 'Gerente Geral'
}
```

**Perfil:** Gestor/Administrador  
**Acesso:** Total (todos os módulos)  
**Criado em:** Adicionado posteriormente ao sistema

---

### 5️⃣ FINANCEIRO (Maria Financeira)

```typescript
{
  email: 'financeiro@sistema.ao',
  password: 'financeiro123',
  name: 'Maria Financeira',
  role: 'attendant',
  department: 'Financeiro',
  position: 'Responsável Financeiro'
}
```

**Perfil:** Responsável financeiro  
**Acesso:** Gestão de faturas, pagamentos, relatórios financeiros  
**Criado em:** Adicionado posteriormente ao sistema

---

### 6️⃣ OPERADOR (Carlos Operador)

```typescript
{
  email: 'operador@sistema.ao',
  password: 'operador123',
  name: 'Carlos Operador',
  role: 'attendant',
  department: 'Operações',
  position: 'Operador de Frota'
}
```

**Perfil:** Operador de frota  
**Acesso:** Gestão de viaturas, abastecimentos, manutenção  
**Criado em:** Adicionado posteriormente ao sistema

---

## 🔐 DISTRIBUIÇÃO POR ROLE

### ADMIN (2 utilizadores)
- ✅ admin@sistema.com - Administrador Sistema
- ✅ gerente@sistema.ao - João Gerente

### ATTENDANT (3 utilizadores)
- ✅ atendente@sistema.com - Maria Atendente
- ✅ financeiro@sistema.ao - Maria Financeira
- ✅ operador@sistema.ao - Carlos Operador

### USER (1 utilizador)
- ✅ usuario@empresa.com - João Usuário

---

## 📂 ESTRUTURA NO CÓDIGO

### Localização no Arquivo

```
/supabase/functions/server/auth.tsx
│
├── export async function initializeDemoUsers() {
│   └── const demoUsers = [
│       ├── GRUPO 1: 3 Utilizadores Originais (linhas 146-169)
│       │   ├── admin@sistema.com
│       │   ├── atendente@sistema.com
│       │   └── usuario@empresa.com
│       │
│       └── GRUPO 2: 3 Novos Utilizadores (linhas 172-195)
│           ├── gerente@sistema.ao
│           ├── financeiro@sistema.ao
│           └── operador@sistema.ao
│   ]
└── }
```

---

## 🚀 COMO ESTES UTILIZADORES SÃO CRIADOS

### Fluxo de Inicialização

```
1. Sistema inicia
   ↓
2. Rota POST /make-server-8b82752b/initialize é chamada
   ↓
3. Função initializeDemoUsers() executa
   ↓
4. Para cada utilizador no array demoUsers:
   ├── Verifica se já existe (user_email_lookup)
   ├── Se NÃO existe:
   │   ├── Cria conta no Supabase Auth
   │   ├── Cria perfil no KV_STORE (user_profile:ID)
   │   └── Cria lookup de email (user_email_lookup:EMAIL)
   └── Se já existe: pula
   ↓
5. ✅ 6 utilizadores criados e prontos para uso
```

---

## 🔑 CHAVES NO KV_STORE

Quando os utilizadores são criados, estas chaves são geradas:

### Perfis (user_profile)
```
user_profile:{UUID-gerado-pelo-supabase}
└── Contém: id, email, name, role, department, position, created_at, etc.
```

Exemplo:
```
user_profile:a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Lookups de Email (user_email_lookup)
```
user_email_lookup:admin@sistema.com → {user_id: "a1b2c3d4-..."}
user_email_lookup:atendente@sistema.com → {user_id: "b2c3d4e5-..."}
user_email_lookup:usuario@empresa.com → {user_id: "c3d4e5f6-..."}
user_email_lookup:gerente@sistema.ao → {user_id: "d4e5f6g7-..."}
user_email_lookup:financeiro@sistema.ao → {user_id: "e5f6g7h8-..."}
user_email_lookup:operador@sistema.ao → {user_id: "f6g7h8i9-..."}
```

---

## 📊 SQL PARA VERIFICAR OS UTILIZADORES

### Ver Todos os 6 Utilizadores

```sql
SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento",
  value->>'position' as "💼 Cargo"
FROM kv_store_8b82752b  -- ou apenas kv_store
WHERE key LIKE 'user_profile:%'
  AND (
    value->>'email' = 'admin@sistema.com' OR
    value->>'email' = 'atendente@sistema.com' OR
    value->>'email' = 'usuario@empresa.com' OR
    value->>'email' = 'gerente@sistema.ao' OR
    value->>'email' = 'financeiro@sistema.ao' OR
    value->>'email' = 'operador@sistema.ao'
  )
ORDER BY value->>'email';
```

### Verificar se Todos Existem

```sql
-- Deve retornar 6
SELECT 
  '6 UTILIZADORES DEMONSTRAÇÃO' as verificacao,
  COUNT(*) as total
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
  AND value->>'email' IN (
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao'
  );
```

---

## 🔄 QUANDO SÃO CRIADOS

Os utilizadores são criados automaticamente quando:

### 1️⃣ Primeira Inicialização do Sistema
Quando você chama pela primeira vez:
```
POST /make-server-8b82752b/initialize
```

### 2️⃣ Via Frontend
Quando o App.tsx carrega e chama a rota de inicialização

### 3️⃣ Manualmente
Você pode chamar a rota de inicialização a qualquer momento:

```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/initialize`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  }
);
```

---

## ⚙️ COMO MODIFICAR OS UTILIZADORES

### Para Adicionar Novos Utilizadores

Edite o arquivo `/supabase/functions/server/auth.tsx`:

```typescript
export async function initializeDemoUsers() {
  const demoUsers = [
    // ... utilizadores existentes ...
    
    // ADICIONAR AQUI
    { 
      email: 'novo@sistema.ao', 
      password: 'senha123', 
      name: 'Novo Utilizador', 
      role: 'user' as const,
      department: 'Departamento',
      position: 'Cargo'
    }
  ];
  // ...
}
```

### Para Modificar Utilizadores Existentes

1. Edite o array `demoUsers` no arquivo
2. Delete os utilizadores existentes do KV_STORE
3. Chame novamente a rota `/initialize`

---

## 🎯 PERGUNTAS FREQUENTES

### ❓ Por que alguns têm @sistema.com e outros @sistema.ao?

- **@sistema.com**: Utilizadores criados inicialmente (genéricos)
- **@sistema.ao**: Utilizadores adicionados depois (localizados para Angola)

### ❓ Posso mudar as senhas?

Sim! Edite o valor `password` no array `demoUsers` e reinicialize.

### ❓ Como adicionar o 7º e 8º utilizador?

Edite `/supabase/functions/server/auth.tsx` e adicione ao array `demoUsers`, ou use o script SQL para adicionar diretamente no KV_STORE.

### ❓ Estes utilizadores têm perfis múltiplos?

Não atualmente. O código original não define o campo `profiles`. Se quiser adicionar, edite a função `createUserWithRole`.

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Execute este script para verificar se os 6 utilizadores existem:

```sql
-- =====================================================
-- VERIFICAÇÃO COMPLETA DOS 6 UTILIZADORES DEMO
-- =====================================================

SELECT 
  '✅ ADMIN@SISTEMA.COM' as utilizador,
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END as status
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'admin@sistema.com'

UNION ALL

SELECT 
  '✅ ATENDENTE@SISTEMA.COM',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'atendente@sistema.com'

UNION ALL

SELECT 
  '✅ USUARIO@EMPRESA.COM',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'usuario@empresa.com'

UNION ALL

SELECT 
  '✅ GERENTE@SISTEMA.AO',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'gerente@sistema.ao'

UNION ALL

SELECT 
  '✅ FINANCEIRO@SISTEMA.AO',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'financeiro@sistema.ao'

UNION ALL

SELECT 
  '✅ OPERADOR@SISTEMA.AO',
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ NÃO EXISTE' END
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%' 
  AND value->>'email' = 'operador@sistema.ao';
```

---

## 📞 RESUMO VISUAL

```
┌────────────────────────────────────────────────────────┐
│  6 UTILIZADORES DEMONSTRAÇÃO DO SISTEMA                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📂 Localização: /supabase/functions/server/auth.tsx  │
│  🔧 Função: initializeDemoUsers()                      │
│  🗄️ Armazenamento: KV_STORE + Supabase Auth          │
│                                                        │
│  👥 UTILIZADORES:                                      │
│  ├─ 1. admin@sistema.com (admin)                      │
│  ├─ 2. atendente@sistema.com (attendant)              │
│  ├─ 3. usuario@empresa.com (user)                     │
│  ├─ 4. gerente@sistema.ao (admin)                     │
│  ├─ 5. financeiro@sistema.ao (attendant)              │
│  └─ 6. operador@sistema.ao (attendant)                │
│                                                        │
│  🚀 Criação: Automática via rota /initialize          │
│  🔑 Senhas: Variadas (ver tabela acima)               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**Execute o script de verificação SQL para confirmar que todos existem!** 🔍
