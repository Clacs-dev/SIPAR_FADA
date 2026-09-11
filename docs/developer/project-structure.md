# Estrutura do Repositório

```text
SIPAR_FADA/
├── server/                    Backend Express + Prisma (TypeScript)
│   ├── src/
│   │   ├── index.ts            Bootstrap: middlewares globais, registo de rotas, health check
│   │   ├── routes/              23 ficheiros — um por domínio de API (ver api.md)
│   │   ├── controllers/         Só 2 domínios: auth.controller.ts, storage.controller.ts
│   │   ├── services/            13 serviços reutilizáveis (audit, backup, email, license, sequence, ...)
│   │   ├── middlewares/         auth.ts (JWT/RBAC), license.ts, errors.ts, request-context.ts
│   │   ├── config/               database.ts (Prisma Client), logger.ts (Winston), license-public-key.ts
│   │   ├── utils/                 module-routes-helper.ts (motor de CRUD genérico), permissions.ts
│   │   └── tests/                  *.test.ts (node:test)
│   ├── prisma/
│   │   ├── schema.prisma          Os 48 modelos (ver database.md)
│   │   ├── migrations/             Histórico real de migrações
│   │   ├── seed.ts                  Popula contas de demonstração (bloqueado em produção)
│   │   └── seed-rbac.ts              Popula Roles, Departments e RolePermission
│   ├── .env.example                Ver configuration-environment.md
│   └── README.md                    Setup, scripts, supervisão de processo, backups
│
├── client/                    Frontend React + Vite
│   ├── src/
│   │   ├── App.tsx              Shell principal, navegação por estado (sem router — ver frontend.md)
│   │   ├── components/           Organizados por domínio (auth/, admin/, management/, compras/, actas/, ...)
│   │   ├── hooks/                 Hooks de dados (use-departments, use-roles, use-license, ...)
│   │   ├── services/               api.ts (API_BASE_URL, fetch wrapper), license-api.ts
│   │   └── test/                    Setup do Vitest
│   ├── src-tauri/               Wrapper desktop (Rust) — ver tauri.md
│   └── README.md                 Build de desktop, limitações de configuração
│
├── license-tools/             CLI do vendor para emitir licenças/certificados/CRL
│                                (nunca distribuída com o cliente — ver licensing.md)
│
├── docs/                       Esta documentação
│   ├── developer/               Este conjunto de documentos
│   ├── user/                     Manual do utilizador final
│   ├── operations/                On-premises, rede, backup/recuperação
│   ├── deployment/                 Instalação do servidor, instalação do Tauri, licenciamento, atualização
│   ├── security/                    Documento único de segurança
│   ├── devops/                       Runbook operacional
│   ├── known-issues.md               Problemas encontrados durante a análise
│   └── documentation-matrix.md       Rastreabilidade funcionalidade → código → documento
│
└── .github/workflows/ci.yml   Typecheck + build + testes de server/ e client/ em cada push/PR
```
