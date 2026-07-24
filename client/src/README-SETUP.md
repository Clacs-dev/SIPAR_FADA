# Guia de Configuração e Execução Local

## 📋 Pré-requisitos

1. **Conta Supabase**
   - Crie uma conta gratuita em [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote o **Project ID**, **API URL**, **anon/public key** e **service_role key**

2. **Ambiente de Desenvolvimento**
   - Node.js 18+ ou navegador moderno
   - Editor de código (VS Code recomendado)

## ⚙️ Configuração Inicial

### 1. Configurar Variáveis de Ambiente no Supabase

Acesse o painel do Supabase e configure as seguintes variáveis de ambiente:

**No projeto Make (Figma Make):**
- As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` já estão configuradas automaticamente

**Variáveis adicionais necessárias:**
- `SENDGRID_API_KEY` - Para envio de emails (já configurada)

### 2. Atualizar info.tsx

Edite o arquivo `/utils/supabase/info.tsx` com suas credenciais:

```typescript
export const projectId = 'SEU_PROJECT_ID'; // Exemplo: 'xyzabc123def'
export const publicAnonKey = 'SUA_ANON_KEY'; // Começa com 'eyJ...'
```

### 3. Deploy da Edge Function (Servidor)

O servidor Hono já está configurado em `/supabase/functions/server/`.

**Para fazer deploy:**
1. Instale a CLI do Supabase:
```bash
npm install -g supabase
```

2. Faça login:
```bash
supabase login
```

3. Link com seu projeto:
```bash
supabase link --project-ref SEU_PROJECT_ID
```

4. Deploy da função:
```bash
supabase functions deploy make-server-8b82752b
```

## 🚀 Executando o Sistema

### Opção 1: Figma Make (Recomendado)
O sistema já está rodando no ambiente Figma Make. Basta:
1. Atualizar `/utils/supabase/info.tsx` com suas credenciais
2. O sistema iniciará automaticamente

### Opção 2: Desenvolvimento Local
1. Certifique-se de que o servidor está deployado no Supabase
2. Abra o projeto no navegador
3. O sistema se conectará ao servidor deployado

## 👥 Usuários de Demonstração

O sistema cria automaticamente 3 usuários de teste na primeira execução:

### Administrador
- **Email:** admin@sistema.com
- **Senha:** 123456
- **Permissões:** Acesso total ao sistema

### Atendente
- **Email:** atendente@sistema.com
- **Senha:** 123456
- **Permissões:** Gerenciar solicitações e agenda

### Usuário
- **Email:** usuario@empresa.com
- **Senha:** 123456
- **Permissões:** Criar cartas e pedidos de audiência

## 🔧 Resolução de Problemas

### Erro 401 (Não autorizado)

**Causas comuns:**
1. **Credenciais incorretas em info.tsx**
   - Verifique se `projectId` e `publicAnonKey` estão corretos
   
2. **Servidor não deployado**
   - Execute: `supabase functions deploy make-server-8b82752b`
   
3. **Variáveis de ambiente não configuradas**
   - Verifique no painel do Supabase se todas as variáveis estão definidas

**Solução:**
```typescript
// /utils/supabase/info.tsx
export const projectId = 'seu-project-id-correto';
export const publicAnonKey = 'sua-chave-anon-correta';
```

### Erro de Conexão

**Verificar:**
1. Abra o Console do navegador (F12)
2. Vá para a aba Network
3. Procure por requisições para `supabase.co/functions/v1/make-server-8b82752b`
4. Verifique o status da resposta

**Se retornar 404:**
- O servidor não está deployado. Execute o deploy da função.

**Se retornar 401:**
- Verifique as credenciais em info.tsx

**Se retornar 500:**
- Verifique os logs da função no painel do Supabase

### Sistema não Inicializa Usuários Demo

Execute manualmente a inicialização:
1. Abra o Console do navegador (F12)
2. Execute:
```javascript
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_ANON_KEY',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log)
```

### Erro de CORS

Se aparecer erro de CORS:
1. Verifique se o servidor tem `app.use("*", cors())` configurado
2. Redeploy o servidor: `supabase functions deploy make-server-8b82752b`

## 📱 Funcionalidades Principais

### 1. Dashboard
- Estatísticas em tempo real
- Gráficos de desempenho
- Visão geral das solicitações

### 2. Formulários
- **Carta de Apresentação:** Formulário completo com upload de documentos
- **Pedido de Audiência:** Formulário simplificado (usuário não define detalhes da reunião)

### 3. Gerenciamento (Admin/Atendente)
- Aprovar/Rejeitar solicitações
- **Agendar Audiências:** Modal específico para definir tipo, data, hora, duração
- Visualizar histórico completo

### 4. Agenda
- Calendário visual
- Lista de reuniões
- Integração com plataformas (Zoom, Teams, Google Meet)

### 5. Sistema de Mensagens
- Mensagens internas entre usuários
- Notificações em tempo real

### 6. Auditoria
- Log completo de todas as ações
- Rastreamento de mudanças
- Análise de segurança

## 📞 Formato de Telefone

O sistema usa o padrão angolano:
- **Formato:** +244 XXX XXX XXX
- **Exemplo:** +244 923 000 000
- Formatação automática no cadastro

## 🔐 Segurança

### Níveis de Permissão

**Administrador (admin):**
- Todas as permissões
- Gerenciar usuários
- Acessar auditoria
- Configurar sistema

**Atendente (attendant):**
- Visualizar todas as solicitações
- Aprovar/Rejeitar pedidos
- Agendar audiências
- Acessar agenda completa

**Usuário (user):**
- Criar cartas de apresentação
- Criar pedidos de audiência
- Visualizar próprias solicitações
- Enviar mensagens

### Proteção de Rotas

Todas as rotas do servidor verificam:
1. Presença do token de autenticação
2. Validade do token
3. Permissões do usuário

## 📊 Banco de Dados (KV Store)

O sistema usa a tabela KV Store do Supabase para armazenar:
- **user_profile:*** - Perfis de usuários
- **user_email_lookup:*** - Lookup de email para ID
- **presentation:*** - Cartas de apresentação
- **audience:*** - Pedidos de audiência
- **notification:*** - Notificações
- **message:*** - Mensagens internas
- **audit_log:*** - Logs de auditoria
- **document:*** - Metadados de documentos

## 🗂️ Storage (Arquivos)

Bucket: `make-8b82752b-documents`
- Criado automaticamente na inicialização
- Privado (apenas usuários autenticados)
- URLs assinadas para download seguro

## 🔄 Fluxo de Audiência

1. **Usuário cria pedido:**
   - Preenche motivo, descrição, dados pessoais
   - Upload de documento (opcional)
   - NÃO define detalhes da reunião

2. **Administrador revisa:**
   - Visualiza o pedido na lista de gerenciamento
   - Pode aprovar ou rejeitar

3. **Administrador agenda (após aprovação):**
   - Abre modal de agendamento
   - Define: tipo (online/presencial), data, hora, duração
   - Para reuniões online: adiciona plataforma e link
   - Para reuniões presenciais: adiciona local

4. **Usuário é notificado:**
   - Recebe notificação com detalhes da reunião
   - Pode visualizar na agenda

## 🎨 Personalização

### Cores e Tema
Edite `/styles/globals.css` para personalizar:
- Cores primárias e secundárias
- Tema escuro/claro
- Tipografia

### Componentes
Todos os componentes UI estão em `/components/ui/` usando shadcn/ui

## 📝 Logs e Debug

### Console do Navegador
- Logs de autenticação
- Erros de rede
- Status de inicialização

### Painel Supabase
- Logs da Edge Function
- Métricas de uso
- Erros do servidor

## 🆘 Suporte

### Problemas Comuns

1. **"No authorization token provided"**
   - Verifique se você está logado
   - Tente fazer logout e login novamente

2. **"User profile not found"**
   - Execute a inicialização do sistema
   - Verifique se os usuários demo foram criados

3. **"Server health check failed"**
   - Verifique se o servidor está deployado
   - Confirme se as variáveis de ambiente estão configuradas

### Limpeza e Reset

Para resetar completamente o sistema:

1. **Limpar KV Store:**
```javascript
// No console do navegador
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/admin/reset', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
})
```

2. **Reinicializar:**
- Recarregue a página
- O sistema criará novamente os usuários demo

## 🚀 Deploy em Produção

### Checklist
- [ ] Atualizar credenciais do Supabase
- [ ] Fazer deploy do servidor
- [ ] Configurar domínio personalizado (opcional)
- [ ] Ativar SSL/HTTPS
- [ ] Configurar backup automático
- [ ] Testar todas as funcionalidades
- [ ] Configurar SendGrid para emails em produção

### Monitoramento
- Use o painel do Supabase para monitorar:
  - Uso de recursos
  - Latência das requisições
  - Erros e exceções
  - Tráfego de usuários

## 📚 Documentação Adicional

- [README-AUTHENTICATION.md](./README-AUTHENTICATION.md) - Sistema de autenticação
- [README-AUDIENCE-WORKFLOW.md](./README-AUDIENCE-WORKFLOW.md) - Fluxo de audiências
- [README-DOCUMENT-UPLOAD.md](./README-DOCUMENT-UPLOAD.md) - Upload de documentos
- [README-USER-REGISTRATION.md](./README-USER-REGISTRATION.md) - Cadastro de usuários
- [README-ADVANCED-FEATURES.md](./README-ADVANCED-FEATURES.md) - Recursos avançados

## ✅ Verificação Final

Antes de usar o sistema, confirme:
- [x] Credenciais do Supabase configuradas em `info.tsx`
- [x] Servidor deployado com sucesso
- [x] Usuários demo criados (teste fazendo login)
- [x] Console do navegador sem erros críticos
- [x] Sistema de mensagens funcionando
- [x] Upload de documentos operacional

---

**Versão do Sistema:** 1.0.0  
**Última Atualização:** Outubro 2025  
**Suporte:** Sistema de gestão de audiências e apresentações para Angola
