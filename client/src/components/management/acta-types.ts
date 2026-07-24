// Tipos para Actas de Reuniões

export interface ActaParticipante {
  id: string;
  nome: string;
  email: string;
  role: string;
  presente?: boolean; // Marcado após a reunião
}

export interface PontoAgenda {
  id: string;
  ordem: number;
  titulo: string;
  descricao?: string;
  responsavel?: string;
  tempo_estimado?: number; // em minutos
}

export interface DecisaoTomada {
  id: string;
  descricao: string;
  responsavel?: string;
  prazo?: string;
  status?: 'pendente' | 'em_progresso' | 'concluida';
}

export interface TarefaAtribuida {
  id: string;
  descricao: string;
  responsavel: string;
  responsavel_nome?: string;
  prazo?: string;
  prioridade?: 'baixa' | 'normal' | 'alta' | 'urgente';
  status?: 'pendente' | 'em_progresso' | 'concluida';
}

export interface Acta {
  id: string;
  reuniao_id: string; // ID da reunião interna
  numero: string; // ACT-2024-001
  
  // Informações da Reunião
  titulo: string;
  data_reuniao: string;
  hora_inicio: string;
  hora_fim: string;
  local?: string;
  tipo: 'online' | 'presencial';
  link_reuniao?: string;
  
  // Participantes
  organizador_id: string;
  organizador_nome: string;
  participantes: ActaParticipante[];
  participantes_presentes?: string[]; // IDs dos que compareceram
  
  // Agenda e Conteúdo
  pontos_agenda: PontoAgenda[];
  resumo?: string; // Resumo da reunião
  discussoes?: string; // Pontos discutidos
  decisoes: DecisaoTomada[];
  tarefas: TarefaAtribuida[];
  proximos_passos?: string;
  observacoes?: string;
  
  // Anexos
  anexos?: {
    id: string;
    nome: string;
    url: string;
    tipo: string;
    tamanho: number;
  }[];
  
  // Status e Workflow
  status: 'pendente' | 'em_curso' | 'finalizada' | 'aprovada';
  rascunho: boolean; // Se ainda está sendo editada
  
  // Aprovação
  aprovada_por?: string;
  aprovada_em?: string;
  aprovacao_comentario?: string;
  
  // Assinaturas
  assinatura_organizador?: string;
  assinatura_participantes?: {
    user_id: string;
    nome: string;
    assinado_em: string;
  }[];
  
  // Metadata
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  finalizada_em?: string;
}

export interface ActaFilters {
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  organizador?: string;
  search?: string;
}
