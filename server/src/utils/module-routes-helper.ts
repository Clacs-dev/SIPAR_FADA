import { Response, NextFunction } from 'express';
import { facturaSemAccao, MENSAGEM_SEM_ACCAO, nivelDeAcesso, temPermissao } from './proprio-sem-accao';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';
import { BusinessRulesService } from '../services/business-rules.service';
import { HistoryService } from '../services/history.service';
import { SequenceService } from '../services/sequence.service';
import { ValidationService } from '../services/validation.service';
import { WorkflowService } from '../services/workflow.service';
import { notifications } from '../services/notification.service';
import logger from '../config/logger';
import * as permissions from './permissions';

export const STATUS = {
  RASCUNHO: 'rascunho',
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
  CANCELADO: 'cancelado',
  ARQUIVADO: 'arquivado',
  ACTIVO: 'active',
  INACTIVO: 'inactive',
  PAGO: 'pago',
  AGENDADO: 'agendado',
} as const;

export interface ModuleConfig {
  name: string;
  displayName: string;
  model: string;
  path: string;
  collectionKey: string;
  itemKey: string;
  permissionModule: string;
  createAction: string;
  readAction: string;
  updateAction: string;
  deleteAction: string;
  approveAction: string;
  rejectAction: string;
}

function delegateFor(config: ModuleConfig): any {
  return (prisma as any)[config.model];
}

const MODEL_FIELDS: Record<string, string[]> = {
  presentation: ['id', 'createdById', 'createdByName', 'status', 'company', 'nif', 'purpose', 'department', 'desiredDate', 'contactName', 'contactEmail', 'contactPhone', 'data'],
  audience: ['id', 'createdById', 'createdByName', 'status', 'requestorName', 'requestorEmail', 'requestorPhone', 'organization', 'nif', 'purpose', 'department', 'desiredDate', 'participants', 'data'],
  pedido: ['id', 'numero', 'createdById', 'createdByName', 'titulo', 'descricao', 'importancia', 'categoria', 'direcao', 'funcao', 'status', 'atribuidoAId', 'atribuidoANome', 'abertoEm', 'resolvidoEm', 'fechadoEm', 'solucao', 'anexos', 'data'],
  acta: ['id', 'numero', 'createdById', 'createdByName', 'internalMeetingId', 'status', 'assunto', 'dataReuniao', 'horaInicio', 'horaFim', 'local', 'tipoReuniao', 'modalidade', 'departamento', 'conteudo', 'decisoes', 'participantes', 'pontosAgenda', 'anexos', 'data'],
  oficio: ['id', 'createdById', 'createdByName', 'status', 'numero', 'assunto', 'destinatario', 'departamento', 'prioridade', 'conteudo', 'anexos', 'data'],
  factura: ['id', 'createdById', 'createdByName', 'status', 'numero', 'fornecedor', 'nif', 'valor', 'moeda', 'dataEmissao', 'dataVencimento', 'descricao', 'anexos', 'paidAt', 'purchaseOrderId', 'numeroOrdem', 'numeroOrdemPagamento', 'data'],
  viatura: ['id', 'createdById', 'createdByName', 'status', 'plate', 'brand', 'model', 'year', 'type', 'currentKm', 'assignedTo', 'anexos', 'data'],
  contrato: ['id', 'createdById', 'createdByName', 'status', 'numero', 'fornecedor', 'objeto', 'valor', 'dataInicio', 'dataFim', 'anexos', 'data'],
  reclamacao: ['id', 'createdById', 'createdByName', 'status', 'codigo', 'titulo', 'descricao', 'categoria', 'prioridade', 'solicitante', 'contacto', 'anexos', 'data'],
  fornecedor: ['id', 'createdById', 'createdByName', 'status', 'nome', 'email', 'nif', 'telefone', 'endereco', 'data'],
  planejamento: ['id', 'createdById', 'createdByName', 'status', 'tipo', 'titulo', 'descricao', 'valor', 'dataInicio', 'dataFim', 'data'],
  procurement: ['id', 'createdById', 'createdByName', 'status', 'tipo', 'numero', 'fornecedorId', 'fornecedor', 'valor', 'descricao', 'data'],
  operador: ['id', 'createdById', 'createdByName', 'status', 'nome', 'email', 'telefone', 'area', 'data'],
  comunicacao: ['id', 'createdById', 'createdByName', 'status', 'titulo', 'assunto', 'mensagem', 'destinatarios', 'prioridade', 'anexos', 'data'],
  pedidoViatura: ['id', 'createdById', 'createdByName', 'status', 'viaturaId', 'motivo', 'destino', 'dataInicio', 'dataFim', 'anexos', 'data'],
  utilizacaoViatura: ['id', 'createdById', 'createdByName', 'status', 'viaturaId', 'motorista', 'destino', 'motivo', 'dataInicio', 'dataFim', 'kmInicio', 'kmFim', 'anexos', 'data'],
  manutencaoViatura: ['id', 'createdById', 'createdByName', 'status', 'viaturaId', 'tipo', 'descricao', 'fornecedor', 'valor', 'dataInicio', 'dataFim', 'anexos', 'data'],
};

function filterModelData(config: ModuleConfig, data: Record<string, any>) {
  const allowed = new Set(MODEL_FIELDS[config.model] || Object.keys(data));
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => allowed.has(key) && value !== undefined));
}

function safeJsonParse(value: any, fallback: any) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    logger.warn('Falha ao interpretar JSON, a usar valor por omissão', { error: (error as Error).message, preview: value.slice(0, 100) });
    return fallback;
  }
}

