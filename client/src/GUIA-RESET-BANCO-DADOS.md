# Guia Completo: Reset do Banco de Dados

## 📋 Visão Geral

O sistema agora possui uma funcionalidade completa de **Reset do Banco de Dados** que permite aos administradores limpar todos os dados de teste e começar do zero.

## 🔐 Acesso

**Apenas Administradores** têm acesso a esta funcionalidade.

### Como Acessar:

1. Faça login como **Administrador**
2. No menu lateral, clique em **"Gestão do Banco de Dados"**
3. Você verá a tela de gerenciamento com estatísticas e opções de reset

## 📊 Estatísticas do Banco de Dados

A tela exibe em tempo real:

- **Cartas de Apresentação**: Número de cartas submetidas
- **Pedidos de Audiência**: Número de pedidos criados
- **Mensagens**: Total de mensagens trocadas
- **Logs de Auditoria**: Registros de ações no sistema
- **Usuários**: Contas criadas no sistema
- **Total de Registros**: Soma de todos os dados no KV Store

## 🗑️ Opções de Reset

### 1. **Manter Todos os Usuários**
- ✅ Se marcado: Todos os usuários (incluindo registros criados manualmente) serão mantidos
- ❌ Se desmarcado: Usuários serão deletados conforme opção 2

### 2. **Manter Apenas Usuários Demo**
- ✅ Se marcado: Mantém apenas os 3 usuários demo padrão
  - `admin@exemplo.ao` (senha: admin123)
  - `atendente@exemplo.ao` (senha: atendente123)
  - `usuario@exemplo.ao` (senha: usuario123)
- ❌ Se desmarcado: Deleta TODOS os usuários

**Nota:** Esta opção fica desabilitada se "Manter Todos os Usuários" estiver marcada.

### 3. **Limpar Storage**
- ✅ Se marcado: Deleta todos os documentos enviados (PDFs, etc.)
- ❌ Se desmarcado: Mantém os documentos no storage

## 🔄 Como Realizar o Reset

### Passo a Passo:

1. **Selecione as Opções**
   - Marque/desmarque as opções conforme desejado
   - Revise cuidadosamente suas escolhas

2. **Clique em "Resetar Banco de Dados"**
   - Um diálogo de confirmação aparecerá

3. **Revise o que Será Deletado**
   - O sistema mostra exatamente quantos registros de cada tipo serão deletados
   - Exemplos:
     - "Todas as 15 cartas de apresentação"
     - "Todos os 8 pedidos de audiência"
     - "Todas as 42 mensagens"

4. **Digite "RESETAR" para Confirmar**
   - No campo de texto, digite exatamente: **RESETAR**
   - Isto é uma medida de segurança adicional

5. **Clique em "Confirmar Reset"**
   - O processo começará imediatamente
   - Você verá uma mensagem de "Resetando..."

6. **Aguarde a Conclusão**
   - O processo pode levar alguns segundos
   - Uma notificação de sucesso aparecerá quando concluído

7. **Revise os Resultados**
   - Um card verde mostrará:
     - Quantos registros foram deletados de cada tipo
     - Se o storage foi limpo
     - Se usuários demo foram recriados
     - Eventuais erros (se houver)

## ⚙️ O Que Acontece Durante o Reset

### Processo Interno:

1. **Deletar Apresentações**
   - Remove todas as cartas de apresentação
   - Prefixo no KV: `presentation_*`

2. **Deletar Audiências**
   - Remove todos os pedidos de audiência
   - Prefixo no KV: `audience_*`

3. **Deletar Mensagens**
   - Remove todo o histórico de mensagens
   - Prefixo no KV: `message:*`

4. **Deletar Logs de Auditoria**
   - Remove todos os logs de auditoria
   - Prefixo no KV: `audit:*`

5. **Deletar Usuários** (opcional)
   - Remove usuários do KV Store
   - Remove usuários do Supabase Auth
   - Mantém usuários demo se solicitado
   - Prefixos no KV: `user_profile:*`, `user_email_lookup:*`

6. **Limpar Storage** (opcional)
   - Remove todos os arquivos do bucket
   - Bucket: `make-8b82752b-documents`

7. **Recriar Usuários Demo** (se necessário)
   - Recria os 3 usuários demo padrão
   - Com suas senhas e permissões originais

8. **Registrar Auditoria**
   - Cria log crítico da ação de reset
   - Registra quem fez o reset e quando
   - Registra quantos itens foram deletados

## 🎯 Cenários de Uso Comuns

### Cenário 1: Limpar Tudo para Testes Limpos
```
✅ Manter Todos os Usuários: NÃO
✅ Manter Apenas Usuários Demo: SIM
✅ Limpar Storage: SIM
```
**Resultado:** Sistema volta ao estado inicial com apenas usuários demo.

### Cenário 2: Limpar Dados mas Manter Usuários Reais
```
✅ Manter Todos os Usuários: SIM
✅ Manter Apenas Usuários Demo: N/A (desabilitado)
✅ Limpar Storage: SIM
```
**Resultado:** Deleta apresentações, audiências, mensagens, mas mantém todos os usuários cadastrados.

### Cenário 3: Limpar Apenas Mensagens e Logs
```
✅ Manter Todos os Usuários: SIM
✅ Manter Apenas Usuários Demo: N/A (desabilitado)
✅ Limpar Storage: NÃO
```
**Resultado:** Deleta apresentações, audiências, mensagens e logs, mas mantém usuários e documentos.

### Cenário 4: Reset Completo (Cuidado!)
```
✅ Manter Todos os Usuários: NÃO
✅ Manter Apenas Usuários Demo: NÃO
✅ Limpar Storage: SIM
```
**Resultado:** Deleta TUDO, incluindo TODOS os usuários. Sistema fica completamente vazio.

