# 📊 COMO CONSULTAR TODOS OS UTILIZADORES

## 🎯 2 FORMAS DE CONSULTAR

### ⚡ FORMA RÁPIDA (Recomendada)

**Use este ficheiro:**
```
📄 CONSULTAR-TODOS-USUARIOS-SIMPLES.sql
```

1. Abra o Supabase SQL Editor
2. Copie e execute a primeira query
3. Veja todos os utilizadores instantaneamente

---

### 📚 FORMA COMPLETA (Várias Opções)

**Use este ficheiro:**
```
📄 CONSULTAR-TODOS-USUARIOS.sql
```

Tem 10 consultas diferentes:
1. Listagem simples
2. Listagem completa (todos os campos)
3. Agrupado por role
4. Agrupado por departamento
5. Total de utilizadores
6. Apenas os 8 principais
7. Verificar lookups
8. JSON completo
9. Estatísticas gerais
10. Lista com cores visuais

---

## 🚀 CONSULTA MAIS USADA

Copie e execute isto:

```sql
SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "📧 Email",
  value->>'name' as "👤 Nome",
  value->>'role' as "Role",
  value->>'department' as "Departamento",
  value->>'position' as "Cargo"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';
```

**Resultado esperado:**
```
#  | Email                  | Nome                    | Role      | Departamento
1  | admin@sistema.com      | Administrador Sistema   | admin     | Administração
2  | atendente@sistema.com  | Maria Atendente         | attendant | Secretaria
3  | compras@sistema.com    | Responsável de Compras  | user      | aquisicoes
4  | financeiro@sistema.ao  | Maria Financeira        | attendant | Financeiro
5  | gerente@sistema.ao     | João Gerente            | admin     | Gestão
6  | motorista@sistema.com  | Motorista da Frota      | user      | operacional_frota
7  | operador@sistema.ao    | Carlos Operador         | attendant | Operações
8  | usuario@empresa.com    | João Usuário            | user      | Externo
```

---

## 📊 OUTRAS CONSULTAS ÚTEIS

### Ver Total de Utilizadores
```sql
SELECT COUNT(*) as total
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%';
```
Deve retornar: **8**

---

### Ver Apenas Admins
```sql
SELECT 
  value->>'email' as email,
  value->>'name' as nome
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
  AND value->>'role' = 'admin'
ORDER BY value->>'email';
```
Deve retornar: **2** (admin@sistema.com e gerente@sistema.ao)

---

### Ver Apenas os 2 Novos
```sql
SELECT 
  value->>'email' as email,
  value->>'name' as nome,
  value->>'department' as departamento
FROM kv_store_8b82752b
WHERE key IN ('user_profile:compras-001', 'user_profile:motorista-001')
ORDER BY value->>'email';
```
Deve retornar: **compras** e **motorista**

---

### Ver por Departamento
```sql
SELECT 
  value->>'department' as departamento,
  COUNT(*) as total,
  string_agg(value->>'name', ', ') as utilizadores
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'department'
ORDER BY COUNT(*) DESC;
```

---

## 🔍 CONSULTAR NO DASHBOARD (SEM SQL)

### Opção 1: Table Editor
1. Supabase Dashboard
2. **Table Editor**
3. Selecione tabela: **kv_store_8b82752b**
4. Na barra de filtros, digite: `key`
5. Filtro: **LIKE** → `user_profile:%`
6. Clique **Apply**

Verá todas as linhas dos utilizadores!

---

### Opção 2: Authentication
1. Supabase Dashboard
2. **Authentication**
3. **Users**

Verá apenas os emails, mas não os detalhes completos.

---

## 📋 VERIFICAÇÃO RÁPIDA

Execute este script para verificar se está tudo OK:

```sql
-- Verificar se os 8 utilizadores existem
WITH esperados AS (
  SELECT unnest(ARRAY[
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao',
    'compras@sistema.com',
    'motorista@sistema.com'
  ]) as email
)
SELECT 
  e.email,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM kv_store_8b82752b 
      WHERE key LIKE 'user_profile:%' 
        AND value->>'email' = e.email
    ) THEN '✅ Existe'
    ELSE '❌ Falta'
  END as status
FROM esperados e
ORDER BY e.email;
```

Todos devem mostrar: **✅ Existe**

---

## 🎯 RESUMO

### Para ver todos rapidamente:
```
📄 Use: CONSULTAR-TODOS-USUARIOS-SIMPLES.sql
```

### Para análises detalhadas:
```
📄 Use: CONSULTAR-TODOS-USUARIOS.sql
```

### Consulta mais comum:
```sql
SELECT * FROM kv_store_8b82752b 
WHERE key LIKE 'user_profile:%';
```

---

## 📞 PRÓXIMO PASSO

Execute qualquer uma das consultas acima e me diga:
1. ✅ Quantos utilizadores apareceram?
2. ✅ Os 8 utilizadores estão todos lá?
3. ✅ compras e motorista aparecem?

Depois podemos continuar! 🚀
