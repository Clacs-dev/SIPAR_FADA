# 🚀 GUIA COMPLETO: Criação de 23 Utilizadores Departamentais

## 📋 Visão Geral

Este guia cria **23 utilizadores**, um para cada um dos departamentos do sistema:

### Estrutura Organizacional

- **4 Gabinetes Executivos** (PCA, PCE, Administrador, Director)
- **5 Gabinetes Governamentais** (Ministro, 2 Secretários Estado, 2 Vice-Governadores)
- **5 Departamentos Operacionais** (Financeiro, RH, Jurídico, Compras, TI)
- **4 Departamentos de Apoio** (Administração, Administrativo, Comunicação, Segurança)
- **4 Departamentos Estratégicos** (Planeamento, Qualidade, Compliance, Risco)
- **1 Utilizador Externo** (para testes)

---

## ⚡ PASSO 1: Executar SQL no Supabase

### 1.1. Aceder ao Dashboard
1. Vá para: https://supabase.com/dashboard
2. Selecione o seu projeto
3. Menu lateral esquerdo: **SQL Editor**

### 1.2. Executar Script
1. Abra o ficheiro: `/CREATE-USERS-DEPARTMENTS.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **RUN** (ou Ctrl+Enter)
5. ✅ Aguarde a mensagem de sucesso
6. ✅ Verá uma listagem com os 23 utilizadores criados

---

## 🔐 PASSO 2: Criar Contas no Supabase Auth

Agora precisa criar as contas de autenticação para cada utilizador:

### 2.1. Aceder à Gestão de Utilizadores
1. Menu lateral: **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**

### 2.2. Criar Cada Utilizador

**IMPORTANTE:** Para cada utilizador abaixo:
- ✅ MARQUE: **Auto Confirm User** (para confirmar automaticamente o email)
- Use a senha padrão: `senha123` (pode alterar depois)

---

## 📧 CREDENCIAIS DOS 23 UTILIZADORES

### 🟣 GABINETES EXECUTIVOS (4 utilizadores)

#### 1️⃣ Gabinete do PCA
```
Email: pca@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Admin Sistema | **Departamento:** Gabinete do PCA

---

#### 2️⃣ Gabinete do PCE
```
Email: pce@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Gestor | **Departamento:** Gabinete do PCE

---

#### 3️⃣ Gabinete do Administrador
```
Email: administrador@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Gestor | **Departamento:** Gabinete do Administrador

---

#### 4️⃣ Gabinete do Director
```
Email: director@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Gestor | **Departamento:** Gabinete do Director

---

### 🔵 GABINETES GOVERNAMENTAIS (5 utilizadores)

#### 5️⃣ Gabinete do Ministro
```
Email: ministro@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Gestor | **Departamento:** Gabinete do Ministro

---

#### 6️⃣ Secretário de Estado 1
```
Email: secretario1@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Gabinete Secretário Estado 1

---

#### 7️⃣ Secretário de Estado 2
```
Email: secretario2@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Gabinete Secretário Estado 2

---

#### 8️⃣ Vice-Governador 1
```
Email: vicegovernador1@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Gabinete Vice-Governador 1

---

#### 9️⃣ Vice-Governador 2
```
Email: vicegovernador2@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Gabinete Vice-Governador 2

---

### 🟢 DEPARTAMENTOS OPERACIONAIS (5 utilizadores)

#### 🔟 Departamento Financeiro
```
Email: financeiro@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Financeiro | **Departamento:** Financeiro

---

#### 1️⃣1️⃣ Recursos Humanos
```
Email: rh@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Recursos Humanos

---

#### 1️⃣2️⃣ Departamento Jurídico
```
Email: juridico@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Jurídico

---

#### 1️⃣3️⃣ Departamento de Compras
```
Email: compras@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Compras

---

#### 1️⃣4️⃣ Tecnologia e Informação
```
Email: ti@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Tecnologia e Informação

---

### 🟠 DEPARTAMENTOS DE APOIO (4 utilizadores)

#### 1️⃣5️⃣ Departamento de Administração
```
Email: administracao@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Administração

---

#### 1️⃣6️⃣ Serviços Administrativos
```
Email: administrativo@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Administrativo

---

#### 1️⃣7️⃣ Comunicação e Imagem
```
Email: comunicacao@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Comunicação e Imagem

---

#### 1️⃣8️⃣ Departamento de Segurança
```
Email: seguranca@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Operacional/Frota | **Departamento:** Segurança

---

### 🟣 DEPARTAMENTOS ESTRATÉGICOS (4 utilizadores)

#### 1️⃣9️⃣ Departamento de Planeamento
```
Email: planeamento@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Gestor | **Departamento:** Planeamento

---

#### 2️⃣0️⃣ Organização e Qualidade
```
Email: qualidade@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Organização e Qualidade

---

#### 2️⃣1️⃣ Compliance
```
Email: compliance@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Compliance

---

#### 2️⃣2️⃣ Gestão de Riscos
```
Email: risco@sistema.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Interno | **Departamento:** Risco

---

### 👤 UTILIZADOR EXTERNO (1 utilizador)

#### 2️⃣3️⃣ Utilizador Externo
```
Email: externo@exemplo.ao
Password: senha123
✅ Auto Confirm User
```
**Perfil:** Utilizador Externo | **Departamento:** N/A

---

## ✅ PASSO 3: Verificar Criação

### 3.1. Verificar na Base de Dados

Execute este SQL para confirmar:

```sql
SELECT 
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'department' as department,
  value->'profiles' as profiles
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%'
ORDER BY value->>'department', value->>'name';
```

**Deverá ver 23 linhas listadas.**

---

### 3.2. Testar Login

Teste alguns utilizadores na aplicação:

```
🟣 Admin - PCA:
✉️ pca@sistema.ao
🔑 senha123

