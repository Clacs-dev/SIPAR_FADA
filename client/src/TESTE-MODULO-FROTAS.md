# 🧪 TESTE RÁPIDO - MÓDULO DE FROTAS

## ⚡ TESTE EM 5 MINUTOS

### **PASSO 1: Login como Operador**
```bash
Email: operador@sistema.ao
Senha: operador123
```

### **PASSO 2: Abrir Frotas**
```
1. Sidebar → "Frotas"
2. Ver Dashboard da frota ✓
```

### **PASSO 3: Explorar Dashboard**
```
✓ Total: 12 viaturas
✓ Disponíveis: 7
✓ Em Uso: 3
✓ Em Manutenção: 1
✓ Inativas: 1

✓ KM Mensal: 8.540 km
✓ Utilizações: 45
✓ Manutenções: 3

✓ Custo Total: 850.000 AOA
✓ Alertas de documentação
✓ Top viaturas utilizadas
✓ Utilização por tipo
```

### **PASSO 4: Ver Viatura**
```
1. Clicar tab "Viaturas"
2. Clicar em "LD-12-AB-34"
3. Ver informações completas ✓
4. Ver kilometragem ✓
5. Ver custos acumulados ✓
6. Ver documentação ✓
7. Ver alerta de revisão ✓
```

### **PASSO 5: Explorar Tabs**
```
1. Tab "Utilizações" → Ver 2 registos ✓
2. Tab "Manutenções" → Ver 1 registo ✓
3. Tab "Relatórios" → Em desenvolvimento ✓
```

---

## 📋 CHECKLIST DE FUNCIONALIDADES

### **Dashboard**
- [ ] 5 cards de estados (Total, Disponíveis, Em Uso, Em Manutenção, Inativas)
- [ ] 3 cards de operações (KM, Utilizações, Custos)
- [ ] Distribuição de custos
- [ ] Alertas de documentação
- [ ] Utilização por tipo
- [ ] Top viaturas utilizadas

### **Lista de Viaturas**
- [ ] Mostra 4 viaturas
- [ ] Cards com informações
- [ ] Badges de status coloridos
- [ ] Tipos de viatura
- [ ] Kilometragem
- [ ] Combustível
- [ ] Motorista (se em uso)

### **Detalhes da Viatura**
- [ ] Todas as informações
- [ ] Badges de estado
- [ ] Alertas (seguro/inspecção/revisão)
- [ ] Kilometragem actual e próxima revisão
- [ ] Custos acumulados
- [ ] Últimas utilizações
- [ ] Histórico de manutenções
- [ ] Documentação
- [ ] Botões de ação

### **Formulário de Viatura**
- [ ] Identificação (matrícula, chassis, marca, modelo, ano)
- [ ] Características (tipo, combustível, cor, lugares, cilindrada)
- [ ] Kilometragem (actual, próxima revisão)
- [ ] Documentação (seguro, inspecção)
- [ ] Upload de documentos
- [ ] Observações
- [ ] Botão "Registar Viatura"

---

## 🎯 TESTES POR PERFIL

### **OPERADOR** 🟣
```bash
Login: operador@sistema.ao / operador123

✅ Deve ver:
├─ Dashboard completo
├─ Todas as viaturas
├─ Botão "Nova Viatura"
├─ Botão "Nova Utilização"
├─ Botão "Nova Manutenção"
├─ Todas as utilizações
└─ Todas as manutenções

✅ Acesso total à gestão diária
```

### **GERENTE** 🟠
```bash
Login: gerente@sistema.ao / gerente123

✅ Deve ver:
├─ Dashboard completo
├─ Todas as viaturas
├─ Todas as utilizações
├─ Todas as manutenções
└─ Relatórios

❌ NÃO deve ver:
├─ Botão "Nova Viatura"
├─ Botão "Editar"
├─ Botão "Nova Utilização"
└─ Botão "Nova Manutenção"

(Apenas supervisão)
```

### **ATENDENTE** 🔵
```bash
Login: atendente@sistema.ao / atendente123

❌ Acesso bloqueado
Mensagem: "Acesso Restrito - Módulo disponível
apenas para perfis Operador, Gerente e Admin"
```

### **ADMIN** 🔴
```bash
Login: admin@sistema.com / 123456

✅ Acesso total igual ao Operador
```

---

## 🔄 TESTE DE FUNCIONALIDADES

### **Teste 1: Ver Viatura com Alertas**

**Viatura com alertas múltiplos:**
```
1. Login: operador@sistema.ao
2. Abrir "Viaturas"
3. Clicar "LD-78-GH-90"
4. Verificar alertas:
   ⚠️ Seguro vence: 30/11/2025
   ⚠️ Inspecção vence: 15/10/2025
5. Badges vermelhos visíveis ✓
6. Card de alerta no topo ✓
```

### **Teste 2: Ver Viatura em Uso**

**Viatura actualmente em circulação:**
```
1. Abrir "Viaturas"
2. Clicar "LD-34-CD-56"
3. Verificar:
   Status: [Em Uso] (azul) ✓
   Motorista: Carlos Silva ✓
   Localização: Ministério das Finanças ✓
4. Botão "Nova Utilização" não visível ✓
   (Porque já está em uso)
```

### **Teste 3: Ver Viatura em Manutenção**

**Viatura na oficina:**
```
1. Abrir "Viaturas"
2. Clicar "LD-56-EF-78"
3. Verificar:
   Status: [Em Manutenção] (amarelo) ✓
   Observações: "Manutenção preventiva..." ✓
4. Tab "Manutenções" → Ver 1 registo ✓
   Tipo: Preventiva
   Oficina: Auto Mecânica Central
   Custo: 130.000,00 AOA
```

