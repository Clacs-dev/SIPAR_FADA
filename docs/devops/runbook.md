# Runbook Operacional — SIPAR-FADA

Referência rápida de comandos para o técnico responsável pelo servidor central da FADA. Para o
"porquê" de cada coisa, ver os documentos ligados — este ficheiro é propositadamente curto.

## Arquitetura (resumo)

Um servidor central (Express + SQLite) na rede da FADA + um cliente Tauri por PC de utilizador.
Diagrama completo: [`../developer/architecture.md`](../developer/architecture.md).

## Verificar se o servidor está saudável

```bash
curl http://localhost:5000/api/v1/health
# {"status":"ok",...} = tudo bem
# {"status":"error",...} ou sem resposta = ver "Servidor não responde" abaixo
```

## Supervisão de processo

🟡 Não automático por si só (a aplicação não se regista como serviço sozinha), mas há scripts
prontos em `server/scripts/` — um comando por plataforma, uma vez por instalação:

- **Windows**: `server/scripts/install-windows-service.ps1` — regista `dist/index.js` como
  Serviço do Windows via [NSSM](https://nssm.cc/) (descarregar uma vez, fora do npm), com
  reinício automático em falha e arranque com o sistema. Correr como Administrador:
  `.\scripts\install-windows-service.ps1` a partir de `server/`.
- **Linux**: `server/scripts/sipar-fada-backend.service` — unidade `systemd` pronta a copiar
  para `/etc/systemd/system/` (instruções no cabeçalho do ficheiro), `Restart=on-failure`.

Sem isto, um reinício do servidor ou um crash do processo **não recupera sozinho**.

## Reiniciar o servidor

```bash
# Se corre como serviço (NSSM/systemd): usar os comandos do próprio gestor de serviço
# Manual (só para diagnóstico, não para produção):
cd server
npm start   # corre build automaticamente primeiro
```

## Servidor não responde

1. Confirmar que o processo está de facto a correr (gestor de tarefas / `systemctl status`).
2. Ver os últimos logs: `server/logs/error.log`, `server/logs/combined.log`.
3. Se o processo morreu, reiniciar (ver acima) e investigar a causa no log antes de continuar.
4. Se o processo está a correr mas `/health` devolve `503`, o problema é a base de dados —
   confirmar que `server/prisma/dev.db` existe e não está corrompido/bloqueado.

## Base de dados indisponível

```bash
# Confirmar que o ficheiro existe e o processo tem permissão de escrita:
ls -la server/prisma/dev.db
```

Se o ficheiro estiver corrompido: restaurar a cópia de segurança mais recente — ver
[`../operations/backup-recovery.md#restauro`](../operations/backup-recovery.md).

## Criar uma cópia de segurança manual

```bash
curl -X POST http://localhost:5000/api/v1/system/backups \
  -H "Authorization: Bearer <token-de-admin_sistema>"
```

Ou via UI: Diagnóstico do Sistema → Cópias de Segurança.

## Disaster recovery (perda total do servidor)

1. Instalar um servidor novo (ver [`../deployment/server-installation.md`](../deployment/server-installation.md)).
2. Restaurar a cópia de segurança mais recente disponível **fora** do servidor perdido (ver
   [`../operations/backup-recovery.md`](../operations/backup-recovery.md) — cópias locais ao
   servidor perdem-se com ele; só cópias descarregadas para outro local sobrevivem).
3. Se o endereço IP/hostname mudar, **todos os PCs Tauil precisam de um instalador novo** (ver
   [`../deployment/client-installation.md`](../deployment/client-installation.md)).
4. Reativar a licença se o fingerprint mudar (nova máquina = novo fingerprint — ver
   [`../deployment/licensing.md`](../deployment/licensing.md)).

## Manutenção planeada

1. Ativar o Modo de Manutenção na UI (Diagnóstico do Sistema) — bloqueia todos exceto
   `admin_sistema`.
2. Fazer a manutenção (atualização, restauro, etc. — ver
   [`../deployment/update.md`](../deployment/update.md)).
3. Desativar o Modo de Manutenção.

## Monitorização

⚠️ Não há integração de rastreio de erros/APM externo — a única fonte de verdade sobre falhas é
`server/logs/*.log` no próprio servidor, e o `/health` para verificação externa periódica
(configurar um monitor de rede simples apontado a este endpoint, se a FADA tiver essa
capacidade). Ver [`../known-issues.md`](../known-issues.md#ops-07).

## Segurança operacional

Ver [`../security/security.md`](../security/security.md) para o documento completo.
