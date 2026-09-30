/**
 * TIPOS DO MÓDULO PROCUREMENT - SISTEMA DE AQUISIÇÕES
 * Sistema profissional de pedidos de compra com cotações de fornecedores
 */

// Status do Pedido de Compra
export type StatusPedidoCompra = 
  | 'criado'              // Pedido criado, aguardando publicação
  | 'aguardando_cotacoes' // Publicado para fornecedores
  | 'em_cotacao'          // Pelo menos 1 fornecedor respondeu
  | 'em_analise'          // Comprador analisando propostas
  | 'aprovado'            // Fornecedor escolhido
  | 'ordem_emitida'       // Ordem de compra gerada
  | 'em_entrega'          // Aguardando entrega
  | 'concluido'           // Recebido e finalizado
  | 'cancelado';          // Cancelado

// Tipo de Item
export type TipoItem = 
  | 'material' 
  | 'servico' 
  | 'equipamento' 
  | 'consumivel'
  | 'software'
  | 'outro';

// Prioridade do Pedido
export type PrioridadePedido = 'baixa' | 'normal' | 'alta' | 'urgente';

// Status do Fornecedor
export type StatusFornecedor = 'ativo' | 'inativo' | 'bloqueado';

/**
 * ITEM DO PEDIDO DE COMPRA
 */
export interface ItemPedido {
  id: string;
  descricao: string;
  tipo: TipoItem;
  quantidade: number;
  unidade: string; // unidade, kg, litro, caixa, etc.
  especificacoes_tecnicas?: string;
  caracteristicas?: string;
  prazo_desejado?: string; // Data desejada para entrega
  observacoes?: string;
}

/**
 * RESPOSTA DO FORNECEDOR PARA UM ITEM
 */
export interface RespostaItemFornecedor {
  item_id: string; // ID do item original do pedido
  item_descricao: string;
  disponivel: 'sim' | 'nao'; // Se o fornecedor tem o item
  quantidade_disponivel?: number;
  preco_unitario?: number;
  iv_percentagem?: number; // Imposto sobre o valor (%) - 0 se não tiver IV
  condicoes_pagamento?: string; // "30 dias", "à vista", "50% antecipado"
  prazo_entrega_dias?: number; // Dias para entrega
  observacoes?: string;
}

/**
 * COTAÇÃO COMPLETA DO FORNECEDOR
 */
export interface CotacaoFornecedor {
  id: string;
  pedido_id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  fornecedor_telefone?: string;
  
  // Respostas por item
  itens_resposta: RespostaItemFornecedor[];
  
  // Informações gerais da cotação
  valor_total: number; // Calculado automaticamente
  condicoes_gerais?: string;
  prazo_validade_cotacao?: string; // Data até quando a cotação é válida
  observacoes_gerais?: string;
  
  // Anexos (fatura proforma, catálogos, etc.)
  anexos?: Array<{
    nome: string;
    url: string;
    tipo: string;
  }>;
  
  // Análise automática
  score_preco?: number; // 0-100 (menor preço = maior score)
  score_prazo?: number; // 0-100 (menor prazo = maior score)
  score_disponibilidade?: number; // 0-100 (% de itens disponíveis)
  score_total?: number; // Média ponderada
  itens_completos: boolean; // Se atende todos os itens
  percentual_atendimento: number; // % dos itens atendidos
  
  // Metadados
  submitted_at: string;
  submitted_by_id?: string;
  submitted_by_name?: string;
}

/**
 * PEDIDO DE COMPRA PRINCIPAL
 */
export interface PedidoCompra {
  id: string;
  numero: string; // PED/2025/01/0001
  titulo: string;
  descricao: string;
  departamento_solicitante: string;
  
  // Itens do pedido
  itens: ItemPedido[];
  
  // Informações do pedido
  prioridade: PrioridadePedido;
  orcamento_estimado?: number;
  prazo_entrega_desejado?: string;
  local_entrega: string;
  observacoes?: string;
  
  // Status e workflow
  status: StatusPedidoCompra;
  
