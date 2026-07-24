# 🛍️ FORMULÁRIO DE COMPRAS E CONTRATAÇÃO - GUIA RÁPIDO

## ✅ STATUS: 100% IMPLEMENTADO E FUNCIONAL!

O formulário de **Compras e Contratação** está **totalmente integrado** e funcionando!

---

## 📍 ONDE ENCONTRAR

### **Passo 1: Acesse o Módulo**
1. Faça login com um perfil de **Administrador** ou **Gerente**:
   ```
   Email: admin@sipar.ao
   Senha: Demo@2024
   ```

2. No menu lateral, clique em:
   ```
   🛍️ Compras e Contratação
   ```

### **Passo 2: Abra o Formulário**
1. No canto superior direito, clique no botão:
   ```
   [+ Novo]
   ```

2. Um **modal grande** vai abrir com **2 TABS**:
   - 📄 **Requisição de Compra**
   - 🛍️ **Ordem de Compra**

---

## 📋 FORMULÁRIO COM 2 TABS

### **TAB 1: REQUISIÇÃO DE COMPRA** 📄

**Quando usar:** Para solicitar a compra de algo que ainda precisa ser cotado/aprovado

**Campos disponíveis:**
1. ✅ **Tipo** (dropdown) - Bem, Serviço ou Obra
2. ✅ **Prioridade** (dropdown) - Baixa, Normal, Alta, Urgente
3. ✅ **Descrição** (textarea) - O que precisa ser comprado
4. ✅ **Justificativa** (textarea) - Por que precisa comprar
5. ✅ **Orçamento Estimado** (número) - Valor aproximado em AOA
6. ✅ **Sistema de Itens** (multi-item dinâmico):
   - Descrição do item
   - Quantidade
   - Especificações
   - Botão **[+ Adicionar]** para adicionar mais itens
   - Botão **[🗑️]** para remover itens (mínimo 1)

**Botões:**
- **Cancelar** - Fecha o modal sem gravar
- **Criar Requisição** - Envia a requisição para o backend

---

### **TAB 2: ORDEM DE COMPRA** 🛍️

**Quando usar:** Para emitir uma ordem de compra formal para um fornecedor

**Campos disponíveis:**
1. ✅ **Fornecedor** (texto) - Nome completo do fornecedor
2. ✅ **Valor Total** (número) - Valor final em AOA
3. ✅ **Prazo de Entrega** (data) - Data limite de entrega
4. ✅ **Local de Entrega** (texto) - Endereço completo
5. ✅ **Condições de Pagamento** (textarea) - Ex: "50% antecipado, 50% na entrega"
6. ✅ **Observações** (textarea) - Informações adicionais

**Botões:**
- **Cancelar** - Fecha o modal sem gravar
- **Emitir Ordem de Compra** - Envia a OC para o backend

---

## 🎯 EXEMPLO DE TESTE COMPLETO

### **Cenário 1: Criar Requisição de Compra**

1. Clique em **[+ Novo]**
2. Certifique-se que está na tab **"Requisição de Compra"**
3. Preencha:
   ```
   Tipo: Bem
   Prioridade: Normal
   Descrição: Compra de notebooks Dell para departamento de TI
   Justificativa: Equipamentos atuais estão obsoletos e afetando produtividade
   Orçamento Estimado: 5000000 (5M AOA)
   ```
4. Em **Itens**:
   ```
   Item 1:
     Descrição: Notebook Dell Latitude 5540
     Quantidade: 10
     Especificações: i7, 16GB RAM, 512GB SSD
   ```
5. Clique em **[+ Adicionar]** para adicionar mais itens se necessário
6. Clique em **[Criar Requisição]**
7. ✅ Aguarde o toast de sucesso
8. ✅ O modal fecha automaticamente
9. ✅ A requisição aparece na lista

---

### **Cenário 2: Criar Ordem de Compra**

1. Clique em **[+ Novo]**
2. Clique na tab **"Ordem de Compra"**
3. Preencha:
   ```
   Fornecedor: TechStore Angola Lda
   Valor Total: 4850000 (4.85M AOA)
   Prazo de Entrega: 2026-03-15 (selecione no calendário)
   Local de Entrega: Rua da Missão 123, Luanda
   Condições de Pagamento: 50% antecipado via transferência bancária, 50% na entrega
   Observações: Incluir garantia de 2 anos
   ```
4. Clique em **[Emitir Ordem de Compra]**
5. ✅ Aguarde o toast de sucesso
6. ✅ O modal fecha automaticamente
7. ✅ A OC aparece na lista da tab "Ordens de Compra"

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### **Checklist Visual:**
- [ ] Ao clicar em "Novo", um **modal grande** abre
- [ ] O modal tem o título **"Compras e Contratação"**
- [ ] Existem **2 tabs** no topo: "Requisição de Compra" e "Ordem de Compra"
- [ ] Ao clicar em cada tab, o formulário muda
- [ ] Na tab "Requisição", há um botão **[+ Adicionar]** para itens
- [ ] Ao clicar em **[+ Adicionar]**, uma nova linha de item aparece
- [ ] O botão de submit muda para "A criar..." quando enviando
- [ ] Após sucesso, aparece um **toast verde** no canto superior
- [ ] O modal **fecha automaticamente** após sucesso

---

## 🐛 SE NÃO FUNCIONAR

### **Problema 1: Botão "Novo" não aparece**
**Causa:** Usuário não tem permissão  
**Solução:** Faça login com `admin@sipar.ao`

### **Problema 2: Modal não abre**
**Causa:** Erro de JavaScript  
**Solução:**
1. Pressione F12 para abrir DevTools
2. Vá para a aba "Console"
3. Procure por erros em vermelho
4. Copie e cole o erro para análise

### **Problema 3: Formulário abre mas não envia**
**Causa:** Campos obrigatórios não preenchidos  
**Solução:**
- Preencha **Descrição** e **Justificativa** (Requisição)
- Preencha **Fornecedor**, **Valor** e **Prazo** (Ordem de Compra)
- Aguarde o toast de erro indicando o campo

### **Problema 4: Erro ao enviar**
**Causa:** Backend não responde  
**Solução:**
1. Verifique o console do navegador (F12)
2. Procure por erros HTTP (404, 500)
3. Verifique se o Supabase está online

---

## 📊 ARQUIVOS ENVOLVIDOS

```
Frontend:
├── /components/compras/compras-main.tsx     (componente principal)
├── /components/compras/compra-form.tsx      (formulário com 2 tabs)
└── /components/compras/types.tsx            (tipos TypeScript)

Hooks:
└── /hooks/use-compras.tsx                   (hook customizado)

Backend:
└── /supabase/functions/server/compras-routes.tsx

Integração:
└── /App.tsx                                 (rota "compras")
```

---

## ✅ CONFIRMAÇÃO FINAL

Se você conseguir:
1. ✅ Ver o botão "Novo" no módulo de Compras
2. ✅ Abrir o modal ao clicar
3. ✅ Ver as 2 tabs (Requisição e Ordem de Compra)
4. ✅ Trocar entre as tabs
5. ✅ Preencher e submeter qualquer uma das tabs
6. ✅ Ver o toast de sucesso
7. ✅ Ver o item criado na lista

**Então o formulário está 100% FUNCIONAL!** 🎉

---

**Última atualização:** 2026-02-16  
**Status:** ✅ Formulário Completamente Integrado  
**Funcionalidades:** 2 formulários em 1, validação completa, sistema multi-item
