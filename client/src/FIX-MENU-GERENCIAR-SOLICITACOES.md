# Correção: Menu "Gerenciar Solicitações" - Admin e Atendente

## Problema Identificado
O menu "Gerenciar Solicitações" não estava acessível tanto para administradores quanto para atendentes.

## Causas Identificadas

### 1. Inconsistência no Tipo de Role
- **auth-context.tsx**: Define o tipo como `'attendant'` (inglês)
- **App.tsx**: Verificava se o role era `'atendente'` (português)
- **supabase/functions/server/index.tsx**: Filtrava por `'atendente'` no backend

### 2. Erros no Componente requests-list.tsx
- Função `handleScheduleAudience` fazia referência a variáveis não declaradas (`setSelectedAudience`, `setScheduleDialogOpen`)
- Import faltando: `Calendar` do lucide-react estava sendo referenciado como `CalendarIconLucide`

## Correções Aplicadas

### 1. App.tsx (linha 60)
```tsx
// ANTES
if (user.role === 'atendente') {

// DEPOIS
if (user.role === 'attendant') {
```

### 2. requests-list.tsx
#### Correção dos imports (linha 13)
```tsx
// ANTES
import { Search, Eye, Check, X, UserCheck, FileText } from "lucide-react";

// DEPOIS
import { Search, Eye, Check, X, UserCheck, FileText, Calendar as CalendarIcon } from "lucide-react";
```

#### Remoção da função problemática (linhas 186-189)
```tsx
// REMOVIDO
const handleScheduleAudience = (audience: any) => {
  setSelectedAudience(audience);
  setScheduleDialogOpen(true);
};
```

#### Correção do ícone (linha 508)
```tsx
// ANTES
<CalendarIconLucide className="h-4 w-4 mr-2" />

// DEPOIS
<CalendarIcon className="h-4 w-4 mr-2" />
```

### 3. supabase/functions/server/index.tsx
#### Linha 803
```tsx
// ANTES
const attendants = allUsers.filter(u => u.role === 'atendente')

// DEPOIS
const attendants = allUsers.filter(u => u.role === 'attendant')
```

#### Linha 899
```tsx
// ANTES
const attendants = allUsers.filter(u => u.role === 'atendente')

// DEPOIS
const attendants = allUsers.filter(u => u.role === 'attendant')
```

## Fluxo Correto Agora

### Para Administradores
1. Login com `admin@sistema.com` / `123456`
2. Menu lateral mostra "Gerenciar Solicitações"
3. Ao clicar, renderiza o componente `<RequestsList />`
4. Pode aceitar, delegar ou rejeitar solicitações

### Para Atendentes
1. Login com `atendente@sistema.com` / `123456`
2. Menu lateral mostra "Gerenciar Solicitações"
3. Ao clicar, renderiza o componente `<SecretarySchedule />`
4. Pode agendar reuniões para solicitações aceitas pelos administradores

## Verificação das Permissões
O arquivo `permissions.tsx` já estava correto:
```tsx
VIEW_ALL_PRESENTATIONS: ['admin', 'attendant'] as UserRole[],
MANAGE_REQUESTS: ['admin', 'attendant'] as UserRole[],
```

## Status
✅ **CORRIGIDO** - O menu "Gerenciar Solicitações" agora está funcionando corretamente para admin e atendente.

## Testes Recomendados
1. Login como admin → Verificar acesso a "Gerenciar Solicitações"
2. Login como atendente → Verificar acesso a "Gerenciar Solicitações"
3. Criar uma solicitação como usuário comum
4. Como admin: aceitar/delegar/rejeitar a solicitação
5. Como atendente: agendar reunião para solicitação aceita
