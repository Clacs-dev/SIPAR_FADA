# ⚡ CORREÇÃO RÁPIDA - Login dos Novos Utilizadores

## 🚨 PROBLEMA
Não consigo fazer login com compras@sistema.com e motorista@sistema.com

## 💡 CAUSA
Os UUIDs no Auth e no KV_STORE não batem!

---

## ✅ SOLUÇÃO RÁPIDA (2 Passos)

### 🔍 PASSO 1: Copie os UUIDs

Execute no SQL Editor:

```sql
SELECT email, id as uuid
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com')
ORDER BY email;
```

**Copie os 2 UUIDs que aparecerem!**

---

### 🔧 PASSO 2: Corrija os Perfis

1. Abra o arquivo: **`PASSO-2-CORRIGIR-UUIDS.sql`**

2. Procure por: `UUID-COMPRAS-AQUI`

3. Substitua pelo UUID real (5 vezes)

4. Procure por: `UUID-MOTORISTA-AQUI`

5. Substitua pelo UUID real (5 vezes)

6. Execute TODO o script

---

## 🧪 PASSO 3: Teste

Faça login com:
```
compras@sistema.com / Compras@2026
motorista@sistema.com / Motorista@2026
```

✅ **Deve funcionar!**

---

## 📁 FICHEIROS

- **PASSO-1-DESCOBRIR-UUIDS.sql** ← Execute primeiro
- **PASSO-2-CORRIGIR-UUIDS.sql** ← Edite e execute
- **GUIA-CORRIGIR-LOGIN.md** ← Guia completo

---

## 🚀 COMECE AGORA

Execute o **PASSO 1** e me diga os UUIDs que apareceram!
