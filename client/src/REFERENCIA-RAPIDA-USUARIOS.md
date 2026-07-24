# ⚡ REFERÊNCIA RÁPIDA - 23 UTILIZADORES DEPARTAMENTAIS

## 📊 LISTA COMPLETA DE CREDENCIAIS

### 🟣 GABINETES EXECUTIVOS (4)

| Email | Senha | Perfil | Departamento |
|-------|-------|--------|--------------|
| pca@sistema.ao | senha123 | Admin Sistema | Gabinete PCA |
| pce@sistema.ao | senha123 | Gestor | Gabinete PCE |
| administrador@sistema.ao | senha123 | Gestor | Gab. Administrador |
| director@sistema.ao | senha123 | Gestor | Gabinete Director |

---

### 🔵 GABINETES GOVERNAMENTAIS (5)

| Email | Senha | Perfil | Departamento |
|-------|-------|--------|--------------|
| ministro@sistema.ao | senha123 | Gestor | Gabinete Ministro |
| secretario1@sistema.ao | senha123 | Utilizador Interno | Sec. Estado 1 |
| secretario2@sistema.ao | senha123 | Utilizador Interno | Sec. Estado 2 |
| vicegovernador1@sistema.ao | senha123 | Utilizador Interno | Vice-Governador 1 |
| vicegovernador2@sistema.ao | senha123 | Utilizador Interno | Vice-Governador 2 |

---

### 🟢 DEPARTAMENTOS OPERACIONAIS (5)

| Email | Senha | Perfil | Departamento |
|-------|-------|--------|--------------|
| financeiro@sistema.ao | senha123 | Financeiro | Financeiro |
| rh@sistema.ao | senha123 | Utilizador Interno | Recursos Humanos |
| juridico@sistema.ao | senha123 | Utilizador Interno | Jurídico |
| compras@sistema.ao | senha123 | Utilizador Interno | Compras |
| ti@sistema.ao | senha123 | Utilizador Interno | TI |

---

### 🟠 DEPARTAMENTOS DE APOIO (4)

| Email | Senha | Perfil | Departamento |
|-------|-------|--------|--------------|
| administracao@sistema.ao | senha123 | Utilizador Interno | Administração |
| administrativo@sistema.ao | senha123 | Utilizador Interno | Administrativo |
| comunicacao@sistema.ao | senha123 | Utilizador Interno | Comunicação |
| seguranca@sistema.ao | senha123 | Operacional/Frota | Segurança |

---

### 🟣 DEPARTAMENTOS ESTRATÉGICOS (4)

| Email | Senha | Perfil | Departamento |
|-------|-------|--------|--------------|
| planeamento@sistema.ao | senha123 | Gestor | Planeamento |
| qualidade@sistema.ao | senha123 | Utilizador Interno | Qualidade |
| compliance@sistema.ao | senha123 | Utilizador Interno | Compliance |
| risco@sistema.ao | senha123 | Utilizador Interno | Risco |

---

### 👤 UTILIZADOR EXTERNO (1)

| Email | Senha | Perfil | Departamento |
|-------|-------|--------|--------------|
| externo@exemplo.ao | senha123 | Utilizador Externo | - |

---

## 🎯 COMANDOS RÁPIDOS

### Verificar Total
```sql
SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%';
```
**Resultado esperado:** 23

### Listar Todos os Emails
```sql
SELECT value->>'email', value->>'name', value->>'department' 
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%' 
ORDER BY value->>'email';
```

### Verificar por Categoria
```sql
-- Executivos
SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%' 
  AND value->>'department' IN ('gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director');
-- Esperado: 4

-- Governamentais  
SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%'
  AND value->>'department' LIKE 'gabinete_%ministro%' 
  OR value->>'department' LIKE 'gabinete_secretario%' 
  OR value->>'department' LIKE 'gabinete_vice%';
-- Esperado: 5

-- Operacionais
SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%'
  AND value->>'department' IN ('financeiro', 'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao');
-- Esperado: 5

-- Apoio
SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%'
  AND value->>'department' IN ('administracao', 'administrativo', 'comunicacao_imagem', 'seguranca');
-- Esperado: 4

-- Estratégicos
SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%'
  AND value->>'department' IN ('planeamento', 'organizacao_qualidade', 'compliance', 'risco');
-- Esperado: 4
```