function stringify(value: any, fallback: any = {}) {
  if (value === undefined) return JSON.stringify(fallback);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function firstValue(data: Record<string, any>, fields: string[]) {
  for (const field of fields) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function applyFieldAliases(model: string, body: Record<string, any>) {
  const enriched = { ...body };
  const setMissing = (target: string, aliases: string[]) => {
    if (enriched[target] === undefined || enriched[target] === null || enriched[target] === '') {
      const value = firstValue(enriched, aliases);
      if (value !== undefined) enriched[target] = value;
    }
  };

  if (model === 'acta') {
    setMissing('assunto', ['titulo', 'title']);
    setMissing('dataReuniao', ['data_reuniao', 'meeting_date', 'meetingDate']);
    setMissing('horaInicio', ['hora_inicio', 'start_time', 'startTime']);
    setMissing('horaFim', ['hora_fim', 'end_time', 'endTime']);
    setMissing('tipoReuniao', ['tipo_reuniao', 'tipoReuniao']);
    setMissing('pontosAgenda', ['pontos_agenda', 'agendaPoints']);
    setMissing('internalMeetingId', ['reuniao_interna_id', 'internal_meeting_id']);
  }

  if (model === 'oficio') {
    setMissing('assunto', ['titulo', 'title', 'subject']);
    setMissing('destinatario', ['destinatario_nome', 'departamento_destino', 'para', 'destino', 'remetente']);
  }

  if (model === 'comunicacao') {
    setMissing('titulo', ['assunto', 'title', 'subject']);
    setMissing('mensagem', ['conteudo', 'texto', 'body', 'descricao']);
    setMissing('destinatarios', ['destinatario_nome', 'departamento_destino', 'para', 'destino']);
  }

  if (model === 'reclamacao') {
    setMissing('titulo', ['assunto', 'title', 'subject']);
    setMissing('solicitante', ['reclamante_nome', 'reclamante', 'nome']);
    setMissing('contacto', ['reclamante_email', 'email', 'telefone', 'contacto']);
  }

  if (model === 'factura') {
    setMissing('purchaseOrderId', ['purchase_order_id', 'ordem_id', 'ordemId', 'ordem_compra_id']);
    setMissing('numeroOrdem', ['numero_ordem', 'ordem_numero']);
    // "fornecedor" e "valor" sao colunas reais obrigatorias (ver
    // ValidationService), mas os formularios (interno e do portal externo)
    // so enviam fornecedor_id/fornecedor_nome e total/subtotal - sem este
    // preenchimento automatico, a criacao de qualquer factura falhava sempre
    // com "Campo obrigatorio ausente: fornecedor/valor".
    setMissing('fornecedor', ['fornecedor_nome']);
    // "valor" mantem o significado de "total da factura" (bruto + IVA, antes
    // da retencao) - ver client/src/utils/fiscal.ts.
    setMissing('valor', ['total', 'subtotal', 'valor_final']);
  }

  if (model === 'contrato') {
    setMissing('fornecedor', ['fornecedor_nome', 'contratado_nome', 'prestador', 'empresa']);
    setMissing('objeto', ['objeto', 'titulo', 'descricao', 'objectivo', 'objetivo']);
    setMissing('dataInicio', ['data_inicio']);
    setMissing('dataFim', ['data_fim']);
    setMissing('valor', ['valor_total', 'valor_mensal']);
    setMissing('nif', ['fornecedor_nif', 'contratado_documento']);
  }

  if (model === 'pedidoViatura') {
    setMissing('motivo', ['finalidade', 'descricao', 'justificacao']);
    setMissing('dataInicio', ['data_inicio_pretendida', 'data_inicio']);
    setMissing('dataFim', ['data_fim_pretendida', 'data_fim']);
    setMissing('viaturaId', ['viatura_id', 'viatura_atribuida_id']);
  }

  return enriched;
}

/**
 * Tenta descobrir o e-mail do fornecedor de uma factura, para o notificar quando ela
 * avanca para "submetido ao banco" ou "pago". Tenta, por ordem: o e-mail guardado na
 * propria factura, o Fornecedor ligado por id, e por fim o utilizador (externo) que
 * submeteu a factura.
 */
/**
 * Contacto que o fornecedor deve usar para a factura: quem publicou o pedido
 * de procurement de origem (ou, sem isso, quem o criou); facturas sem pedido
 * usam o utilizador que executou a accao.
 */
async function resolveContactoResponsavelFactura(record: any, user: { name?: string; email?: string } | null) {
  const porDefeito = user?.email ? { nome: user.name || user.email, email: user.email } : null;
  try {
    if (!record?.purchaseOrderId) return porDefeito;
    const ordem = await prisma.purchaseOrder.findUnique({ where: { id: record.purchaseOrderId } });
    if (!ordem?.procurementId) return porDefeito;
    const pedido = await prisma.procurement.findUnique({ where: { id: ordem.procurementId } });
    if (!pedido) return porDefeito;
    const dados = safeJsonParse(pedido.data, {});
    if (dados.publicado_por_email) return { nome: dados.publicado_por_nome || dados.publicado_por_email, email: dados.publicado_por_email };
    if (pedido.createdById) {
      const autor = await prisma.user.findUnique({ where: { id: pedido.createdById }, select: { name: true, email: true } });
      if (autor?.email) return { nome: autor.name, email: autor.email };
    }
  } catch (error) {
    logger.warn('Falha ao resolver o contacto responsavel da factura:', error);
  }
  return porDefeito;
}

async function resolveFacturaFornecedorEmail(record: any): Promise<string | null> {
  const data = safeJsonParse(record.data, {});
  if (data.fornecedor_email) return data.fornecedor_email;

  if (data.fornecedor_id) {
    const fornecedor = await prisma.fornecedor.findUnique({ where: { id: data.fornecedor_id } }).catch(() => null);
    if (fornecedor?.email) return fornecedor.email;
  }

  if (record.createdById) {
    const author = await prisma.user.findUnique({ where: { id: record.createdById } }).catch(() => null);
    if (author?.role === 'externo' && author.email) return author.email;
  }

  return null;
}

/**
 * Localiza o registo de Fornecedor associado a uma factura, tentando por ordem:
 * o fornecedor_id gravado na propria factura, o fornecedor da Ordem de Compra de
 * origem (fluxo Procurement) e, como ultimo recurso, uma correspondencia por NIF/nome.
 */
async function findFornecedorForFactura(record: any, data: any): Promise<any | null> {
  if (data?.fornecedor_id) {
    const fornecedor = await prisma.fornecedor.findUnique({ where: { id: data.fornecedor_id } }).catch(() => null);
    if (fornecedor) return fornecedor;
  }

  if (record.purchaseOrderId) {
    const ordem = await prisma.purchaseOrder.findUnique({ where: { id: record.purchaseOrderId } }).catch(() => null);
    if (ordem?.fornecedorId) {
      const fornecedor = await prisma.fornecedor.findUnique({ where: { id: ordem.fornecedorId } }).catch(() => null);
      if (fornecedor) return fornecedor;
    }
  }

  if (record.nif) {
    const fornecedor = await prisma.fornecedor.findFirst({ where: { nif: record.nif } }).catch(() => null);
    if (fornecedor) return fornecedor;
  }

  if (record.fornecedor && typeof record.fornecedor === 'string') {
    const fornecedor = await prisma.fornecedor.findFirst({ where: { nome: record.fornecedor } }).catch(() => null);
    if (fornecedor) return fornecedor;
  }

  return null;
}

/**
 * Resolve as coordenadas bancarias reais de uma factura a partir do fornecedor
 * (conta de utilizador ligada, quando existe, senao os dados guardados no proprio
 * registo de Fornecedor) em vez de depender de valores estaticos gravados na factura.
 * Usado sempre que a Ordem de Pagamento e gerada/actualizada, para que o documento
 * reflicta sempre os dados actuais do fornecedor.
 */
export async function resolveFornecedorBankInfo(record: any, data: any): Promise<Record<string, any> | null> {
  const fornecedor = await findFornecedorForFactura(record, data);
  if (!fornecedor) return null;

  let fornecedorUser: any = null;
  if (fornecedor.userId) {
    fornecedorUser = await prisma.user.findUnique({ where: { id: fornecedor.userId } }).catch(() => null);
  }

  const fornecedorData = safeJsonParse((fornecedor as any).data, {});

  const banco_nome = fornecedorUser?.bankName || fornecedorData.banco_nome || null;
  const banco_iban = fornecedorUser?.bankIban || fornecedorData.banco_iban || fornecedorData.iban || null;
  const banco_nib = fornecedorUser?.bankNib || fornecedorData.banco_nib || null;
  const banco_numero_conta = fornecedorUser?.bankAccountNumber || fornecedorData.banco_numero_conta || null;
  const banco_swift = fornecedorUser?.bankSwift || fornecedorData.banco_swift || null;
  const banco_cidade = fornecedorUser?.bankCity || fornecedorData.banco_cidade || null;
  const banco_pais = fornecedorUser?.bankCountry || fornecedorData.banco_pais || null;
  const banco_titular = fornecedorUser?.bankAccountHolder || fornecedorData.banco_titular || fornecedor.nome || null;

  if (!banco_nome && !banco_iban && !banco_cidade && !banco_pais) return null;

  return {
    fornecedor_id: fornecedor.id,
    banco_titular,
    banco_nome,
    banco_iban,
    banco_nib,
    banco_numero_conta,
    banco_swift,
    banco_cidade,
    banco_pais,
  };
}

/**
 * Assina automaticamente o documento "Autorização de Despesas" (PurchaseOrder
 * emitido a partir de uma factura, ver garantirOrdemCompraDaFactura) com a
 * assinatura já guardada no perfil de quem acabou de validar/aprovar a
 * factura - sem passo manual de assinatura separado, ao contrário da Ordem
 * de Pagamento. Silenciosa: se o utilizador ainda não carregou a assinatura
 * no perfil, a transição de estado continua a avançar na mesma, só sem
 * assinatura automática (fica por assinar manualmente mais tarde, se vier a
 * existir esse fluxo).
 */
/**
 * Regra: aprovar (Aprovar-DSG) e autorizar uma despesa assinam a Autorizacao
 * de Despesas com a assinatura digitalizada de quem decide - sem assinatura
 * carregada (Meu Perfil) a decisao nao pode ser tomada.
 */
export const MENSAGEM_SEM_ASSINATURA =
  'Para aprovar ou autorizar e preciso ter a assinatura digitalizada carregada em Meu Perfil: a Autorizacao de Despesas e assinada automaticamente nesse momento.';

export async function temAssinaturaDigitalizada(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { signatureImage: true } });
  return !!u?.signatureImage;
}

