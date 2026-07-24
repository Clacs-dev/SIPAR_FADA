# Fluxo de Pedidos de Audiência

## Visão Geral

O sistema de pedidos de audiência foi redesenhado para simplificar o processo para o usuário e dar mais controlo ao administrador sobre o agendamento das reuniões.

## Mudança Principal

**Antes:** O usuário definia todos os detalhes da reunião (tipo, data, hora, plataforma, duração).

**Agora:** O usuário apenas submete o pedido com informações básicas. O administrador é responsável por analisar, aprovar e agendar a reunião.

## Fluxo do Usuário (Solicitante)

### 1. Preencher Formulário de Pedido

O formulário de pedido de audiência agora contém apenas os seguintes campos:

#### Campos Obrigatórios:
- **Nome da Empresa** - Empresa que solicita a audiência
- **Nome do Requerente** - Pessoa responsável pelo pedido
- **Cargo do Requerente** - Posição na empresa
- **E-mail** - Endereço de e-mail para contato
- **Telefone** - Número de telefone (formato angolano: +244 XXX XXX XXX)
- **Motivo da Audiência** - Seleção de opções pré-definidas:
  - Apresentação de Produto/Serviço
  - Discussão de Parceria
  - Apresentação de Proposta
  - Follow-up de Carta
  - Negociação Comercial
  - Suporte Técnico
  - Pedido de Esclarecimentos
  - Reclamação
  - Outros Assuntos
- **Descrição Detalhada** - Texto livre explicando o objetivo da audiência

#### Campo Opcional:
- **Documento Complementar** - Upload de arquivo PDF, Word, Excel ou imagem

### 2. Enviar Pedido

Ao clicar em "Enviar Pedido":
- O sistema valida todos os campos obrigatórios
- O pedido é criado com status "Pendente"
- O usuário recebe confirmação de envio
- Uma notificação é enviada para os administradores

### 3. Acompanhar Status

O usuário pode acompanhar o status do pedido em "Minhas Solicitações":
- **Pendente** - Aguardando análise do administrador
- **Aprovado** - Reunião agendada (detalhes visíveis)
- **Rejeitado** - Pedido não aprovado

## Fluxo do Administrador/Atendente

### 1. Visualizar Pedidos Pendentes

No painel "Gerenciar Solicitações":
- Lista todos os pedidos de audiência
- Filtros por status e pesquisa
- Badge visual indicando status
- Botão "Ver Detalhes" (ícone de olho)

### 2. Analisar Pedido

Ao clicar em "Ver Detalhes", o administrador visualiza:
- Dados da empresa e requerente
- Motivo da audiência
- Descrição detalhada
- Documento anexado (se houver)
- Data de submissão

### 3. Aprovar e Agendar

Para pedidos pendentes, o administrador pode:

#### Opção A: Agendar Reunião (Aprovar)

Ao clicar no botão "Agendar":
1. Abre modal de agendamento com:
   - **Tipo de Atendimento** (Online/Presencial) *
   - **Plataforma de Reunião** (se online) *
     - Google Meet
     - Zoom
     - Microsoft Teams
     - Skype
     - WhatsApp Video
   - **Local da Reunião** (se presencial) *
   - **Data da Reunião** (calendário) *
   - **Horário** (seletor de hora) *
   - **Duração** *
     - 30 minutos
     - 1 hora
     - 1h 30min
     - 2 horas
     - Mais de 2 horas
   - **Notas Adicionais** (opcional)

2. Ao clicar "Agendar e Aprovar":
   - Pedido muda para status "Aprovado"
   - Link de reunião é gerado automaticamente (se online)
   - Notificação é enviada ao requerente com todos os detalhes
   - Reunião aparece na agenda do sistema

#### Opção B: Rejeitar Pedido

Ao clicar no botão "Rejeitar" (X vermelho):
- Pedido muda para status "Rejeitado"
- Notificação é enviada ao requerente
- Pedido não aparece mais nos pendentes

### 4. Visualizar Detalhes do Agendamento

Para pedidos aprovados, ao ver detalhes, o administrador visualiza:
- Informações do pedido original
- Detalhes do agendamento criado:
  - Tipo de reunião
  - Plataforma/Local
  - Data e horário
  - Duração
  - Link da reunião (se aplicável)

## Notificações Automáticas

### Para o Usuário:
1. **Pedido Recebido** - Confirmação de submissão
2. **Pedido Aprovado** - Com todos os detalhes da reunião agendada
3. **Pedido Rejeitado** - Informando a decisão

### Para Administradores:
1. **Novo Pedido** - Quando usuário submete pedido
2. **Lembrete** - Pedidos pendentes há mais de X dias (futuro)

