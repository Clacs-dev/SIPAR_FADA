# Sistema de Gestão de Audiências e Apresentações

> Sistema completo para gestão de apresentações e pedidos de audiência para entidades públicas e privadas em Angola

## 📋 Sobre o Sistema

Sistema moderno e responsivo desenvolvido em React + TypeScript com backend Supabase que automatiza todo o fluxo desde a submissão de cartas de apresentação até a marcação e acompanhamento de reuniões.

### ✨ Principais Funcionalidades

- 📝 **Cartas de Apresentação** - Formulários completos com upload de documentos
- 🤝 **Pedidos de Audiência** - Solicitações simplificadas sem definição de detalhes de reunião
- 📅 **Agendamento de Reuniões** - Modal administrativo para definir tipo, data, hora e duração
- 👥 **Gestão de Usuários** - Sistema de permissões com 3 níveis (Admin, Atendente, Usuário)
- 📊 **Dashboard** - Estatísticas e gráficos em tempo real
- 💬 **Mensagens Internas** - Comunicação entre usuários do sistema
- 📧 **Notificações** - Sistema de emails e notificações push
- 🔍 **Auditoria** - Log completo de todas as ações do sistema
- 🗂️ **Upload de Documentos** - Armazenamento seguro com URLs assinadas
- 🌍 **Adaptado para Angola** - Formato de telefone (+244), NIF/BI, terminologia local

## 🚀 Início Rápido (5 minutos)

### 1. Obter Credenciais

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie **Project ID** e **anon/public key**

### 2. Configurar Sistema

Edite `/utils/supabase/info.tsx`:

```typescript
export const projectId = 'seu-project-id-aqui';
export const publicAnonKey = 'sua-chave-anon-aqui';
```

### 3. Deploy do Servidor

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase functions deploy make-server-8b82752b
```

### 4. Testar

Abra o console do navegador (F12) e execute:

```javascript
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/health')
  .then(r => r.json())
 .then(console.log);
