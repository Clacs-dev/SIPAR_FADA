import { UserRole } from './auth-context';

// Tipos de perfil estendidos baseados em department/position
export type ExtendedProfile =
  | 'admin-tecnico'     // Administrador do Sistema (role admin_sistema - exclusivo tecnico)
  | 'admin-sistema'      // Executivos/Gabinetes (modulos de negocio)
  | 'gerente'           // Gerente (aprova/decide)
  | 'atendente'         // Atendente/Secretária
  | 'financeiro'        // Responsável Financeiro
  | 'operador'          // Operador (operacional)
  | 'dsg-tecnico'       // DSG Técnico: submete em nome dos fornecedores
  | 'user';             // Utilizador Externo

export const PERMISSIONS = {
  // Dashboard - todos podem ver
  VIEW_DASHBOARD: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'financeiro', 'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao', 'operacoes', 'operacional_frota',
    'administracao', 'administrativo', 'comunicacao_imagem', 'seguranca', 'secretaria', 'externo',
    'planeamento', 'organizacao_qualidade', 'compliance', 'risco'
  ] as UserRole[],
  
  // Cartas de apresentação - Externos criam, internos gerenciam
  CREATE_PRESENTATION: ['externo'] as UserRole[],
  VIEW_ALL_PRESENTATIONS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'administracao', 'secretaria'
  ] as UserRole[],
  MANAGE_PRESENTATIONS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'administracao', 'secretaria'
  ] as UserRole[],
  
  // Pedidos de audiência - Externos criam, internos gerenciam
  CREATE_AUDIENCE: ['externo'] as UserRole[],
  VIEW_ALL_AUDIENCES: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'administracao', 'secretaria'
  ] as UserRole[],
  MANAGE_AUDIENCES: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'administracao', 'secretaria'
  ] as UserRole[],
  
  // Gerenciar Solicitações
  MANAGE_REQUESTS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'administracao', 'secretaria'
  ] as UserRole[],
  VIEW_OWN_REQUESTS: ['externo'] as UserRole[],
  VIEW_OWN_HISTORY: ['externo'] as UserRole[],
  
  // Agenda - cada utilizador ve a sua propria agenda (reunioes internas e
  // solicitacoes/audiencias agendadas para si), por isso e visivel a todos.
  VIEW_SCHEDULE: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'financeiro', 'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao', 'operacoes', 'operacional_frota',
    'administracao', 'administrativo', 'comunicacao_imagem', 'seguranca', 'secretaria', 'externo',
    'planeamento', 'organizacao_qualidade', 'compliance', 'risco'
  ] as UserRole[],
  MANAGE_SCHEDULE: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'administracao', 'secretaria'
  ] as UserRole[],
  
  // Reuniões Internas
  MANAGE_INTERNAL_MEETINGS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'administracao', 'secretaria'
  ] as UserRole[],

  // Salas de Reunião
  MANAGE_MEETING_ROOMS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'administracao', 'secretaria'
  ] as UserRole[],

  // Actas
  VIEW_ACTAS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'administracao', 'secretaria', 'juridico'
  ] as UserRole[],
  CREATE_ACTAS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'administracao', 'secretaria'
  ] as UserRole[],
  MANAGE_ACTAS: ['gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gestao'] as UserRole[],
  DRAFT_ACTAS: ['secretaria', 'administrativo'] as UserRole[],
  
  // Ofícios
  VIEW_OFICIOS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'administracao', 'secretaria', 'juridico'
  ] as UserRole[],
  CREATE_OFICIOS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'administracao', 'secretaria'
  ] as UserRole[],
  MANAGE_OFICIOS: ['gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gestao'] as UserRole[],
  
  // Facturas (Financeiro + Compras)
  VIEW_FACTURAS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'financeiro', 'compras', 'administracao', 'externo', 'dsg_tecnico'
  ] as UserRole[],
  CREATE_FACTURAS: ['financeiro', 'compras', 'administracao', 'dsg_tecnico'] as UserRole[],
  MANAGE_FACTURAS: ['gabinete_pca', 'gabinete_pce', 'financeiro', 'compras', 'gestao'] as UserRole[],
  APPROVE_FACTURAS: ['gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gestao'] as UserRole[],
  
  // Relatórios Financeiros
  VIEW_FINANCIAL_REPORTS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'financeiro'
  ] as UserRole[],
  CREATE_FINANCIAL_REPORTS: ['financeiro', 'gestao'] as UserRole[],
  
  // Mensagens - todos
  VIEW_MESSAGES: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'financeiro', 'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao', 'operacoes', 'operacional_frota',
    'administracao', 'administrativo', 'comunicacao_imagem', 'seguranca', 'secretaria', 'externo',
    'planeamento', 'organizacao_qualidade', 'compliance', 'risco'
  ] as UserRole[],
  SEND_MESSAGES: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'financeiro', 'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao', 'operacoes', 'operacional_frota',
    'administracao', 'administrativo', 'comunicacao_imagem', 'seguranca', 'secretaria', 'externo',
    'planeamento', 'organizacao_qualidade', 'compliance', 'risco'
  ] as UserRole[],
  
  // Notificações - todos
  VIEW_NOTIFICATIONS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'financeiro', 'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao', 'operacoes', 'operacional_frota',
    'administracao', 'administrativo', 'comunicacao_imagem', 'seguranca', 'secretaria', 'externo',
    'planeamento', 'organizacao_qualidade', 'compliance', 'risco'
  ] as UserRole[],
  
  // Gestão de Utilizadores (exclusivo do Administrador do Sistema)
  MANAGE_USERS: ['admin_sistema'] as UserRole[],

  // Configurações Técnicas (exclusivo do Administrador do Sistema)
  MANAGE_SETTINGS: ['admin_sistema'] as UserRole[],

  // Auditoria (exclusivo do Administrador do Sistema)
  VIEW_AUDIT: ['admin_sistema'] as UserRole[],

  // Base de Dados (exclusivo do Administrador do Sistema)
  MANAGE_DATABASE: ['admin_sistema'] as UserRole[],

  // Dashboard/Relatórios Departamentais (supervisão de negócio - executivos + Administrador do Sistema)
  VIEW_DEPARTMENT_REPORTS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'admin_sistema'
  ] as UserRole[],

  // Relatórios Gerais
  VIEW_REPORTS: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'planeamento', 'organizacao_qualidade'
  ] as UserRole[],
} as const;

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole);
}

