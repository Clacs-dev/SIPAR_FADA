import { UserRole } from './auth-context';

// Tipos de perfil estendidos baseados em department/position
export type ExtendedProfile = 
  | 'admin-sistema'      // Administrador do Sistema
  | 'gerente'           // Gerente (aprova/decide)
  | 'atendente'         // Atendente/Secretária
  | 'financeiro'        // Responsável Financeiro
  | 'operador'          // Operador (operacional)
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
  
  // Agenda
  VIEW_SCHEDULE: [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'administracao', 'secretaria'
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
    'financeiro', 'compras', 'administracao', 'externo'
  ] as UserRole[],
  CREATE_FACTURAS: ['financeiro', 'compras', 'administracao'] as UserRole[],
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
  
  // Gestão de Utilizadores
  MANAGE_USERS: ['gabinete_pca', 'gabinete_administrador', 'recursos_humanos', 'tecnologia_informacao'] as UserRole[],
  
  // Configurações Técnicas
  MANAGE_SETTINGS: ['gabinete_pca', 'tecnologia_informacao'] as UserRole[],
  
  // Auditoria
  VIEW_AUDIT: ['gabinete_pca', 'gabinete_administrador', 'compliance', 'tecnologia_informacao'] as UserRole[],
  
  // Base de Dados
  MANAGE_DATABASE: ['gabinete_pca', 'tecnologia_informacao'] as UserRole[],
  
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
        id: 'submeter-reclamacao',
        label: 'Submeter Reclamação',
        icon: 'AlertCircle',
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
        id: 'oficios',
        label: 'Gestão de Ofícios',
        icon: 'FileSignature',
        show: true
      },
      {
        id: 'comunicacoes',
        label: 'Comunicação Interna',
        icon: 'Send',
        show: true
      },
      {
        id: 'reclamacoes',
        label: 'Reclamações Operacionais',
        icon: 'AlertCircle',
        show: true
      },
      {
        id: 'contratos',
        label: 'Gestão de Contratos',
        icon: 'FileKey',
        show: true
      },
      {
        id: 'pedidos',
        label: 'Pedido e Helpdesk',
        icon: 'ShoppingCart',
        show: true
      },
      {
        id: 'compras',
        label: 'Procurement',
        icon: 'ShoppingBag',
        show: true
      },
      {
        id: 'planejamento',
        label: 'Planeamento e Gestão',
        icon: 'TrendingUp',
        show: true
      },
      {
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'financial-reports',
        label: 'Relatórios Financeiros',
        icon: 'TrendingUp',
        show: true
      },
      {
        id: 'frotas',
        label: 'Gestão de Frota',
        icon: 'Car',
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
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'financial-reports',
        label: 'Relatórios Financeiros',
        icon: 'TrendingUp',
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
        id: 'oficios',
        label: 'Gestão de Ofícios',
        icon: 'FileSignature',
        show: true
      },
      {
        id: 'comunicacoes',
        label: 'Comunicação Interna',
        icon: 'Send',
        show: true
      },
      {
        id: 'reclamacoes',
        label: 'Reclamações Operacionais',
        icon: 'AlertCircle',
        show: true
      },
      {
        id: 'contratos',
        label: 'Gestão de Contratos',
        icon: 'FileKey',
        show: true
      },
      {
        id: 'pedidos',
        label: 'Pedido e Helpdesk',
        icon: 'ShoppingCart',
        show: true
      },
      {
        id: 'compras',
        label: 'Procurement',
        icon: 'ShoppingBag',
        show: true
      },
      {
        id: 'planejamento',
        label: 'Planeamento e Gestão',
        icon: 'TrendingUp',
        show: true
      },
      {
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'frotas',
        label: 'Gestão de Frota',
        icon: 'Car',
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
        id: 'actas',
        label: 'Livro de Actas',
        icon: 'FileCheck',
        show: true
      },
      {
        id: 'oficios',
        label: 'Gestão de Ofícios',
        icon: 'FileSignature',
        show: true
      },
      {
        id: 'comunicacoes',
        label: 'Comunicação Interna',
        icon: 'Send',
        show: true
      },
      {
        id: 'reclamacoes',
        label: 'Reclamações Operacionais',
        icon: 'AlertCircle',
        show: true
      },
      {
        id: 'contratos',
        label: 'Gestão de Contratos',
        icon: 'FileKey',
        show: true
      },
      {
        id: 'pedidos',
        label: 'Pedido e Helpdesk',
        icon: 'ShoppingCart',
        show: true
      },
      {
        id: 'compras',
        label: 'Procurement',
        icon: 'ShoppingBag',
        show: true
      },
      {
        id: 'planejamento',
        label: 'Planeamento e Gestão',
        icon: 'TrendingUp',
        show: true
      },
      {
        id: 'facturas',
        label: 'Gestão de Pagamento',
        icon: 'Receipt',
        show: true
      },
      {
        id: 'financial-reports',
        label: 'Relatórios Financeiros',
        icon: 'TrendingUp',
        show: true
      },
      {
        id: 'frotas',
        label: 'Gestão de Frota',
        icon: 'Car',
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
        id: 'department-reports',
        label: 'Relatórios Departamentais',
        icon: 'FileText',
        show: true
      },
      {
        id: 'storage-admin',
        label: 'Administração Storage',
        icon: 'Database',
        show: true
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: 'Settings',
        show: true
      }
    ];
  }
  
  // Fallback
  return [];
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
  
  // Verificação especial: Se a posição é PCA, mostrar "Administrador Sistema"
  if (position === 'Presidente do Conselho de Administração' || userRole === 'gabinete_pca') {
 console.log('Matched PCA condition, returning Administrador Sistema');
    return { label: 'Administrador Sistema', color: 'bg-red-600' };
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
    'compras': { label: 'Procurement', color: 'bg-cyan-600' },
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
  };
  
  return departmentBadges[userRole] || { label: 'Utilizador', color: 'bg-gray-500' };
}