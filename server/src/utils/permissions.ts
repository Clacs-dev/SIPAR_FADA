export interface Permission {
  module: string;
  actions: string[];
  description: string;
}

export type SystemRole = 
  | 'gabinete_pca'
  | 'gabinete_pce'
  | 'gabinete_administrador'
  | 'gabinete_director'
  | 'gestao'
  | 'gabinete_ministro'
  | 'gabinete_secretario_estado_1'
  | 'gabinete_secretario_estado_2'
  | 'gabinete_vice_governador_1'
  | 'gabinete_vice_governador_2'
  | 'financeiro'
  | 'recursos_humanos'
  | 'juridico'
  | 'compras'
  | 'tecnologia_informacao'
  | 'operacoes'
  | 'operacional_frota'
  | 'administracao'
  | 'administrativo'
  | 'comunicacao_imagem'
  | 'seguranca'
  | 'secretaria'
  | 'externo'
  | 'planeamento'
  | 'organizacao_qualidade'
  | 'compliance'
  | 'risco';

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
  DOCUMENTS: 'documents',
  OFICIOS: 'oficios',
  COMMUNICATIONS: 'communications',
  ACTAS: 'actas',
  USERS: 'users',
  FINANCE: 'finance',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  FLEET: 'fleet',
  VEHICLES: 'vehicles',
  LOGISTICS: 'logistics',
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

const ADMIN_SISTEMA_PERMISSIONS: Permission[] = [
  {
    module: MODULES.PRESENTATIONS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Acesso total a todas as cartas de apresentação'
  },
  {
    module: MODULES.AUDIENCES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Acesso total a todos os pedidos de audiência'
  },
  {
    module: MODULES.REQUESTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.MANAGE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gerenciar todas as solicitações do sistema'
  },
  {
    module: MODULES.SCHEDULE,
    actions: [ACTIONS.READ_ALL, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.CANCEL],
    description: 'Gerenciar agenda completa'
  },
  {
    module: MODULES.INTERNAL_MEETINGS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE],
    description: 'Criar e gerenciar reuniões internas'
  },
  {
    module: MODULES.DOCUMENTS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de documentos'
  },
  {
    module: MODULES.OFICIOS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de ofícios'
  },
  {
    module: MODULES.ACTAS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de actas'
  },
  {
    module: MODULES.COMMUNICATIONS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de comunicações internas'
  },
  {
    module: MODULES.USERS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.MANAGE],
    description: 'Gestão completa de utilizadores'
  },
  {
    module: MODULES.VEHICLES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão completa de viaturas e frotas'
  },
  {
    module: MODULES.FLEET,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão completa de frotas'
  },
  {
    module: MODULES.LOGISTICS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE],
    description: 'Gestão de logística e operações'
  },
  {
    module: MODULES.FINANCE,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão financeira completa'
  },
  {
    module: MODULES.INVOICES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de facturas'
  },
  {
    module: MODULES.MESSAGES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.DELETE],
    description: 'Acesso total às mensagens'
  },
  {
    module: MODULES.NOTIFICATIONS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.DELETE],
    description: 'Gerenciar notificações'
  },
  {
    module: MODULES.EMAIL,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.MANAGE],
    description: 'Gerenciar sistema de email'
  },
  {
    module: MODULES.AUDIT,
    actions: [ACTIONS.READ_ALL, ACTIONS.EXPORT],
    description: 'Acesso à auditoria e logs'
  },
  {
    module: MODULES.DATABASE,
    actions: [ACTIONS.READ_ALL, ACTIONS.MANAGE, ACTIONS.EXPORT, ACTIONS.IMPORT],
    description: 'Gestão do banco de dados'
  },
  {
    module: MODULES.SETTINGS,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Configurações do sistema'
  },
  {
    module: MODULES.REPORTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.CREATE, ACTIONS.EXPORT],
    description: 'Gerar relatórios completos'
  },
  {
    module: MODULES.ANALYTICS,
    actions: [ACTIONS.READ_ALL],
    description: 'Análises e estatísticas globais'
  },
];

const GERENTE_PERMISSIONS: Permission[] = [
  {
    module: MODULES.PRESENTATIONS,
    actions: [ACTIONS.READ_ALL, ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.UPDATE],
    description: 'Aprovar/rejeitar cartas de apresentação'
  },
  {
    module: MODULES.AUDIENCES,
    actions: [ACTIONS.READ_ALL, ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.UPDATE],
    description: 'Aprovar/rejeitar pedidos de audiência'
  },
  {
    module: MODULES.REQUESTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.MANAGE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gerenciar todas as solicitações'
  },
  {
    module: MODULES.SCHEDULE,
    actions: [ACTIONS.READ_ALL, ACTIONS.CREATE, ACTIONS.UPDATE],
    description: 'Gerenciar agenda e agendamentos'
  },
  {
    module: MODULES.INTERNAL_MEETINGS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE],
    description: 'Organizar reuniões internas'
  },
  {
    module: MODULES.DOCUMENTS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de documentos'
  },
  {
    module: MODULES.OFICIOS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de ofícios'
  },
  {
    module: MODULES.ACTAS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de actas'
  },
  {
    module: MODULES.COMMUNICATIONS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão de comunicações internas'
  },
  {
    module: MODULES.MESSAGES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL],
    description: 'Enviar e receber mensagens'
  },
  {
    module: MODULES.NOTIFICATIONS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL],
    description: 'Notificações do sistema'
  },
  {
    module: MODULES.REPORTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.CREATE, ACTIONS.EXPORT],
    description: 'Relatórios gerenciais'
  },
  {
    module: MODULES.ANALYTICS,
    actions: [ACTIONS.READ_ALL],
    description: 'Estatísticas e análises'
  },
  {
    module: MODULES.USERS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar utilizadores'
  },
];

