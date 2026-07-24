// Tipos para o módulo de Frotas

export type ViaturaStatus = 
  | 'disponivel'
  | 'em_uso'
  | 'em_manutencao'
  | 'inativa';

export type TipoManutencao = 
  | 'preventiva'
  | 'corretiva'
  | 'revisao'
  | 'inspecao';

export interface Motorista {
  id: string;
  nome: string;
  carta_conducao: string;
  validade_carta: string;
  telefone: string;
  email?: string;
  departamento?: string;
  foto_url?: string;
}

export interface Viatura {
  id: string;
  matricula: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  tipo: string; // Ligeiro, SUV, Carrinha, Autocarro, etc.
  combustivel: 'gasolina' | 'diesel' | 'electrico' | 'hibrido';
  status: ViaturaStatus;
  
  // Informações técnicas
  cilindrada?: string;
  lugares: number;
  chassis?: string;
  
  // Documentação
  seguro_validade?: string;
  inspecao_validade?: string;
  livrete_url?: string;
  seguro_url?: string;
  
  // Kilometragem
  km_atual: number;
  km_proxima_revisao?: number;
  
  // Localização e uso atual
  localizacao_atual?: string;
  motorista_atual_id?: string;
  motorista_atual_nome?: string;
  utilizacao_atual_id?: string;
  
  // Custos
  custo_aquisicao?: number;
  custo_total_manutencao: number;
  custo_total_combustivel: number;
  
  // Observações
  observacoes?: string;
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Utilizacao {
  id: string;
  viatura_id: string;
  viatura_matricula: string;
  motorista_id: string;
  motorista_nome: string;
  
  // Dados da viagem
  data_saida: string;
  hora_saida: string;
  km_saida: number;
  
  data_chegada?: string;
  hora_chegada?: string;
  km_chegada?: number;
  km_percorridos?: number;
  
  // Destino e finalidade
  destino: string;
  finalidade: string;
  passageiros?: string[];
  
  // Combustível
  combustivel_litros?: number;
  combustivel_custo?: number;
  
  // Status
  status: 'em_curso' | 'concluida' | 'cancelada';
  
  // Observações
  observacoes?: string;
  ocorrencias?: string;
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Manutencao {
  id: string;
  viatura_id: string;
  viatura_matricula: string;
  
  tipo: TipoManutencao;
  data_entrada: string;
  data_prevista_saida?: string;
  data_saida?: string;
  
  km_manutencao: number;
  
  // Detalhes
  descricao: string;
  oficina: string;
  responsavel_oficina?: string;
  telefone_oficina?: string;
  
  // Serviços realizados
  servicos: {
    id: string;
    descricao: string;
    custo: number;
  }[];
  
  // Custos
  custo_mao_obra: number;
  custo_pecas: number;
  custo_total: number;
  
  // Status
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  
  // Documentação
  anexos: {
    id: string;
    nome: string;
    tipo: string;
    tamanho: number;
    url: string;
    uploaded_at: string;
  }[];
  
  // Observações
  observacoes?: string;
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface FrotaStats {
  total_viaturas: number;
  disponiveis: number;
  em_uso: number;
  em_manutencao: number;
  inativas: number;
  
  km_total_mensal: number;
  utilizacoes_mes: number;
  manutencoes_mes: number;
  
  custo_total_mes: number;
  custo_combustivel_mes: number;
  custo_manutencao_mes: number;
  
  alertas_seguro: number;
  alertas_inspecao: number;
  alertas_revisao: number;
  
  utilizacao_por_tipo: {
    tipo: string;
    quantidade: number;
    km_percorridos: number;
  }[];
  
  top_viaturas_utilizadas: {
    matricula: string;
    modelo: string;
    utilizacoes: number;
    km_percorridos: number;
  }[];
}

export interface FrotaFilters {
  status?: ViaturaStatus;
  tipo?: string;
  marca?: string;
  search?: string;
}

export interface UtilizacaoFilters {
  viatura_id?: string;
  motorista_id?: string;
  status?: 'em_curso' | 'concluida' | 'cancelada';
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface ManutencaoFilters {
  viatura_id?: string;
  tipo?: TipoManutencao;
  status?: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}