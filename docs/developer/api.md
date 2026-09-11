# Inventário de API — SIPAR-FADA

Base: `http://<servidor>:<PORT>/api/v1` (e um alias legado sem `/v1` só para `/health`). Todas
as rotas abaixo, exceto onde indicado "público", exigem `Authorization: Bearer <accessToken>`.

## Sistema

| Método | Rota | Auth | Notas |
|---|---|---|---|
| GET | `/api/health`, `/api/v1/health` | Público | Verifica ligação real à BD (503 se falhar) |
| POST | `/api/v1/initialize` | Público | Stub sem efeito real |
| GET | `/api/v1/stats` | `admin_sistema` | Contagens gerais (users/notifications/auditLogs) |
| GET | `/api/v1/list-all-users` | `admin_sistema` | Lista simplificada de utilizadores |
| POST | `/api/v1/sync-all-users` | `admin_sistema` | Stub, `synced:0` sempre |
| POST | `/api/v1/create-additional-users` | `admin_sistema` | Stub, `created:0` sempre |
| POST | `/api/v1/admin/reset-admin-user` | `admin_sistema` | Stub no-op, sem consumidor frontend conhecido |

## Autenticação (`/auth`)

`POST /register` · `POST /login` · `POST /reset-password` · `POST /reset-password/confirm` ·
`POST /refresh` · `POST /reset-demo-users` (`admin_sistema`) · `GET /me` · `PUT|POST /me` ·
`PUT /me/bank-details` · `POST /me/signature` (upload) · `POST /logout`

## Licenciamento (`/license`)

`POST /activate` · `POST /refresh` · `GET /status` · `GET /fingerprint` · `GET /history`
(4 últimas, `admin_sistema`). Ver [`licensing.md`](licensing.md).

## Módulos de negócio (motor de CRUD genérico)

Para cada um de `/presentations`, `/audiences`, `/facturas`, `/fornecedores`, `/procurement`,
`/comunicacoes`, `/actas`:

`GET /` (lista) · `GET /:id` · `POST /` (criar) · `PUT /:id` · `DELETE /:id` (soft-delete) ·
`POST /:id/approve` · `POST /:id/reject` · `GET /:id/history` · `PUT /:id/status` ·
`GET /alertas/vencimento` (stub) · `POST /upload`, `/upload-anexo` (stubs — usar `/storage/upload`) ·
`GET /:id/pdf` · `POST /:id/responder` · `GET/POST/PUT/DELETE /:id/intervencoes` (stub) ·
`POST /:id/delegar`, `/delegate`, `/assign`, `/anexos`, `/assinar`, `/enviar-revisao`,
`/fechar-publica`. Mais `GET/POST /procurement/categorias`.

Ver [`backend.md#motor-de-crud-genérico`](backend.md) para quais destes são stubs reais vs.
implementados.

## Compras/Financeiro Fase 2 (`/phase4`, também montado como `/compras-avancadas`,
`/orcamentos`, `/financeiro` — ver [`known-issues.md`](../known-issues.md#arch-10))

`POST/GET /procurements/:id/quotations` · `POST /quotations/:id/select` ·
`POST /procurements/:id/purchase-order` · `GET /purchase-orders` ·
`POST /purchase-orders/:id/receive` · `POST/GET /budgets` · `POST /budgets/:id/lines` ·
`POST /budgets/:id/approve` · `POST /budgets/:id/executions` · `GET /budgets/:id/summary` ·
`POST/GET /accounts-payable` · `POST /accounts-payable/:id/pay` ·
`POST/GET /accounts-receivable` · `POST /accounts-receivable/:id/receive` · `GET /cash-flow` ·
`POST /reports/generate` · `GET /reports`

## Administração

| Router | Rotas |
|---|---|
| `/users` | `GET /`, `/all` · `POST /create` · `PUT /:userId`, `/:userId/status` |
| `/departments` | `GET /`, `/stats` · `POST /` · `PUT/DELETE /:id` |
| `/areas` | `GET /` · `POST /` · `PUT/DELETE /:id` |
| `/roles` | `GET /`, `/:id/permissions` · `POST /` · `PUT /:id`, `/:id/permissions` · `DELETE /:id` |
| `/trash` | `GET /` · `POST /:module/:id/restore` · `DELETE /:module/:id` |
| `/audit` | `GET /logs`, `/alerts`, `/stats`, `/views/:module/:resourceId` · `POST /alerts/:id/resolve`, `/view` |
| `/system` | `GET /health`, `/diagnostics`, `/logs`, `/maintenance-mode` · `POST /maintenance-mode` · `POST/GET /backups` · `GET /backups/:filename/download` |
| `/email` | `GET /test`, `/stats` · `POST /send-test` |

## Reuniões

| Router | Rotas |
|---|---|
| `/internal-meetings` | `GET /` · `POST /` · `PUT/DELETE /:id` |
| `/meeting-rooms` | `GET /`, `/disponibilidade` · `POST /` · `PUT/DELETE /:id` |

## Transversais

| Router | Rotas |
|---|---|
| `/messages` | `GET /` · `POST /` · `PUT /:id/read` |
| `/notifications` | `GET /user/:email` · `POST /send-pending` · `PUT /:id/read` |
| `/push` | `GET /stats`, `/vapid-key` · `POST /subscribe`, `/send-to-user`, `/send-to-role`, `/broadcast` |
| `/dashboard` | `GET /stats` |
| `/documents` | `POST /upload` · `GET/POST /signed-url` |
| `/storage` | `POST /upload`, `/init-buckets` · `DELETE /delete` |

## Formato de resposta — inconsistente

Cerca de 132 de 235 handlers incluem `success: true/false` na resposta; o resto não. Ver
[`known-issues.md`](../known-issues.md#arch-14) — não assumir a presença de `success` sem
confirmar no handler específico.