const ATENDENTE_PERMISSIONS: Permission[] = [
  {
    module: MODULES.PRESENTATIONS,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Processar cartas de apresentação'
  },
  {
    module: MODULES.AUDIENCES,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Processar pedidos de audiência'
  },
  {
    module: MODULES.REQUESTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Visualizar e atualizar solicitações'
  },
  {
    module: MODULES.SCHEDULE,
    actions: [ACTIONS.READ_ALL, ACTIONS.CREATE, ACTIONS.UPDATE],
    description: 'Agendar reuniões'
  },
  {
    module: MODULES.INTERNAL_MEETINGS,
    actions: [ACTIONS.READ_ALL],
    description: 'Participar de reuniões internas'
  },
  {
    module: MODULES.DOCUMENTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Visualizar e atualizar documentos'
  },
  {
    module: MODULES.OFICIOS,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Visualizar e atualizar ofícios'
  },
  {
    module: MODULES.ACTAS,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Visualizar e atualizar actas'
  },
  {
    module: MODULES.COMMUNICATIONS,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Visualizar e atualizar comunicações internas'
  },
  {
    module: MODULES.MESSAGES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL],
    description: 'Mensagens com utilizadores'
  },
  {
    module: MODULES.NOTIFICATIONS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL],
    description: 'Notificações'
  },
  {
    module: MODULES.REPORTS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar relatórios'
  },
];

const FINANCEIRO_PERMISSIONS: Permission[] = [
  {
    module: MODULES.PRESENTATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar cartas de apresentação'
  },
  {
    module: MODULES.AUDIENCES,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar pedidos de audiência'
  },
  {
    module: MODULES.FINANCE,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Gestão financeira completa'
  },
  {
    module: MODULES.INVOICES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
    description: 'Gestão de facturas'
  },
  {
    module: MODULES.PAYMENTS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.APPROVE],
    description: 'Gestão de pagamentos'
  },
  {
    module: MODULES.REQUESTS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar solicitações para fins financeiros'
  },
  {
    module: MODULES.INTERNAL_MEETINGS,
    actions: [ACTIONS.READ_ALL],
    description: 'Participar de reuniões financeiras'
  },
  {
    module: MODULES.DOCUMENTS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar documentos'
  },
  {
    module: MODULES.OFICIOS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar ofícios'
  },
  {
    module: MODULES.ACTAS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar actas'
  },
  {
    module: MODULES.COMMUNICATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar comunicações internas'
  },
  {
    module: MODULES.MESSAGES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL],
    description: 'Mensagens'
  },
  {
    module: MODULES.NOTIFICATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Notificações'
  },
  {
    module: MODULES.REPORTS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.EXPORT],
    description: 'Relatórios financeiros'
  },
  {
    module: MODULES.ANALYTICS,
    actions: [ACTIONS.READ_ALL],
    description: 'Análises financeiras'
  },
];

const OPERADOR_PERMISSIONS: Permission[] = [
  {
    module: MODULES.PRESENTATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar cartas (para logística)'
  },
  {
    module: MODULES.AUDIENCES,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar audiências (para logística)'
  },
  {
    module: MODULES.FLEET,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE],
    description: 'Gestão de frota completa'
  },
  {
    module: MODULES.VEHICLES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.DELETE],
    description: 'Gestão de veículos'
  },
  {
    module: MODULES.LOGISTICS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL, ACTIONS.UPDATE],
    description: 'Gestão logística'
  },
  {
    module: MODULES.SCHEDULE,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar agenda para coordenar transporte'
  },
  {
    module: MODULES.REQUESTS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar solicitações para planeamento'
  },
  {
    module: MODULES.INTERNAL_MEETINGS,
    actions: [ACTIONS.READ_ALL],
    description: 'Participar de reuniões operacionais'
  },
  {
    module: MODULES.DOCUMENTS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar documentos'
  },
  {
    module: MODULES.OFICIOS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar ofícios'
  },
  {
    module: MODULES.ACTAS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar actas'
  },
  {
    module: MODULES.COMMUNICATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar comunicações internas'
  },
  {
    module: MODULES.MESSAGES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL],
    description: 'Mensagens'
  },
  {
    module: MODULES.NOTIFICATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Notificações'
  },
  {
    module: MODULES.REPORTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.CREATE],
    description: 'Relatórios de frota e operações'
  },
];

