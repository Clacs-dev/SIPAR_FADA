import prisma from '../config/database';

export interface Permission {
  module: string;
  actions: string[];
  description?: string;
}

// Roles deixaram de ser um conjunto fixo: agora vivem na tabela Role e sao
// geridos pelo Administrador do Sistema. O tipo abaixo existe so por
// legibilidade nas assinaturas de funcao.
export type SystemRole = string;

export interface UserPermissions {
  role: SystemRole;
  department?: string;
  position?: string;
  profiles?: string[];
  permissions: Permission[];
}

export const MODULES = {
  PRESENTATIONS: 'presentations',
  AUDIENCES: 'audiences',
  REQUESTS: 'requests',
  SCHEDULE: 'schedule',
  INTERNAL_MEETINGS: 'internal_meetings',
  ACTAS: 'actas',
  COMMUNICATIONS: 'communications',
  FINANCE: 'finance',
  INVOICES: 'invoices',
  USERS: 'users',
  DEPARTMENTS: 'departments',
  ROLES: 'roles',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  AUDIT: 'audit',
  DATABASE: 'database',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  // Mapa de Actividades (DSG): read_all = ver, export = descarregar .xlsx,
  // update = completar/corrigir linhas. Concedido explicitamente por role.
  ACTIVITY_MAP: 'activity_map',
  // Mapa de Impostos (read_all = ver). Os dados vem das facturas, por isso
  // tambem e preciso invoices:read_all.
  TAX_MAP: 'tax_map',
  // Separadores da Gestao de Pagamento (read_all = ver o separador). Cada um
  // e ligado/desligado por role no ecra "Roles e Permissoes".
  PAGAMENTOS_DASHBOARD: 'pagamentos_dashboard',
  PAGAMENTOS_TODAS: 'pagamentos_todas',
  PAGAMENTOS_PENDENTES: 'pagamentos_pendentes',
  PAGAMENTOS_APROVADOS_DSG: 'pagamentos_aprovados_dsg',
  PAGAMENTOS_AUTORIZACAO_DESPESAS: 'pagamentos_autorizacao_despesas',
  PAGAMENTOS_ORDENS_FORNECEDOR: 'pagamentos_ordens_fornecedor',
  PAGAMENTOS_ORDENS_INTERNA: 'pagamentos_ordens_interna',
  PAGAMENTOS_SUBMETIDO_BANCO: 'pagamentos_submetido_banco',
  PAGAMENTOS_PAGOS: 'pagamentos_pagos',
  // Passos do fluxo da factura (accao "approve" = pode executar o passo):
  //   Aprovar-DSG (validar) | Autorizar Despesas (autorizar/rejeitar) |
  //   Pagamento (gerar Ordem de Pagamento, submeter ao banco, marcar pago).
  PAGAMENTOS_ACCAO_APROVAR_DSG: 'pagamentos_accao_aprovar_dsg',
  PAGAMENTOS_ACCAO_AUTORIZAR: 'pagamentos_accao_autorizar',
  PAGAMENTOS_ACCAO_PAGAR: 'pagamentos_accao_pagar',
} as const;

/** Modulo de permissao exigido para cada mudanca de estado da factura. */
export const PASSO_DA_FACTURA: Record<string, string[]> = {
  validado: [MODULES.PAGAMENTOS_ACCAO_APROVAR_DSG],
  aprovado: [MODULES.PAGAMENTOS_ACCAO_AUTORIZAR],
  rejeitado: [MODULES.PAGAMENTOS_ACCAO_AUTORIZAR, MODULES.PAGAMENTOS_ACCAO_APROVAR_DSG],
  submetido_ao_banco: [MODULES.PAGAMENTOS_ACCAO_PAGAR],
  pago: [MODULES.PAGAMENTOS_ACCAO_PAGAR],
};

/** Separadores da Gestao de Pagamento + Mapa de Impostos (modulos so de visualizacao). */
export const MODULOS_SEPARADORES_PAGAMENTO = [
  MODULES.PAGAMENTOS_DASHBOARD,
  MODULES.PAGAMENTOS_TODAS,
  MODULES.PAGAMENTOS_PENDENTES,
  MODULES.PAGAMENTOS_APROVADOS_DSG,
  MODULES.PAGAMENTOS_AUTORIZACAO_DESPESAS,
  MODULES.PAGAMENTOS_ORDENS_FORNECEDOR,
  MODULES.PAGAMENTOS_ORDENS_INTERNA,
  MODULES.PAGAMENTOS_SUBMETIDO_BANCO,
  MODULES.PAGAMENTOS_PAGOS,
  MODULES.TAX_MAP,
];

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  READ_ALL: 'read_all',
  READ_OWN: 'read_own',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  SCHEDULE: 'schedule',
  CANCEL: 'cancel',
  EXPORT: 'export',
  IMPORT: 'import',
  MANAGE: 'manage',
  // Editar/anular e eliminar apenas os PROPRIOS registos, e so enquanto
  // ninguem actuou sobre eles (ver utils/proprio-sem-accao.ts).
  UPDATE_OWN: 'update_own',
  DELETE_OWN: 'delete_own',
} as const;

/**
 * Fonte de permissoes: tabela RolePermission, editavel em runtime pelo
 * Administrador do Sistema (ver server/src/routes/roles.routes.ts).
 * Substitui o antigo switch hardcoded por role.
 */
export async function getUserPermissions(
  role: SystemRole,
  department?: string,
  position?: string,
  profiles?: string[]
): Promise<UserPermissions> {
  const roleRecord = await prisma.role.findUnique({
    where: { slug: role },
    include: { permissoes: true },
  });

  const grouped = new Map<string, Set<string>>();
  for (const perm of roleRecord?.permissoes || []) {
    if (!grouped.has(perm.module)) grouped.set(perm.module, new Set());
    grouped.get(perm.module)!.add(perm.action);
  }

  const permissions: Permission[] = Array.from(grouped.entries()).map(([module, actions]) => ({
    module,
    actions: Array.from(actions),
  }));

  return {
    role,
    department,
    position,
    profiles,
    permissions,
  };
}

export function hasPermission(
  userPermissions: UserPermissions,
  module: string,
  action: string
): boolean {
  const modulePermission = userPermissions.permissions.find(p => p.module === module);
  if (!modulePermission) return false;

  return modulePermission.actions.includes(action);
}

export function getModulePermissions(
  userPermissions: UserPermissions,
  module: string
): string[] {
  const modulePermission = userPermissions.permissions.find(p => p.module === module);
  return modulePermission?.actions || [];
}

export function getAccessibleModules(userPermissions: UserPermissions): string[] {
  return userPermissions.permissions.map(p => p.module);
}