/**
 * Avisa (sino + e-mail) quem pode executar o proximo passo da factura, segundo
 * a matriz de Roles e Permissoes (ex: Validar Chefe DSG quando entra em
 * Pendente). O cliente toca um som quando chega uma notificacao nova.
 */
export async function notificarProximoPassoFactura(
  moduloDoPasso: string,
  tipo: string,
  mensagem: string,
  facturaId: string,
  excluirUserId?: string | null,
) {
  try {
    const roles = await prisma.role.findMany({
      where: { deletedAt: null, permissoes: { some: { module: moduloDoPasso, action: permissions.ACTIONS.APPROVE } } },
      select: { slug: true },
    });
    if (roles.length === 0) return;
    const destinatarios = await prisma.user.findMany({
      where: { role: { in: roles.map((r) => r.slug) }, status: 'active' },
      select: { id: true, email: true },
    });
    await Promise.all(
      destinatarios
        .filter((d) => d.email && d.id !== excluirUserId)
        .map((d) => notifications.createNotification(d.email, tipo, mensagem, facturaId).catch(() => null)),
    );
  } catch (error) {
    logger.warn(`Falha ao notificar o proximo passo da factura ${facturaId}:`, error);
  }
}

export async function assinarAutorizacaoDespesasAutomaticamente(purchaseOrderId: string | null | undefined, papel: 'dsg' | 'pca', user: { id: string; name: string }) {
  if (!purchaseOrderId) return;
  try {
    const signerUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!signerUser?.signatureImage) return;

    const ordem = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
    if (!ordem) return;

    const data = safeJsonParse(ordem.data, {});
    const assinaturas = (Array.isArray(data.assinaturas) ? data.assinaturas : [])
      .filter((assinatura: any) => assinatura.papel !== papel);
    assinaturas.push({
      papel,
      user_id: user.id,
      nome: user.name,
      assinatura_url: signerUser.signatureImage,
      assinado_em: new Date().toISOString(),
    });

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { data: stringify({ ...data, assinaturas }) },
    });
  } catch (error) {
    logger.warn(`Falha ao assinar automaticamente a Autorização de Despesas (ordem ${purchaseOrderId}, papel ${papel}):`, error);
  }
}

function pickNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const MIME_POR_EXTENSAO: Record<string, string> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Normaliza a lista de anexos para o formato unico esperado pelo cliente
 * ({ id, nome, tipo, tamanho, url, uploaded_at }). Historicamente os anexos
 * foram gravados de varias formas - URLs soltos (portal de facturas), so o
 * nome do ficheiro (cotacoes antigas) ou objectos com chaves name/size/fileName
 * - e o ecra mostrava "Documento"/"URL nao disponivel" para tudo o que nao
 * fosse ja um objecto com "url".
 */
export function normalizeAnexos(value: any): any[] {
  const lista = Array.isArray(value) ? value : safeJsonParse(value, []);
  if (!Array.isArray(lista)) return [];
  return lista.filter((anexo) => anexo !== null && anexo !== undefined && anexo !== '').map((anexo: any, index: number) => {
    if (typeof anexo === 'string') {
      const pareceUrl = /^(https?:)?\/\//i.test(anexo) || anexo.startsWith('/uploads/');
      const nomeBruto = anexo.split(/[\\/]/).pop() || anexo;
      let nome = nomeBruto;
      try { nome = decodeURIComponent(nomeBruto); } catch { /* manter nome original */ }
      const extensao = (nome.split('.').pop() || '').toLowerCase();
      return {
        id: `anexo-${index}-${nome}`,
        nome,
        tipo: MIME_POR_EXTENSAO[extensao] || '',
        tamanho: 0,
        url: pareceUrl ? anexo : undefined,
        uploaded_at: undefined,
      };
    }
    return {
      ...anexo,
      id: anexo.id || anexo.fileId || `anexo-${index}`,
      nome: anexo.nome || anexo.name || anexo.fileName || anexo.originalName || 'Documento',
      tipo: anexo.tipo || anexo.type || anexo.mimetype || '',
      tamanho: anexo.tamanho ?? anexo.size ?? anexo.fileSize ?? 0,
      url: anexo.url || anexo.signedUrl || anexo.path || undefined,
      uploaded_at: anexo.uploaded_at || anexo.uploadedAt,
    };
  });
}

