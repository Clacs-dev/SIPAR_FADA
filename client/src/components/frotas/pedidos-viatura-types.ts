// Tipos para Pedidos de Viatura

export type PedidoViaturaStatus = 
  | 'rascunho'
  | 'submetido'
  | 'aprovado'
  | 'rejeitado'
  | 'cancelado'
  | 'em_viagem'
  | 'concluido';

export type PedidoViaturaPrioridade = 
  | 'baixa'
  | 'normal'
  | 'alta'
  | 'urgente';

export interface PedidoViatura {
  id: string;
  
  // Dados do solicitante
  solicitante_id: string;
  solicitante_nome: string;
  departamento: string;
  telefone: string;
  email?: string;
  
  // Dados do pedido
  data_solicitacao: string;
  data_inicio_pretendida: string;
  hora_inicio_pretendida: string;
  data_fim_pretendida: string;
  hora_fim_pretendida: string;
  
  // Destino e finalidade
  destino: string;
  finalidade: string;
  itinerario?: string;
  
  // Passageiros
  numero_passageiros: number;
  lista_passageiros?: string[];
  
  // Preferências
  tipo_viatura_pretendida?: string; // SUV, Ligeiro, Carrinha, etc.
  motorista_pretendido_id?: string;
  motorista_pretendido_nome?: string;
  observacoes?: string;
  
  // Prioridade
  prioridade: PedidoViaturaPrioridade;
  justificacao_prioridade?: string;
  
  // Aprovação/Atribuição
  status: PedidoViaturaStatus;
  viatura_atribuida_id?: string;
  viatura_atribuida_matricula?: string;
  motorista_atribuido_id?: string;
  motorista_atribuido_nome?: string;
  
  // Aprovação
  aprovado_por_id?: string;
  aprovado_por_nome?: string;
  aprovado_em?: string;
  notas_aprovacao?: string;
  
  // Rejeição
  rejeitado_por_id?: string;
  rejeitado_por_nome?: string;
  rejeitado_em?: string;
  motivo_rejeicao?: string;
  
  // Conclusão
  utilizacao_id?: string;
  concluido_em?: string;
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoViaturaFilters {
  status?: PedidoViaturaStatus;
  prioridade?: PedidoViaturaPrioridade;
  solicitante_id?: string;
  departamento?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface PedidoViaturaStats {
  total: number;
  pendentes: number;
  aprovados: number;
  rejeitados: number;
  concluidos: number;
  por_prioridade: {
    urgente: number;
    alta: number;
    normal: number;
    baixa: number;
  };
  por_departamento: {
    departamento: string;
    total: number;
  }[];
}