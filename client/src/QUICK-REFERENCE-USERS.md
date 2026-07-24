# 📋 Referência Rápida - Todos os Utilizadores do Sistema

## 👥 LISTA COMPLETA DE UTILIZADORES (6 TOTAL)

---

### 1️⃣ ADMINISTRADOR DO SISTEMA
```
📧 Email:     admin@sistema.ao
🔑 Senha:     [definida por si]
👤 Nome:      Administrador do Sistema
🎭 Role:      admin
🏢 Depto:     Administração
📍 Posição:   Governador
🆔 ID:        00000000-0000-0000-0000-000000000001

✅ PERMISSÕES:
   • Acesso total ao sistema
   • Criar/editar/excluir utilizadores
   • Aprovar/rejeitar pedidos
   • Gestão completa
   • Ver auditoria
```

---

### 2️⃣ SECRETÁRIA ADMINISTRATIVA
```
📧 Email:     secretaria@sistema.ao
🔑 Senha:     [definida por si]
👤 Nome:      Secretária Administrativa
🎭 Role:      attendant
🏢 Depto:     Secretaria
📍 Posição:   Assistente Administrativa
🆔 ID:        00000000-0000-0000-0000-000000000002

✅ PERMISSÕES:
   • Gerir solicitações
   • Agendar reuniões
   • Ver pedidos
   • Processar audiências
   • Enviar mensagens
```

---

### 3️⃣ UTILIZADOR TESTE (UTENTE)
```
📧 Email:     utente@sistema.ao
🔑 Senha:     [definida por si]
👤 Nome:      Utilizador Teste
🎭 Role:      user
🏢 Depto:     Externo
📍 Posição:   Utente
🆔 ID:        00000000-0000-0000-0000-000000000003

✅ PERMISSÕES:
   • Submeter pedidos
   • Ver próprias solicitações
   • Receber notificações
   • Participar em reuniões agendadas
```

---

### 4️⃣ GERENTE ⭐ NOVO
```
📧 Email:     gerente@sistema.ao
🔑 Senha:     gerente123
👤 Nome:      João Gerente
🎭 Role:      admin
🏢 Depto:     Gestão
📍 Posição:   Gerente Geral
🆔 ID:        00000000-0000-0000-0000-000000000004

✅ PERMISSÕES:
   • Acesso total ao sistema
   • Gestão de utilizadores
   • Aprovação de pedidos
   • Gestão de reuniões
   • Relatórios e analytics
   • Ver auditoria completa
```

---

### 5️⃣ FINANCEIRO ⭐ NOVO
```
📧 Email:     financeiro@sistema.ao
🔑 Senha:     financeiro123
👤 Nome:      Maria Financeira
🎭 Role:      attendant
🏢 Depto:     Financeiro
📍 Posição:   Responsável Financeiro
🆔 ID:        00000000-0000-0000-0000-000000000005

✅ PERMISSÕES:
   • Gerir solicitações
   • Criar reuniões
   • Processar pedidos
   • Acesso ao módulo financeiro
   • Relatórios financeiros
```

---

### 6️⃣ OPERADOR ⭐ NOVO
```
📧 Email:     operador@sistema.ao
🔑 Senha:     operador123
👤 Nome:      Carlos Operador
🎭 Role:      attendant
🏢 Depto:     Operações
📍 Posição:   Operador de Frota
🆔 ID:        00000000-0000-0000-0000-000000000006

✅ PERMISSÕES:
   • Gerir solicitações
   • Criar reuniões
   • Processar pedidos
   • Gestão de frota
   • Logística operacional
```

---

## 📊 RESUMO POR ROLE

### 👑 Administradores (admin) - 2 utilizadores
1. admin@sistema.ao - Administrador do Sistema
2. gerente@sistema.ao - João Gerente

**Permissões:**
- ✅ Acesso total
- ✅ Criar utilizadores
- ✅ Aprovar/rejeitar
- ✅ Configurações do sistema

---

### 👔 Atendentes (attendant) - 3 utilizadores
1. secretaria@sistema.ao - Secretária Administrativa
2. financeiro@sistema.ao - Maria Financeira
3. operador@sistema.ao - Carlos Operador

**Permissões:**
- ✅ Gerir solicitações
- ✅ Criar reuniões
- ✅ Processar pedidos
- ⛔ Não podem criar utilizadores

---

### 👤 Utilizadores (user) - 1 utilizador
1. utente@sistema.ao - Utilizador Teste

