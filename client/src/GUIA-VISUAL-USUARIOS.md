# 📊 GUIA VISUAL - ESTRUTURA DE UTILIZADORES

## 🗺️ MAPA COMPLETO DO SISTEMA DE UTILIZADORES

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE UTILIZADORES                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├── 1️⃣ SUPABASE AUTH
                            │    └─ Email + Senha + Token
                            │
                            └── 2️⃣ KV_STORE (Base de Dados)
                                 │
                                 ├── user_profile:{id}
                                 │    └─ Dados completos do utilizador
                                 │
                                 └── user_email_lookup:{email}
                                      └─ Referência ao ID do utilizador
```

---

## 📦 ESTRUTURA DO KV_STORE

### Como os Dados Estão Organizados

```sql
┌──────────────────────────────────────────────────────────┐
│ TABELA: kv_store                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  COLUNAS:                                                │
│  • key (TEXT) - Chave única                             │
│  • value (JSONB) - Dados em formato JSON                │
│                                                          │
└──────────────────────────────────────────────────────────┘

EXEMPLOS DE CHAVES:

1. user_profile:123e4567-e89b-12d3-a456-426614174000
   └─ Armazena: Nome, email, role, departamento, etc.

2. user_email_lookup:admin@sistema.ao
   └─ Armazena: ID do utilizador (referência)

3. presentation:abc-123
   └─ Armazena: Dados de apresentações

4. audience:xyz-789
   └─ Armazena: Dados de audiências
```

---

## 👤 ESTRUTURA DE UM UTILIZADOR

### Formato JSON Armazenado

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "admin@sistema.ao",
  "name": "Administrador Sistema",
  "role": "admin",
  "department": "gabinete_pca",
  "position": "Administrador Geral",
  "phone": "+244 923 456 789",
  "address": "Luanda, Angola",
  "document": "BI-001234567LA045",
  "status": "active",
  "created_at": "2026-01-10T10:30:00Z",
  "last_login": "2026-01-10T15:45:00Z",
  "profiles": ["admin_sistema"]
}
```

---

## 🔍 COMO CONSULTAR UTILIZADORES

### Visual das Consultas SQL

```
┌─────────────────────────────────────────────────┐
│  CONSULTA 1: Ver Todos os Utilizadores          │
└─────────────────────────────────────────────────┘
    ↓
SELECT * FROM kv_store 
WHERE key LIKE 'user_profile:%'
    ↓
RESULTADO:
┌──────────────────────────┬─────────────────────┐
│ key                      │ value (JSON)        │
├──────────────────────────┼─────────────────────┤
│ user_profile:abc-123     │ { "email": "..." }  │
│ user_profile:def-456     │ { "email": "..." }  │
│ user_profile:ghi-789     │ { "email": "..." }  │
└──────────────────────────┴─────────────────────┘
```

```
┌─────────────────────────────────────────────────┐
│  CONSULTA 2: Extrair Campos Específicos         │
└─────────────────────────────────────────────────┘
    ↓
SELECT 
  value->>'email' as email,
  value->>'name' as nome,
  value->>'role' as role
FROM kv_store 
WHERE key LIKE 'user_profile:%'
    ↓
RESULTADO:
┌────────────────────┬────────────────┬──────────┐
│ email              │ nome           │ role     │
├────────────────────┼────────────────┼──────────┤
│ admin@sistema.ao   │ Admin Sistema  │ admin    │
│ user@sistema.ao    │ Utilizador     │ user     │
└────────────────────┴────────────────┴──────────┘
```

---

## 📊 EXEMPLO VISUAL DE UTILIZADORES ATUAIS

Execute este comando para ver seus utilizadores:

```sql
SELECT 
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "🎭 Role",
  value->>'department' as "🏢 Departamento"
FROM kv_store 
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';
```

Resultado esperado (exemplo):

```
┌─────────────────────┬───────────────────┬───────────┬─────────────────┐
│ 📧 Email           │ 👤 Nome           │ 🎭 Role   │ 🏢 Departamento │
├─────────────────────┼───────────────────┼───────────┼─────────────────┤
│ admin@sistema.ao    │ Admin Sistema     │ admin     │ NULL            │
│ atendente@sistema.ao│ Atendente Maria   │ attendant │ NULL            │
│ usuario@sistema.ao  │ Utilizador João   │ user      │ NULL            │
└─────────────────────┴───────────────────┴───────────┴─────────────────┘
```

---

## 🎯 ONDE CADA TIPO DE DADO ESTÁ