🔵 Ministro:
✉️ ministro@sistema.ao
🔑 senha123

🟢 Financeiro:
✉️ financeiro@sistema.ao
🔑 senha123

🟠 Comunicação:
✉️ comunicacao@sistema.ao
🔑 senha123

🟣 Planeamento:
✉️ planeamento@sistema.ao
🔑 senha123

👤 Externo:
✉️ externo@exemplo.ao
🔑 senha123
```

---

## 📊 TABELA RESUMO - TODOS OS UTILIZADORES

| # | Email | Senha | Role | Perfil | Departamento |
|---|-------|-------|------|--------|--------------|
| 1 | pca@sistema.ao | senha123 | admin | Admin Sistema | Gabinete PCA |
| 2 | pce@sistema.ao | senha123 | admin | Gestor | Gabinete PCE |
| 3 | administrador@sistema.ao | senha123 | admin | Gestor | Gab. Administrador |
| 4 | director@sistema.ao | senha123 | admin | Gestor | Gabinete Director |
| 5 | ministro@sistema.ao | senha123 | admin | Gestor | Gabinete Ministro |
| 6 | secretario1@sistema.ao | senha123 | attendant | Utilizador Interno | Sec. Estado 1 |
| 7 | secretario2@sistema.ao | senha123 | attendant | Utilizador Interno | Sec. Estado 2 |
| 8 | vicegovernador1@sistema.ao | senha123 | attendant | Utilizador Interno | Vice-Gov 1 |
| 9 | vicegovernador2@sistema.ao | senha123 | attendant | Utilizador Interno | Vice-Gov 2 |
| 10 | financeiro@sistema.ao | senha123 | attendant | Financeiro | Financeiro |
| 11 | rh@sistema.ao | senha123 | attendant | Utilizador Interno | Recursos Humanos |
| 12 | juridico@sistema.ao | senha123 | attendant | Utilizador Interno | Jurídico |
| 13 | compras@sistema.ao | senha123 | attendant | Utilizador Interno | Compras |
| 14 | ti@sistema.ao | senha123 | attendant | Utilizador Interno | TI |
| 15 | administracao@sistema.ao | senha123 | attendant | Utilizador Interno | Administração |
| 16 | administrativo@sistema.ao | senha123 | attendant | Utilizador Interno | Administrativo |
| 17 | comunicacao@sistema.ao | senha123 | attendant | Utilizador Interno | Comunicação |
| 18 | seguranca@sistema.ao | senha123 | attendant | Operacional/Frota | Segurança |
| 19 | planeamento@sistema.ao | senha123 | attendant | Gestor | Planeamento |
| 20 | qualidade@sistema.ao | senha123 | attendant | Utilizador Interno | Qualidade |
| 21 | compliance@sistema.ao | senha123 | attendant | Utilizador Interno | Compliance |
| 22 | risco@sistema.ao | senha123 | attendant | Utilizador Interno | Risco |
| 23 | externo@exemplo.ao | senha123 | user | Utilizador Externo | - |

---

## 🔧 Resolução de Problemas

### ❌ "Email already registered"
**Solução:** O utilizador já existe no Auth. Pode ignorar ou deletar e recriar.

### ❌ "User not found" ao fazer login
**Solução:** Certifique-se que executou o SQL (PASSO 1) E criou no Auth (PASSO 2).

### ❌ Utilizador não aparece na lista
**Solução:** Execute o SQL de verificação. Se não aparecer, execute novamente o INSERT.

### ❌ Permissões incorretas
**Solução:** O campo `profiles` no JSON define os perfis. Verifique se está correto no banco.

---

## 📈 Distribuição de Perfis

```
✅ Admin Sistema: 1 utilizador (PCA)
✅ Gestor: 4 utilizadores (PCE, Administrador, Director, Ministro, Planeamento)
✅ Utilizador Interno: 12 utilizadores (maioria dos departamentos)
✅ Financeiro: 1 utilizador (Financeiro)
✅ Operacional/Frota: 1 utilizador (Segurança)
✅ Utilizador Externo: 1 utilizador (Externo)
```

---

## ✨ Próximos Passos

Após criar todos os utilizadores:

1. ✅ **Teste o login** de cada perfil
2. ✅ **Verifique as permissões** (cada perfil deve ver apenas seus módulos)
3. ✅ **Teste os dashboards departamentais**
4. ✅ **Verifique os filtros** por departamento
5. ✅ **Teste a criação de dados** (actas, ofícios, facturas, frotas)

---

## 📝 Notas Importantes

- **Senha Padrão:** Todos os utilizadores usam `senha123` por padrão
- **Confirmação Automática:** Todos têm email confirmado automaticamente
- **Perfis Múltiplos:** Cada utilizador pode ter múltiplos perfis no array `profiles`
- **Roles Legacy:** O campo `role` (admin/attendant/user) é mantido para compatibilidade
- **Departamentos:** Organizados em 5 categorias conforme a estrutura do sistema

---

## 🎯 Objetivo Alcançado

✅ **23 utilizadores criados**  
✅ **Todos os 23 departamentos representados**  
✅ **Estrutura organizacional completa**  
✅ **Perfis distribuídos corretamente**  
✅ **Sistema pronto para testes em produção**

---

**Tempo Estimado:** 15-20 minutos  
**Dificuldade:** ⭐⭐ Média  
**Última Atualização:** Janeiro 2026
