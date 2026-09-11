# Troubleshooting — Perspetiva de Código

> Para problemas do ponto de vista de quem instala/opera, ver
> [`../operations/`](../operations/) e [`../devops/runbook.md`](../devops/runbook.md). Este
> documento é para quem está a depurar o código-fonte.

| Sintoma | Onde olhar primeiro |
|---|---|
| `EPERM`/ficheiro bloqueado ao correr `prisma generate`/migrate no Windows | Um processo `ts-node-dev` (servidor em dev) está a correr e bloqueia o Prisma Client gerado. Parar o processo Node antes de migrar. |
| `JWT_SECRET nao definido` ao arrancar | `server/middlewares/auth.ts:17` lança logo no `import` — falta `.env` ou a variável está vazia. |
| CORS_ORIGINS/FRONTEND_URL — servidor recusa arrancar | Só acontece com `NODE_ENV=production`. Definir pelo menos uma. |
| `prisma migrate dev` falha "ambiente não-interativo" | Usar `prisma migrate diff --from-migrations ... --script` + `prisma migrate deploy` em vez disso — ver [`database.md`](database.md). |
| Cliente compila mas comportamento não muda | Confirmar que não se está a editar um ficheiro em `client/src/components/actas/` ou `client/src/imports/` não alcançável a partir de `App.tsx` — ver [`known-issues.md`](../known-issues.md#arch-05). |
| Endpoint devolve `{success:true}` mas nada acontece | Conferir a lista de stubs conhecidos em [`api.md`](api.md) e [`known-issues.md`](../known-issues.md#arch-11) antes de assumir bug novo. |
| `502`/timeout entre Tauri e servidor | Ver [`../operations/network.md`](../operations/network.md) — confirmar `VITE_API_URL` usado no build do instalador (não pode ser alterado sem recompilar). |
| Testes de `auth.test.ts`/`health.test.ts` falham localmente | Precisam de `JWT_SECRET` válido no `.env` e de a base de dados de desenvolvimento estar migrada (`npx prisma migrate deploy`). |
| `npm run typecheck` do cliente mostra centenas de erros | Confirmar que ainda são os ~72 pré-existentes conhecidos (`npm run typecheck 2>&1 \| grep -c "error TS"`) — se subir, é uma regressão real a corrigir antes do merge. |
