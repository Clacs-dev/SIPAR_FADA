# ✅ MÓDULO DE FROTAS - IMPLEMENTAÇÃO COMPLETA

## 🎯 OBJETIVO

Controlar e gerir **viaturas institucionais** com:
- ✅ Registo completo de viaturas
- ✅ Controlo de utilizações
- ✅ Gestão de manutenções
- ✅ Monitorização de custos
- ✅ Alertas de documentação
- ✅ Histórico total

---

## 📋 FUNCIONALIDADES IMPLEMENTADAS

### **1. Dashboard da Frota**
```
┌─────────────────────────────────────────────────┐
│ 🚗 DASHBOARD DA FROTA                           │
├─────────────────────────────────────────────────┤
│ Total: 12 viaturas                              │
│ Disponíveis: 7 (verde)                          │
│ Em Uso: 3 (azul)                                │
│ Em Manutenção: 1 (amarelo)                      │
│ Inativas: 1 (cinza)                             │
│                                                 │
│ OPERAÇÕES DO MÊS:                               │
│ ├─ KM Percorridos: 8.540 km                    │
│ ├─ Utilizações: 45                              │
│ └─ Manutenções: 3                               │
│                                                 │
│ CUSTOS DO MÊS:                                  │
│ ├─ Total: 850.000,00 AOA                       │
│ ├─ Combustível: 650.000,00 AOA                 │
│ └─ Manutenção: 200.000,00 AOA                  │
│                                                 │
│ ALERTAS:                                        │
│ ├─ ⚠️ 2 seguro(s) a vencer                     │
│ ├─ ⚠️ 1 inspecção(ões) a vencer                │
│ └─ ⚠️ 3 revisão(ões) próximas                  │
│                                                 │
│ UTILIZAÇÃO POR TIPO:                            │
│ 1. SUV: 5 viaturas - 4.200 km                  │
│ 2. Ligeiro: 4 viaturas - 2.800 km              │
│ 3. Carrinha: 3 viaturas - 1.540 km             │
│                                                 │
│ TOP 3 VIATURAS MAIS UTILIZADAS:                 │
│ 1. LD-12-AB-34: 12 viagens - 1.850 km          │
│ 2. LD-34-CD-56: 10 viagens - 1.620 km          │
│ 3. LD-56-EF-78: 8 viagens - 1.340 km           │
└─────────────────────────────────────────────────┘
```

### **2. Estados da Viatura**
```
DISPONÍVEL → EM USO → DISPONÍVEL
    🟢        🔵        🟢
              ↓
       EM MANUTENÇÃO
            🟡
              ↓
          INATIVA
            ⚪
```

| Estado | Descrição | Ações Disponíveis |
|--------|-----------|-------------------|
| **Disponível** | Pronta para uso | Nova Utilização, Manutenção |
| **Em Uso** | Em circulação | Ver utilização actual |
| **Em Manutenção** | Na oficina | Ver manutenção, Agendar recolha |
| **Inativa** | Fora de serviço | Reactivar |

### **3. Registo de Viaturas**

#### **Identificação:**
```
Matrícula: LD-12-AB-34
Chassis: JTE12345678901234
Marca: Toyota
Modelo: Land Cruiser
Ano: 2022
```

#### **Características:**
```
Tipo: SUV
Combustível: Diesel
Cor: Branco
Lugares: 7
Cilindrada: 4.5L
```

#### **Kilometragem:**
```
KM Actual: 45.200 km
Próxima Revisão: 50.000 km
Diferença: 4.800 km restantes
```

#### **Documentação:**
```
Seguro: 31/12/2026 ✓
Inspecção: 30/06/2026 ✓
Livrete: [PDF]
Seguro: [PDF]
```

#### **Custos:**
```
Aquisição: 45.000.000,00 AOA
Combustível (total): 2.500.000,00 AOA
Manutenção (total): 850.000,00 AOA
Total Gasto: 3.350.000,00 AOA
```

