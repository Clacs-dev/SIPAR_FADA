# Frontend — SIPAR-FADA

React 18 + Vite 6 + TypeScript. Componentes UI baseados em Radix (`client/src/components/ui/`).

## Navegação — sem router real

`client/src/App.tsx` controla qual ecrã é mostrado através de um `useState<string>` e um
`switch/case` gigante (`renderContent()`), não um router (React Router ou equivalente). Implica:

- Sem deep-linking — não há URL que aponte diretamente para um registo específico.
- Um `F5`/refresh na app volta sempre ao dashboard.
- Um canal lateral manual (`onNavigateToActa`) existe só para abrir uma acta específica a partir
  da Agenda — sintoma direto da falta de router, não uma funcionalidade genérica.

Introduzir um router real está registado em [`known-issues.md`](../known-issues.md#fe-22) —
mudança de arquitetura, não corrigida nesta auditoria.

## Estrutura de componentes (`client/src/components/`)

Organizados por domínio: `auth/`, `admin/` (ecrãs de `admin_sistema`), `management/` (utilizadores,
actas, compras, comunicações — via componentes "wrapper" que ligam à API real), `compras/`,
`comunicacoes/`, `facturas/`, `dashboard/`, `forms/` (formulários públicos), `external/`
(portal público de fornecedores), `license/`, `layout/` (sidebar, topbar), `ui/` (primitivas Radix).

`actas/` e `figma/` contêm remanescentes de árvores de código órfãs identificadas e parcialmente
removidas durante a auditoria — ver [`known-issues.md`](../known-issues.md#arch-05). Antes de
editar qualquer ficheiro em `actas/`, confirmar que é alcançável a partir de `App.tsx`
(`grep` pelo nome do componente).

## Hooks de dados (`client/src/hooks/`)

Padrão: `use-<recurso>.tsx` (ex.: `use-departments.tsx`, `use-roles.tsx`, `use-license.tsx`) —
fazem fetch, expõem `{ data, loading, error, reload, ...mutações }`. **Erros de fetch nunca devem
virar "lista vazia" silenciosa** — todos os hooks corrigidos nesta auditoria expõem um campo
`error` distinto de `data: []`, e o componente consumidor mostra um estado de erro dedicado (ver
`use-trash.tsx` + `client/src/components/admin/trash.tsx` como referência de padrão a seguir em
hooks novos).

⚠️ **Armadilha de nomes conhecida**: existem `hooks/useActas.ts` (camelCase, **usado** por
`internal-meetings-list.tsx` e `schedule/agenda.tsx`) e `hooks/use-actas.tsx` (kebab-case,
**órfão**, sem importadores). Confirmar sempre com `grep` qual dos dois um componente importa
antes de o editar.

## Estado de autenticação

`client/src/components/auth/auth-context.tsx` — `AuthProvider` (Context API), guarda
`accessToken`/`user` em `localStorage`. Ver [`authentication.md`](authentication.md) e
[`../security/security.md`](../security/security.md) para as implicações desta escolha.

## RBAC no cliente

`client/src/components/auth/permissions.tsx` — `PERMISSIONS` (objeto estático, ~30 chaves,
mapeando cada permissão a uma lista fixa de `UserRole`) + `hasPermission(role, permission)`.
Controla o quê é mostrado na UI (menu, botões) — **nunca a autoridade real**, que vive sempre no
backend. Ver [`authorization-rbac.md`](authorization-rbac.md) para a lista completa e para o
`known-issues.md#hc-05` sobre esta lista estática duplicar o RBAC real do backend
(`RolePermission`, tabela).

## Build e testes

```bash
npm run typecheck   # tsc --noEmit — baseline conhecida de erros pré-existentes, não bloqueia o build
npm run test         # Vitest
npm run build         # vite build — não corre o typecheck completo do tsc
```

Testes existentes: `client/src/services/api.test.ts`, `client/src/components/auth/permissions.test.ts`.
