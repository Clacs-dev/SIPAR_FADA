// Tipos para o módulo de Facturas

export type FacturaStatus = 
  | 'rascunho'
  | 'registada'
  | 'pendente'
  | 'validado'
  | 'aprovado'
  | 'rejeitado'
  | 'cancelado'
  | 'submetido_ao_banco'
  | 'pago';

export type FacturaTipo = 
  | 'mercadoria'
  | 'servico'
  | 'ambos';

export interface Fornecedor {
  id: string;
  nome: string;
  nif: string;
  email: string;
  telefone: string;
  morada: string;
  iban?: string;
}

export interface ItemFactura {
  id: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  iva: number;
  total: number;
}

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  uploaded_at: string;
}

export interface HistoricoFactura {
  id: string;
  factura_id: string;
  acao: string;
  status_anterior?: FacturaStatus;
  status_novo?: FacturaStatus;
  autor_id: string;
  autor_nome: string;
  comentario?: string;
  created_at: string;
}

export interface Factura {
  id: string;
  numero: string; // Ex: FT/2026/001
  numero_fornecedor: string; // Número da factura do fornecedor
  numero_submissao?: string; // Nº de submissão do registo (gerado automaticamente)
  tipo: FacturaTipo; // Mercadoria, Serviço ou Ambos
  fornecedor_id: string;
  fornecedor: Fornecedor;
  data_emissao: string;
  data_vencimento: string;
  data_recebimento: string;
  data_registo?: string; // Para compatibilidade com backend
  status: FacturaStatus;
  
  // Valores financeiros
  subtotal: number;
  iva_total: number;
  total: number;
  moeda: string; // AOA, USD, EUR
  
  // Itens da factura
  itens: ItemFactura[];
  
  // Informações adicionais
  descricao: string;
  observacoes?: string;
  condicoes_pagamento?: string;
  
  // Validação e aprovação
  validado_por_id?: string;
  validado_por_nome?: string;
  validado_at?: string;
  validacao_comentario?: string;
  
  aprovado_por_id?: string;
  aprovado_por_nome?: string;
  aprovado_at?: string;
  aprovacao_comentario?: string;
  
  rejeitado_por_id?: string;
  rejeitado_por_nome?: string;
  rejeitado_at?: string;
  rejeicao_motivo?: string;
  
  // Pagamento
  pago_at?: string;
  metodo_pagamento?: string;
  referencia_pagamento?: string;
  comprovativo_url?: string;
  
  // Submissão ao banco
  submetido_banco_at?: string;
  submetido_banco_por_id?: string;
  submetido_banco_por_nome?: string;
  banco_destino?: string;
  referencia_submissao?: string;
  
  // Anexos e documentos
  anexos: Anexo[];
  
  // Integração externa
  integracao_primavera_id?: string;
  integracao_status?: 'pendente' | 'enviado' | 'confirmado' | 'erro';
  integracao_data?: string;
  
  // Auditoria
  historico: HistoricoFactura[];
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface FacturaFilters {
  status?: FacturaStatus;
  fornecedor_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  moeda?: string;
  search?: string;
}

export interface FacturaStats {
  total_facturas: number;
  total_valor: number;
  total_pago: number;
  total_pendente: number;
  
  registadas: number;
  em_validacao: number;
  aprovadas: number;
  rejeitadas: number;
  pagas: number;
  
  vencidas: number;
  a_vencer_30dias: number;
  
  por_fornecedor: {
    fornecedor_nome: string;
    total: number;
    valor: number;
  }[];
}

export interface RelatorioFinanceiro {
  periodo: string;
  total_emitido: number;
  total_pago: number;
  total_pendente: number;
  facturas_por_status: {
    status: FacturaStatus;
    quantidade: number;
    valor: number;
  }[];
  maiores_facturas: Factura[];
  fornecedores_top: {
    fornecedor: string;
    total_facturas: number;
    valor_total: number;
  }[];
}