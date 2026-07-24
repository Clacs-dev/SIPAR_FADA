/**
 * TIPOS DO MÓDULO PEDIDO E HELPDESK
 * Sistema de Tickets de Suporte Técnico
 */

export type StatusTicket = 'pendente' | 'aberto' | 'resolvido' | 'fechado';
export type ImportanciaTicket = 'baixa' | 'normal' | 'alta' | 'urgente';

export interface Anexo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
  uploaded_at: string;
}

export interface Solucao {
  descricao: string;
  resolvido_por_id: string;
  resolvido_por_nome: string;
  resolvido_em: string;
  anexos?: Anexo[];
}

export interface Ticket {
  // Identificação
  id: string;
  numero: string;
  
  // Dados do Solicitante
  solicitante_id: string;
  solicitante_nome: string;
  solicitante_email?: string;
  direcao: string; // Departamento
  funcao: string; // Cargo/Função do solicitante
  
  // Detalhes do Problema
  titulo: string;
  descricao: string;
  importancia: ImportanciaTicket;
  categoria?: string; // Hardware, Software, Rede, Email, etc.
  
  // Status e Fluxo
  status: StatusTicket;
  
  // Anexos
  anexos: Anexo[];
  
  // Solução (quando resolvido)
  solucao?: Solucao;
  
  // Confirmação de Fechamento
  fechado_por_id?: string;
  fechado_por_nome?: string;
  fechado_em?: string;
  comentario_fechamento?: string;
  
  // Atribuição (quem está resolvendo)
  atribuido_a_id?: string;
  atribuido_a_nome?: string;
  atribuido_em?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  aberto_em?: string;
  resolvido_em?: string;
  
  // Metadados
  created_by_id: string;
  created_by_name: string;
}

export interface TicketStats {
  total: number;
  pendentes: number;
  abertos: number;
  resolvidos: number;
  fechados: number;
  por_importancia: Record<ImportanciaTicket, number>;
  por_categoria: Record<string, number>;
  tempo_medio_resolucao?: number; // em horas
}
