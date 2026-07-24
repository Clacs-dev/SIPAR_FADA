# 🎯 GUIA: Criar 2 Novos Utilizadores

## 👥 UTILIZADORES A CRIAR

### Utilizador 7: João Ferreira
- **Email:** compras@sistema.com
- **Senha:** Compras@2026
- **Nome:** João Ferreira
- **Perfil:** Utilizador Interno
- **Departamento:** Aquisições e Compras
- **Posição:** Responsável de Compras

### Utilizador 8: Carlos Silva
- **Email:** motorista@sistema.com
- **Senha:** Motorista@2026
- **Nome:** Carlos Silva
- **Perfil:** Operacional/Frota
- **Departamento:** Operacional e Frota
- **Posição:** Motorista

---

## ⚡ MÉTODO RÁPIDO (5 minutos)

### PASSO 1: Criar no Supabase Auth (via Dashboard)

#### 1.1 Criar João Ferreira (Compras)

1. Vá para: **Authentication → Users**
2. Clique: **Add user → Create new user**
3. Preencha:
   ```
   Email: compras@sistema.com
   Password: Compras@2026
   ```
4. ✅ **Marque:** Auto Confirm User
5. Clique: **Create user**

#### 1.2 Criar Carlos Silva (Motorista)

1. Clique novamente: **Add user → Create new user**
2. Preencha:
   ```
   Email: motorista@sistema.com
   Password: Motorista@2026
   ```
3. ✅ **Marque:** Auto Confirm User
4. Clique: **Create user**

---

### PASSO 2: Criar Perfis no KV_STORE (via SQL)

1. Vá para: **SQL Editor → New query**
2. Copie TODO o conteúdo de:
   ```
   📄 CRIAR-2-USUARIOS-CORRETO.sql
   ```
3. Clique: **RUN**
4. Aguarde a mensagem:
   ```
   ✅ SUCESSO! Ambos os utilizadores foram criados corretamente!
   ```

---

### PASSO 3: Testar o Login

#### Teste 1: João Ferreira (Compras)
```
Email: compras@sistema.com
Senha: Compras@2026
```

Deve:
- ✅ Fazer login com sucesso
- ✅ Mostrar nome: "João Ferreira"
- ✅ Mostrar departamento: "Aquisições e Compras"
- ✅ Mostrar posição: "Responsável de Compras"

#### Teste 2: Carlos Silva (Motorista)
```
Email: motorista@sistema.com
Senha: Motorista@2026
```

Deve:
- ✅ Fazer login com sucesso
- ✅ Mostrar nome: "Carlos Silva"
- ✅ Mostrar departamento: "Operacional e Frota"
- ✅ Mostrar posição: "Motorista"

---

## 🔍 VERIFICAÇÃO (Opcional)

Se quiser verificar antes de testar o login:

```sql
-- Ver se existem no Auth
SELECT 
  email,
  id as uuid,
  CASE WHEN email_confirmed_at IS NOT NULL THEN '✅' ELSE '❌' END as confirmado
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');

-- Ver se perfis existem no KV_STORE
SELECT 
  value->>'email' as email,
  value->>'name' as nome,
  value->>'department' as departamento
FROM kv_store_8b82752b
WHERE value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')
AND key LIKE 'user_profile:%';
```

Ambas as consultas devem retornar 2 linhas.

---

## 🆘 TROUBLESHOOTING

### Erro: "User already exists"
**Causa:** Já criou antes  
**Solução:** Pule o PASSO 1, execute só o PASSO 2 (SQL)

---

### Erro: "User profile not found" no login
**Causa:** Não executou o PASSO 2 (SQL)  
**Solução:** Execute o script `CRIAR-2-USUARIOS-CORRETO.sql`

---

### Erro: "Invalid credentials"
**Causa:** Senha errada  
**Solução:** 
1. Vá para: **Authentication → Users**
2. Encontre o utilizador
3. Clique nos **...** → **Reset Password**
4. Digite a senha correta:
   - Compras: `Compras@2026`
   - Motorista: `Motorista@2026`

---

### Script SQL retorna: "❌ ERRO: Nenhum utilizador foi criado"
**Causa:** Não existem no Auth ainda  
**Solução:** Execute o PASSO 1 primeiro (criar no Dashboard)

---

## 📊 RESUMO DOS 8 UTILIZADORES

Depois de criar, você terá:

| # | Email | Nome | Perfil | Departamento |
|---|-------|------|--------|--------------|
| 1 | admin@sistema.com | Administrador | Admin | Administração |
| 2 | atendente@sistema.com | Maria Atendente | Attendant | Secretaria |
| 3 | usuario@empresa.com | João Usuário | User | Externo |
| 4 | gerente@sistema.ao | João Gerente | Admin | Gestão |
| 5 | financeiro@sistema.ao | Maria Financeira | Attendant | Financeiro |
| 6 | operador@sistema.ao | Carlos Operador | Attendant | Operações |
| 7 | **compras@sistema.com** | **João Ferreira** | **User** | **Aquisições** |
| 8 | **motorista@sistema.com** | **Carlos Silva** | **User** | **Operacional/Frota** |

---

## ✅ CHECKLIST

- [ ] Criei João Ferreira no Auth (Dashboard)
- [ ] Criei Carlos Silva no Auth (Dashboard)
- [ ] Executei o script SQL (CRIAR-2-USUARIOS-CORRETO.sql)
- [ ] Vi a mensagem: "✅ SUCESSO!"
- [ ] Testei login: compras@sistema.com
- [ ] ✅ Login do João funcionou!
- [ ] Testei login: motorista@sistema.com
- [ ] ✅ Login do Carlos funcionou!

---

## 🎯 RESUMO

**Tempo total:** 5 minutos  
**Complexidade:** Fácil  
**Resultado:** 2 novos utilizadores funcionando! 🚀

---

**Execute o PASSO 1 e PASSO 2, depois me confirme se funcionou!** ✅
