# Compras (Procurement)

## Objetivo

Gerir o processo de aquisição: pedido de compra → cotações de fornecedores → ordem de compra →
receção → factura.

## Quem pode utilizar

Compras, Financeiro, gabinetes executivos, Gestão. Fornecedores externos podem submeter cotações
através do seu acesso próprio.

## Fluxo de estados

```
requisição → cotação → aprovação → aprovado → ordem de compra → recebida
```

Com saídas para rejeitado/cancelado/arquivado em qualquer ponto antes de "recebida" (estado
final). Não é possível saltar etapas (ex.: ir diretamente de "requisição" para "ordem de compra"
sem passar por cotação e aprovação).

## Fornecedores

Gerir a lista de fornecedores (cadastro, categorias que cada um fornece, dados bancários,
bloqueio/desbloqueio) está disponível no mesmo módulo. Um fornecedor pode ter uma conta de
utilizador ligada (role `externo`) para submeter cotações e facturas diretamente.

## Ao receber uma ordem de compra

O sistema gera automaticamente um rascunho de factura correspondente — confirme os dados antes
de avançar no fluxo de facturação.
