# SIPAR20 (FADA) — Registo de alterações — 26 de Agosto de 2026

Contexto: React/Vite (client) + Express/Prisma/SQLite (server), projeto irmão de
`MINTRANS/SIPAR`. Módulos activos: Gestão de Solicitação, Agenda, Livros de Actas,
Reuniões Internas, Comunicação Interna, Procurement, Gestão de Pagamento/Facturas,
Mensagens, Notificações Push.

## 1. Limpeza de módulos

Removidos os módulos não usados pelo FADA, mantendo explicitamente Facturas/Gestão
de Pagamento (que tinha sido apagado por engano numa primeira passagem e foi
restaurado a partir do `HEAD`).

## 2. Segurança e autenticação (portado do MINTRANS)

- RBAC dinâmico: modelos `Department`, `Role`, `RolePermission`; `permissions.ts`
  reescrito para `async`, consultando a base de dados em vez de um `switch` estático.
- Novo papel `admin_sistema` com middleware `requireSystemAdmin`, separado do
  executivo (`gabinete_pca`).
- Login com refresh token (`POST /auth/refresh`), `JWT_SECRET` obrigatório no
  arranque do servidor, remoção do bypass de autenticação para "Fornecedor".
- **Falha crítica corrigida:** `GET /list-all-users` estava sem qualquer
  autenticação e devolvia registos com hash de password. Agora protegido com
  `requireAuth + requireSystemAdmin` e `select` explícito sem o campo password.
- Novo `/auth/me` (`GET`/`PUT`/`POST`) para o utilizador editar os seus próprios
  dados (nome, email, password, telefone, morada, coordenadas bancárias).

## 3. Fornecedores e Procurement

- Registo de fornecedor passou a recolher e guardar coordenadas bancárias (IBAN,
  NIB, SWIFT, titular, banco, cidade, país) — reutilizáveis/editáveis em facturas
  futuras.
- Criação automática de conta de utilizador (role `externo`) ao criar/associar um
  fornecedor, com envio de credenciais por email.
- Sequência de validação do Procurement reforçada no backend: um pedido tem de
  passar por cotação → validação → aprovação antes de gerar Ordem de Compra.
- Ao confirmar a receção de uma Ordem de Compra, o sistema gera automaticamente
  uma factura já em estado `validado` (não repete a validação), ligada por
  `purchaseOrderId`/`numeroOrdem`.

## 4. Ordem de Pagamento (documento oficial)

- `gerarPDFOrdemPagamento()` replica o ofício oficial da FADA, com logótipo real
  (`Logo_FADA.jpeg`) centrado, número por extenso, e assinaturas digitais
  (Presidente/Administrador) carregadas do perfil do utilizador.
- Geração automática da Ordem de Pagamento no momento em que a factura é
  aprovada; disponível como aba/menu dentro de Gestão de Pagamento.
- Fluxo completo: gerar → completar dados (despacho/conta a debitar) → assinar
  (por papel/cargo) → descarregar → avançar para submetido ao banco/pago, com
  notificação por email ao fornecedor nessas transições.

### Ajustes finais da Ordem de Pagamento

- Texto do bloco "Ao / Banco / Cidade" movido para alinhamento à direita (antes
  estava à esquerda).
- Blocos de assinatura (Presidente/Administrador) agora centrados na página
  (antes ancorados à esquerda).
- **Correcção principal:** os dados de Banco/IBAN/Cidade/País deixaram de vir de
  valores estáticos gravados na factura. Foi criada a função
  `resolveFornecedorBankInfo()` (`server/src/utils/module-routes-helper.ts`), que
  resolve sempre os dados bancários reais a partir da conta de utilizador do
  fornecedor (ou do registo de Fornecedor como *fallback*), ligada a três pontos:
  - criação automática da factura a partir da Ordem de Compra;
  - geração automática da Ordem de Pagamento na aprovação da factura;
  - endpoint manual de geração/regeneração da Ordem de Pagamento.

  Testado ao vivo: alterar o banco registado do fornecedor e regenerar a Ordem
  de Pagamento reflecte imediatamente o novo valor, sem necessidade de reseed.
- `server/prisma/seed.ts` actualizado: cada fornecedor de demonstração passou a
  ter uma conta de utilizador própria com dados bancários reais, e as facturas
  de mock passaram a herdar esses dados em vez de valores escritos directamente
  no JSON da factura.

## 5. Correcções de dados (Facturas)

- Bug recorrente "Fornecedor não especificado" / "NIF: •": `factura.fornecedor`
  podia vir como `string` ou objecto — corrigido com variáveis derivadas e
  mapeamentos no backend (`recordToResource`), incluindo uma segunda ocorrência
  do mesmo bug no ponto de geração do PDF.
- "Invalid Date" em emissão/vencimento/recebimento: faltavam mapeamentos
  `dataEmissao`/`dataVencimento`/`paidAt` → snake_case; corrigido no backend +
  `formatDate()` seguro no frontend.
- `total` vs `valor`: unificado (`total = total ?? valor ?? 0`) para não mostrar
  0 Kz em facturas criadas por admin/seed/procurement.

## 6. Outras funcionalidades portadas do MINTRANS

- Salas de Reunião (`MeetingRoom`) com verificação de conflito de
  disponibilidade, integradas no formulário de Reunião Interna.
- Auditoria de visualização (`POST /audit/view`).
- Mesma classe de correcções aplicada a Mensagens e Comunicação Interna.

## 7. Dados mock

Base de dados totalmente semeada com utilizadores (incluindo `admin_sistema`),
salas, reuniões, actas, comunicações, fornecedores (com contas bancárias reais),
pedidos/cotações/ordens de compra e facturas cobrindo todos os estados
possíveis — para validação end-to-end de cada funcionalidade.

## 8. Estabilidade

Causa raiz recorrente dos erros "Erro ao carregar facturas/procurement"
identificada como um processo de backend desactualizado (porta 5000) que não
reiniciava sozinho com as alterações — resolvido reiniciando o processo
directamente durante a sessão.

## Verificação

- `npx tsc --noEmit` (server): sem erros.
- `npm run build` (client): sem erros.
- `npm run test:rules` (server): 4/4 testes a passar.
- Seed reaplicado; alterações confirmadas ao vivo através do backend de
  desenvolvimento.