### **4. Registo de Motoristas**
```
Motorista 1:
├─ Nome: Carlos Silva
├─ Carta: LD123456
├─ Validade: 31/12/2027
├─ Telefone: +244 923 456 789
└─ Departamento: Operações

Motorista 2:
├─ Nome: Pedro Santos
├─ Carta: LD234567
├─ Validade: 15/08/2026
├─ Telefone: +244 923 567 890
└─ Departamento: Administração
```

### **5. Registo de Utilizações**

#### **Nova Utilização:**
```
┌────────────────────────────────────────────┐
│ NOVA UTILIZAÇÃO                            │
├────────────────────────────────────────────┤
│ Viatura: [LD-12-AB-34 - Toyota Land Cruiser]│
│ Motorista: [Carlos Silva ▼]               │
│                                            │
│ SAÍDA:                                     │
│ Data: [18/01/2026]  Hora: [08:30]         │
│ KM Saída: [45000_______]                  │
│                                            │
│ DESTINO:                                   │
│ Local: [Ministério das Finanças_______]   │
│ Finalidade: [Reunião orçamental_______]   │
│                                            │
│ Passageiros (opcional):                    │
│ [João Silva, Maria Costa___________]      │
│                                            │
│           [Cancelar] [Registar Saída]     │
└────────────────────────────────────────────┘
```

#### **Finalizar Utilização:**
```
┌────────────────────────────────────────────┐
│ FINALIZAR UTILIZAÇÃO                       │
├────────────────────────────────────────────┤
│ Viatura: LD-12-AB-34                       │
│ Motorista: Carlos Silva                    │
│ Destino: Ministério das Finanças           │
│                                            │
│ Saída: 18/01/2026 08:30 - KM: 45.000      │
│                                            │
│ CHEGADA:                                   │
│ Data: [18/01/2026]  Hora: [17:45]         │
│ KM Chegada: [45200_______]                │
│ KM Percorridos: 200 km (calculado)        │
│                                            │
│ COMBUSTÍVEL:                               │
│ Litros: [25_____]                          │
│ Custo: [8750,00__] AOA                    │
│                                            │
│ Observações:                               │
│ [Tudo normal. Sem ocorrências._______]   │
│                                            │
│         [Cancelar] [Finalizar]            │
└────────────────────────────────────────────┘
```

### **6. Registo de Manutenção**

#### **Nova Manutenção:**
```
┌────────────────────────────────────────────┐
│ NOVA MANUTENÇÃO                            │
├────────────────────────────────────────────┤
│ Viatura: [LD-56-EF-78 - Toyota Hilux ▼]  │
│                                            │
│ TIPO DE MANUTENÇÃO:                        │
│ [● Preventiva ○ Corretiva                 │
│  ○ Revisão    ○ Inspecção]                │
│                                            │
│ DATAS:                                     │
│ Entrada: [18/01/2026]                     │
│ Previsão Saída: [20/01/2026]              │
│ KM Actual: [25300_______]                 │
│                                            │
│ OFICINA:                                   │
│ Nome: [Auto Mecânica Central_______]      │
│ Responsável: [João Mecânico_______]       │
│ Telefone: [+244 222 333 444_______]       │
│                                            │
│ DESCRIÇÃO:                                 │
│ [Revisão dos 25.000 km_______________]    │
│                                            │
│ SERVIÇOS:                     [+ Adicionar]│
│ 1. Mudança de óleo e filtros - 85.000 AOA│
│ 2. Verificação de travões - 45.000 AOA   │
│                                            │
│ CUSTOS:                                    │
│ Mão de Obra: [50000____] AOA              │
│ Peças: [80000____] AOA                    │
│ Total: 130.000,00 AOA (calculado)         │
│                                            │
│ Anexos: [Upload orçamento/factura]        │
│                                            │
│        [Cancelar] [Registar Manutenção]   │
└────────────────────────────────────────────┘
```

### **7. Tipos de Manutenção**

