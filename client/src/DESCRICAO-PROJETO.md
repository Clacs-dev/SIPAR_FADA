# Sistema de Gestão de Apresentações e Pedidos de Audiência

## Visão Geral

Sistema completo de gestão de apresentações e pedidos de audiência desenvolvido para entidades públicas e privadas em Angola. A plataforma organiza e automatiza todo o fluxo desde a submissão de cartas de apresentação até a marcação e acompanhamento de reuniões, incluindo aprovações em múltiplas camadas e sistema de delegação.

## Características Principais

### 🌍 Localização Angolana
- Terminologia portuguesa/europeia (NIF/BI em vez de CPF/CNPJ)
- Formato de telefone angolano (+244 XXX XXX XXX)
- Interface totalmente em português
- Adaptado às necessidades de entidades públicas angolanas

### 🔐 Sistema de Autenticação e Permissões
Três níveis de utilizadores com permissões granulares:

1. **Requerente** - Utilizador comum
   - Submeter cartas de apresentação
   - Solicitar audiências
   - Acompanhar suas próprias solicitações
   - Receber notificações e mensagens

2. **Administrador** - Gestor do sistema
   - Aprovar/rejeitar solicitações
   - Delegar pedidos a outros administradores
   - Gerir utilizadores
   - Aceder a relatórios e auditoria
   - Configurar sistema de e-mails e notificações

3. **Atendente/Secretaria** - Agendamento
   - Visualizar pedidos aprovados
   - Agendar reuniões
   - Gerir calendário
   - Enviar confirmações de agendamento

### 📋 Fluxo de Aprovação em 3 Camadas

O sistema implementa um fluxo robusto de aprovação:

```
REQUERENTE → ADMINISTRADOR → SECRETARIA → REUNIÃO AGENDADA
```

**Estados do pedido:**

1. **PENDENTE** - Aguarda análise do administrador
2. **ACEITE_ADMIN** - Aprovado pelo admin, aguarda agendamento
3. **DELEGADO** - Delegado a outro administrador para análise
4. **AGENDADO** - Reunião agendada pela secretaria
5. **REJEITADO** - Pedido não aprovado
6. **CANCELADO** - Cancelado pelo requerente ou sistema

**Sistema de Delegação:**
- Administradores podem delegar pedidos a colegas
- Histórico completo de delegações
- Notificações automáticas ao delegado

## Funcionalidades Detalhadas

### 📊 Dashboard Interativo
- Estatísticas em tempo real
- Gráficos de pedidos por status
- Indicadores de performance
- Visão personalizada por tipo de utilizador
- Alertas e notificações pendentes

### 📝 Formulários de Submissão

#### Carta de Apresentação
- Dados do requerente (Nome, NIF/BI, Telefone, E-mail)
- Informações da entidade
- Motivo da apresentação
- Upload de documentos de suporte
- Validação de campos

#### Pedido de Audiência
- Assunto da audiência
- Descrição detalhada
- Departamento/entidade destinatária
- Preferências de data e hora
- Documentos anexos
- Seleção de tipo de reunião (presencial/online)

### 📅 Sistema de Agendamento

**Agenda Visual:**
- Calendário interativo mensal/semanal
- Visualização de reuniões agendadas
- Códigos de cores por status
- Filtros por tipo, departamento, data
- Detalhes completos ao clicar

**Marcação de Reuniões (Secretaria):**
- Seleção de data e hora
- Escolha de local (sala) ou plataforma online
- Geração automática de links (Zoom, Teams, Google Meet)
- Envio de confirmações por e-mail
- Lembretes automáticos

### 💬 Sistema de Mensagens Interno

**Centro de Mensagens:**
- Comunicação entre utilizadores e administradores
- Notificações do sistema
- Histórico de conversas
- Indicadores de mensagens não lidas
- Mensagens automáticas em mudanças de status

**Tipos de Mensagens:**
- Sistema (automáticas)
- Utilizador (manuais)
- Agrupadas por solicitação
- Timestamps detalhados

### 🔔 Sistema de Notificações

**Notificações Push:**
- Alertas em tempo real no navegador
- Permissões geridas pelo utilizador
- Categorias personalizáveis
- Histórico de notificações

**Notificações por E-mail:**
- Integração com SendGrid
- Templates personalizados
- Histórico de e-mails enviados
- Status de entrega
- Reenvio de e-mails

**Eventos que geram notificações:**
- Nova solicitação submetida
- Pedido aprovado/rejeitado
- Pedido delegado
- Reunião agendada
- Lembrete de reunião (24h antes)
- Mensagens recebidas

### 📂 Gestão de Documentos