const COMPRAS_PERMISSIONS: Permission[] = [
  {
    module: MODULES.PRESENTATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar cartas de apresentação'
  },
  {
    module: MODULES.AUDIENCES,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar pedidos de audiência'
  },
  {
    module: MODULES.INVOICES,
    actions: [ACTIONS.READ_ALL, ACTIONS.UPDATE, ACTIONS.APPROVE, ACTIONS.REJECT],
    description: 'Aprovar facturas de fornecedores'
  },
  {
    module: MODULES.REQUESTS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar solicitações para fins de compras'
  },
  {
    module: MODULES.INTERNAL_MEETINGS,
    actions: [ACTIONS.READ_ALL],
    description: 'Participar de reuniões de compras'
  },
  {
    module: MODULES.DOCUMENTS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar documentos'
  },
  {
    module: MODULES.OFICIOS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar ofícios'
  },
  {
    module: MODULES.ACTAS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar actas'
  },
  {
    module: MODULES.COMMUNICATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Visualizar comunicações internas'
  },
  {
    module: MODULES.MESSAGES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_ALL],
    description: 'Mensagens'
  },
  {
    module: MODULES.NOTIFICATIONS,
    actions: [ACTIONS.READ_ALL],
    description: 'Notificações'
  },
  {
    module: MODULES.REPORTS,
    actions: [ACTIONS.READ_ALL, ACTIONS.CREATE],
    description: 'Relatórios de compras'
  },
];

const USUARIO_PERMISSIONS: Permission[] = [
  {
    module: MODULES.PRESENTATIONS,
    actions: [ACTIONS.CREATE, ACTIONS.READ_OWN, ACTIONS.UPDATE],
    description: 'Criar e gerenciar suas cartas'
  },
  {
    module: MODULES.AUDIENCES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_OWN, ACTIONS.UPDATE],
    description: 'Criar e gerenciar seus pedidos'
  },
  {
    module: MODULES.INVOICES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_OWN, ACTIONS.UPDATE],
    description: 'Submeter e gerenciar suas facturas'
  },
  {
    module: MODULES.REQUESTS,
    actions: [ACTIONS.READ_OWN],
    description: 'Visualizar suas solicitações'
  },
  {
    module: MODULES.SCHEDULE,
    actions: [ACTIONS.READ_OWN],
    description: 'Ver suas reuniões agendadas'
  },
  {
    module: MODULES.MESSAGES,
    actions: [ACTIONS.CREATE, ACTIONS.READ_OWN],
    description: 'Mensagens com atendentes'
  },
  {
    module: MODULES.NOTIFICATIONS,
    actions: [ACTIONS.READ_OWN],
    description: 'Suas notificações'
  },
];

export function getUserPermissions(
  role: SystemRole,
  department?: string,
  position?: string,
  profiles?: string[]
): UserPermissions {
  let permissions: Permission[] = [];
  
  if (role === 'admin' as SystemRole) {
    permissions = ADMIN_SISTEMA_PERMISSIONS;
  }
  else if (role === 'attendant' as SystemRole) {
    permissions = ATENDENTE_PERMISSIONS;
  }
  else if (role === 'user' as SystemRole) {
    permissions = USUARIO_PERMISSIONS;
  }
  else if ([
    'gabinete_pca',
    'gabinete_pce',
    'gabinete_administrador',
    'gabinete_director',
    'gabinete_ministro',
    'gabinete_secretario_estado_1',
    'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1',
    'gabinete_vice_governador_2',
    'administracao',
    'gestao'
  ].includes(role)) {
    permissions = ADMIN_SISTEMA_PERMISSIONS;
  }
  else if (role === 'secretaria') {
    permissions = ATENDENTE_PERMISSIONS;
  }
  else if (role === 'financeiro') {
    permissions = FINANCEIRO_PERMISSIONS;
  }
  else if ([
    'operacoes',
    'operacional_frota'
  ].includes(role)) {
    permissions = OPERADOR_PERMISSIONS;
  }
  else if (role === 'compras') {
    permissions = COMPRAS_PERMISSIONS;
  }
  else if (role === 'recursos_humanos') {
    permissions = GERENTE_PERMISSIONS;
  }
  else if (role === 'juridico') {
    permissions = GERENTE_PERMISSIONS;
  }
  else if (role === 'tecnologia_informacao') {
    permissions = ADMIN_SISTEMA_PERMISSIONS;
  }
  else if (role === 'administrativo') {
    permissions = ATENDENTE_PERMISSIONS;
  }
  else if (role === 'comunicacao_imagem') {
    permissions = GERENTE_PERMISSIONS;
  }
  else if (role === 'seguranca') {
    permissions = ATENDENTE_PERMISSIONS;
  }
  else if ([
    'planeamento',
    'organizacao_qualidade',
    'compliance',
    'risco'
  ].includes(role)) {
    permissions = GERENTE_PERMISSIONS;
  }
  else if (role === 'externo') {
    permissions = USUARIO_PERMISSIONS;
  }
  else {
    permissions = USUARIO_PERMISSIONS;
  }
  
  return {
    role,
    department,
    position,
    profiles,
    permissions
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
