# 🏗️ ARQUITETURA: Sistema de Roles por Departamento

## 📊 VISÃO GERAL

O sistema implementa **27 roles** baseados nos departamentos organizacionais, substituindo os 3 roles fixos anteriores (admin, attendant, user).

### Princípio Fundamental:
```typescript
role === department
```

Cada utilizador tem um **role** que corresponde ao seu **departamento**, simplificando a gestão de permissões.

---

## 🎯 ESTRUTURA DE ROLES

### 1. Gabinetes Executivos (5 roles)
**Nível:** Admin Completo  
**Permissões:** Acesso total ao sistema

| Role | Nome | Descrição |
|------|------|-----------|
| `gabinete_pca` | Gabinete do PCA | Presidente do Conselho de Administração |
| `gabinete_pce` | Gabinete do PCE | Presidente do Conselho Executivo |
| `gabinete_administrador` | Gabinete do Administrador | Administrador Executivo |
| `gabinete_director` | Gabinete do Director | Direcção Geral |
| `gestao` | Gestão | Departamento de Gestão Geral |

---

### 2. Gabinetes Governamentais (5 roles)
**Nível:** Admin Completo  
**Permissões:** Acesso total ao sistema

| Role | Nome | Descrição |
|------|------|-----------|
| `gabinete_ministro` | Gabinete do Ministro | Gabinete Ministerial |
| `gabinete_secretario_estado_1` | Gabinete do Secretário de Estado 1 | Primeiro Gabinete |
| `gabinete_secretario_estado_2` | Gabinete do Secretário de Estado 2 | Segundo Gabinete |
| `gabinete_vice_governador_1` | Gabinete do Vice-Governador 1 | Primeiro Gabinete do Vice |
| `gabinete_vice_governador_2` | Gabinete do Vice-Governador 2 | Segundo Gabinete do Vice |

---

### 3. Departamentos Operacionais (7 roles)

| Role | Nome | Nível | Permissões |
|------|------|-------|------------|
| `financeiro` | Financeiro | Financeiro | Gestão financeira completa |
| `recursos_humanos` | Recursos Humanos | Gerente | Gestão de RH e relatórios |
| `juridico` | Jurídico | Gerente | Documentos jurídicos e contratos |
| `compras` | Compras | Operador | Gestão de compras e procurement |
| `tecnologia_informacao` | Tecnologia e Informação | Admin | Acesso técnico completo |
| `operacoes` | Operações | Operador | Operações gerais |
| `operacional_frota` | Operacional e Frota | Operador | Gestão de frota e veículos |

---

### 4. Departamentos de Apoio (6 roles)

| Role | Nome | Nível | Permissões |
|------|------|-------|------------|
| `administracao` | Administração | Admin | Administração geral |
| `administrativo` | Administrativo | Atendente | Serviços administrativos |
| `comunicacao_imagem` | Comunicação e Imagem | Gerente | Comunicação e RP |
| `seguranca` | Segurança | Atendente | Segurança e vigilância |
| `secretaria` | Secretaria | Atendente | Atendimento e agendamento |
| `externo` | Externo | Utilizador | Utilizadores externos |

---

### 5. Departamentos Estratégicos (4 roles)
**Nível:** Gerente  
**Permissões:** Alto nível de acesso

| Role | Nome | Descrição |
|------|------|-----------|
| `planeamento` | Planeamento | Planeamento Estratégico |
| `organizacao_qualidade` | Organização e Qualidade | Gestão da Qualidade |
| `compliance` | Compliance | Compliance e Conformidade |
| `risco` | Risco | Gestão de Riscos |

---

## 🔐 NÍVEIS DE PERMISSÕES

### Nível 1: ADMIN_SISTEMA_PERMISSIONS
**Acesso Total**

**Roles com este nível (12):**
- Todos os Gabinetes Executivos (5)
- Todos os Gabinetes Governamentais (5)
- `administracao`
- `tecnologia_informacao`

