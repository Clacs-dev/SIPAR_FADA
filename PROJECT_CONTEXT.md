# Contexto do Projeto SIPAR20

Este arquivo resume a arquitetura e as convencoes atuais do projeto para facilitar futuras manutencoes.

## Visao Geral

O SIPAR20 e um sistema integrado de gestao administrativa com frontend em React/Vite e backend em Express/Prisma. A aplicacao cobre autenticacao, perfis por departamento, solicitacoes externas, agenda, reunioes internas, actas, oficios, comunicacoes, reclamacoes, contratos, pedidos/helpdesk, compras/procurement, facturas e frotas.

O projeto esta dividido em:

- `client/`: aplicacao web React.
- `server/`: API Express com Prisma e SQLite.

Nao ha repositorio Git inicializado na raiz no estado atual analisado.

## Stack

Frontend:

- Vite 6, React 18, TypeScript.
- Tailwind CSS 4 via `@tailwindcss/vite`.
- Radix UI, lucide-react, sonner, recharts, react-hook-form.
- Cliente HTTP proprio em `client/src/services/api.ts`.

Backend:

- Express 4, TypeScript, CommonJS no build.
- Prisma 5 com SQLite.
- JWT para autenticacao.
- bcryptjs para hash de senhas.
- Winston/Morgan para logs.
- Multer para storage/upload.

Banco de dados:

- `server/prisma/schema.prisma`
- SQLite via `DATABASE_URL`.
- Modelos principais: `User`, `InternalMeeting`, `KVStore`.

## Como Rodar

Backend:

```bash
cd server
npm install
npm run db:migrate:dev
npm run db:seed
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

URLs padrao:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000/api/v1`

Variaveis do backend detectadas em `.env`:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `SENDGRID_API_KEY`

## Fluxo de Autenticacao

O frontend usa `AuthProvider` em `client/src/components/auth/auth-context.tsx`.

Fluxo normal:

1. Login chama `POST /auth/login`.
2. Backend valida usuario no SQLite.
3. Backend retorna `session.access_token`.
4. Frontend guarda `access_token` e `user` no `localStorage`.
5. Ao recarregar, frontend chama `GET /auth/me`.

Middleware de autenticacao:

- `server/src/middlewares/auth.ts`
- Espera header `Authorization: Bearer <token>`.
- Valida JWT e carrega o usuario no Prisma.

Ha tambem uma tentativa de suporte a fornecedor externo via `Authorization: Fornecedor <token>`, mas no codigo atual isso fica depois de uma checagem que exige `Bearer`, entao esse fluxo precisa revisao se for usado.

## Perfis e Permissoes

Os papeis principais estao definidos tanto no frontend quanto no backend:

- Frontend: `client/src/components/auth/auth-context.tsx` e `client/src/components/auth/permissions.tsx`
- Backend: `server/src/utils/permissions.ts`

Papeis atuais incluem gabinetes, departamentos operacionais, financeiro, compras, TI, secretaria, externo, planeamento, compliance, risco etc.

O frontend calcula um perfil estendido:

- `admin-sistema`
- `gerente`
- `atendente`
- `financeiro`
- `operador`
- `user`

Esse perfil controla o menu lateral em `getMenuItems`.

O backend calcula permissoes por role em `getUserPermissions`, usado por `ModuleRoutesHelper` para validar acoes como `create`, `read_all`, `read_own`, `update`, `delete`, `approve`, `reject`.

## Arquitetura dos Modulos

Muitos modulos nao possuem tabelas proprias. Eles sao persistidos na tabela generica `KVStore` como JSON serializado.

Servico:

- `server/src/services/kv-store.service.ts`

Rotas genericas:

- `server/src/routes/modules.routes.ts`
- `server/src/utils/module-routes-helper.ts`

Modulos registrados dinamicamente:

- `oficios` usa prefixo `oficio:`
- `facturas` usa prefixo `factura:`
- `viaturas` usa prefixo `viatura:`
- `contratos` usa prefixo `contrato:`
- `reclamacaos` usa prefixo `reclamacao:`
- `fornecedors` usa prefixo `fornecedor:`
- `planejamentos` usa prefixo `planejamento:`
- `procurements` usa prefixo `procurement:`
- `operadors` usa prefixo `operador:`
- `comunicacaos` usa prefixo `comunicacao:`
- `actas` usa prefixo `acta:`
- `pedido_viaturas` usa prefixo `pedido_viatura:`

Atencao: alguns nomes plurais sao gerados automaticamente com `s`, por isso ficam linguisticamente estranhos (`reclamacaos`, `fornecedors`, `comunicacaos`). Se o frontend esperar portugues correto, isso precisa alinhamento.