**Upload de Documentos:**
- Suporte a PDF, DOC, DOCX, imagens
- Limite de tamanho por arquivo
- Múltiplos documentos por solicitação
- Preview de documentos
- Download seguro

**Armazenamento:**
- Integração com Supabase Storage
- Buckets privados por tipo de documento
- URLs assinadas temporárias
- Organização por solicitação

### 👥 Gestão de Utilizadores (Admin)

**Funcionalidades:**
- Criar/editar/desativar utilizadores
- Atribuir perfis (requerente/admin/atendente)
- Resetar palavras-passe
- Visualizar histórico de ações
- Gerir permissões granulares

**Auditoria:**
- Log completo de ações
- Filtros por utilizador, data, tipo de ação
- Exportação de relatórios
- Rastreabilidade total

### 📧 Gestão de E-mails (Admin)

**Configurações:**
- Templates de e-mail personalizáveis
- Assinaturas automáticas
- Remetente padrão
- Ativar/desativar tipos de notificação

**Histórico:**
- E-mails enviados
- Status de entrega
- Destinatário, assunto, data
- Possibilidade de reenvio

## Arquitetura Técnica

### Frontend
**Stack:**
- React 18 com TypeScript
- Tailwind CSS v4
- shadcn/ui (componentes)
- Lucide React (ícones)
- Recharts (gráficos)
- React Hook Form + Zod (formulários)

**Estrutura:**
```
/components
  /admin - Componentes administrativos
  /auth - Autenticação e permissões
  /dashboard - Visão geral
  /forms - Formulários de submissão
  /layout - Layout e navegação
  /management - Gestão de solicitações
  /messaging - Sistema de mensagens
  /notifications - Notificações
  /schedule - Agendamento
  /ui - Componentes shadcn/ui
```

### Backend
**Stack:**
- Supabase Edge Functions (Deno)
- Hono.js (servidor web)
- PostgreSQL (via KV store)
- Supabase Auth
- Supabase Storage

**Arquitetura:**
```
Frontend → Servidor Hono → Supabase (DB/Auth/Storage)
```

**Serviços do Backend:**
- `auth.tsx` - Autenticação e gestão de sessões
- `email-service.tsx` - Envio de e-mails via SendGrid
- `messaging-service.tsx` - Sistema de mensagens
- `notifications.tsx` - Notificações push
- `push-notifications.tsx` - Gestão de subscrições push
- `audit-service.tsx` - Auditoria e logs
- `storage-service.tsx` - Gestão de ficheiros

### Persistência de Dados

**Tabela KV Store:**
Todos os dados são armazenados em pares chave-valor:

```
Prefixos de chaves:
- user:{id} - Dados de utilizadores
- presentation:{id} - Cartas de apresentação
- audience:{id} - Pedidos de audiência
- schedule:{id} - Agendamentos
- message:{id} - Mensagens
- notification:{id} - Notificações
- email:{id} - Histórico de e-mails
- audit:{id} - Logs de auditoria
- push_subscription:{id} - Subscrições push
```

**Vantagens:**
- Flexibilidade total na estrutura de dados
- Sem necessidade de migrações
- Queries por prefixo eficientes
- Ideal para prototipagem e MVP

## Fluxos de Trabalho Principais

### 1. Submissão de Pedido de Audiência

```
1. Requerente preenche formulário
2. Upload de documentos (opcional)
3. Sistema valida dados
4. Pedido criado com status PENDENTE
5. Administradores notificados
6. E-mail de confirmação ao requerente
```

### 2. Aprovação de Pedido

```
1. Admin visualiza pedido em "Gerenciar Solicitações"
2. Analisa documentos e informações
3. Opções:
   a) Aprovar → Status: ACEITE_ADMIN
   b) Rejeitar → Status: REJEITADO (com motivo)
   c) Delegar → Status: DELEGADO (a outro admin)
4. Notificações enviadas ao requerente
5. Se aprovado, atendente pode agendar
```

### 3. Agendamento de Reunião

```
1. Atendente acede "Agendamento da Secretaria"
2. Visualiza pedidos ACEITE_ADMIN
3. Seleciona pedido e clica "Agendar"
4. Escolhe:
   - Data e hora
   - Local (sala ou online)
   - Se online: plataforma e link
5. Reunião agendada → Status: AGENDADO
6. E-mail de confirmação com detalhes
7. Evento adicionado ao calendário
```

### 4. Sistema de Delegação

```
1. Admin delega pedido a colega
2. Status muda para DELEGADO
3. Admin delegado recebe notificação
4. Delegado pode aprovar/rejeitar
5. Histórico mantém rastreio da delegação
```

## Segurança e Conformidade

