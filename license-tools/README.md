# Ferramentas de Licenciamento (uso exclusivo do vendor)

Esta pasta é a ferramenta **do proprietário do produto** para gerar licenças, certificados de
ativação e listas de revogação para o SIPAR-FADA. **Nunca deve ser distribuída com a
aplicação cliente** — a chave privada gerada em `keys/private.pem` não pode, em circunstância
alguma, ser copiada para o repositório do cliente, para o instalador Tauri, ou para qualquer
build do `server/`.

`keys/` está no `.gitignore` da raiz do projeto — nunca remova essa linha.

## 1. Gerar o par de chaves (uma única vez)

```bash
node license-tools/generate-keypair.js
```

Cria `license-tools/keys/private.pem` (fica só aqui, nunca sai desta máquina) e escreve
automaticamente a chave pública em `server/src/config/license-public-key.ts` (esse ficheiro
sim é versionado — é seguro embutir a chave pública na aplicação cliente).

## 2. Gerar uma licença

```bash
node license-tools/generate-license.js \
  --customer "Ministério XYZ" \
  --type annual \
  --starts 2026-01-01 \
  --expires 2026-12-31 \
  --maxUsers 50 \
  --maxAdmins 3 \
  --modules dashboard,users,actas,comunicacoes,facturas \
  --features export_pdf=true,export_excel=true,advanced_reports=false \
  --grace 7 \
  --out cliente-xyz.lic
```

Datas em formato `AAAA-MM-DD`. `--expires` pode ser omitido para licença vitalícia.
`--type` é uma string livre (`trial`, `monthly`, `annual`, `custom`, `lifetime`, ou outro).
Ao renovar um cliente já ativado, use sempre `--licenseId <o-mesmo-id-anterior>` para não
exigir uma nova ativação (ver `server/src/services/license.service.ts`, fluxo de renovação).

## 3. Ativar um cliente (round-trip manual, MVP)

1. O administrador do sistema do cliente carrega o `.lic` em **Diagnóstico do Sistema → Licença**
   (ou `POST /api/v1/license/activate`) e recebe de volta o `installationFingerprint` calculado.
2. Ele envia esse fingerprint ao vendor (e-mail, por exemplo).
3. O vendor corre:

```bash
node license-tools/generate-activation.js \
  --licenseId <licenseId-da-licenca> \
  --fingerprint <fingerprint-recebido> \
  --out cliente-xyz.cert
```

4. O vendor devolve o `.cert` ao cliente, que o carrega no mesmo ecrã de ativação.

## 4. Revogar uma licença

```bash
node license-tools/generate-crl.js --revoked licenseId1,licenseId2 --out crl.json
```

Publique `crl.json` num URL estático que o cliente possa consultar quando estiver online
(configurável via `LICENSE_CRL_URL` no `.env` do servidor) — a consulta é sempre best-effort,
nunca bloqueia o uso offline.
