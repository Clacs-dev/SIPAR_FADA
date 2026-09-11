# Base de Dados — SIPAR-FADA

## Motor atual

SQLite, um único ficheiro (`server/prisma/dev.db`), gerido via Prisma 5.10. `schema.prisma`
fixa `provider = "sqlite"` — ver [`architecture.md`](architecture.md#base-de-dados--estado-atual-vs-roteiro)
para o roteiro (não implementado) de PostgreSQL principal + SQLite auxiliar.

## Migrações — workflow obrigatório

```bash
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script > migration.sql
# rever o SQL gerado
npx prisma migrate deploy
```

**Nunca usar `prisma db push` contra uma base de dados com dados reais** — não gera histórico de
migração, o schema evoluiu por muito tempo desta forma antes de a auditoria introduzir o
histórico real (`server/prisma/migrations/`). `prisma migrate dev` não funciona em ambientes
não-interativos (CI, scripts) — usar sempre `migrate diff` + `migrate deploy`.

## Os 48 modelos, por domínio

| Domínio | Modelos |
|---|---|
| Identidade/RBAC | `User`, `Department`, `Area`, `Role`, `RolePermission` |
| Sessões/segurança | `UserSession`, `PasswordResetToken` |
| Reuniões | `InternalMeeting`, `MeetingRoom`, `InternalMeetingParticipant` |
| Módulos de negócio (CRUD genérico) | `Presentation`, `Audience`, `Factura`, `Fornecedor`, `Procurement`, `Comunicacao`, `Acta` |
| Compras — Fase 2 | `PurchaseQuotation`, `PurchaseOrder`, `ProcurementCategoria` |
| Financeiro — Fase 2 | `Budget`, `BudgetLine`, `BudgetExecution`, `AccountPayable`, `AccountReceivable`, `FinancialReport` |
| Infraestrutura transversal | `UploadedFile`, `Notification`, `AuditLog`, `Message`, `PushSubscription`, `SystemSetting` |
| Sequência/histórico/workflow genérico | `DocumentSequence`, `DocumentHistory`, `ApprovalWorkflow`, `ApprovalStep`, `ValidationRule` |
| Licenciamento | `License` |
| **Schema existe, sem rota CRUD (dormentes)** | `Pedido`, `Oficio`, `Viatura`, `Contrato`, `Reclamacao`, `Planejamento`, `Operador`, `PedidoViatura`, `UtilizacaoViatura`, `ManutencaoViatura` |

## Padrões usados no schema

- **JSON-em-String**: muitos modelos têm um campo `data String @default("{}")` guardando um blob
  JSON livre (dados específicos do módulo não modelados como colunas). Nenhuma validação de
  schema (zod) é aplicada a este blob — ver [`known-issues.md`](../known-issues.md#db-015).
- **Soft-delete**: `deletedAt`/`deletedById`/`deletedByName` — presente em `User`\*, `Department`,
  `Role`, `Area`, `Presentation`, `Audience`, `Factura`, `Fornecedor`, `Procurement`, `Comunicacao`.
  **Não presente** em `Acta`\*\*, `Oficio`, `PurchaseOrder`, `Budget`, os modelos financeiros
  Fase 2, entre outros — sem critério documentado sobre quais precisam. Ver
  [`known-issues.md`](../known-issues.md#db-019). (\* `User` usa `status` em vez de soft-delete
  próprio. \*\* `Acta` tem os campos mas confirmar o handler de DELETE antes de assumir que estão
  ligados.)
- **`createdById` sem índice consistente**: a maioria dos modelos de negócio tem
  `@@index([createdById])` (adicionado durante a auditoria) — os modelos financeiros Fase 2
  também já o têm. Ao adicionar um modelo novo com `createdById`, adicionar o índice.
- **IDs**: a maioria usa `@id @default(uuid())`; um subconjunto mais antigo usa `id String @id`
  sem default (o valor é gerado em código, com `crypto.randomUUID()` desde a auditoria).

## Sequência de números de documento

`DocumentSequence` (chave `[module, year, month, prefix]`) + `SequenceService.next(module)`
(transação atómica) — usado para `procurement`, `purchaseOrder`, `factura`. Nunca gerar números
de documento com `Date.now()`.