### Autenticação
- Supabase Auth com JWT
- Sessões seguras
- Tokens de acesso renovados automaticamente
- Logout automático em inatividade

### Autorização
- Verificação de permissões em cada ação
- Sistema de roles granular
- Proteção de rotas no frontend e backend
- Middleware de autenticação no servidor

### Proteção de Dados
- Buckets de storage privados
- URLs assinadas temporárias para downloads
- Dados sensíveis encriptados
- Logs de auditoria completos

### CORS e Headers
- CORS configurado adequadamente
- Headers de segurança
- Rate limiting (planejado)

## Integrações Externas

### SendGrid (E-mail)
- Envio transacional de e-mails
- Templates HTML personalizados
- Tracking de entregas
- API key em variável de ambiente

### Plataformas de Reunião Online
- Suporte para Zoom, Microsoft Teams, Google Meet
- Geração automática de links
- Integração planejada com APIs

### Notificações Push
- Service Worker para push notifications
- Subscrições geridas pelo backend
- Suporte a múltiplos dispositivos

## Responsividade e UX

### Design Responsivo
- Mobile-first approach
- Breakpoints para tablet e desktop
- Navegação adaptativa
- Formulários otimizados para touch

### Acessibilidade
- Componentes shadcn/ui com ARIA labels
- Navegação por teclado
- Contraste adequado
- Feedback visual claro

### Performance
- Lazy loading de componentes
- Otimização de queries
- Cache de dados
- Compressão de imagens

## Estado Atual do Projeto

### ✅ Implementado
- Sistema de autenticação completo
- Três níveis de utilizadores com permissões
- Formulários de apresentação e audiência
- Dashboard com estatísticas
- Sistema de aprovação/delegação
- Agendamento pela secretaria
- Sistema de mensagens interno
- Notificações push e e-mail
- Gestão de utilizadores
- Upload e gestão de documentos
- Auditoria e logs
- Agenda visual com calendário

### 🔧 Correções Recentes
- Health check de autenticação
- Warnings do React.forwardRef
- Formatação de datas inválidas
- Sistema de mensagens (sendMessage vs sendSystemMessage)
- Centro de mensagens (token de autenticação)
- Erros 401 em chamadas API

### 🚀 Próximos Passos Sugeridos
- Integração com APIs de plataformas de reunião
- Sistema de relatórios e exportação
- Notificações SMS (via Twilio)
- Dashboard de métricas avançadas
- App mobile (React Native)
- Recuperação de palavra-passe por e-mail
- Autenticação em dois fatores (2FA)

## Variáveis de Ambiente Configuradas

```
SUPABASE_URL - URL do projeto Supabase
SUPABASE_ANON_KEY - Chave pública do Supabase
SUPABASE_SERVICE_ROLE_KEY - Chave de serviço (backend)
SUPABASE_DB_URL - URL de conexão PostgreSQL
SENDGRID_API_KEY - Chave da API SendGrid
```

## Comandos e Estrutura de Dados

### Utilizador
```typescript
{
  id: string
  email: string
  name: string
  role: 'admin' | 'attendant' | 'requester'
  phone?: string
  nif?: string
  createdAt: string
}
```

### Pedido de Audiência
```typescript
{
  id: string
  userId: string
  type: 'presentation' | 'audience'
  status: 'PENDENTE' | 'ACEITE_ADMIN' | 'DELEGADO' | 'AGENDADO' | 'REJEITADO' | 'CANCELADO'
  subject: string
  description: string
  department: string
  documents: string[]
  scheduledDate?: string
  meetingType?: 'presencial' | 'online'
  meetingLink?: string
  rejectionReason?: string
  delegatedTo?: string
  createdAt: string
  updatedAt: string
}
```

### Agendamento
```typescript
{
  id: string
  audienceId: string
  date: string
  time: string
  location: string
  meetingType: 'presencial' | 'online'
  platform?: string
  meetingLink?: string
  notes?: string
  createdBy: string
  createdAt: string
}
```

### Mensagem
```typescript
{
  id: string
  requestId: string
  senderId: string
  recipientId?: string
  type: 'system' | 'user'
  content: string
  createdAt: string
  read: boolean
}
```

## Conclusão

Este sistema representa uma solução completa e robusta para gestão de apresentações e audiências em entidades públicas e privadas angolanas. Com foco em usabilidade, segurança e automação, a plataforma reduz significativamente o tempo de processamento de solicitações, melhora a comunicação entre requerentes e administração, e fornece rastreabilidade completa de todo o processo.

A arquitetura modular e uso de tecnologias modernas (React, Tailwind, Supabase) garantem escalabilidade e facilidade de manutenção, enquanto a localização para o contexto angolano assegura adequação às necessidades locais.
