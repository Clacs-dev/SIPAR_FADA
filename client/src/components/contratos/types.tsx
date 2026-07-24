/**
 * TIPOS DO MÓDULO DE GESTÃO DE CONTRATOS
 */

export type StatusContrato = 
  | 'rascunho'
  | 'validacao_juridica'    // NOVO: Aguardando validação do departamento jurídico
  | 'validado_juridico'     // NOVO: Validado pelo jurídico, aguardando aprovação admin
  | 'rejeitado_juridico'    // NOVO: Rejeitado pelo jurídico
  | 'em_aprovacao'
  | 'ativo'
  | 'suspenso'
  | 'renovacao_pendente'
  | 'expirado'
  | 'cancelado';

export type TipoContrato =
  | 'prestacao_servicos'
  | 'fornecimento'
  | 'locacao'
  | 'manutencao'
  | 'consultoria'
  | 'licenciamento'
  | 'outro';

export interface Contrato {
  id: string;
  numero: string;
  tipo: TipoContrato;
  titulo: string;
  descricao: string;
  
  // Partes envolvidas
  contratante: string;
  contratado_nome: string;
  fornecedor_nome?: string; // Alias para contratado_nome
  contratado_documento: string;
  fornecedor_nif?: string; // Alias para contratado_documento
  contratado_contato?: string;
  fornecedor_contato?: string; // Alias para contratado_contato
  
  // Datas e vigência
  data_inicio: string;
  data_fim: string;
  duracao_meses: number;
  renovacao_automatica: boolean;
  prazo_aviso_renovacao?: number; // dias antes
  
  // Valores
  valor_total: number;
  valor_mensal?: number;
  moeda: string;
  forma_pagamento?: string;
  prestacoes?: Array<{
    numero: number;
    percentual: number;
    valor?: number;
    descricao?: string;
    data_vencimento?: string;
  }>;
  
  // Status e alertas
  status: StatusContrato;
  dias_para_vencimento?: number;
  alerta_vencimento?: boolean;
  
  // Documentos
  documentos: Array<{
    id: string;
    nome: string;
    tipo: string;
    url: string;
    tamanho: number;
    uploaded_at: string;
  }>;
  
  // Responsáveis
  gestor_contrato_id?: string;
  gestor_contrato_nome?: string;
  departamento_responsavel?: string;
  
  // Histórico de alterações
  historico_alteracoes: Array<{
    id: string;
    data: string;
    usuario: string;
    tipo_alteracao: string;
    descricao: string;
    valor_anterior?: any;
    valor_novo?: any;
  }>;
  
  // Renovações
  historico_renovacoes?: Array<{
    id: string;
    data_renovacao: string;
    nova_data_fim: string;
    valor_anterior: number;
    valor_novo: number;
    usuario: string;
  }>;
  
  // Metadados
  observacoes?: string;
  tags?: string[];
  anexos_adicionais?: any[];
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  updated_by_id?: string;
  updated_by_name?: string;
  
  // Validação Jurídica
  validado_juridico_por_id?: string;
  validado_juridico_por_nome?: string;
  validado_juridico_em?: string;
  rejeitado_juridico_por_id?: string;
  rejeitado_juridico_por_nome?: string;
  rejeitado_juridico_em?: string;
  motivo_rejeicao_juridica?: string;
  observacoes_juridicas?: string;
  
  // Aprovação Admin
  aprovado_por_id?: string;
  aprovado_por_nome?: string;
  aprovado_em?: string;
  
  // Cancelamento
  cancelado_por_id?: string;
  cancelado_por_nome?: string;
  cancelado_em?: string;
  motivo_cancelamento?: string;
}

export interface ContratoFilters {
  status?: StatusContrato;
  tipo?: TipoContrato;
  departamento?: string;
  gestor_id?: string;
  vencimento_proximo?: boolean; // vence em até 30 dias
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface ContratoStats {
  total: number;
  ativos: number;
  em_aprovacao: number;
  expirando_30_dias: number;
  expirando_60_dias: number;
  expirados: number;
  valor_total_contratos_ativos: number;
  por_tipo: Record<TipoContrato, number>;
  por_status: Record<StatusContrato, number>;
}

export interface AlertaContrato {
  id: string;
  contrato_id: string;
  contrato_numero: string;
  contrato_titulo: string;
  tipo_alerta: 'vencimento' | 'renovacao' | 'valor' | 'outro';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  mensagem: string;
  data_alerta: string;
  visualizado: boolean;
  acao_tomada?: string;
  created_at: string;
}