/**
 * Determina o perfil estendido baseado no role (departamento)
 * NOVO SISTEMA: role = department
 */
export function getExtendedProfile(
  role: UserRole, 
  department?: string, 
  position?: string
): ExtendedProfile {
  // Administrador do Sistema (role tecnico dedicado, separado dos executivos)
  if (role === 'admin_sistema') {
    return 'admin-tecnico';
  }

  // DSG Técnico: perfil próprio (Procurement + Gestão de Pagamento em nome dos fornecedores)
  if (role === 'dsg_tecnico') {
    return 'dsg-tecnico';
  }

  // Gabinetes Executivos e Governamentais → admin-sistema
  if ([
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2'
  ].includes(role)) {
    return 'admin-sistema';
  }
  
  // Gestão → gerente
  if (role === 'gestao') {
    return 'gerente';
  }
  
  // Financeiro → financeiro
  if (role === 'financeiro') {
    return 'financeiro';
  }
  
  // Operacionais (exceto financeiro) → operador
  if ([
    'recursos_humanos', 'juridico', 'compras', 'tecnologia_informacao', 
    'operacoes', 'operacional_frota'
  ].includes(role)) {
    return 'operador';
  }
  
  // Apoio (exceto externo) → atendente
  if ([
    'administracao', 'administrativo', 'comunicacao_imagem', 
    'seguranca', 'secretaria'
  ].includes(role)) {
    return 'atendente';
  }
  
  // Estratégicos → gerente
  if ([
    'planeamento', 'organizacao_qualidade', 'compliance', 'risco'
  ].includes(role)) {
    return 'gerente';
  }
  
  // Externo → user
  if (role === 'externo') {
    return 'user';
  }
  
  // Fallback
  return 'user';
}

