# Configuração e Variáveis de Ambiente — SIPAR-FADA

O `.env` (servidor, carregado uma vez no arranque via `dotenv.config()`) é **configuração técnica
de infraestrutura** — segredos, integrações externas, porta. Configurações que o `admin_sistema`
precisa de alterar durante a operação normal (modo de manutenção, cópias de segurança, licença)
já vivem no banco de dados e são geridas pela UI — **nunca** devem ser movidas para `.env`. Ver
[`known-issues.md`](../known-issues.md#hc-29) para um caso identificado que ainda está no lugar
errado (constante de código em vez de `SystemSetting`).

Esta tabela foi gerada a partir de uma pesquisa exaustiva (`grep -r "process.env\."`) por todo
`server/src` — reflete exatamente o que o código usa, não o que estava documentado antes. O
ficheiro `server/.env.example` foi atualizado para corresponder.

## Núcleo (sem isto, o servidor não arranca de forma utilizável)

| Variável | Obrigatória | Finalidade | Exemplo seguro |
|---|---|---|---|
| `PORT` | Não (default 5000) | Porta HTTP do backend | `5000` |
| `DATABASE_URL` | Sim | Ligação Prisma — hoje sempre `file:./dev.db` (SQLite) | `file:./dev.db` |
| `JWT_SECRET` | Sim — o servidor recusa arrancar sem isto | Assinatura do access token | `<openssl rand -hex 32>` |
| `JWT_REFRESH_SECRET` | Sim | Assinatura do refresh token — **diferente** de `JWT_SECRET` | `<openssl rand -hex 32>` |
| `NODE_ENV` | Recomendado (`production` em produção) | Ativa o guard de seed, exige `CORS_ORIGINS`/`FRONTEND_URL`, nível de log | `production` |
| `CORS_ORIGINS` | Sim em produção (ou `FRONTEND_URL`) | Origens aceites pelo CORS — o arranque falha em produção se ambas estiverem vazias | `http://192.168.1.50:3000` |
| `FRONTEND_URL` | Ver acima | Usado como fallback de `CORS_ORIGINS`; também usado no link de recuperação de password | `http://192.168.1.50:3000` |

## Licenciamento

| Variável | Obrigatória | Finalidade |
|---|---|---|
| `LICENSE_CRL_URL` | Não | URL estático onde o vendor publica a CRL assinada. Best-effort — se ausente ou offline, licenciamento continua a funcionar a partir da licença/certificado já ativados |

## E-mail — SMTP genérico ou Gmail

✅ **Configurável pelo `admin_sistema`** em **Configurações → Integrações → E-mail** (UI:
`client/src/components/admin/integrations-config.tsx`; API: `GET/PUT /api/v1/email/config`).
Os valores gravados pela UI ficam no banco de dados (`SystemSetting`, via
`server/src/services/settings.service.ts`) e têm **prioridade** sobre estas variáveis — o `.env`
só é lido quando não existe nenhuma definição gravada pelo admin (fallback de instalação/migração,
nunca obrigatório). Ver `email.service.ts` (`resolveConfig()`) para a ordem de precedência exata.

| Variável | Obrigatória | Finalidade |
|---|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Não | Configuração SMTP direta — tem prioridade sobre Gmail se definida |
| `GMAIL_USER` / `GOOGLE_SMTP_USER` | Não | Alternativa: conta Gmail (usada como fallback se `SMTP_*` ausente) |
| `GMAIL_APP_PASSWORD` / `GOOGLE_SMTP_PASS` | Não | Palavra-passe de aplicação Gmail (não a password normal da conta) |
| `EMAIL_FROM` | Não | Endereço de remetente — fallback: `SMTP_USER`/`GMAIL_USER`/`sipar20@sistema.com` |
| `SENDGRID_API_KEY` | — | ⚠️ Declarada em `.env.example` mas **não referenciada em nenhum lugar do código** (`grep` confirma zero ocorrências em `server/src`). Configuração morta — não configurar, não tem efeito |

Sem nenhuma destas (nem via admin, nem via `.env`), o e-mail simplesmente não é enviado (falhas
ficam em log, não bloqueiam o resto da aplicação).

## Notificações Push (Web Push / VAPID)

| Variável | Obrigatória | Finalidade |
|---|---|---|
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Não (funcionalidade desativa-se sem elas) | Par de chaves VAPID para Web Push |
| `VAPID_SUBJECT` | Não | `mailto:` ou URL de contacto exigido pelo protocolo Web Push |

## Integrações de reunião (Zoom / Microsoft Teams / Google Meet)

✅ **Configurável pelo `admin_sistema`** em **Configurações → Integrações → Plataformas de
reunião** (UI: `integrations-config.tsx`; API: `GET/PUT /api/v1/meeting-integrations`), com a
mesma prioridade admin > `.env` descrita acima para o e-mail (ver `meeting-link.service.ts`).
Cada plataforma só fica "configurada" se **todas** as suas credenciais OAuth estiverem presentes;
caso contrário usa-se o link fixo de fallback (da própria plataforma, depois o geral). Se **nada**
disto estiver configurado, o sistema **não inventa um link falso** — `MeetingLinkService` devolve
`null` e o pedido de agendamento é recusado com `422 MEETING_PLATFORM_NOT_CONFIGURED`, para o
frontend mostrar um aviso em vez de criar uma reunião com um link que ninguém consegue usar. O
seletor de plataforma (`GET /meeting-integrations/available`, aberto a qualquer utilizador
autenticado) só lista as plataformas que produzem de facto um link.

| Variável | Finalidade |
|---|---|
| `MEETING_DEFAULT_LINK` | Link fixo genérico, último fallback se nenhuma plataforma estiver configurada |
| `MEETING_TIMEZONE` | Fuso horário para agendamento (default: `Africa/Luanda`) |
| `MEETING_GOOGLEMEET_DEFAULT_LINK`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | Google Meet via Google Calendar API |
| `MEETING_ZOOM_DEFAULT_LINK`, `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` | Zoom |
| `MEETING_TEAMS_DEFAULT_LINK`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_USER_ID`/`MICROSOFT_ORGANIZER_ID` | Microsoft Teams |

## Cliente (Tauri/Vite) — build-time, não runtime

| Variável | Obrigatória | Finalidade |
|---|---|---|
| `VITE_API_URL` | Sim, antes de `npm run tauri build` | Endereço do servidor central, **compilado no instalador** — ver [`tauri.md`](tauri.md) |

⚠️ Não existe hoje `client/.env.example`. Ver [`known-issues.md`](../known-issues.md#ops-14).

## Nunca colocar secrets reais neste repositório

`server/.env` está no `.gitignore`. Gerar `JWT_SECRET`/`JWT_REFRESH_SECRET` próprios por
instalação (`openssl rand -hex 32`) — nunca reutilizar valores de exemplo nem entre instalações
diferentes.
