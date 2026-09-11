# Guia de Testes — SIPAR FADA (ponta a ponta)

Este guia percorre o sistema inteiro do ponto de vista de quem o usa: como
arrancar tudo, que contas usar, e o percurso passo-a-passo de cada módulo.
Segue a ordem pela qual os módulos normalmente se encadeiam num dia de
trabalho real (uma reunião gera uma acta, uma compra gera uma factura, etc.).

---

## 0. Arrancar o sistema

Precisas de **dois processos a correr ao mesmo tempo**, em dois terminais:

```bash
# Terminal 1 — servidor (API)
cd server
npm run dev
# fica à escuta em http://localhost:5000

# Terminal 2 — cliente (interface)
cd client
npm run dev
# fica à escuta em http://localhost:5173
```

Se alterares ficheiros do **servidor**, o `ts-node-dev --respawn` reinicia-se
sozinho — mas se ficar preso ou a app começar a dar erros estranhos sem
motivo aparente (ex: "sessão expirada" sem teres feito nada), **pára os dois
processos (Ctrl+C) e volta a arrancar os dois**. Não chega dar refresh no
browser.

Base de dados: se for a primeira vez, corre `npm run db:migrate:dev` e depois
`npm run db:seed` dentro de `server` para teres as contas de teste abaixo e
alguns dados de exemplo já prontos (um pedido de compra com cotações, uma
reunião interna, uma acta seed).

---

## 1. Contas de teste (criadas pelo seed)

Todas as passwords estão em `server/prisma/seed.ts`. Usa-as para trocar de
perfil e ver o sistema pelos "olhos" de cada papel — o menu lateral e o
dashboard mudam consoante o papel.

| Papel | E-mail | Password |
|---|---|---|
| Presidente do Conselho de Administração | `admin@sistema.com` | `123456` |
| Gabinete PCE | `pce@sistema.com` | `123456` |
| Gabinete Administrador | `administrador@sistema.com` | `123456` |
| Gabinete Director | `director@sistema.com` | `123456` |
| Gabinete Ministro | `ministro@sistema.ao` | `123456` |
| Gestão | `gerente@sistema.ao` | `gerente123` |
| Financeiro | `financeiro@sistema.ao` | `financeiro123` |
| Recursos Humanos | `rh@sistema.ao` | `rh123` |
| Compras | `compras@sistema.ao` | `compras123` |
| Tecnologia de Informação | `it@sistema.ao` | `it123` |
| Secretaria | `secretaria@sistema.com` | `123456` |
| Operações | `operador@sistema.ao` | `operador123` |
| Motorista (`operacional_frota`) | `motorista@sistema.ao` | `motorista123` |
| Administrador do Sistema (TI) | `sistema@fada.local` | `sistema123` |
| Utilizador Externo | `usuario@empresa.com` | `123456` |
| Fornecedor "Tech Solutions Angola" | `contacto@techsolutions.ao` | `fornecedor123` |
| Fornecedor "Agro Insumos Lda" | `geral@agroinsumos.ao` | `fornecedor123` |
| Fornecedor "Agência de Viagem Lda" | `reservas@agenciaviagem.ao` | `fornecedor123` |

> Nota: `motorista@sistema.ao` serve precisamente para testar o bloqueio de
> login de papéis sem módulo (ver secção 2). **Esse login deve falhar.**

---

## 2. Login e "Meu Perfil"

1. Abre `http://localhost:5173`.
2. Entra com `admin@sistema.com` / `123456`. Deve entrar directamente no
   Dashboard (nada de voltar sozinho ao ecrã de login).
3. Testa o bloqueio: faz logout, entra com `motorista@sistema.ao` /
   `motorista123`. **Esperado:** erro claro "a sua conta não tem nenhum
   módulo activo atribuído" — nunca deve entrar.
4. Volta a entrar como `admin@sistema.com`. Abre **Meu Perfil** (menu do
   utilizador, canto superior) → carrega uma imagem em "Minha Assinatura".
   **Esperado:** aparece "Assinatura carregada com sucesso" e a imagem fica
   visível ali mesmo — esta assinatura é a que vai ser usada para assinar
   actas e ordens de pagamento mais à frente neste guia.

---

## 3. Comunicações Internas

Usa `secretaria@sistema.com` ou `gerente@sistema.ao`.

1. **Comunicações → Nova Comunicação.**
2. Repara que **"Departamento de Origem" vem preenchido sozinho** (o teu
   departamento) e não pode ser editado.
3. Em "Departamento Destino", escolhe **Financeiro**.
4. Em "Destinatário específico (opcional)", pesquisa por nome — deixa em
   branco para testar o envio a todo o departamento, ou escolhe alguém (ex:
   `financeiro@sistema.ao`) para testar o envio dirigido a uma pessoa.
5. Preenche assunto/conteúdo e envia.
6. Entra como `financeiro@sistema.ao` → **Notificações**: deve aparecer a
   notificação da comunicação recebida.
