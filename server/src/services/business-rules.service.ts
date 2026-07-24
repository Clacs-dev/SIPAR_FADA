export interface TransitionResult {
  allowed: boolean;
  message?: string;
}

interface ModuleRules {
  statuses: string[];
  initialStatus: string;
  terminalStatuses: string[];
  transitions: Record<string, string[]>;
  aliases?: Record<string, string>;
  requiredByStatus?: Record<string, string[]>;
}

const COMMON_REJECTION = ['rejeitado', 'cancelado', 'arquivado'];

const RULES: Record<string, ModuleRules> = {
  pedido: {
    statuses: ['pendente', 'aberto', 'resolvido', 'fechado', 'cancelado'],
    initialStatus: 'pendente',
    terminalStatuses: ['fechado', 'cancelado'],
    transitions: {
      pendente: ['aberto', 'cancelado'],
      aberto: ['resolvido', 'cancelado'],
      resolvido: ['fechado', 'aberto'],
      fechado: [],
      cancelado: [],
    },
    requiredByStatus: {
      pendente: ['titulo', 'descricao', 'importancia'],
      resolvido: ['solucao'],
    },
  },
  factura: {
    statuses: ['pendente', 'validado', 'aprovado', 'rejeitado', 'pago', 'submetido_banco', 'cancelado', 'arquivado'],
    initialStatus: 'pendente',
    terminalStatuses: ['pago', 'rejeitado', 'cancelado', 'arquivado'],
    aliases: {
      validate: 'validado',
      validada: 'validado',
      pay: 'pago',
      paid: 'pago',
    },
    transitions: {
      pendente: ['validado', 'aprovado', 'rejeitado', 'cancelado', 'arquivado'],
      validado: ['aprovado', 'rejeitado', 'cancelado', 'arquivado'],
      aprovado: ['pago', 'submetido_banco', 'cancelado', 'arquivado'],
      submetido_banco: ['pago', 'cancelado', 'arquivado'],
      pago: [],
      rejeitado: [],
      cancelado: [],
      arquivado: [],
    },
    requiredByStatus: {
      pendente: ['fornecedor', 'valor'],
      validado: ['fornecedor', 'valor', 'numero'],
      aprovado: ['fornecedor', 'valor'],
      pago: ['fornecedor', 'valor'],
    },
  },
  procurement: {
    statuses: ['requisicao', 'cotacao', 'aprovacao', 'aprovado', 'ordem_compra', 'recebida', 'rejeitado', 'cancelado', 'arquivado'],
    initialStatus: 'requisicao',
    terminalStatuses: ['recebida', 'rejeitado', 'cancelado', 'arquivado'],
    aliases: {
      pendente: 'requisicao',
      aprovado: 'aprovado',
      ordem: 'ordem_compra',
      ordem_compra_emitida: 'ordem_compra',
      recebimento: 'recebida',
    },
    transitions: {
      requisicao: ['cotacao', 'aprovacao', 'rejeitado', 'cancelado', 'arquivado'],
      cotacao: ['aprovacao', 'rejeitado', 'cancelado', 'arquivado'],
      aprovacao: ['aprovado', 'rejeitado', 'cancelado', 'arquivado'],
      aprovado: ['ordem_compra', 'cancelado', 'arquivado'],
      ordem_compra: ['recebida', 'cancelado', 'arquivado'],
      recebida: [],
      rejeitado: [],
      cancelado: [],
      arquivado: [],
    },
    requiredByStatus: {
      requisicao: ['tipo', 'descricao'],
      cotacao: ['tipo', 'descricao'],
      ordem_compra: ['fornecedor', 'valor'],
    },
  },
  contrato: {
    statuses: ['rascunho', 'em_aprovacao', 'ativo', 'renovacao_pendente', 'expirado', 'cancelado', 'arquivado', 'rejeitado'],
    initialStatus: 'rascunho',
    terminalStatuses: ['expirado', 'cancelado', 'arquivado', 'rejeitado'],
    aliases: {
      pendente: 'rascunho',
      aprovado: 'ativo',
      active: 'ativo',
      renovacao: 'renovacao_pendente',
    },
    transitions: {
      rascunho: ['em_aprovacao', 'ativo', 'rejeitado', 'cancelado', 'arquivado'],
      em_aprovacao: ['ativo', 'rejeitado', 'cancelado', 'arquivado'],
      ativo: ['renovacao_pendente', 'expirado', 'cancelado', 'arquivado'],
      renovacao_pendente: ['ativo', 'expirado', 'cancelado', 'arquivado'],
      expirado: ['renovacao_pendente', 'arquivado'],
      cancelado: [],
      arquivado: [],
      rejeitado: [],
    },
    requiredByStatus: {
      rascunho: ['fornecedor', 'objeto'],
      em_aprovacao: ['fornecedor', 'objeto', 'dataInicio', 'dataFim'],
      ativo: ['fornecedor', 'objeto', 'dataInicio', 'dataFim'],
    },
  },
  reclamacao: {
    statuses: ['aberta', 'em_analise', 'em_resolucao', 'resolvida', 'fechada', 'cancelada', 'arquivada'],
    initialStatus: 'aberta',
    terminalStatuses: ['fechada', 'cancelada', 'arquivada'],
    aliases: {
      pendente: 'aberta',
      aprovado: 'em_analise',
      rejeitado: 'cancelada',
      fechada_publica: 'fechada',
      fechada: 'fechada',
    },
    transitions: {
      aberta: ['em_analise', 'em_resolucao', 'resolvida', 'cancelada', 'arquivada'],
      em_analise: ['em_resolucao', 'resolvida', 'cancelada', 'arquivada'],
      em_resolucao: ['resolvida', 'cancelada', 'arquivada'],
      resolvida: ['fechada', 'em_resolucao'],
      fechada: [],
      cancelada: [],
      arquivada: [],
    },
    requiredByStatus: {
      aberta: ['titulo', 'descricao'],
      resolvida: ['descricao'],
    },
  },
};

