# Checklist de Instalação — SIPAR-FADA

### Servidor

- [ ] Sistema operativo escolhido (⚠️ requisito não fixado no código — decisão da FADA)
- [ ] Node.js instalado (mesma major do CI — Node 22)
- [ ] `npm install` corrido em `server/`
- [ ] SQLite confirmado como motor (não instalar PostgreSQL — não usado nesta versão)
- [ ] `npx prisma migrate deploy` corrido com sucesso
- [ ] Backend configurado (`.env` preenchido — ver [`../developer/configuration-environment.md`](../developer/configuration-environment.md))
- [ ] Primeiro `admin_sistema` criado (ver [`server-installation.md#17-criação-do-primeiro-administrador`](server-installation.md))
- [ ] Storage local (`server/uploads/`) confirmado gravável
- [ ] Logs (`server/logs/`) confirmados a serem escritos
- [ ] Backup testado pelo menos uma vez (criar + descarregar)
- [ ] Firewall liberado para a porta do backend
- [ ] Serviço de supervisão de processo configurado (`server/scripts/install-windows-service.ps1` ou `sipar-fada-backend.service`)
- [ ] `GET /api/v1/health` devolve `status:"ok"`

### Rede

- [ ] Servidor acessível a partir de todos os PCs cliente (`curl` de teste)
- [ ] Porta da API liberada no firewall
- [ ] Endereço do servidor (IP/hostname) definido e **estável**
- [ ] PCs conseguem de facto alcançar a API (testado a partir de pelo menos um PC real)
- [ ] Confirmado que nenhum PC cliente tem, nem precisa de ter, acesso direto à base de dados

### Clientes

- [ ] Instalador Tauri gerado com `VITE_API_URL` a apontar para o endereço definitivo (não
      `localhost`)
- [ ] Tauri instalado em pelo menos um PC de teste
- [ ] Login funcionando a partir desse PC
- [ ] Módulos a carregar corretamente (menu lateral mostra os módulos esperados para o perfil)
- [ ] Exportação de PDF testada (ex.: Actas) — geração é local ao PC, confirmar que funciona
      offline face à rede (não depende de internet, só do backend)

### Segurança

- [ ] `JWT_SECRET`/`JWT_REFRESH_SECRET` gerados de novo, únicos a esta instalação (nunca os
      valores de exemplo)
- [ ] Contas de demonstração do seed desativadas/removidas (ou seed nunca corrido em produção)
- [ ] RBAC validado — testar com pelo menos dois roles diferentes que os menus/ações batem certo
- [ ] Licença ativada, `GET /api/v1/license/status` devolve `ACTIVE`
- [ ] Backup testado (criação + descarregamento)
