# Fluxo de Desenvolvimento

## Arrancar localmente

```bash
# Backend
cd server
npm install
cp .env.example .env   # editar com valores locais
npx prisma migrate deploy
npm run dev              # ts-node-dev --respawn

# Frontend (browser normal)
cd client
npm install
npm run dev

# Janela desktop Tauri (opcional)
cd client
npm run tauri dev
```

Credenciais de teste: ver [`../user/README.md`](../user/README.md) ou `server/README.md`.

## Antes de abrir PR

```bash
cd server && npm run build && npm test
cd client && npm run typecheck && npm test && npm run build
```

O CI (`.github/workflows/ci.yml`) corre exatamente os mesmos passos.

## Convenções (ver detalhe em [`backend.md`](backend.md) e [`database.md`](database.md))

- Eliminação = soft-delete, nunca `.delete()` direto nos modelos que já têm `deletedAt`.
- Números de documento via `SequenceService.next(module)`.
- IDs via `crypto.randomUUID()`.
- Sequências multi-tabela dentro de `prisma.$transaction`.
- Toda rota de negócio nova: `requireAuth` + `requireLicense(moduleKey)`.
- Hooks de dados novos expõem `error` distinto de dados vazios — nunca tratar erro de fetch como
  lista vazia silenciosa.
- Ações destrutivas irreversíveis usam `AlertDialog` (`client/src/components/ui/alert-dialog.tsx`),
  nunca `confirm()`/`alert()` nativos.

## Antes de assumir que uma funcionalidade existe

Este código tem um histórico real de: (a) endpoints stub que devolvem sucesso falso, (b) modelos
com schema mas sem rota, (c) árvores de componentes órfãs ainda editadas por engano. Antes de
construir sobre algo, confirmar com `grep` que está de facto ligado e a ser usado — ver
[`known-issues.md`](../known-issues.md) para a lista já identificada.
