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
} as const;

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
