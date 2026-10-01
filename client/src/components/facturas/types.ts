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
  // Classificação do item (Angola) - só para reporting (ex: split
  // Mercadoria/Serviços no Mapa de Impostos), não decide sozinha o imposto
  // aplicado (ver client/src/utils/fiscal.ts). Default "produto" quando
  // ausente (itens antigos, criados antes desta distinção existir).
  tipo_operacao?: TipoOperacaoFiscalItem;
  // IVA (0/2/5/7/14%) e retenção na fonte (6,5%, activada por
  // "aplica_retencao") são independentes - um item pode ter os dois ao
  // mesmo tempo, só um, ou nenhum.
  iva: number;
  aplica_retencao?: boolean;
  valor_retencao?: number;
  total: number;
}

export type TipoOperacaoFiscalItem = 'produto' | 'servico';

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
  fornecedor_id?: string;
  // O backend guarda o fornecedor como texto simples; so aparece como objecto
  // quando alguem explicitamente estrutura os dados assim (ex: portal de fornecedores).
  fornecedor: Fornecedor | string;
  fornecedor_nome?: string;
  fornecedor_nif?: string;
  fornecedor_email?: string;
  nif?: string;
  data_emissao?: string;
  data_vencimento?: string;
  data_recebimento?: string;
  data_registo?: string; // Para compatibilidade com backend
  status: FacturaStatus;
  
  // Valores financeiros
  subtotal?: number;
  iva_total?: number;
  total?: number;
  valor?: number; // Coluna real do backend; "total" so existe quando submetido via formulario externo
  // Retenção na fonte (serviços, 6,5%) e valor final efectivamente a pagar
  // (total - retencao_total). Ver client/src/utils/fiscal.ts. Facturas
  // antigas (antes desta feature) não têm estes campos - o Mapa de Impostos
  // e o valor da Ordem de Pagamento devem usar fallback para "total"/"valor".
  retencao_total?: number;
  valor_final?: number;
  moeda: string; // AOA, USD, EUR
  
  // Itens da factura
  itens: ItemFactura[];
  
  // Informações adicionais
  descricao: string;
  observacoes?: string;
  condicoes_pagamento?: string;

  // Dados bancários para pagamento (preenchidos pelo fornecedor/utilizador externo)
  banco_nome?: string;
  banco_titular?: string;
  banco_iban?: string;
  banco_nib?: string;
  banco_swift?: string;
  banco_cidade?: string;
  banco_pais?: string;

  // Tipo de documento submetido (factura definitiva, proforma, etc.)
  tipo_documento?: 'factura' | 'factura_proforma' | 'outro';

  // Vinculo com Ordem de Compra do Procurement (sincronizacao). "origem"
  // distingue se a factura veio do Procurement ('procurement', documento
  // continua "Ordem de Compra", vai para o fornecedor) ou foi criada
  // directamente em Gestão de Pagamento (sem valor, documento interno
  // chamado "Liberação de Despesa_DSG").
  purchase_order_id?: string;
  numero_ordem?: string;
  origem?: string;

  // Ordem de Pagamento gerada a partir desta factura (Gestão de Pagamento)
  numero_ordem_pagamento?: string;
  ordem_pagamento?: {
    numero_despacho?: string;
    conta_debito?: string;
    banco_destino_cidade?: string;
    banco_destino_pais?: string;
    gerada_em?: string;
    gerada_por_nome?: string;
    assinaturas?: {
      papel: 'presidente' | 'administrador';
      nome: string;
      assinatura_url?: string;
      assinado_em: string;
    }[];
  };

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

// Ordem de Pagamento Interna: mesmo documento final (mesmo PDF) da Ordem de
// Pagamento a Fornecedor, mas preenchida manualmente em vez de gerada
// automaticamente a partir de uma factura aprovada.
export interface OrdemPagamentoInterna {
  id: string;
  numero: string;
  status: 'rascunho' | 'assinado' | 'pago';
  descricao: string;
  valor: number;
  moeda: string;
  destinatario: string;
  numero_despacho?: string;
  conta_debito?: string;
  banco_nome?: string;
  banco_iban?: string;
  banco_cidade?: string;
  banco_pais?: string;
  paid_at?: string;
  assinaturas: {
    papel: 'presidente' | 'administrador';
    nome: string;
    assinatura_url?: string;
    assinado_em: string;
  }[];
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}