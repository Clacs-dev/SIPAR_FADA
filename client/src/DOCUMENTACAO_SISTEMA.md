# Sistema de Gestão de Apresentações e Audiências

## Visão Geral

Sistema completo de gestão de apresentações e pedidos de audiência para entidades públicas e privadas em Angola. O sistema organiza e automatiza todo o fluxo desde a submissão de cartas de apresentação até à marcação e acompanhamento de reuniões.

---

## 📋 Estrutura de Dados

O sistema trabalha com **quatro grupos principais de dados**:

1. **Cartas de Apresentação** - Documentos formais de apresentação
2. **Pedidos de Audiência** - Solicitações de reunião/audiência
3. **Agenda/Marcações** - Calendário de reuniões agendadas
4. **Utilizadores** - Gestão de utilizadores do sistema

---

## 👥 Níveis de Permissões

O sistema possui **três níveis de acesso**:

### 1. Governador/Ministro/S. Estado (Administrador)
- **Permissões completas** no sistema
- Aprovar ou rejeitar pedidos de audiência
- Delegar pedidos para outros administradores
- Visualizar estatísticas globais
- Gerir utilizadores e configurações
- Acesso a todos os dados do sistema

### 2. Secretaria/Assist. Administrativa (Atendente)
- Agendar reuniões aprovadas
- Gerir calendário e disponibilidade
- Confirmar horários e locais
- Enviar notificações aos requerentes
- Visualizar pedidos aprovados pelo administrador

### 3. Utente (Utilizador/Requerente)
- Submeter cartas de apresentação
- Criar pedidos de audiência
- Acompanhar status dos seus pedidos
- Receber notificações sobre suas solicitações
- Visualizar **apenas os seus próprios dados**

---

## 🔄 Fluxo de Aprovação