---

## 📋 FICHEIROS CRIADOS

- **`/CREATE-USERS-DEPARTMENTS.sql`** - Script SQL para criar os 23 utilizadores
- **`/GUIA-CRIACAO-23-USUARIOS.md`** - Guia completo passo a passo
- **`/VERIFICAR-23-USUARIOS.sql`** - Scripts de verificação
- **`/REFERENCIA-RAPIDA-USUARIOS.md`** - Este ficheiro (referência rápida)

---

## ⚡ PROCESSO EM 3 PASSOS

### 1️⃣ Executar SQL
```bash
# Abrir: Supabase Dashboard → SQL Editor
# Copiar: /CREATE-USERS-DEPARTMENTS.sql
# Executar: RUN
```

### 2️⃣ Criar no Auth
```bash
# Abrir: Authentication → Users → Add user
# Para cada um dos 23 emails
# Senha padrão: senha123
# ✅ Auto Confirm User
```

### 3️⃣ Verificar
```bash
# Executar: /VERIFICAR-23-USUARIOS.sql
# Deve mostrar: 23 utilizadores
```

---

## 🧪 TESTES SUGERIDOS

### Teste 1: Login Executivo
```
Email: pca@sistema.ao
Senha: senha123
```
✅ Deve ver dashboard de Admin Sistema

### Teste 2: Login Governamental
```
Email: ministro@sistema.ao
Senha: senha123
```
✅ Deve ver dashboard de Gestor

### Teste 3: Login Financeiro
```
Email: financeiro@sistema.ao
Senha: senha123
```
✅ Deve ver dashboard de Financeiro com módulo de Facturas

### Teste 4: Login Segurança
```
Email: seguranca@sistema.ao
Senha: senha123
```
✅ Deve ver dashboard de Operacional com módulo de Frotas

### Teste 5: Login Externo
```
Email: externo@exemplo.ao
Senha: senha123
```
✅ Deve ver apenas funcionalidades externas limitadas

---

## 📊 DISTRIBUIÇÃO POR PERFIL

```
✅ Admin Sistema:        1 utilizador   (4%)
✅ Gestor:               5 utilizadores (22%)
✅ Utilizador Interno:  14 utilizadores (61%)
✅ Financeiro:           1 utilizador   (4%)
✅ Operacional/Frota:    1 utilizador   (4%)
✅ Utilizador Externo:   1 utilizador   (4%)
────────────────────────────────────────────
   TOTAL:              23 utilizadores (100%)
```

---

## 🔐 SEGURANÇA

- ✅ Todos os utilizadores confirmados automaticamente
- ✅ Senha padrão: `senha123` (alterar em produção)
- ✅ Um utilizador por departamento (arquitetura 1:1)
- ✅ Perfis distribuídos conforme hierarquia organizacional
- ✅ Departamentos seguem estrutura oficial do sistema

---

## 📱 ACESSO RÁPIDO AO SISTEMA

**URL:** https://[seu-projeto].supabase.co

**Login Rápido:**
- Admin: pca@sistema.ao / senha123
- Gestor: ministro@sistema.ao / senha123  
- Financeiro: financeiro@sistema.ao / senha123
- Externo: externo@exemplo.ao / senha123

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] SQL executado com sucesso
- [ ] 23 utilizadores criados no Auth
- [ ] Todos confirmados (Auto Confirm marcado)
- [ ] Teste de login funcional
- [ ] Dashboards departamentais visíveis
- [ ] Permissões por perfil funcionais
- [ ] Filtros departamentais operacionais

---

**Criado:** Janeiro 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para Produção
