# 🧪 GUIA DE TESTE - 6 UTILIZADORES

## 🚀 INÍCIO RÁPIDO

1. **Abra a aplicação**
2. **Sistema inicializa automaticamente** (cria utilizadores + dados demo)
3. **Faça login com qualquer utilizador abaixo**
4. **Explore as funcionalidades específicas**

---

## 👥 TESTES POR UTILIZADOR

### 1️⃣ **ADMIN - ADMINISTRADOR DO SISTEMA**

```
📧 Email:    admin@sistema.com
🔑 Senha:    123456
```

**O QUE TESTAR:**

✅ **Dashboard**
- [ ] Ver TODAS as apresentações (de todos os utilizadores)
- [ ] Ver TODAS as audiências (de todos os utilizadores)
- [ ] Ver estatísticas globais do sistema

✅ **Gerenciar Solicitações**
- [ ] Aprovar/Rejeitar cartas de apresentação
- [ ] Aprovar/Rejeitar pedidos de audiência
- [ ] Delegar solicitações para outros admins

✅ **Agenda**
- [ ] Ver todas as reuniões agendadas
- [ ] Agendar novas reuniões
- [ ] Reagendar/Cancelar reuniões

✅ **Gestão de Utilizadores**
- [ ] Ver lista de todos os utilizadores
- [ ] Criar novos utilizadores
- [ ] Editar/Desativar utilizadores

✅ **Auditoria**
- [ ] Ver logs de todas as ações
- [ ] Exportar relatórios de auditoria
- [ ] Verificar tentativas de acesso

✅ **Base de Dados**
- [ ] Ver estatísticas da BD
- [ ] Fazer backup
- [ ] Limpar dados demo

**DADOS DEMO:**
- Vê todos os dados de todos os utilizadores

---

### 2️⃣ **GERENTE - JOÃO GERENTE** ⭐ NOVO

```
📧 Email:    gerente@sistema.ao
🔑 Senha:    gerente123
```

**O QUE TESTAR:**

✅ **Dashboard de Gestão**
- [ ] Ver KPIs da equipa (Taxa de aprovação: 85%)
- [ ] Ver total de solicitações (47 pedidos)
- [ ] Ver tempo médio de processamento (2.3 dias)
- [ ] Ver satisfação de clientes (4.6/5)
- [ ] Ver produtividade da equipa (92%)

✅ **Gerenciar Solicitações**
- [ ] Ver todas as solicitações do sistema
- [ ] Aprovar/Rejeitar pedidos
- [ ] Ver 12 pedidos pendentes
- [ ] Ver 28 pedidos aprovados
- [ ] Ver 7 pedidos rejeitados

✅ **Relatórios Gerenciais**
- [ ] Ver relatório semanal de solicitações
- [ ] Ver relatório mensal de desempenho
- [ ] Exportar relatórios em PDF/Excel

✅ **Reuniões Internas**
- [ ] Criar reuniões com a equipa
- [ ] Ver reuniões agendadas
- [ ] Editar/Cancelar reuniões

✅ **Análises e Tendências**
- [ ] Ver tendências de pedidos (+12%)
- [ ] Ver taxa de aprovação (+3%)
- [ ] Ver redução no tempo de processamento (-15%)
- [ ] Ver aumento na satisfação (+5%)

**DADOS DEMO:**
```
📊 Relatórios: 2 relatórios gerenciais
📈 KPIs: Estatísticas completas
👥 Equipa: 8 membros
📅 Tarefas: 156 completadas
```

---

### 3️⃣ **ATENDENTE - MARIA ATENDENTE**

```
📧 Email:    atendente@sistema.com
🔑 Senha:    123456
```

**O QUE TESTAR:**

✅ **Dashboard**
- [ ] Ver todas as solicitações do sistema
- [ ] Ver estatísticas gerais
- [ ] Ver solicitações pendentes

✅ **Processar Solicitações**
- [ ] Atualizar status de apresentações
- [ ] Atualizar status de audiências
- [ ] Adicionar notas/observações

✅ **Agendar Reuniões**
- [ ] Criar agendamento para audiência
- [ ] Escolher data/hora/local
- [ ] Enviar notificações aos participantes

✅ **Agenda**
- [ ] Ver 3 reuniões agendadas nos dados demo
- [ ] Audiência - Associação Empresarial (10:00)
- [ ] Apresentação - Tech Solutions (14:30)
- [ ] Reunião Equipa Semanal (09:00)

✅ **Mensagens**
- [ ] Enviar mensagens aos utilizadores
- [ ] Responder perguntas
- [ ] Ver histórico de comunicação

**DADOS DEMO:**
```
📅 Reuniões agendadas: 3
👥 Participantes totais: 16
🏢 Locais: Sala Principal, Sala 2, Sala Interna
```

---

### 4️⃣ **FINANCEIRO - MARIA FINANCEIRA** ⭐ NOVO

```
📧 Email:    financeiro@sistema.ao
🔑 Senha:    financeiro123
```