## ⚠️ Avisos Importantes

### ⛔ ATENÇÃO - Ação Irreversível!

- O reset do banco de dados **NÃO PODE SER DESFEITO**
- Todos os dados deletados são **PERMANENTEMENTE PERDIDOS**
- Não há backup automático antes do reset
- **SEMPRE** revise cuidadosamente antes de confirmar

### 🔒 Medidas de Segurança Implementadas

1. **Apenas Administradores** podem acessar
2. **Diálogo de Confirmação** obrigatório
3. **Digitação Manual** de "RESETAR" necessária
4. **Prévia Clara** do que será deletado
5. **Log de Auditoria** de todas as ações de reset
6. **Token de Autenticação** validado no servidor

### 📝 Recomendações

1. **Antes do Reset:**
   - Certifique-se de que deseja realmente deletar os dados
   - Verifique se há algum dado importante
   - Anote credenciais de usuários se não mantê-los
   - Considere exportar dados importantes (se aplicável)

2. **Durante o Reset:**
   - Aguarde a conclusão completa
   - Não feche o navegador
   - Não faça logout durante o processo

3. **Após o Reset:**
   - Revise os resultados mostrados
   - Verifique se há erros reportados
   - Teste o login com usuários demo (se recriados)
   - Verifique que o sistema está limpo

## 🔧 Integração com Backend

### Endpoints da API:

#### 1. Obter Estatísticas
```
GET /make-server-8b82752b/admin/database/stats
Authorization: Bearer {admin_token}
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "presentations": 15,
    "audiences": 8,
    "messages": 42,
    "audits": 156,
    "users": 7,
    "total": 228
  }
}
```

#### 2. Resetar Banco de Dados
```
POST /make-server-8b82752b/admin/database/reset
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "keepUsers": false,
  "keepDemoUsers": true,
  "resetStorage": true
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Database reset successfully",
  "results": {
    "presentationsDeleted": 15,
    "audiencesDeleted": 8,
    "messagesDeleted": 42,
    "auditsDeleted": 156,
    "usersDeleted": 4,
    "storageCleared": true,
    "demoUsersRecreated": true,
    "errors": []
  }
}
```

**Resposta de Erro:**
```json
{
  "success": false,
  "error": "Error message",
  "results": {
    "presentationsDeleted": 10,
    "audiencesDeleted": 0,
    "errors": ["Error detail 1", "Error detail 2"]
  }
}
```

## 🛡️ Segurança

### Validações no Backend:

1. **Autenticação**: Token JWT válido
2. **Autorização**: Usuário deve ser Admin
3. **Auditoria**: Toda ação é registrada com:
   - ID do administrador
   - Email do administrador
   - Timestamp da ação
   - Opções selecionadas
   - Resultados da operação
4. **Nível de Log**: `critical` (máxima prioridade)

### Arquivos Modificados:

- **Backend:**
  - `/supabase/functions/server/database-reset.tsx` (NOVO)
  - `/supabase/functions/server/index.tsx` (rotas adicionadas)

- **Frontend:**
  - `/components/admin/database-management.tsx` (NOVO)
  - `/components/auth/permissions.tsx` (item de menu)
  - `/components/layout/sidebar.tsx` (ícone Database)
  - `/App.tsx` (rota adicionada)

## 📊 Logs e Auditoria

Toda ação de reset é registrada no sistema de auditoria com:

```typescript
{
  action: 'database_reset',
  level: 'critical',
  details: {
    keepUsers: false,
    keepDemoUsers: true,
    resetStorage: true,
    presentationsDeleted: 15,
    audiencesDeleted: 8,
    messagesDeleted: 42,
    auditsDeleted: 156,
    usersDeleted: 4,
    storageCleared: true,
    demoUsersRecreated: true,
    errors: []
  },
  metadata: {
    userId: "admin-user-id",
    userEmail: "admin@exemplo.ao",
    userRole: "admin",
    success: true
  }
}
```

## 🎓 Casos de Uso

### Para Desenvolvimento:
- Limpar dados de teste entre iterações
- Resetar para estado inicial após testes
- Criar ambiente limpo para demonstrações

### Para Testes:
- Preparar ambiente para testes automatizados
- Garantir estado limpo antes de cada suite de testes
- Validar comportamento com banco vazio

### Para Produção:
- ⚠️ **NÃO RECOMENDADO** em ambiente de produção
- Se necessário, criar backup manual primeiro
- Considerar migração em vez de reset

## ❓ FAQ

### P: Posso desfazer um reset?
**R:** Não. O reset é permanente e irreversível. Sempre confirme antes de executar.

### P: O reset afeta a estrutura do banco?
**R:** Não. Apenas os dados são deletados. A estrutura (tabelas, buckets) permanece intacta.

### P: Posso fazer reset parcial?
**R:** Sim! Use as opções para controlar o que será deletado.

### P: Quanto tempo leva o reset?
**R:** Geralmente entre 2-10 segundos, dependendo da quantidade de dados.

### P: O que acontece se houver erro durante reset?
**R:** O sistema tenta completar o máximo possível e reporta os erros. Dados podem ficar parcialmente deletados.

### P: Usuários demo têm sempre as mesmas senhas?
**R:** Sim. Após recriar, as senhas são sempre:
- admin@exemplo.ao: `admin123`
- atendente@exemplo.ao: `atendente123`
- usuario@exemplo.ao: `usuario123`

### P: Posso fazer reset via API programaticamente?
**R:** Sim, use o endpoint POST com token de admin.

## 🎉 Pronto!

Agora você tem acesso completo à funcionalidade de Reset do Banco de Dados. Use com cuidado e sempre confirme suas ações!

---

**Última Atualização:** 09/01/2025
**Versão:** 1.0.0
