# ⚡ INÍCIO RÁPIDO - Migração de Roles (5 minutos)

## 🎯 O QUE FAZER AGORA

Migrar de **3 roles** → **27 roles por departamento**

---

## 📋 PASSO A PASSO SIMPLIFICADO

### ✅ PASSO 1: Migrar Utilizadores Existentes (2 min)

1. Vá para: **SQL Editor** no Supabase

2. Cole e execute:
   ```
   📄 Conteúdo de: MIGRACAO-ROLES-DEPARTAMENTOS.sql
   ```

3. Aguarde ver:
   ```
   ✅ SUCESSO! 6 utilizadores migrados corretamente!
   ```

**O que aconteceu:**
- admin@sistema.com → role mudou para "administracao"
- atendente@sistema.com → role mudou para "secretaria"
- usuario@empresa.com → role mudou para "externo"
- gerente@sistema.ao → role mudou para "gestao"
- financeiro@sistema.ao → role mudou para "financeiro"
- operador@sistema.ao → role mudou para "operacoes"

---

### ✅ PASSO 2A: Criar 2 Novos no Dashboard (1 min)

1. Vá para: **Authentication → Users → Add user**

2. Criar primeiro:
   ```
   Email: compras@sistema.com
   Password: Compras@2026
   ✅ Auto Confirm User
   ```
   Clique: **Create user**

3. Criar segundo:
   ```
   Email: motorista@sistema.com
   Password: Motorista@2026
   ✅ Auto Confirm User
   ```
   Clique: **Create user**

---

### ✅ PASSO 2B: Criar Perfis no KV_STORE (1 min)

1. Vá para: **SQL Editor**

2. Cole e execute:
   ```
   📄 Conteúdo de: CRIAR-2-USUARIOS-NOVO-SISTEMA.sql
   ```

3. Aguarde ver:
   ```
   ✅ SUCESSO! Ambos os utilizadores foram criados corretamente!
   ```

---

### ✅ PASSO 3: Testar (1 min)

1. Faça login com:
   ```
   Email: admin@sistema.com
   Senha: 123456
   ```
   
   **Deve mostrar:**
   - ✅ Login funcionou
   - ✅ Role agora é: "administracao"

2. Faça login com:
   ```
   Email: compras@sistema.com
   Senha: Compras@2026
   ```
   
   **Deve mostrar:**
   - ✅ Login funcionou
   - ✅ Role é: "compras"
   - ✅ Nome: João Ferreira

---

## ✅ PRONTO!

Se tudo funcionou:
- ✅ 27 departamentos/roles implementados
- ✅ 8 utilizadores funcionando
- ✅ Sistema migrado com sucesso!

---

## ❌ NÃO FUNCIONOU?

Execute o diagnóstico:

1. Vá para: **SQL Editor**

2. Cole e execute:
   ```
   📄 Conteúdo de: DIAGNOSTICO-RAPIDO.sql
   ```

3. Veja qual passo falhou na seção "DIAGNÓSTICO FINAL"

4. Me informe o erro

---

## 📚 QUER MAIS DETALHES?

Leia a documentação completa:

- **README-MIGRACAO-ROLES.md** - Resumo executivo
- **INSTRUCOES-MIGRACAO-COMPLETA.md** - Passo a passo detalhado
- **ARQUITETURA-ROLES-DEPARTAMENTOS.md** - Arquitetura técnica

---

## 🗂️ OS 27 DEPARTAMENTOS

Agora o sistema tem 27 roles (departamentos):

### Gabinetes (10)
- 5 Executivos: PCA, PCE, Administrador, Director, Gestão
- 5 Governamentais: Ministro, 2 Secretários, 2 Vice-Governadores

### Operacionais (7)
- Financeiro, RH, Jurídico, Compras, TI, Operações, Frota

### Apoio (6)
- Administração, Administrativo, Comunicação, Segurança, Secretaria, Externo

### Estratégicos (4)
- Planeamento, Qualidade, Compliance, Risco

---

## 👥 OS 8 UTILIZADORES

| Email | Role | Senha |
|-------|------|-------|
| admin@sistema.com | administracao | 123456 |
| atendente@sistema.com | secretaria | 123456 |
| usuario@empresa.com | externo | 123456 |
| gerente@sistema.ao | gestao | gerente123 |
| financeiro@sistema.ao | financeiro | financeiro123 |
| operador@sistema.ao | operacoes | operador123 |
| compras@sistema.com | compras | Compras@2026 |
| motorista@sistema.com | operacional_frota | Motorista@2026 |

---

## ⏱️ TEMPO ESTIMADO

- PASSO 1: 2 minutos ⏱️
- PASSO 2A: 1 minuto ⏱️
- PASSO 2B: 1 minuto ⏱️
- PASSO 3: 1 minuto ⏱️

**TOTAL: 5 minutos** ⏱️

---

## 🚀 EXECUTE AGORA!

1. Abra o Supabase
2. Siga os 3 passos acima
3. Teste o login
4. Pronto!

**Boa migração!** 🎉