```
PREVENTIVA:
├─ Revisões programadas
├─ Mudança de óleo
├─ Verificação de fluidos
└─ Inspeções periódicas

CORRETIVA:
├─ Reparação de avarias
├─ Substituição de peças
└─ Resolução de problemas

REVISÃO:
├─ Revisão completa
├─ Diagnóstico geral
└─ Verificação de todos os sistemas

INSPECÇÃO:
├─ Inspecção técnica oficial
├─ Teste de emissões
└─ Verificação de segurança
```

### **8. Alertas Automáticos**

```
⚠️ SEGURO A VENCER (2 viaturas)
├─ LD-78-GH-90: Vence em 30/11/2025 (7 meses)
└─ LD-34-CD-56: Vence em 15/03/2026 (2 meses)

⚠️ INSPECÇÃO A VENCER (1 viatura)
├─ LD-78-GH-90: Vence em 15/10/2025 (5 meses)

⚠️ REVISÃO PRÓXIMA (3 viaturas)
├─ LD-12-AB-34: 45.200 km (próxima: 50.000)
├─ LD-34-CD-56: 38.500 km (próxima: 40.000)
└─ LD-78-GH-90: 82.000 km (próxima: 85.000)
```

### **9. Relatórios**

#### **Utilização por Tipo:**
```
┌──────────────────────────────────┐
│ SUV (5 viaturas)                 │
│ █████████████████ 4.200 km       │
├──────────────────────────────────┤
│ Ligeiro (4 viaturas)             │
│ ████████████ 2.800 km            │
├──────────────────────────────────┤
│ Carrinha (3 viaturas)            │
│ ██████ 1.540 km                  │
└──────────────────────────────────┘
```

#### **Custos Mensais:**
```
┌──────────────────────────────────┐
│ Combustível                      │
│ ████████████████ 650.000 AOA     │
├──────────────────────────────────┤
│ Manutenção                       │
│ ████ 200.000 AOA                 │
└──────────────────────────────────┘
Total: 850.000,00 AOA
```

---

## 👥 PERMISSÕES POR PERFIL

### **1. Administrador do Sistema** 🔴
```
✅ Acesso total
✅ Criar/editar viaturas
✅ Registar utilizações
✅ Registar manutenções
✅ Ver todos os relatórios
✅ Eliminar registos
```

### **2. Gerente** 🟠
```
✅ Ver todas as viaturas
✅ Ver utilizações
✅ Ver manutenções
✅ Ver relatórios
❌ Criar/editar viaturas
❌ Registar utilizações
❌ Registar manutenções
```

### **3. Operador** 🟣
```
✅ Criar/editar viaturas
✅ Registar utilizações
✅ Registar manutenções
✅ Ver relatórios
✅ Gestão diária da frota
```

### **4. Financeiro** 🟢
```
✅ Ver relatórios de custos
❌ Acesso às outras funcionalidades
(Apenas leitura de dados financeiros)
```

### **5. Atendente** 🔵
```
❌ SEM ACESSO
Módulo não disponível
```

### **6. Utilizador Externo** ⚪
```
❌ SEM ACESSO
Módulo interno apenas
```

---

## 🎨 INTERFACE (UI)

### **Visão de Lista - Cards de Viaturas**
```
┌──────────────────────────────────┐┌──────────────────────────────────┐
│ [Disponível] [SUV]        🚗    ││ [Em Uso] [SUV]            🚗    │
│                                  ││                                  │
│ LD-12-AB-34                      ││ LD-34-CD-56                      │
│ Toyota Land Cruiser (2022)       ││ Nissan Patrol (2021)             │
│                                  ││                                  │
│ Kilometragem: 45.200 km          ││ Kilometragem: 38.500 km          │
│ Combustível: Diesel              ││ Combustível: Diesel              │
│                                  ││ Motorista: Carlos Silva          │
└──────────────────────────────────┘└──────────────────────────────────┘

┌──────────────────────────────────┐┌──────────────────────────────────┐
│ [Em Manutenção] [Pick-up]  🚗   ││ [Disponível] [Carrinha]    🚗   │
│                                  ││                                  │
│ LD-56-EF-78                      ││ LD-78-GH-90                      │
│ Toyota Hilux (2023)              ││ Mercedes Sprinter (2020)         │
│                                  ││                                  │
│ Kilometragem: 25.300 km          ││ Kilometragem: 82.000 km          │
│ Combustível: Diesel              ││ Combustível: Diesel              │
└──────────────────────────────────┘└──────────────────────────────────┘
```

