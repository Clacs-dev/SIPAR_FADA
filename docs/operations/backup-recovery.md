# Backup e Recuperação — SIPAR-FADA

## O que já está implementado

✅ `BackupService` (`server/src/services/backup.service.ts`) copia o ficheiro único da base de
dados (`server/prisma/dev.db`) para `server/backups/dev-<timestamp>.db`, com retenção automática
das **30 cópias mais recentes** (as mais antigas são apagadas automaticamente ao criar uma nova).
Acionável via UI (Diagnóstico do Sistema → Cópias de Segurança, `admin_sistema`) ou via
`POST /api/v1/system/backups`.

## O que faz backup

| Item | Coberto pelo BackupService? |
|---|---|
| Base de dados (todos os registos de negócio) | ✅ Sim — é o ficheiro `dev.db` inteiro |
| Ficheiros carregados (uploads) | ❌ Não — `server/uploads/` não é copiado |
| Configurações (`.env`) | ❌ Não |
| Logs | ❌ Não |
| Licença (`.lic`/`.cert`) | ⚠️ Indiretamente — os dados da licença ativada estão dentro da tabela `License`, logo dentro do `dev.db`; os ficheiros `.lic`/`.cert` originais não são guardados pelo servidor depois da ativação |

⚠️ **`server/uploads/` e o `.env` precisam de estratégia de backup própria, fora do
`BackupService`** — não estão cobertos hoje. Recomendação: incluir estas duas pastas num backup
de sistema mais amplo (ex.: cópia de disco periódica), gerido pela equipa de infraestrutura da
FADA, fora do âmbito do que a aplicação faz sozinha.

## Frequência e retenção

- Criação: manual, através do botão na UI (não há agendamento automático dentro da aplicação).
- Retenção: 30 cópias mais recentes, automática.
- ⚠️ Recomenda-se agendar a criação periódica (ex.: diária) através de uma tarefa do sistema
  operativo do servidor (Agendador de Tarefas no Windows, `cron` no Linux) chamando o endpoint
  `POST /api/v1/system/backups` com um token de `admin_sistema` — **não implementado
  automaticamente pela aplicação**, é um passo de configuração de infraestrutura.

## Localização e cópia externa

As cópias ficam **no mesmo disco do servidor** (`server/backups/`). Isto protege contra erro
humano/corrupção lógica, mas **não contra falha do próprio disco/servidor**. Descarregar
periodicamente as cópias importantes para um local fora da máquina do servidor (disco externo,
partilha de rede, armazenamento dedicado a backup) — via o botão "Descarregar" na UI ou
`GET /api/v1/system/backups/:filename/download`.

## Restauro

⚠️ NÃO IMPLEMENTADO como funcionalidade da aplicação — não existe um botão "Restaurar esta
cópia". Procedimento manual:

1. Ativar o Modo de Manutenção (bloqueia o acesso a todos exceto `admin_sistema`).
2. Parar o processo do backend.
3. Substituir `server/prisma/dev.db` pelo ficheiro de backup escolhido.
4. Reiniciar o backend.
5. Confirmar `GET /api/v1/health` devolve `status:"ok"`.
6. Desativar o Modo de Manutenção.

## Teste de restauro

⚠️ NÃO IMPLEMENTADO / não automatizado. Recomenda-se testar o procedimento de restauro acima
pelo menos uma vez antes de depender dele em produção — ver
[`../deployment/installation-checklist.md`](../deployment/installation-checklist.md).
