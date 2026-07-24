# Plano de Implementacao - SIPAR20

## Objetivo

Elevar o SIPAR20 de uma base funcional com CRUDs e modulos parcialmente integrados para um sistema mais eficaz, com regras de negocio completas, aprovacoes reais, integracoes externas, modulos financeiros robustos e qualidade de producao.

Estimativa atual: 65% de completude funcional.

Meta apos este plano: 90% a 95% de prontidao operacional.

## Principios

- Priorizar regras de negocio centrais antes de novas telas.
- Evitar duplicacao de logica entre modulos.
- Criar servicos reutilizaveis para workflow, numeracao, historico, validacao e notificacoes.
- Manter compatibilidade com as telas existentes sempre que possivel.
- Validar cada fase com build, testes e fluxo real no frontend.

## Fase 1 - Fundacao De Workflow

### Objetivo

Criar a base comum que todos os modulos vao usar para aprovacoes, historico, numeracao e validacao.

### Entregaveis

- Servico central de numeracao automatica.
- Tabela de sequencias por modulo, ano e mes.
- Historico/timeline por documento.
- Regras de imutabilidade por status.
- Validacao obrigatoria por tipo de documento.
- Motor de aprovacao multinivel.
- Auditoria mais detalhada para mudancas de estado.

### Itens Tecnicos

- Criar modelos Prisma:
  - `DocumentSequence`
  - `DocumentHistory`
  - `ApprovalWorkflow`
  - `ApprovalStep`
  - `ValidationRule`, se fizer sentido manter regras configuraveis.
- Criar servicos:
  - `sequence.service.ts`
  - `history.service.ts`
  - `workflow.service.ts`
  - `validation.service.ts`
- Integrar esses servicos no `ModuleRoutesHelper`.

### Criterios De Aceite

- Todo documento novo recebe numero padronizado.
- Toda criacao, edicao, aprovacao, rejeicao e cancelamento aparece no historico.
- Documento em status protegido nao pode ser alterado indevidamente.
- Backend rejeita dados obrigatorios ausentes.
- Fluxo de aprovacao registra aprovador, data, comentario e decisao.

## Fase 2 - Aplicar Regras Nos Modulos Prioritarios

### Objetivo

Aplicar a fundacao nos modulos com maior impacto operacional.

### Modulos Prioritarios

1. Pedidos
2. Facturas
3. Compras
4. Contratos
5. Reclamacoes
6. Actas e reunioes internas
7. Oficios

### Fluxos Necessarios

#### Pedidos

- Rascunho -> pendente -> aprovado -> em_compra -> entregue.
- Aprovacao por gestor.
- Aprovacao financeira quando valor ultrapassar limite.
- Encaminhamento para compras.

#### Facturas

- Submetida -> validada -> aprovada -> paga.
- Validacao financeira.
- Bloqueio de alteracao apos pagamento.
- Historico de pagamento.

#### Compras

- Requisicao -> cotacao -> aprovacao -> ordem_compra -> recebida.
- Ligacao com fornecedores.
- Comparativo de propostas.
- Geracao de ordem de compra.

#### Contratos

- Rascunho -> em_aprovacao -> ativo -> renovacao_pendente -> expirado/cancelado.
- Bloqueio de contrato ativo.
- Renovacao com historico.
- Alertas de vencimento.

#### Reclamacoes

- Aberta -> em_analise -> em_resolucao -> resolvida -> fechada.
- SLA por prioridade.
- Atribuicao de responsavel.
- Fechamento com feedback.

### Criterios De Aceite

- Cada modulo tem estados oficiais claros.
- Cada transicao valida permissao e status anterior.
- Cada tela consegue mostrar historico do documento.
- Estatisticas refletem os status reais.

## Fase 3 - Integracoes Reais

### Objetivo

Substituir placeholders por integracoes reais com email, reunioes online e push notifications.

### Gmail SMTP

#### Necessario

- Conta Gmail ou Google Workspace.
- Verificacao em duas etapas ativa.
- App Password gerada.
- Variaveis no `.env`:
  - `EMAIL_FROM`
  - `GMAIL_USER`
  - `GMAIL_APP_PASSWORD`

#### Criterio De Aceite

- `/api/v1/email/send-test` envia email real.
- Notificacoes transacionais chegam ao destinatario.

### Google Meet

#### Necessario

