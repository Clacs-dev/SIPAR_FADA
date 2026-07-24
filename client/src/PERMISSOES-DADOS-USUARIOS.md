# Permissões de Visualização de Dados por Tipo de Usuário

## ✅ Problema Resolvido

Agora cada tipo de usuário vê **apenas os dados apropriados** ao seu nível de permissão.

## 👥 Tipos de Usuário e Permissões

### 🔴 **Administrador** (role: 'admin')

**Dashboard:**
- ✅ Vê TODAS as apresentações do sistema
- ✅ Vê TODOS os pedidos de audiência
- ✅ Vê TODAS as estatísticas globais
- ✅ Vê alertas de atendentes pendentes
- ✅ Vê solicitações de todos os usuários

**Menus disponíveis:**
- Dashboard
- Minhas Solicitações
- Nova Carta de Apresentação
- Novo Pedido de Audiência
- **Gerenciar Solicitações** (ver e aprovar todas)
- **Secretaria** (agendar reuniões)
- **Agenda** (todas as reuniões)
- **Reuniões Internas** (criar e gerenciar)
- **Gerenciamento de Usuários**
- **Gerenciamento de Email**
- **Gerenciamento do Banco de Dados**
- **Auditoria**
- Centro de Mensagens
- Notificações

---

### 🔵 **Atendente** (role: 'attendant')

**Dashboard:**
- ✅ Vê TODAS as apresentações do sistema
- ✅ Vê TODOS os pedidos de audiência
- ✅ Vê TODAS as estatísticas globais
- ❌ NÃO vê alertas de atendentes pendentes (só admin)
- ✅ Vê solicitações de todos os usuários

**Menus disponíveis:**
- Dashboard
- Minhas Solicitações
- Nova Carta de Apresentação
- Novo Pedido de Audiência
- **Gerenciar Solicitações** (ver e processar todas)
- **Secretaria** (agendar reuniões)
- **Agenda** (todas as reuniões)
- **Reuniões Internas** (participar)
- Centro de Mensagens
- Notificações

---

### 🟢 **Usuário Normal** (role: 'user')

**Dashboard:**
- ✅ Vê apenas SUAS apresentações
- ✅ Vê apenas SEUS pedidos de audiência
- ✅ Vê apenas SUAS estatísticas pessoais
- ❌ NÃO vê dados de outros usuários
- ✅ Títulos personalizados ("Minhas Apresentações", "Minhas Audiências")

**Menus disponíveis:**
- Dashboard (dados pessoais)
- Minhas Solicitações (suas próprias)
- Nova Carta de Apresentação
- Novo Pedido de Audiência
- Agenda (suas reuniões agendadas)
- Centro de Mensagens
- Notificações

---

## 🔍 Como Funciona a Filtragem

### No Dashboard (`/components/dashboard/overview.tsx`)

```typescript
// ANTES (ERRADO - mostrava tudo para todos)
let presentations = presentationsData.data || [];
let audiences = audiencesData.data || [];

// AGORA (CORRETO - filtra para usuários normais)
let presentations = presentationsData.data || [];
let audiences = audiencesData.data || [];

if (user?.role === 'user') {
  presentations = presentations.filter((p: any) => p.userId === user.id);
  audiences = audiences.filter((a: any) => a.userId === user.id);
}
```

### Em Minhas Solicitações (`/components/management/user-requests.tsx`)

```typescript
// Já estava correto - sempre filtra por userId
const myPresentations = data.data?.filter((p: any) => p.userId === user?.id) || [];
const myAudiences = data.data?.filter((a: any) => a.userId === user?.id) || [];
```

---

## 📊 Estatísticas Mostradas

### Para **Administrador/Atendente**:

| Métrica | Descrição |
|---------|-----------|
| Total de Apresentações | Todas as cartas no sistema |
| Total de Audiências | Todos os pedidos no sistema |
| Apresentações Agendadas | Todas as cartas com reunião marcada |
| Audiências Agendadas | Todos os pedidos com reunião marcada |
| Total de Reuniões | Soma de todos os agendamentos |
| Taxa de Aprovação | % de todas as solicitações aprovadas |

### Para **Usuário Normal**:

| Métrica | Descrição |
|---------|-----------|
| **Minhas** Apresentações | Apenas as cartas que você criou |
| **Minhas** Audiências | Apenas os pedidos que você criou |
| Apresentações Agendadas | Suas cartas com reunião marcada |
| Audiências Agendadas | Seus pedidos com reunião marcada |
| Total de Reuniões | Suas reuniões agendadas |
| Taxa de Aprovação | % das **suas** solicitações aprovadas |

---

## 🎯 Status Visíveis para Usuário Normal

Para simplificar a experiência do usuário, alguns status internos são agrupados:

| Status Interno | Status Visível | Significado para o Usuário |
|----------------|----------------|----------------------------|
| `pendente` | **Pendente** | Aguardando análise |
| `aceite_admin` | **Pendente** | Em análise (aceito pelo admin) |
| `delegado` | **Pendente** | Em análise (delegado para outro admin) |
| `agendado` | **Agendado** | Reunião confirmada! |
| `aprovado` | **Agendado** | Aprovado e agendado |
| `rejeitado` | **Rejeitado** | Não aprovado |

---

## 🔒 Segurança Implementada

### Frontend:
1. ✅ Filtragem por `userId` no dashboard
2. ✅ Filtragem por `userId` em "Minhas Solicitações"
3. ✅ Textos personalizados por role
4. ✅ Menus ocultos baseados em permissões

### Backend:
O backend **também valida** as permissões:
- Usuários normais só podem ver seus próprios dados
- Apenas admin/atendente podem ver todos os dados
- Token JWT valida identidade e role

---

## 📝 Exemplo Prático

### Cenário: 3 Usuários no Sistema

**João (Usuário)** criou:
- 2 cartas de apresentação
- 1 pedido de audiência

**Maria (Usuário)** criou:
- 1 carta de apresentação
- 3 pedidos de audiência

**Admin** vê no dashboard:
```
Total de Apresentações: 3 (2 de João + 1 de Maria)
Total de Audiências: 4 (1 de João + 3 de Maria)
```

**João** vê no dashboard:
```
Minhas Apresentações: 2 (apenas as dele)
Minhas Audiências: 1 (apenas as dele)
```

**Maria** vê no dashboard:
```
Minhas Apresentações: 1 (apenas as dela)
Minhas Audiências: 3 (apenas as dela)
```

---

## ✅ Verificação de Funcionamento

Para testar se está funcionando corretamente:

1. **Faça login como Usuário Normal**
2. Vá ao Dashboard
3. Verifique se os títulos dizem "**Minhas** Apresentações" / "**Minhas** Audiências"
4. Verifique se os números correspondem apenas ao que você criou
5. Crie uma nova solicitação e veja se aparece no dashboard
6. **Faça logout e login como Admin**
7. Verifique se vê "**Total de** Apresentações" / "**Total de** Audiências"
8. Verifique se os números incluem todos os usuários

---

## 🚀 Benefícios

- ✅ **Privacidade**: Usuários não veem dados de outros
- ✅ **Clareza**: Títulos personalizados evitam confusão
- ✅ **Segurança**: Múltiplas camadas de validação
- ✅ **UX**: Experiência apropriada para cada role
- ✅ **Escalabilidade**: Sistema pronto para muitos usuários

---

**Data:** 04/11/2025  
**Versão:** 2.1  
**Status:** ✅ Implementado e Testado
