/**
 * TIPOS DO MÓDULO DE PLANEAMENTO E GESTÃO
 * Inclui: Orçamentos, Execução Orçamental, Relatórios & Contas
 */

// ========== SUBMÓDULO 5.1: ELABORAÇÃO DE ORÇAMENTOS ==========
export interface Orcamento {
  id: string;
  numero: string;
  ano_fiscal: number;
  periodo: string; // "2024", "2024-Q1", "2024-01"
  departamento: string;
  
  // Valores
  valor_previsto: number;
  valor_aprovado?: number;
  valor_reservado?: number;
  
  // Categorias orçamentais
  categorias: Array<{
    id: string;
    nome: string;
    subcategoria?: string;
    valor_previsto: number;
    valor_aprovado?: number;
    descricao?: string;
  }>;
  
  // Status
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'em_execucao' | 'concluido';
  versao: number;
  
  // Forecast
  forecast_trimestral?: Record<string, number>;
  premissas?: string;
  
  // Auditoria
  elaborado_por: string;
  aprovado_por?: string;
  created_at: string;
  aprovado_em?: string;
}

// ========== SUBMÓDULO 5.2: ACOMPANHAMENTO E EXECUÇÃO ORÇAMENTAL ==========
export interface ExecucaoOrcamental {
  id: string;
  orcamento_id: string;
  periodo: string; // "2024-01", "2024-Q1"
  departamento: string;
  
  // Valores
  orcado: number;
  realizado: number;
  comprometido: number;
  disponivel: number;
  
  // Métricas
  percentual_execucao: number;
  desvio: number;
  desvio_percentual: number;
  
  // Detalhamento por categoria
  execucao_categorias: Array<{
    categoria: string;
    orcado: number;
    realizado: number;
    desvio: number;
    desvio_percentual: number;
  }>;
  
  // Análise
  observacoes?: string;
  acoes_corretivas?: string[];
  
  // Timestamps
  data_referencia: string;
  updated_at: string;
}

// ========== SUBMÓDULO 5.3: ELABORAÇÃO DE RELATÓRIOS & CONTAS ==========
export interface RelatorioFinanceiro {
  id: string;
  numero: string;
  tipo: 'balanco' | 'demonstracao_resultados' | 'fluxo_caixa' | 'contas_pagar' | 'contas_receber' | 'consolidado';
  titulo: string;
  periodo_inicio: string;
  periodo_fim: string;
  
  // Dados do relatório
  resumo_executivo?: string;
  dados: {
    receitas?: number;
    despesas?: number;
    resultado?: number;
    ativos?: number;
    passivos?: number;
    patrimonio_liquido?: number;
    contas_pagar_total?: number;
    contas_receber_total?: number;
    saldo_caixa?: number;
  };
  
  // Detalhamento
  detalhamento?: Array<{
    categoria: string;
    valor: number;
    percentual?: number;
    observacao?: string;
  }>;
  
  // Análises
  indicadores_performance?: Record<string, number>;
  analise_tendencias?: string;
  recomendacoes?: string[];
  
  // Documentos
  anexos: Array<{
    id: string;
    nome: string;
    url: string;
    tipo: string;
  }>;
  
  // Status
  status: 'rascunho' | 'revisao' | 'aprovado' | 'publicado';
  
  // Auditoria
  elaborado_por: string;
  aprovado_por?: string;
  created_at: string;
  publicado_em?: string;
}

export interface ContaPagar {
  id: string;
  numero: string;
  fornecedor: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'vencida' | 'paga' | 'cancelada';
  data_pagamento?: string;
  categoria: string;
  centro_custo?: string;
  observacoes?: string;
}

export interface ContaReceber {
  id: string;
  numero: string;
  cliente: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'vencida' | 'recebida' | 'cancelada';
  data_recebimento?: string;
  categoria: string;
  observacoes?: string;
}

// ========== SUBMÓDULO 5.4: GESTÃO DE METAS E OBJETIVOS ==========
export interface Meta {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  tipo: 'financeira' | 'vendas' | 'producao' | 'crescimento' | 'eficiencia' | 'outra';
  
  // Período e Prazos
  data_inicio: string;
  data_fim: string;
  prazo_dias: number;
  
  // Valores e Metas
  valor_alvo: number;
  valor_atual: number;
  percentual_progresso: number;
  unidade_medida: string; // "AOA", "unidades", "contratos", "%", etc
  
  // Sub-metas/Marcos Intermediários
  sub_metas: Array<{
    id: string;
    titulo: string;
    valor_alvo: number;
    prazo: string;
    atingida: boolean;
    data_conclusao?: string;
  }>;
  
  // Acompanhamento por Período
  progresso_diario?: Array<{
    data: string;
    valor_realizado: number;
    valor_acumulado: number;
  }>;
  
  // Responsáveis
  departamento: string;
  responsavel: string;
  equipe?: string[];
  
  // Status
  status: 'planejada' | 'em_andamento' | 'atrasada' | 'atingida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  
  // Análise
  observacoes?: string;
  acoes_necessarias?: string[];
  riscos?: string[];
  
  // Metadados
  criado_por: string;
  created_at: string;
  atualizado_em?: string;
  concluida_em?: string;
}

export interface MetaProgresso {
  meta_id: string;
  data: string;
  valor_realizado: number;
  valor_acumulado: number;
  percentual_dia: number;
  percentual_acumulado: number;
  observacao?: string;
  registrado_por: string;
}

// ========== ESTATÍSTICAS CONSOLIDADAS ==========
export interface PlanejamentoStats {
  // Orçamentos
  total_orcamentos: number;
  orcamento_aprovado_ano: number;
  orcamento_executado: number;
  percentual_execucao_global: number;
  
  // Contas
  contas_pagar_total: number;
  contas_pagar_vencidas: number;
  contas_receber_total: number;
  contas_receber_vencidas: number;
  
  // Fluxo de caixa
  saldo_atual: number;
  projecao_30_dias: number;
  
  // Performance
  desvio_orcamental_medio: number;
  departamentos_com_desvio: number;
}