// Tipos para o módulo de Ofícios

export type OficioStatus = 
  | 'rascunho'
  | 'registado'
  | 'em_analise'
  | 'despachado'
  | 'arquivado';

export type OficioType = 'entrada' | 'saida';

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  uploaded_at: string;
}

export interface Despacho {
  id: string;
  oficio_id: string;
  autor_id: string;
  autor_nome: string;
  descricao: string;
  created_at: string;
  anexos?: Anexo[];
}

export interface Oficio {
  id: string;
  numero: string; // Ex: OF/001/2026
  tipo: OficioType;
  assunto: string;
  remetente?: string; // Para ofícios de entrada
  email_remetente?: string; // Email do remetente (para notificações)
  destinatario?: string; // Para ofícios de saída
  departamento_origem?: string;
  departamento_destino?: string;
  // Campos específicos para ofícios de entrada (quando for de empresa externa)
  nome_empresa_solicitante?: string;
  nif_empresa?: string;
  conteudo: string;
  status: OficioStatus;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  prazo_resposta?: string;
  processo_associado_id?: string;
  solicitacao_associada_id?: string;
  anexos: Anexo[];
  despachos: Despacho[];
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  registado_at?: string;
  despachado_at?: string;
  arquivado_at?: string;
}

export interface OficioFilters {
  tipo?: OficioType;
  status?: OficioStatus;
  prioridade?: string;
  departamento?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface OficioStats {
  total: number;
  pendentes: number;
  em_analise: number;
  despachados: number;
  arquivados: number;
  atrasados: number;
  entrada: number;
  saida: number;
}