# 🚀 INSTRUÇÕES COMPLETAS: Migração para Roles por Departamento

## 📊 RESUMO DA MUDANÇA

### ❌ ANTES (Sistema Antigo):
- **3 roles fixos:** `admin`, `attendant`, `user`
- Permissões baseadas nesses 3 papéis
- Departamento era apenas informativo

### ✅ DEPOIS (Sistema Novo):
- **27 roles** (um para cada departamento)
- Permissões baseadas no departamento
- **role = department** (mesma coisa)

---

## 📋 LISTA DOS 27 DEPARTAMENTOS/ROLES

### 🔷 Gabinetes Executivos (5)
1. `gabinete_pca`
2. `gabinete_pce`
3. `gabinete_administrador`
4. `gabinete_director`
5. `gestao` ← NOVO

### 🔵 Gabinetes Governamentais (5)
6. `gabinete_ministro`
7. `gabinete_secretario_estado_1`
8. `gabinete_secretario_estado_2`
9. `gabinete_vice_governador_1`
10. `gabinete_vice_governador_2`

### 🟢 Operacionais (7)
11. `financeiro`
12. `recursos_humanos`
13. `juridico`
14. `compras`
15. `tecnologia_informacao`
16. `operacoes` ← NOVO
17. `operacional_frota` ← NOVO

### 🟠 Apoio (6)
18. `administracao`
19. `administrativo`
20. `comunicacao_imagem`
21. `seguranca`
22. `secretaria` ← NOVO
23. `externo` ← NOVO

### 🟣 Estratégicos (4)
24. `planeamento`
25. `organizacao_qualidade`
26. `compliance`
27. `risco`

---

## ⚡ PROCESSO DE MIGRAÇÃO (4 PASSOS)

### PASSO 1: Executar Migração de Roles (SQL)

```sql
-- Executar no SQL Editor do Supabase
📄 MIGRACAO-ROLES-DEPARTAMENTOS.sql
```

**O que faz:**
- Atualiza os 6 utilizadores existentes
- Muda `role` de `admin/attendant/user` para o departamento correspondente
- Garante que `role === department`

**Mapeamento:**
| Email | Role Antigo | Role Novo |
|-------|-------------|-----------|
| admin@sistema.com | admin | **administracao** |
| atendente@sistema.com | attendant | **secretaria** |
| usuario@empresa.com | user | **externo** |
| gerente@sistema.ao | admin | **gestao** |
| financeiro@sistema.ao | attendant | **financeiro** |
| operador@sistema.ao | attendant | **operacoes** |

**Resultado esperado:**
```
✅ SUCESSO! 6 utilizadores migrados corretamente!
```

---

### PASSO 2: Criar os 2 Novos Utilizadores

#### 2A: Criar no Dashboard do Supabase

1. Vá para: **Authentication → Users → Add user**

2. Criar **João Ferreira**:
   ```
   Email: compras@sistema.com
   Password: Compras@2026
   ✅ Auto Confirm User
   ```

3. Criar **Carlos Silva**:
   ```
   Email: motorista@sistema.com
   Password: Motorista@2026
   ✅ Auto Confirm User
   ```

#### 2B: Criar Perfis no KV_STORE

```sql
-- Executar no SQL Editor
📄 CRIAR-2-USUARIOS-NOVO-SISTEMA.sql
```

**O que faz:**
- Cria perfis para João Ferreira com `role=compras`
- Cria perfis para Carlos Silva com `role=operacional_frota`
- Garante que `role === department`

**Resultado esperado:**
```
✅ SUCESSO! Ambos os utilizadores foram criados corretamente!
```

---

### PASSO 3: Verificar Sistema Funcionando

#### Teste 1: Login de Utilizador Migrado
```
Email: admin@sistema.com
Senha: 123456
```

**Deve mostrar:**
- ✅ Login com sucesso
- ✅ Role: `administracao`
- ✅ Department: `administracao`
- ✅ Permissões funcionando

#### Teste 2: Login de Novo Utilizador
```
Email: compras@sistema.com
Senha: Compras@2026
```

**Deve mostrar:**
- ✅ Login com sucesso
- ✅ Role: `compras`
- ✅ Department: `compras`
- ✅ Permissões funcionando

---

### PASSO 4: Atualizar Frontend (Se Necessário)

Os arquivos do backend já foram atualizados:
- ✅ `/supabase/functions/server/permissions.tsx` - Sistema de permissões
- ✅ `/supabase/functions/server/auth.tsx` - Autenticação
- ✅ `/components/admin/departments.tsx` - 27 departamentos

**Verificar no frontend:**
1. Componentes que verificam `user.role === 'admin'`
2. Atualizar para verificar por departamento:
   ```typescript
   // ANTES
   if (user.role === 'admin') { ... }
   
   // DEPOIS
   if (['gabinete_pca', 'gabinete_administrador', 'administracao'].includes(user.role)) { ... }
   ```

---

## 📊 RESUMO DOS 8 UTILIZADORES FINAIS