```

### 5. Fazer Login

Use um dos usuários demo:

- **Admin:** admin@sistema.com / 123456
- **Atendente:** atendente@sistema.com / 123456
- **Usuário:** usuario@empresa.com / 123456

**📖 Guia completo:** [QUICK-START.md](./QUICK-START.md)

## 📚 Documentação

### Guias de Configuração
- **[QUICK-START.md](./QUICK-START.md)** - Início rápido em 5 minutos
- **[README-SETUP.md](./README-SETUP.md)** - Configuração completa e detalhada
- **[CHECK-SYSTEM.md](./CHECK-SYSTEM.md)** - Verificação e testes do sistema
- **[TROUBLESHOOTING-401.md](./TROUBLESHOOTING-401.md)** - Resolver erros de autenticação

### Guias de Funcionalidades
- **[README-AUTHENTICATION.md](./README-AUTHENTICATION.md)** - Sistema de autenticação
- **[README-AUDIENCE-WORKFLOW.md](./README-AUDIENCE-WORKFLOW.md)** - Fluxo de audiências
- **[README-USER-REGISTRATION.md](./README-USER-REGISTRATION.md)** - Cadastro de usuários
- **[README-DOCUMENT-UPLOAD.md](./README-DOCUMENT-UPLOAD.md)** - Upload de documentos
- **[README-ADVANCED-FEATURES.md](./README-ADVANCED-FEATURES.md)** - Recursos avançados

## 🏗️ Arquitetura

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS 4.0** para estilização
- **shadcn/ui** para componentes
- **Supabase Client** para autenticação
- **Lucide React** para ícones
- **Recharts** para gráficos

### Backend
- **Supabase Edge Functions** (Deno)
- **Hono** como framework web
- **KV Store** para persistência de dados
- **Supabase Storage** para arquivos
- **Supabase Auth** para autenticação

### Estrutura de Dados

```
kv_store_8b82752b/
├── user_profile:*          # Perfis de usuários
├── user_email_lookup:*     # Lookup email -> ID
├── presentation:*          # Cartas de apresentação
├── audience:*              # Pedidos de audiência
├── notification:*          # Notificações
├── message:*               # Mensagens internas
├── audit_log:*             # Logs de auditoria
└── document:*              # Metadados de documentos
```

## 👥 Níveis de Permissão

### Administrador (admin)
- ✅ Todas as permissões
- ✅ Gerenciar usuários
- ✅ Acessar auditoria
- ✅ Configurar sistema
- ✅ Agendar audiências
- ✅ Aprovar/Rejeitar solicitações

### Atendente (attendant)
- ✅ Visualizar todas as solicitações
- ✅ Aprovar/Rejeitar pedidos
- ✅ Agendar audiências
- ✅ Acessar agenda completa
- ❌ Gerenciar usuários
- ❌ Acessar auditoria

### Usuário (user)
- ✅ Criar cartas de apresentação
- ✅ Criar pedidos de audiência
- ✅ Visualizar próprias solicitações
- ✅ Enviar mensagens
- ❌ Visualizar solicitações de outros
- ❌ Aprovar/Rejeitar
- ❌ Agendar reuniões

## 🔄 Fluxo de Audiência

### Novo Fluxo (Implementado)

1. **Usuário cria pedido**
   - Preenche apenas: motivo, descrição, dados pessoais
   - NÃO define detalhes da reunião
   - Upload de documento (opcional)

2. **Admin/Atendente revisa**
   - Visualiza pedido na lista de gerenciamento
   - Pode aprovar ou rejeitar

3. **Admin/Atendente agenda** (após aprovação)
   - Abre modal de agendamento
   - Define: tipo (online/presencial), data, hora, duração
   - Para online: adiciona plataforma e link
   - Para presencial: adiciona local

4. **Usuário é notificado**
   - Recebe notificação com detalhes
   - Visualiza na agenda

### Fluxo Anterior (Removido)

~~Usuário definia data, hora e tipo de reunião no formulário~~ ❌

## 📱 Componentes Principais

```
/components
├── auth/                   # Autenticação
│   ├── auth-context.tsx    # Context de autenticação
│   ├── login-form.tsx      # Formulário de login
│   └── register-form.tsx   # Formulário de cadastro
├── dashboard/              # Dashboard
│   └── overview.tsx        # Visão geral
├── forms/                  # Formulários
│   ├── audience-form.tsx   # Pedido de audiência
│   ├── presentation-form.tsx # Carta de apresentação
│   └── document-upload.tsx # Upload de documentos
├── management/             # Gerenciamento
│   ├── requests-list.tsx   # Lista de solicitações
│   ├── schedule-meeting-dialog.tsx # Modal de agendamento
│   └── user-management.tsx # Gestão de usuários
├── schedule/               # Agenda
│   └── agenda.tsx          # Calendário e reuniões
└── messaging/              # Mensagens
    └── messaging-center.tsx # Centro de mensagens
