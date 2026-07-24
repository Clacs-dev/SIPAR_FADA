/**
 * TIPOS DO MÓDULO DE GESTÃO DE RECLAMAÇÕES
 * Sistema completo de registro, acompanhamento e resolução de reclamações
 * Workflow: Registado → Em Resolução → Resolvido → Fechado
 * 
 * FLUXO:
 * 1. Usuário externo cria reclamação → Registado
 * 2. Admin coloca em resolução → Em Resolução  
 * 3. Admin resolve → Resolvido
 * 4. Usuário externo fecha → Fechado
 */

export type StatusReclamacao = 
  | 'registrado'       // Inicial - após cadastro pelo usuário externo
  | 'em_resolucao'     // Admin assumiu e está trabalhando
  | 'resolvido'        // Admin resolveu, aguardando confirmação do usuário
  | 'fechado';         // Usuário externo confirmou e fechou

export type Reclamacao = {
  id: string;
  numero: string;                // Gerado automaticamente (ex: REC-2024-0001)
  assunto: string;
  descricao: string;
  prioridade: PrioridadeReclamacao;
  status: StatusReclamacao;
  
  // Reclamante - Apenas email obrigatório
  reclamante_email: string;
  
  // Atribuição
  responsavel_id?: string;
  responsavel_nome?: string;
  atribuido_em?: string;
  em_resolucao_por_id?: string;      // Admin que colocou em resolução
  em_resolucao_por_nome?: string;
  em_resolucao_em?: string;
  
  // Resolução
  resolucao?: string;
  resolvido_por_id?: string;
  resolvido_por_nome?: string;
  resolvido_em?: string;
  
  // Fechamento
  fechado_por_id?: string;
  fechado_por_nome?: string;
  fechado_em?: string;
  avaliacao?: number;              // 1-5
  comentario_fechamento?: string;
  
  // Histórico de ações
  acoes?: AcaoReclamacao[];
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  updated_by_id?: string;
  updated_by_name?: string;
};

export interface ReclamacaoStats {
  total: number;
  registadas: number;
  em_resolucao: number;
  resolvidas: number;
  fechadas: number;
  tempo_medio_resolucao: number; // em horas
  avaliacao_media: number; // 1-5
  por_prioridade: Record<PrioridadeReclamacao, number>;
}

/**
 * PRIORIDADE - Define o nível de urgência da reclamação
 */
export type PrioridadeReclamacao = 'baixa' | 'media' | 'alta' | 'urgente';

/**
 * HISTÓRICO DE AÇÕES
 */
export interface AcaoReclamacao {
  id: string;
  tipo: 'comentario' | 'status_change' | 'atribuicao' | 'resolucao' | 'fechamento';
  descricao: string;
  usuario_id: string;
  usuario_nome: string;
  created_at: string;
  anexos?: string[];
}

/**
 * OPERADOR - Entidade que submete reclamações
 */
export interface Operador {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  ativo: boolean;
  
  // Estatísticas
  total_reclamacoes?: number;
  reclamacoes_abertas?: number;
  
  // Auditoria
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  updated_by_id?: string;
  updated_by_name?: string;
}

// Tipos legados mantidos para compatibilidade com stats
export type TipoReclamacao = 'cliente' | 'fornecedor' | 'interno' | 'qualidade' | 'servico' | 'produto';
export type TipoUtilizador = 'interno' | 'externo';