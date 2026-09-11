# Backend — SIPAR-FADA

Express 4 + TypeScript + Prisma. Entrada: `server/src/index.ts`.

## Middlewares globais (ordem real, `index.ts`)

1. `requestContext` — atribui um `x-request-id` a cada pedido (gerado se o cliente não enviar um), devolvido em todas as respostas.
2. `morgan` — log HTTP estruturado, escrito através do Winston (ver secção "Auditoria e logs").
3. `helmet` — cabeçalhos de segurança. `crossOriginResourcePolicy: false` **globalmente** (não só em `/uploads`) — para permitir carregar imagens de upload cross-origin no frontend. Ver [`../security/security.md`](../security/security.md).
4. `cors` — origens permitidas vêm de `CORS_ORIGINS` ou `FRONTEND_URL`. **Em produção (`NODE_ENV=production`), se nenhuma das duas estiver definida, o servidor recusa arrancar** (`throw` em `parseAllowedOrigins()`) — este é o único fail-fast de arranque que existe hoje; não há validação equivalente para `DATABASE_URL` ou outras variáveis.
5. `express.json`/`express.urlencoded` — limite de 10MB.
6. `hpp` — proteção contra poluição de parâmetros HTTP.
7. `rateLimit` — 500 pedidos / 15 minutos, por IP, global (`express-rate-limit`). Rotas de autenticação (`auth.routes.ts`) têm um limiter dedicado adicional (`authLimiter`) mais restrito.
8. `express.static('/uploads', ...)` — serve os ficheiros carregados localmente.

## Health check

`GET /api/health` e `GET /api/v1/health` — faz `SELECT 1` real à base de dados via Prisma.
Devolve `200 {"status":"ok"}` se a BD responder, `503 {"status":"error"}` caso contrário. Usado
como verificação de saúde por qualquer mecanismo de supervisão de processo (ver
[`../operations/on-premises.md`](../operations/on-premises.md)).

`POST /api/v1/initialize` existe mas é um stub sem efeito real (`{"success":true,"message":"System initialized with SQLite database"}`, sempre) — sem consumidor conhecido no frontend.

## Motor de CRUD genérico

Sete módulos de negócio partilham um único motor de rotas parametrizado, em vez de um router
próprio cada um: `server/src/utils/module-routes-helper.ts` (`ModuleRoutesHelper` — list, get,
create, update, delete, setStatus, history) + `server/src/routes/modules.routes.ts`
(`registerCrud(config)`, chamado para cada `ModuleConfig`):

| `name` | `path` | `permissionModule` | Modelo Prisma |
|---|---|---|---|
| presentation | `/presentations` | presentations | Presentation |
| audience | `/audiences` | audiences | Audience |
| factura | `/facturas` | invoices | Factura |
| fornecedor | `/fornecedores` | finance | Fornecedor |
| procurement | `/procurement` | finance | Procurement |
| comunicacao | `/comunicacoes` | communications | Comunicacao |
| acta | `/actas` | actas | Acta |