### **Teste 4: Utilização Concluída**

**Ver histórico de viagem:**
```
1. Abrir "Viaturas"
2. Clicar "LD-12-AB-34"
3. Ver "Últimas Utilizações"
4. Verificar registo:
   Destino: Ministério das Finanças ✓
   Motorista: Carlos Silva ✓
   Data: 18/01/2026 ✓
   KM Percorridos: 200 km ✓
   Status: [Concluída] ✓
```

### **Teste 5: Dashboard - Top Viaturas**

**Viaturas mais utilizadas:**
```
1. Tab "Dashboard"
2. Scroll até "Top Viaturas"
3. Verificar ranking:
   1º LD-12-AB-34: 12 viagens, 1.850 km ✓
   2º LD-34-CD-56: 10 viagens, 1.620 km ✓
   3º LD-56-EF-78: 8 viagens, 1.340 km ✓
```

---

## 📊 VERIFICAR CÁLCULOS

### **Cálculos Automáticos:**

**Utilizações:**
```
KM Saída: 45.000 km
KM Chegada: 45.200 km
→ KM Percorridos: 200 km ✓ (calculado)
```

**Manutenções:**
```
Mão de Obra: 50.000 AOA
Peças: 80.000 AOA
→ Total: 130.000 AOA ✓ (calculado)
```

**Custos Acumulados (Viatura):**
```
Combustível: 2.500.000 AOA
Manutenção: 850.000 AOA
→ Total Gasto: 3.350.000 AOA ✓
```

---

## 🎨 VERIFICAR ELEMENTOS VISUAIS

### **Badges de Status:**
- [ ] Disponível: Verde (bg-green-500)
- [ ] Em Uso: Azul (bg-blue-500)
- [ ] Em Manutenção: Amarelo (bg-yellow-500)
- [ ] Inativa: Cinza (bg-gray-500)

### **Alertas:**
- [ ] Seguro vencido: Vermelho
- [ ] Inspecção vencida: Vermelho
- [ ] Revisão próxima: Amarelo
- [ ] Todos em dia: Verde

### **Cards:**
- [ ] Hover effect
- [ ] Informações organizadas
- [ ] Ícones adequados
- [ ] Valores formatados

---

## 🐛 POSSÍVEIS PROBLEMAS

### **Problema 1: Dashboard não carrega**
```
Solução: Verificar dados de stats no componente
```

### **Problema 2: Alertas não aparecem**
```
Solução: Verificar datas de seguro/inspecção
e cálculo de revisão próxima
```

### **Problema 3: Acesso bloqueado indevidamente**
```
Solução: Verificar permissões no componente main
(Operador, Gerente, Admin têm acesso)
```

### **Problema 4: Cards de viatura não clicáveis**
```
Solução: Verificar onClick no Card
```

---

## ✅ VALIDAÇÕES IMPORTANTES

### **Estados:**
- [ ] Disponível: Verde ✓
- [ ] Em Uso: Azul ✓
- [ ] Em Manutenção: Amarelo ✓
- [ ] Inativa: Cinza ✓

### **Kilometragem:**
- [ ] Formatação com separador de milhares
- [ ] Sufixo "km"
- [ ] Valores realistas

### **Valores Monetários:**
- [ ] Formatação em AOA
- [ ] Separador de milhares: ponto (.)
- [ ] Separador decimal: vírgula (,)
- [ ] 2 casas decimais

### **Datas:**
- [ ] Formato: DD/MM/AAAA
- [ ] Alertas de vencimento funcionando
- [ ] Cores corretas (vermelho/amarelo)

---

## 📸 SCREENSHOTS ESPERADOS

### **Dashboard:**
```
┌──────────────────────────────────┐
│ Total: 12   Disponíveis: 7       │
│ Em Uso: 3   Em Manutenção: 1     │
│ Inativas: 1                      │
│                                  │
│ KM Mensal: 8.540 km              │
│ Utilizações: 45                  │
│ Custo: 850.000 AOA               │
│                                  │
│ ⚠️ 2 seguros a vencer            │
│ ⚠️ 1 inspecção a vencer          │
└──────────────────────────────────┘
```

### **Lista:**
```
[Disponível] [SUV]           🚗
LD-12-AB-34
Toyota Land Cruiser (2022)
Kilometragem: 45.200 km
Combustível: Diesel
```

### **Detalhes:**
```
← LD-12-AB-34      [Editar] [Nova Utilização]
[Disponível] [SUV] [Diesel] [Nova Manutenção]

⚠️ Revisão próxima: 50.000 km

INFORMAÇÕES DA VIATURA
Matrícula: LD-12-AB-34
Marca: Toyota • Modelo: Land Cruiser
Ano: 2022

CUSTOS ACUMULADOS
Combustível: 2.500.000,00 AOA
Manutenção: 850.000,00 AOA
```

---

## 🎉 SUCESSO!

Se você conseguiu:
- ✅ Ver o dashboard completo
- ✅ Navegar pelas viaturas
- ✅ Ver detalhes de viatura
- ✅ Ver alertas funcionando
- ✅ Ver utilizações e manutenções
- ✅ Verificar cálculos

**Módulo está 100% funcional!** 🚗

---

**SISTEMA COMPLETO COM 3 MÓDULOS:**
1. ✅ Ofícios
2. ✅ Facturas  
3. ✅ Frotas

**PRÓXIMO:** Criar novos registos e testar workflows! 🚀
