# Segurança — SIPAR-FADA

Documento único, partilhado entre todas as audiências (ver referências a partir de
`docs/developer/`, `docs/operations/`, `docs/devops/`).

## Autenticação

JWT (access token 1 dia, refresh token 7 dias, segredos separados) + `bcrypt` (custo 10 — OWASP
recomenda 12+ para hardware atual; aceitável mas no limite inferior). Ver
[`../developer/authentication.md`](../developer/authentication.md).

| Risco | Impacto | Mitigação real no código |
|---|---|---|
| Token roubado (XSS, malware no PC) | Acesso à conta até 1 dia (access) ou até ser detetado (refresh, com rotação) | Rotação de refresh token a cada uso; reutilização de um token já rotado revoga a sessão inteira e regista `REFRESH_TOKEN_REUSE_DETECTED` em `AuditLog` |
| Sessão não revogável depois de logout | Token continua válido até expirar | `UserSession` (tabela) com `revokedAt` — `requireAuth` verifica em cada pedido para tokens emitidos com `sid` |
| Custo bcrypt = 10 | Cracking offline de hashes exfiltrados é mais barato que com custo 12+ | Nenhuma — aceite como está; subir exigiria migração gradual no próximo login |

## Autorização / RBAC

Duas camadas (ver [`../developer/authorization-rbac.md`](../developer/authorization-rbac.md)):
RBAC real via `RolePermission` para módulos de negócio; checks hardcoded (`role === 'admin_sistema'`,
arrays fixos de strings) para rotas administrativas. **A UI já revela honestamente** onde a
segunda camada se aplica, para não dar falsa sensação de controlo granular.

## Segredos

`JWT_SECRET`/`JWT_REFRESH_SECRET` só via `.env` (fora do git). ⚠️ Nota histórica: segredos reais
chegaram a estar commitados em ficheiros `.env.production`/`.env.development` numa versão
anterior deste repositório — foram removidos e os segredos rodados, mas **o histórico do git não
foi reescrito** (decisão explícita, não técnica) — qualquer pessoa com acesso ao histórico
completo do repositório ainda consegue ver os valores antigos (já invalidados pela rotação, mas
ainda expostos como artefacto histórico).

## CORS / CSRF

CORS restrito por `CORS_ORIGINS`/`FRONTEND_URL`, obrigatório em produção. CSRF: como a
autenticação usa `Authorization: Bearer <token>` (não cookies enviados automaticamente pelo
browser), o vetor clássico de CSRF (um site malicioso a forçar um pedido autenticado sem o
utilizador saber) não se aplica da mesma forma que numa app baseada em cookies de sessão — sem
proteção CSRF dedicada, mas o desenho de autenticação já mitiga a maior parte do risco.

## Rate limiting

Global: 500 pedidos/15min por IP. Rotas de autenticação: limiter dedicado mais restrito
(`authLimiter`). Rota pública de submissão (`/publica`): limiter dedicado
(`publicSubmissionLimiter`).

## Uploads

Allowlist de mimetype (bloqueia HTML/SVG/scripts), limite de 10MB, eliminação exige posse do
ficheiro ou perfil admin. Ver [`../developer/storage.md`](../developer/storage.md).

## Injeção SQL

Prisma (ORM parametrizado) em todas as queries observadas — sem SQL bruto concatenado a partir
de input do utilizador identificado no código.

## XSS

React escapa por omissão. Onde HTML é renderizado a partir de dados (ex.: conteúdo rico de
comunicações/actas), confirmar sanitização antes de qualquer `dangerouslySetInnerHTML` — não
auditado exaustivamente neste documento; tratar como superfície a rever se encontrado.

## Logs e auditoria

`AuditLog` (BD, consultável via UI) cobre ações de negócio/segurança. Winston (`server/logs/`)
sem rotação nem redação de campos sensíveis em stacks de erro — ver
[`../developer/backend.md#auditoria-e-logs`](../developer/backend.md). O corpo da resposta HTTP
só expõe stack/detalhes em `NODE_ENV=development`.

## Exposição de portas / firewall

Só a porta do backend deve estar acessível pela rede — a base de dados (ficheiro SQLite local)
nunca é exposta por rede. Ver [`../operations/network.md`](../operations/network.md).

## Backup

Cobre a base de dados; **não cobre** `uploads/`, `.env`, logs — ver
[`../operations/backup-recovery.md`](../operations/backup-recovery.md).

## Dados sensíveis

Passwords: `bcrypt`. Refresh tokens: `sha256` na tabela `UserSession`
(`refreshTokenHash`), nunca em claro. Tokens de reset de password: `sha256`, uso único, TTL 1h.
Dados bancários de utilizadores/fornecedores: guardados em claro na tabela `User` — sem
encriptação adicional a nível de coluna.

## Licenciamento

Assinatura Ed25519, verificação sempre a partir do payload assinado (nunca das colunas soltas —
impede bypass por edição direta na BD). Ver [`../developer/licensing.md`](../developer/licensing.md).

## Comunicação Tauri → API

HTTP simples por omissão (`http://`, não `https://`) na configuração observada — dentro de uma
rede local confiável, isto é uma decisão de risco aceitável mas explícita: qualquer pessoa com
acesso à rede local consegue capturar tráfego em claro, incluindo tokens JWT. ⚠️ Recomenda-se
avaliar HTTPS (mesmo com certificado autoassinado interno) se a rede da FADA não for
inteiramente confiável (ex.: Wi-Fi partilhado com outros dispositivos).
