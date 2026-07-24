# 🚀 CONSULTAR TODOS OS UTILIZADORES - COMECE AQUI

## ⚡ CONSULTA RÁPIDA (30 segundos)

### 1. Abra o Supabase SQL Editor
```
Dashboard → SQL Editor → New query
```

### 2. Copie e Cole Isto:

```sql
SELECT 
  ROW_NUMBER() OVER (ORDER BY value->>'email') as "#",
  value->>'email' as "Email",
  value->>'name' as "Nome",
  value->>'role' as "Role",
  value->>'department' as "Departamento"
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
ORDER BY value->>'email';
```

### 3. Clique RUN

### 4. Resultado Esperado:

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

✅ **Deve mostrar 8 utilizadores!**

---

## 📚 OUTRAS OPÇÕES DE CONSULTA

### 📄 Ficheiros Disponíveis:

| Ficheiro | Descrição | Quando Usar |
|----------|-----------|-------------|
| **CONSULTAR-TODOS-USUARIOS-SIMPLES.sql** | Consulta básica e rápida | ⭐ Use este para começar |
| **CONSULTAR-TODOS-USUARIOS.sql** | 10 consultas diferentes | Para análises detalhadas |
| **CONSULTA-VISUAL-USUARIOS.sql** | Consulta super visual e bonita | Para apresentações |
| **COMO-CONSULTAR-USUARIOS.md** | Guia completo de consultas | Para aprender mais |

---

## 🎯 CONSULTAS MAIS COMUNS

### Contar Total de Utilizadores
```sql
SELECT COUNT(*) as total
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%';
-- Deve retornar: 8
```

### Ver Apenas os 2 Novos
```sql
SELECT 
  value->>'email' as email,
  value->>'name' as nome
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
  AND key LIKE 'user_profile:%';
-- Deve retornar: 2 utilizadores
```

### Ver Por Role
```sql
SELECT 
  value->>'role' as role,
  COUNT(*) as total
FROM kv_store_8b82752b
WHERE key LIKE 'user_profile:%'
GROUP BY value->>'role';
```

Resultado esperado:
```
role      | total
admin     | 2
attendant | 3
user      | 3
```

---

## 🔍 VERIFICAR NO DASHBOARD (SEM SQL)

### Opção Visual:

1. Supabase Dashboard
2. Clique em **Table Editor**
3. Selecione: **kv_store_8b82752b**
4. Adicione filtro:
   - Coluna: `key`
   - Operador: `LIKE`
   - Valor: `user_profile:%`
5. Clique **Apply**

Verá todos os registos dos utilizadores!

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Execute estas consultas e marque:

- [ ] **Total de utilizadores = 8?**
  ```sql
  SELECT COUNT(*) FROM kv_store_8b82752b WHERE key LIKE 'user_profile:%';
  ```

- [ ] **compras@sistema.com existe?**
  ```sql
  SELECT * FROM kv_store_8b82752b WHERE value->>'email' = 'compras@sistema.com';
  ```

- [ ] **motorista@sistema.com existe?**
  ```sql
  SELECT * FROM kv_store_8b82752b WHERE value->>'email' = 'motorista@sistema.com';
  ```

- [ ] **Todos os 6 originais existem?**
  ```sql
  SELECT COUNT(*) FROM kv_store_8b82752b 
  WHERE value->>'email' IN (
    'admin@sistema.com',
    'atendente@sistema.com',
    'usuario@empresa.com',
    'gerente@sistema.ao',
    'financeiro@sistema.ao',
    'operador@sistema.ao'
  ) AND key LIKE 'user_profile:%';
  -- Deve retornar: 6
  ```

Se todos marcados ✅, está perfeito!

---

## 🎨 CONSULTA VISUAL COMPLETA

Quer ver uma consulta SUPER VISUAL com estatísticas, gráficos e tudo organizado?

**Execute este ficheiro:**
```
📄 CONSULTA-VISUAL-USUARIOS.sql
```

Ele mostra:
- 📊 Resumo executivo
- 👥 Lista completa formatada
- 🔴 Administradores
- 🟡 Atendentes
- 🟢 Utilizadores externos
- 🏢 Distribuição por departamento
- ⭐ Verificação dos 8 principais
- 📅 Datas de criação

---

## 📊 RESUMO

### ⚡ Para começar:
```sql
SELECT * FROM kv_store_8b82752b WHERE key LIKE 'user_profile:%';
```

### 📋 Para ver formatado:
Use: **CONSULTAR-TODOS-USUARIOS-SIMPLES.sql**

### 🎨 Para apresentação:
Use: **CONSULTA-VISUAL-USUARIOS.sql**

---

## 🚀 PRÓXIMO PASSO

1. Execute a consulta rápida acima
2. Me confirme:
   - ✅ Quantos utilizadores apareceram?
   - ✅ compras e motorista estão na lista?
   - ✅ Total = 8 utilizadores?

Depois continuamos! 🎯
