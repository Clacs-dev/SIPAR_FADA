/**
 * TIPOS DO MÓDULO DE COMUNICAÇÕES INTERNAS
 */

export interface Despacho {
  id: string;
  comunicacao_id: string;
  comunicacao_numero: string;
  tipo: 'despacho' | 'informacao' | 'encaminhamento';
  texto_despacho: string;
  decisao: 'aprovado' | 'rejeitado' | 'pendente';
  despachado_por_id: string;
  despachado_por_nome: string;
  despachado_por_cargo: string;
  departamento: string;
  created_at: string;
}

export interface Resposta {
  id: string;
  comunicacao_id: string;
  comunicacao_numero: string;
  texto_resposta: string;
  anexos: Anexo[];
  respondido_por_id: string;
  respondido_por_nome: string;
  respondido_por_cargo: string;
  departamento: string;
  created_at: string;
}

export interface Delegacao {
  id: string;
  comunicacao_id: string;
  comunicacao_numero: string;
  delegado_para_id: string;
  delegado_para_nome: string;
  delegado_para_cargo: string;
  motivo: string;
  delegado_por_id: string;
  delegado_por_nome: string;
  departamento: string;
  created_at: string;
}

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface Comunicacao {
  id: string;
  numero: string;
  tipo: 'saida'; // Sempre saída
  assunto: string;
  departamento_origem: string;
  departamento_destino: string;
  destinatario_nome: string;
  destinatario_cargo: string;
  conteudo: string;
  prioridade: 'normal' | 'alta' | 'urgente';
  status: 'pendente' | 'em_analise' | 'despachado' | 'arquivado';
  confidencial: boolean;
  anexos: Anexo[];
  despachos?: Despacho[];
  respostas?: Resposta[];
  delegacoes?: Delegacao[];
  
  // Metadados
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  updated_by_id?: string;
  updated_by_name?: string;
  
  // Timestamps específicos
  despachado_em?: string;
  despachado_por_id?: string;
  despachado_por_nome?: string;
  arquivado_em?: string;
  arquivado_por_id?: string;
  arquivado_por_nome?: string;
}

export interface ComunicacaoFilters {
  status?: string;
  prioridade?: string;
  departamento_origem?: string;
  departamento_destino?: string;
  confidencial?: boolean;
  data_inicio?: string;
  data_fim?: string;
}

export interface ComunicacaoStats {
  total: number;
  pendentes: number;
  em_analise: number;
  despachadas: number;
  arquivadas: number;
  urgentes: number;
  confidenciais: number;
}