O sistema implementa um **fluxo de aprovação em três camadas**:

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐      ┌───────────────┐
│   UTENTE    │ ───> │  GOVERNADOR/     │ ───> │   SECRETARIA/  │ ───> │   AGENDADO    │
│  submete    │      │  MINISTRO        │      │   ASSISTENTE   │      │   (Reunião    │
│  pedido     │      │  aprova/delega   │      │   marca data   │      │   confirmada) │
└─────────────┘      └──────────────────┘      └────────────────┘      └───────────────┘
```

### Estados do Pedido

1. **PENDENTE** 
   - Pedido submetido pelo utente
   - Aguarda análise do administrador

2. **ACEITE_ADMIN** 
   - Pedido aprovado pelo Governador/Ministro/S. Estado
   - Aguarda agendamento pela Secretaria

3. **DELEGADO** 
   - Pedido delegado para outro administrador
   - Administrador delegado pode aprovar ou rejeitar

4. **AGENDADO** 
   - Data e hora definidas pela Secretaria
   - Reunião confirmada e notificações enviadas

5. **REJEITADO** 
   - Pedido recusado pelo administrador
   - Utente recebe notificação com justificação

---

## 🎯 Funcionalidades Principais

### Dashboard
- **Estatísticas em tempo real**
- Número de pedidos pendentes, aprovados, agendados
- Gráficos de atividade
- Próximas reuniões
- Alertas e notificações
- **Visualização filtrada por permissão** (utilizadores normais veem apenas seus dados)

### Formulários de Submissão
- Formulário de carta de apresentação
- Formulário de pedido de audiência
- Campos validados (NIF/BI, telefone angolano)
- Upload de documentos anexos

### Sistema de Aprovação/Rejeição
- Interface para administradores analisarem pedidos
- Opção de aprovar, rejeitar ou delegar
- Campo para justificação de rejeição
- Histórico de decisões

### Sistema de Delegação
- Administradores podem delegar pedidos entre si
- Rastreamento de quem delegou para quem
- Notificações de delegação

### Agenda Visual
- Calendário interativo
- Visualização por dia/semana/mês
- Marcação de disponibilidade
- Cores por tipo de reunião ou status

### Centro de Mensagens e Notificações
- Notificações em tempo real
- Alertas de mudança de status
- Lembretes de reuniões próximas
- Sistema de mensagens interno

---

## 🔧 Tecnologias Utilizadas

### Frontend
- **React** - Framework JavaScript
- **shadcn/ui** - Componentes de interface
- **Tailwind CSS** - Estilização
- **Lucide Icons** - Ícones

### Backend
- **Supabase** - Backend as a Service
  - Autenticação de utilizadores
  - Base de dados PostgreSQL
  - Storage para documentos
  - Edge Functions para lógica de servidor
  - Notificações em tempo real

---

## 🌍 Adaptações Regionais

### Terminologia Portuguesa/Europeia
- **NIF** (Número de Identificação Fiscal)
- **BI** (Bilhete de Identidade)
- Nomenclatura adaptada ao contexto angolano/português

### Padrão Telefónico Angolano
- Formato: **+244 XXX XXX XXX**
- Validação automática do formato
- Indicativo do país (+244) obrigatório

---

## ✅ Funcionalidades Implementadas Recentemente

### Gestão de Utilizadores Reais
- ✅ Criação de utilizadores reais (não mockados)
- ✅ Tratamento de erros melhorado no backend
- ✅ Funcionalidade para limpar utilizadores de demonstração
- ✅ Sistema de autenticação completo com Supabase

### Permissões de Visualização
- ✅ **Utilizadores normais (Utentes)** veem apenas seus próprios dados
- ✅ **Secretaria** vê pedidos aprovados para agendamento
- ✅ **Governador/Ministro/S. Estado** tem acesso completo a todos os dados
- ✅ Dashboard adaptado conforme nível de permissão

### Correções de Interface
- ✅ Badges atualizados com nomenclatura correta:
  - Governador/Ministro/S. Estado
  - Secretaria/Assist. Administrativa
  - Utente

---

## 🔐 Segurança e Privacidade

- **Autenticação segura** via Supabase Auth
- **Permissões baseadas em funções** (RBAC)
- **Isolamento de dados** por utilizador
- **Validação de dados** no frontend e backend
- **Proteção contra acesso não autorizado**

---

## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ Dashboard  │  │ Formulários│  │  Agenda/        │  │
│  │            │  │            │  │  Calendário     │  │
│  └────────────┘  └────────────┘  └─────────────────┘  │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ Aprovações │  │ Mensagens  │  │  Notificações   │  │
│  │            │  │            │  │                 │  │
│  └────────────┘  └────────────┘  └─────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ API Calls
                     │
┌────────────────────▼────────────────────────────────────┐
│               BACKEND (Supabase)                        │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │    Auth    │  │ PostgreSQL │  │  Edge Functions │  │
│  │            │  │  Database  │  │                 │  │
│  └────────────┘  └────────────┘  └─────────────────┘  │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │  Storage   │  │ Realtime   │  │   Row Level     │  │
│  │  (Docs)    │  │ Subscr.    │  │   Security      │  │
│  └────────────┘  └────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos Sugeridos

1. **Relatórios e Exportação**
   - Exportar pedidos em PDF/Excel
   - Relatórios estatísticos mensais
   - Histórico de audiências

2. **Melhorias na Comunicação**
   - Integração com email (notificações automáticas)
   - SMS para lembretes de reunião
   - Chat em tempo real

3. **Funcionalidades Avançadas**
   - Videoconferência integrada
   - Assinatura digital de documentos
   - Sistema de feedback pós-reunião

4. **Otimizações**
   - Cache de dados frequentes
   - Pesquisa e filtros avançados
   - Modo offline

---

## 📞 Informações de Suporte

**Sistema desenvolvido para:**
- Gabinetes governamentais
- Ministérios
- Secretarias de Estado
- Entidades públicas e privadas em Angola

**Data de última atualização:** Janeiro 2026

---

*Documento gerado automaticamente pelo Sistema de Gestão de Apresentações e Audiências*
