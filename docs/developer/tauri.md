# Tauri — Wrapper Desktop

`client/src-tauri/` — Tauri 2 (Rust). Empacota o frontend React/Vite (`client/`) numa janela
desktop nativa.

## Configuração real (`client/src-tauri/tauri.conf.json`)

```json
{
  "productName": "SIPAR-FADA",
  "identifier": "com.fada.sipar",
  "build": {
    "frontendDist": "../build",
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": { "windows": [{ "title": "SIPAR-FADA", "width": 800, "height": 600 }] },
  "bundle": { "active": true, "targets": "all" }
}
```

`identifier` foi corrigido de `com.tauri.dev` (placeholder por omissão do `tauri init`, nunca
personalizado antes) para `com.fada.sipar` durante a auditoria.

## Dependências Rust (`client/src-tauri/Cargo.toml`)

```toml
tauri = "2.11.3"
tauri-plugin-log = "2"
```

**Nenhum outro plugin Tauri está instalado.** Em particular, não há:

- `tauri-plugin-updater` — sem atualização automática (ver [`../deployment/update.md`](../deployment/update.md)).
- `tauri-plugin-store` (ou equivalente) — não foi necessário: a configuração de endereço do
  servidor (ver secção seguinte) usa `localStorage` do WebView diretamente, que já persiste
  entre reinícios da app sem exigir nenhum plugin Rust novo.
- `tauri-plugin-shell`/sidecar — o Tauri **não** arranca, para, nem supervisiona o processo do
  backend. São dois processos completamente independentes em máquinas diferentes (ver
  [`architecture.md`](architecture.md)).

## Endereço do servidor — fixo no build, corrigível sem recompilar

`client/src/services/api.ts` lê `import.meta.env.VITE_API_URL` — uma variável do **Vite**,
resolvida em **tempo de build**, não em runtime. Continua a ser preciso definir
`VITE_API_URL` corretamente **antes** de `npm run tauri build` (ver
[`../deployment/client-installation.md`](../deployment/client-installation.md)) — se ausente, o
fallback é `http://localhost:5000/api/v1`, que nunca funciona num PC de utilizador real.

✅ **O que já não é uma limitação**: mudar o endereço depois de distribuído já não exige gerar um
novo instalador. Um ícone no canto inferior esquerdo do ecrã de login abre um diálogo
(`ServerUrlDialog`) que grava um endereço alternativo em `localStorage` e recarrega a app — ver
[`architecture.md`](architecture.md#configuração-de-ligação--implementado) para a implementação
completa. `VITE_API_URL` continua a decidir o valor de **primeira instalação**; o `localStorage`
é só uma correção local, por PC, que sobrevive a atualizações da app mas não a uma reinstalação
completa (que limpa os dados do WebView).

## Build

```bash
cd client
npm install
$env:VITE_API_URL = "http://<endereço-do-servidor>:5000/api/v1"   # PowerShell
npm run tauri build
```

Instalador nativo gerado em `client/src-tauri/target/release/bundle/`.

## Controlo de versão

⚠️ Confirmado durante a auditoria: `client/src-tauri/` **nunca esteve sob controlo de versão
git** neste repositório (`git ls-files client/src-tauri` devolve vazio, sem entradas no histórico
de commits). Não está listado no `.gitignore`. Isto significa que qualquer alteração feita aqui
só existe na árvore de trabalho local até ser explicitamente adicionada ao git.
