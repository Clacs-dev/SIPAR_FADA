# 📚 Índice: Criação de Utilizadores Adicionais

Este índice organiza todos os ficheiros e recursos para adicionar os 3 novos utilizadores ao sistema.

---

## 🎯 Escolha Seu Caminho

### 🚀 **Quero fazer RÁPIDO (2 minutos)**
👉 Leia: [`/CREATE-USERS-QUICK.md`](/CREATE-USERS-QUICK.md)
- Instruções diretas e objetivas
- Copiar e colar SQL
- Criar contas manualmente

### 📖 **Quero o guia COMPLETO (passo a passo)**
👉 Leia: [`/GUIA-ADICIONAR-USUARIOS.md`](/GUIA-ADICIONAR-USUARIOS.md)
- Instruções detalhadas
- Explicações completas
- Troubleshooting
- Tabelas de referência

### 📊 **Quero entender o RESUMO técnico**
👉 Leia: [`/RESUMO-ADICIONAR-USUARIOS.md`](/RESUMO-ADICIONAR-USUARIOS.md)
- Arquivos criados
- Endpoints da API
- Estrutura técnica
- Checklist completo

---

## 📁 Ficheiros Criados

### **Migrations SQL**
- 📄 `/supabase/migrations/add-additional-users.sql`
  - Script SQL principal
  - Insere utilizadores na tabela
  - Mensagens de confirmação

### **Backend (Servidor)**
- 📄 `/supabase/functions/server/create-additional-users.tsx`
  - Serviço de criação automática
  - Funções: `createAdditionalUsers()`, `listAllUsers()`
  
- 📄 `/supabase/functions/server/index.tsx` (atualizado)
  - Rotas adicionadas:
    - `POST /create-additional-users`
    - `GET /list-all-users`

### **Frontend (React)**
- 📄 `/components/admin/create-additional-users.tsx`
  - Componente visual
  - Interface de criação
  - Listagem de utilizadores

### **Testes**
- 📄 `/test-create-users.html`
  - Página HTML standalone
  - Teste via browser
  - Login + Criação automática

### **Documentação**
- 📄 `/GUIA-ADICIONAR-USUARIOS.md` - Guia completo
- 📄 `/RESUMO-ADICIONAR-USUARIOS.md` - Resumo técnico
- 📄 `/CREATE-USERS-QUICK.md` - Guia rápido
- 📄 `/CRIAR-USUARIOS-INDEX.md` - Este ficheiro

---

## 👥 Utilizadores a Criar

### 1️⃣ **Gerente (João Gerente)**
```
Email:        gerente@sistema.ao
Senha padrão: gerente123
Role:         admin
Departamento: Gestão
Posição:      Gerente Geral
```

### 2️⃣ **Financeiro (Maria Financeira)**
```
Email:        financeiro@sistema.ao
Senha padrão: financeiro123
Role:         attendant
Departamento: Financeiro
Posição:      Responsável Financeiro
```

### 3️⃣ **Operador (Carlos Operador)**
```
Email:        operador@sistema.ao
Senha padrão: operador123
Role:         attendant
Departamento: Operações
Posição:      Operador de Frota
```

---

## 🛠️ Métodos de Implementação

### **Método 1: SQL Manual (Recomendado)**
1. Executar SQL no Supabase Dashboard
2. Criar contas no Authentication
3. Testar login

📖 **Guia**: `/CREATE-USERS-QUICK.md`

---

### **Método 2: Via API (Programático)**
1. Fazer login como admin
2. Chamar endpoint `POST /create-additional-users`
3. Verificar resposta

📖 **Documentação**: `/RESUMO-ADICIONAR-USUARIOS.md`

---

### **Método 3: Via Interface (Visual)**
1. Importar componente `CreateAdditionalUsers`
2. Adicionar ao painel admin
3. Clicar em "Criar Utilizadores"

📖 **Código**: `/components/admin/create-additional-users.tsx`

---