## Rotas Importantes

Todas as rotas sao montadas em dois prefixos:

- `/api/v1`
- `/make-server-8b82752b`

O segundo existe para compatibilidade com chamadas legadas de Supabase/edge functions.

Principais rotas:

- `GET /api/health`
- `POST /api/v1/initialize`
- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/storage`
- `/api/v1/internal-meetings`
- `/api/v1/pedidos`
- rotas dinamicas dos modulos em `/api/v1/<modulo>`

## Reunioes Internas e Actas

Reunioes internas tem tabela propria:

- Prisma model: `InternalMeeting`
- Rotas: `server/src/routes/internal-meetings.routes.ts`

Ao criar uma reuniao interna, o backend:

1. Salva a reuniao em `InternalMeeting`.
2. Salva participantes adicionais no `KVStore` com chave `meeting_participants:<meetingId>`.
3. Cria automaticamente uma acta no `KVStore` com chave `acta:<actaId>`.
4. Registra auditoria e notificacoes.

## Usuarios e Seed

Usuarios ficam na tabela `User`.

O seed esta em:

- `server/prisma/seed.ts`

Ele cria usuarios demo como:

- `admin@sistema.com` / `123456`
- `pce@sistema.com` / `123456`
- `secretaria@sistema.com` / `123456`
- `usuario@empresa.com` / `123456`
- outros departamentos com senhas especificas (`gerente123`, `financeiro123`, `compras123`, etc.)

Alem da tabela `User`, o seed grava perfis compativeis no `KVStore`:

- `user_profile:<userId>`
- `user_email_lookup:<email>`

## Frontend

Ponto de entrada:

- `client/src/main.tsx`
- `client/src/App.tsx`

O app nao usa roteador URL tradicional. Ele usa estado local `activeTab` para renderizar telas conforme o menu lateral.

Layout:

- `client/src/components/layout/sidebar.tsx`

API:

- `client/src/services/api.ts`: cliente central.
- `client/src/utils/api-client.tsx`: adaptador de compatibilidade para chamadas antigas.

Componentes principais estao organizados por dominio:

- `components/actas`
- `components/admin`
- `components/auth`
- `components/compras`
- `components/comunicacoes`
- `components/contratos`
- `components/dashboard`
- `components/facturas`
- `components/frotas`
- `components/management`
- `components/oficios`
- `components/pedidos`
- `components/planejamento`
- `components/reclamacoes`

Ha muitos arquivos `.md`, `.sql` e paginas de teste dentro de `client/src`. Eles documentam correcoes/migracoes anteriores e scripts auxiliares, mas misturam documentacao e codigo-fonte dentro da pasta de aplicacao.

## Pontos de Atencao

- Codificacao de texto: muitos arquivos mostram caracteres quebrados em palavras portuguesas. Provavel problema de encoding UTF-8 lido/escrito como ANSI ou vice-versa.
- Autenticacao de fornecedor: o backend verifica `Bearer` antes de tratar `Fornecedor`, entao esse caminho pode estar quebrado.
- Divergencia de roles: `AuthController.register` valida apenas `user`, `attendant`, `requester`, mas o sistema atual usa roles como `externo`, `gabinete_pca`, `financeiro`, etc. A criacao por admin em `/users/create` aceita roles modernos.
- Frontend `User` em `auth-context.tsx` nao declara `department` e `position`, mas `sidebar.tsx` acessa `user?.department` e `user?.position`.
- Alguns modulos de frontend ainda carregam nomes/imports legados de Supabase. O projeto parece estar em transicao para backend Express local.
- A tabela `KVStore` da flexibilidade, mas reduz integridade relacional e validacao. Mudancas de schema de modulos precisam ser tratadas no frontend/backend com cuidado.
- O frontend usa `activeTab` em memoria. Recarregar a pagina volta ao dashboard, salvo fluxos especificos com localStorage.
- Ha `node_modules` dentro de `client` e `server`; nao analisar nem editar.

## Convencoes Recomendadas Para Proximas Alteracoes

- Para chamadas HTTP novas, usar `client/src/services/api.ts`.
- Para modulos CRUD simples, seguir o padrao `KVStore + ModuleRoutesHelper`.
- Para entidades com relacionamentos fortes, preferir tabela Prisma propria.
- Para permissoes, atualizar frontend e backend em conjunto.
- Para novos itens de menu, atualizar `getMenuItems`, `App.tsx` e permissoes quando aplicavel.
- Para rotas protegidas, usar `requireAuth`; para administracao, usar `requireAdmin` ou `requireIT`.
- Evitar adicionar mais documentacao solta em `client/src`; preferir `docs/` ou raiz.