export class BusinessRulesService {
  static getRules(module: string) {
    return RULES[module];
  }

  static normalizeStatus(module: string, status?: string | null) {
    if (!status) return status;
    const normalized = status.trim();
    const rules = this.getRules(module);
    return rules?.aliases?.[normalized] || normalized;
  }

  static initialStatus(module: string, fallback: string) {
    return this.getRules(module)?.initialStatus || fallback;
  }

  static terminalStatuses(module: string) {
    return this.getRules(module)?.terminalStatuses || COMMON_REJECTION;
  }

  static requiredFields(module: string, status?: string | null) {
    const rules = this.getRules(module);
    if (!rules) return undefined;
    const normalized = this.normalizeStatus(module, status) || rules.initialStatus;
    return rules.requiredByStatus?.[normalized] || rules.requiredByStatus?.[rules.initialStatus];
  }

  static validateTransition(module: string, fromStatus: string | null | undefined, toStatus: string): TransitionResult {
    const rules = this.getRules(module);
    if (!rules) return { allowed: true };

    const from = this.normalizeStatus(module, fromStatus || rules.initialStatus) || rules.initialStatus;
    const to = this.normalizeStatus(module, toStatus) || toStatus;

    if (from === to) return { allowed: true };
    const allowedTargets = rules.transitions[from];
    if (!allowedTargets) {
      return { allowed: false, message: `Status atual invalido para ${module}: ${from}` };
    }

    if (!allowedTargets.includes(to)) {
      return {
        allowed: false,
        message: `Transicao invalida em ${module}: ${from} -> ${to}`,
      };
    }

    return { allowed: true };
  }

  static isTerminal(module: string, status?: string | null) {
    const normalized = this.normalizeStatus(module, status);
    return Boolean(normalized && this.terminalStatuses(module).includes(normalized));
  }
}