/**
 * Obtém os itens do menu baseado no perfil estendido
 */
export function getMenuItems(
  userRole: UserRole, 
  department?: string, 
  position?: string
) {
  const profile = getExtendedProfile(userRole, department, position);
  
  // DEBUG: Log para diagnóstico
 console.log(' getMenuItems DEBUG:', {
    userRole,
    department,
    position,
    calculatedProfile: profile
  });
  
  // ==========================================
  // FORNECEDOR (EXTERNO - PORTAL DE COTAÇÕES)
  // ==========================================
  // Verificar se é fornecedor logado
  if (typeof window !== 'undefined') {
    const fornecedorAuth = localStorage.getItem('fornecedor_auth');
    if (fornecedorAuth) {
 console.log(' Usuário detectado como FORNECEDOR - Menu restrito');
      return [
        {
          id: 'compras',
          label: 'Portal de Cotações',
          icon: 'ShoppingBag',
          show: true
        }
      ];
    }
  }
  
  // ==========================================
  // UTILIZADOR EXTERNO
  // ==========================================
  if (profile === 'user') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        show: true
      },
      {
        id: 'presentations',
        label: 'Nova Carta de Apresentação',
        icon: 'FileText',
        show: true
      },
      {
        id: 'audiences',
        label: 'Nova Audiência',
        icon: 'Users',
        show: true
      },
      {
        id: 'my-requests',
        label: 'Minhas Solicitações',
        icon: 'Clock',
        show: true
      },
      {
        id: 'schedule',
        label: 'Agenda',
        icon: 'Calendar',
        show: true
      },
      {
        id: 'minhas-facturas',
        label: 'Minhas Facturas',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'cotacoes',
        label: 'Cotações',
        icon: 'ShoppingBag',
        show: true
      },
      {
        id: 'messages',
        label: 'Mensagens',
        icon: 'MessageSquare',
        show: true
      },
      {
        id: 'push-notifications',
        label: 'Notificações Push',
        icon: 'Bell',
        show: true
      }
    ];
  }
  
  // ==========================================
  // GERENTE
  // ==========================================
  if (profile === 'gerente') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        show: true
      },
      {
        id: 'history',
        label: 'Gestão de Solicitações',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'schedule',
        label: 'Agenda',
        icon: 'Calendar',
        show: true
      },
      {
        id: 'actas',
        label: 'Livro de Actas',
        icon: 'FileCheck',
        show: true
      },
      {
        id: 'comunicacoes',
        label: 'Comunicação Interna',
        icon: 'Send',
        show: true
      },
      {
        id: 'compras',
        label: 'Procurement(DSG)',
        icon: 'ShoppingBag',
        show: true
      },
      {
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'mapa-impostos',
        label: 'Mapa de Impostos',
        icon: 'FileBarChart',
        show: true
      },
      {
        id: 'mapa-actividades',
        label: 'Mapa de Actividades',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'messages',
        label: 'Mensagens',
        icon: 'MessageSquare',
        show: true
      },
      {
        id: 'push-notifications',
        label: 'Notificações Push',
        icon: 'Bell',
        show: true
      }
    ];
  }
  
  // ==========================================
  // FINANCEIRO
  // ==========================================
  if (profile === 'financeiro') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        show: true
      },
      {
        id: 'schedule',
        label: 'Agenda',
        icon: 'Calendar',
        show: true
      },
      {
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'mapa-impostos',
        label: 'Mapa de Impostos',
        icon: 'FileBarChart',
        show: true
      },
      {
        id: 'mapa-actividades',
        label: 'Mapa de Actividades',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'messages',
        label: 'Mensagens',
        icon: 'MessageSquare',
        show: true
      },
      {
        id: 'push-notifications',
        label: 'Notificações Push',
        icon: 'Bell',
        show: true
      }
    ];
  }

  // ==========================================
  // OPERADOR
  // ==========================================
  if (profile === 'operador') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        show: true
      },
      {
        id: 'history',
        label: 'Gestão de Solicitações',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'schedule',
        label: 'Agenda',
        icon: 'Calendar',
        show: true
      },
      {
        id: 'actas',
        label: 'Livro de Actas',
        icon: 'FileCheck',
        show: true
      },
      {
        id: 'comunicacoes',
        label: 'Comunicação Interna',
        icon: 'Send',
        show: true
      },
      {
        id: 'compras',
        label: 'Procurement(DSG)',
        icon: 'ShoppingBag',
        show: true
      },
      {
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'mapa-impostos',
        label: 'Mapa de Impostos',
        icon: 'FileBarChart',
        show: true
      },
      {
        id: 'mapa-actividades',
        label: 'Mapa de Actividades',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'messages',
        label: 'Mensagens',
        icon: 'MessageSquare',
        show: true
      },
      {
        id: 'push-notifications',
        label: 'Notificações Push',
        icon: 'Bell',
        show: true
      }
    ];
  }

  // ==========================================
  // ATENDENTE/SECRETÁRIA
  // ==========================================
  if (profile === 'atendente') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        show: true
      },
      {
        id: 'history',
        label: 'Gestão de Solicitações',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'schedule',
        label: 'Agenda',
        icon: 'Calendar',
        show: true
      },
      {
        id: 'internal-meetings',
        label: 'Reuniões Internas',
        icon: 'Users',
        show: true
      },
      {
        id: 'meeting-rooms',
        label: 'Salas de Reunião',
        icon: 'DoorOpen',
        show: true
      },
      {
        id: 'messages',
        label: 'Mensagens',
        icon: 'MessageSquare',
        show: true
      },
      {
        id: 'push-notifications',
        label: 'Notificações Push',
        icon: 'Bell',
        show: true
      }
    ];
  }
  
  // ==========================================
  // ADMINISTRADOR DO SISTEMA
  // ==========================================
  if (profile === 'admin-sistema') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        show: true
      },
      {
        id: 'history',
        label: 'Gestão de Solicitações',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'schedule',
        label: 'Agenda',
        icon: 'Calendar',
        show: true
      },
      {
        id: 'internal-meetings',
        label: 'Reuniões Internas',
        icon: 'Users',
        show: true
      },
      {
        id: 'meeting-rooms',
        label: 'Salas de Reunião',
        icon: 'DoorOpen',
        show: true
      },
      {
        id: 'actas',
        label: 'Livro de Actas',
        icon: 'FileCheck',
        show: true
      },
      {
        id: 'comunicacoes',
        label: 'Comunicação Interna',
        icon: 'Send',
        show: true
      },
      {
        id: 'compras',
        label: 'Procurement(DSG)',
        icon: 'ShoppingBag',
        show: true
      },
      {
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'mapa-impostos',
        label: 'Mapa de Impostos',
        icon: 'FileBarChart',
        show: true
      },
      {
        id: 'mapa-actividades',
        label: 'Mapa de Actividades',
        icon: 'ClipboardList',
        show: true
      },
      {
        id: 'messages',
        label: 'Mensagens',
        icon: 'MessageSquare',
        show: true
      },
      {
        id: 'push-notifications',
        label: 'Notificações Push',
        icon: 'Bell',
        show: true
      },
      {
        id: 'department-dashboard',
        label: 'Dashboard Departamental',
        icon: 'TrendingUp',
        show: true
      },
      {
        id: 'department-reports',
        label: 'Relatórios Departamentais',
        icon: 'FileText',
        show: true
      }
    ];
  }

  // ==========================================
  // ADMINISTRADOR DO SISTEMA (role tecnico admin_sistema)
  // ==========================================
  // ==========================================
  // DSG TÉCNICO
  // ==========================================
  // Mesmos ecrãs de Compras e Gestão de Pagamento; o que cada um mostra (e
  // os itens abaixo) depende das permissões do role definidas pelo
  // Administrador do Sistema - ver filterMenuItemsByPermissions.
  if (profile === 'dsg-tecnico') {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'Home', show: true },
      { id: 'schedule', label: 'Agenda', icon: 'Calendar', show: true },
      { id: 'compras', label: 'Procurement(DSG)', icon: 'ShoppingBag', show: true },
      { id: 'facturas', label: 'Gestão de Pagamento', icon: 'Receipt', show: true },
      { id: 'mapa-impostos', label: 'Mapa de Impostos', icon: 'FileBarChart', show: true },
      { id: 'mapa-actividades', label: 'Mapa de Actividades', icon: 'ClipboardList', show: true },
      { id: 'messages', label: 'Mensagens', icon: 'MessageSquare', show: true },
      { id: 'push-notifications', label: 'Notificações Push', icon: 'Bell', show: true },
    ];
  }

  if (profile === 'admin-tecnico') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        show: true
      },
      {
        id: 'schedule',
        label: 'Agenda',
        icon: 'Calendar',
        show: true
      },
      {
        id: 'users',
        label: 'Utilizadores',
        icon: 'Users',
        show: true
      },
      {
        id: 'email-management',
        label: 'Gerenciamento Email',
        icon: 'Mail',
        show: true
      },
      {
        id: 'audit-dashboard',
        label: 'Auditoria & Segurança',
        icon: 'Shield',
        show: true
      },
      {
        id: 'departments-admin',
        label: 'Gestão de Departamentos',
        icon: 'Building',
        show: true
      },
      {
        id: 'areas-admin',
        label: 'Gestão de Áreas',
        icon: 'Layers',
        show: true
      },
      {
        id: 'roles-permissions-admin',
        label: 'Roles e Permissões',
        icon: 'KeyRound',
        show: true
      },
      {
        id: 'system-diagnostics',
        label: 'Diagnóstico do Sistema',
        icon: 'Activity',
        show: true
      },
      {
        id: 'license-management',
        label: 'Gestão de Licença',
        icon: 'FileKey',
        show: true
      },
      {
        id: 'trash',
        label: 'Lixeira',
        icon: 'Trash2',
        show: true
      },
      {
        id: 'database-management',
        label: 'Gestão do Banco de Dados',
        icon: 'Database',
        show: true
      },
      {
        id: 'department-dashboard',
        label: 'Dashboard Departamental',
        icon: 'TrendingUp',
        show: true
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: 'Settings',
        show: true
      },
      {
        id: 'messages',
        label: 'Mensagens',
        icon: 'MessageSquare',
        show: true
      },
      {
        id: 'push-notifications',
        label: 'Notificações Push',
        icon: 'Bell',
        show: true
      }
    ];
  }

  // Fallback
  return [];
}

