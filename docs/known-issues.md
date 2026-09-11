# Problemas Conhecidos — SIPAR-FADA

Este documento **não substitui** o registo completo da auditoria de pré-produção (152 achados
originais, com estado de resolução atualizado) — esse fica no artefacto "SIPAR Readiness Ledger"
já publicado. Aqui ficam: (1) uma referência rápida aos achados citados por âncora a partir de
outros documentos desta pasta, e (2) achados **novos**, encontrados especificamente durante a
escrita desta documentação (2026-09), que ainda não estavam registados.

## Resolvidos durante a escrita desta documentação

Ao investigar HC-06/HC-07/HC-08 para os documentar com precisão, confirmaram-se e corrigiram-se
de imediato (código real, testado, não só descrito):

- **HC-06** — `isAdminUser()` deixou de usar um array fixo de 11 strings de role. Passa a ler
  `Role.executivo` (novo campo, migração `20260910110655_add_role_executivo`), com cache de 5min
  em memória. **Corrigiu, de caminho, uma divergência real já existente**: o array antigo e a
  lista `EXECUTIVO_ROLES` do seed já tinham divergido — `administracao` e `tecnologia_informacao`
  estavam marcados como "executivo" no RBAC seedado mas *não* eram reconhecidos por
  `isAdminUser()`/`requireAdmin`. Verificado ao vivo: um utilizador `tecnologia_informacao` que
  antes levava 403 em rotas `requireAdmin` (ex.: `POST /meeting-rooms`) agora recebe 201.
- **HC-07** — `requireIT` deixou de comparar 3 variações do nome do departamento
  (`'Tecnologia da Informacao'`/`'Tecnologia da Informação'`/`'tecnologia_informacao'`). Passa a
  comparar `req.user.departmentSlug` (resolvido uma vez em `requireAuth` via
  `departmentRef.slug`, imutável a uma renomeação feita no admin real).
- **HC-08** — os dois mapas `roleByPapel` duplicados (Ordem de Pagamento, Acta) foram unificados
  numa única fonte, `SIGNATURE_ROLE_MAP` (`server/src/routes/modules.routes.ts`), com
  `ALLOWED_SIGNATURE_PAPEIS` a definir só quais papéis cada documento aceita.
- **OPS-11 / OPS-28** — supervisão de processo deixou de ser só documentação: `server/scripts/install-windows-service.ps1`
  (NSSM) e `server/scripts/sipar-fada-backend.service` (systemd) tornam-na um comando por
  instalação em vez de um procedimento manual a seguir à mão.

Nenhum destes exigiu decisão de arquitetura fora do âmbito de uma correção normal — por isso
foram implementados, não só descritos.

## Achados novos desta análise

### Primeiro `admin_sistema` — sem fluxo de bootstrap {#primeiro-admin-sistema}

**Problema**: `POST /api/v1/users/create` exige `requireSystemAdmin`. `POST /api/v1/auth/register`
(público) restringe `role` a `['user', 'attendant', 'requester']` — um vocabulário de role
**diferente e legado**, que não corresponde a nenhum dos 26 roles reais (departamentos +
`admin_sistema`) usados pelo resto do sistema. Não existe nenhum caminho para criar a primeira
conta `admin_sistema` de uma instalação nova, exceto correr `prisma/seed.ts` (que também cria 14
contas de demonstração com passwords fracas) ou inserir diretamente na base de dados.

**Impacto**: um técnico a instalar o sistema de raiz, sem correr o seed, fica sem forma de
aceder aos ecrãs administrativos.

**Local**: `server/src/routes/users.routes.ts:92`, `server/src/controllers/auth.controller.ts:73`.

**Prioridade**: P1 — bloqueia uma instalação limpa sem depender do seed de demonstração.

**Recomendação**: um script one-off dedicado (`npm run create-admin`, interativo ou por
argumentos) que cria só a conta `admin_sistema`, sem as contas de demonstração.

### Vocabulário de role legado ainda ativo no registo público

**Problema**: `auth.controller.ts` (`register`) e `client/src/components/management/user-management.tsx`
(`LEGACY_ROLE_OPTIONS`) mantêm um vocabulário de role (`admin`/`attendant`/`user`) diferente do
vocabulário real de 26 roles baseado em departamento, usado em paralelo sem clareza sobre quando
cada um se aplica.

**Impacto**: um utilizador registado publicamente via `/auth/register` fica com um `role` que não
corresponde a nenhum departamento real — invisível para a maioria das permissões do sistema, que
assumem `role` = departamento.

**Local**: `server/src/controllers/auth.controller.ts:73`.

**Prioridade**: P2 — comportamento confuso, não um risco de segurança direto.

### "Ofícios" — módulo referenciado nas permissões, sem backend nem UI {#oficios-modulo-fantasma}

**Problema**: `permissions.tsx` define `VIEW_OFICIOS`/`CREATE_OFICIOS`/`MANAGE_OFICIOS`, e o
modelo `Oficio` existe em `schema.prisma`, mas **não há nenhuma rota backend registada** para
`Oficio` (confirmado por pesquisa exaustiva em `server/src/routes/`) nem nenhum ecrã alcançável a
partir de `client/src/App.tsx`. É um módulo "fantasma" — existe o vocabulário de permissões, não
existe a funcionalidade.

**Impacto**: nenhum imediato (não é alcançável, logo não pode ser mal utilizado) — mas é código
morto que pode confundir um desenvolvedor novo a pensar que a funcionalidade existe.

**Prioridade**: P3 — cosmético/manutenibilidade.

**Recomendação**: remover as 3 constantes de permissão órfãs, ou implementar o módulo se for
necessário no futuro.

### Comunicação Tauri↔servidor em HTTP simples

**Problema**: a configuração observada (`VITE_API_URL`, exemplos no `.env`) usa `http://`, não
`https://`. Ver [`security/security.md`](security/security.md#comunicação-tauri--api).

**Prioridade**: P2 — risco real só se a rede local não for inteiramente confiável.

## Achados do diagnóstico original, citados nesta documentação

Consultar o artefacto "SIPAR Readiness Ledger" (publicado, com estado de resolução por achado)
para o detalhe completo de cada um destes IDs. Lista dos citados a partir desta pasta de
documentação, para conveniência:

`DB-015`, `DB-017`, `DB-019` · `SEC-05`, `SEC-14` · `ARCH-02`, `ARCH-05`, `ARCH-10`, `ARCH-11`,
`ARCH-14` · `HC-05`, `HC-28`, `HC-29` · `OPS-07`, `OPS-08`, `OPS-09`, `OPS-13`, `OPS-14`,
`OPS-20`, `OPS-27`.

`HC-06`, `HC-07`, `HC-08` e `OPS-11`/`OPS-28` já não constam desta lista — ver
"Resolvidos durante a escrita desta documentação" acima.

## Anexo: âncoras usadas noutros documentos

Como o artefacto da auditoria vive fora deste repositório (publicado como página, não como
ficheiro versionado), as âncoras `#db-015`, `#arch-11`, etc. citadas a partir de outros
documentos desta pasta (`developer/`, `operations/`, `security/`) **não resolvem para uma secção
específica deste ficheiro** — servem como referência textual ao ID do achado, a procurar no
artefacto publicado. Se este repositório vier a precisar de um registo de achados totalmente
autocontido (sem depender do artefacto externo), copiar aqui a tabela completa dos 152 achados é
o próximo passo — não feito nesta ronda para evitar duplicar e divergir de uma fonte já publicada
e mantida.
