# ✅ CHECKLIST - CRIAÇÃO DE 23 UTILIZADORES DEPARTAMENTAIS

## 📋 PREPARAÇÃO

- [ ] Acesso ao Supabase Dashboard
- [ ] Credenciais de administrador
- [ ] Backup do sistema realizado
- [ ] 15-20 minutos disponíveis
- [ ] Documentação lida (`RESUMO-23-USUARIOS.md`)

---

## 🚀 PASSO 1: EXECUTAR SQL (5 minutos)

### Ações
- [ ] Abrir Supabase Dashboard: https://supabase.com/dashboard
- [ ] Selecionar projeto
- [ ] Abrir **SQL Editor** (menu lateral)
- [ ] Copiar conteúdo de `/CREATE-USERS-DEPARTMENTS.sql`
- [ ] Colar no SQL Editor
- [ ] Clicar em **RUN** (ou Ctrl+Enter)
- [ ] Aguardar mensagem de sucesso
- [ ] Verificar listagem final (deve mostrar 23 utilizadores)

### Verificação Rápida
```sql
SELECT COUNT(*) FROM kv_store WHERE key LIKE 'user_profile:dept-%';
```
**Resultado esperado:** 23

---

## 🔐 PASSO 2: CRIAR NO SUPABASE AUTH (10 minutos)

### Processo
- [ ] Abrir: **Authentication** → **Users**
- [ ] Criar cada um dos 23 utilizadores abaixo

### 🟣 GABINETES EXECUTIVOS (4)

#### 1. Gabinete do PCA
- [ ] Email: `pca@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 2. Gabinete do PCE
- [ ] Email: `pce@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 3. Gabinete do Administrador
- [ ] Email: `administrador@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 4. Gabinete do Director
- [ ] Email: `director@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

---

### 🔵 GABINETES GOVERNAMENTAIS (5)

#### 5. Gabinete do Ministro
- [ ] Email: `ministro@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 6. Secretário de Estado 1
- [ ] Email: `secretario1@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 7. Secretário de Estado 2
- [ ] Email: `secretario2@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 8. Vice-Governador 1
- [ ] Email: `vicegovernador1@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 9. Vice-Governador 2
- [ ] Email: `vicegovernador2@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

---

### 🟢 DEPARTAMENTOS OPERACIONAIS (5)

#### 10. Financeiro
- [ ] Email: `financeiro@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 11. Recursos Humanos
- [ ] Email: `rh@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 12. Jurídico
- [ ] Email: `juridico@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 13. Compras
- [ ] Email: `compras@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 14. Tecnologia e Informação
- [ ] Email: `ti@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

---

### 🟠 DEPARTAMENTOS DE APOIO (4)

#### 15. Administração
- [ ] Email: `administracao@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 16. Administrativo
- [ ] Email: `administrativo@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 17. Comunicação e Imagem
- [ ] Email: `comunicacao@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 18. Segurança
- [ ] Email: `seguranca@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

---

### 🟣 DEPARTAMENTOS ESTRATÉGICOS (4)

#### 19. Planeamento
- [ ] Email: `planeamento@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 20. Organização e Qualidade
- [ ] Email: `qualidade@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 21. Compliance
- [ ] Email: `compliance@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

#### 22. Gestão de Riscos
- [ ] Email: `risco@sistema.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

---

### 👤 UTILIZADOR EXTERNO (1)

#### 23. Utilizador Externo
- [ ] Email: `externo@exemplo.ao`
- [ ] Password: `senha123`
- [ ] ✅ Auto Confirm User: **MARCADO**

---

## ✅ PASSO 3: VERIFICAR (5 minutos)

### Verificação SQL
- [ ] Executar `/VERIFICAR-23-USUARIOS.sql`
- [ ] Query 1: Contar total → Resultado: **23**
- [ ] Query 2: Listar por categoria → Todas listadas
- [ ] Query 3: Distribuição de perfis → Correto
- [ ] Query 4: Lookups de email → **23**
- [ ] Query 5: Detalhes completos → Todos visíveis
- [ ] Query 6: Emails duplicados → **0**
- [ ] Query 7: Departamentos órfãos → **0**
- [ ] Query 8: Resumo geral → ✅ **SUCESSO**

---

## 🧪 PASSO 4: TESTAR LOGIN (5 minutos)

### Teste Rápido (5 utilizadores)

#### Teste 1: Admin (PCA)
- [ ] Login: `pca@sistema.ao` / `senha123`
- [ ] Dashboard Admin visível
- [ ] Acesso a todos os módulos
- [ ] Menu completo disponível

#### Teste 2: Gestor (Ministro)
- [ ] Login: `ministro@sistema.ao` / `senha123`
- [ ] Dashboard Gestor visível
- [ ] Funcionalidades de aprovação
- [ ] Relatórios disponíveis

#### Teste 3: Financeiro
- [ ] Login: `financeiro@sistema.ao` / `senha123`
- [ ] Dashboard Financeiro visível
- [ ] Módulo de Facturas ativo
- [ ] Permissões financeiras OK

#### Teste 4: Operacional (Segurança)
- [ ] Login: `seguranca@sistema.ao` / `senha123`
- [ ] Dashboard Operacional visível
- [ ] Módulo de Frotas ativo
- [ ] Gestão de viaturas disponível

