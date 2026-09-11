# `admin_sistema` — Perspetiva de Código

> Para o manual operacional (como usar cada ecrã), ver
> [`../user/admin-system.md`](../user/admin-system.md). Este documento é sobre como o role está
> implementado.

## Natureza do role

`admin_sistema` é um **role técnico**, sem departamento correspondente na tabela `Department`
(os outros 25 roles são todos = slug de um departamento — ver
[`authorization-rbac.md`](authorization-rbac.md)). Separa explicitamente:

- **Gestão de negócio** (Actas, Facturas, Compras, ...) — feita pelos gabinetes executivos/
  departamentos, via RBAC real (`RolePermission`).
- **Gestão de sistema** (Utilizadores, Departamentos, Roles, Auditoria, Base de Dados,
  Configurações, Licença) — exclusiva de `admin_sistema`, verificada com
  `req.user.role === 'admin_sistema'` fixo no código (`requireSystemAdmin`), não via
  `RolePermission`. Ver [`authorization-rbac.md#camada-2--checks-hardcoded-rotas-administrativas`](authorization-rbac.md).

`Role.sistema = true` na tabela `Role` marca este e outros roles de sistema como não-elimináveis
via a UI (`roles.routes.ts` recusa `DELETE`/edição de permissões sobre roles com `sistema=true`).

## Ecrãs exclusivos (menu `admin-tecnico`, `permissions.tsx`)

`dashboard`, `schedule`, `users`, `email-management`, `audit-dashboard`, `departments-admin`,
`areas-admin`, `roles-permissions-admin`, `system-diagnostics`, `license-management`, `trash`,
`database-management`, `department-dashboard`, `settings`, `messages`, `push-notifications`.

## Rotas backend correspondentes

| Ecrã | Rotas principais |
|---|---|
| Utilizadores | `users.routes.ts` — `GET /`, `GET /all`, `POST /create`, `PUT /:userId`, `PUT /:userId/status` |
| Departamentos | `departments.routes.ts` — `GET/POST /`, `GET /stats`, `PUT/DELETE /:id` |
| Áreas | `areas.routes.ts` — CRUD completo |
| Roles e Permissões | `roles.routes.ts` — `GET/POST /`, `PUT/DELETE /:id`, `GET/PUT /:id/permissions` |
| Auditoria | `audit.routes.ts` — `GET /logs`, `/alerts`, `/stats`, `POST /alerts/:id/resolve` |
| Diagnóstico do Sistema | `system.routes.ts` — `GET /health`, `/diagnostics`, `/logs` |
| Modo de Manutenção | `system.routes.ts` — `GET/POST /maintenance-mode` |
| Cópias de Segurança | `system.routes.ts` — `POST/GET /backups`, `GET /backups/:filename/download` |
| Licença | `license.routes.ts` — `POST /activate`, `POST /refresh`, `GET /status`, `/fingerprint`, `/history` |
| Lixeira | `trash.routes.ts` — `GET /`, `POST /:module/:id/restore`, `DELETE /:module/:id` |

Todas protegidas por `requireAuth` + `requireSystemAdmin`.

## Guard de lockout

`roles.routes.ts` recusa qualquer edição das permissões do role `admin_sistema` (409) —
evita que um administrador se bloqueie a si próprio removendo acidentalmente o seu próprio
acesso administrativo. Adicionado durante a auditoria em conjunto com o alerta de disclosure na
UI (ver [`authorization-rbac.md`](authorization-rbac.md)).