**O QUE TESTAR:**

✅ **Dashboard Financeiro**
- [ ] Ver facturas pendentes (1)
- [ ] Ver facturas pagas (1)
- [ ] Ver facturas atrasadas (1)
- [ ] Ver pagamentos aprovados (1)
- [ ] Ver pagamentos em processamento (1)

✅ **Gestão de Facturas**
- [ ] Ver FT 2026/001 - 250.000 AOA (pendente)
- [ ] Ver FT 2026/002 - 180.000 AOA (pago)
- [ ] Ver FT 2026/003 - 320.000 AOA (atrasado)
- [ ] Marcar factura como paga
- [ ] Exportar facturas em Excel

✅ **Gestão de Pagamentos**
- [ ] Ver PAG-2026-001 - 45.000 AOA (aprovado)
- [ ] Ver PAG-2026-002 - 95.000 AOA (processando)
- [ ] Aprovar novos pagamentos
- [ ] Ver histórico de pagamentos

✅ **Relatórios Financeiros**
- [ ] Ver receita total: 750.000 AOA
- [ ] Ver despesas totais: 420.000 AOA
- [ ] Ver saldo: 330.000 AOA
- [ ] Gerar relatório mensal
- [ ] Exportar para PDF

✅ **Análises Financeiras**
- [ ] Ver gráfico de receitas
- [ ] Ver gráfico de despesas
- [ ] Ver tendências mensais
- [ ] Ver previsões

**DADOS DEMO:**
```
💰 Facturas: 3 (total: 750.000 AOA)
💳 Pagamentos: 2 (total: 140.000 AOA)
📊 Saldo: +330.000 AOA
📈 Relatório: Janeiro 2026
```

---

### 5️⃣ **OPERADOR - CARLOS OPERADOR** ⭐ NOVO

```
📧 Email:    operador@sistema.ao
🔑 Senha:    operador123
```

**O QUE TESTAR:**

✅ **Dashboard de Frota**
- [ ] Ver total de veículos (3)
- [ ] Veículos disponíveis (1)
- [ ] Veículos em uso (1)
- [ ] Veículos em manutenção (1)
- [ ] Quilometragem total

✅ **Gestão de Veículos**
- [ ] **Toyota Hilux (LD-45-78-AB)**
  - Status: Disponível
  - Km: 15.420
  - Próxima manutenção: 12/02/2026
  
- [ ] **Hyundai Tucson (LD-32-15-CD)**
  - Status: Em uso (Secretaria)
  - Km: 8.750
  - Próxima manutenção: 18/01/2026
  
- [ ] **Mercedes Sprinter (LD-67-89-EF)**
  - Status: Manutenção
  - Km: 42.300
  - Motivo: Revisão programada

✅ **Gestão de Rotas**
- [ ] **Rota concluída:**
  - Veículo: Tucson
  - Data: Hoje
  - Origem: Sede - Luanda
  - Destino: Reunião - Talatona
  - Distância: 28 km
  
- [ ] **Rota agendada:**
  - Veículo: Hilux
  - Data: Amanhã
  - Destino: Audiência - Viana
  - Distância: 35 km

✅ **Manutenções**
- [ ] **Em andamento:**
  - Veículo: Sprinter
  - Tipo: Revisão programada
  - Custo: 85.000 AOA
  - Local: Oficina Central
  
- [ ] **Concluída:**
  - Veículo: Tucson
  - Tipo: Troca de pneus
  - Custo: 120.000 AOA

✅ **Coordenar com Agenda**
- [ ] Ver reuniões agendadas
- [ ] Planejar transporte
- [ ] Alocar veículos
- [ ] Calcular rotas

**DADOS DEMO:**
```
🚗 Veículos: 3 (1 Pickup, 1 SUV, 1 Van)
🛣️  Rotas: 2 (1 concluída, 1 agendada)
🔧 Manutenções: 2 (custo total: 205.000 AOA)
📊 Km total: 66.470 km
```

---

### 6️⃣ **UTILIZADOR EXTERNO - JOÃO USUÁRIO**

```
📧 Email:    usuario@empresa.com
🔑 Senha:    123456
```

**O QUE TESTAR:**

✅ **Dashboard Pessoal**
- [ ] Ver APENAS suas 2 apresentações
- [ ] Ver APENAS suas 2 audiências
- [ ] Ver APENAS suas estatísticas
- [ ] Título mostra "Minhas Apresentações" (não "Total de")

✅ **Minhas Apresentações**
- [ ] **Apresentação 1:**
  - Empresa: Empresa Comercial Luanda
  - Propósito: Fornecimento de equipamentos
  - Status: Pendente
  - Data criação: 01/01/2026
  
- [ ] **Apresentação 2:**
  - Empresa: Tech Solutions Angola
  - Propósito: Soluções tecnológicas
  - Status: Aceite pelo Admin
  - Data aceitação: 02/01/2026