### **Método 4: Teste HTML (Standalone)**
1. Abrir `/test-create-users.html` no browser
2. Fazer login
3. Clicar no botão

📖 **Arquivo**: `/test-create-users.html`

---

## 📊 Estado do Sistema

### **Antes (3 utilizadores)**
1. ✅ admin@sistema.ao (Admin)
2. ✅ secretaria@sistema.ao (Atendente)
3. ✅ utente@sistema.ao (Utilizador)

### **Depois (6 utilizadores)**
1. ✅ admin@sistema.ao (Admin)
2. ✅ secretaria@sistema.ao (Atendente)
3. ✅ utente@sistema.ao (Utilizador)
4. 🆕 gerente@sistema.ao (Gerente)
5. 🆕 financeiro@sistema.ao (Financeiro)
6. 🆕 operador@sistema.ao (Operador)

---

## 🔗 Endpoints da API

### Criar Utilizadores
```http
POST /make-server-8b82752b/create-additional-users
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "created": [
    { "email": "gerente@sistema.ao", "name": "João Gerente", "role": "admin", "status": "created" },
    { "email": "financeiro@sistema.ao", "name": "Maria Financeira", "role": "attendant", "status": "created" },
    { "email": "operador@sistema.ao", "name": "Carlos Operador", "role": "attendant", "status": "created" }
  ],
  "errors": [],
  "message": "3 utilizadores criados com sucesso!"
}
```

---

### Listar Utilizadores
```http
GET /make-server-8b82752b/list-all-users
Authorization: Bearer <admin-token>
```

**Resposta:**
```json
{
  "success": true,
  "users": [
    {
      "id": "...",
      "email": "admin@sistema.ao",
      "name": "Administrador do Sistema",
      "role": "admin",
      "department": "Administração",
      "position": "Governador",
      "created_at": "2026-01-03T..."
    },
    ...
  ]
}
```

---

## ✅ Checklist de Implementação

Use esta checklist para acompanhar o progresso:

- [ ] Executar migration SQL
- [ ] Criar conta do Gerente no Auth
- [ ] Criar conta do Financeiro no Auth
- [ ] Criar conta do Operador no Auth
- [ ] Testar login do Gerente
- [ ] Testar login do Financeiro
- [ ] Testar login do Operador
- [ ] Verificar permissões de cada utilizador
- [ ] Documentar senhas (se necessário)

---

## 🆘 Ajuda e Suporte

### **Problema: Erro ao executar SQL**
📖 Solução: `/GUIA-ADICIONAR-USUARIOS.md` → Secção "Resolução de Problemas"

### **Problema: User not found ao fazer login**
📖 Solução: Certifique-se de ter criado a conta no Supabase Auth (PASSO 2)

### **Problema: Erro na API**
📖 Solução: Verifique os logs do servidor e `/RESUMO-ADICIONAR-USUARIOS.md`

### **Problema: Componente não funciona**
📖 Solução: Verifique se importou corretamente e tem permissões de admin

---

## 📚 Documentação Relacionada

- `/GUIA-CRIACAO-USUARIOS-REAIS.md` - Criar utilizadores reais (não demo)
- `/README-AUTHENTICATION.md` - Sistema de autenticação
- `/README-USER-REGISTRATION.md` - Registo de utilizadores
- `/GUIA-RESET-BANCO-DADOS.md` - Reset da base de dados

---

## 🎯 Próximos Passos Sugeridos

Depois de criar os utilizadores:

1. ✅ Testar login de cada utilizador
2. ✅ Verificar permissões e acessos
3. ✅ Configurar perfis personalizados (se necessário)
4. ✅ Treinar utilizadores no sistema
5. ✅ Monitorar logs de auditoria

---

## 📞 Contato e Feedback

Se encontrar problemas ou tiver sugestões:
- Revise a documentação completa
- Verifique os logs do servidor
- Consulte os guias de troubleshooting

---

**Última atualização:** 3 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
