# SIPAR-FADA

Sistema integrado de gestão administrativa (actas, correspondência, facturação, compras/procurement,
frotas, reuniões) com licenciamento próprio.

## Arquitetura

Aplicação **on-premise por cliente**, não SaaS multi-tenant na nuvem: cada cliente (ex.: FADA)
tem a sua própria instalação isolada, dentro da sua rede — **um servidor central** + a app
desktop instalada em cada PC de utilizador dessa rede. Ver
[`docs/developer/architecture.md`](docs/developer/architecture.md) para o diagrama completo.

- `server/` — API Express + Prisma (SQLite). Corre uma única vez, no servidor central. Ver
  [`server/README.md`](server/README.md) para configuração, migrações, testes, backups e
  supervisão de processo em produção.
- `client/` — Frontend React + Vite, empacotado como janela desktop via Tauri
  (`client/src-tauri/`). Instalado em cada PC de utilizador. Ver
  [`client/README.md`](client/README.md) para o build de desktop e o estado da atualização
  automática.
- `license-tools/` — CLI do vendor para emitir licenças/certificados/CRL assinados. **Nunca**
  distribuída com o cliente — ver [`license-tools/README.md`](license-tools/README.md).

## Documentação

Documentação técnica e operacional completa em [`docs/`](docs/README.md), organizada por
audiência (desenvolvedor, utilizador final, Administrador do Sistema, DevOps/instalação),
baseada exclusivamente na implementação real do código — nada inventado; lacunas marcadas
explicitamente como pendentes. Ponto de entrada: [`docs/README.md`](docs/README.md).

## Desenvolvimento rápido

```bash
# Backend (terminal 1)
cd server && npm install && npm run dev

# Frontend (terminal 2)
cd client && npm install && npm run dev
```

Credenciais de teste: ver [`server/README.md`](server/README.md#credenciais-de-teste).

## Qualidade

CI (`.github/workflows/ci.yml`) corre em cada push/PR para `main`: typecheck, build e testes de
`server/` e `client/`. Localmente:

```bash
cd server && npm run build && npm test
cd client && npm run typecheck && npm test && npm run build
```

O `client` tem uma baseline conhecida de erros de `tsc` pré-existentes (não bloqueiam o build real,
que usa o typecheck mais restrito do Vite) — o CI falha apenas se esse número aumentar.

## Estado de produção (auditoria)

Este projeto passou por uma auditoria pré-produção completa (licenciamento, segurança, arquitetura,
banco de dados, backend, frontend, testes, DevOps). Decisões de âmbito explicitamente adiadas por
exigirem escolha de negócio/arquitetura (não implementadas às cegas) estão documentadas nos
READMEs de `server/` e `client/` respetivos — nomeadamente supervisão de processo em produção e
atualização automática do Tauri.