- Projeto no Google Cloud.
- Google Calendar API ativa.
- OAuth consent screen configurado.
- Credenciais:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REFRESH_TOKEN`

#### Criterio De Aceite

- Ao agendar reuniao online com Google Meet, o backend cria evento no Google Calendar com link real de conferencia.

### Zoom

#### Necessario

- App Server-to-Server OAuth no Zoom Marketplace.
- Credenciais:
  - `ZOOM_ACCOUNT_ID`
  - `ZOOM_CLIENT_ID`
  - `ZOOM_CLIENT_SECRET`

#### Criterio De Aceite

- Ao selecionar Zoom, o backend cria uma reuniao real e grava o join URL.

### Microsoft Teams

#### Necessario

- App Registration no Azure.
- Permissoes Microsoft Graph adequadas.
- Credenciais:
  - `MICROSOFT_TENANT_ID`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`

#### Criterio De Aceite

- Ao selecionar Teams, o backend cria online meeting real via Microsoft Graph.

### Push Notifications

#### Necessario

- Gerar VAPID keys.
- Guardar subscriptions no banco.
- Service worker funcional no frontend.
- Envio via biblioteca `web-push`.

#### Criterio De Aceite

- Usuario subscreve notificacoes.
- Sistema envia push real para usuario, role e broadcast.

## Fase 4 - Modulos Complexos

### Compras, Cotacao E Ordem De Compra

#### Entregaveis

- Requisicao de compra com itens.
- Pedido de cotacao para multiplos fornecedores.
- Recebimento de propostas.
- Comparativo de propostas.
- Selecao de fornecedor vencedor.
- Ordem de compra com numero automatico.
- Controle de entrega.
- Integracao com facturas e contratos.

### Planejamento Orcamental

#### Entregaveis

- Orcamento por ano, departamento e categoria.
- Linhas orcamentais.
- Versoes de orcamento.
- Aprovacao do orcamento.
- Alertas por limite.

### Execucao Orcamental

#### Entregaveis

- Valores orcados.
- Valores comprometidos.
- Valores realizados.
- Saldo disponivel.
- Percentual de execucao.
- Desvios por periodo/departamento/categoria.

### Contas A Pagar E Receber

#### Entregaveis

- Cadastro de obrigacoes.
- Cadastro de direitos a receber.
- Vencimentos.
- Pagamentos.
- Recebimentos.
- Fluxo de caixa projetado.

### Relatorios Financeiros

#### Entregaveis

- Relatorio por periodo.
- Relatorio por departamento.
- Relatorio de execucao orcamental.
- Fluxo de caixa.
- Exportacao PDF/Excel.

## Fase 5 - Qualidade De Producao

### Objetivo

Reduzir risco operacional e garantir previsibilidade.

### Entregaveis

- Testes unitarios para servicos principais.
- Testes de integracao para rotas principais.
- Testes de fluxo de aprovacao.
- Seeds realistas.
- Logs com request ID.
- Auditoria expandida.
- Permissoes refinadas por modulo, acao e departamento.
- Validacao tela por tela contra API atual.
- Correcao de textos com encoding quebrado.
- Limpeza de documentacao antiga de Supabase.
- Documentacao real de API.

### Criterios De Aceite

- `npm run build` passa no backend e frontend.
- Rotas principais testadas.
- Fluxos criticos documentados.
- Permissoes validadas por perfil.
- Sistema navegavel sem erros 404/500 nos modulos principais.

## Ordem Recomendada De Execucao

1. Criar fundacao de workflow.
2. Aplicar workflow em Pedidos, Facturas, Compras, Contratos e Reclamacoes.
3. Implementar Gmail real.
4. Implementar Google Meet real.
5. Implementar Zoom e Teams.
6. Implementar push notifications reais.
7. Completar Compras e Ordem de Compra.
8. Completar Planejamento e Execucao Orcamental.
9. Completar Contas a Pagar/Receber e Relatorios.
10. Fazer QA, testes e limpeza final.

## Estimativa De Evolucao

- Estado atual: 65%.
- Apos Fase 1: 75%.
- Apos Fase 2: 80%.
- Apos Fase 3: 85%.
- Apos Fase 4: 90%.
- Apos Fase 5: 90% a 95%.

## Decisao Necessaria Antes De Implementar

Antes de iniciar a implementacao, confirmar:

- Quais modulos sao prioridade absoluta.
- Quais cargos aprovam cada tipo de documento.
- Quais limites financeiros exigem aprovacao extra.
- Se Google Meet sera a plataforma principal.
- Se Zoom e Teams entram na primeira versao ou ficam como fase posterior.
- Se o sistema continuara com SQLite por agora ou migrara para PostgreSQL antes da producao.
