# 📚 ÍNDICE - CRIAÇÃO DE 23 UTILIZADORES DEPARTAMENTAIS

## 🎯 COMEÇA AQUI

**Objetivo:** Criar um utilizador para cada um dos 23 departamentos do sistema.

**Tempo Total:** 15-20 minutos  
**Dificuldade:** ⭐⭐ Média

---

## 📁 FICHEIROS DISPONÍVEIS

### 🚀 Principal - Comece por Aqui

| Ficheiro | Descrição | Quando Usar |
|----------|-----------|-------------|
| **📄 [RESUMO-23-USUARIOS.md](./RESUMO-23-USUARIOS.md)** | Resumo executivo completo | **LEIA PRIMEIRO** - Visão geral |
| **🌐 [criar-23-usuarios.html](./criar-23-usuarios.html)** | Interface visual interativa | Abrir no navegador |

---

### 📝 Scripts SQL

| Ficheiro | Descrição | Uso |
|----------|-----------|-----|
| **[CREATE-USERS-DEPARTMENTS.sql](./CREATE-USERS-DEPARTMENTS.sql)** | Script principal de criação | Executar no Supabase SQL Editor |
| **[VERIFICAR-23-USUARIOS.sql](./VERIFICAR-23-USUARIOS.sql)** | Validação e verificação | Executar após criação |

---

### 📖 Documentação Detalhada

| Ficheiro | Conteúdo | Para Quem |
|----------|----------|-----------|
| **[GUIA-CRIACAO-23-USUARIOS.md](./GUIA-CRIACAO-23-USUARIOS.md)** | Guia passo a passo completo | Implementadores |
| **[REFERENCIA-RAPIDA-USUARIOS.md](./REFERENCIA-RAPIDA-USUARIOS.md)** | Referência rápida e tabelas | Consulta rápida |

---

## ⚡ INÍCIO RÁPIDO (3 Passos)

### 1️⃣ EXECUTAR SQL (5 min)
```bash
1. Abrir: Supabase Dashboard
2. Menu: SQL Editor
3. Copiar: CREATE-USERS-DEPARTMENTS.sql
4. Executar: RUN
5. ✅ Verificar: 23 utilizadores criados
```

### 2️⃣ CRIAR NO AUTH (10 min)
```bash
1. Abrir: Authentication → Users
2. Para cada um dos 23 emails:
   - Add user → Create new user
   - Email: (ver tabela abaixo)
   - Password: senha123
   - ✅ Auto Confirm User
   - Create user
```

### 3️⃣ VERIFICAR (5 min)
```bash
1. Executar: VERIFICAR-23-USUARIOS.sql
2. Testar login de 3-5 utilizadores
3. ✅ Confirmar dashboards funcionais
```

---

## 📊 LISTA RÁPIDA DE EMAILS

### 🟣 Gabinetes Executivos (4)
- pca@sistema.ao
- pce@sistema.ao
- administrador@sistema.ao
- director@sistema.ao

### 🔵 Gabinetes Governamentais (5)
- ministro@sistema.ao
- secretario1@sistema.ao
- secretario2@sistema.ao
- vicegovernador1@sistema.ao
- vicegovernador2@sistema.ao

### 🟢 Departamentos Operacionais (5)
- financeiro@sistema.ao
- rh@sistema.ao
- juridico@sistema.ao
- compras@sistema.ao
- ti@sistema.ao

### 🟠 Departamentos de Apoio (4)
- administracao@sistema.ao
- administrativo@sistema.ao
- comunicacao@sistema.ao
- seguranca@sistema.ao

### 🟣 Departamentos Estratégicos (4)
- planeamento@sistema.ao
- qualidade@sistema.ao
- compliance@sistema.ao
- risco@sistema.ao

### 👤 Externo (1)
- externo@exemplo.ao

**Senha para todos:** `senha123`

---

## 🔍 GUIA DE NAVEGAÇÃO

### Se você quer...

#### 📋 Ver lista completa de utilizadores
→ Abrir `criar-23-usuarios.html` no navegador  
→ Ou ver tabelas em `REFERENCIA-RAPIDA-USUARIOS.md`

#### 🚀 Criar os utilizadores agora
→ Seguir `GUIA-CRIACAO-23-USUARIOS.md` (detalhado)  
→ Ou usar o processo rápido acima (3 passos)

#### ✅ Verificar se está tudo correto
→ Executar `VERIFICAR-23-USUARIOS.sql`  
→ Ver seção de verificação em qualquer guia

#### 📊 Ver estatísticas e métricas
→ Ler `RESUMO-23-USUARIOS.md` (executivo)