| # | Email | Nome | Role Novo | Department |
|---|-------|------|-----------|------------|
| 1 | admin@sistema.com | Administrador | **administracao** | administracao |
| 2 | atendente@sistema.com | Maria Atendente | **secretaria** | secretaria |
| 3 | usuario@empresa.com | João Usuário | **externo** | externo |
| 4 | gerente@sistema.ao | João Gerente | **gestao** | gestao |
| 5 | financeiro@sistema.ao | Maria Financeira | **financeiro** | financeiro |
| 6 | operador@sistema.ao | Carlos Operador | **operacoes** | operacoes |
| 7 | compras@sistema.com | João Ferreira | **compras** | compras |
| 8 | motorista@sistema.com | Carlos Silva | **operacional_frota** | operacional_frota |

---

## 🗺️ MAPEAMENTO DE PERMISSÕES

### Admin Completo (11 roles):
```typescript
[
  'gabinete_pca',
  'gabinete_pce',
  'gabinete_administrador',
  'gabinete_director',
  'gabinete_ministro',
  'gabinete_secretario_estado_1',
  'gabinete_secretario_estado_2',
  'gabinete_vice_governador_1',
  'gabinete_vice_governador_2',
  'administracao',
  'gestao',
  'tecnologia_informacao'  ← TI também tem acesso admin
]
```

### Gerente (6 roles):
```typescript
[
  'recursos_humanos',
  'juridico',
  'comunicacao_imagem',
  'planeamento',
  'organizacao_qualidade',
  'compliance',
  'risco'
]
```

### Financeiro (1 role):
```typescript
['financeiro']
```

### Operador (3 roles):
```typescript
[
  'operacoes',
  'operacional_frota',
  'compras'
]
```

### Atendente (3 roles):
```typescript
[
  'secretaria',
  'administrativo',
  'seguranca'
]
```

### Externo (1 role):
```typescript
['externo']
```

---

## ✅ CHECKLIST DE MIGRAÇÃO

- [ ] **PASSO 1:** Executei `MIGRACAO-ROLES-DEPARTAMENTOS.sql`
- [ ] Verifiquei: "✅ 6 utilizadores migrados"
- [ ] **PASSO 2A:** Criei João Ferreira no Dashboard
- [ ] **PASSO 2A:** Criei Carlos Silva no Dashboard
- [ ] **PASSO 2B:** Executei `CRIAR-2-USUARIOS-NOVO-SISTEMA.sql`
- [ ] Verifiquei: "✅ Ambos os utilizadores foram criados"
- [ ] **PASSO 3:** Testei login: admin@sistema.com
- [ ] ✅ Role mudou para `administracao`
- [ ] **PASSO 3:** Testei login: compras@sistema.com
- [ ] ✅ Login funcionou com role `compras`
- [ ] **PASSO 4:** Verifiquei o frontend (se necessário)
- [ ] ✅ Sistema funcionando 100%!

---

## 🆘 TROUBLESHOOTING

### Erro: "Role 'admin' is not assignable to type 'SystemRole'"
**Causa:** Código antigo ainda usa roles antigos  
**Solução:** Atualizar para usar os 27 departamentos

### Erro: "User profile not found" após migração
**Causa:** Migração não foi executada  
**Solução:** Executar `MIGRACAO-ROLES-DEPARTAMENTOS.sql`

### Permissões não funcionam após migração
**Causa:** Frontend ainda verifica role antigo  
**Solução:** Atualizar verificações no frontend

---

## 📚 ARQUIVOS IMPORTANTES

### ✅ Para Executar:
1. **MIGRACAO-ROLES-DEPARTAMENTOS.sql** - Migração dos 6 existentes
2. **CRIAR-2-USUARIOS-NOVO-SISTEMA.sql** - Criar os 2 novos

### ✅ Já Atualizados (Backend):
1. **/supabase/functions/server/permissions.tsx** - Sistema de permissões
2. **/supabase/functions/server/auth.tsx** - Autenticação
3. **/components/admin/departments.tsx** - 27 departamentos

### 📖 Para Referência:
1. **NOVA-ARQUITETURA-ROLES.md** - Explicação completa
2. **INSTRUCOES-MIGRACAO-COMPLETA.md** - Este ficheiro

---

## 🎯 PRÓXIMOS PASSOS APÓS MIGRAÇÃO

1. ✅ Sistema com 27 roles funcionando
2. ✅ 8 utilizadores criados
3. ⏳ **Situação 3:** Implementar múltiplos perfis por utilizador
4. ⏳ Criar interface para gestão de roles
5. ⏳ Criar relatórios por departamento

---

## ✅ RESULTADO FINAL

Após completar todos os passos:

- ✅ 27 departamentos/roles disponíveis
- ✅ 8 utilizadores funcionando
- ✅ Permissões baseadas em departamento
- ✅ role = department (arquitetura limpa)
- ✅ Sistema pronto para produção!

---

**Execute os 4 passos e me confirme quando terminar!** 🚀