**Pode:**
- ✅ Criar, ler, atualizar, deletar tudo
- ✅ Aprovar/rejeitar solicitações
- ✅ Gerir utilizadores
- ✅ Aceder auditoria
- ✅ Configurar sistema

---

### Nível 2: GERENTE_PERMISSIONS
**Gestão de Alto Nível**

**Roles com este nível (6):**
- `recursos_humanos`
- `juridico`
- `comunicacao_imagem`
- `planeamento`
- `organizacao_qualidade`
- `compliance`
- `risco`

**Pode:**
- ✅ Ler tudo
- ✅ Aprovar/rejeitar
- ✅ Criar reuniões
- ✅ Gerar relatórios
- ❌ Não pode gerir utilizadores
- ❌ Não pode aceder configurações

---

### Nível 3: FINANCEIRO_PERMISSIONS
**Gestão Financeira**

**Roles com este nível (1):**
- `financeiro`

**Pode:**
- ✅ Gestão financeira completa
- ✅ Facturas e pagamentos
- ✅ Relatórios financeiros
- ✅ Ler apresentações/audiências
- ❌ Não pode aprovar apresentações
- ❌ Não pode gerir utilizadores

---

### Nível 4: OPERADOR_PERMISSIONS
**Operações e Logística**

**Roles com este nível (3):**
- `operacoes`
- `operacional_frota`
- `compras`

**Pode:**
- ✅ Gestão de frota completa
- ✅ Gestão de veículos
- ✅ Logística
- ✅ Ler agenda (para coordenar)
- ✅ Relatórios operacionais
- ❌ Não pode aprovar solicitações
- ❌ Não pode gerir utilizadores

---

### Nível 5: ATENDENTE_PERMISSIONS
**Atendimento e Processamento**

**Roles com este nível (3):**
- `secretaria`
- `administrativo`
- `seguranca`

**Pode:**
- ✅ Processar apresentações/audiências
- ✅ Atualizar solicitações
- ✅ Criar agendamentos
- ✅ Ler reuniões
- ✅ Enviar mensagens
- ❌ Não pode aprovar
- ❌ Não pode deletar

---

### Nível 6: USUARIO_PERMISSIONS
**Utilizadores Externos**

**Roles com este nível (1):**
- `externo`

**Pode:**
- ✅ Criar apresentações próprias
- ✅ Criar pedidos de audiência
- ✅ Ver suas solicitações
- ✅ Mensagens com atendentes
- ❌ Não pode ver dados de outros
- ❌ Sem acesso administrativo

---

## 💡 COMO FUNCIONA

### 1. Criação de Utilizador

```typescript
// Exemplo: Criar utilizador do departamento financeiro
createUserWithRole(
  'joao@financeiro.com',
  'senha123',
  'João Financeiro',
  'financeiro',  // ← role = department
  ['financeiro'], // perfis
  'financeiro',   // department
  'Responsável Financeiro'
)
```

**Resultado:**
```json
{
  "email": "joao@financeiro.com",
  "name": "João Financeiro",
  "role": "financeiro",
  "profiles": ["financeiro"],
  "department": "financeiro"
}
```

---

### 2. Verificação de Permissões

```typescript
// No backend
import { getUserPermissions, hasPermission } from './permissions.tsx';

// Obter permissões do utilizador
const userPerms = getUserPermissions(
  user.role,        // Ex: 'financeiro'
  user.department,
  user.position
);

// Verificar se pode criar facturas
const canCreate = hasPermission(
  userPerms,
  'invoices',  // módulo
  'create'     // ação
);

// resultado: true (financeiro pode criar facturas)
```

---

### 3. No Frontend

