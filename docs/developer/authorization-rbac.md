# Autorização e RBAC — SIPAR-FADA

O sistema tem **duas camadas de autorização paralelas**, não totalmente unificadas — importante
entender ambas antes de alterar permissões.

## Camada 1 — RBAC real, orientado a departamento (a maioria dos módulos de negócio)

`role` de um utilizador é, na prática, o **slug do seu departamento** — 25 valores
correspondentes 1:1 à tabela `Department` (seed em `server/prisma/seed-rbac.ts`), mais o role
técnico `admin_sistema`:

```
gabinete_pca · gabinete_pce · gabinete_administrador · gabinete_director · gestao
gabinete_ministro · gabinete_secretario_estado_1 · gabinete_secretario_estado_2
gabinete_vice_governador_1 · gabinete_vice_governador_2
financeiro · recursos_humanos · juridico · compras · tecnologia_informacao
operacoes · operacional_frota
administracao · administrativo · comunicacao_imagem · seguranca · secretaria · externo
planeamento · organizacao_qualidade · compliance · risco
admin_sistema  (role técnico, sem departamento correspondente)
```

Permissões por módulo de negócio (`GET /api/v1/<módulo>`) são resolvidas pela tabela
`RolePermission` (`roleId`, `module`, `action`), consultada via
`permissions.getUserPermissions()`/`hasPermission()` (`server/src/utils/permissions.ts`) —
**esta camada é real e efetivamente aplicada** pelo motor de CRUD genérico.

## Camada 2 — checks hardcoded (rotas administrativas)

As rotas administrativas — `users`, `departments`, `roles`, `areas`, `audit`, `system`
(diagnóstico/backup/manutenção) — **não consultam `RolePermission`**. Usam
`requireSystemAdmin` (`req.user.role === 'admin_sistema'`, string fixa) ou, nalguns pontos mais
antigos, `requireAdmin`/`isAdminUser()` (`server/src/middlewares/auth.ts`). Revogar uma
permissão sobre estes módulos no ecrã "Roles e Permissões" **não tem qualquer efeito real** sobre
estas rotas — o próprio ecrã já avisa disto explicitamente na UI
(`client/src/components/admin/roles-permissions-admin.tsx`, alerta de disclosure adicionado
durante a auditoria). Ver [`known-issues.md`](../known-issues.md#sec-05).

`isAdminUser()` já não é um array fixo de strings — lê `Role.executivo` (campo real na tabela
`Role`, seedado a partir de `EXECUTIVO_ROLES` em `seed-rbac.ts`), cacheado 5 min em memória.
Marcar um role novo como `executivo` no seed (ou diretamente na BD) concede-lhe `requireAdmin`
sem tocar em código. Ver [`known-issues.md`](../known-issues.md) para o histórico desta correção.

`requireIT` (`server/src/middlewares/auth.ts`) verifica `req.user.role === 'tecnologia_informacao'`
ou `req.user.departmentSlug === 'tecnologia_informacao'` — o slug é resolvido uma vez em
`requireAuth` a partir de `departmentRef.slug`, imutável a uma renomeação do departamento feita
no admin real (corrigido; a versão anterior comparava 3 variações do nome livre).

## RBAC no cliente (frontend)

`client/src/components/auth/permissions.tsx` — objeto `PERMISSIONS` (constante estática,
~30 chaves de permissão, cada uma mapeada a uma lista fixa de `UserRole`) +
`hasPermission(role, permission)`. Controla **só a UI** (que menu/botão aparece) — nunca a
autoridade real, que é sempre re-verificada no backend. Esta lista **duplica**, com strings
fixas, o que a tabela `RolePermission` já resolve dinamicamente no servidor — um role novo ou
renomeado no admin real não ganha entrada automática aqui. Ver
[`known-issues.md`](../known-issues.md#hc-05).

Exemplo de permissões exclusivas do `admin_sistema` (`MANAGE_USERS`, `MANAGE_SETTINGS`,
`VIEW_AUDIT`, `MANAGE_DATABASE`) — estas são as que controlam a visibilidade dos ecrãs cobertos
pela Camada 2 acima.

## Resumo — a quem perguntar antes de mudar permissões

| Pergunta | Resposta real |
|---|---|
| "Um utilizador de RH devia ver Facturas?" | Editar `RolePermission` via o ecrã "Roles e Permissões" — efeito real |
| "Quero dar a alguém acesso à Gestão de Utilizadores" | Não é possível via RBAC — só mudando `role` para `admin_sistema` |
| "Preciso de adicionar um departamento novo" | Criar via "Gestão de Departamentos" — mas ver [`known-issues.md`](../known-issues.md#hc-06) sobre o array fixo de "admin executivo" no backend não reconhecer departamentos novos automaticamente |