export function recordToResource(record: any) {
  if (!record) return null;
  const data = safeJsonParse(record.data, {});
  const resource: any = {
    ...data,
    ...record,
    created_by_id: record.createdById,
    created_by_name: record.createdByName,
    updated_by_id: record.updatedById,
    updated_by_name: record.updatedByName,
    approved_by_id: record.approvedById,
    approved_by_name: record.approvedByName,
    approved_at: record.approvedAt?.toISOString?.() || record.approvedAt,
    rejected_by_id: record.rejectedById,
    rejected_by_name: record.rejectedByName,
    rejected_at: record.rejectedAt?.toISOString?.() || record.rejectedAt,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };

  for (const key of ['anexos', 'participantes', 'pontosAgenda', 'destinatarios', 'decisoes']) {
    if (resource[key] !== undefined) {
      resource[key] = safeJsonParse(resource[key], key === 'destinatarios' ? [] : []);
    }
  }
  if (resource.anexos !== undefined) resource.anexos = normalizeAnexos(resource.anexos);

  resource.data_reuniao = resource.data_reuniao || resource.dataReuniao;
  resource.hora_inicio = resource.hora_inicio || resource.horaInicio;
  resource.hora_fim = resource.hora_fim || resource.horaFim;
  resource.tipo_reuniao = resource.tipo_reuniao || resource.tipoReuniao;
  resource.pontos_agenda = resource.pontos_agenda || resource.pontosAgenda || [];
  resource.reuniao_interna_id = resource.reuniao_interna_id || resource.internalMeetingId;
  resource.created_by_id = resource.created_by_id || resource.createdById;
  resource.created_by_name = resource.created_by_name || resource.createdByName;
  // Acta: quem a criou (organizador da reuniao, ou quem a redigiu manualmente)
  // e sempre quem consta em created_by - sem isto "organizador_id" nunca
  // batia com o utilizador autenticado e ninguem conseguia editar a acta.
  resource.organizador_id = resource.organizador_id || resource.created_by_id;
  resource.organizador_nome = resource.organizador_nome || resource.created_by_name;
  resource.titulo = resource.titulo || resource.assunto;
  resource.conteudo = resource.conteudo || resource.mensagem;
  resource.fornecedor_nome = resource.fornecedor_nome || resource.fornecedor;
  resource.contratado_nome = resource.contratado_nome || resource.fornecedor;
  resource.objeto = resource.objeto || resource.titulo || resource.descricao;
  resource.data_inicio = resource.data_inicio || resource.dataInicio;
  resource.data_fim = resource.data_fim || resource.dataFim;
  resource.valor_total = resource.valor_total || resource.valor;
  resource.fornecedor_nif = resource.fornecedor_nif || resource.nif;
  resource.data_emissao = resource.data_emissao || resource.dataEmissao;
  resource.data_vencimento = resource.data_vencimento || resource.dataVencimento;
  resource.data_recebimento = resource.data_recebimento || resource.created_at;
  resource.pago_at = resource.pago_at || (resource.paidAt?.toISOString?.() || resource.paidAt) || null;
  resource.total = resource.total ?? resource.valor ?? 0;
  resource.subtotal = resource.subtotal ?? resource.valor ?? 0;
  resource.purchase_order_id = resource.purchase_order_id || resource.purchaseOrderId;
  resource.numero_ordem = resource.numero_ordem || resource.numeroOrdem;
  resource.numero_ordem_pagamento = resource.numero_ordem_pagamento || resource.numeroOrdemPagamento;
  resource.matricula = resource.matricula || resource.plate;
  resource.marca = resource.marca || resource.brand;
  resource.modelo = resource.modelo || resource.model;
  resource.ano = resource.ano ?? resource.year;
  resource.tipo = resource.tipo || resource.type;
  resource.km_atual = resource.km_atual ?? resource.currentKm ?? 0;
  resource.km_proxima_revisao = resource.km_proxima_revisao ?? resource.kmProximaRevisao;
  resource.localizacao_atual = resource.localizacao_atual || resource.localizacaoAtual || resource.assignedTo;
  resource.departamento = resource.departamento || resource.department || '';
  resource.finalidade = resource.finalidade || resource.motivo;
  resource.data_inicio_pretendida = resource.data_inicio_pretendida || resource.dataInicio;
  resource.data_fim_pretendida = resource.data_fim_pretendida || resource.dataFim;
  resource.viatura_atribuida_id = resource.viatura_atribuida_id || resource.viaturaId;
  resource.solicitante_id = resource.solicitante_id || resource.created_by_id;
  resource.solicitante_nome = resource.solicitante_nome || resource.created_by_name;
  resource.data_solicitacao = resource.data_solicitacao || resource.created_at;
  resource.prioridade = resource.prioridade || 'normal';
  resource.numero_passageiros = resource.numero_passageiros ?? resource.participants ?? 1;
  resource.lista_passageiros = resource.lista_passageiros || [];

  // Cartas de apresentacao / pedidos de audiencia: o ecra de detalhes le
  // "contact"/"email"/"phone"/"company" (nomes usados pelo formulario de
  // criacao, guardados so no JSON flexivel), mas registos mais antigos ou
  // criados directamente na base de dados (ex: seed) usam as colunas reais
  // contactName/contactEmail/contactPhone/requestorName/organization - sem
  // este alias ficavam sempre em branco no ecra.
  resource.contact = resource.contact || resource.contactName || resource.requestorName;
  resource.email = resource.email || resource.contactEmail || resource.requestorEmail;
  resource.phone = resource.phone || resource.contactPhone || resource.requestorPhone;
  resource.company = resource.company || resource.organization;
  resource.area = resource.area || resource.businessArea;
  resource.reason = resource.reason || resource.purpose;
  // O "createdAt" (camelCase) e apagado mais abaixo (fica so "created_at"),
  // mas varios ecras ainda leem item.createdAt - repor como alias evita
  // "Data de Submissao: N/A".
  resource.createdAt = resource.created_at;
  resource.updatedAt = resource.updated_at;

  for (const key of ['data', 'createdById', 'createdByName', 'updatedById', 'updatedByName', 'approvedById', 'approvedByName', 'approvedAt', 'rejectedById', 'rejectedByName', 'rejectedAt', 'createdAt', 'updatedAt']) {
    delete (resource as any)[key];
  }

  return resource;
}

