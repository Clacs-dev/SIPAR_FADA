
  # SIPAR20

  This is a code bundle for SIPAR20. The original project is available at https://www.figma.com/design/f6uoKbKZWXAEpFYzFWpUVI/SIPAR20.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Build de desktop (Tauri)

  A topologia real é um servidor central (backend Express, instalado uma única vez na rede do cliente) + esta app
  Tauri instalada em cada PC de utilizador, ligando-se a esse servidor pela rede local — ver
  [`../docs/developer/architecture.md`](../docs/developer/architecture.md) para o
  diagrama completo e [`../docs/deployment/client-installation.md`](../docs/deployment/client-installation.md)
  para o passo-a-passo de instalação. O Tauri **não arranca nem supervisiona** o backend — são processos
  independentes em máquinas diferentes; a supervisão do servidor está documentada em
  `server/README.md` § Supervisão de processo, com scripts prontos em `server/scripts/`.

  O endereço do servidor (`VITE_API_URL`) é compilado no instalador no momento do build — mudar de servidor depois
  de distribuído exige gerar e reinstalar um novo instalador (ver
  [`../docs/deployment/client-installation.md`](../docs/deployment/client-installation.md) § "Limitação atual").
  Tornar isto configurável a partir de um ecrã dentro do admin_sistema, sem recompilar, está no roteiro
  (ver [`../docs/developer/tauri.md`](../docs/developer/tauri.md)).

  **Atualização automática**: não está configurada (`tauri-plugin-updater` não incluído em `src-tauri/Cargo.toml`,
  sem secção `updater` em `tauri.conf.json`). Configurá-la implica gerar um novo par de chaves de assinatura do
  updater e decidir onde publicar os manifestos de atualização (GitHub Releases, servidor próprio, etc.) — uma
  decisão do produto/negócio, por isso fica documentada como pendente em vez de implementada às cegas.
  