## Vantagens do Novo Fluxo

### Para o Usuário:
- ✅ Processo mais simples e rápido
- ✅ Menos campos para preencher
- ✅ Não precisa verificar disponibilidade
- ✅ Focado em explicar sua necessidade

### Para o Administrador:
- ✅ Controle total sobre agendamentos
- ✅ Evita conflitos de agenda
- ✅ Pode coordenar melhor os recursos
- ✅ Define formato mais adequado para cada caso
- ✅ Visibilidade de todos os pedidos

## Componentes Técnicos

### Frontend:
- `audience-form.tsx` - Formulário simplificado do usuário
- `schedule-meeting-dialog.tsx` - Modal de agendamento do admin
- `requests-list.tsx` - Lista e gestão de pedidos
- `document-upload.tsx` - Upload de documentos
- `document-viewer.tsx` - Visualização de documentos

### Backend:
- Rota `POST /audiences` - Criar pedido (usuário)
- Rota `PUT /audiences/:id/status` - Aprovar/Rejeitar/Agendar (admin)
- Sistema de notificações automáticas
- Geração de links de reunião
- Storage de documentos

## Dados Armazenados

### Pedido de Audiência:
```json
{
  "id": "audience_1234567890",
  "company": "Nome da Empresa",
  "contact": "Nome do Requerente",
  "position": "Cargo",
  "email": "email@empresa.com",
  "phone": "+244 923 456 789",
  "reason": "apresentacao",
  "description": "Descrição detalhada...",
  "documentPath": "audiences/{userId}/documento.pdf",
  "documentName": "documento.pdf",
  "userId": "user_id",
  "userEmail": "user@email.com",
  "status": "pendente",
  "createdAt": "2025-10-07T10:00:00Z",
  "updatedAt": "2025-10-07T10:00:00Z"
}
```

### Após Aprovação (campos adicionais):
```json
{
  "status": "aprovado",
  "meetingType": "online",
  "platform": "googlemeet",
  "preferredDate": "2025-10-15",
  "time": "14:00",
  "duration": "1h",
  "meetingLink": "https://meet.google.com/xxx-xxx-xxx",
  "notes": "Trazer apresentação em PDF",
  "scheduledAt": "2025-10-07T14:30:00Z"
}
```

## Estados do Pedido

1. **Pendente** - Aguardando análise
2. **Aprovado** - Reunião agendada
3. **Rejeitado** - Pedido não aprovado
4. **Cancelado** - Cancelado após aprovação (futuro)
5. **Concluído** - Reunião realizada (futuro)

## Permissões

### Usuário (Requerente):
- ✅ Criar pedido de audiência
- ✅ Ver seus próprios pedidos
- ✅ Anexar documentos
- ❌ Agendar reunião
- ❌ Aprovar/Rejeitar

### Atendente:
- ✅ Ver todos os pedidos
- ✅ Agendar reuniões
- ✅ Aprovar/Rejeitar
- ✅ Ver documentos anexados

### Administrador:
- ✅ Todas as permissões do atendente
- ✅ Gerenciar usuários
- ✅ Ver estatísticas e relatórios
- ✅ Configurações do sistema

## Próximas Melhorias

1. **Integração Real com Plataformas**
   - Google Meet API
   - Zoom API
   - Microsoft Graph API

2. **Calendário Visual**
   - Arrastar e soltar para reagendar
   - Visualização de disponibilidade
   - Conflitos de horário

3. **Lembretes Automáticos**
   - 24h antes da reunião
   - 1h antes da reunião
   - Para participantes

4. **Histórico e Relatórios**
   - Taxa de aprovação
   - Tempo médio de resposta
   - Motivos mais comuns
   - Reuniões por período

5. **Feedback Pós-Reunião**
   - Avaliação do requerente
   - Notas do atendente
   - Ações de follow-up

## Troubleshooting

### Usuário não consegue submeter pedido
- Verificar se todos os campos obrigatórios estão preenchidos
- Verificar conexão com internet
- Verificar se sessão não expirou

### Administrador não consegue agendar
- Verificar permissões do usuário
- Verificar se data não é no passado
- Verificar se plataforma foi selecionada (online) ou local (presencial)

### Notificações não são enviadas
- Verificar configuração SendGrid
- Verificar logs do servidor
- Verificar se email do usuário está correto

## Conclusão

O novo fluxo de pedidos de audiência simplifica significativamente a experiência do usuário e dá ao administrador o controle necessário para gerir eficientemente as reuniões. O sistema é flexível, escalável e pronto para integrações futuras com plataformas de videoconferência.
