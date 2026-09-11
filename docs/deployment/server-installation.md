# Instalação do Servidor — SIPAR-FADA

Para um técnico de infraestrutura da FADA instalar o backend sem depender do desenvolvedor.
Distingue **desenvolvimento** (comandos `npm run dev`, recarregamento automático) de
**produção** (build compilado, processo supervisionado) em cada passo.

⚠️ **Este procedimento descreve a instalação atual (Node.js + `npm`).** Está decidido, mas ainda
não implementado, empacotar o backend como executável Windows autónomo instalado por um
instalador **Inno Setup** dedicado, com um ecrã de assistente que recolhe/gera o `.env` por si —
ver [`../developer/architecture.md`](../developer/architecture.md#empacotamento-do-servidor--estado-atual-vs-roteiro)
para o desenho completo desse ecrã. Quando isso existir, os passos 7, 12–13 e 21–22 abaixo mudam
(instalador em vez de `npm install`/edição manual do `.env`/registo manual do serviço); o resto
(rede, licenciamento, backup) mantém-se igual.

## 1–6. Requisitos

| Item | Valor |
|---|---|
| Sistema operativo | ⚠️ CONFIGURAÇÃO A DEFINIR — não fixado no código; ambiente observado é Windows |
| CPU / RAM / Disco | ⚠️ CONFIGURAÇÃO A DEFINIR — sem requisitos mínimos formais no repositório; dimensionar com base no número real de utilizadores |
| Rede | Deve estar acessível a todos os PCs Tauri na porta do backend (ver [`../operations/network.md`](../operations/network.md)) |
| IP / hostname | ⚠️ CONFIGURAÇÃO A DEFINIR PELO FADA — escolher um endereço **estável** (ver nota em [`client-installation.md`](client-installation.md)) |
| Node.js | Versão não fixada em `package.json` (ver [`../known-issues.md`](../known-issues.md#ops-20)) — usar a mesma major do CI (Node 22) |

## 7. Instalar dependências

```bash
git clone <repositório> sipar-fada
cd sipar-fada/server
npm install
```

## 8–9. PostgreSQL

⚠️ **Não aplicável hoje.** O sistema usa SQLite (`server/prisma/dev.db`, ficheiro local ao
servidor) — não há PostgreSQL a instalar nem base/utilizador a criar nesta versão. Ver
[`../developer/architecture.md`](../developer/architecture.md#base-de-dados--estado-atual-vs-roteiro)
para o roteiro futuro.

## 10. Criação do banco

Não aplicável separadamente — o ficheiro SQLite é criado automaticamente pelas migrações
(passo 15).

## 11. Utilizador do banco

Não aplicável (SQLite não tem utilizadores de base de dados como PostgreSQL/MySQL).

## 12–13. Configurar o backend e variáveis de ambiente

_(No roteiro do instalador dedicado, este passo passa a ser um ecrã de configuração no próprio
instalador, que grava o `.env` por si — ver nota no topo desta página.)_

```bash
cp .env.example .env
```

Editar `.env` — ver [`../developer/configuration-environment.md`](../developer/configuration-environment.md)
para a tabela completa. Mínimo obrigatório:

- `JWT_SECRET`, `JWT_REFRESH_SECRET` — gerar com `openssl rand -hex 32`, únicos a esta instalação.
- `CORS_ORIGINS` ou `FRONTEND_URL` — o servidor recusa arrancar em produção sem uma das duas.
- `DATABASE_URL="file:./dev.db"`.

## 15. Migrations

```bash
npx prisma migrate deploy
```

## 16. Seed

⚠️ Existe (`npm run db:seed`), mas cria ~15 contas de demonstração com passwords fracas
(incluindo uma conta `admin_sistema` completa) — bloqueado automaticamente se
`NODE_ENV=production`. **Não correr manualmente em produção.** Ver
[`../developer/authentication.md`](../developer/authentication.md#perfil-de-teste-vs-produção).

## 17. Criação do primeiro administrador

⚠️ Não existe um assistente de "criar o primeiro `admin_sistema`" separado do seed. Sem correr o
seed, a primeira conta `admin_sistema` tem de ser criada diretamente na base de dados (ex.:
`npx prisma studio`, ou um script one-off) — não há hoje um fluxo de instalação guiado para isto.
Documentar aqui o procedimento exato usado é uma pendência — ver
[`../known-issues.md`](../known-issues.md#primeiro-admin-sistema).

## 18. Storage

```bash
# Criado automaticamente no arranque (StorageService.ensureUploadDirectoryExists())
```

Sem configuração adicional — diretório local `server/uploads/`.

## 19. Logs

Automático — `server/logs/error.log`, `server/logs/combined.log`. Sem rotação configurada (ver
[`../known-issues.md`](../known-issues.md#ops-08)) — monitorizar o tamanho manualmente.

## 20. Backup

Ver [`../operations/backup-recovery.md`](../operations/backup-recovery.md).

## 21–22. Serviço do backend e inicialização

_(No roteiro do instalador dedicado, este passo é feito pelo próprio instalador — ver nota no
topo desta página.)_

```bash
npm start   # corre "npm run build" primeiro (script prestart), depois node dist/index.js
```

**Nunca correr `node dist/index.js` diretamente sem `npm run build` recente** — o `dist/`
observado no repositório já esteve desatualizado face ao código-fonte numa auditoria anterior.

Para o processo ficar ligado depois de um reinício/crash, correr o script pronto para a
plataforma (uma vez por instalação — ver
[`../devops/runbook.md`](../devops/runbook.md#supervisão-de-processo)):

```powershell
# Windows, como Administrador, a partir de server/:
.\scripts\install-windows-service.ps1
```

```bash
# Linux — ver instruções completas no cabeçalho do ficheiro:
sudo cp server/scripts/sipar-fada-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sipar-fada-backend
```

## 23. Health check

```bash
curl http://<endereço-do-servidor>:<PORT>/api/v1/health
# esperado: {"status":"ok","timestamp":"..."}
```

Um `503` aqui significa processo ligado mas base de dados inacessível.

## 24. Testes de conectividade

A partir de **um PC de utilizador real** na rede da FADA:

```bash
curl http://<endereço-do-servidor>:<PORT>/api/v1/health
```

Se isto falhar mas funcionar localmente no servidor, é um problema de rede/firewall — ver
[`../operations/network.md`](../operations/network.md).

## 25. Validação final

Ver [`installation-checklist.md`](installation-checklist.md).
