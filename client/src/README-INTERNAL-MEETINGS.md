# Sistema de Reuniões Internas

## Visão Geral

O sistema de reuniões internas permite que administradores e atendentes possam agendar reuniões entre si e com membros da secretaria. Esta é uma funcionalidade voltada para organização interna da equipa.

## Funcionalidades

### 1. Agendamento de Reuniões
- **Participantes**: Admins, atendentes e secretaria
- **Seleção de Participante**: Escolha qualquer membro da equipa (exceto você mesmo)
- **Informações da Reunião**:
  - Título
  - Descrição/Agenda
  - Data e horário (início e fim)
  - Tipo: Presencial ou Online
  - Prioridade: Baixa, Normal, Alta, Urgente

### 2. Tipos de Reunião

#### Presencial
- Campo para informar o local (ex: Sala de Reuniões 1, Escritório Principal)

#### Online
- Seleção de plataforma (Zoom, Teams, Google Meet, Skype, WhatsApp, Outra)
- Campo para inserir link da reunião

### 3. Gestão de Reuniões

#### Status Disponíveis
- **Pendente**: Reunião criada, aguardando confirmação
- **Confirmado**: Reunião confirmada pelo organizador
- **Concluído**: Reunião realizada
- **Cancelado**: Reunião cancelada
- **Reagendado**: Reunião remarcada

#### Ações Disponíveis
- **Visualizar Detalhes**: Ver todas as informações da reunião
- **Confirmar**: Confirmar uma reunião pendente (apenas organizador)
- **Cancelar**: Cancelar uma reunião (apenas organizador)

### 4. Permissões

| Ação | Admin | Atendente | Secretaria |
|------|-------|-----------|------------|
| Criar Reunião | ✅ | ✅ | ✅ |
| Ver Suas Reuniões | ✅ | ✅ | ✅ |
| Confirmar Reunião | ✅ (próprias) | ✅ (próprias) | ✅ (próprias) |
| Cancelar Reunião | ✅ (próprias) | ✅ (próprias) | ✅ (próprias) |

## Configuração do Banco de Dados

### Passo 1: Executar a Migration

Execute o script SQL localizado em `/supabase/migrations/create-internal-meetings-table.sql` no seu banco de dados Supabase:

1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Cole o conteúdo do arquivo `create-internal-meetings-table.sql`
4. Execute o script

### Passo 2: Verificar a Tabela

A tabela `internal_meetings` deve ter sido criada com os seguintes campos:

```sql
- id (UUID, Primary Key)
- organizerId (UUID, Foreign Key -> users.id)
- participantId (UUID, Foreign Key -> users.id)
- title (TEXT)
- description (TEXT)
- meetingDate (DATE)
- startTime (TIME)
- endTime (TIME)
- meetingType (TEXT: 'presencial' ou 'online')
- location (TEXT)
- platform (TEXT)
- meetingLink (TEXT)
- priority (TEXT: 'baixa', 'normal', 'alta', 'urgente')
- status (TEXT: 'pendente', 'confirmado', 'concluido', 'cancelado', 'reagendado')
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Passo 3: Verificar Políticas RLS

As seguintes políticas foram criadas automaticamente:

1. **Visualização**: Usuários podem ver apenas reuniões onde são organizadores ou participantes
2. **Criação**: Apenas admins, atendentes e secretaria podem criar reuniões
3. **Atualização**: Apenas o organizador pode atualizar a reunião
4. **Exclusão**: Apenas o organizador pode deletar a reunião

## Integração com Notificações

Quando uma reunião é criada, o sistema automaticamente:

1. Insere um registro na tabela `internal_meetings`
2. Cria uma notificação para o participante na tabela `notifications`
3. O participante recebe uma notificação indicando que foi convidado para uma reunião

## Fluxo de Uso

### Para o Organizador:

1. Acesse "Reuniões Internas" no menu lateral
2. Preencha o formulário com:
   - Participante desejado
   - Título e descrição da reunião
   - Data e horários
   - Tipo de reunião e detalhes
   - Prioridade
3. Clique em "Agendar Reunião"
4. A reunião aparecerá na lista como "Pendente"
5. Você pode confirmar ou cancelar a reunião posteriormente

### Para o Participante:

1. Recebe uma notificação sobre a nova reunião
2. Acessa "Reuniões Internas" no menu lateral
3. Visualiza a reunião na aba "Pendentes"
4. Pode ver todos os detalhes clicando no ícone de olho
5. Aguarda a confirmação do organizador

## Componentes Criados

### 1. InternalMeetingForm
**Localização**: `/components/management/internal-meeting-form.tsx`
- Formulário para criar novas reuniões internas
- Validação de campos obrigatórios
- Carregamento dinâmico de usuários disponíveis
- Notificação automática do participante

### 2. InternalMeetingsList
**Localização**: `/components/management/internal-meetings-list.tsx`
- Lista de reuniões organizadas por status
- Tabs para filtrar: Todas, Pendentes, Confirmadas, Concluídas
- Visualização detalhada de cada reunião
- Ações de confirmação e cancelamento

### 3. InternalMeetings
**Localização**: `/components/management/internal-meetings.tsx`
- Componente principal que combina o formulário e a lista
- Layout responsivo em grid

## Próximas Melhorias Sugeridas

1. **Integração com Agenda**: Mostrar reuniões internas no calendário geral
2. **Lembretes**: Enviar lembretes automáticos antes da reunião
3. **Recorrência**: Permitir criar reuniões recorrentes
4. **Anexos**: Adicionar documentos/anexos às reuniões
5. **Ata de Reunião**: Campo para registrar notas após a reunião
6. **Convites Múltiplos**: Permitir convidar mais de um participante
7. **Sincronização de Calendário**: Exportar para Google Calendar, Outlook, etc.

## Suporte

Para dúvidas ou problemas:
1. Verifique se a tabela foi criada corretamente
2. Confirme que as políticas RLS estão ativas
3. Verifique os logs no console do navegador
4. Consulte a documentação do Supabase para troubleshooting
