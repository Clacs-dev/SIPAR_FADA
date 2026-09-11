# Testes — SIPAR-FADA

## Servidor

`node:test` (nativo, sem framework externo). Ficheiros em `server/src/tests/*.test.ts`,
compilados por `tsc` e corridos contra o `dist/`:

```bash
npm run build
node --test "dist/tests/*.test.js"
```

| Ficheiro | Cobre |
|---|---|
| `health.test.ts` | Health check (200 saudável, 404 rota inexistente) |
| `business-rules.test.ts` | Máquinas de estado (`BusinessRulesService`) — incluindo a invariante financeira "factura não pode ir de `aprovado` direto a `pago`" e a cadeia completa de procurement |
| `license.test.ts` | `verifySignature` (com um par de chaves Ed25519 gerado só para o teste — nunca a chave real do vendor), `moduleIncluded`, `featureEnabled`, `isRestricted` |
| `auth.test.ts` | Rejeição de token ausente/malformado/assinado com chave errada/expirado em rota protegida |

Sem mocks de Prisma — os testes de integração (`health.test.ts`, `auth.test.ts`) arrancam a app
real e batem na base de dados de desenvolvimento; escritos para nunca precisarem de dados
semeados (só testam rejeição antes de qualquer leitura/escrita real).

## Cliente

Vitest. Ficheiros `client/src/**/*.test.ts`:

```bash
npm run test        # vitest run
npm run test:watch
```

| Ficheiro | Cobre |
|---|---|
| `services/api.test.ts` | `getFriendlyErrorMessage` |
| `components/auth/permissions.test.ts` | `hasPermission` — incluindo que `MANAGE_USERS`/`MANAGE_SETTINGS` são exclusivos de `admin_sistema` |

## CI

`.github/workflows/ci.yml` — dois jobs (`server`, `client`), correm em cada push/PR para `main`:
`npm ci` → migrações → `build`/`typecheck` → `test`. O typecheck do cliente falha o CI só se o
número de erros de `tsc` **aumentar** face à baseline conhecida (72, documentada) — não bloqueia
por erros pré-existentes, mas apanha regressões novas.