// Permissao RBAC (Roles e Permissoes, gerida pelo Administrador do Sistema)
// necessaria para cada item de menu dos modulos financeiros: basta UMA das
// accoes listadas. Sem ela o item nao aparece na interface. Itens sem
// entrada aqui continuam a depender so do perfil (getMenuItems).
export const MENU_ITEM_PERMISSION: Record<string, { module: string; actions: string[] }[]> = {
  // (invoices:create cobre o antigo portal de cotacoes do fornecedor, que usa o id "compras")
  compras: [{ module: 'finance', actions: ['read_all', 'create'] }, { module: 'invoices', actions: ['create'] }],
  cotacoes: [{ module: 'finance', actions: ['create'] }, { module: 'invoices', actions: ['create'] }],
  facturas: [{ module: 'invoices', actions: ['read_all', 'read_own'] }],
  'minhas-facturas': [{ module: 'invoices', actions: ['create', 'read_own'] }],
  'mapa-impostos': [{ module: 'invoices', actions: ['read_all'] }],
  'mapa-actividades': [{ module: 'activity_map', actions: ['read_all'] }],
};

/**
 * Esconde os itens cujo role nao tem a permissao RBAC correspondente. Enquanto
 * as permissoes ainda carregam (null), os itens condicionados ficam escondidos
 * - evita mostrar por um instante algo a que o utilizador nao tem acesso.
 */
