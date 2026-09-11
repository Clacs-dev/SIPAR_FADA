# Documentação SIPAR-FADA

Sistema on-premise: um servidor central na rede da FADA + a app desktop (Tauri) instalada em
cada PC de utilizador. Ver o diagrama completo em
[`developer/architecture.md`](developer/architecture.md).

```text
DOCUMENTAÇÃO SIPAR-FADA
│
├── 👨‍💻 developer/        — arquitetura, backend, frontend, Tauri, BD, auth, RBAC, licenciamento, API, testes
├── 👤 user/               — manual do utilizador final (não-técnico)
├── ⚙️ user/admin-system.md — manual do Administrador do Sistema
├── 🖥️ deployment/server-installation.md — instalação do servidor
├── 💻 deployment/client-installation.md — instalação do Tauri nos PCs
├── 🌐 operations/network.md            — rede, portas, firewall
├── 🔐 security/security.md             — segurança (documento único)
├── 📜 deployment/licensing.md          — licenciamento (procedimento)
├── 💾 operations/backup-recovery.md    — backup e recuperação
├── 🚀 deployment/                       — instalação, atualização, checklists
├── 🔄 deployment/update.md              — atualizações
├── 🛠️ devops/runbook.md                 — runbook operacional
├── 🚨 developer/troubleshooting.md, user/troubleshooting.md — diagnóstico
└── ✅ deployment/go-live-checklist.md   — checklist final
```

## Por audiência

| Eu sou... | Comece aqui |
|---|---|
| Desenvolvedor | [`developer/README.md`](developer/README.md) |
| Utilizador final | [`user/README.md`](user/README.md) |
| Administrador do Sistema (perfil `admin_sistema`) | [`user/admin-system.md`](user/admin-system.md) |
| Técnico de infraestrutura / DevOps da FADA | [`deployment/server-installation.md`](deployment/server-installation.md) → [`deployment/client-installation.md`](deployment/client-installation.md) → [`devops/runbook.md`](devops/runbook.md) |

## Outros

- [`known-issues.md`](known-issues.md) — problemas encontrados durante a análise que produziu
  esta documentação, mais referência ao registo completo da auditoria de pré-produção.
- [`documentation-matrix.md`](documentation-matrix.md) — rastreabilidade funcionalidade → código
  → documento → estado.
- [`CHANGELOG-2026-08-26.md`](CHANGELOG-2026-08-26.md) — histórico anterior a esta documentação.

## Regras seguidas ao escrever esta documentação

Toda a informação aqui vem da leitura direta do código-fonte (schema Prisma completo, todas as
rotas, todos os `process.env.*` usados, configuração real do Tauri) — nada foi inventado. Onde
uma informação não está definida no projeto (ex.: requisitos de hardware, IP do servidor,
sistema operativo do servidor), está marcada explicitamente como
**⚠️ CONFIGURAÇÃO A DEFINIR**. Onde uma funcionalidade não está implementada, está marcada como
**❌ NÃO IMPLEMENTADO**, nunca descrita como se existisse.

## Cobertura

```text
Módulos de negócio documentados: 6/6 (presentations, audiences, actas, comunicacoes, facturas, compras)
  + confirmado ausente: "Ofícios" (permissões existem, sem backend/UI — ver known-issues.md)
  + 10 modelos dormentes confirmados sem rota (documentados como tal, não como funcionalidade)
Endpoints documentados: inventário completo em developer/api.md
Roles documentados: 26/26 (25 departamentos + admin_sistema)
Variáveis de ambiente documentadas: 36/36 encontradas no código (server/.env.example atualizado)
Processos operacionais: instalação servidor, instalação cliente, atualização, backup/restauro,
  licenciamento — todos documentados, com o que está automatizado vs. manual marcado
  explicitamente
```