#### Teste 5: Externo
- [ ] Login: `externo@exemplo.ao` / `senha123`
- [ ] Dashboard Externo visível
- [ ] Acesso limitado (esperado)
- [ ] Apenas funcionalidades públicas

---

## 📊 VERIFICAÇÃO FINAL

### Contagens
- [ ] Total de utilizadores: **23/23** ✅
- [ ] Gabinetes Executivos: **4/4** ✅
- [ ] Gabinetes Governamentais: **5/5** ✅
- [ ] Departamentos Operacionais: **5/5** ✅
- [ ] Departamentos de Apoio: **4/4** ✅
- [ ] Departamentos Estratégicos: **4/4** ✅
- [ ] Utilizador Externo: **1/1** ✅

### Distribuição de Perfis
- [ ] Admin Sistema: **1** ✅
- [ ] Gestor: **5** ✅
- [ ] Utilizador Interno: **14** ✅
- [ ] Financeiro: **1** ✅
- [ ] Operacional/Frota: **1** ✅
- [ ] Utilizador Externo: **1** ✅

### Funcionalidades
- [ ] Login funcional para todos
- [ ] Dashboards departamentais visíveis
- [ ] Filtros por departamento operacionais
- [ ] Permissões por perfil validadas
- [ ] Menu específico por perfil
- [ ] Badges de perfil corretos

---

## 🎯 TESTES AVANÇADOS (Opcional)

### Módulos

#### Actas
- [ ] Criar acta (Admin/Gestor/Interno)
- [ ] Aprovar acta (Admin/Gestor)
- [ ] Ver histórico
- [ ] Filtrar por departamento

#### Ofícios
- [ ] Criar ofício (Admin/Gestor/Interno)
- [ ] Aprovar ofício (Admin/Gestor)
- [ ] Ver histórico
- [ ] Filtrar por departamento

#### Facturas
- [ ] Criar factura (Financeiro)
- [ ] Aprovar factura (Admin/Gestor/Financeiro)
- [ ] Ver relatório financeiro
- [ ] Filtrar por departamento

#### Frotas
- [ ] Criar viatura (Operacional)
- [ ] Criar pedido de viatura (todos)
- [ ] Aprovar pedido (Admin/Gestor/Operacional)
- [ ] Ver histórico de utilizações

#### Dashboard Departamental
- [ ] Ver estatísticas do departamento
- [ ] Filtros funcionais
- [ ] Gráficos exibidos
- [ ] Dados segregados corretamente

---

## ⚠️ RESOLUÇÃO DE PROBLEMAS

### "User already exists"
- [ ] ✅ Normal - utilizador já criado
- [ ] Pode ignorar
- [ ] Ou deletar e recriar

### "User not found" ao fazer login
- [ ] Verificar se executou SQL (Passo 1)
- [ ] Verificar se criou no Auth (Passo 2)
- [ ] Confirmar email correto

### "Invalid credentials"
- [ ] Verificar senha: `senha123`
- [ ] Verificar email (sem espaços)
- [ ] Resetar senha no Dashboard se necessário

### Permissões incorretas
- [ ] Verificar campo `profiles` no JSON
- [ ] Executar SQL novamente se necessário
- [ ] Consultar `/supabase/functions/server/permissions.tsx`

### Dashboard não aparece
- [ ] Limpar cache do navegador
- [ ] Fazer logout e login novamente
- [ ] Verificar console do navegador (F12)

---

## 📝 NOTAS FINAIS

### Antes de Produção
- [ ] Alterar todas as senhas de `senha123`
- [ ] Substituir emails genéricos por reais
- [ ] Configurar servidor de email
- [ ] Implementar política de senhas forte
- [ ] Documentar acessos
- [ ] Treinar utilizadores

### Backup e Segurança
- [ ] Backup completo realizado
- [ ] Processo de restauro documentado
- [ ] Logs de auditoria ativos
- [ ] Monitoramento configurado

---

## ✅ CONCLUSÃO

Data de Conclusão: ___/___/______

Total de Utilizadores Criados: ____/23

Tempo Total Gasto: ____ minutos

Status Final: 
- [ ] ✅ Completo e Funcional
- [ ] ⚠️ Completo com Problemas
- [ ] ❌ Incompleto

Observações:
_______________________________________
_______________________________________
_______________________________________

---

**Assinatura:** _______________________  
**Data:** ___/___/______

---

## 📚 DOCUMENTAÇÃO DE APOIO

- `/CREATE-USERS-DEPARTMENTS.sql` - Script principal
- `/VERIFICAR-23-USUARIOS.sql` - Validação
- `/GUIA-CRIACAO-23-USUARIOS.md` - Guia completo
- `/REFERENCIA-RAPIDA-USUARIOS.md` - Referência rápida
- `/RESUMO-23-USUARIOS.md` - Resumo executivo
- `/INDEX-23-USUARIOS.md` - Índice geral
- `/criar-23-usuarios.html` - Interface visual

---

_Checklist criada em Janeiro 2026 - Sistema de Gestão de Apresentações e Audiências_
