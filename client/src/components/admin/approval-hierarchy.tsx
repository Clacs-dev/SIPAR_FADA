/**
 * SISTEMA DE HIERARQUIA DE APROVAÇÃO
 * 
 * Define fluxos de aprovação baseados em departamentos e valores
 */

export interface ApprovalLevel {
  level: number;
  name: string;
  description: string;
  requiredRole: string[];
  requiredDepartments?: string[];
  requiredPosition?: string[];
  maxApprovalValue?: number; // Valor máximo que pode aprovar
}

export interface ApprovalFlow {
  id: string;
  name: string;
  description: string;
  module: string; // 'facturas', 'oficios', 'actas', etc.
  levels: ApprovalLevel[];
  requiresAllLevels: boolean; // Se true, precisa passar por todos os níveis
}

/**
 * FLUXOS DE APROVAÇÃO POR MÓDULO
 */
export const APPROVAL_FLOWS: ApprovalFlow[] = [
  // =====================================================
  // FACTURAS
  // =====================================================
  {
    id: 'facturas_standard',
    name: 'Fluxo Padrão de Facturas',
    description: 'Aprovação em 3 níveis: Validação Financeira → Aprovação Gerencial → Pagamento',
    module: 'facturas',
    requiresAllLevels: true,
    levels: [
      {
        level: 1,
        name: 'Validação Financeira',
        description: 'Verificação de valores, documentação e conformidade',
        requiredRole: ['admin', 'attendant'],
        requiredDepartments: ['financeiro'],
        maxApprovalValue: undefined // Pode validar qualquer valor
      },
      {
        level: 2,
        name: 'Aprovação Gerencial',
        description: 'Aprovação de pagamento por gerente ou administrador',
        requiredRole: ['admin'],
        requiredDepartments: ['financeiro', 'gabinete_pca', 'gabinete_pce', 'gabinete_director'],
        requiredPosition: ['Gerente', 'Director', 'Administrador'],
        maxApprovalValue: 10000000 // Até 10M AOA
      },
      {
        level: 3,
        name: 'Aprovação Executiva',
        description: 'Aprovação de alto valor por executivos',
        requiredRole: ['admin'],
        requiredDepartments: ['gabinete_pca', 'gabinete_pce'],
        requiredPosition: ['PCA', 'PCE', 'Presidente'],
        maxApprovalValue: undefined // Sem limite
      }
    ]
  },
  {
    id: 'facturas_express',
    name: 'Fluxo Expresso de Facturas',
    description: 'Aprovação simplificada para valores baixos',
    module: 'facturas',
    requiresAllLevels: false,
    levels: [
      {
        level: 1,
        name: 'Aprovação Direta',
        description: 'Aprovação direta pelo financeiro para valores até 500k AOA',
        requiredRole: ['admin', 'attendant'],
        requiredDepartments: ['financeiro'],
        maxApprovalValue: 500000
      }
    ]
  },

  // =====================================================
  // OFÍCIOS
  // =====================================================
  {
    id: 'oficios_standard',
    name: 'Fluxo Padrão de Ofícios',
    description: 'Aprovação em 2 níveis: Revisão → Assinatura',
    module: 'oficios',
    requiresAllLevels: true,
    levels: [
      {
        level: 1,
        name: 'Revisão e Validação',
        description: 'Revisão de conteúdo e formatação',
        requiredRole: ['admin', 'attendant'],
        requiredDepartments: ['juridico', 'administracao', 'administrativo'],
      },
      {
        level: 2,
        name: 'Assinatura Executiva',
        description: 'Assinatura por autoridade competente',
        requiredRole: ['admin'],
        requiredDepartments: [
          'gabinete_pca',
          'gabinete_pce',
          'gabinete_director',
          'gabinete_ministro',
          'gabinete_administrador'
        ],
      }
    ]
  },

  // =====================================================
  // ACTAS
  // =====================================================
  {
    id: 'actas_standard',
    name: 'Fluxo Padrão de Actas',
    description: 'Aprovação em 2 níveis: Redação → Aprovação',
    module: 'actas',
    requiresAllLevels: true,
    levels: [
      {
        level: 1,
        name: 'Redação e Revisão',
        description: 'Elaboração e revisão da acta',
        requiredRole: ['admin', 'attendant'],
      },
      {
        level: 2,
        name: 'Aprovação e Arquivo',
        description: 'Aprovação final e arquivo oficial',
        requiredRole: ['admin'],
        requiredPosition: ['Gerente', 'Director', 'Administrador'],
      }
    ]
  },

  // =====================================================
  // REQUISIÇÕES
  // =====================================================
  {
    id: 'requisicoes_standard',
    name: 'Fluxo de Requisições',
    description: 'Aprovação departamental → Financeiro → Executivo',
    module: 'requisicoes',
    requiresAllLevels: true,
    levels: [
      {
        level: 1,
        name: 'Aprovação Departamental',
        description: 'Aprovação pelo responsável do departamento',
        requiredRole: ['admin', 'attendant'],
        maxApprovalValue: 100000
      },
      {
        level: 2,
        name: 'Aprovação Financeira',
        description: 'Verificação de disponibilidade orçamental',
        requiredRole: ['admin', 'attendant'],
        requiredDepartments: ['financeiro'],
        maxApprovalValue: 1000000
      },
      {
        level: 3,
        name: 'Aprovação Executiva',
        description: 'Aprovação final para valores altos',
        requiredRole: ['admin'],
        requiredDepartments: ['gabinete_pca', 'gabinete_pce', 'gabinete_director'],
        maxApprovalValue: undefined
      }
    ]
  }
];

/**
 * FUNÇÕES AUXILIARES
 */

/**
 * Obter fluxo de aprovação por módulo
 */
