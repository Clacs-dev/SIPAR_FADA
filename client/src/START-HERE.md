# 🚀 COMECE AQUI - Sistema de Audiências

> **Bem-vindo!** Este é o guia de início para configurar e usar o sistema.

## 📌 O que é este sistema?

Sistema completo de gestão de **apresentações** e **pedidos de audiência** para entidades públicas e privadas em Angola. Desenvolvido com React, TypeScript e Supabase.

## ⚡ Início Rápido (3 passos)

### 1️⃣ Configurar Credenciais (1 minuto)

Edite `/utils/supabase/info.tsx`:

```typescript
export const projectId = 'SEU_PROJECT_ID';
export const publicAnonKey = 'SUA_CHAVE_ANON';
```

**Como obter:**
- Acesse [supabase.com](https://supabase.com)
- Crie projeto > Settings > API
- Copie Project ID e anon key

### 2️⃣ Deploy do Servidor (2 minutos)

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase functions deploy make-server-8b82752b
```

### 3️⃣ Testar (30 segundos)

Console do navegador (F12):

```javascript
fetch('https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/health')
  .then(r => r.json())
 .then(console.log);
```

**✅ Pronto!** Faça login com:
- Email: `admin@sistema.com`
- Senha: `123456`

---

## 📚 Guias Disponíveis

### 🎯 Para Começar
1. **[INSTRUCTIONS.txt](./INSTRUCTIONS.txt)** ⭐ - Guia visual completo
2. **[QUICK-START.md](./QUICK-START.md)** - Passo a passo rápido
3. **[README-SETUP.md](./README-SETUP.md)** - Configuração detalhada

### 🔧 Para Resolver Problemas
4. **[TROUBLESHOOTING-401.md](./TROUBLESHOOTING-401.md)** - Erros de autenticação
5. **[CHECK-SYSTEM.md](./CHECK-SYSTEM.md)** - Verificar se tudo está OK
6. **[DIAGNOSTIC-SCRIPT.js](./DIAGNOSTIC-SCRIPT.js)** - Script de teste automático

### 📖 Para Entender o Sistema
7. **[README.md](./README.md)** - Visão geral completa
8. **[README-AUTHENTICATION.md](./README-AUTHENTICATION.md)** - Autenticação
9. **[README-AUDIENCE-WORKFLOW.md](./README-AUDIENCE-WORKFLOW.md)** - Fluxo de audiências
10. **[README-DOCUMENT-UPLOAD.md](./README-DOCUMENT-UPLOAD.md)** - Upload de arquivos
11. **[README-USER-REGISTRATION.md](./README-USER-REGISTRATION.md)** - Cadastro
12. **[README-ADVANCED-FEATURES.md](./README-ADVANCED-FEATURES.md)** - Recursos avançados

---

## 🎓 Fluxo de Uso Recomendado

### Se você está começando do zero:

```
1. Leia INSTRUCTIONS.txt (5 min) ← COMECE AQUI
   ↓
2. Siga QUICK-START.md (5 min)
   ↓
3. Execute DIAGNOSTIC-SCRIPT.js
   ↓
4. Faça login e explore
```

### Se está com erros:

```
1. Leia TROUBLESHOOTING-401.md
   ↓
2. Execute CHECK-SYSTEM.md
   ↓
3. Use DIAGNOSTIC-SCRIPT.js
   ↓
4. Consulte logs do Supabase
```

### Se quer entender melhor:

```
1. Leia README.md (visão geral)
   ↓
2. Leia README-AUDIENCE-WORKFLOW.md (fluxo principal)
   ↓
3. Explore os outros README-*.md
```

---

## ✅ Checklist de Configuração

Marque conforme for completando:

- [ ] **Credenciais configuradas** em `/utils/supabase/info.tsx`
- [ ] **Servidor deployado** (`supabase functions deploy make-server-8b82752b`)
- [ ] **Health check** retorna `{status: "ok"}`
- [ ] **Login funciona** com admin@sistema.com / 123456
- [ ] **Diagnóstico** passou todos os testes
- [ ] **Explorei** o dashboard
- [ ] **Testei** criar carta de apresentação
- [ ] **Testei** criar pedido de audiência
- [ ] **Li** a documentação relevante

---

## 🎯 Funcionalidades Principais

| Recurso | Descrição | Quem pode usar |
|---------|-----------|----------------|
| **Dashboard** | Estatísticas e gráficos | Todos |
| **Cartas** | Criar apresentações | Usuários |
| **Audiências** | Pedir reuniões | Usuários |
| **Aprovar/Rejeitar** | Gerenciar solicitações | Admin + Atendente |
| **Agendar** | Marcar reuniões | Admin + Atendente |
| **Agenda** | Ver calendário | Todos |
| **Mensagens** | Chat interno | Todos |
| **Usuários** | Gerenciar contas | Admin |
| **Auditoria** | Ver logs | Admin |

---

## 👥 Usuários Demo

| Papel | Email | Senha | Para testar |
|-------|-------|-------|-------------|
| **Admin** | admin@sistema.com | 123456 | Todas funcionalidades |
| **Atendente** | atendente@sistema.com | 123456 | Gerenciar solicitações |
| **Usuário** | usuario@empresa.com | 123456 | Criar cartas e pedidos |

---

## 🆘 Problemas Comuns

### "Erro 401 - Não autorizado"
→ Leia [TROUBLESHOOTING-401.md](./TROUBLESHOOTING-401.md)

### "Erro 404 - Não encontrado"
→ Servidor não deployado. Execute: `supabase functions deploy make-server-8b82752b`

### "User profile not found"
→ Execute inicialização no console:
```javascript
fetch('https://PROJECT_ID.supabase.co/functions/v1/make-server-8b82752b/initialize', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ANON_KEY', 'Content-Type': 'application/json' }
})
```

### Página em branco
→ Verifique credenciais em `/utils/supabase/info.tsx`

---

## 📊 Como Verificar se Está Tudo OK

### Método 1: Visual (Rápido)
1. Abra o sistema
2. Faça login com admin@sistema.com / 123456
3. Se aparecer o dashboard → ✅ FUNCIONANDO

### Método 2: Script (Completo)
1. Abra [DIAGNOSTIC-SCRIPT.js](./DIAGNOSTIC-SCRIPT.js)
2. Substitua credenciais no topo
3. Cole no Console (F12)
4. Veja resultados

### Método 3: Manual (Detalhado)
1. Siga [CHECK-SYSTEM.md](./CHECK-SYSTEM.md)
2. Execute testes um por um
3. Marque checklist

---

## 🎨 Personalização

### Mudar Cores
Edite `/styles/globals.css`:
```css
:root {
  --primary: #030213;     /* Cor principal */
  --secondary: #ececf0;   /* Cor secundária */
  /* ... */
}
```

### Mudar Logo
Substitua em `/public/`:
- `icon-192x192.png`
- `badge-72x72.png`

### Mudar Texto
Todos os textos estão nos componentes em `/components/`

---

## 🚀 Próximo Nível

Depois de tudo funcionando:

1. **Criar usuários reais** (não demo)
2. **Configurar SendGrid** para emails
3. **Personalizar cores** e logo
4. **Testar todos os fluxos**
5. **Deploy em produção**

Consulte [README-SETUP.md](./README-SETUP.md) seção "Deploy em Produção"

---

## 📞 Precisa de Ajuda?

### Passo 1: Consulte a documentação
- [INSTRUCTIONS.txt](./INSTRUCTIONS.txt) - Guia completo
- [TROUBLESHOOTING-401.md](./TROUBLESHOOTING-401.md) - Erros comuns
- [README.md](./README.md) - Visão geral

### Passo 2: Execute diagnóstico
- [DIAGNOSTIC-SCRIPT.js](./DIAGNOSTIC-SCRIPT.js) - Teste automático
- [CHECK-SYSTEM.md](./CHECK-SYSTEM.md) - Verificação manual

### Passo 3: Verifique logs
- Console do navegador (F12 > Console)
- Painel Supabase > Functions > Logs

---

## 📁 Estrutura de Arquivos

```
/
├── START-HERE.md               ⭐ Este arquivo
├── INSTRUCTIONS.txt            ⭐ Guia visual completo
├── QUICK-START.md              ⭐ Início rápido
├── README.md                      Visão geral
├── README-SETUP.md                Configuração detalhada
├── TROUBLESHOOTING-401.md         Resolver erros 401
├── CHECK-SYSTEM.md                Verificação do sistema
├── DIAGNOSTIC-SCRIPT.js           Script de teste
├── README-AUTHENTICATION.md       Autenticação
├── README-AUDIENCE-WORKFLOW.md    Fluxo de audiências
├── README-DOCUMENT-UPLOAD.md      Upload de documentos
├── README-USER-REGISTRATION.md    Cadastro de usuários
├── README-ADVANCED-FEATURES.md    Recursos avançados
│
├── App.tsx                        Componente principal
├── utils/supabase/info.tsx     ⚠️  CONFIGURAR AQUI!
│
├── components/                    Componentes React
├── supabase/functions/server/     Backend (Hono)
└── styles/globals.css             Estilos e tema
```

---

## 🎯 Objetivo do Sistema

Automatizar o fluxo completo de:

1. **Cartas de Apresentação**
   - Empresa solicita apresentação
   - Upload de documentos
   - Aprovação/Rejeição

2. **Pedidos de Audiência**
   - Usuário pede reunião
   - Admin agenda detalhes
   - Notificações automáticas
   - Gestão de agenda

3. **Gerenciamento**
   - Dashboard com estatísticas
   - Aprovação de solicitações
   - Agendamento de reuniões
   - Sistema de mensagens
   - Auditoria completa

---

## ✨ Recursos Destacados

- ✅ **100% Responsivo** - Desktop, tablet, mobile
- ✅ **Tempo Real** - Notificações instantâneas
- ✅ **Seguro** - Autenticação JWT + Auditoria
- ✅ **Escalável** - Serverless com Supabase
- ✅ **Moderno** - React 18 + TypeScript + Tailwind 4.0
- ✅ **Localizado** - Adaptado para Angola (+244, NIF/BI)

---

## 🏁 Pronto para Começar?

1. **Agora:** Leia [INSTRUCTIONS.txt](./INSTRUCTIONS.txt) (5 minutos)
2. **Depois:** Siga [QUICK-START.md](./QUICK-START.md) (5 minutos)
3. **Por fim:** Execute [DIAGNOSTIC-SCRIPT.js](./DIAGNOSTIC-SCRIPT.js)

**Total:** ~10 minutos e o sistema está rodando! 🎉

---

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Sistema:** Gestão de Audiências para Angola

**Boa sorte! 🚀**