export function filterMenuItemsByPermissions<T extends { id: string }>(
  items: T[],
  permissoes: { module: string; actions: string[] }[] | null | undefined
): T[] {
  return items.filter((item) => {
    const requisitos = MENU_ITEM_PERMISSION[item.id];
    if (!requisitos) return true;
    if (!permissoes) return false;
    return requisitos.some((r) => {
      const mod = permissoes.find((p) => p.module === r.module);
      return !!mod && r.actions.some((a) => mod.actions.includes(a));
    });
  });
}

// Chave do modulo de licenca (ver requireLicenseModule(...) em cada rota do
// backend, e o mapeamento em config.permissionModule de modules.routes.ts)
// correspondente a cada item do menu - usado para esconder do sidebar
// modulos que a licenca actual desta instalacao nao inclui. Um item de menu
// sem entrada aqui (dashboard, agenda, gestao de licenca, diagnostico do
// sistema, etc.) nunca e escondido por licenca, so por RBAC.
const MENU_ITEM_LICENSE_MODULE: Record<string, string | string[]> = {
  presentations: 'presentations',
  audiences: 'audiences',
  // "Gestão de Solicitações" e "Minhas Solicitações" tratam Cartas de
  // Apresentação E Pedidos de Audiência - mostra-se se pelo menos um dos
  // dois estiver incluido na licenca.
  history: ['presentations', 'audiences'],
  'my-requests': ['presentations', 'audiences'],
  actas: 'actas',
  comunicacoes: 'communications',
  compras: 'finance',
  cotacoes: 'finance',
  facturas: 'invoices',
  'minhas-facturas': 'invoices',
  // Mapa de Impostos cruza dados de Facturas e Compras - visível se qualquer um dos dois estiver licenciado.
  'mapa-impostos': ['invoices', 'finance'],
  // Mapa de Actividades (DSG) - tambem cruza Facturas e Compras.
  'mapa-actividades': ['invoices', 'finance'],
  'internal-meetings': 'internal_meetings',
  'meeting-rooms': 'internal_meetings',
  messages: 'messages',
  users: 'users',
  'roles-permissions-admin': 'roles',
  'departments-admin': 'departments',
  'areas-admin': 'departments',
  'audit-dashboard': 'audit',
  'email-management': 'email',
  settings: 'settings',
  trash: 'settings',
  'push-notifications': 'notifications',
};

