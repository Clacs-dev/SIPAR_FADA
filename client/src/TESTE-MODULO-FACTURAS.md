# 🧪 TESTE RÁPIDO - MÓDULO DE FACTURAS

## ⚡ TESTE EM 5 MINUTOS

### **PASSO 1: Login como Financeiro**
```bash
Email: financeiro@sistema.ao
Senha: financeiro123
```

### **PASSO 2: Abrir Facturas**
```
1. Sidebar → "Facturas"
2. Ver Dashboard financeiro ✓
```

### **PASSO 3: Explorar Dashboard**
```
✓ Total Facturas: 18
✓ Valor Total: 12.500.000,00 AOA
✓ Total Pago: 7.800.000,00 AOA
✓ Total Pendente: 4.700.000,00 AOA

✓ Registadas: 3
✓ Em Validação: 4
✓ Aprovadas: 6
✓ Rejeitadas: 1
✓ Pagas: 4

✓ Alerta de vencidas: 2
✓ Top fornecedores (3 mostrados)
```

### **PASSO 4: Ver Detalhes**
```
1. Clicar tab "Todas"
2. Clicar em "FT/2026/001"
3. Ver informações completas ✓
4. Ver itens da factura ✓
5. Ver histórico (3 acções) ✓
6. Ver validação ✓
7. Ver aprovação ✓
```

### **PASSO 5: Testar Validação**
```
1. Voltar à lista
2. Clicar em "FT/2026/003" (Registada)
3. Clicar "Validar Factura"
4. Inserir comentário
5. Confirmar ✓
```

---

## 📋 CHECKLIST DE FUNCIONALIDADES

### **Dashboard**
- [ ] 4 cards principais (Total, Valor, Pago, Pendente)
- [ ] 5 cards de estados
- [ ] Alertas de vencidas
- [ ] Alertas a vencer
- [ ] Top fornecedores (5)

### **Lista de Facturas**
- [ ] Mostra 4 facturas
- [ ] Badges de status coloridos
- [ ] Valores formatados em AOA
- [ ] Informações fornecedor
- [ ] Data vencimento
- [ ] Número itens

### **Detalhes da Factura**
- [ ] Número interno e fornecedor
- [ ] Dados do fornecedor
- [ ] Datas (emissão, vencimento, recebimento)
- [ ] Itens com cálculos
- [ ] Totais (subtotal, IVA, total)
- [ ] Anexos (se houver)
- [ ] Histórico de ações
- [ ] Botões de ação na sidebar

### **Formulário**
- [ ] Selecção de fornecedor
- [ ] Campos de datas
- [ ] Selecção de moeda
- [ ] Adicionar múltiplos itens
- [ ] Cálculo automático de totais
- [ ] Upload de anexos
- [ ] Botão "Registar Factura"

### **Validação e Aprovação**
- [ ] Formulário inline de validação
- [ ] Formulário inline de aprovação
- [ ] Formulário inline de rejeição
- [ ] Formulário de pagamento
- [ ] Histórico actualizado
- [ ] Status actualizado

---

## 🎯 TESTES POR PERFIL

### **FINANCEIRO** 🟢
```bash
Login: financeiro@sistema.ao / financeiro123

✅ Deve ver:
├─ Dashboard completo
├─ Todas as facturas
├─ Botão "Nova Factura"
├─ Botão "Validar Factura"
├─ Botão "Aprovar Factura"
├─ Botão "Rejeitar Factura"
└─ Botão "Registar Pagamento"

✅ Acesso total ao módulo
```

### **GERENTE** 🟠
```bash
Login: gerente@sistema.ao / gerente123

✅ Deve ver:
├─ Dashboard completo
├─ Todas as facturas
├─ Botão "Aprovar Factura"
└─ Botão "Rejeitar Factura"

❌ NÃO deve ver:
├─ Botão "Nova Factura"
├─ Botão "Validar Factura"
└─ Botão "Registar Pagamento"
```

### **OPERADOR** 🟣
```bash
Login: operador@sistema.ao / operador123

❌ Acesso bloqueado
Mensagem: "Acesso Restrito - Módulo disponível
apenas para perfis Financeiro, Gerente e Admin"
```

### **ADMIN** 🔴
```bash
Login: admin@sistema.com / 123456

✅ Acesso total igual ao Financeiro
```

---

