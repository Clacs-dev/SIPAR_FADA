# Documentação do Desenvolvedor — SIPAR-FADA

Guia técnico completo para quem vai compreender, manter, corrigir ou evoluir o SIPAR-FADA.
Baseado exclusivamente na implementação real encontrada no repositório em 2026-09 — nenhum valor
foi inventado; onde algo não está definido no código, está marcado explicitamente como
⚠️ CONFIGURAÇÃO A DEFINIR ou ❌ NÃO IMPLEMENTADO.

## Índice

| Documento | Conteúdo |
|---|---|
| [`architecture.md`](architecture.md) | Arquitetura geral, topologia de produção, fluxo de dados, diagramas |
| [`project-structure.md`](project-structure.md) | Estrutura de pastas do repositório |
| [`backend.md`](backend.md) | Express, rotas, serviços, middlewares, motor de CRUD genérico |
| [`frontend.md`](frontend.md) | React/Vite, estrutura de componentes, hooks, estado |
| [`tauri.md`](tauri.md) | Wrapper desktop, build, limitações atuais de configuração |
| [`database.md`](database.md) | Schema Prisma, os 48 modelos, migrações, índices |
| [`authentication.md`](authentication.md) | Login, JWT, sessões, refresh, recuperação de password |
| [`authorization-rbac.md`](authorization-rbac.md) | RBAC, matriz de permissões, roles, departamentos |
| [`admin-system.md`](admin-system.md) | O role técnico `admin_sistema` do ponto de vista de código |
| [`licensing.md`](licensing.md) | Sistema de licenciamento (assinatura Ed25519, fingerprint, CRL) |
| [`api.md`](api.md) | Inventário completo dos endpoints REST |
| [`storage.md`](storage.md) | Upload/armazenamento local de ficheiros |
| [`configuration-environment.md`](configuration-environment.md) | Todas as variáveis de ambiente realmente usadas |
| [`testing.md`](testing.md) | Testes automatizados, CI |
| [`security.md`](security.md) | Ver [`../security/security.md`](../security/security.md) (documento único, não duplicado) |
| [`troubleshooting.md`](troubleshooting.md) | Diagnóstico de problemas do ponto de vista de código |
| [`development-workflow.md`](development-workflow.md) | Convenções, arrancar em desenvolvimento, checklist de PR |
| [`deployment.md`](deployment.md) | Aponta para [`../deployment/`](../deployment/) e [`../operations/`](../operations/) |

**Consolidações face à lista original pedida**: `audit.md` e `logging.md` foram fundidos em
[`backend.md`](backend.md) (secção "Auditoria e logs") porque, no código real, são a mesma
infraestrutura — `AuditLog` (tabela Prisma) e Winston (ficheiro) — sem uma camada de logging
distinta o suficiente para justificar dois documentos. `security.md` não é duplicado aqui —
aponta para o documento único em `docs/security/security.md`, partilhado com as outras audiências.
`upgrade.md` foi fundido em [`../deployment/update.md`](../deployment/update.md) — é o mesmo
procedimento, só descrito uma vez.
