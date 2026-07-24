# ⚡ INÍCIO AQUI - Login Não Funciona

## ✅ UUIDs estão corretos? SIM!

Então o problema é **outra coisa**.

---

## 🚀 SOLUÇÃO RÁPIDA (2 minutos)

### Execute este SQL agora:

```sql
-- Verificar o problema
SELECT 
  email as "Email",
  CASE 
    WHEN encrypted_password IS NULL THEN '❌ FALTA SENHA'
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO'
    ELSE '✅ OK'
  END as "Problema"
FROM auth.users
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');
```

---

## 📋 RESULTADOS POSSÍVEIS

### Se aparecer: **❌ FALTA SENHA**

**Solução Imediata:**

1. Vá para: **Authentication → Users** no Supabase
2. Encontre `compras@sistema.com`
3. Clique nos **...** (três pontos)
4. Clique em **Reset Password**
5. Digite: `Compras@2026`
6. Repita para `motorista@sistema.com` com senha: `Motorista@2026`

✅ **Pronto! Tente fazer login.**

---

### Se aparecer: **❌ EMAIL NÃO CONFIRMADO**

**Solução Imediata:**

Execute este SQL:

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN ('compras@sistema.com', 'motorista@sistema.com');
```

✅ **Pronto! Tente fazer login.**

---

### Se aparecer: **✅ OK**

O problema está no **frontend** ou na **lógica de login**.

**Verifique:**
1. Console do browser (F12)
2. Qual mensagem de erro aparece?
3. O login dos outros 6 utilizadores funciona?

---

## 🔍 DIAGNÓSTICO COMPLETO (Se precisar)

Execute este ficheiro para análise detalhada:

```
📄 DIAGNOSTICO-COMPLETO-LOGIN.sql
```

---

## 📁 FICHEIROS DE CORREÇÃO

- **CORRECAO-1-DEFINIR-SENHAS.sql** - Se falta senha
- **CORRECAO-2-CONFIRMAR-EMAILS.sql** - Se email não confirmado
- **DIAGNOSTICO-COMPLETO-LOGIN.sql** - Análise completa

---

## 🎯 FAÇA AGORA

**Opção 1 (Mais Rápida):**
Execute a consulta SQL acima e me diga: qual foi o resultado?

**Opção 2 (Mais Completa):**
Execute `DIAGNOSTICO-COMPLETO-LOGIN.sql` e me mostre o resumo.

---

## 💬 RESPONDA APENAS

```
O problema é: ___________
```

E eu preparo a solução exata! 🚀