**Permissões:**
- ✅ Submeter pedidos
- ✅ Ver próprias solicitações
- ⛔ Sem acesso administrativo

---

## 🏢 RESUMO POR DEPARTAMENTO

| Departamento | Utilizadores | Emails |
|--------------|-------------|--------|
| **Administração** | 1 | admin@sistema.ao |
| **Secretaria** | 1 | secretaria@sistema.ao |
| **Gestão** | 1 | gerente@sistema.ao ⭐ |
| **Financeiro** | 1 | financeiro@sistema.ao ⭐ |
| **Operações** | 1 | operador@sistema.ao ⭐ |
| **Externo** | 1 | utente@sistema.ao |
| **TOTAL** | **6** | |

---

## 🔑 CREDENCIAIS PADRÃO (Novos Utilizadores)

```bash
# GERENTE
Email: gerente@sistema.ao
Senha: gerente123
Role:  admin

# FINANCEIRO
Email: financeiro@sistema.ao
Senha: financeiro123
Role:  attendant

# OPERADOR
Email: operador@sistema.ao
Senha: operador123
Role:  attendant
```

⚠️ **IMPORTANTE:** Altere as senhas padrão após o primeiro login!

---

## 🎯 CASOS DE USO

### Testar Fluxo Completo de Pedido
1. **Login como Utente** (utente@sistema.ao)
   → Submeter pedido de audiência

2. **Login como Secretária** (secretaria@sistema.ao)
   → Processar e agendar pedido

3. **Login como Gerente** (gerente@sistema.ao)
   → Aprovar e monitorar pedido

---

### Testar Gestão Financeira
1. **Login como Financeiro** (financeiro@sistema.ao)
   → Gerir pedidos relacionados a finanças

2. **Login como Gerente** (gerente@sistema.ao)
   → Aprovar decisões financeiras

---

### Testar Gestão Operacional
1. **Login como Operador** (operador@sistema.ao)
   → Gerir logística e frota

2. **Login como Gerente** (gerente@sistema.ao)
   → Supervisionar operações

---

## 🔄 FLUXO DE APROVAÇÃO

```
UTENTE (user)
    ↓ submete pedido
SECRETÁRIA (attendant)
    ↓ processa e agenda
GERENTE (admin)
    ↓ aprova final
✅ PEDIDO CONCLUÍDO
```

---

## 📱 TESTE RÁPIDO

### Passo 1: Login de Teste
```bash
1. Abra a aplicação
2. Teste cada credencial:
   ✓ gerente@sistema.ao / gerente123
   ✓ financeiro@sistema.ao / financeiro123
   ✓ operador@sistema.ao / operador123
```

### Passo 2: Verificar Permissões
```bash
• Gerente deve ver: Painel completo + Gestão de utilizadores
• Financeiro deve ver: Painel + Gestão de solicitações
• Operador deve ver: Painel + Gestão de solicitações
```

---

## 🔍 VERIFICAÇÃO SQL

Execute para ver todos os utilizadores:

```sql
SELECT 
  email,
  name,
  role,
  department,
  position,
  created_at
FROM users
ORDER BY created_at;
```

---

## 📞 MATRIZ DE CONTACTOS

| Nome | Email | Departamento | Extensão |
|------|-------|--------------|----------|
| Administrador | admin@sistema.ao | Administração | 1001 |
| Secretária | secretaria@sistema.ao | Secretaria | 1002 |
| João Gerente | gerente@sistema.ao | Gestão | 1003 |
| Maria Financeira | financeiro@sistema.ao | Financeiro | 1004 |
| Carlos Operador | operador@sistema.ao | Operações | 1005 |
| Utente Teste | utente@sistema.ao | Externo | - |

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] 6 utilizadores existem na tabela `users`
- [ ] 6 contas criadas no Supabase Auth
- [ ] Login funcional para cada utilizador
- [ ] Permissões corretas por role
- [ ] Senhas documentadas (ou alteradas)
- [ ] Departamentos configurados
- [ ] Sistema testado end-to-end

---

## 🎉 SISTEMA PRONTO!

Agora tem um sistema completo com:
- ✅ 2 Administradores
- ✅ 3 Atendentes (diferentes áreas)
- ✅ 1 Utilizador externo

**Total: 6 utilizadores** prontos para testar todos os cenários!

---

**Última atualização:** 3 de Janeiro de 2026  
**Versão do Sistema:** 2.0  
**Status:** ✅ Operacional
