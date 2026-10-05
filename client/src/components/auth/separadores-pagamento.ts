/**
 * Separadores da Gestao de Pagamento e o modulo RBAC que controla cada um
 * (permissao "read_all" = ver o separador). Usado pelo ecra Facturas &
 * Pagamentos (mostrar/esconder) e pela matriz de Roles e Permissoes (uma
 * linha por separador). Manter igual a MODULES em server/src/utils/permissions.ts.
 */

export interface SeparadorPagamento {
  /** Valor do separador em facturas-main.tsx. */
  tab: string;
  /** Modulo RBAC. */
  module: string;
  label: string;
}

export const SEPARADORES_PAGAMENTO: SeparadorPagamento[] = [
  { tab: 'dashboard', module: 'pagamentos_dashboard', label: 'Dashboard' },
  { tab: 'todas', module: 'pagamentos_todas', label: 'Todas' },
  { tab: 'pendentes', module: 'pagamentos_pendentes', label: 'Pendentes' },
  { tab: 'validados', module: 'pagamentos_aprovados_dsg', label: 'Aprovados-DSG' },
  { tab: 'aprovadas', module: 'pagamentos_autorizacao_despesas', label: 'Autorização de Despesas' },
  { tab: 'ordens_pagamento', module: 'pagamentos_ordens_fornecedor', label: 'Ordens de Pagamento Fornecedor' },
  { tab: 'ordens_pagamento_interna', module: 'pagamentos_ordens_interna', label: 'Ordens de Pagamento Interna' },
  { tab: 'submetido_banco', module: 'pagamentos_submetido_banco', label: 'Submetido ao Banco' },
  { tab: 'pagamentos', module: 'pagamentos_pagos', label: 'Pagos' },
];
// Mapa de Impostos (tax_map) e Mapa de Actividades (activity_map) ficam so no
// menu lateral - deixaram de ser separadores da Gestao de Pagamento/Procurement.

export const MODULO_DO_SEPARADOR: Record<string, string> = Object.fromEntries(
  SEPARADORES_PAGAMENTO.map((s) => [s.tab, s.module])
);

/**
 * Passos do fluxo da factura (permissao "approve" = pode executar o passo).
 * Manter igual a PASSO_DA_FACTURA em server/src/utils/permissions.ts.
 */
export const ACCOES_PAGAMENTO = [
  { module: 'pagamentos_accao_aprovar_dsg', label: 'Aprovar factura pendente (Aprovar-DSG)' },
  { module: 'pagamentos_accao_autorizar', label: 'Autorizar despesa (Autorização de Despesas / rejeitar)' },
  { module: 'pagamentos_accao_pagar', label: 'Pagamento (Ordem de Pagamento, submeter ao banco, marcar pago)' },
];
