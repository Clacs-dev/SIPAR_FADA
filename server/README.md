# SIPAR20 Backend

Backend Express/Prisma do SIPAR20.

## Requisitos

- Node.js 18+
- npm
- SQLite local

## Configuracao

Crie ou ajuste `server/.env`:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="sipar20_super_secret_dev_key_jwt_token_auth"
JWT_REFRESH_SECRET="sipar20_super_secret_refresh_dev_key"
FRONTEND_URL="http://localhost:3000"
EMAIL_FROM="SIPAR20 <seu-email@gmail.com>"
GMAIL_USER="seu-email@gmail.com"
GMAIL_APP_PASSWORD="senha-de-app-do-google"

# Links/API de reunioes online
# Enquanto OAuth/API nao estiver configurado, pode usar links fixos por plataforma.
MEETING_DEFAULT_LINK=""
MEETING_GOOGLEMEET_DEFAULT_LINK=""
MEETING_ZOOM_DEFAULT_LINK=""
MEETING_TEAMS_DEFAULT_LINK=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REFRESH_TOKEN=""
GOOGLE_CALENDAR_ID="primary"
MEETING_TIMEZONE="Africa/Luanda"
ZOOM_ACCOUNT_ID=""
ZOOM_CLIENT_ID=""
ZOOM_CLIENT_SECRET=""
MICROSOFT_TENANT_ID=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_USER_ID=""
MICROSOFT_ORGANIZER_ID=""
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@sipar20.local"
```

## Integracoes reais

- Gmail: use `GMAIL_USER`, `GMAIL_APP_PASSWORD` e `EMAIL_FROM`. Teste com `GET /api/v1/email/test` e `POST /api/v1/email/send-test`.
- Google Meet: o backend cria evento no Google Calendar com `conferenceData` quando `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` estiverem configurados.
- Zoom: usa Server-to-Server OAuth com `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID` e `ZOOM_CLIENT_SECRET`.
- Microsoft Teams: usa Microsoft Graph com `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` e `MICROSOFT_USER_ID` ou `MICROSOFT_ORGANIZER_ID`.
- Push: configure VAPID com `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`.

## Fase 4 - Rotas operacionais

As funcionalidades avancadas de compras, orcamento e financeiro foram adicionadas em:

- `/api/v1/phase4`
- `/api/v1/compras-avancadas`
- `/api/v1/orcamentos`
- `/api/v1/financeiro`

Principais endpoints:

- `POST /procurements/:id/quotations`
- `GET /procurements/:id/quotations`
- `POST /quotations/:id/select`
- `POST /procurements/:id/purchase-order`
- `GET /purchase-orders`
- `POST /purchase-orders/:id/receive`
- `POST /budgets`
- `GET /budgets`
- `POST /budgets/:id/lines`
- `POST /budgets/:id/approve`
- `POST /budgets/:id/executions`
- `GET /budgets/:id/summary`
- `POST /accounts-payable`
- `GET /accounts-payable`
- `POST /accounts-payable/:id/pay`
- `POST /accounts-receivable`
- `GET /accounts-receivable`
- `POST /accounts-receivable/:id/receive`
- `GET /cash-flow`
- `POST /reports/generate`
- `GET /reports`

## Instalar e preparar banco

O schema agora tem historico de migracoes real em `prisma/migrations/` (baseline criado
em 2026-09-09). **Nunca uses `prisma db push` contra uma base de dados com dados reais** —
sem historico de migracao, nao ha forma de rever nem reverter a alteracao antes de a
aplicar. `db push` continua util para prototipagem rapida num `dev.db` descartavel.

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy   # aplica as migracoes existentes (novo cliente/instalacao)
npm run db:seed             # so em desenvolvimento — bloqueado se NODE_ENV=production
```

Ao alterar `schema.prisma`, gera uma migracao nova em vez de `db push`:

```bash
npx prisma migrate dev --name descricao_da_alteracao
```

No Windows com PowerShell restrito, use os binarios `.cmd`:

```bash
.\node_modules\.bin\prisma.cmd generate
.\node_modules\.bin\prisma.cmd migrate deploy
npm.cmd run db:seed
```

## Cópia de segurança da base de dados

Cada instalação guarda os seus dados num único ficheiro SQLite local
(`server/prisma/dev.db`) — não há servidor central nem replicação. **Sem
cópia de segurança, um disco corrompido ou uma migração mal executada apaga
os dados de forma permanente e irrecuperável.**

