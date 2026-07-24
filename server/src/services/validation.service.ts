import prisma from '../config/database';
import { BusinessRulesService } from './business-rules.service';

interface ValidationError {
  field: string;
  message: string;
}

const REQUIRED_FIELDS_BY_MODULE: Record<string, string[]> = {
  presentation: ['company', 'purpose'],
  audience: ['requestorName', 'purpose'],
  pedido: ['titulo', 'descricao', 'importancia'],
  acta: ['assunto'],
  oficio: ['assunto', 'destinatario'],
  factura: ['fornecedor', 'valor'],
  viatura: ['plate', 'brand', 'model'],
  contrato: ['fornecedor', 'objeto'],
  reclamacao: ['titulo', 'descricao'],
  fornecedor: ['nome'],
  planejamento: ['titulo', 'tipo'],
  procurement: ['tipo', 'descricao'],
  operador: ['nome'],
  comunicacao: ['titulo', 'mensagem'],
  pedidoViatura: ['motivo', 'destino'],
  utilizacaoViatura: ['viaturaId', 'destino'],
  manutencaoViatura: ['viaturaId', 'tipo', 'descricao'],
};

const FIELD_ALIASES_BY_MODULE: Record<string, Record<string, string[]>> = {
  acta: {
    assunto: ['assunto', 'titulo', 'title'],
  },
  oficio: {
    assunto: ['assunto', 'titulo', 'title', 'subject'],
    destinatario: ['destinatario', 'destinatario_nome', 'departamento_destino', 'para', 'destino', 'remetente'],
  },
  reclamacao: {
    titulo: ['titulo', 'assunto', 'title', 'subject'],
    descricao: ['descricao', 'mensagem', 'conteudo', 'detalhes'],
  },
  contrato: {
    fornecedor: ['fornecedor', 'fornecedor_nome', 'contratado_nome', 'prestador', 'empresa'],
    objeto: ['objeto', 'titulo', 'descricao', 'objectivo', 'objetivo'],
    dataInicio: ['dataInicio', 'data_inicio'],
    dataFim: ['dataFim', 'data_fim'],
  },
  pedidoViatura: {
    motivo: ['motivo', 'finalidade', 'descricao', 'justificacao'],
    destino: ['destino'],
  },
  comunicacao: {
    titulo: ['titulo', 'assunto', 'title', 'subject'],
    mensagem: ['mensagem', 'conteudo', 'texto', 'body', 'descricao'],
  },
};

function hasValue(value: any) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function hasRequiredField(module: string, payload: Record<string, any>, field: string) {
  const aliases = FIELD_ALIASES_BY_MODULE[module]?.[field] || [field];
  return aliases.some((alias) => hasValue(payload[alias]));
}

export class ValidationService {
  static async validate(module: string, payload: Record<string, any>, status?: string): Promise<ValidationError[]> {
    const configuredRules = await prisma.validationRule.findMany({
      where: {
        module,
        active: true,
        OR: [{ status: null }, { status: status || null }],
      }
    }).catch(() => []);

    const businessRequired = BusinessRulesService.requiredFields(module, status);
    const requiredFields = configuredRules.length > 0
      ? configuredRules.filter((rule) => rule.required).map((rule) => ({ field: rule.field, message: rule.message }))
      : (businessRequired || REQUIRED_FIELDS_BY_MODULE[module] || []).map((field) => ({ field, message: undefined }));

    return requiredFields
      .filter((rule) => !hasRequiredField(module, payload, rule.field))
      .map((rule) => ({
        field: rule.field,
        message: rule.message || `Campo obrigatorio ausente: ${rule.field}`,
      }));
  }
}
