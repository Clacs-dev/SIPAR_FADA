# 🔧 CORRIGIR LOGIN - GUIA COMPLETO

## 🎯 PROBLEMA

Você não consegue fazer login com:
- ❌ compras@sistema.com
- ❌ motorista@sistema.com

### Por quê?
Os **UUIDs** não estão sincronizados entre:
- Supabase Auth (UUID automático gerado)
- KV_STORE (usamos IDs fixos: compras-001 e motorista-001)

---

## ✅ SOLUÇÃO EM 2 PASSOS (5 minutos)

```
PASSO 1: Descobrir UUIDs  →  PASSO 2: Corrigir Perfis  →  ✅ Login Funciona!
   (2 minutos)                    (3 minutos)               
```

---

## 📋 PASSO 1: Descobrir os UUIDs Reais

### 1.1 Abra o SQL Editor
```
Supabase Dashboard → SQL Editor → New query
```

### 1.2 Execute este script:
```
📄 Abra: PASSO-1-DESCOBRIR-UUIDS.sql
```

Ou copie e cole isto:

```sql
SELECT 
  email as "Email",
  id as "UUID (Copie isto!)"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;
```

### 1.3 Resultado Esperado:

```
Email                  | UUID (Copie isto!)
compras@sistema.com    | a1b2c3d4-e5f6-7890-1234-567890abcdef
motorista@sistema.com  | f9e8d7c6-b5a4-3210-fedc-ba9876543210
```

### 1.4 COPIE OS 2 UUIDs!

✏️ UUID do compras: `_________________________________`

✏️ UUID do motorista: `_________________________________`

---

## 📋 PASSO 2: Corrigir os Perfis

### 2.1 Abra o arquivo de correção
```
📄 PASSO-2-CORRIGIR-UUIDS.sql
```

### 2.2 Substitua os UUIDs

Procure por estas linhas no arquivo:

```sql
'user_profile:UUID-COMPRAS-AQUI'
```

E substitua **UUID-COMPRAS-AQUI** pelo UUID real que você copiou.

**EXEMPLO:**

❌ ANTES:
```sql
'user_profile:UUID-COMPRAS-AQUI'
```

✅ DEPOIS:
```sql
'user_profile:a1b2c3d4-e5f6-7890-1234-567890abcdef'
```

### 2.3 Faça o mesmo para TODOS os lugares

Procure e substitua:
- `UUID-COMPRAS-AQUI` → cole o UUID do compras (5 ocorrências)
- `UUID-MOTORISTA-AQUI` → cole o UUID do motorista (5 ocorrências)

### 2.4 Execute o script completo

Depois de substituir todos os UUIDs, execute TODO o script.

### 2.5 Veja a confirmação

```
✅ CORREÇÃO CONCLUÍDA!
Agora tente fazer login com:
compras@sistema.com / Compras@2026
motorista@sistema.com / Motorista@2026
```

---

## 🧪 PASSO 3: Testar Login

### 3.1 Fazer Logout
Se estiver logado, faça logout.

### 3.2 Testar COMPRAS
```
Email: compras@sistema.com
Senha: Compras@2026
```
✅ Deve funcionar!

### 3.3 Testar MOTORISTA
```
Email: motorista@sistema.com
Senha: Motorista@2026
```
✅ Deve funcionar!

---

## 🔍 VERIFICAÇÃO (OPCIONAL)

Para confirmar que está tudo correto, execute:

```sql
-- Os UUIDs devem ser IGUAIS
SELECT 
  'AUTH' as origem,
  au.id as uuid,
  au.email
FROM auth.users au
WHERE au.email IN ('compras@sistema.com', 'motorista@sistema.com')

UNION ALL

SELECT 
  'KV_STORE' as origem,
  (kv.value->>'id') as uuid,
  (kv.value->>'email') as email
FROM kv_store_8b82752b kv
WHERE kv.key LIKE 'user_profile:%'
  AND kv.value->>'email' IN ('compras@sistema.com', 'motorista@sistema.com')

ORDER BY email, origem;
```

**Resultado esperado:**
```
origem    | uuid                                  | email
AUTH      | a1b2c3d4-e5f6-7890-1234-567890abcdef | compras@sistema.com
KV_STORE  | a1b2c3d4-e5f6-7890-1234-567890abcdef | compras@sistema.com  ← IGUAIS ✅
AUTH      | f9e8d7c6-b5a4-3210-fedc-ba9876543210 | motorista@sistema.com
KV_STORE  | f9e8d7c6-b5a4-3210-fedc-ba9876543210 | motorista@sistema.com  ← IGUAIS ✅
```

---

## ✅ CHECKLIST COMPLETO

- [ ] **PASSO 1:** Executei PASSO-1-DESCOBRIR-UUIDS.sql
- [ ] Copiei o UUID do compras@sistema.com
- [ ] Copiei o UUID do motorista@sistema.com
- [ ] **PASSO 2:** Abri PASSO-2-CORRIGIR-UUIDS.sql
- [ ] Substituí todos os `UUID-COMPRAS-AQUI` (5 lugares)
- [ ] Substituí todos os `UUID-MOTORISTA-AQUI` (5 lugares)
- [ ] Executei o script completo
- [ ] Vi a mensagem "✅ CORREÇÃO CONCLUÍDA!"
- [ ] **PASSO 3:** Fiz logout
- [ ] Testei login: compras@sistema.com
- [ ] ✅ Login do COMPRAS funcionou!
- [ ] Testei login: motorista@sistema.com
- [ ] ✅ Login do MOTORISTA funcionou!

Se todos marcados: **PROBLEMA RESOLVIDO!** 🎉

---

## 🆘 SE NÃO FUNCIONAR

### Erro: "UUID-COMPRAS-AQUI não encontrado"

**Solução:** Você esqueceu de substituir os UUIDs no script!
Volte ao PASSO 2.2 e substitua corretamente.

---

### Erro: "Invalid login credentials"

**Solução:** A senha pode estar errada. Tente:
- `Compras@2026` (com C maiúsculo)
- `compras@2026` (tudo minúsculo)

Ou redefina a senha no Auth:
1. Auth → Users → Encontre o utilizador
2. Clique no email
3. Clique em "Reset password"

---

### Ainda não funciona?

Me diga:
1. Qual mensagem de erro exata?
2. Executou o PASSO 1? Quais UUIDs apareceram?
3. Substituiu os UUIDs no PASSO 2?
4. Executou a verificação? Os UUIDs batem?

---

## 📁 FICHEIROS NECESSÁRIOS

✅ **PASSO-1-DESCOBRIR-UUIDS.sql** - Execute primeiro  
✅ **PASSO-2-CORRIGIR-UUIDS.sql** - Substitua UUIDs e execute  
✅ **PROBLEMA-LOGIN-NOVOS-USUARIOS.md** - Documentação completa

---

## 🚀 COMECE AGORA!

1. Abra o SQL Editor
2. Execute **PASSO-1-DESCOBRIR-UUIDS.sql**
3. Copie os UUIDs
4. Me diga: "Copiei os UUIDs, agora o que faço?"

E eu te guio no resto! 💪