## 🔄 TESTE DE WORKFLOW COMPLETO

### **Teste 1: Ciclo Completo de Factura**

**1. Criar Factura (Financeiro)**
```
1. Login: financeiro@sistema.ao
2. Clicar "Nova Factura"
3. Seleccionar fornecedor: SONANGOL
4. Nº Fornecedor: TESTE-2026-001
5. Data Emissão: hoje
6. Data Vencimento: +30 dias
7. Adicionar item:
   - Descrição: Teste
   - Qtd: 1
   - Preço: 1000
   - IVA: 14%
8. Ver total calculado: 1.140,00 AOA
9. Clicar "Registar Factura"
10. Sucesso! ✓
```

**2. Validar (Financeiro)**
```
1. Abrir factura criada
2. Clicar "Validar Factura"
3. Comentário: "Valores OK"
4. Confirmar
5. Status: Registada → Em Validação ✓
6. Ver histórico actualizado ✓
```

**3. Aprovar (Gerente)**
```
1. Logout financeiro
2. Login: gerente@sistema.ao
3. Abrir mesma factura
4. Clicar "Aprovar Factura"
5. Comentário: "Aprovado"
6. Confirmar
7. Status: Em Validação → Aprovada ✓
```

**4. Pagar (Financeiro)**
```
1. Logout gerente
2. Login: financeiro@sistema.ao
3. Abrir mesma factura
4. Clicar "Registar Pagamento"
5. Método: Transferência Bancária
6. Referência: TESTE-001
7. Confirmar
8. Status: Aprovada → Paga ✓
9. Ver data pagamento ✓
```

---

## 🐛 POSSÍVEIS PROBLEMAS

### **Problema 1: Dashboard não carrega**
```
Solução: Verificar dados de stats no componente
```

### **Problema 2: Totais não calculam**
```
Solução: Verificar função calculateTotals() no form
```

### **Problema 3: Acesso bloqueado indevidamente**
```
Solução: Verificar permissões no componente main
```

### **Problema 4: Histórico vazio**
```
Solução: Verificar array historico nas facturas
```

---

## ✅ VALIDAÇÕES IMPORTANTES

### **Valores Financeiros:**
- [ ] Valores formatados em AOA
- [ ] Separador de milhares: ponto (.)
- [ ] Separador decimal: vírgula (,)
- [ ] 2 casas decimais sempre
- [ ] Cálculos correctos (subtotal + IVA)

### **Estados:**
- [ ] Cores correctas por status
- [ ] Workflow lógico respeitado
- [ ] Não permite saltar etapas
- [ ] Histórico completo

### **Permissões:**
- [ ] Financeiro: acesso total
- [ ] Gerente: apenas aprovação
- [ ] Operador: sem acesso
- [ ] Admin: acesso total

---

## 📸 SCREENSHOTS ESPERADOS

### **Dashboard:**
```
┌──────────────────────────────────┐
│ Total: 18    Valor: 12.5M AOA    │
│ Pago: 7.8M   Pendente: 4.7M      │
│                                  │
│ Registadas: 3  Em Validação: 4   │
│ Aprovadas: 6   Pagas: 4          │
│                                  │
│ ⚠️ Vencidas: 2                   │
│ 📅 A vencer: 5                   │
└──────────────────────────────────┘
```

### **Lista:**
```
FT/2026/001 [Aprovada] [AOA]
Fornecimento de combustível
SONANGOL • Vence: 10/02/2026
                    982.758,63 AOA
```

### **Detalhes:**
```
← FT/2026/001        [Download]
[Aprovada] [AOA] [✓ Integrado]

Fornecedor: SONANGOL
NIF: 5000000000
Total: 982.758,63 AOA

ITENS (1)
├─ Combustível - Gasóleo
└─ 5000 × 172,41 (IVA 14%)

HISTÓRICO (3)
├─ Registada (15/01)
├─ Validada (16/01)
└─ Aprovada (16/01)
```

---

## 🎉 SUCESSO!

Se você conseguiu:
- ✅ Ver o dashboard
- ✅ Navegar pelas tabs
- ✅ Ver detalhes de factura
- ✅ Ver cálculos de totais
- ✅ Ver histórico
- ✅ Testar validação

**Módulo está 100% funcional!** 💰

---

**PRÓXIMO:** Criar facturas reais e testar workflow completo! 🚀