export function getApprovalFlow(module: string, value?: number): ApprovalFlow | null {
  const flows = APPROVAL_FLOWS.filter(f => f.module === module);
  
  if (!flows.length) return null;
  
  // Se for factura com valor baixo, usar fluxo expresso
  if (module === 'facturas' && value && value <= 500000) {
    return flows.find(f => f.id === 'facturas_express') || flows[0];
  }
  
  // Retornar fluxo padrão
  return flows.find(f => f.id.includes('standard')) || flows[0];
}

/**
 * Verificar se utilizador pode aprovar no nível especificado
 */
export function canApproveAtLevel(
  level: ApprovalLevel,
  userRole: string,
  userDepartment?: string,
  userPosition?: string,
  value?: number
): boolean {
  // Verificar role
  if (!level.requiredRole.includes(userRole)) {
    return false;
  }
  
  // Verificar departamento (se especificado)
  if (level.requiredDepartments && level.requiredDepartments.length > 0) {
    if (!userDepartment || !level.requiredDepartments.includes(userDepartment)) {
      return false;
    }
  }
  
  // Verificar posição (se especificada)
  if (level.requiredPosition && level.requiredPosition.length > 0) {
    if (!userPosition) return false;
    const hasRequiredPosition = level.requiredPosition.some(pos => 
      userPosition.toLowerCase().includes(pos.toLowerCase())
    );
    if (!hasRequiredPosition) return false;
  }
  
  // Verificar valor máximo
  if (value !== undefined && level.maxApprovalValue !== undefined) {
    if (value > level.maxApprovalValue) {
      return false;
    }
  }
  
  return true;
}

/**
 * Obter próximo nível de aprovação
 */
export function getNextApprovalLevel(
  flowId: string,
  currentLevel: number
): ApprovalLevel | null {
  const flow = APPROVAL_FLOWS.find(f => f.id === flowId);
  if (!flow) return null;
  
  const nextLevel = flow.levels.find(l => l.level === currentLevel + 1);
  return nextLevel || null;
}

/**
 * Verificar se documento está totalmente aprovado
 */
export function isFullyApproved(
  flowId: string,
  currentLevel: number
): boolean {
  const flow = APPROVAL_FLOWS.find(f => f.id === flowId);
  if (!flow) return false;
  
  const maxLevel = Math.max(...flow.levels.map(l => l.level));
  return currentLevel >= maxLevel;
}

/**
 * Obter todos os aprovadores possíveis para um nível
 */
export function getPossibleApprovers(
  level: ApprovalLevel,
  allUsers: Array<{ 
    id: string; 
    name: string; 
    role: string; 
    department?: string; 
    position?: string 
  }>
): Array<{ id: string; name: string }> {
  return allUsers
    .filter(user => 
      canApproveAtLevel(level, user.role, user.department, user.position)
    )
    .map(user => ({
      id: user.id,
      name: user.name
    }));
}

/**
 * Calcular tempo médio de aprovação por departamento
 */
export function calculateAverageApprovalTime(
  approvals: Array<{
    department: string;
    startDate: Date;
    endDate: Date;
  }>
): Record<string, number> {
  const timesByDept: Record<string, number[]> = {};
  
  approvals.forEach(approval => {
    const time = approval.endDate.getTime() - approval.startDate.getTime();
    const hours = time / (1000 * 60 * 60);
    
    if (!timesByDept[approval.department]) {
      timesByDept[approval.department] = [];
    }
    timesByDept[approval.department].push(hours);
  });
  
  const averages: Record<string, number> = {};
  Object.entries(timesByDept).forEach(([dept, times]) => {
    averages[dept] = times.reduce((a, b) => a + b, 0) / times.length;
  });
  
  return averages;
}

/**
 * Obter fluxo recomendado baseado em contexto
 */
export function getRecommendedFlow(
  module: string,
  value?: number,
  department?: string,
  urgency?: 'baixa' | 'media' | 'alta'
): ApprovalFlow | null {
  const flows = APPROVAL_FLOWS.filter(f => f.module === module);
  
  if (!flows.length) return null;
  
  // Lógica de recomendação
  if (module === 'facturas') {
    // Facturas de baixo valor ou urgência alta = fluxo expresso
    if ((value && value <= 500000) || urgency === 'alta') {
      return flows.find(f => f.id === 'facturas_express') || flows[0];
    }
    // Facturas normais = fluxo padrão
    return flows.find(f => f.id === 'facturas_standard') || flows[0];
  }
  
  // Para outros módulos, retornar fluxo padrão
  return flows.find(f => f.id.includes('standard')) || flows[0];
}

/**
 * Validar fluxo de aprovação
 */
export function validateApprovalFlow(
  flowId: string,
  approvals: Array<{
    level: number;
    approver: string;
    approvedAt: Date;
  }>
): { valid: boolean; errors: string[] } {
  const flow = APPROVAL_FLOWS.find(f => f.id === flowId);
  if (!flow) {
    return { valid: false, errors: ['Fluxo de aprovação não encontrado'] };
  }
  
  const errors: string[] = [];
  
  // Verificar se todos os níveis obrigatórios foram aprovados
  if (flow.requiresAllLevels) {
    flow.levels.forEach(level => {
      const approval = approvals.find(a => a.level === level.level);
      if (!approval) {
        errors.push(`Falta aprovação do nível ${level.level}: ${level.name}`);
      }
    });
  }
  
  // Verificar ordem de aprovações
  const sortedApprovals = [...approvals].sort((a, b) => a.level - b.level);
  sortedApprovals.forEach((approval, index) => {
    if (index > 0 && approval.level <= sortedApprovals[index - 1].level) {
      errors.push('Aprovações fora da ordem hierárquica');
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
