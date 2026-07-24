// Tipos para o módulo de Actas

export type ActaStatus = 
  | 'rascunho'
  | 'pendente_aprovacao'
  | 'aprovada'
  | 'arquivada';

export type TipoReuniao = 
  | 'ordinaria'
  | 'extraordinaria'
  | 'conselho'
  | 'direcao'
  | 'departamento'
  | 'outro';

export interface Participante {
  id: string;
  nome: string;
  cargo: string;
  departamento?: string;
  email?: string;
  presente: boolean;
  assinado?: boolean;
  assinatura_data?: string;
}

export interface PontoAgenda {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  apresentado_por?: string;
  tempo_discussao?: number; // minutos
  votacao_necessaria?: boolean;
  votacao_resultado?: {
    a_favor: number;
    contra: number;
    abstencoes: number;
  };
}

export interface Decisao {
  id: string;
  ponto_agenda_id: string;
  ponto_agenda_numero: number;
  descricao: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  prazo?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  notas?: string;
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

export interface Acta {
  id: string;
  numero: string; // Ex: ACTA/2026/001
  titulo: string;
  tipo: TipoReuniao;
  status: ActaStatus;
  
  // Data e Local
  data_reuniao: string;
  hora_inicio: string;
  hora_fim?: string;
  duracao?: number; // minutos calculados
  local: string;
  
  // Convocatória
  convocada_por_id: string;
  convocada_por_nome: string;
  objetivo: string;
  
  // Participantes
  participantes: Participante[];
  total_convocados: number;
  total_presentes: number;
  quorum_minimo?: number;
  quorum_atingido: boolean;
  
  // Agenda
  pontos_agenda: PontoAgenda[];
  
  // Decisões e Tarefas
  decisoes: Decisao[];
  
  // Conteúdo
  introducao?: string;
  discussoes?: string;
  conclusoes?: string;
  proximos_passos?: string;
  proxima_reuniao_data?: string;
  
  // Anexos
  anexos: Anexo[];
  
  // Aprovação
  elaborado_por_id: string;
  elaborado_por_nome: string;
  
  revisado_por_id?: string;
  revisado_por_nome?: string;
  revisado_at?: string;
  
  aprovado_por_id?: string;
  aprovado_por_nome?: string;
  aprovado_at?: string;
  
  // Assinaturas
  requer_assinaturas: boolean;
  assinaturas_obrigatorias?: string[]; // IDs dos participantes
  total_assinaturas?: number;
  
  // Histórico
  historico: HistoricoActa[];
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricoActa {
  id: string;
  acta_id: string;
  acao: string;
  status_anterior?: ActaStatus;
  status_novo?: ActaStatus;
  autor_id: string;
  autor_nome: string;
  comentario?: string;
  created_at: string;
}

export interface ActaFilters {
  status?: ActaStatus;
  tipo?: TipoReuniao;
  data_inicio?: string;
  data_fim?: string;
  departamento?: string;
  search?: string;
}

export interface ActaStats {
  total_actas: number;
  rascunhos: number;
  pendentes_aprovacao: number;
  aprovadas: number;
  arquivadas: number;
  
  reunioes_mes: number;
  participantes_medio: number;
  quorum_medio: number;
  
  decisoes_total: number;
  decisoes_pendentes: number;
  decisoes_em_andamento: number;
  decisoes_concluidas: number;
  decisoes_atrasadas: number;
  
  por_tipo: {
    tipo: TipoReuniao;
    quantidade: number;
  }[];
  
  proximas_reunioes: {
    titulo: string;
    data: string;
    participantes: number;
  }[];
  
  tarefas_urgentes: Decisao[];
}

export interface ConvocatoriaData {
  acta_id: string;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  objetivo: string;
  pontos_agenda: string[];
  participantes: string[];
}