```
SUPABASE AUTH (Authentication → Users)
├─ Email confirmado? ✅/❌
├─ Última autenticação
├─ Token de acesso
└─ Metadados básicos

KV_STORE (Table Editor → kv_store)
├─ user_profile:{id}
│  ├─ Nome completo
│  ├─ Role (admin/attendant/user)
│  ├─ Departamento
│  ├─ Cargo/Posição
│  ├─ Telefone
│  ├─ Morada
│  ├─ Documento
│  ├─ Status
│  └─ Perfis múltiplos
│
└─ user_email_lookup:{email}
   └─ Referência rápida ao ID
```

---

## 🔄 FLUXO DE CRIAÇÃO DE UTILIZADOR

```
┌────────────────────────────────────────────────────────┐
│  PASSO 1: Criar no Supabase Auth                       │
│  • Email e senha                                       │
│  • Gera um ID único (UUID)                             │
└────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────┐
│  PASSO 2: Criar Perfil no KV_STORE                     │
│  • key: user_profile:{UUID}                            │
│  • value: { email, name, role, department, ... }       │
└────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────┐
│  PASSO 3: Criar Lookup de Email                        │
│  • key: user_email_lookup:{email}                      │
│  • value: {UUID}                                       │
└────────────────────────────────────────────────────────┘
              ↓
          ✅ PRONTO!
```

---

## 🚨 POR QUE O ERRO PODE ACONTECER?

### Cenário 1: Tentou usar JSON puro

```sql
-- ❌ ERRADO - JSON puro não funciona
INSERT INTO kv_store (key, value)
VALUES ('user_profile:123', '{"email": "test@test.com"}');

-- ✅ CORRETO - Usar jsonb_build_object
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:123',
  jsonb_build_object('email', 'test@test.com')
);
```

### Cenário 2: Tentou inserir diretamente sem função

```sql
-- ❌ ERRADO
INSERT INTO kv_store (key, value)
VALUES ('user_profile:123', {email: 'test@test.com'});

-- ✅ CORRETO
INSERT INTO kv_store (key, value)
VALUES (
  'user_profile:123',
  jsonb_build_object('email', 'test@test.com')
);
```

### Cenário 3: Formato de data incorreto

```sql
-- ❌ ERRADO
'created_at', new Date()

-- ✅ CORRETO
'created_at', CURRENT_TIMESTAMP
```

---

## 📝 SCRIPTS PARA VOCÊ USAR AGORA

### 1️⃣ Ver Utilizadores Atuais

Copie e execute isto no Supabase SQL Editor:

```sql
SELECT 
  '🔍 UTILIZADORES ATUAIS NO SISTEMA' as titulo;

SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role",
  value->>'department' as "Departamento",
  value->>'status' as "Status"
FROM kv_store 
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';
```

### 2️⃣ Contar Utilizadores

```sql
SELECT 
  'Total de Utilizadores' as metrica,
  COUNT(*) as valor
FROM kv_store 
WHERE key LIKE 'user_profile:%';
```

### 3️⃣ Ver Estrutura Completa de 1 Utilizador

```sql
SELECT 
  key as chave,
  jsonb_pretty(value) as dados
FROM kv_store 
WHERE key LIKE 'user_profile:%'
LIMIT 1;
```

---

## 🎯 O QUE FAZER AGORA

### Passo 1: Executar Diagnóstico
```bash
Execute o ficheiro: DIAGNOSTICO-USUARIOS-ATUAIS.sql
```

Este script vai mostrar:
- ✅ Quantos utilizadores você tem
- ✅ Quais são os emails
- ✅ Distribuição por role
- ✅ Distribuição por departamento
- ✅ Estrutura completa dos dados

### Passo 2: Identificar o Erro
Me diga:
1. Quantos utilizadores apareceram?
2. Qual foi o erro exato do script CREATE-USERS-DEPARTMENTS.sql?
3. Em que linha deu erro?

### Passo 3: Corrigir e Criar os 23 Utilizadores
Após entendermos o erro, vamos corrigir o script e criar todos os 23 utilizadores departamentais.

---

## 📞 PRÓXIMOS PASSOS

1. **Execute:** `DIAGNOSTICO-USUARIOS-ATUAIS.sql`
2. **Veja:** Quantos utilizadores você já tem
3. **Me envie:**
   - Número de utilizadores atuais
   - Mensagem de erro do script
   - Linha onde deu erro

Assim posso ajudá-lo a resolver e criar os 23 utilizadores! 🚀

---

## 📚 FICHEIROS DE APOIO

- `/ENTENDER-USUARIOS-SISTEMA.md` - Explicação detalhada
- `/DIAGNOSTICO-USUARIOS-ATUAIS.sql` - Script de diagnóstico
- `/GUIA-VISUAL-USUARIOS.md` - Este ficheiro
- `/CREATE-USERS-DEPARTMENTS.sql` - Script para criar 23 utilizadores

---

**Execute o diagnóstico e me diga o que encontrou!** 🔍
