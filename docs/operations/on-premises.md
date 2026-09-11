# Ambiente On-Premises — SIPAR-FADA

O sistema é executado inteiramente dentro da infraestrutura/rede da FADA. Não há nenhum
componente na nuvem pública.

## Servidor

O servidor central hospeda:

| Componente | Confirmado no código |
|---|---|
| Backend (Express/Node.js API) | ✅ `server/` |
| Base de dados | ✅ SQLite, ficheiro único `server/prisma/dev.db`, no mesmo servidor |
| Storage de ficheiros | ✅ Diretório local `server/uploads/` (Multer) |
| Logs | ✅ `server/logs/error.log`, `server/logs/combined.log` (Winston) |
| Backups | ✅ `server/backups/*.db`, geridos via UI (ver [`backup-recovery.md`](backup-recovery.md)) |

Não há hoje separação entre "servidor de aplicação" e "servidor de base de dados" — é o mesmo
processo, na mesma máquina, com um ficheiro SQLite local. Ver
[`../developer/architecture.md`](../developer/architecture.md#base-de-dados--estado-atual-vs-roteiro)
para o roteiro (não implementado) de PostgreSQL como base separada.

## Clientes

Cada PC de utilizador tem o **SIPAR-FADA Tauri** instalado — um cliente HTTP da API do servidor,
sem lógica de negócio própria e sem acesso direto à base de dados. Ver
[`network.md`](network.md) para o fluxo de comunicação exato.

## Requisitos ⚠️ CONFIGURAÇÃO A DEFINIR

Não há, no repositório, requisitos de hardware/SO formalmente documentados (CPU, RAM, disco,
sistema operativo suportado) para o servidor nem para os PCs cliente. Isto precisa de ser
definido pela FADA/equipa de infraestrutura com base no volume real de utilizadores esperado,
antes de uma instalação de produção — ver
[`../deployment/installation-checklist.md`](../deployment/installation-checklist.md).

O que se sabe com certeza a partir do código:

- Node.js é necessário no servidor (versão não fixada em `package.json` — ver
  [`../known-issues.md`](../known-issues.md#ops-20); usar a mesma major do CI, Node 22).
- O cliente Tauri gera instaladores nativos Windows/macOS/Linux consoante `bundle.targets: "all"`
  em `tauri.conf.json` — mas o ambiente de desenvolvimento observado é Windows, e não há
  confirmação de teste real noutro SO.
