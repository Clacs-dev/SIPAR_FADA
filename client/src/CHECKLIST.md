# ✅ Checklist de Configuração e Uso

## 📋 Configuração Inicial

### Passo 1: Criar Projeto Supabase
- [ ] Acessar [supabase.com](https://supabase.com)
- [ ] Criar conta ou fazer login
- [ ] Clicar em "New Project"
- [ ] Preencher nome do projeto
- [ ] Definir senha do banco
- [ ] Escolher região (mais próxima de Angola)
- [ ] Aguardar criação do projeto (1-2 min)

### Passo 2: Copiar Credenciais
- [ ] No painel, clicar em Settings ⚙️
- [ ] Clicar em API
- [ ] Copiar Project URL: `https://__________.supabase.co`
- [ ] Extrair Project ID (parte antes de .supabase.co): `__________`
- [ ] Copiar anon/public key (começa com `eyJ...`): `__________`

### Passo 3: Configurar Sistema
- [ ] Abrir arquivo `/utils/supabase/info.tsx`
- [ ] Colar Project ID
- [ ] Colar anon/public key
- [ ] Salvar arquivo (Ctrl+S ou Cmd+S)
- [ ] Confirmar que salvou

### Passo 4: Deploy do Servidor
- [ ] Abrir terminal
- [ ] Executar: `npm install -g supabase`
- [ ] Executar: `supabase login`
- [ ] Executar: `supabase link --project-ref SEU_PROJECT_ID`
- [ ] Executar: `supabase functions deploy make-server-8b82752b`
- [ ] Aguardar conclusão
- [ ] Verificar: `supabase functions list` (deve aparecer make-server-8b82752b)

### Passo 5: Testar
- [ ] Abrir Console do navegador (F12 > Console)
- [ ] Colar e executar script de health check
- [ ] Verificar resposta: `{status: "ok"}`
- [ ] Se falhar, revisar passos anteriores

---

## 🧪 Verificação do Sistema

### Teste 1: Health Check
```javascript
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/health')
  .then(r => r.json())
 .then(console.log);
```
- [ ] Retornou `{status: "ok"}`

### Teste 2: Inicialização
```javascript
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_ANON_KEY',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```
- [ ] Retornou `{success: true}`

### Teste 3: Login
```javascript
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/auth/login', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@sistema.com',
    password: '123456'
  })
})
.then(r => r.json())
.then(console.log);
```
- [ ] Retornou objeto com `user` e `session`

### Teste 4: Script Completo
- [ ] Abrir DIAGNOSTIC-SCRIPT.js
- [ ] Substituir credenciais no topo
- [ ] Colar no Console
- [ ] Todos os 6 testes passaram

---

## 🎯 Primeiro Acesso

### Login Inicial
- [ ] Abrir aplicação no navegador
- [ ] Ver tela de login
- [ ] Digitar: admin@sistema.com
- [ ] Digitar senha: 123456
- [ ] Clicar em "Entrar"
- [ ] Ver dashboard aparecer

### Explorar Dashboard
- [ ] Ver estatísticas
- [ ] Ver gráficos
- [ ] Ver menu lateral
- [ ] Navegar entre abas

---

## 📝 Testar Funcionalidades

### Criar Carta de Apresentação
- [ ] Menu lateral > Cartas de Apresentação
- [ ] Preencher todos os campos obrigatórios
- [ ] Nome da empresa
- [ ] Nome do contacto
- [ ] Email (formato válido)
- [ ] Telefone (+244 923 000 000)
- [ ] Finalidade
- [ ] Área de negócio
- [ ] Upload de documento (opcional)
- [ ] Clicar em "Enviar Solicitação"
- [ ] Ver mensagem de sucesso

### Criar Pedido de Audiência
- [ ] Menu lateral > Pedidos de Audiência
- [ ] Preencher dados da empresa
- [ ] Preencher dados do contacto
- [ ] Preencher motivo
- [ ] Preencher descrição detalhada
- [ ] Upload de documento (opcional)
- [ ] Clicar em "Enviar Pedido"
- [ ] Ver mensagem de sucesso

### Gerenciar Solicitações (como Admin)
- [ ] Menu lateral > Gerenciamento
- [ ] Ver lista de solicitações
- [ ] Clicar em uma solicitação
- [ ] Ver detalhes completos
- [ ] Testar aprovar
- [ ] Testar rejeitar

### Agendar Audiência (como Admin)
- [ ] Ir para Gerenciamento > Pedidos de Audiência
- [ ] Encontrar pedido aprovado
- [ ] Clicar no ícone de calendário
- [ ] Ver modal de agendamento abrir
- [ ] Escolher tipo (Online ou Presencial)
- [ ] Definir data e hora
- [ ] Definir duração
- [ ] Se online: adicionar plataforma e link
- [ ] Se presencial: adicionar local
- [ ] Adicionar notas
- [ ] Clicar em "Agendar Reunião"
- [ ] Ver confirmação

### Visualizar Agenda
- [ ] Menu lateral > Agenda
- [ ] Ver calendário
- [ ] Ver lista de reuniões
- [ ] Clicar em uma reunião
- [ ] Ver detalhes completos
- [ ] Ver link de reunião (se online)

### Sistema de Mensagens
- [ ] Menu lateral > Mensagens
- [ ] Criar nova mensagem
- [ ] Selecionar destinatário
- [ ] Digitar mensagem
- [ ] Enviar
- [ ] Ver confirmação

### Gerenciar Usuários (como Admin)
- [ ] Menu lateral > Usuários
- [ ] Ver lista de usuários
- [ ] Clicar em "Adicionar Usuário"
- [ ] Preencher formulário
- [ ] Nome completo
- [ ] Email válido
- [ ] Senha (mínimo 6 caracteres)
- [ ] Tipo (Usuário ou Atendente)
- [ ] Organização
- [ ] Telefone (+244 XXX XXX XXX)
- [ ] NIF/BI
- [ ] Criar usuário
- [ ] Ver na lista

---

## 🔐 Testar Permissões

### Como Atendente
- [ ] Fazer logout
- [ ] Login com: atendente@sistema.com / 123456
- [ ] Verificar acesso a Gerenciamento: ✅
- [ ] Verificar acesso a Agendar: ✅
- [ ] Verificar acesso a Agenda: ✅
- [ ] Verificar acesso a Usuários: ❌ (deve negar)
- [ ] Verificar acesso a Auditoria: ❌ (deve negar)

### Como Usuário
- [ ] Fazer logout
- [ ] Login com: usuario@empresa.com / 123456
- [ ] Verificar acesso a Cartas: ✅
- [ ] Verificar acesso a Pedidos: ✅
- [ ] Verificar acesso a Minhas Solicitações: ✅
- [ ] Verificar acesso a Gerenciamento: ❌ (deve negar)
- [ ] Verificar acesso a Usuários: ❌ (deve negar)

---

## 📊 Auditoria e Logs

### Verificar Auditoria (como Admin)
- [ ] Login como admin
- [ ] Menu lateral > Configurações
- [ ] Clicar em card de Auditoria
- [ ] Ver logs de ações
- [ ] Ver filtros funcionando
- [ ] Ver detalhes de cada ação

### Verificar Notificações
- [ ] Menu lateral > Configurações
- [ ] Clicar em card de Notificações
- [ ] Ver histórico de emails
- [ ] Ver status de envio

---

## 🌐 Verificar Responsividade

### Desktop
- [ ] Tela completa funciona
- [ ] Menu lateral visível
- [ ] Gráficos renderizam
- [ ] Formulários legíveis

### Tablet
- [ ] Redimensionar janela
- [ ] Menu colapsa/expande
- [ ] Layout se adapta
- [ ] Funcionalidades mantêm

### Mobile
- [ ] Janela pequena (360px)
- [ ] Menu hamburguer funciona
- [ ] Formulários usáveis
- [ ] Botões clicáveis

---

## 🔄 Fluxo Completo de Audiência

### Etapa 1: Solicitação (Usuário)
- [ ] Login como usuário
- [ ] Criar pedido de audiência
- [ ] Preencher motivo e descrição
- [ ] Upload de documento
- [ ] Enviar pedido
- [ ] Ver confirmação

### Etapa 2: Revisão (Admin)
- [ ] Login como admin
- [ ] Ir para Gerenciamento
- [ ] Ver novo pedido na lista
- [ ] Abrir detalhes
- [ ] Revisar informações
- [ ] Aprovar pedido

### Etapa 3: Agendamento (Admin)
- [ ] Pedido aprovado
- [ ] Clicar em ícone de calendário
- [ ] Abrir modal de agendamento
- [ ] Escolher tipo de reunião
- [ ] Definir data e hora
- [ ] Adicionar link/local
- [ ] Salvar agendamento

### Etapa 4: Confirmação (Sistema)
- [ ] Usuário recebe notificação
- [ ] Email enviado (se configurado)
- [ ] Reunião aparece na agenda
- [ ] Status atualizado

### Etapa 5: Visualização (Usuário)
- [ ] Login como usuário
- [ ] Ir para Minhas Solicitações
- [ ] Ver pedido com status "Agendado"
- [ ] Ver detalhes da reunião
- [ ] Ver data, hora, link/local

---

## 🚀 Preparação para Produção

### Segurança
- [ ] Mudar senhas dos usuários demo
- [ ] Criar usuários admin reais
- [ ] Remover ou desativar contas demo
- [ ] Habilitar RLS no banco
- [ ] Configurar políticas de acesso

### Emails
- [ ] Criar conta no SendGrid
- [ ] Obter API Key
- [ ] Configurar no Supabase (Secrets)
- [ ] Testar envio de email
- [ ] Verificar templates

### Personalização
- [ ] Mudar cores em globals.css
- [ ] Substituir logo em /public/
- [ ] Ajustar textos se necessário
- [ ] Configurar tema claro/escuro

### Domínio
- [ ] Configurar domínio personalizado (opcional)
- [ ] Configurar SSL/HTTPS
- [ ] Atualizar URL Configuration no Supabase

### Backup
- [ ] Configurar backup automático
- [ ] Testar restauração
- [ ] Documentar processo

### Monitoramento
- [ ] Configurar alertas no Supabase
- [ ] Monitorar logs de erro
- [ ] Monitorar uso de recursos
- [ ] Configurar métricas

---

## 📞 Resolução de Problemas

### Se Health Check Falha
- [ ] Verificar credenciais em info.tsx
- [ ] Confirmar deploy do servidor
- [ ] Verificar URL do projeto
- [ ] Tentar redeploy

### Se Login Falha
- [ ] Executar inicialização
- [ ] Verificar console para erros
- [ ] Confirmar usuários foram criados
- [ ] Testar com credenciais corretas

### Se Upload Falha
- [ ] Verificar bucket foi criado
- [ ] Confirmar permissões
- [ ] Verificar tamanho do arquivo
- [ ] Ver logs do servidor

### Se Emails Não Enviam
- [ ] Verificar SendGrid configurado
- [ ] Confirmar API Key válida
- [ ] Testar API Key separadamente
- [ ] Ver logs de email

---

## ✅ Sistema 100% Funcional

Marque quando tudo estiver OK:

- [ ] ✅ Health Check passa
- [ ] ✅ Todos os 6 testes do diagnóstico passam
- [ ] ✅ Login funciona para todos os usuários
- [ ] ✅ Criar carta funciona
- [ ] ✅ Criar pedido funciona
- [ ] ✅ Aprovar/Rejeitar funciona
- [ ] ✅ Agendar reunião funciona
- [ ] ✅ Agenda exibe corretamente
- [ ] ✅ Upload de documentos funciona
- [ ] ✅ Sistema de mensagens funciona
- [ ] ✅ Permissões funcionam corretamente
- [ ] ✅ Responsivo em todos os tamanhos
- [ ] ✅ Notificações funcionam
- [ ] ✅ Auditoria registra ações
- [ ] ✅ Sem erros no console

---

## 🎯 Conclusão

**Se todos os itens estão marcados:**
🎉 **PARABÉNS! Sistema está pronto para uso!**

**Se algo falhou:**
📖 Consulte:
- TROUBLESHOOTING-401.md para erros
- CHECK-SYSTEM.md para verificação
- README-SETUP.md para configuração

---

**Última verificação:** ____/____/____  
**Por:** _________________________  
**Status:** [ ] OK  [ ] Pendente  [ ] Com problemas

**Observações:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Versão:** 1.0.0  
**Sistema:** Gestão de Audiências para Angola  
**Data:** Outubro 2025