```typescript
// Verificar se é Admin
const isAdmin = [
  'gabinete_pca',
  'gabinete_pce',
  'gabinete_administrador',
  'gabinete_director',
  'gabinete_ministro',
  'gabinete_secretario_estado_1',
  'gabinete_secretario_estado_2',
  'gabinete_vice_governador_1',
  'gabinete_vice_governador_2',
  'administracao',
  'gestao',
  'tecnologia_informacao'
].includes(user.role);

// Verificar se é do financeiro
const isFinanceiro = user.role === 'financeiro';

// Verificar se é operacional
const isOperacional = [
  'operacoes',
  'operacional_frota',
  'compras'
].includes(user.role);
```

---

## 🔄 FLUXO DE AUTENTICAÇÃO

```
1. Utilizador faz login
   ↓
2. Backend valida credenciais (Supabase Auth)
   ↓
3. Backend busca perfil do KV_STORE
   ↓
4. Retorna perfil com role (= department)
   ↓
5. Frontend determina permissões baseado no role
   ↓
6. Interface adapta-se às permissões
```

---

## 📋 EXEMPLO: 8 UTILIZADORES CONFIGURADOS

| Email | Role | Nível | O que pode fazer |
|-------|------|-------|------------------|
| admin@sistema.com | `administracao` | Admin | Tudo |
| gerente@sistema.ao | `gestao` | Admin | Tudo |
| atendente@sistema.com | `secretaria` | Atendente | Processar solicitações |
| financeiro@sistema.ao | `financeiro` | Financeiro | Gestão financeira |
| operador@sistema.ao | `operacoes` | Operador | Operações gerais |
| compras@sistema.com | `compras` | Operador | Gestão de compras |
| motorista@sistema.com | `operacional_frota` | Operador | Gestão de frota |
| usuario@empresa.com | `externo` | Utilizador | Apenas seus pedidos |

---

## ✅ VANTAGENS DESTA ARQUITETURA

### 1. **Simplicidade**
```typescript
role === department  // Fácil de entender
```

### 2. **Escalabilidade**
- Adicionar novo departamento = adicionar novo role
- Sem necessidade de refatoração grande

### 3. **Clareza**
- Role mostra exatamente onde o utilizador trabalha
- Permissões óbvias baseadas no departamento

### 4. **Manutenção**
- Código limpo e previsível
- Fácil debugar e testar

### 5. **Flexibilidade**
- Suporta múltiplos perfis por utilizador (futuro)
- Pode adicionar permissões granulares conforme necessário

---

## 🔮 EVOLUÇÃO FUTURA

### Fase 1: ✅ CONCLUÍDA
- 27 roles implementados
- Permissões por departamento
- Migração dos utilizadores existentes

### Fase 2: 🚧 PRÓXIMA
- **Múltiplos perfis por utilizador**
- Um utilizador pode ter vários roles
- Exemplo: Gerente que também é do Financeiro

### Fase 3: 📅 FUTURA
- **Permissões personalizadas**
- Admin pode criar permissões específicas
- Exceções por utilizador

---

## 📚 ARQUIVOS DO SISTEMA

### Backend
```
/supabase/functions/server/
├── permissions.tsx       ← Sistema de permissões (27 roles)
├── auth.tsx             ← Autenticação e gestão de utilizadores
└── kv_store.tsx         ← Armazenamento de perfis
```

### Frontend
```
/components/admin/
└── departments.tsx       ← Lista de 27 departamentos
```

### Scripts SQL
```
/
├── MIGRACAO-ROLES-DEPARTAMENTOS.sql  ← Migrar utilizadores existentes
└── CRIAR-2-USUARIOS-NOVO-SISTEMA.sql ← Criar novos utilizadores
```

---

## 🎯 RESUMO

✅ **27 departamentos** = **27 roles**  
✅ **role === department** (sempre)  
✅ **6 níveis de permissões** (Admin, Gerente, Financeiro, Operador, Atendente, Utilizador)  
✅ **Sistema escalável e manutenível**  
✅ **Pronto para produção**  

---

**Sistema implementado e documentado!** 🚀
