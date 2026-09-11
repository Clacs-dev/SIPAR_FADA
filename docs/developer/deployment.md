# Deployment — Ponteiro

Este documento não duplica conteúdo — a documentação de implantação vive em dois sítios,
consoante a audiência:

- [`../operations/on-premises.md`](../operations/on-premises.md), [`../operations/network.md`](../operations/network.md),
  [`../operations/backup-recovery.md`](../operations/backup-recovery.md) — o ambiente de
  produção e como operá-lo.
- [`../deployment/server-installation.md`](../deployment/server-installation.md),
  [`../deployment/client-installation.md`](../deployment/client-installation.md),
  [`../deployment/licensing.md`](../deployment/licensing.md),
  [`../deployment/update.md`](../deployment/update.md) — o procedimento passo-a-passo de
  instalar/atualizar.
- [`../deployment/installation-checklist.md`](../deployment/installation-checklist.md) e
  [`../deployment/go-live-checklist.md`](../deployment/go-live-checklist.md) — checklists.

Do ponto de vista de código, a única coisa relevante para um desenvolvedor é: `npm start` no
servidor corre sempre `npm run build` primeiro (`prestart` em `package.json`) — nunca iniciar
com `node dist/index.js` diretamente sem garantir que o `dist/` está atualizado.