- Manual: "Diagnóstico do Sistema → Cópias de Segurança" no ecrã de admin
  (`admin_sistema`) cria e permite descarregar uma cópia a qualquer momento.
  São mantidas as 30 cópias mais recentes no servidor.
- Automático (recomendado): agendar uma tarefa periódica que copie
  `server/prisma/dev.db` para outro disco/local de rede. No Windows, via
  Agendador de Tarefas, um exemplo de ação (`Iniciar um programa`):
  ```
  Programa: powershell.exe
  Argumentos: -Command "Copy-Item 'C:\caminho\para\server\prisma\dev.db' 'D:\backups\sipar\dev-$(Get-Date -Format yyyyMMdd-HHmmss).db'"
  ```
  Configure a tarefa para correr diariamente e escreva num disco/pasta
  **diferente** do disco onde a aplicação corre.
- Sempre que uma cópia for feita, verifique periodicamente que consegue de
  facto restaurá-la (copiar o ficheiro de volta para `prisma/dev.db` com o
  servidor parado) — uma cópia nunca testada não é uma estratégia de backup.

## Rodar em desenvolvimento

```bash
npm run dev
```

## Qualidade e testes

```bash
npm run build
npm test
npm run test:rules
```

O backend adiciona `x-request-id` em todas as respostas. Envie esse header nas chamadas externas quando quiser correlacionar logs, auditoria e erros.

Configure `CORS_ORIGINS` com as origens reais do frontend antes de producao. Evite `*` em ambiente produtivo.

API padrao:

- `http://localhost:5000/api/v1`
- `http://localhost:5000/api/v1`

Health check (verifica ligação real à base de dados — devolve 503, não 200, se a BD estiver inacessível):

- `GET http://localhost:5000/api/health`

## Supervisão de processo em produção

Esta aplicação corre on-premise, um servidor central por cliente (ex.: um servidor para toda a FADA — ver
[`../docs/developer/architecture.md`](../docs/developer/architecture.md) para o
diagrama completo): o backend Express tem de ficar sempre ativo nessa máquina central, incluindo depois de
reiniciar o computador ou depois de um crash — se cair, **todos** os utilizadores (em todos os PCs Tauri
ligados a ela) ficam sem acesso.

Scripts prontos a correr ficam em [`scripts/`](scripts/):

- **Windows**: `scripts/install-windows-service.ps1` — regista `dist/index.js` como Serviço do Windows via
  [NSSM](https://nssm.cc/) (descarregar uma vez, não vem por npm), com reinício automático em falha, arranque
  com o sistema, e logs próprios em `logs/service-*.log`. Correr como Administrador a partir de `server/`:
  `.\scripts\install-windows-service.ps1`.
- **Linux**: `scripts/sipar-fada-backend.service` — unidade `systemd` pronta a copiar para
  `/etc/systemd/system/`, com `Restart=on-failure`. Ver instruções no cabeçalho do próprio ficheiro.

Ambos usam `GET /api/health` (acima) como verificação de saúde real.

## Credenciais de teste

- `admin@sistema.com` / `123456`
- `pce@sistema.com` / `123456`
- `secretaria@sistema.com` / `123456`
- `usuario@empresa.com` / `123456`
- `gerente@sistema.ao` / `gerente123`
- `financeiro@sistema.ao` / `financeiro123`
- `compras@sistema.ao` / `compras123`
- `it@sistema.ao` / `it123`

## Persistencia

O backend ja nao usa `KVStore` para os modulos principais. Cada dominio possui tabela Prisma propria, incluindo:

- `Presentation`
- `Audience`
- `Pedido`
- `InternalMeeting`
- `InternalMeetingParticipant`
- `Acta`
- `Oficio`
- `Factura`
- `Viatura`
- `Contrato`
- `Reclamacao`
- `Fornecedor`
- `Planejamento`
- `Procurement`
- `Operador`
- `Comunicacao`
- `PedidoViatura`
- `UploadedFile`
- `Notification`
- `AuditLog`

Algumas tabelas mantem uma coluna `data` com JSON serializado para preservar campos especificos dos formularios enquanto a migracao do frontend e estabilizada.

## Upload local

Uploads usam Multer:

- `POST /api/v1/storage/upload`
- Campo multipart: `file`

Arquivos sao servidos por:

- `GET /uploads/<filename>`