```

## 🔧 Tecnologias

### Frontend
- React 18
- TypeScript
- Tailwind CSS 4.0
- shadcn/ui
- Lucide Icons
- Recharts
- React Hook Form
- Zod (validação)
- date-fns (datas)
- Sonner (toast notifications)

### Backend
- Supabase Edge Functions
- Hono (framework web)
- Deno runtime
- SendGrid (emails)

### Banco de Dados
- Supabase KV Store
- Supabase Storage
- Supabase Auth

## 🌍 Localização Angola

### Formato de Telefone
- **Padrão:** +244 XXX XXX XXX
- **Exemplo:** +244 923 000 000
- Formatação automática no cadastro
- Validação no frontend e backend

### Documento de Identificação
- **NIF/BI** em vez de CPF/CNPJ
- Validação adaptada

### Terminologia
- Terminologia portuguesa/europeia
- Adaptações culturais para Angola

## 🔐 Segurança

### Autenticação
- JWT tokens via Supabase Auth
- Refresh tokens automáticos
- Session management
- Logout seguro

### Autorização
- Verificação de permissões em todas as rotas
- Middleware de autenticação no servidor
- Validação de tokens

### Storage
- Buckets privados
- URLs assinadas com expiração
- Upload seguro via servidor

### Auditoria
- Log de todas as ações
- Rastreamento de IP e User Agent
- Histórico de mudanças
- Análise de segurança

## 📊 Métricas e Monitoramento

### Dashboard
- Total de solicitações
- Taxa de aprovação
- Reuniões agendadas
- Tempo médio de resposta
- Gráficos de tendências

### Auditoria
- Logs de login/logout
- Criação/modificação de dados
- Aprovações/Rejeições
- Envio de emails
- Upload de arquivos

## 🚢 Deploy em Produção

### Checklist
- [ ] Atualizar credenciais do Supabase
- [ ] Fazer deploy do servidor
- [ ] Configurar variáveis de ambiente
- [ ] Configurar SendGrid para emails
- [ ] Mudar senhas dos usuários demo
- [ ] Criar usuários admin reais
- [ ] Configurar domínio personalizado
- [ ] Ativar SSL/HTTPS
- [ ] Habilitar RLS no banco
- [ ] Configurar backup automático
- [ ] Testar todas as funcionalidades
- [ ] Monitorar logs e métricas

### Monitoramento
Use o painel do Supabase para monitorar:
- Uso de recursos
- Latência das requisições
- Erros e exceções
- Tráfego de usuários
- Uso de storage

## 🆘 Problemas Comuns

### Erro 401 - Não autorizado
**Solução:** Consulte [TROUBLESHOOTING-401.md](./TROUBLESHOOTING-401.md)

### Erro 404 - Servidor não encontrado
**Causa:** Servidor não deployado
**Solução:** `supabase functions deploy make-server-8b82752b`

### Usuários não criados
**Solução:** Execute inicialização no console:
```javascript
fetch('https://PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ANON_KEY',
    'Content-Type': 'application/json'
  }
})
```

### Erro de CORS
**Causa:** CORS não configurado
**Solução:** Verifique `app.use("*", cors())` e redeploy

## 📝 Exemplo de Uso

### 1. Usuário cria pedido

```typescript
// Usuário preenche formulário
const pedido = {
  companyName: 'Empresa XYZ Lda',
  contactName: 'João Silva',
  position: 'Diretor Geral',
  email: 'joao@empresa.com',
  phone: '+244 923 456 789',
  reason: 'Parceria Comercial',
  description: 'Interesse em estabelecer parceria...',
  document: File // Upload opcional
};
```

### 2. Admin agenda reunião

```typescript
// Admin abre modal e define detalhes
const reuniao = {
  meetingType: 'online',
  date: '2025-10-15',
  time: '14:00',
  duration: '1h',
  platform: 'Zoom',
  meetingLink: 'https://zoom.us/j/123456',
  notes: 'Preparar apresentação institucional'
};
```

### 3. Sistema notifica

```typescript
// Sistema envia notificação automática
{
  to: 'joao@empresa.com',
  subject: 'Audiência Agendada',
  type: 'Reunião Online',
  date: '15/10/2025 às 14:00',
  platform: 'Zoom',
  link: 'https://zoom.us/j/123456'
}
```

## 🎨 Personalização

### Cores e Tema
Edite `/styles/globals.css` para personalizar cores, tema escuro/claro e tipografia.

### Componentes
Todos os componentes UI estão em `/components/ui/` usando shadcn/ui.

### Logo e Branding
Substitua os arquivos em `/public/`:
- `icon-192x192.png`
- `badge-72x72.png`

## 🤝 Contribuindo

Este é um sistema personalizado para gestão de audiências em Angola. Para modificações:

1. Fork o projeto
2. Crie branch para feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para branch (`git push origin feature/NovaFuncionalidade`)
5. Abra Pull Request

## 📄 Licença

Este projeto é proprietário e desenvolvido para uso específico em Angola.

## 📞 Suporte

Para dúvidas e suporte:
1. Consulte a documentação em `/README-*.md`
2. Execute verificação em [CHECK-SYSTEM.md](./CHECK-SYSTEM.md)
3. Veja troubleshooting em [TROUBLESHOOTING-401.md](./TROUBLESHOOTING-401.md)

## 🎯 Roadmap

### Futuras Funcionalidades
- [ ] Integração com calendários (Google Calendar, Outlook)
- [ ] Relatórios em PDF
- [ ] Exportação de dados
- [ ] Dashboard personalizado por usuário
- [ ] Notificações SMS
- [ ] App mobile
- [ ] Videochamada integrada
- [ ] Assinatura digital de documentos

## ⭐ Recursos Destacados

- ✅ **100% Responsivo** - Funciona em desktop, tablet e mobile
- ✅ **Tempo Real** - Notificações e atualizações instantâneas
- ✅ **Seguro** - Autenticação robusta e auditoria completa
- ✅ **Escalável** - Arquitetura serverless com Supabase
- ✅ **Moderno** - React 18 + TypeScript + Tailwind 4.0
- ✅ **Localizado** - Adaptado para Angola

---

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Desenvolvido para:** Gestão de Audiências e Apresentações em Angola  

**Começar agora:** [QUICK-START.md](./QUICK-START.md) 🚀
