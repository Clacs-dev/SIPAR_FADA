export interface Participante {
  usuario_id?: string;
  nome: string;
  cargo?: string;
  departamento?: string;
  presente: boolean;
}

export interface Acta {
  id: string;
  numero: string;
  assunto: string;
  data_reuniao: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  local: string | null;
  tipo_reuniao: 'ordinaria' | 'extraordinaria';
  status: 'rascunho' | 'em_revisao' | 'aprovada' | 'arquivada';
  
  // Conteúdo
  pauta: string | null;
  conteudo: string | null;
  decisoes: string | null;
  
  // Participantes
  participantes: Participante[];
  
  // Departamento
  departamento: string | null;
  
  // Anexos
  anexos: Array<{
    id: string;
    nome: string;
    url: string;
    tipo: string;
    tamanho: number;
  }>;
  
  // Metadados
  created_at: string;
  updated_at: string;
  created_by_id: string;
  created_by_name: string;
  
  // Campos de estado
  enviado_revisao_at?: string;
  enviado_revisao_by_id?: string;
  enviado_revisao_by_name?: string;
  
  aprovado_at?: string;
  aprovado_by_id?: string;
  aprovado_by_name?: string;
  comentario_aprovacao?: string;
  
  rejeitado_at?: string;
  rejeitado_by_id?: string;
  rejeitado_by_name?: string;
  motivo_rejeicao?: string;
  
  arquivado_at?: string;
  arquivado_by_id?: string;
  arquivado_by_name?: string;
}
