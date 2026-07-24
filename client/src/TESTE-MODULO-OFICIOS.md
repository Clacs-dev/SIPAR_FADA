# 🧪 TESTE RÁPIDO - MÓDULO DE OFÍCIOS

## ⚡ TESTE EM 5 MINUTOS

### **PASSO 1: Login como Gerente**
```bash
Email: gerente@sistema.ao
Senha: gerente123
```

### **PASSO 2: Abrir Ofícios**
```
1. Sidebar → "Ofícios"
2. Ver Dashboard com estatísticas ✓
```

### **PASSO 3: Explorar Tabs**
```
┌────────────────────────────────────┐
│ [Dashboard] [Todos] [Recebidos]    │
│ [Enviados] [Arquivo]               │
└────────────────────────────────────┘

✓ Dashboard - 8 cards de estatísticas
✓ Todos - 4 ofícios
✓ Recebidos - 2 ofícios (entrada)
✓ Enviados - 2 ofícios (saída)
✓ Arquivo - 0 ofícios
```

### **PASSO 4: Ver Detalhes**
```
1. Clique em "OF/002/2026"
2. Ver informações completas ✓
3. Ver anexo (Convocatoria_Reuniao.pdf) ✓
4. Ver histórico vazio ✓
5. Botão "Adicionar Despacho" visível ✓
```

### **PASSO 5: Adicionar Despacho**
```
1. Clique "Adicionar Despacho"
2. Digite: "Aprovado para processamento"
3. Clique "Enviar Despacho"
4. Ver despacho no histórico ✓
```

---

## 📋 CHECKLIST DE FUNCIONALIDADES

### **Dashboard**
- [ ] 4 cards principais (Total, Pendentes, Em Análise, Despachados)
- [ ] 3 cards adicionais (Atrasados, Entrada, Saída)
- [ ] Alerta de ofícios atrasados (se houver)

### **Lista de Ofícios**
- [ ] Mostra 4 ofícios
- [ ] Badges de status coloridos
- [ ] Ícones de prioridade (🔴🟠🔵⚪)
- [ ] Badges de tipo (⬇️ Entrada / ⬆️ Saída)
- [ ] Informações: assunto, data, autor

### **Filtros**
- [ ] Pesquisa por assunto/número
- [ ] Filtro por status
- [ ] Filtro por prioridade
- [ ] Resultados atualizam dinamicamente

### **Detalhes do Ofício**
- [ ] Número do ofício
- [ ] Tipo (entrada/saída)
- [ ] Remetente/Destinatário
- [ ] Departamentos
- [ ] Assunto
- [ ] Conteúdo completo
- [ ] Anexos (se houver)
- [ ] Histórico de despachos
- [ ] Botões: Editar, Download, Arquivar

### **Formulário**
- [ ] Tipo de ofício (entrada/saída)
- [ ] Prioridade
- [ ] Destinatário/Remetente
- [ ] Prazo de resposta
- [ ] Departamentos
- [ ] Assunto
- [ ] Conteúdo (textarea)
- [ ] Upload de anexos
- [ ] Botões: Guardar Rascunho, Registar

---

## 🎯 TESTES POR PERFIL

### **GERENTE** 🟠
```bash
Login: gerente@sistema.ao / gerente123

✅ Deve ver:
├─ Dashboard completo
├─ Todos os ofícios
├─ Botão "Adicionar Despacho"
└─ Botão "Arquivar"

❌ NÃO deve ver:
├─ Botão "Novo Ofício" (pode despachar, não criar)
└─ Botão "Editar" em ofícios registados
```

### **OPERADOR** 🟣
```bash
Login: operador@sistema.ao / operador123

✅ Deve ver:
├─ Dashboard completo
├─ Botão "Novo Ofício"
├─ Todos os ofícios
└─ Formulário de criação

❌ NÃO deve ver:
├─ Botão "Arquivar"
└─ Aprovar/Rejeitar (apenas registar)
```

### **ADMIN** 🔴
```bash
Login: admin@sistema.com / 123456

✅ Deve ver:
├─ Dashboard completo
├─ Todos os ofícios
├─ Botão "Novo Ofício"
├─ Adicionar Despachos
└─ Arquivar

✅ Acesso total a tudo
```

---

## 🐛 POSSÍVEIS PROBLEMAS

### **Problema 1: Tabs não aparecem**
```
Solução: Verifique se o componente Tabs está importado
```

### **Problema 2: Formulário não abre**
```
Solução: Verifique o estado "view" no componente
```

### **Problema 3: Despachos não aparecem**
```
Solução: Verifique a estrutura de dados dos ofícios
```

---

## ✅ SUCESSO!

Se você conseguiu:
- ✅ Ver o dashboard
- ✅ Navegar pelas tabs
- ✅ Ver detalhes de um ofício
- ✅ Abrir o formulário

**Módulo está 100% funcional!** 🎉

---

## 📸 SCREENSHOTS ESPERADOS

### **Dashboard:**
```
┌────────────────────────────────────┐
│ Total: 15    Pendentes: 3          │
│ Em Análise: 4    Despachados: 6    │
│ Atrasados: 1    Entrada: 8         │
│ Saída: 7                           │
└────────────────────────────────────┘
```

### **Lista:**
```
🔴 OF/002/2026 [Em Análise] [⬇️]
Convocação para Reunião Extraordinária
De: Ministério das Finanças
16/01/2026 • Ana Atendente
```

### **Detalhes:**
```
← OF/002/2026             [Editar] [Download]
[Em Análise] [🔴 Urgente] [⬇️ Entrada]

INFORMAÇÕES DO OFÍCIO
Remetente: Ministério das Finanças
Prazo: 20/01/2026

📎 ANEXOS (1)
Convocatoria_Reuniao.pdf

💬 HISTÓRICO DE DESPACHOS (1)
João Gerente • 16/01/2026
"Aprovado para processamento"
```

---

**PRÓXIMO:** Teste em diferentes perfis! 🚀