✅ **Meus Pedidos de Audiência**
- [ ] **Audiência 1:**
  - Organização: Associação Empresarial
  - Propósito: Políticas de incentivo
  - Status: Pendente
  - Participantes: 5
  
- [ ] **Audiência 2:**
  - Organização: Sindicato Local
  - Propósito: Questões laborais
  - Status: Agendado
  - Data: 24/01/2026, 10:00
  - Local: Sala de Reuniões Principal
  - Participantes: 8

✅ **Criar Nova Solicitação**
- [ ] Criar nova carta de apresentação
- [ ] Criar novo pedido de audiência
- [ ] Preencher todos os campos
- [ ] Submeter solicitação

✅ **Notificações**
- [ ] Ver notificação: "Pedido Aceite" (não lida)
- [ ] Ver notificação: "Reunião Agendada para 24/01" (não lida)
- [ ] Ver notificação: "Documentação Pendente" (lida)
- [ ] Marcar como lida

✅ **Mensagens**
- [ ] Enviar mensagem para atendentes
- [ ] Ver respostas
- [ ] Acompanhar status do pedido

**DADOS DEMO:**
```
📝 Apresentações: 2 (1 pendente, 1 aceite)
👥 Audiências: 2 (1 pendente, 1 agendada)
🔔 Notificações: 3 (2 não lidas)
📅 Reuniões: 1 agendada
```

**IMPORTANTE TESTAR:**
- [ ] Verificar que NÃO vê dados de outros utilizadores
- [ ] Verificar que NÃO tem acesso a menus de admin
- [ ] Verificar que só pode editar suas próprias solicitações

---

## ✅ CHECKLIST GERAL DE TESTES

### **Para Cada Utilizador:**

- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Dados demo aparecem
- [ ] Permissões estão corretas
- [ ] Menus apropriados visíveis
- [ ] Funcionalidades específicas funcionam
- [ ] Não vê dados que não deveria
- [ ] Logout funciona

---

## 🔍 COMO VERIFICAR PERMISSÕES

### **Método 1: Via Browser Console**

```javascript
// Após login, no console do navegador
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/permissions/${userId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(r => r.json())
.then(data => console.table(data.permissions.permissions));
```

### **Método 2: Via Dados Demo**

```javascript
// Ver dados demo do utilizador logado
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8b82752b/demo-data/${userId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(r => r.json())
.then(data => console.log(data.data));
```

---

## 📊 MATRIZ DE TESTES

| Funcionalidade | Admin | Gerente | Atendente | Financeiro | Operador | Utilizador |
|----------------|-------|---------|-----------|------------|----------|------------|
| Ver todos os pedidos | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Aprovar pedidos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Criar utilizadores | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestão financeira | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Gestão de frota | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Agendar reuniões | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Criar pedidos | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Ver relatórios | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Auditoria | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Base de dados | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🎯 CENÁRIOS DE TESTE RECOMENDADOS

### **Cenário 1: Fluxo Completo de Pedido**

1. Login como **Utilizador** → Criar pedido de audiência
2. Login como **Atendente** → Ver pedido pendente
3. Login como **Gerente** → Aprovar pedido
4. Login como **Atendente** → Agendar reunião
5. Login como **Operador** → Alocar veículo para transporte
6. Login como **Utilizador** → Receber notificação de agendamento

### **Cenário 2: Gestão Financeira**

1. Login como **Financeiro** → Ver factura atrasada
2. Marcar factura como paga
3. Aprovar pagamento pendente
4. Gerar relatório mensal
5. Exportar para Excel

### **Cenário 3: Gestão de Frota**

1. Login como **Operador** → Ver veículo em manutenção
2. Registar conclusão de manutenção
3. Alocar veículo para nova rota
4. Registar quilometragem
5. Agendar próxima manutenção

### **Cenário 4: Análise de Gestão**

1. Login como **Gerente** → Ver KPIs
2. Analisar tendências (redução de -15% no tempo)
3. Ver taxa de aprovação (85%)
4. Gerar relatório semanal
5. Exportar estatísticas

---

## 🆘 PROBLEMAS COMUNS

### **Problema: Não vejo dados demo**

**Solução:**
```javascript
// Reinicializar dados demo (apenas admin)
POST /make-server-8b82752b/demo-data/reinitialize
```

### **Problema: Permissões não funcionam**

**Solução:**
- Verificar se fez logout/login após criar utilizadores
- Limpar cache do navegador
- Verificar token de autenticação

### **Problema: Vejo dados de outros utilizadores**

**Solução:**
- Isso é normal para Admin e Gerente
- Utilizador externo só deve ver próprios dados
- Verificar role correto no perfil

---

## 📝 NOTAS FINAIS

- ✅ Todos os dados são gerados automaticamente
- ✅ Seguro para testar (não afeta dados reais)
- ✅ Pode limpar e reinicializar a qualquer momento
- ✅ Dados realistas e úteis para demonstrações

---

**Data:** 3 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para testar