Cada um destes ganha automaticamente, para além do CRUD básico: `POST/GET/PUT/DELETE .../:id/intervencoes`,
`GET .../:id/pdf`, `POST .../:id/delegar`, `.../assinar`, `.../enviar-revisao`, `.../responder`,
`.../fechar-publica`, `GET .../alertas/vencimento`. **Alguns destes são stubs que devolvem dados
vazios/simulados em vez de 501** — ver [`known-issues.md`](../known-issues.md#arch-11) para o
estado exato de cada um (um deles, o `/pdf` de Actas, foi corrigido para gerar o PDF real
client-side; os restantes permanecem stubs, mas confirmados como não alcançáveis a partir da UI
real).

Lógica de negócio específica de Procurement/Facturas/Compras (aprovação, emissão de ordem,
receção, geração automática de factura) vive **no mesmo ficheiro** `modules.routes.ts`
(1696 linhas) em vez de num router/serviço dedicado — ver [`known-issues.md`](../known-issues.md#arch-02).

### Modelos com schema mas sem rota CRUD (dormentes)

`Viatura`, `PedidoViatura`, `UtilizacaoViatura`, `ManutencaoViatura`, `Contrato`, `Pedido`,
`Oficio`, `Reclamacao`, `Planejamento`, `Operador` têm modelo completo em `schema.prisma` mas
**nenhuma rota registada** em `modules.routes.ts` — consistente com a remoção do frontend de
"Frotas"/"Contratos" já confirmada no repositório. Não usar estes modelos como se estivessem
disponíveis via API. Ver [`known-issues.md`](../known-issues.md#db-017).

## Routers standalone (fora do motor genérico)

`auth`, `license`, `storage`, `users`, `internal-meetings`, `email`, `notifications`, `audit`,
`messages`, `push`, `dashboard`, `documents`, `departments`, `roles`, `areas`, `trash`, `system`,
`meeting-rooms`, `phase4` (montado sob 4 prefixos: `/phase4`, `/compras-avancadas`, `/orcamentos`,
`/financeiro` — ver [`known-issues.md`](../known-issues.md#arch-10)). Inventário completo de
endpoints em [`api.md`](api.md).

## Serviços (`server/src/services/`)

| Serviço | Responsabilidade |
|---|---|
| `audit.service.ts` | Grava `AuditLog` (BD) + espelha para o Winston — ver "Auditoria e logs" abaixo |
| `backup.service.ts` | Cópia do `dev.db` para `backups/`, retenção das 30 mais recentes |
| `business-rules.service.ts` | Máquinas de estado por módulo (transições válidas, campos obrigatórios) — cobre 5 módulos: pedido, factura, procurement, contrato, reclamacao |
| `email.service.ts` | Envio de e-mail via SMTP/Gmail (ver [`configuration-environment.md`](configuration-environment.md)) |
| `history.service.ts` | Grava `DocumentHistory` em transições de estado |
| `license.service.ts` | Ver [`licensing.md`](licensing.md) |
| `meeting-link.service.ts` | Gera links de reunião por plataforma (Zoom/Teams/Meet) a partir de variáveis de ambiente fixas — sem CRUD, avaliado como estruturalmente correto (cada plataforma exige integração OAuth própria) |
| `notification.service.ts` | Cria `Notification` + dispara push/e-mail conforme o tipo |
| `sequence.service.ts` | `SequenceService.next(module)` — geração atómica de números de documento (`PROC/AAAA/MM/NNNN`, etc.), usa `prisma.$transaction` |
| `storage.service.ts` | Gestão do diretório de uploads local (`ensureUploadDirectoryExists`, `deleteFile`) |
| `validation.service.ts` | Validação de campos obrigatórios por módulo/estado |
| `workflow.service.ts` | Fluxos de aprovação multi-nível (`ApprovalWorkflow`/`ApprovalStep`) |

## Auditoria e logs

Duas infraestruturas distintas, usadas em conjunto:

- **`AuditLog`** (tabela Prisma, persistida): toda ação relevante de negócio/segurança passa por
  `auditService.logAction(action, severity, metadata, context)` — grava na BD (consultável via
  `GET /api/v1/audit/logs`, ecrã "Auditoria & Segurança" no admin) e espelha para o Winston.
  `severity` é `'info' | 'warning' | 'error'`.
- **Winston** (`server/src/config/logger.ts`): ficheiros `server/logs/error.log` (só nível error)
  e `server/logs/combined.log` (tudo), mais consola. **Sem rotação nem limite de tamanho
  configurado** — cresce indefinidamente enquanto o servidor correr. Ver
  [`known-issues.md`](../known-issues.md#ops-08).
- `errorHandler` (middleware global) regista o stack completo no Winston para todo erro não
  tratado, incluindo `path`/`method`/`ip` — **sem redação de campos sensíveis** (password, token)
  caso apareçam nos dados do erro. O corpo da resposta HTTP só inclui o stack/detalhes quando
  `NODE_ENV=development` (em produção, o cliente só vê `message` genérica). Ver
  [`known-issues.md`](../known-issues.md#ops-27).

## Convenções obrigatórias em código novo

- **Eliminação é sempre soft-delete** (`deletedAt`/`deletedById`/`deletedByName`) — nunca
  `prisma.<model>.delete()` nos modelos que já têm estes campos. Ver [`known-issues.md`](../known-issues.md#db-019)
  para os modelos que ainda não têm soft-delete.
- **Números de documento** usam sempre `SequenceService.next(module)`, nunca `Date.now()`.
- **IDs gerados pela aplicação** usam `crypto.randomUUID()`.
- **Sequências de escrita multi-tabela** (aprovar → criar registo ligado → atualizar estado)
  ficam dentro de `prisma.$transaction(async (tx) => {...})`.
- **Toda rota de negócio nova** leva `requireAuth` + `requireLicense(moduleKey)` — nunca só
  `requireAuth`, exceto rotas explicitamente públicas.
