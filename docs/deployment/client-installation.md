# Instalação do Cliente (Tauri) — SIPAR-FADA

## 1–3. Requisitos do PC

⚠️ CONFIGURAÇÃO A DEFINIR — sem requisitos mínimos de hardware documentados no repositório.
Sistema operativo: `tauri.conf.json` tem `bundle.targets: "all"` (Windows/macOS/Linux), mas o
ambiente de desenvolvimento observado e testado é Windows — não há confirmação no repositório de
testes em macOS/Linux.

## Gerar o instalador (feito pelo desenvolvedor/DevOps, uma vez por versão)

```bash
cd client
npm install
# PowerShell — definir ANTES do build, aponta para o endereço real do servidor:
$env:VITE_API_URL = "http://<endereço-do-servidor>:<PORT>/api/v1"
npm run tauri build
```

Instalador gerado em `client/src-tauri/target/release/bundle/` (`.msi`/`.exe` no Windows).

⚠️ **Escolher um endereço de servidor estável antes desta primeira geração** — ver a limitação
abaixo.

## 4–5. Instalação do `.exe`

Correr o instalador gerado como qualquer instalador Windows. Sem passos de configuração
adicionais durante a instalação — o endereço do servidor já vem embutido (ver secção seguinte).

## 6. Localização dos ficheiros

⚠️ CONFIGURAÇÃO A DEFINIR — caminho de instalação exato não fixado neste documento; segue o
comportamento por omissão do instalador Tauri/NSIS/WiX para a plataforma.

## 7–8. Configuração da API / URL interna do backend

**Não há passo de configuração no PC do utilizador.** O endereço do servidor
(`http://SERVIDOR-FADA:PORTA`) fica gravado dentro do instalador no momento do build (variável
`VITE_API_URL`, ver [`../developer/tauri.md`](../developer/tauri.md)):

```text
PC DO UTILIZADOR

SIPAR-FADA.exe
      │
      │ HTTP/HTTPS
      ▼
http://SERVIDOR-FADA:PORTA      ⚠️ CONFIGURAÇÃO A DEFINIR PELO FADA — usado no momento do build
      │
      ▼
SIPAR BACKEND
```

**Se o endereço do servidor mudar depois de distribuído** (novo IP, novo hostname), é necessário
gerar um **novo instalador** com o `VITE_API_URL` atualizado e reinstalar em cada PC — não há
hoje um ecrã dentro da app para reconfigurar isto sem recompilar (roteiro documentado em
[`../developer/tauri.md`](../developer/tauri.md#roteiro-não-implementado-configuração-de-ligação-dentro-do-admin_sistema)).
Escolher um endereço de servidor **estável** (IP fixo interno ou hostname que não muda) antes da
primeira distribuição.

## 9. Primeira execução

Abrir o SIPAR-FADA — mostra o ecrã de login diretamente (não há assistente de configuração
inicial, porque não há nada a configurar do lado do cliente).

## 10. Login

Ver [`../user/login.md`](../user/login.md).

## 11. Atualização

⚠️ NÃO IMPLEMENTADO — sem mecanismo de atualização automática (`tauri-plugin-updater` não está
instalado). Ver [`update.md`](update.md).

## 12. Desinstalação

Desinstalação padrão do sistema operativo (Painel de Controlo / Definições → Aplicações, no
Windows). Não remove dados do servidor (a app não guarda dados de negócio localmente no PC).

## 13. Troubleshooting

Ver [`../user/troubleshooting.md`](../user/troubleshooting.md) (utilizador) e
[`../devops/runbook.md`](../devops/runbook.md) (técnico).