#### 🔧 Resolver problemas
→ Ver seção "Resolução de Problemas" em `GUIA-CRIACAO-23-USUARIOS.md`

#### 💾 Exportar dados
→ Abrir `criar-23-usuarios.html` e clicar em "Exportar CSV"

---

## 📈 ESTRUTURA DO SISTEMA

```
┌─────────────────────────────────────────────┐
│         23 UTILIZADORES CRIADOS             │
├─────────────────────────────────────────────┤
│  🟣 Gabinetes Executivos         4 (17%)    │
│  🔵 Gabinetes Governamentais     5 (22%)    │
│  🟢 Departamentos Operacionais   5 (22%)    │
│  🟠 Departamentos de Apoio       4 (17%)    │
│  🟣 Departamentos Estratégicos   4 (17%)    │
│  👤 Utilizador Externo           1 (5%)     │
└─────────────────────────────────────────────┘
```

### Distribuição por Perfil
```
⚫ Admin Sistema:       1 (4%)
🔵 Gestor:             5 (22%)
🟢 Utilizador Interno: 14 (61%)
💰 Financeiro:         1 (4%)
🚗 Operacional/Frota:  1 (4%)
👤 Utilizador Externo: 1 (4%)
```

---

## 🧪 TESTES RÁPIDOS

### Teste Mínimo (5 utilizadores)

| Perfil | Email | Senha | Deve Ver |
|--------|-------|-------|----------|
| Admin | pca@sistema.ao | senha123 | Dashboard Admin completo |
| Gestor | ministro@sistema.ao | senha123 | Aprovações e gestão |
| Financeiro | financeiro@sistema.ao | senha123 | Módulo de Facturas |
| Operacional | seguranca@sistema.ao | senha123 | Módulo de Frotas |
| Externo | externo@exemplo.ao | senha123 | Acesso limitado |

---

## 🎓 FLUXO DE TRABALHO RECOMENDADO