/**
 * Filtra os itens de menu (ja resolvidos por RBAC via getMenuItems) pelos
 * modulos incluidos na licenca activa desta instalacao - mesma semantica de
 * LicenseService.moduleIncluded no backend: sem licenca activada ainda, ou
 * lista de modulos vazia (licenca "cheia"), nao esconde nada.
 */
export function filterMenuItemsByLicense<T extends { id: string }>(
  items: T[],
  licenseModules: string[] | null | undefined
): T[] {
  if (!licenseModules || licenseModules.length === 0) return items;
  return items.filter((item) => {
    const required = MENU_ITEM_LICENSE_MODULE[item.id];
    if (!required) return true;
    const requiredList = Array.isArray(required) ? required : [required];
    return requiredList.some((moduleKey) => licenseModules.includes(moduleKey));
  });
}

/**
 * Obtém o nome do badge para o perfil baseado no departamento (role)
 */
export function getProfileBadge(
  userRole: UserRole,
  department?: string,
  position?: string
): { label: string; color: string } {
  // Debug log
 console.log('getProfileBadge called with:', { userRole, department, position });
  
  // Administrador do Sistema (role tecnico dedicado)
  if (userRole === 'admin_sistema') {
    return { label: 'Administrador do Sistema', color: 'bg-slate-900' };
  }

  // Verificação especial: cargo de Presidente do Conselho de Administração
  if (position === 'Presidente do Conselho de Administração') {
    return { label: 'Presidente do Conselho de Administração', color: 'bg-red-600' };
  }

  // Mapeamento de departamentos para badges
  const departmentBadges: Record<UserRole, { label: string; color: string }> = {
    // Gabinetes Executivos (5) - Vermelho/Laranja
    'gabinete_pca': { label: 'Gabinete PCA', color: 'bg-red-600' },
    'gabinete_pce': { label: 'Gabinete PCE', color: 'bg-red-600' },
    'gabinete_administrador': { label: 'Gabinete Administrador', color: 'bg-red-500' },
    'gabinete_director': { label: 'Gabinete Director', color: 'bg-red-500' },
    'gestao': { label: 'Gestão', color: 'bg-orange-600' },
    
    // Gabinetes Governamentais (5) - Roxo/Indigo
    'gabinete_ministro': { label: 'Gabinete Ministro', color: 'bg-purple-600' },
    'gabinete_secretario_estado_1': { label: 'Gabinete Sec. Estado', color: 'bg-purple-500' },
    'gabinete_secretario_estado_2': { label: 'Gabinete Sec. Estado', color: 'bg-purple-500' },
    'gabinete_vice_governador_1': { label: 'Gabinete Vice-Gov.', color: 'bg-indigo-600' },
    'gabinete_vice_governador_2': { label: 'Gabinete Vice-Gov.', color: 'bg-indigo-600' },
    
    // Operacionais (7) - Verde/Azul
    'financeiro': { label: 'Financeiro', color: 'bg-green-600' },
    'recursos_humanos': { label: 'Recursos Humanos', color: 'bg-teal-600' },
    'juridico': { label: 'Jurídico', color: 'bg-blue-700' },
    'compras': { label: 'Procurement(DSG)', color: 'bg-cyan-600' },
    'tecnologia_informacao': { label: 'Tecnologia', color: 'bg-blue-600' },
    'operacoes': { label: 'Operações', color: 'bg-emerald-600' },
    'operacional_frota': { label: 'Gestão de Frota', color: 'bg-green-700' },
    
    // Apoio (6) - Cinza/Azul claro
    'administracao': { label: 'Administração', color: 'bg-slate-600' },
    'administrativo': { label: 'Administrativo', color: 'bg-slate-500' },
    'comunicacao_imagem': { label: 'Comunicação', color: 'bg-sky-600' },
    'seguranca': { label: 'Segurança', color: 'bg-gray-700' },
    'secretaria': { label: 'Secretaria', color: 'bg-slate-500' },
    'externo': { label: 'Utilizador Externo', color: 'bg-gray-500' },
    
    // Estratégicos (4) - Amarelo/Laranja
    'planeamento': { label: 'Planeamento', color: 'bg-amber-600' },
    'organizacao_qualidade': { label: 'Org. & Qualidade', color: 'bg-yellow-600' },
    'compliance': { label: 'Compliance', color: 'bg-orange-600' },
    'risco': { label: 'Gestão de Risco', color: 'bg-orange-700' },

    'admin_sistema': { label: 'Administrador do Sistema', color: 'bg-slate-900' },
    'dsg_tecnico': { label: 'DSG Técnico', color: 'bg-cyan-700' },
  };
  
  return departmentBadges[userRole] || { label: 'Utilizador', color: 'bg-gray-500' };
}