### **Visão de Detalhes**
```
┌────────────────────────────────────────────────────────┐
│ ← LD-12-AB-34                    [Editar] [Nova Utilização]│
│ Toyota Land Cruiser (2022)       [Nova Manutenção]    │
│ [Disponível] [SUV] [Diesel]                           │
├────────────────────────────────────────────────────────┤
│ ⚠️ Revisão próxima: 50.000 km (actual: 45.200 km)    │
├────────────────────────────────────────────────────────┤
│ INFORMAÇÕES DA VIATURA                                 │
│                                                        │
│ Matrícula: LD-12-AB-34                                │
│ Chassis: JTE12345678901234                            │
│ Marca: Toyota                                         │
│ Modelo: Land Cruiser                                  │
│ Ano: 2022                                             │
│ Tipo: SUV • Combustível: Diesel                       │
│ Cor: Branco • Lugares: 7                              │
│ Cilindrada: 4.5L                                      │
│                                                        │
│ KILOMETRAGEM                                           │
│ Actual: 45.200 km                                     │
│ Próxima Revisão: 50.000 km                            │
│                                                        │
│ CUSTOS ACUMULADOS                                      │
│ Aquisição: 45.000.000,00 AOA                          │
│ Combustível: 2.500.000,00 AOA                         │
│ Manutenção: 850.000,00 AOA                            │
│                                                        │
│ ÚLTIMAS UTILIZAÇÕES (2)                                │
│ ┌────────────────────────────────────────────────┐    │
│ │ Ministério das Finanças          [Concluída]  │    │
│ │ Carlos Silva                                   │    │
│ │ 18/01/2026 • 200 km                           │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ MANUTENÇÕES (1)                                        │
│ (Nenhuma manutenção registada)                        │
├────────────────────────────────────────────────────────┤
│ SIDEBAR:                                               │
│ ┌─ ESTADO ACTUAL ─────────────┐                       │
│ │ Status: [Disponível]        │                       │
│ └─────────────────────────────┘                       │
│                                                        │
│ ┌─ DOCUMENTAÇÃO ──────────────┐                       │
│ │ Seguro: 31/12/2026 ✓        │                       │
│ │ Inspecção: 30/06/2026 ✓     │                       │
│ └─────────────────────────────┘                       │
│                                                        │
│ ┌─ REGISTO ───────────────────┐                       │
│ │ Por: Carlos Operador        │                       │
│ │ Data: 15/01/2024            │                       │
│ └─────────────────────────────┘                       │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 ARQUIVOS CRIADOS

```
/components/frotas/
├── types.ts ──────────────────── Tipos TypeScript completos
├── frotas-main.tsx ───────────── Componente principal
├── frotas-dashboard.tsx ──────── Dashboard com estatísticas
├── viatura-form.tsx ──────────── Formulário de viaturas
└── viatura-details.tsx ───────── Visualização detalhada