async function buildCreateData(body: any, user: NonNullable<AuthenticatedRequest['user']>, config: ModuleConfig) {
  const enrichedBody = applyFieldAliases(config.model, body);
  const sequence = await SequenceService.next(config.model);
  if (sequence && enrichedBody[sequence.field] === undefined) {
    enrichedBody[sequence.field] = sequence.value;
  }

  const id = enrichedBody.id || `${config.name}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const base: any = {
    id,
    createdById: user.id === 'publico' ? undefined : user.id,
    createdByName: user.name,
    status: BusinessRulesService.normalizeStatus(
      config.model,
      enrichedBody.status || BusinessRulesService.initialStatus(config.model, config.name === 'acta' ? STATUS.RASCUNHO : STATUS.PENDENTE)
    ),
    data: stringify(enrichedBody),
  };

  const textFields = [
    'numero', 'assunto', 'destinatario', 'departamento', 'prioridade', 'conteudo',
    'fornecedor', 'nif', 'moeda', 'descricao', 'plate', 'brand', 'model', 'type',
    'assignedTo', 'objeto', 'codigo', 'titulo', 'categoria', 'solicitante',
    'contacto', 'nome', 'email', 'telefone', 'endereco', 'tipo', 'mensagem',
    'viaturaId', 'motivo', 'destino', 'company', 'purpose', 'department',
    'desiredDate', 'contactName', 'contactEmail', 'contactPhone', 'requestorName',
    'requestorEmail', 'requestorPhone', 'organization', 'dataInicio', 'dataFim',
    'dataEmissao', 'dataVencimento', 'dataReuniao', 'horaInicio', 'horaFim',
    'local', 'tipoReuniao', 'modalidade', 'direcao', 'funcao', 'importancia',
    'solucao', 'area', 'motorista', 'purchaseOrderId', 'numeroOrdem', 'numeroOrdemPagamento'
  ];

  for (const field of textFields) {
    if (enrichedBody[field] !== undefined) base[field] = String(enrichedBody[field]);
  }

  const numberFields = ['valor', 'year', 'currentKm', 'participants', 'kmInicio', 'kmFim'];
  for (const field of numberFields) {
    const value = pickNumber(enrichedBody[field]);
    if (value !== undefined) base[field] = value;
  }

  for (const field of ['anexos', 'participantes', 'pontosAgenda', 'destinatarios', 'decisoes']) {
    if (enrichedBody[field] !== undefined) base[field] = stringify(enrichedBody[field], []);
  }

  if (enrichedBody.internalMeetingId || enrichedBody.reuniao_interna_id) {
    base.internalMeetingId = enrichedBody.internalMeetingId || enrichedBody.reuniao_interna_id;
  }

  return filterModelData(config, base);
}

export async function validatePermission(
  req: AuthenticatedRequest,
  res: Response,
  module: string,
  action: string
): Promise<boolean> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Utilizador nao autenticado' });
    return false;
  }

  const userPerms = await permissions.getUserPermissions(user.role as any, user.department, undefined);
  const hasPermission = permissions.hasPermission(userPerms, module, action);

  if (!hasPermission) {
    await auditService.logAction(
      'unauthorized_access_attempt',
      'warning',
      { module, action, attemptedResource: req.originalUrl },
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: req.ip || 'unknown',
        success: false
      }
    );

    res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para esta acao' });
    return false;
  }

  return true;
}

async function denyReadAccess(req: AuthenticatedRequest, res: Response, module: string) {
  const user = req.user!;
  await auditService.logAction(
    'unauthorized_access_attempt',
    'warning',
    { module, action: 'read', attemptedResource: req.originalUrl },
    {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip || 'unknown',
      success: false
    }
  );

  return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para visualizar recursos' });
}

async function validateNotApproved(req: AuthenticatedRequest, res: Response, resource: any, config: ModuleConfig): Promise<boolean> {
  const user = req.user!;
  if (WorkflowService.isImmutableForModule(config.model, resource.status)) {
    await auditService.logAction(
      'attempt_modify_immutable_resource',
      'warning',
      { resourceType: config.name, resourceId: resource.id, resourceStatus: resource.status },
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: req.ip || 'unknown',
        success: false
      }
    );

    res.status(400).json({
      error: 'BAD_REQUEST',
      message: `${config.displayName} com status ${resource.status} nao pode ser alterado ou eliminado`
    });
    return false;
  }

  return true;
}

/**
 * Autorizacao de editar/anular/eliminar com a regra "documento proprio sem
 * accao" (ver utils/proprio-sem-accao.ts). Devolve true se pode continuar;
 * caso contrario ja respondeu (403) e regista a tentativa.
 */
async function autorizarAlteracao(
  req: AuthenticatedRequest,
  res: Response,
  config: ModuleConfig,
  existing: any,
  acaoTotal: string,
  acaoPropria: string,
  condicaoExtra: boolean = true,
): Promise<'total' | 'proprio' | false> {
  const acesso = await nivelDeAcesso(req, config.permissionModule, acaoTotal, acaoPropria);
  if (acesso === 'total') return 'total';
  // Chefe DSG: edita, anula ou elimina qualquer factura ainda Pendente (sem
  // accao), seja quem for o autor - os campos de decisao continuam vedados.
  if (config.model === 'factura' && condicaoExtra && facturaSemAccao(existing)
    && (await temPermissao(req, permissions.MODULES.PAGAMENTOS_ACCAO_VALIDAR_CHEFE_DSG, permissions.ACTIONS.APPROVE))) {
    return 'proprio';
  }
  if (acesso === null) {
    await validatePermission(req, res, config.permissionModule, acaoTotal);
    return false;
  }
  const user = req.user!;
  const ok = condicaoExtra
    && config.model === 'factura'
    && existing.createdById === user.id
    && facturaSemAccao(existing);
  if (!ok) {
    await auditService.logAction('unauthorized_access_attempt', 'warning', {
      module: config.permissionModule, action: acaoPropria, attemptedResource: req.originalUrl, motivo: 'documento_de_outro_ou_ja_com_accao',
    }, { userId: user.id, userEmail: user.email, userRole: user.role, ipAddress: req.ip || 'unknown', resourceId: existing.id, success: false });
    res.status(403).json({ error: 'FORBIDDEN', message: MENSAGEM_SEM_ACCAO });
    return false;
  }
  return 'proprio';
}

// Campos que so o fluxo de decisao (validar/aprovar/pagar/ordem de pagamento)
// pode escrever - nunca aceites numa edicao feita ao abrigo de update_own.
const CAMPOS_DE_DECISAO = /^(status|validad|aprovad|rejeitad|ordem_pagamento|numero_ordem_pagamento|paid|pago|assinatura|mapa_actividades|submetido)/;

export class ModuleRoutesHelper {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction, config: ModuleConfig) {
    try {
      const allowed = await validatePermission(req, res, config.permissionModule, config.createAction);
      if (!allowed) return;

      const user = req.user!;
      const delegate = delegateFor(config);
      const initialStatus = BusinessRulesService.normalizeStatus(
        config.model,
        req.body.status || BusinessRulesService.initialStatus(config.model, config.name === 'acta' ? STATUS.RASCUNHO : STATUS.PENDENTE)
      );
      const validationErrors = await ValidationService.validate(config.model, req.body, initialStatus || undefined);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Dados invalidos', errors: validationErrors });
      }

      const createData = await buildCreateData(req.body, user, config);
      const created = await delegate.create({ data: createData });

      // Quando a secretaria agenda directamente uma reuniao externa (carta de
      // apresentacao/audiencia) ja atribuida a um utilizador da plataforma,
      // notifica esse utilizador com o local/dia/detalhes da reuniao.
      if ((config.model === 'presentation' || config.model === 'audience') && created.status === STATUS.AGENDADO) {
        const createdData = safeJsonParse((created as any).data, {});
        const assignedToId = createdData.assigned_to_id;
        if (assignedToId) {
          const assignedUser = await prisma.user.findUnique({ where: { id: assignedToId } }).catch(() => null);
          if (assignedUser?.email) {
            const quando = createdData.preferredDate
              ? `${createdData.preferredDate}${createdData.time ? ` às ${createdData.time}` : ''}`
              : 'data a confirmar';
            const onde = createdData.meetingType === 'online'
              ? (createdData.platform || 'reunião online')
              : (createdData.location || 'local a confirmar');
            const quem = (created as any).organization || (created as any).company || 'um visitante externo';
            await notifications.createNotification(
              assignedUser.email,
              'external_meeting_scheduled',
              `A secretaria agendou uma reunião externa consigo, com ${quem}, em ${quando} (${onde}).`,
              created.id
            ).catch(() => null);
          }
        }
      }

      // Factura/proforma submetida: avisa quem a valida (Chefe DSG).
      if (config.model === 'factura' && created.status === STATUS.PENDENTE) {
        const createdData = safeJsonParse((created as any).data, {});
        const tipoDoc = createdData.tipo_documento === 'factura_proforma' ? 'factura proforma' : 'factura';
        const fornecedor = createdData.fornecedor_nome || (typeof createdData.fornecedor === 'string' ? createdData.fornecedor : createdData.fornecedor?.nome) || '';
        await notificarProximoPassoFactura(permissions.MODULES.PAGAMENTOS_ACCAO_VALIDAR_CHEFE_DSG, 'factura_submetida',
          `Nova ${tipoDoc} ${(created as any).numero || ''}${fornecedor ? ` de ${fornecedor}` : ''} submetida - aguarda validação do Chefe DSG.`.replace(/\s+/g, ' '),
          created.id, user.id);
      }

      // Comunicacao interna: se for indicado um destinatario especifico (um
      // utilizador real, escolhido por pesquisa - nunca texto livre), a
      // notificacao vai so para ele; caso contrario chega a TODOS os
      // utilizadores activos do departamento de destino.
      if (config.model === 'comunicacao') {
        const createdData = safeJsonParse((created as any).data, {});
        const destinatarios = createdData.destinatario_id
          ? await prisma.user.findMany({ where: { id: createdData.destinatario_id, status: 'active' } })
          : createdData.departamento_destino_id
            ? await prisma.user.findMany({ where: { departmentId: createdData.departamento_destino_id, status: 'active' } })
            : createdData.departamento_destino
              ? await prisma.user.findMany({ where: { department: createdData.departamento_destino, status: 'active' } })
              : [];

        const origem = createdData.departamento_origem || user.department || 'outro departamento';
        const assunto = createdData.titulo || createdData.assunto || 'Sem assunto';
        await Promise.all(
          destinatarios
            .filter((destinatario) => destinatario.id !== user.id)
            .map((destinatario) =>
              notifications.createNotification(
                destinatario.email,
                'comunicacao_recebida',
                `Nova comunicação interna de ${origem}: ${assunto}`,
                created.id
              ).catch(() => null)
            )
        );
      }

      await auditService.logAction(`${config.name}_created`, 'info', { resourceId: created.id, data: req.body }, {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: req.ip || 'unknown',
        resource: config.name,
        resourceId: created.id,
        success: true
      });

      await HistoryService.record({
        module: config.model,
        resourceId: created.id,
        action: 'created',
        statusTo: created.status,
        user,
        metadata: { displayName: config.displayName },
        newValue: recordToResource(created),
      });

      return res.status(201).json({ success: true, [config.itemKey]: recordToResource(created) });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction, config: ModuleConfig) {
    try {
      const user = req.user!;
      const userPerms = await permissions.getUserPermissions(user.role as any, user.department, undefined);
      const hasReadAll = permissions.hasPermission(userPerms, config.permissionModule, permissions.ACTIONS.READ_ALL);
      const hasReadOwn = permissions.hasPermission(userPerms, config.permissionModule, permissions.ACTIONS.READ_OWN);

      if (!hasReadAll && !hasReadOwn) {
        return denyReadAccess(req, res, config.permissionModule);
      }

      const where = {
        ...(!hasReadAll && hasReadOwn ? { createdById: user.id } : {}),
        deletedAt: null,
      };

      // Paginacao: 50 registos por pagina por defeito (limite maximo 200,
      // para nao deixar um ?limit=99999 contornar o proposito disto).
      // "?all=true" devolve a coleccao inteira sem paginar - usado pelos
      // ecrans que calculam estatisticas/totais agregados sobre TODOS os
      // registos (ex: Mapa de Impostos, Dashboard de Facturas), que
      // ficariam com numeros errados se so vissem a pagina actual.
      const DEFAULT_LIMIT = 50;
      const MAX_LIMIT = 200;
      const wantsAll = req.query.all === 'true';
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
      const limit = wantsAll
        ? undefined
        : Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT));

      const delegate = delegateFor(config);
      const total = await delegate.count({ where });
      const records = await delegate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(limit ? { skip: (page - 1) * limit, take: limit } : {}),
      });
      const resources = records.map(recordToResource);

      return res.status(200).json({
        success: true,
        [config.collectionKey]: resources,
        data: resources,
        pagination: {
          page: wantsAll ? 1 : page,
          limit: limit ?? total,
          total,
          totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction, config: ModuleConfig) {
    try {
      const user = req.user!;
      const userPerms = await permissions.getUserPermissions(user.role as any, user.department, undefined);
      const hasReadAll = permissions.hasPermission(userPerms, config.permissionModule, permissions.ACTIONS.READ_ALL);
      const hasReadOwn = permissions.hasPermission(userPerms, config.permissionModule, permissions.ACTIONS.READ_OWN);
      if (!hasReadAll && !hasReadOwn) {
        return denyReadAccess(req, res, config.permissionModule);
      }

      const record = await delegateFor(config).findUnique({ where: { id: req.params.id } });
      if (!record || record.deletedAt) {
        return res.status(404).json({ error: 'NOT_FOUND', message: `${config.displayName} nao encontrado` });
      }

      if (!hasReadAll && hasReadOwn && record.createdById !== user.id) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para visualizar este recurso' });
      }

      const resource = recordToResource(record);
      const [history, workflows] = await Promise.all([
        HistoryService.list(config.model, record.id),
        WorkflowService.list(config.model, record.id),
      ]);

      return res.status(200).json({ success: true, [config.itemKey]: resource, data: resource, history, workflows });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction, config: ModuleConfig) {
    try {
      if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Utilizador nao autenticado' });
      const user = req.user!;
      const existing = await delegateFor(config).findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        return res.status(404).json({ error: 'NOT_FOUND', message: `${config.displayName} nao encontrado` });
      }

      const acesso = await autorizarAlteracao(req, res, config, existing, config.updateAction, permissions.ACTIONS.UPDATE_OWN);
      if (!acesso) return;
      if (acesso === 'proprio') {
        for (const campo of Object.keys(req.body || {})) {
          if (CAMPOS_DE_DECISAO.test(campo)) delete req.body[campo];
        }
      }

      const active = await validateNotApproved(req, res, existing, config);
      if (!active) return;

      const mergedData = { ...safeJsonParse(existing.data, {}), ...req.body };
      const normalizedStatus = BusinessRulesService.normalizeStatus(config.model, mergedData.status || existing.status);
      if (normalizedStatus) mergedData.status = normalizedStatus;
      const validationErrors = await ValidationService.validate(config.model, mergedData, normalizedStatus || existing.status);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Dados invalidos', errors: validationErrors });
      }

      const updateData = await buildCreateData(mergedData, user, config);
      delete updateData.id;
      delete updateData.createdById;
      delete updateData.createdByName;
      updateData.data = stringify(mergedData);

      const updated = await delegateFor(config).update({ where: { id: req.params.id }, data: updateData });

      await auditService.logAction(`${config.name}_updated`, 'info', { resourceId: req.params.id, changes: req.body }, {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: req.ip || 'unknown',
        resource: config.name,
        resourceId: req.params.id,
        oldValue: recordToResource(existing),
        newValue: recordToResource(updated),
        success: true
      });

      await HistoryService.record({
        module: config.model,
        resourceId: req.params.id,
        action: 'updated',
        statusFrom: existing.status,
        statusTo: updated.status,
        user,
        metadata: { changes: req.body },
        oldValue: recordToResource(existing),
        newValue: recordToResource(updated),
      });

      return res.status(200).json({ success: true, [config.itemKey]: recordToResource(updated), data: recordToResource(updated) });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction, config: ModuleConfig) {
    try {
      if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Utilizador nao autenticado' });
      const user = req.user!;
      const existing = await delegateFor(config).findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        return res.status(404).json({ error: 'NOT_FOUND', message: `${config.displayName} nao encontrado` });
      }

      const acesso = await autorizarAlteracao(req, res, config, existing, config.deleteAction, permissions.ACTIONS.DELETE_OWN);
      if (!acesso) return;

      const active = await validateNotApproved(req, res, existing, config);
      if (!active) return;

      // Eliminacao suave (soft-delete): o registo vai para a Lixeira em vez de
      // ser apagado de imediato, e pode ser restaurado la (Administrador do
      // Sistema) ou eliminado definitivamente.
      await delegateFor(config).update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), deletedById: user.id, deletedByName: user.name },
      });
      await HistoryService.record({
        module: config.model,
        resourceId: req.params.id,
        action: 'deleted',
        statusFrom: existing.status,
        user,
        oldValue: recordToResource(existing),
      });

      await auditService.logAction(`${config.name}_deleted`, 'warning', { resourceId: req.params.id }, {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: req.ip || 'unknown',
        resource: config.name,
        resourceId: req.params.id,
        success: true
      });

      return res.status(200).json({ success: true, message: `${config.displayName} eliminado com sucesso` });
    } catch (error) {
      next(error);
    }
  }

  static async setStatus(req: AuthenticatedRequest, res: Response, next: NextFunction, config: ModuleConfig, status: string) {
    try {
      const nextStatus = BusinessRulesService.normalizeStatus(config.model, status) || status;
      const action = nextStatus === STATUS.APROVADO || nextStatus === 'ativo'
        ? config.approveAction
        : nextStatus === STATUS.REJEITADO || nextStatus === 'cancelada'
          ? config.rejectAction
          : config.updateAction;
      if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Utilizador nao autenticado' });
      const user = req.user!;
      const existing = await delegateFor(config).findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: 'NOT_FOUND', message: `${config.displayName} nao encontrado` });
      }

      // Com update_own so se pode ANULAR (cancelado) o proprio documento ainda
      // sem accao - nunca validar, aprovar, rejeitar ou pagar.
      // Factura: cada passo do fluxo (Aprovar-DSG, Autorizar/Rejeitar, Pagamento)
      // e uma permissao propria na matriz de Roles e Permissoes - so quem a
      // tem executa esse passo, seja qual for o role.
      const passos = config.model === 'factura' ? permissions.PASSO_DA_FACTURA[nextStatus] : undefined;
      let acesso: any;
      if (passos) {
        const perms = await permissions.getUserPermissions(user.role as any, user.department, undefined);
        acesso = passos.some((modulo) => permissions.hasPermission(perms, modulo, permissions.ACTIONS.APPROVE));
        if (!acesso) {
          await auditService.logAction('unauthorized_access_attempt', 'warning', {
            module: passos.join('|'), action: 'approve', attemptedResource: req.originalUrl, passo: nextStatus,
          }, { userId: user.id, userEmail: user.email, userRole: user.role, ipAddress: req.ip || 'unknown', resourceId: existing.id, success: false });
          return res.status(403).json({ error: 'FORBIDDEN', message: 'O seu perfil nao tem permissao para este passo da factura (ver Roles e Permissoes).' });
        }
      } else {
        acesso = await autorizarAlteracao(
          req, res, config, existing, action, permissions.ACTIONS.UPDATE_OWN, nextStatus === STATUS.CANCELADO,
        );
      }
      if (!acesso) return;

      if (config.model === 'factura' && (nextStatus === 'validado' || nextStatus === STATUS.APROVADO)
        && !(await temAssinaturaDigitalizada(user.id))) {
        return res.status(400).json({ error: 'ASSINATURA_EM_FALTA', message: MENSAGEM_SEM_ASSINATURA });
      }

      if (existing.status === STATUS.APROVADO && nextStatus === STATUS.REJEITADO) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: `${config.displayName} aprovado nao pode ser rejeitado` });
      }

      const transition = BusinessRulesService.validateTransition(config.model, existing.status, nextStatus);
      if (!transition.allowed) {
        return res.status(400).json({
          error: 'BAD_REQUEST',
          message: transition.message || `${config.displayName} nao permite esta transicao de estado`
        });
      }

      const data = safeJsonParse(existing.data, {});

      // A Ordem de Pagamento tem de existir, e estar assinada pelo Presidente
      // E pelo Administrador, antes de submeter ao banco (e, por consequencia,
      // antes de pagar - "pago" so e alcancavel a partir de
      // "submetido_ao_banco"). Sem isto seria possivel saltar este passo
      // chamando a API directamente, contornando o botao da interface.
      if (config.model === 'factura' && nextStatus === 'submetido_ao_banco') {
        if (!(existing as any).numeroOrdemPagamento) {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'Gere a Ordem de Pagamento antes de submeter a factura ao banco.'
          });
        }
        const assinaturasOP = Array.isArray(data.ordem_pagamento?.assinaturas) ? data.ordem_pagamento.assinaturas : [];
        const temPresidente = assinaturasOP.some((a: any) => a.papel === 'presidente');
        const temAdministrador = assinaturasOP.some((a: any) => a.papel === 'administrador');
        if (!temPresidente || !temAdministrador) {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'A Ordem de Pagamento precisa das assinaturas do Presidente e do Administrador antes de ser submetida ao banco.'
          });
        }
      }
      // A transicao para "pago" tem de gravar a data de pagamento na coluna real
      // (paidAt), nao so no JSON flexivel - e o que "Data de Pagamento"/relatorios
      // e o filtro de facturas em atraso usam para saber que foi paga e quando.
      const extraColumns: any = {};
      if (config.model === 'factura' && nextStatus === STATUS.PAGO && !(existing as any).paidAt) {
        extraColumns.paidAt = new Date();
      }
      // Factura: regista quem validou/aprovou/rejeitou - sem isto o card
      // mostrava sempre "Validado por N/A". (O historico de accoes fica em
      // DocumentHistory, registado mais abaixo, e e servido por /:id/historico.)
      const auditoriaFactura: Record<string, any> = {};
      if (config.model === 'factura') {
        const agora = new Date().toISOString();
        const comentario = req.body?.comentario || req.body?.motivo || undefined;
        if (nextStatus === 'validado_chefe_dsg') {
          Object.assign(auditoriaFactura, { validado_chefe_dsg_por_id: user.id, validado_chefe_dsg_por_nome: user.name, validado_chefe_dsg_at: agora, validacao_chefe_dsg_comentario: comentario });
        } else if (nextStatus === 'validado') {
          Object.assign(auditoriaFactura, { validado_por_id: user.id, validado_por_nome: user.name, validado_at: agora, validacao_comentario: comentario });
        } else if (nextStatus === STATUS.APROVADO) {
          Object.assign(auditoriaFactura, { aprovado_por_id: user.id, aprovado_por_nome: user.name, aprovado_at: agora, aprovacao_comentario: comentario });
        } else if (nextStatus === STATUS.REJEITADO) {
          Object.assign(auditoriaFactura, { rejeitado_por_id: user.id, rejeitado_por_nome: user.name, rejeitado_at: agora, rejeicao_motivo: comentario });
        }
      }
      let updated = await delegateFor(config).update({
        where: { id: req.params.id },
        data: {
          status: nextStatus,
          ...extraColumns,
          data: stringify({ ...data, ...req.body, ...auditoriaFactura, status: nextStatus }),
        }
      });

      // Factura normal validada: emite a sua Ordem de Compra (as do Procurement
      // ja tem a ordem de origem). Import dinamico - o servico importa este modulo.
      if (config.model === 'factura' && nextStatus === 'validado' && !(updated as any).purchaseOrderId) {
        const { garantirOrdemCompraDaFactura } = await import('../services/procurement-factura.service');
        await garantirOrdemCompraDaFactura(req.params.id, user)
          .then(async () => { updated = await delegateFor(config).findUnique({ where: { id: req.params.id } }); })
          .catch((error) => logger.error(`Falha ao emitir Autorização de Despesas da factura ${req.params.id}:`, error));
      }
      // Assinatura automática do DSG na Autorização de Despesas, no mesmo
      // momento em que valida a factura - sem passo de assinatura à parte.
      if (config.model === 'factura' && nextStatus === 'validado') {
        await assinarAutorizacaoDespesasAutomaticamente((updated as any).purchaseOrderId, 'dsg', { id: user.id, name: user.name });
      }

      // Sincronizacao Gestao de Pagamento: assim que a factura fica aprovada, gera
      // automaticamente o numero da Ordem de Pagamento (despacho/conta a debitar ficam
      // por preencher e podem ser completados depois no ecra de detalhe da factura).
      if (config.model === 'factura' && nextStatus === STATUS.APROVADO && !(updated as any).numeroOrdemPagamento) {
        const facturaData = safeJsonParse((updated as any).data, {});
        const bancoInfo = await resolveFornecedorBankInfo(updated, facturaData).catch(() => null);
        const numeroOrdemPagamento = `OP/N.º ${1000 + Math.floor(Math.random() * 9000)}/${new Date().getFullYear()}`;
        updated = await delegateFor(config).update({
          where: { id: req.params.id },
          data: {
            numeroOrdemPagamento,
            data: stringify({
              ...facturaData,
              ...(bancoInfo || {}),
              ordem_pagamento: {
                numero_despacho: null,
                conta_debito: null,
                banco_destino_cidade: bancoInfo?.banco_cidade || facturaData.banco_cidade || null,
                banco_destino_pais: bancoInfo?.banco_pais || facturaData.banco_pais || null,
                gerada_em: new Date().toISOString(),
                gerada_por_id: user.id,
                gerada_por_nome: user.name,
                assinaturas: [],
              },
            }),
          }
        });
      }

      // Assinatura automática do PCA na Autorização de Despesas, no mesmo
      // momento em que autoriza a despesa - sem passo de assinatura à parte.
      if (config.model === 'factura' && nextStatus === STATUS.APROVADO) {
        await assinarAutorizacaoDespesasAutomaticamente((updated as any).purchaseOrderId, 'pca', { id: user.id, name: user.name });
      }

      // Avisa quem executa o passo seguinte do fluxo (som + sino no cliente).
      if (config.model === 'factura') {
        const numero = (updated as any).numero || req.params.id;
        if (nextStatus === STATUS.PENDENTE) {
          await notificarProximoPassoFactura(permissions.MODULES.PAGAMENTOS_ACCAO_VALIDAR_CHEFE_DSG, 'factura_submetida',
            `A factura ${numero} foi submetida e aguarda validação do Chefe DSG.`, req.params.id, user.id);
        } else if (nextStatus === 'validado_chefe_dsg') {
          await notificarProximoPassoFactura(permissions.MODULES.PAGAMENTOS_ACCAO_APROVAR_DSG, 'factura_validada_chefe_dsg',
            `A factura ${numero} foi validada pelo Chefe DSG (${user.name}) e aguarda o Aprovar-DSG.`, req.params.id, user.id);
        } else if (nextStatus === 'validado') {
          await notificarProximoPassoFactura(permissions.MODULES.PAGAMENTOS_ACCAO_AUTORIZAR, 'factura_aprovada_dsg',
            `A factura ${numero} foi aprovada pela DSG e aguarda a Autorização de Despesas.`, req.params.id, user.id);
        }
      }

      // Notifica o fornecedor quando a factura avanca para submissao ao banco ou pagamento.
      if (config.model === 'factura' && (nextStatus === 'submetido_ao_banco' || nextStatus === STATUS.PAGO)) {
        const fornecedorEmail = await resolveFacturaFornecedorEmail(updated);
        if (fornecedorEmail) {
          const numero = (updated as any).numero || req.params.id;
          const mensagem = nextStatus === STATUS.PAGO
            ? `A sua factura ${numero} foi paga.`
            : `A sua factura ${numero} foi submetida ao banco para pagamento.`;
          await notifications.createNotification(
            fornecedorEmail,
            nextStatus === STATUS.PAGO ? 'factura_paga' : 'factura_submetida_banco',
            mensagem,
            req.params.id,
            undefined,
            await resolveContactoResponsavelFactura(updated, user),
          ).catch(() => null);
        }
      }

      await auditService.logAction(`${config.name}_${nextStatus}`, 'info', { resourceId: req.params.id, oldStatus: existing.status, newStatus: nextStatus }, {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: req.ip || 'unknown',
        resource: config.name,
        resourceId: req.params.id,
        oldValue: recordToResource(existing),
        newValue: recordToResource(updated),
        success: true
      });

      await WorkflowService.registerDecision({
        module: config.model,
        resourceId: req.params.id,
        statusFrom: existing.status,
        statusTo: nextStatus,
        user,
        comment: req.body?.comentario || req.body?.comment || req.body?.motivo,
        metadata: req.body,
      });

      await HistoryService.record({
        module: config.model,
        resourceId: req.params.id,
        action: 'status_changed',
        statusFrom: existing.status,
        statusTo: nextStatus,
        user,
        comment: req.body?.comentario || req.body?.comment || req.body?.motivo,
        metadata: req.body,
        oldValue: recordToResource(existing),
        newValue: recordToResource(updated),
      });

      return res.status(200).json({ success: true, [config.itemKey]: recordToResource(updated), data: recordToResource(updated) });
    } catch (error) {
      next(error);
    }
  }

  static async history(req: AuthenticatedRequest, res: Response, next: NextFunction, config: ModuleConfig) {
    try {
      const user = req.user!;
      const userPerms = await permissions.getUserPermissions(user.role as any, user.department, undefined);
      const hasReadAll = permissions.hasPermission(userPerms, config.permissionModule, permissions.ACTIONS.READ_ALL);
      const hasReadOwn = permissions.hasPermission(userPerms, config.permissionModule, permissions.ACTIONS.READ_OWN);
      if (!hasReadAll && !hasReadOwn) {
        return denyReadAccess(req, res, config.permissionModule);
      }

      const existing = await delegateFor(config).findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: 'NOT_FOUND', message: `${config.displayName} nao encontrado` });
      }

      if (!hasReadAll && hasReadOwn && existing.createdById !== user.id) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para visualizar este recurso' });
      }

      const [history, workflows] = await Promise.all([
        HistoryService.list(config.model, req.params.id),
        WorkflowService.list(config.model, req.params.id),
      ]);

      return res.status(200).json({ success: true, history, workflows });
    } catch (error) {
      next(error);
    }
  }
}
