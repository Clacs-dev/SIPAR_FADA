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
  { tab: 'mapa_impostos', module: 'tax_map', label: 'Mapa de Impostos' },
  { tab: 'mapa_actividades', module: 'activity_map', label: 'Mapa de Actividades' },
];

export const MODULO_DO_SEPARADOR: Record<string, string> = Object.fromEntries(
  SEPARADORES_PAGAMENTO.map((s) => [s.tab, s.module])
);