7. De volta como secretaria/gestão, abre a comunicação enviada e testa
   **Delegar**: o campo já não é uma lista com todos os utilizadores — tens
   de pesquisar por nome, e-mail ou cargo.

---

## 4. Reuniões Internas → Acta automática

Usa `gerente@sistema.ao` (ou qualquer perfil com acesso a "Reuniões
Internas").

1. **Reuniões Internas → Nova Reunião.**
2. Em Participantes, pesquisa e adiciona um utilizador real (ex:
   `financeiro@sistema.ao`).
3. Testa também **"Convidar Externo"** — adiciona alguém com nome + e-mail
   que não tem conta no sistema (ex: `convidado.teste@exemplo.com`).
   **Esperado:** esse e-mail recebe um convite por e-mail com data/hora/local
   (confirma nos logs do servidor se não tiveres SMTP configurado — a
   tentativa de envio deve aparecer no log, mesmo que falhe por falta de
   configuração de SMTP em ambiente local).
4. Escolhe modalidade "Online" — repara que já não há campo para colar um
   link manualmente; o aviso explica que o link é gerado automaticamente.
5. Agenda a reunião. **Esperado:** mensagem de sucesso e, no Livro de Actas,
   aparece uma acta nova em estado "Rascunho" ligada a esta reunião.
6. Volta a **Reuniões Internas**, marca a reunião como **Confirmada**. Depois
   de confirmada, aparecem três opções:
   - **Aconteceu** — fecha a reunião como realizada e liberta a acta para
     deliberações/votações.
   - **Não Aconteceu** — fecha a reunião sem gerar decisões (estado "Não
     Realizada", separador próprio na lista).
   - **Adiar Reunião** — abre um mini-formulário para escolher nova data e
     novos horários; a reunião passa a estado "Adiadas" e volta a mostrar
     Confirmar/Cancelar, ou seja, entra de novo no mesmo ciclo.

---

## 5. Livro de Actas — edição (auto-criada) e criação manual

### 5.1 Editar a acta gerada automaticamente

1. **Livro de Actas** → abre a acta criada no passo anterior.
2. Clica **Editar** (só aparece para o organizador da reunião, ou para
   papéis de secretaria/gestão de actas).
3. Preenche:
   - **Discussões e Recomendações** (recomendações é uma lista — usa o botão
     "+" para adicionar mais do que uma).
   - **Estrutura Formal** (entidade, número da reunião, presidente,
     secretário) — sem isto o cabeçalho oficial gerado no PDF fica com
     placeholders tipo `[entidade]`.
   - Em **Pontos de Agenda e Votações**, adiciona um ponto, preenche
     Discussão, uma Intervenção, a Deliberação/Decisão, e escolhe Votação
     "Maioria" com votos a favor/contra/abstenções.
4. Guarda.
5. Clica **Finalizar Acta**.
6. Como `admin@sistema.com` (papel `gabinete_pca`), assina como Presidente
   (usa a assinatura carregada no passo 2). Como `secretaria@sistema.com`,
   assina como Secretário.
7. Só depois de **ambas** as assinaturas aparece o botão **Aprovar Acta**.
   Clica nele. **Esperado:** mensagem de sucesso e todos os participantes da
   reunião recebem um e-mail com a acta aprovada.

### 5.2 Criar uma acta manualmente (sem vir de nenhuma reunião)

1. **Livro de Actas → Nova Acta.**
2. Preenche tudo no mesmo formulário, sem precisar de criar depois em vários
   passos: dados da reunião, Estrutura Formal, participantes (pesquisa +
   convidar externo), e por cada ponto de agenda a discussão, intervenções,
   deliberação e votação directamente ali.
3. Cria. **Esperado:** abre logo os detalhes da acta recém-criada, já com
   tudo o que preencheste.

---

## 6. Centro de Mensagens

Usa dois utilizadores em duas abas (uma normal, outra anónima) — ex.
`gerente@sistema.ao` e `financeiro@sistema.ao`.

1. **Mensagens → Nova Mensagem.**
2. Pesquisa o destinatário por nome/e-mail/cargo (já não é uma lista solta).
3. Envia. Na outra aba, confirma que a mensagem chega em "Recebidas" e que
   dá para **Responder** directamente a partir da mensagem aberta.

---

## 7. Compras / Procurement

Usa `compras@sistema.ao`. O seed já deixa um pedido `PED-2026-000001` em
"Aguardando Cotações" com 2 cotações prontas — podes ir direto ao passo 5
para testar rapidamente, ou seguir tudo desde o início:

1. **Compras → Fornecedores → Novo Fornecedor** (ou usa os já existentes:
   Tech Solutions Angola / Agro Insumos Lda / Agência de Viagem Lda — login
   de cada um na tabela da secção 1, password `fornecedor123`).
2. **Compras → Pedidos → Novo Pedido**: preenche itens, categoria (tem de
   bater certo com a categoria do fornecedor) e valor estimado. Fica
   "Criado".
3. No pedido, clica **"Publicar para Fornecedores"** → passa a "Aguardando
   Cotações" e envia convite por e-mail aos fornecedores dessa categoria.
4. Faz logout, entra como um fornecedor (ex: `contacto@techsolutions.ao` /
   `fornecedor123`) → menu **Cotações** → submete uma cotação para o pedido
   (preço, disponibilidade por item, prazo de entrega).
5. Volta a entrar como `compras@sistema.ao`. No separador "Em Cotação", abre
   o pedido → aparece o aviso **"Analisar Cotações"**. Clica.
6. Em cada cotação repara nos scores (Preço/Disponibilidade/Prazo/Total) —
   já não ficam a 0. Clica **"Aprovar Esta Cotação"** na que quiseres (não
   tens de escolher a mais barata).
7. **Esperado:** gera automaticamente uma Ordem de Compra e o pedido passa a
   "Concluído".
8. Em **Compras → Ordens**, marca a ordem como **"Recebida"**. **Esperado:**
   gera automaticamente uma Factura em estado "Validado" — segue para a
   secção 8.

---

## 8. Facturas / Gestão de Pagamento

Continua com `financeiro@sistema.ao` ou `compras@sistema.ao`.

1. **Facturas** → separador "Validados" → abre a factura gerada no passo
   anterior (ou uma das facturas do seed).
2. **Aprovar** a factura → gera automaticamente o número da Ordem de
   Pagamento.
3. No separador **"Ordens de Pagamento"** (agora logo a seguir a
   "Aprovados"), completa os dados da ordem e assina (como
   `admin@sistema.com` ou `administrador@sistema.com`, usando a assinatura
   do perfil).
4. Clica **"Submeter ao Banco"**. **Esperado:** já não é possível saltar
   directamente de "Aprovado" para "Pago" sem passar por aqui — se tentares
   pela API directamente, o servidor recusa.
5. Só depois de "Submetido ao Banco" aparece **"Registar Pagamento"**. Regista
   com comprovativo. **Esperado:** factura passa a "Pago", e o fornecedor
   (se for uma factura externa) recebe notificação.

Testa também submeter uma factura como utilizador externo (`usuario@empresa.com`
ou um fornecedor) em **Minhas Facturas**, incluindo anexar um documento — o
upload deve funcionar de uma vez (sem "sucesso" seguido de erro).

---

## 9. Dashboard Departamental / Relatórios Departamentais

Usa `admin@sistema.com` ou `sistema@fada.local`.

1. **Dashboard Departamental**: filtra por categoria e por departamento.
   **Esperado:** todos os números (utilizadores, facturas, actas,
   comunicações, reuniões) mudam com o filtro e reflectem dados reais — não
   há nenhum número que fique sempre igual independentemente do filtro
   (isso seria sinal de estar mockado outra vez).
2. **Relatórios Departamentais**: exporta CSV e confere que os valores no
   ficheiro batem certo com o que está no ecrã.

---

## 10. Verificação rápida por perfil (dashboards diferenciados)

Entra sucessivamente com `financeiro@sistema.ao`, `compras@sistema.ao` e
`sistema@fada.local` e confirma que o Dashboard inicial de cada um é
diferente do de `gerente@sistema.ao`:
- Financeiro/Administrador do Sistema **não devem ver** cartões de
  "Apresentações"/"Audiências" (não é o trabalho deles).
- O cartão "Compras" mostra a contagem real de pedidos, nunca "0" fixo.
- A secção "Módulos do Sistema" só mostra os módulos a que aquele perfil
  tem mesmo acesso (compara com o menu lateral de cada um).

---

## 11. Cartas de Apresentação / Pedidos de Audiência

Fluxo mais simples, para não ficar de fora:

1. Como `usuario@empresa.com` (utilizador externo), cria uma **Nova Carta de
   Apresentação** e um **Novo Pedido de Audiência**.
2. Como `secretaria@sistema.com`, vai a **Gestão de Solicitações**, aceita
   ou agenda os pedidos, e testa **Delegar** para outro utilizador
   (pesquisa por nome/e-mail/cargo, como nas comunicações).
3. Depois de agendado (estado "Agendado"), abre o pedido de novo — aparecem
   as mesmas três opções das reuniões internas: **Aconteceu** (passa a
   "Reunião Realizada"), **Não Aconteceu** (passa a "Não Compareceu") e
   **Adiar** (reabre o diálogo de agendamento para escolher nova data/hora,
   mantendo o estado "Agendado").

---

## Registo de problemas encontrados

Usa esta tabela enquanto testas — mais fácil do que ires escrevendo tudo à
mistura numa mensagem:

| Módulo | O que fizeste | O que esperavas | O que aconteceu |
|---|---|---|---|
| | | | |