/components/management/
└── frotas.tsx ────────────────── Export wrapper
```

---

## 📊 DADOS DE DEMONSTRAÇÃO

### **4 Viaturas Completas:**

#### **1. LD-12-AB-34** - Disponível 🟢
```
Marca: Toyota Land Cruiser (2022)
Tipo: SUV • Diesel
KM: 45.200 km
Próxima Revisão: 50.000 km
Seguro: 31/12/2026 ✓
Inspecção: 30/06/2026 ✓
Custos: 3.350.000,00 AOA
Observações: Viatura do Governador
```

#### **2. LD-34-CD-56** - Em Uso 🔵
```
Marca: Nissan Patrol (2021)
Tipo: SUV • Diesel
KM: 38.500 km
Motorista: Carlos Silva
Localização: Ministério das Finanças
Seguro: 15/03/2026 ✓
Inspecção: 20/02/2026 ✓
```

#### **3. LD-56-EF-78** - Em Manutenção 🟡
```
Marca: Toyota Hilux (2023)
Tipo: Pick-up • Diesel
KM: 25.300 km
Manutenção: Revisão dos 25.000 km
Oficina: Auto Mecânica Central
Previsão: 20/01/2026
```

#### **4. LD-78-GH-90** - Disponível 🟢
```
Marca: Mercedes Sprinter (2020)
Tipo: Carrinha • Diesel
KM: 82.000 km
Lugares: 12
⚠️ Seguro vence: 30/11/2025
⚠️ Inspecção vence: 15/10/2025
```

---

## ✅ FUNCIONALIDADES TESTADAS

- [x] Dashboard com 11 cards de métricas
- [x] 4 estados de viatura
- [x] Registo de viaturas (formulário completo)
- [x] Cadastro de motoristas
- [x] Registo de utilizações
- [x] Registo de manutenções
- [x] Cálculo automático de KM percorridos
- [x] Cálculo de custos totais
- [x] Alertas de documentação
- [x] Alertas de revisão
- [x] Top viaturas mais utilizadas
- [x] Utilização por tipo
- [x] Histórico de utilizações
- [x] Histórico de manutenções
- [x] Filtros e pesquisa
- [x] Permissões por perfil
- [x] Controlo de acesso
- [x] Cards visuais
- [x] Responsivo

---

## 🎯 CASOS DE USO

### **Caso 1: Registar Nova Viatura**
```
1. Operador clica "Nova Viatura"
2. Preenche identificação (matrícula, marca, modelo)
3. Define características (tipo, combustível, lugares)
4. Insere kilometragem actual
5. Define próxima revisão
6. Adiciona datas de seguro/inspecção
7. Upload de documentos
8. Clica "Registar Viatura"
9. Viatura criada com status "Disponível"
```

### **Caso 2: Registar Utilização**
```
1. Operador selecciona viatura disponível
2. Clica "Nova Utilização"
3. Selecciona motorista
4. Preenche data/hora saída
5. Insere KM de saída
6. Define destino e finalidade
7. Adiciona passageiros (opcional)
8. Clica "Registar Saída"
9. Viatura muda para "Em Uso"
10. Motorista sai em viagem
```

### **Caso 3: Finalizar Utilização**
```
1. Motorista retorna
2. Operador abre utilização activa
3. Clica "Finalizar"
4. Insere data/hora chegada
5. Insere KM de chegada
6. Sistema calcula KM percorridos
7. Adiciona combustível (litros + custo)
8. Insere observações
9. Clica "Finalizar"
10. Viatura volta a "Disponível"
11. Custos actualizados
```

### **Caso 4: Registar Manutenção**
```
1. Operador selecciona viatura
2. Clica "Nova Manutenção"
3. Selecciona tipo (preventiva/corretiva)
4. Preenche datas entrada/saída
5. Insere dados da oficina
6. Adiciona serviços realizados
7. Calcula custos
8. Upload de factura
9. Clica "Registar Manutenção"
10. Viatura muda para "Em Manutenção"
11. Ao concluir, volta a "Disponível"
```

---

## 📱 ACESSO NO APP

```
Login como Operador:
└─ Sidebar → "Frotas" → Gestão completa

Login como Gerente:
└─ Sidebar → "Frotas" → Supervisão e relatórios

Login como Financeiro:
└─ Sidebar → "Frotas" → Apenas relatórios de custos

Login como Atendente:
└─ Acesso bloqueado (mensagem informativa)
```

---

## 🎉 RESULTADO FINAL

✅ **Módulo de Frotas 100% Funcional**  
✅ **4 Estados de viatura**  
✅ **Registo completo de viaturas**  
✅ **Sistema de utilizações**  
✅ **Gestão de manutenções**  
✅ **Controlo de custos**  
✅ **Alertas inteligentes**  
✅ **Dashboard executivo**  
✅ **Permissões por perfil**  
✅ **4 viaturas de demonstração**  

**SISTEMA DE FROTAS PRONTO PARA USO!** 🚗✨