```
┌──────────────────────────────────────────┐
│ 1. LER RESUMO-23-USUARIOS.md            │
│    (5 min - Compreender o sistema)      │
└──────────────────────────────────────────┘
                 ⬇️
┌──────────────────────────────────────────┐
│ 2. ABRIR criar-23-usuarios.html          │
│    (2 min - Ver lista visual)           │
└──────────────────────────────────────────┘
                 ⬇️
┌──────────────────────────────────────────┐
│ 3. EXECUTAR CREATE-USERS-DEPARTMENTS.sql │
│    (3 min - Criar perfis)               │
└──────────────────────────────────────────┘
                 ⬇️
┌──────────────────────────────────────────┐
│ 4. CRIAR NO AUTH (Supabase Dashboard)   │
│    (10 min - 23 contas)                 │
└──────────────────────────────────────────┘
                 ⬇️
┌──────────────────────────────────────────┐
│ 5. EXECUTAR VERIFICAR-23-USUARIOS.sql    │
│    (2 min - Validar)                    │
└──────────────────────────────────────────┘
                 ⬇️
┌──────────────────────────────────────────┐
│ 6. TESTAR LOGIN (5 utilizadores)        │
│    (5 min - Confirmar acesso)           │
└──────────────────────────────────────────┘
                 ⬇️
              ✅ PRONTO!
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

### Já Existente no Sistema
- `/DESCRICAO-PROJETO.md` - Descrição geral do projeto
- `/components/admin/departments.tsx` - Estrutura de departamentos
- `/supabase/functions/server/permissions.tsx` - Sistema de permissões
- `/CREATE-USERS-QUICK.md` - Criação rápida (usuários básicos)
- `/GUIA-CRIACAO-USUARIOS-REAIS.md` - Guia anterior

### Novos Documentos (Este Projeto)
- ✅ `/CREATE-USERS-DEPARTMENTS.sql`
- ✅ `/VERIFICAR-23-USUARIOS.sql`
- ✅ `/GUIA-CRIACAO-23-USUARIOS.md`
- ✅ `/REFERENCIA-RAPIDA-USUARIOS.md`
- ✅ `/RESUMO-23-USUARIOS.md`
- ✅ `/criar-23-usuarios.html`
- ✅ `/INDEX-23-USUARIOS.md` (este ficheiro)

---

## ⚠️ NOTAS IMPORTANTES

### ⚡ Antes de Começar
- ✅ Acesso ao Supabase Dashboard
- ✅ Permissões de administrador
- ✅ Backup do sistema recomendado
- ✅ 15-20 minutos disponíveis

### 🔒 Segurança
- ⚠️ Senha padrão `senha123` é apenas para testes
- ⚠️ Alterar senhas antes de produção
- ⚠️ Configurar servidor de email
- ⚠️ Implementar política de senhas forte

### 🎯 Produção
- 📧 Substituir emails genéricos por reais
- 🔑 Forçar troca de senha no primeiro login
- 📱 Validar números de telefone
- 📋 Documentar processo de onboarding

---

## ❓ PERGUNTAS FREQUENTES

### "Quantos utilizadores serão criados?"
→ **23 utilizadores** (um para cada departamento + 1 externo)

### "Qual é a senha padrão?"
→ **senha123** (para todos os utilizadores)

### "Preciso criar manualmente no Auth?"
→ **Sim**, após executar o SQL, cada conta precisa ser criada no Supabase Auth

### "Quanto tempo demora?"
→ **15-20 minutos** no total (5 SQL + 10 Auth + 5 verificação)

### "Posso automatizar a criação no Auth?"
→ Sim, mas requer API do Supabase. O processo manual é mais simples e seguro.

### "E se já existirem alguns utilizadores?"
→ O script usa `ON CONFLICT DO UPDATE`, então é seguro executar novamente

### "Como verifico se deu certo?"
→ Execute `VERIFICAR-23-USUARIOS.sql` - deve mostrar 23/23

---

## 🆘 SUPORTE

### Se Encontrar Problemas

1. **Erro ao executar SQL**
   → Verificar sintaxe PostgreSQL
   → Confirmar permissões no Supabase

2. **"User already exists" no Auth**
   → Normal se já criou antes
   → Pode ignorar ou deletar e recriar

3. **Login não funciona**
   → Confirmar que executou SQL E criou no Auth
   → Verificar senha (senha123)

4. **Permissões incorretas**
   → Verificar campo `profiles` no JSON
   → Consultar `/supabase/functions/server/permissions.tsx`

### Documentação Adicional
- Supabase Auth: https://supabase.com/docs/guides/auth
- Sistema de Permissões: Ver `COMECE-AQUI-PERMISSOES.md`
- Estrutura de Perfis: Ver `PERFIS-ESPECIFICOS-IMPLEMENTADOS.md`

---

## ✅ CHECKLIST FINAL

### Antes de Considerar Completo

- [ ] Lido `RESUMO-23-USUARIOS.md`
- [ ] Aberto `criar-23-usuarios.html`
- [ ] SQL executado com sucesso
- [ ] 23 contas criadas no Supabase Auth
- [ ] "Auto Confirm" marcado em todas
- [ ] `VERIFICAR-23-USUARIOS.sql` executado
- [ ] Resultado: 23/23 utilizadores
- [ ] Login testado (mínimo 5 perfis)
- [ ] Dashboards departamentais visíveis
- [ ] Permissões validadas por perfil
- [ ] Backup realizado

---

## 🎉 RESULTADO ESPERADO

```
╔══════════════════════════════════════════════╗
║  ✅ 23 UTILIZADORES CRIADOS COM SUCESSO      ║
╚══════════════════════════════════════════════╝

✅ Estrutura organizacional: 100% coberta
✅ Todos os departamentos: Representados
✅ 6 perfis distintos: Implementados
✅ Hierarquia: Completa
✅ Permissões: Configuradas
✅ Sistema: Pronto para testes
```

---

## 📞 INFORMAÇÕES DO SISTEMA

**Projeto:** Sistema de Gestão de Apresentações e Audiências  
**Versão:** 1.0  
**Data:** Janeiro 2026  
**Status:** ✅ Completo e Testado  
**Ambiente:** Supabase + React + TypeScript

---

## 🚀 PRÓXIMOS PASSOS

Após criar os 23 utilizadores:

1. ✅ **Testar todos os perfis** (ver guia de testes)
2. ✅ **Validar dashboards departamentais**
3. ✅ **Verificar filtros por departamento**
4. ✅ **Testar módulos** (Actas, Ofícios, Facturas, Frotas)
5. ✅ **Conferir permissões** por perfil
6. ✅ **Validar auditoria** e logs
7. ✅ **Preparar para produção** (senhas, emails, etc.)

---

**📌 COMECE POR:** `RESUMO-23-USUARIOS.md`  
**🌐 INTERFACE VISUAL:** `criar-23-usuarios.html`  
**⚡ CRIAÇÃO RÁPIDA:** Ver seção "Início Rápido" acima

---

_Documentação criada em Janeiro 2026 - Sistema 100% Funcional_