  // Cotações recebidas
  cotacoes: CotacaoFornecedor[];
  total_cotacoes: number;
  
  // Fornecedor vencedor (após aprovação)
  fornecedor_vencedor_id?: string;
  fornecedor_vencedor_nome?: string;
  cotacao_vencedora_id?: string;
  valor_aprovado?: number;
  justificativa_escolha?: string;
  
  // Ordem de compra
  ordem_compra_numero?: string;
  ordem_compra_emitida_em?: string;
  
  // Entrega
  data_entrega_prevista?: string;
  data_entrega_real?: string;
  recebido_por_id?: string;
  recebido_por_nome?: string;
  observacoes_recebimento?: string;
  
  // Histórico
  historico: Array<{
    id: string;
    data: string;
    usuario: string;
    acao: string;
    detalhes: string;
  }>;
  
  // Metadados
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  
  // Email tracking
  email_notificacao_enviado?: boolean;
  email_notificacao_data?: string;
}

/**
 * FORNECEDOR
 */
export interface Fornecedor {
  id: string;
  nome: string;
  razao_social?: string;
  nif: string; // Número de Identificação Fiscal
  
  // Endereço
  endereco?: string;
  cidade?: string;
  provincia?: string;
  pais: string;
  
  // Contato
  telefone?: string;
  email: string;
  website?: string;
  
  // Contato principal
  contato_nome?: string;
  contato_cargo?: string;
  contato_telefone?: string;
  contato_email?: string;
  
  // Informações comerciais
  categorias_produto?: string[]; // Categorias que fornece
  condicoes_pagamento_padrao?: string[] | string;
  prestacoes?: Array<{
    id: string;
    descricao: string;
    percentagem: number;
  }>;
  prazo_entrega_padrao_dias?: number;
  valor_minimo_pedido?: number;
  
  // Credenciais
  usuario_id?: string; // Se tem acesso ao sistema
  
  // Status
  situacao: StatusFornecedor;
  observacoes?: string;
  
  // Estatísticas
  total_cotacoes?: number;
  total_vendas?: number;
  avaliacao_media?: number; // 1-5 estrelas
  
  // Metadados
  created_at: string;
  updated_at: string;
  created_by_id?: string;
  created_by_name?: string;
}

/**
 * ORDEM DE COMPRA
 */
export interface OrdemCompra {
  id: string;
  numero: string; // OC/2025/01/0001
  pedido_id: string;
  pedido_numero: string;
  
  // Fornecedor
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  fornecedor_telefone?: string;
  fornecedor_endereco?: string;
  
  // Itens da ordem
  itens: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    preco_unitario: number;
    subtotal: number;
  }>;
  
  // Valores
  valor_total: number;
  condicoes_pagamento: string;
  
  // Entrega
  prazo_entrega: string;
  local_entrega: string;
  data_entrega_prevista?: string;
  
  // Status
  status: 'emitida' | 'confirmada' | 'em_transito' | 'entregue' | 'recebida' | 'cancelada';
  
  // Confirmação do fornecedor
  confirmada_em?: string;
  confirmada_por?: string;
  
  // Documentos
  pdf_url?: string;
  anexos?: Array<{
    nome: string;
    url: string;
  }>;
  
  // Metadados
  created_at: string;
  created_by_id: string;
  created_by_name: string;
  updated_at: string;
}

/**
 * ESTATÍSTICAS DO PROCUREMENT
 */
export interface ProcurementStats {
  total_pedidos: number;
  aguardando_cotacoes: number;
  em_cotacao: number;
  em_analise: number;
  concluidos: number;
  
  total_fornecedores: number;
  fornecedores_ativos: number;
  
  valor_total_mes: number;
  total_ordens_emitidas: number;
  
  por_status: Record<StatusPedidoCompra, number>;
  por_departamento: Record<string, number>;
  
  tempo_medio_cotacao: number; // Horas
  tempo_medio_entrega: number; // Dias
}

/**
 * FILTROS PARA LISTAGEM
 */
export interface PedidoCompraFilters {
  status?: StatusPedidoCompra[];
  prioridade?: PrioridadePedido[];
  departamento?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}