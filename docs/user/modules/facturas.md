# Facturas

## Objetivo

Gerir o ciclo de vida de uma factura, desde a submissão até ao pagamento.

## Quem pode utilizar

- **Ver**: gabinetes executivos, Financeiro, Compras, Administração, utilizadores externos (só as
  suas próprias facturas submetidas, ex.: fornecedores).
- **Criar**: Financeiro, Compras, Administração.
- **Gerir**: PCA, PCE, Financeiro, Compras, Gestão.
- **Aprovar**: PCA, PCE, Administrador, Gestão.

## Fluxo de estados (obrigatório, não pode ser saltado)

```
rascunho → pendente → validado → aprovado → submetido ao banco → pago
```

Uma factura **nunca pode passar diretamente de "aprovado" para "pago"** — tem sempre de passar
por "submetido ao banco" primeiro. Isto garante que existe sempre um registo da Ordem de
Pagamento submetida ao banco antes de a factura ser dada como paga. Se tentar saltar esta etapa,
o sistema rejeita a ação.

A qualquer momento (até "aprovado"), uma factura pode ser rejeitada, cancelada ou arquivada —
estes são estados finais, sem retorno.

## Campos principais

Fornecedor, NIF, valor, moeda, data de emissão, data de vencimento, descrição, anexos.

## Externo — submissão pública

Um fornecedor externo pode submeter uma factura através de um formulário público, sem precisar
de conta completa no sistema.
