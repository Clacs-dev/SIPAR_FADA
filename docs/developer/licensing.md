# Licenciamento — SIPAR-FADA

Implementação: `server/src/services/license.service.ts` (`LicenseService`), modelo `License`
(tabela única). Assinatura Ed25519 via `crypto` nativo do Node — sem dependência externa de
criptografia.

## Conceitos

- **Licença** (`.lic`): payload assinado pelo vendor — `licenseId`, `customerName`, `licenseType`,
  `startsAt`, `expiresAt`, `maxUsers`, `maxAdmins`, `modules[]`, `features{}`,
  `offlineGraceDays`, `minVersion`, `issuedAt`. Emitido por `license-tools/generate-license.js`,
  fora deste repositório de aplicação.
- **Certificado de ativação** (`.cert`): payload separado, também assinado —
  `{licenseId, installationFingerprint, activatedAt}` — liga a licença a **esta instalação**
  especificamente (uma instalação = o servidor central). Emitido por
  `license-tools/generate-activation.js`, depois de o `admin_sistema` enviar o
  `installationFingerprint` ao vendor.
- **CRL** (lista de revogação): JSON assinado, opcional (`LICENSE_CRL_URL`), consultado
  best-effort (nunca bloqueia o arranque se offline).

## `installationFingerprint`

```ts
// server/src/services/license.service.ts
static async computeFingerprint(): Promise<string> {
  const [mid, salt] = await Promise.all([machineId(), this.getOrCreateFingerprintSalt()]);
  return crypto.createHash('sha256').update(`${mid}:${salt}`).digest('hex');
}
```

`machineId()` (pacote `node-machine-id`) identifica a **máquina onde o processo Express corre**
— o servidor central, não os PCs Tauri. `salt` é gerado uma vez e persistido em `SystemSetting`.

## Fonte de verdade — nunca as colunas soltas

`computeValidation()` (chamado por `validate()`, cacheado 5 min via `getCachedValidation()`)
**recalcula sempre a partir de `signedPayload`/`signature`** (depois de verificar a assinatura),
nunca lê `status`/`expiresAt` como fonte de verdade — essas colunas são só uma projeção cacheada
para listagem rápida no admin. Isto é o que impede o bypass "editar `expiresAt` diretamente na
BD" — verificado linha a linha e confirmado sem lacunas durante a auditoria.

## Estados possíveis

```
UNLICENSED → PENDING → ACTIVE → EXPIRING → EXPIRED
                     ↘ SUSPENDED
                     ↘ REVOKED
                     ↘ INVALID (assinatura/certificado/fingerprint não batem)
```

`RESTRICTED_STATUSES = [PENDING, EXPIRED, SUSPENDED, REVOKED, INVALID]` — nestes estados,
`hasModule()`/`hasFeature()` devolvem sempre `false` (bloqueiam escrita nos módulos de negócio,
via `requireLicense`). `ACTIVE`/`EXPIRING`/`UNLICENSED` não bloqueiam.

## Grace period e janela de aviso

- `offlineGraceDays` (por omissão 7, vem do payload): depois de `expiresAt`, o estado passa a
  `EXPIRING` (não `EXPIRED` ainda) durante esta janela.
- `WARNING_WINDOW_DAYS = 15` (constante de código — ver
  [`known-issues.md`](../known-issues.md#hc-29)): `EXPIRING` também é usado nos últimos 15 dias
  antes de expirar, como aviso prévio.

## Anti-recuo de relógio

`getEffectiveNow()`: guarda a maior data já observada (`SystemSetting['license_clock_hwm']`).
`now efetivo = max(relógio do SO, marca d'água persistida)` — nunca permite "ganhar tempo de
volta" recuando o relógio do sistema. Um recuo detetado é registado em `AuditLog`
(`LICENSE_CLOCK_ROLLBACK_DETECTED`), sem bloqueio automático (evita falsos positivos de
NTP/DST).

## Limite de utilizadores

`checkUserLimit('user' | 'admin')` — compara `User.count({status:'active', ...})` contra
`license.maxUsers`/`maxAdmins`. Chamado na criação de utilizador (`users.routes.ts`).

## Endpoints

`server/src/routes/license.routes.ts` — todos `requireAuth`, a maioria também `requireSystemAdmin`:

| Rota | Quem | Função |
|---|---|---|
| `POST /activate` | `admin_sistema` | Carrega `.lic`/`.cert` (multipart), ativa/renova |
| `POST /refresh` | `admin_sistema` | Revalida manualmente (tenta CRL se online) |
| `GET /status` | qualquer autenticado | Estado atual (para o banner) |
| `GET /fingerprint` | `admin_sistema` | Fingerprint desta instalação (para enviar ao vendor) |
| `GET /history` | `admin_sistema` | Eventos `LICENSE_*` do `AuditLog` |

## `minVersion` — aceite mas não aplicado

O payload da licença aceita `minVersion`, e é guardado, mas **nunca comparado** contra nada em
runtime — não existe hoje um ponto acessível ao `LicenseService` que exponha a versão real da
app a correr. Ver [`known-issues.md`](../known-issues.md#ops-13).

## Ver também

- CLI do vendor: [`../../license-tools/README.md`](../../license-tools/README.md)
- Fluxo de ativação do ponto de vista de instalação: [`../deployment/licensing.md`](../deployment/licensing.md)
