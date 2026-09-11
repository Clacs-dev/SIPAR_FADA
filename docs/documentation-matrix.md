# Matriz de Rastreabilidade — SIPAR-FADA

`Funcionalidade → Código responsável → Documento → Estado`. ✅ implementado e documentado ·
🟡 parcial · ❌ não implementado (documentado como tal, não escondido).

| Funcionalidade | Código | Documento | Estado |
|---|---|---|---|
| Login / logout | `auth.controller.ts`, `auth-context.tsx` | `developer/authentication.md`, `user/login.md` | ✅ |
| Recuperação de password | `auth.controller.ts` (`resetPassword`/`confirmResetPassword`), `PasswordResetToken` | `developer/authentication.md`, `user/login.md` | ✅ |
| Revogação de sessão | `UserSession`, `auth.ts` (`requireAuth`) | `developer/authentication.md` | ✅ |
| RBAC — módulos de negócio | `RolePermission`, `permissions.ts` | `developer/authorization-rbac.md` | ✅ |
| RBAC — rotas administrativas | `requireSystemAdmin`, `isAdminUser()` (via `Role.executivo`, cache 5min) | `developer/authorization-rbac.md` | 🟡 real mas não ligado a `RolePermission` (autorização em si já não é hardcoded — ver `known-issues.md`) |
| Supervisão de processo do servidor | `server/scripts/install-windows-service.ps1`, `sipar-fada-backend.service` | `devops/runbook.md`, `known-issues.md` | 🟡 scripts prontos, mas exigem execução manual uma vez por instalação |
| RBAC no cliente (menu) | `permissions.tsx` | `developer/frontend.md`, `developer/authorization-rbac.md` | 🟡 duplica o RBAC real, não sincronizado |
| Licenciamento — ativação/validação | `license.service.ts`, `License` | `developer/licensing.md`, `deployment/licensing.md` | ✅ |
| Licenciamento — `minVersion` | `license.service.ts` (campo aceite) | `developer/licensing.md` | ❌ nunca aplicado |
| Motor de CRUD genérico (7 módulos) | `module-routes-helper.ts`, `modules.routes.ts` | `developer/backend.md`, `developer/api.md` | ✅ |
| Módulos dormentes (Viatura, Oficio, ...) | Modelos em `schema.prisma`, sem rota | `developer/backend.md`, `known-issues.md` | ❌ |
| Compras/Financeiro Fase 2 | `phase4.routes.ts` | `developer/api.md`, `user/modules/compras.md` | ✅ |
| Upload/Storage | `storage.controller.ts` | `developer/storage.md`, `user/documents.md` | ✅ |
| Auditoria (`AuditLog`) | `audit.service.ts` | `developer/backend.md`, `user/admin-system.md` | ✅ |
| Logs (Winston) | `logger.ts` | `developer/backend.md` | 🟡 sem rotação |
| Cópias de segurança | `backup.service.ts` | `operations/backup-recovery.md` | 🟡 cobre só a BD, sem restauro automatizado |
| Health check | `index.ts` (`/health`) | `developer/backend.md`, `devops/runbook.md` | ✅ |
| Modo de Manutenção | `system.routes.ts` | `user/admin-system.md`, `devops/runbook.md` | ✅ |
| Configuração de ligação no cliente | `client/src/services/api.ts`, `components/auth/server-url-dialog.tsx` | `developer/architecture.md`, `developer/tauri.md` | ✅ ícone no ecrã de login, `localStorage` |
| PostgreSQL principal + SQLite auxiliar (roteiro) | — | `developer/architecture.md` | ❌ não implementado |
| Backend como executável Windows + instalador Inno Setup (roteiro) | — | `developer/architecture.md`, `deployment/server-installation.md` | ❌ decidido (ferramenta e desenho do ecrã de `.env`), não implementado |
| Atualização automática (Tauri) | — | `deployment/update.md` | ❌ não implementado |
| Paginação nas listagens | — | `known-issues.md` (FE-09) | ❌ não implementado |
| Testes automatizados | `server/src/tests/`, `client/src/**/*.test.ts` | `developer/testing.md` | ✅ (cobertura focada: licenciamento, auth, RBAC, transições financeiras) |
| CI | `.github/workflows/ci.yml` | `developer/testing.md` | ✅ |
