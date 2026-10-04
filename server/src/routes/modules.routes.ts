import { Router, Response, NextFunction } from 'express';
import { autorDaCotacao, cotacaoSemAccao, fornecedorSemAccao, MENSAGEM_SEM_ACCAO, nivelDeAcesso, pedidoSemAccao, temPermissao } from '../utils/proprio-sem-accao';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ModuleRoutesHelper, ModuleConfig, STATUS, resolveFornecedorBankInfo, recordToResource, normalizeAnexos } from '../utils/module-routes-helper';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth';
import { requireLicenseModule } from '../middlewares/license';
import { MeetingLinkService } from '../services/meeting-link.service';
import { emailService } from '../services/email.service';
import { fornecedorCredentialsEmailHtml, cotacaoConviteEmailHtml, actaAprovadaEmailHtml } from '../services/email-templates';
import { notifications } from '../services/notification.service';
import { SequenceService } from '../services/sequence.service';
import { HistoryService } from '../services/history.service';
import { montarFacturaDaOrdem, montarDocumentoOrdemCompra, garantirOrdemCompraDaFactura } from '../services/procurement-factura.service';
import logger from '../config/logger';
import { auditService } from '../services/audit.service';
import prisma from '../config/database';

const router = Router();

// Limite dedicado para os endpoints publicos/nao-autenticados de submissao
// (/publica) - mais apertado que o limite global, ja que nao exigem nenhuma
// credencial e sao um alvo obvio de spam/abuso.
const publicSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Demasiados pedidos a partir deste IP. Tente novamente mais tarde.' },
});

/**
 * Gera uma password temporaria legivel (ex: "Kx7m-Pq2r") para novas contas de fornecedor.
 */
function generateTempPassword(): string {
  const raw = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}${Math.floor(Math.random() * 10)}`;
}

/**
 * Garante que o fornecedor tem uma conta de utilizador (role externo) associada para poder
 * submeter facturas/cotações, criando-a se necessário e enviando as credenciais por e-mail.
 * Reutiliza a conta existente se já houver um utilizador com o mesmo e-mail.
 */
async function ensureFornecedorAccount(fornecedorId: string, nome: string, email?: string | null) {
  if (!email) return null;

  const normalizedEmail = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const tempPassword = generateTempPassword();

  if (!user) {
    const hashed = await bcrypt.hash(tempPassword, 10);
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
        name: nome || 'Fornecedor',
        role: 'externo',
        organization: nome || null,
        department: 'Fornecedor',
        position: 'Fornecedor Externo',
        status: 'active',
      },
    });

    await prisma.fornecedor.update({ where: { id: fornecedorId }, data: { userId: user.id } }).catch(() => null);

    await emailService.sendEmail({
      to: normalizedEmail,
      subject: 'As suas credenciais de acesso ao Portal de Fornecedores - FADA',
      html: fornecedorCredentialsEmailHtml(nome || 'Fornecedor', normalizedEmail, tempPassword),
    }).catch((error) => logger.error('Falha ao enviar e-mail de credenciais ao fornecedor:', error));

    return { userId: user.id, created: true };
  }

  // Ja existe uma conta com este e-mail: apenas liga o fornecedor a ela, sem alterar a password.
  await prisma.fornecedor.update({ where: { id: fornecedorId }, data: { userId: user.id } }).catch(() => null);
  return { userId: user.id, created: false };
}

function safeParse(value: any, fallback: any = {}) {
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

function numberValue(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Assinatura digital reutilizada em qualquer accao do sistema que deva ficar
 * assinada (despacho, delegacao/redelegacao, aprovacao, etc.): usa sempre a
 * imagem de assinatura carregada pelo proprio utilizador em "Meu Perfil",
 * nunca uma assinatura desenhada/gerada na hora. Lanca um erro amigavel se o
 * utilizador ainda nao carregou a sua assinatura.
 */
async function requireSignature(userId: string) {
  const signer = await prisma.user.findUnique({ where: { id: userId } });
  if (!signer?.signatureImage) {
    const error: any = new Error('Carregue a sua assinatura em "Meu Perfil" antes de continuar.');
    error.status = 400;
    error.code = 'SIGNATURE_REQUIRED';
    throw error;
  }
  return {
    user_id: signer.id,
    nome: signer.name,
    cargo: signer.position || signer.role,
    assinatura_url: signer.signatureImage,
    assinado_em: new Date().toISOString(),
  };
}

// Vocabulario canonico e UNICO do fluxo real de Pedido de Compra (o que o
// frontend de Compras efetivamente usa via /procurement/pedidos/*). Existe um
// vocabulario diferente em BusinessRulesService.RULES.procurement, herdado do
// CRUD generico deste mesmo modulo — mas o frontend nunca chama esse caminho
// (confirmado: client/src/hooks/use-procurement.tsx so usa /pedidos, /ordens,
// /fornecedores, /stats). Nao unificar os dois aqui para nao arriscar dados
// historicos ja gravados com o vocabulario antigo; este array e a fonte de
// verdade para o que o PUT /pedidos/:id pode aceitar como novo status.
const PROCUREMENT_PEDIDO_STATUSES = [
  'criado', 'aguardando_cotacoes', 'em_cotacao', 'em_analise',
  'validado', 'concluido', 'ordem_emitida', 'cancelado',
];

// Fonte unica de "papel de assinatura" -> role exigido para assinar. Cada
// documento (Ordem de Pagamento, Acta) so aceita um subconjunto destes papeis
// (ver ALLOWED_SIGNATURE_PAPEIS abaixo), mas todos resolvem o role a partir
// deste unico mapa - evita que "presidente" acabe a apontar para roles
// diferentes em documentos diferentes por deriva entre copias duplicadas.
const SIGNATURE_ROLE_MAP: Record<string, string> = {
  presidente: 'gabinete_pca',
  administrador: 'gabinete_administrador',
  secretario: 'secretaria',
};

const ALLOWED_SIGNATURE_PAPEIS: Record<string, string[]> = {
  ordemPagamento: ['presidente', 'administrador'],
  acta: ['presidente', 'secretario'],
};

function procurementToPedido(record: any, cotacoes: any[] = []) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    numero: record.numero,
    titulo: data.titulo || record.descricao || record.tipo || 'Pedido de compra',
    descricao: record.descricao || data.descricao || '',
    status: record.status,
    prioridade: data.prioridade || 'normal',
    departamento_solicitante: data.departamento_solicitante || data.departamento || '',
    itens: safeParse(data.itens || data.items, []),
    cotacoes,
    total_cotacoes: cotacoes.filter((c: any) => c?.status !== 'anulada').length,
    fornecedor_vencedor_id: record.fornecedorId,
    fornecedor_vencedor_nome: record.fornecedor,
    valor_aprovado: record.valor,
    created_by_id: record.createdById,
    created_by_name: record.createdByName,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

function fornecedorToResource(record: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    nome: record.nome,
    email: record.email,
    nif: record.nif,
    telefone: record.telefone,
    endereco: record.endereco,
    situacao: record.status === 'inactive' ? 'inativo' : record.status || data.situacao || 'ativo',
    user_id: record.userId || null,
    tem_conta: !!record.userId,
    created_by_id: record.createdById,
    created_by_name: record.createdByName,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

function cotacaoToResource(record: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    pedido_id: record.procurementId,
    fornecedor_id: record.fornecedorId,
    fornecedor_nome: record.fornecedor,
    fornecedor_email: record.email,
    valor_total: record.valor,
    // "anulada" = retirada (nao conta para analise/ranking); ver rotas
    // /cotacoes/:cotacaoId (editar, anular, eliminar).
    status: record.status,
    selected: record.selected,
    submitted_at: record.createdAt?.toISOString?.() || record.createdAt,
    anexos: normalizeAnexos(safeParse(record.anexos, [])),
  };
}

function facturaToResource(record: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    numero: record.numero,
    status: record.status,
    fornecedor: record.fornecedor,
    nif: record.nif,
    valor: record.valor,
    moeda: record.moeda,
    dataEmissao: record.dataEmissao,
    dataVencimento: record.dataVencimento,
    descricao: record.descricao,
    anexos: normalizeAnexos(safeParse(record.anexos, [])),
    numero_ordem: record.numeroOrdem,
    numero_ordem_pagamento: record.numeroOrdemPagamento,
    created_by_id: record.createdById,
    created_by_name: record.createdByName,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

/**
 * Calcula os scores comparativos de cada cotacao de um pedido (preco,
 * atendimento aos itens pedidos e prazo de entrega), relativos as restantes
 * cotacoes recebidas para o mesmo pedido. Sem isto os campos score_preco/
 * percentual_atendimento/score_prazo mostrados no ecra de comparacao ficavam
 * sempre a 0, por nunca serem calculados em lado nenhum.
 */
function computeCotacaoScores(cotacoes: any[], totalItensPedido: number) {
  const precosValidos = cotacoes.map((c) => c.valor_total ?? c.valor).filter((v) => typeof v === 'number' && v > 0);
  const menorPreco = precosValidos.length > 0 ? Math.min(...precosValidos) : 0;

  const prazosMedios = cotacoes.map((cotacao) => {
    const itens = Array.isArray(cotacao.itens_resposta) ? cotacao.itens_resposta : [];
    const prazos = itens
      .map((item: any) => Number(item.prazo_entrega_dias))
      .filter((prazo: number) => Number.isFinite(prazo) && prazo > 0);
    return prazos.length > 0 ? prazos.reduce((sum: number, prazo: number) => sum + prazo, 0) / prazos.length : null;
  });
  const menorPrazo = prazosMedios.some((p) => p !== null)
    ? Math.min(...(prazosMedios.filter((p): p is number => p !== null)))
    : null;

  return cotacoes.map((cotacao, index) => {
    const itens = Array.isArray(cotacao.itens_resposta) ? cotacao.itens_resposta : [];
    const itensDisponiveis = itens.filter((item: any) => item.disponivel === 'sim').length;
    const percentual_atendimento = totalItensPedido > 0
      ? Math.min(100, Math.round((itensDisponiveis / totalItensPedido) * 100))
      : (itens.length > 0 ? Math.round((itensDisponiveis / itens.length) * 100) : 0);

    const valorCotacao = cotacao.valor_total ?? cotacao.valor;
    const score_preco = menorPreco > 0 && valorCotacao > 0
      ? Math.round((menorPreco / valorCotacao) * 100)
      : 0;

    const prazoMedio = prazosMedios[index];
    const score_prazo = menorPrazo !== null && prazoMedio !== null && prazoMedio > 0
      ? Math.round((menorPrazo / prazoMedio) * 100)
      : 0;

    const score_total = Math.round(score_preco * 0.5 + percentual_atendimento * 0.3 + score_prazo * 0.2);

    return { ...cotacao, percentual_atendimento, score_preco, score_prazo, score_total };
  });
}

function ordemToResource(record: any, procurement?: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    numero: record.numero,
    pedido_id: record.procurementId,
    pedido_numero: procurement?.numero || data.pedido_numero,
    fornecedor_id: record.fornecedorId,
    fornecedor_nome: record.fornecedor,
    valor_total: record.valor,
    status: record.status,
    itens: safeParse(record.itens, []),
    created_by_id: record.createdById,
    created_by_name: record.createdByName,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

const modules: ModuleConfig[] = [
  {
    name: 'presentation',
    displayName: 'Carta de apresentacao',
    model: 'presentation',
    path: '/presentations',
    collectionKey: 'presentations',
    itemKey: 'presentation',
    permissionModule: 'presentations',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'audience',
    displayName: 'Pedido de audiencia',
    model: 'audience',
    path: '/audiences',
    collectionKey: 'audiences',
    itemKey: 'audience',
    permissionModule: 'audiences',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'factura',
    displayName: 'Factura',
    model: 'factura',
    path: '/facturas',
    collectionKey: 'facturas',
    itemKey: 'factura',
    permissionModule: 'invoices',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'fornecedor',
    displayName: 'Fornecedor',
    model: 'fornecedor',
    path: '/fornecedores',
    collectionKey: 'fornecedores',
    itemKey: 'fornecedor',
    permissionModule: 'finance',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'procurement',
    displayName: 'Procurement',
    model: 'procurement',
    path: '/procurement',
    collectionKey: 'procurements',
    itemKey: 'procurement',
    permissionModule: 'finance',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'comunicacao',
    displayName: 'Comunicacao',
    model: 'comunicacao',
    path: '/comunicacoes',
    collectionKey: 'comunicacoes',
    itemKey: 'comunicacao',
    permissionModule: 'communications',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'acta',
    displayName: 'Acta',
    model: 'acta',
    path: '/actas',
    collectionKey: 'actas',
    itemKey: 'acta',
    permissionModule: 'actas',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  }
];

function registerCrud(config: ModuleConfig) {
  const enrichMeetingBody = (body: any) => {
    const next = { ...body };
    const meetingType = next.meetingType || next.meeting_type;
    const platform = next.platform;
    if (meetingType === 'online' && !next.meetingLink && !next.meeting_link) {
      next.meetingLink = MeetingLinkService.generate({
        title: next.company || next.organization || next.requestorName || config.displayName,
        date: next.preferredDate || next.desiredDate,
        time: next.time,
        duration: next.duration,
        platform,
      });
      next.meeting_link = next.meetingLink;
    }
    return next;
  };

  const requireLicense = requireLicenseModule(config.permissionModule);

  router.post(config.path, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.create(req, res, next, config));
  router.get(config.path, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.list(req, res, next, config));
  router.get(`${config.path}/list`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.list(req, res, next, config));
  router.get(`${config.path}/stats/geral`, requireAuth as any, requireLicense as any, async (req, res, next) => {
    try {
      await ModuleRoutesHelper.list(req as any, {
        status: () => ({
          json: (payload: any) => {
            const items = payload[config.collectionKey] || [];
            return res.status(200).json({
              stats: {
                total: items.length,
                pendentes: items.filter((item: any) => item.status === 'pendente').length,
                aprovados: items.filter((item: any) => item.status === 'aprovado').length,
                rejeitados: items.filter((item: any) => item.status === 'rejeitado').length,
                arquivados: items.filter((item: any) => item.status === 'arquivado').length,
              }
            });
          }
        })
      } as any, next, config);
    } catch (error) {
      next(error);
    }
  });
  router.get(`${config.path}/alertas/vencimento`, requireAuth as any, (req, res) => res.status(200).json({ alertas: [] }));
  router.post(`${config.path}/upload`, (req, res) => res.status(200).json({ success: true, url: null, message: 'Use /storage/upload para anexos.' }));
  router.post(`${config.path}/upload-anexo`, (req, res) => res.status(200).json({ success: true, url: null, message: 'Use /storage/upload para anexos.' }));
  // Submissao publica sem login: restrita aos dois modulos que realmente
  // fazem sentido como formulario publico (carta de apresentacao / pedido de
  // audiencia). O pseudo-utilizador usa o role "publico", que so tem
  // permissao de CRIACAO nestes dois modulos (ver prisma/seed-rbac.ts) -
  // nunca um role administrativo, para nao herdar acidentalmente acesso
  // alargado se um role com esse nome for criado no futuro via a UI de Roles.
  if (config.name === 'presentation' || config.name === 'audience') {
    router.post(`${config.path}/publica`, publicSubmissionLimiter, (req, res, next) => {
      (req as any).user = { id: 'publico', email: 'publico@sipar20.local', name: 'Publico', role: 'publico' };
      return ModuleRoutesHelper.create(req as any, res, next, config);
    });
  } else {
    router.post(`${config.path}/publica`, (_req, res) => {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Submissao publica nao disponivel para este modulo.' });
    });
  }

  // Rastreio publico por codigo: nunca implementado de facto (ignorava o
  // parametro e devolvia a listagem completa do modulo sem autenticacao) -
  // desativado ate existir uma implementacao real de lookup por codigo unico.
  router.get(`${config.path}/rastreio/:codigo`, (_req, res) => {
    res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Rastreio publico por codigo ainda nao implementado.' });
  });

  if (config.name === 'procurement') {
    // --- Regras de acesso do Procurement -------------------------------------
    // Decisoes (analisar/validar/aprovar cotacoes, emitir ordem, confirmar
    // rececao) so para quem pode aprovar no Procurement (finance:approve).
    // Roles so com update_own/delete_own (ex: DSG Tecnico) apenas submetem e
    // so alteram os SEUS documentos enquanto ninguem actuou sobre eles.
    const exigirDecisaoProcurement = async (req: any, res: any, next: any) => {
      try {
        if (await temPermissao(req, 'finance', 'approve')) return next();
        await auditService.logAction('unauthorized_access_attempt', 'warning', { module: 'finance', action: 'approve', attemptedResource: req.originalUrl }, {
          userId: req.user?.id, userEmail: req.user?.email, userRole: req.user?.role, ipAddress: req.ip || 'unknown', success: false,
        });
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para decidir no Procurement (analisar, validar, aprovar, emitir ordem ou confirmar rececao).' });
      } catch (error) {
        next(error);
      }
    };
    const soProprios = async (req: any, acaoTotal: string, acaoPropria: string) =>
      (await nivelDeAcesso(req, 'finance', acaoTotal, acaoPropria)) === 'proprio';
    const negarSemAccao = (res: any) => res.status(403).json({ error: 'FORBIDDEN', message: MENSAGEM_SEM_ACCAO });
    const auditarProcurement = (req: any, acao: string, resourceId: string, metadata: any = {}) =>
      auditService.logAction(acao, 'info', metadata, {
        userId: req.user?.id, userEmail: req.user?.email, userRole: req.user?.role, ipAddress: req.ip || 'unknown',
        resource: 'procurement', resourceId, success: true,
      }).catch(() => null);
    const contagemCotacoesActivas = (pedidoId: string) =>
      prisma.purchaseQuotation.count({ where: { procurementId: pedidoId, status: { not: 'anulada' } } });
    // Volta o pedido a "aguardando_cotacoes" quando deixa de ter cotacoes activas.
    const sincronizarEstadoPedido = async (pedidoId: string) => {
      const pedido = await prisma.procurement.findUnique({ where: { id: pedidoId } });
      if (!pedido || pedido.status !== 'em_cotacao') return;
      if ((await contagemCotacoesActivas(pedidoId)) === 0) {
        await prisma.procurement.update({ where: { id: pedidoId }, data: { status: 'aguardando_cotacoes' } });
      }
    };

    const fornecedorSemDocumentos = async (fornecedorId: string) => fornecedorSemAccao({
      cotacoes: await prisma.purchaseQuotation.count({ where: { fornecedorId } }),
      ordens: await prisma.purchaseOrder.count({ where: { fornecedorId } }),
      pedidos: await prisma.procurement.count({ where: { fornecedorId } }),
      facturas: await prisma.factura.count({ where: { deletedAt: null, data: { contains: fornecedorId } } }),
    });

    router.get(`${config.path}/stats`, requireAuth as any, requireLicense as any, async (_req, res, next) => {
      try {
        const [pedidos, fornecedores, ordens] = await Promise.all([
          prisma.procurement.findMany({ where: { deletedAt: null } }),
          prisma.fornecedor.findMany({ where: { deletedAt: null } }),
          prisma.purchaseOrder.findMany(),
        ]);
        const porStatus = pedidos.reduce((acc: Record<string, number>, pedido) => {
          acc[pedido.status] = (acc[pedido.status] || 0) + 1;
          return acc;
        }, {});
        const porDepartamento = pedidos.reduce((acc: Record<string, number>, pedido) => {
          const data = safeParse(pedido.data, {});
          const departamento = data.departamento_solicitante || data.departamento || 'Sem departamento';
          acc[departamento] = (acc[departamento] || 0) + 1;
          return acc;
        }, {});
        return res.status(200).json({
          stats: {
            total_pedidos: pedidos.length,
            aguardando_cotacoes: porStatus.aguardando_cotacoes || 0,
            em_cotacao: porStatus.em_cotacao || porStatus.cotacao || 0,
            em_analise: porStatus.em_analise || porStatus.aprovacao || 0,
            concluidos: porStatus.concluido || porStatus.recebida || 0,
            total_fornecedores: fornecedores.length,
            fornecedores_ativos: fornecedores.filter((item) => item.status !== 'inactive' && item.status !== 'bloqueado').length,
            valor_total_mes: pedidos.reduce((sum, item) => sum + (item.valor || 0), 0),
            total_ordens_emitidas: ordens.length,
            por_status: porStatus,
            por_departamento: porDepartamento,
            tempo_medio_cotacao: 0,
            tempo_medio_entrega: 0,
          }
        });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/pedidos`, requireAuth as any, requireLicense as any, async (_req, res, next) => {
      try {
        const records = await prisma.procurement.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
        const quotations = await prisma.purchaseQuotation.findMany();
        const pedidos = records.map((record) => procurementToPedido(
          record,
          quotations.filter((quotation) => quotation.procurementId === record.id).map(cotacaoToResource)
        ));
        return res.status(200).json({ pedidos });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/pedidos`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const record = await prisma.procurement.create({
          data: {
            id: crypto.randomUUID(),
            numero: req.body.numero || `PED-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            tipo: req.body.tipo || 'pedido_compra',
            descricao: req.body.descricao || req.body.titulo || '',
            valor: numberValue(req.body.orcamento_estimado || req.body.valor, 0),
            status: req.body.status || 'criado',
            data: stringify(req.body),
            createdById: (req as any).user?.id,
            createdByName: (req as any).user?.name,
          }
        });
        return res.status(201).json({ pedido: procurementToPedido(record) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/pedidos/:pedidoId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const record = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!record) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
        const cotacoes = await prisma.purchaseQuotation.findMany({ where: { procurementId: record.id }, orderBy: { valor: 'asc' } });
        return res.status(200).json({ pedido: procurementToPedido(record, cotacoes.map(cotacaoToResource)) });
      } catch (error) {
        next(error);
      }
    });

    router.put(`${config.path}/pedidos/:pedidoId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
        if (await soProprios(req, 'update', 'update_own')) {
          if (existing.createdById !== (req as any).user?.id || !pedidoSemAccao(existing, await contagemCotacoesActivas(existing.id))) return negarSemAccao(res);
          delete req.body.status;
        }
        const data = { ...safeParse(existing.data, {}), ...req.body };
        if (req.body?.status && !PROCUREMENT_PEDIDO_STATUSES.includes(req.body.status)) {
          return res.status(400).json({
            error: 'INVALID_STATUS',
            message: `Status "${req.body.status}" invalido para pedido de compra. Valores aceites: ${PROCUREMENT_PEDIDO_STATUSES.join(', ')}`,
          });
        }
        const updated = await prisma.procurement.update({
          where: { id: existing.id },
          data: {
            descricao: data.descricao || data.titulo || existing.descricao,
            valor: numberValue(data.orcamento_estimado || data.valor, existing.valor || 0),
            status: data.status || existing.status,
            data: stringify(data),
          }
        });
        return res.status(200).json({ pedido: procurementToPedido(updated) });
      } catch (error) {
        next(error);
      }
    });

    router.delete(`${config.path}/pedidos/:pedidoId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const user = (req as any).user;
        if (await soProprios(req, 'delete', 'delete_own')) {
          const existing = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
          if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
          if (existing.createdById !== user?.id || !pedidoSemAccao(existing, await contagemCotacoesActivas(existing.id))) return negarSemAccao(res);
        }
        await auditarProcurement(req, 'pedido_compra_deleted', req.params.pedidoId);
        await prisma.procurement.update({
          where: { id: req.params.pedidoId },
          data: { deletedAt: new Date(), deletedById: user?.id, deletedByName: user?.name },
        });
        return res.status(200).json({ success: true, message: 'Pedido de compra movido para a lixeira' });
      } catch (error) {
        next(error);
      }
    });

    const setPedidoStatus = (status: string) => async (req: any, res: any, next: any) => {
      try {
        const updated = await prisma.procurement.update({ where: { id: req.params.pedidoId }, data: { status } });
        return res.status(200).json({ pedido: procurementToPedido(updated) });
      } catch (error) {
        next(error);
      }
    };

    // Publicar pedido: alem de mudar o estado, convida por e-mail apenas os
    // fornecedores cuja lista de categorias inclua a categoria deste pedido -
    // nao todos os fornecedores activos. Um pedido sem categoria definida
    // (dados antigos) continua a notificar toda a gente, por seguranca.
    router.post(`${config.path}/pedidos/:pedidoId/publicar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        if (await soProprios(req, 'update', 'update_own')) {
          const existing = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
          if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
          if (existing.createdById !== (req as any).user?.id || existing.status !== 'criado') return negarSemAccao(res);
        }
        const updated = await prisma.procurement.update({ where: { id: req.params.pedidoId }, data: { status: 'aguardando_cotacoes' } });
        const pedidoData = safeParse(updated.data, {});
        const categoria = pedidoData.categoria;

        const todosFornecedores = await prisma.fornecedor.findMany({ where: { status: 'ativo', email: { not: null }, deletedAt: null } });
        const fornecedores = categoria
          ? todosFornecedores.filter((fornecedor) => {
              const fData = safeParse(fornecedor.data, {});
              const categorias: string[] = Array.isArray(fData.categorias_produto) ? fData.categorias_produto : [];
              return categorias.includes(categoria);
            })
          : todosFornecedores;

        await Promise.all(fornecedores.map((fornecedor) => {
          if (!fornecedor.email) return Promise.resolve();
          return emailService.sendEmail({
            to: fornecedor.email,
            subject: `Novo pedido de cotação - ${updated.numero || updated.id}`,
            html: cotacaoConviteEmailHtml(fornecedor.nome || 'Fornecedor', updated.descricao || 'Pedido de compra', updated.numero || updated.id, updated.valor || undefined, categoria),
          }).catch((error) => logger.error(`Falha ao enviar convite de cotacao a ${fornecedor.email}:`, error));
        }));
        return res.status(200).json({
          pedido: procurementToPedido(updated),
          fornecedores_notificados: fornecedores.length,
          categoria: categoria || null,
        });
      } catch (error) {
        next(error);
      }
    });
    // Anular (cancelar) o pedido: com update_own so o proprio pedido ainda sem accao.
    const podeAnularPedido = async (req: any, res: any, next: any) => {
      try {
        if (await soProprios(req, 'update', 'update_own')) {
          const existing = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
          if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
          if (existing.createdById !== req.user?.id || !pedidoSemAccao(existing, await contagemCotacoesActivas(existing.id))) return negarSemAccao(res);
        }
        await auditarProcurement(req, 'pedido_compra_anulado', req.params.pedidoId);
        next();
      } catch (error) {
        next(error);
      }
    };
    router.post(`${config.path}/pedidos/:pedidoId/cancelar`, requireAuth as any, requireLicense as any, podeAnularPedido, setPedidoStatus('cancelado'));
    router.post(`${config.path}/pedidos/:pedidoId/analisar`, requireAuth as any, requireLicense as any, exigirDecisaoProcurement, setPedidoStatus('em_analise'));
    router.post(`${config.path}/pedidos/:pedidoId/confirmar-recebimento`, requireAuth as any, requireLicense as any, exigirDecisaoProcurement, setPedidoStatus('concluido'));

    // Ordenadas por valor (mais barata primeiro) e marcadas com um ranking, para
    // sugerir a melhor oferta a quem for decidir a aprovacao.
    router.get(`${config.path}/pedidos/:pedidoId/cotacoes`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const pedido = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        const pedidoData = safeParse(pedido?.data, {});
        const itensPedido = pedidoData.itens || pedidoData.items;
        const totalItensPedido = Array.isArray(itensPedido) ? itensPedido.length : 0;

        const cotacoes = await prisma.purchaseQuotation.findMany({ where: { procurementId: req.params.pedidoId, status: { not: 'anulada' } }, orderBy: { valor: 'asc' } });
        const comScores = computeCotacaoScores(cotacoes.map(cotacaoToResource), totalItensPedido);
        const resources = comScores.map((cotacao, index) => ({
          ...cotacao,
          ranking: index + 1,
          melhor_oferta: index === 0,
        }));
        return res.status(200).json({ cotacoes: resources });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/pedidos/:pedidoId/cotacoes`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        // O formulario do fornecedor so envia fornecedor_id: sem ir buscar o
        // registo, a cotacao (e depois a ordem e a factura) ficava com o nome
        // generico "Fornecedor" e sem email.
        const fornecedorId = req.body.fornecedor_id || req.body.fornecedorId || null;
        const fornecedorRegisto = fornecedorId
          ? await prisma.fornecedor.findUnique({ where: { id: fornecedorId } }).catch(() => null)
          : null;
        const user = (req as any).user;

        const pedido = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!pedido || pedido.deletedAt) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
        if (!['aguardando_cotacoes', 'em_cotacao'].includes(pedido.status)) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: `O pedido esta "${pedido.status}" e ja nao aceita cotacoes.` });
        }
        if (!fornecedorId) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Indique o fornecedor da cotacao.' });
        }
        // Cada fornecedor so pode ter UMA cotacao (activa) em cada pedido -
        // vale para o portal do fornecedor e para o registo interno em nome dele.
        const duplicada = await prisma.purchaseQuotation.findFirst({
          where: { procurementId: pedido.id, fornecedorId, status: { not: 'anulada' } },
        });
        if (duplicada) {
          return res.status(409).json({
            error: 'COTACAO_DUPLICADA',
            message: `O fornecedor "${duplicada.fornecedor}" ja tem uma cotacao neste pedido. Edite ou anule a existente.`,
            cotacao_id: duplicada.id,
          });
        }

        const registoInterno = user?.role !== 'externo';
        const cotacao = await prisma.purchaseQuotation.create({
          data: {
            procurementId: req.params.pedidoId,
            fornecedorId,
            fornecedor: req.body.fornecedor_nome || req.body.fornecedor || fornecedorRegisto?.nome || 'Fornecedor',
            email: req.body.fornecedor_email || req.body.email || fornecedorRegisto?.email || null,
            valor: numberValue(req.body.valor_total || req.body.valor),
            moeda: req.body.moeda || 'AOA',
            anexos: stringify(req.body.anexos, []),
            data: stringify({
              ...req.body,
              registado_por_id: user?.id,
              registado_por_nome: user?.name,
              registado_em: new Date().toISOString(),
              // true = registada por um utilizador interno (ex: DSG Tecnico) em nome do fornecedor
              em_nome_do_fornecedor: registoInterno,
            }),
          }
        });
        await auditarProcurement(req, registoInterno ? 'cotacao_registada_em_nome_do_fornecedor' : 'cotacao_submetida', pedido.id, {
          cotacao_id: cotacao.id, fornecedor: cotacao.fornecedor, valor: cotacao.valor,
        });
        await prisma.procurement.update({ where: { id: req.params.pedidoId }, data: { status: 'em_cotacao' } })
          .catch((error) => logger.warn(`Falha ao sincronizar status do pedido ${req.params.pedidoId} para "em_cotacao" apos nova cotacao:`, error));
        return res.status(201).json({ cotacao: cotacaoToResource(cotacao) });
      } catch (error) {
        next(error);
      }
    });

    // Editar / anular / eliminar uma cotacao. Quem tem finance:update (ou
    // delete) pode faze-lo em qualquer cotacao ainda nao analisada; com
    // update_own/delete_own (ex: DSG Tecnico) so nas registadas por si. Em
    // ambos os casos so enquanto o pedido esta a receber cotacoes e a cotacao
    // nao foi seleccionada nem gerou ordem de compra.
    const carregarCotacaoAlteravel = async (req: any, res: any, acaoTotal: string, acaoPropria: string) => {
      const nivel = await nivelDeAcesso(req, 'finance', acaoTotal, acaoPropria);
      if (!nivel) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para alterar cotacoes' });
        return null;
      }
      const cotacao = await prisma.purchaseQuotation.findUnique({ where: { id: req.params.cotacaoId } });
      if (!cotacao || cotacao.procurementId !== req.params.pedidoId) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Cotacao nao encontrada' });
        return null;
      }
      const pedido = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
      const nOrdens = await prisma.purchaseOrder.count({ where: { quotationId: cotacao.id } });
      const semAccao = cotacaoSemAccao(cotacao, pedido, nOrdens);
      const autorOk = nivel === 'total' || autorDaCotacao(cotacao) === req.user?.id;
      if (!semAccao || !autorOk) {
        negarSemAccao(res);
        return null;
      }
      return cotacao;
    };

    router.put(`${config.path}/pedidos/:pedidoId/cotacoes/:cotacaoId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const cotacao = await carregarCotacaoAlteravel(req, res, 'update', 'update_own');
        if (!cotacao) return;
        const anterior = safeParse(cotacao.data, {});
        const corpo = { ...req.body };
        // Fornecedor, autoria e estado nao mudam numa edicao.
        for (const campo of ['fornecedor_id', 'fornecedorId', 'status', 'selected', 'registado_por_id', 'registado_por_nome', 'registado_em', 'em_nome_do_fornecedor']) delete corpo[campo];
        const data = { ...anterior, ...corpo, editado_por_id: (req as any).user?.id, editado_por_nome: (req as any).user?.name, editado_em: new Date().toISOString() };
        const updated = await prisma.purchaseQuotation.update({
          where: { id: cotacao.id },
          data: {
            valor: numberValue(data.valor_total ?? data.valor, cotacao.valor),
            moeda: data.moeda || cotacao.moeda,
            anexos: corpo.anexos !== undefined ? stringify(corpo.anexos, []) : cotacao.anexos,
            data: stringify(data),
          },
        });
        await auditarProcurement(req, 'cotacao_editada', req.params.pedidoId, { cotacao_id: cotacao.id, fornecedor: cotacao.fornecedor, valor_anterior: cotacao.valor, valor: updated.valor });
        return res.status(200).json({ cotacao: cotacaoToResource(updated) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/pedidos/:pedidoId/cotacoes/:cotacaoId/anular`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const cotacao = await carregarCotacaoAlteravel(req, res, 'update', 'update_own');
        if (!cotacao) return;
        const data = safeParse(cotacao.data, {});
        const updated = await prisma.purchaseQuotation.update({
          where: { id: cotacao.id },
          data: {
            status: 'anulada',
            data: stringify({ ...data, anulada_por_id: (req as any).user?.id, anulada_por_nome: (req as any).user?.name, anulada_em: new Date().toISOString(), motivo_anulacao: req.body?.motivo || undefined }),
          },
        });
        await sincronizarEstadoPedido(req.params.pedidoId);
        await auditarProcurement(req, 'cotacao_anulada', req.params.pedidoId, { cotacao_id: cotacao.id, fornecedor: cotacao.fornecedor, motivo: req.body?.motivo });
        return res.status(200).json({ cotacao: cotacaoToResource(updated) });
      } catch (error) {
        next(error);
      }
    });

    router.delete(`${config.path}/pedidos/:pedidoId/cotacoes/:cotacaoId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const cotacao = await carregarCotacaoAlteravel(req, res, 'delete', 'delete_own');
        if (!cotacao) return;
        await prisma.purchaseQuotation.delete({ where: { id: cotacao.id } });
        await sincronizarEstadoPedido(req.params.pedidoId);
        await auditService.logAction('cotacao_eliminada', 'warning', { cotacao_id: cotacao.id, fornecedor: cotacao.fornecedor }, {
          userId: (req as any).user?.id, userEmail: (req as any).user?.email, userRole: (req as any).user?.role, ipAddress: req.ip || 'unknown',
          resource: 'procurement', resourceId: req.params.pedidoId, oldValue: cotacaoToResource(cotacao), success: true,
        }).catch(() => null);
        return res.status(200).json({ success: true, message: 'Cotacao eliminada' });
      } catch (error) {
        next(error);
      }
    });

    // Validacao (Compras): confere as cotacoes recebidas antes de seguir para aprovacao.
    // Sem isto, "aprovar" podia ser chamado directamente sem nenhuma cotacao analisada.
    router.post(`${config.path}/pedidos/:pedidoId/validar`, requireAuth as any, requireLicense as any, exigirDecisaoProcurement, async (req, res, next) => {
      try {
        const existing = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });

        if (!['aguardando_cotacoes', 'em_cotacao'].includes(existing.status)) {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: `Pedido com estado "${existing.status}" nao pode ser validado. E necessario estar em cotacao.`,
          });
        }

        const cotacoes = await prisma.purchaseQuotation.count({ where: { procurementId: req.params.pedidoId, status: { not: 'anulada' } } });
        if (cotacoes === 0) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'E necessario pelo menos uma cotacao recebida para validar o pedido' });
        }

        const updated = await prisma.procurement.update({ where: { id: req.params.pedidoId }, data: { status: 'validado' } });
        return res.status(200).json({ pedido: procurementToPedido(updated) });
      } catch (error) {
        next(error);
      }
    });

    // Aprovar a cotacao escolhida: fecha o fluxo de analise do pedido (so pode ser
    // chamado depois de "Analisar", que coloca o pedido em "em_analise" - o mesmo
    // fluxo que a tela de Compras usa: aguardando_cotacoes -> em_cotacao ->
    // em_analise -> concluido) e, so nesse momento, emite automaticamente a ordem
    // de compra ligada a esta cotacao - e essa ordem, quando marcada como recebida,
    // e que gera a factura em Gestao de Pagamento como pendente de aprovacao.
    router.post(`${config.path}/pedidos/:pedidoId/aprovar`, requireAuth as any, requireLicense as any, exigirDecisaoProcurement, async (req, res, next) => {
      try {
        const existing = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });

        if (existing.status !== 'em_analise') {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: `Pedido com estado "${existing.status}" nao pode ser aprovado. E necessario coloca-lo em analise primeiro.`,
          });
        }

        const cotacao = req.body.cotacao_id
          ? await prisma.purchaseQuotation.findUnique({ where: { id: req.body.cotacao_id } })
          : null;
        if (!cotacao) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'cotacao_id e obrigatorio para aprovar o pedido' });
        }
        if (cotacao.status === 'anulada' || cotacao.procurementId !== existing.id) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Esta cotacao foi anulada ou nao pertence a este pedido.' })
        }

        const ordemSequencia = await SequenceService.next('purchaseOrder');

        // Cotacoes antigas gravaram o nome generico "Fornecedor"; o nome real
        // vem do registo do fornecedor para nao se propagar a ordem/factura.
        const fornecedorRegisto = cotacao.fornecedorId
          ? await prisma.fornecedor.findUnique({ where: { id: cotacao.fornecedorId } }).catch(() => null)
          : null;
        const nomeFornecedor = cotacao.fornecedor && cotacao.fornecedor !== 'Fornecedor'
          ? cotacao.fornecedor
          : fornecedorRegisto?.nome || cotacao.fornecedor || null;

        // Aprovar o pedido e emitir a ordem de compra tem de ser atomico: uma
        // falha a meio nao pode deixar o pedido "concluido" sem nenhuma ordem
        // de compra correspondente (ou vice-versa).
        const [concluido, ordem] = await prisma.$transaction(async (tx) => {
          const updatedPedido = await tx.procurement.update({
            where: { id: req.params.pedidoId },
            data: {
              status: 'concluido',
              fornecedorId: cotacao.fornecedorId || null,
              fornecedor: nomeFornecedor,
              valor: cotacao.valor || undefined,
            }
          });

          const novaOrdem = await tx.purchaseOrder.create({
            data: {
              numero: ordemSequencia?.value || `OC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
              procurementId: updatedPedido.id,
              quotationId: cotacao.id,
              fornecedorId: updatedPedido.fornecedorId,
              fornecedor: updatedPedido.fornecedor || 'Fornecedor',
              valor: updatedPedido.valor || 0,
              itens: stringify(safeParse(updatedPedido.data, {}).itens, []),
              data: stringify({}),
              createdById: (req as any).user?.id,
              createdByName: (req as any).user?.name,
            }
          });

          return [updatedPedido, novaOrdem];
        });

        return res.status(200).json({ pedido: procurementToPedido(concluido), ordem: ordemToResource(ordem, concluido) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/pedidos/:pedidoId/emitir-ordem`, requireAuth as any, requireLicense as any, exigirDecisaoProcurement, async (req, res, next) => {
      try {
        const pedido = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
        const ordemSequencia = await SequenceService.next('purchaseOrder');
        const [ordem, updated] = await prisma.$transaction(async (tx) => {
          const novaOrdem = await tx.purchaseOrder.create({
            data: {
              numero: ordemSequencia?.value || `OC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
              procurementId: pedido.id,
              fornecedorId: pedido.fornecedorId,
              fornecedor: pedido.fornecedor || 'Fornecedor',
              valor: pedido.valor || 0,
              itens: stringify(safeParse(pedido.data, {}).itens, []),
              data: stringify(req.body),
              createdById: (req as any).user?.id,
              createdByName: (req as any).user?.name,
            }
          });
          const updatedPedido = await tx.procurement.update({ where: { id: pedido.id }, data: { status: 'ordem_emitida' } });
          return [novaOrdem, updatedPedido];
        });
        return res.status(201).json({ ordem: ordemToResource(ordem, pedido), pedido: procurementToPedido(updated) });
      } catch (error) {
        next(error);
      }
    });

    router.put(`${config.path}/ordens/:ordemId/status`, requireAuth as any, requireLicense as any, exigirDecisaoProcurement, async (req, res, next) => {
      try {
        const nextStatus = req.body.status || 'emitida';

        if (nextStatus !== 'recebida') {
          const ordem = await prisma.purchaseOrder.update({ where: { id: req.params.ordemId }, data: { status: nextStatus } });
          return res.status(200).json({ ordem: ordemToResource(ordem), factura: null });
        }

        // Sincronizacao Procurement -> Gestao de Pagamento: ao confirmar a receção, gera
        // automaticamente uma factura ligada a esta ordem de compra (se ainda nao existir
        // nenhuma para esta ordem). Entra directamente como "validado": ja passou pela
        // sequencia de cotacao/validacao/aprovacao do Procurement, por isso so fica
        // pendente da aprovacao final em Gestao de Pagamento, sem repetir a validacao.
        //
        // A leitura de dados de apoio (pedido de origem, dados bancarios, numero de
        // sequencia) corre antes da transacao; a actualizacao da ordem + criacao da
        // factura correm dentro dela, para nunca ficar uma ordem "recebida" sem a
        // factura correspondente se o processo falhar a meio.
        const ordemAtual = await prisma.purchaseOrder.findUnique({ where: { id: req.params.ordemId } });
        if (!ordemAtual) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de compra nao encontrada' });

        const facturaExistente = await prisma.factura.findFirst({ where: { purchaseOrderId: ordemAtual.id } });
        const user = (req as any).user;
        const dadosRececao = { status: nextStatus, recebidoEm: new Date(), recebidoPorId: user?.id, recebidoPorNome: user?.name };

        if (!facturaExistente) {
          // Fornecedor, NIF/contactos, itens com preco e IVA da cotacao aprovada,
          // totais, validacao, historico, dados bancarios e todos os anexos do
          // processo (cotacao + pedido + ordem) - ver montarFacturaDaOrdem.
          const { columns, data, comentarioValidacao, historicoCriacao } = await montarFacturaDaOrdem(ordemAtual, user);
          const facturaSequencia = await SequenceService.next('factura');

          const [ordem, factura] = await prisma.$transaction(async (tx) => {
            const updatedOrdem = await tx.purchaseOrder.update({ where: { id: req.params.ordemId }, data: dadosRececao });
            const novaFactura = await tx.factura.create({
              data: {
                id: crypto.randomUUID(),
                status: 'validado',
                numero: facturaSequencia?.value || `FT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                ...columns,
                createdById: updatedOrdem.createdById || user?.id,
                createdByName: updatedOrdem.createdByName || user?.name,
                data: stringify(data),
              }
            });
            return [updatedOrdem, novaFactura];
          });

          // Mesmo historico (DocumentHistory) que as restantes transicoes da
          // factura, para aparecer em qualquer separador de Gestao de Pagamento.
          await HistoryService.record({ module: 'factura', resourceId: factura.id, action: 'created', statusTo: 'pendente', user, comment: historicoCriacao })
            .then(() => HistoryService.record({ module: 'factura', resourceId: factura.id, action: 'status_changed', statusFrom: 'pendente', statusTo: 'validado', user, comment: comentarioValidacao }))
            .catch((error) => logger.warn(`Falha ao registar historico da factura ${factura.id}:`, error));

          return res.status(200).json({ ordem: ordemToResource(ordem), factura: facturaToResource(factura) });
        }

        const ordem = await prisma.purchaseOrder.update({ where: { id: req.params.ordemId }, data: dadosRececao });
        return res.status(200).json({ ordem: ordemToResource(ordem), factura: null });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/ordens`, requireAuth as any, requireLicense as any, async (_req, res, next) => {
      try {
        const ordens = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ ordens: ordens.map((ordem) => ordemToResource(ordem)) });
      } catch (error) {
        next(error);
      }
    });

    // Dados completos da Ordem de Compra para visualizar/descarregar o documento
    // (disponivel assim que o pedido e concluido e a ordem emitida).
    router.get(`${config.path}/ordens/:ordemId/documento`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const ordem = await prisma.purchaseOrder.findUnique({ where: { id: req.params.ordemId } });
        if (!ordem) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de compra nao encontrada' });
        return res.status(200).json({ ordem: await montarDocumentoOrdemCompra(ordem) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/ordens/:ordemId/facturas`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const facturas = await prisma.factura.findMany({ where: { purchaseOrderId: req.params.ordemId }, orderBy: { createdAt: 'desc' } });
        const valorFacturado = facturas
          .filter((f) => f.status !== 'rejeitado' && f.status !== 'cancelado')
          .reduce((sum, f) => sum + (f.valor || 0), 0);
        return res.status(200).json({
          facturas: facturas.map((f) => ({ id: f.id, numero: f.numero, status: f.status, valor: f.valor, moeda: f.moeda, created_at: f.createdAt })),
          valor_facturado: valorFacturado,
        });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/fornecedores`, requireAuth as any, requireLicense as any, async (_req, res, next) => {
      try {
        const records = await prisma.fornecedor.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ fornecedores: records.map(fornecedorToResource) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.create({
          data: {
            id: crypto.randomUUID(),
            nome: req.body.nome,
            email: req.body.email || null,
            nif: req.body.nif || null,
            telefone: req.body.telefone || null,
            endereco: req.body.endereco || null,
            status: req.body.situacao || req.body.status || 'ativo',
            data: stringify(req.body),
            createdById: (req as any).user?.id,
            createdByName: (req as any).user?.name,
          }
        });
        const account = await ensureFornecedorAccount(record.id, record.nome || '', record.email);
        const updated = account ? await prisma.fornecedor.findUnique({ where: { id: record.id } }) : record;
        return res.status(201).json({ fornecedor: fornecedorToResource(updated || record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/auto-create`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.create({
          data: {
            id: crypto.randomUUID(),
            nome: req.body.nome || req.body.name || 'Fornecedor',
            email: req.body.email || null,
            nif: req.body.nif || null,
            telefone: req.body.telefone || null,
            endereco: req.body.endereco || null,
            status: req.body.situacao || req.body.status || 'ativo',
            data: stringify(req.body),
            createdById: (req as any).user?.id,
            createdByName: (req as any).user?.name,
          }
        });
        const account = await ensureFornecedorAccount(record.id, record.nome || '', record.email);
        const updated = account ? await prisma.fornecedor.findUnique({ where: { id: record.id } }) : record;
        return res.status(201).json({ fornecedor: fornecedorToResource(updated || record) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/fornecedores/:fornecedorId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.findUnique({ where: { id: req.params.fornecedorId } });
        if (!record) return res.status(404).json({ error: 'NOT_FOUND', message: 'Fornecedor nao encontrado' });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    // Dados bancarios do fornecedor: da conta de utilizador ligada (fornecedor
    // externo com login) ou, na sua falta, dos guardados no proprio registo de
    // Fornecedor - usado em Gestao de Pagamento/Compras ao criar uma factura
    // internamente em nome deste fornecedor, para mostrar/usar a conta certa
    // sem o utilizador interno ter de a digitar de novo.
    router.get(`${config.path}/fornecedores/:fornecedorId/dados-bancarios`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.findUnique({ where: { id: req.params.fornecedorId } });
        if (!record) return res.status(404).json({ error: 'NOT_FOUND', message: 'Fornecedor nao encontrado' });
        const bancoInfo = await resolveFornecedorBankInfo({}, { fornecedor_id: record.id }).catch(() => null);
        return res.status(200).json({ dados_bancarios: bancoInfo });
      } catch (error) {
        next(error);
      }
    });

    router.put(`${config.path}/fornecedores/:fornecedorId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.fornecedor.findUnique({ where: { id: req.params.fornecedorId } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Fornecedor nao encontrado' });
        if (await soProprios(req, 'update', 'update_own')) {
          if (existing.createdById !== (req as any).user?.id || !(await fornecedorSemDocumentos(existing.id))) return negarSemAccao(res);
          delete req.body.status;
          delete req.body.situacao;
        }
        const data = { ...safeParse(existing.data, {}), ...req.body };
        const record = await prisma.fornecedor.update({
          where: { id: existing.id },
          data: {
            nome: data.nome || existing.nome,
            email: data.email || existing.email,
            nif: data.nif || existing.nif,
            telefone: data.telefone || existing.telefone,
            endereco: data.endereco || existing.endereco,
            status: data.situacao || data.status || existing.status,
            data: stringify(data),
          }
        });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.delete(`${config.path}/fornecedores/:fornecedorId`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const user = (req as any).user;
        if (await soProprios(req, 'delete', 'delete_own')) {
          const existing = await prisma.fornecedor.findUnique({ where: { id: req.params.fornecedorId } });
          if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Fornecedor nao encontrado' });
          if (existing.createdById !== user?.id || !(await fornecedorSemDocumentos(existing.id))) return negarSemAccao(res);
        }
        await auditarProcurement(req, 'fornecedor_deleted', req.params.fornecedorId);
        await prisma.fornecedor.update({
          where: { id: req.params.fornecedorId },
          data: { deletedAt: new Date(), deletedById: user?.id, deletedByName: user?.name },
        });
        return res.status(200).json({ success: true, message: 'Fornecedor movido para a lixeira' });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/ativar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        if (await soProprios(req, 'update', 'update_own')) return negarSemAccao(res);
        const record = await prisma.fornecedor.update({ where: { id: req.params.fornecedorId }, data: { status: 'ativo' } });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/desativar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        if (await soProprios(req, 'update', 'update_own')) return negarSemAccao(res);
        const record = await prisma.fornecedor.update({ where: { id: req.params.fornecedorId }, data: { status: 'inativo' } });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/bloquear`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        if (await soProprios(req, 'update', 'update_own')) return negarSemAccao(res);
        const record = await prisma.fornecedor.update({ where: { id: req.params.fornecedorId }, data: { status: 'bloqueado' } });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/enviar-credenciais`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const fornecedor = await prisma.fornecedor.findUnique({ where: { id: req.params.fornecedorId } });
        if (!fornecedor) return res.status(404).json({ error: 'NOT_FOUND', message: 'Fornecedor nao encontrado' });
        if (!fornecedor.email) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Este fornecedor nao tem e-mail registado' });
        }

        const normalizedEmail = fornecedor.email.toLowerCase().trim();
        const tempPassword = generateTempPassword();
        const hashed = await bcrypt.hash(tempPassword, 10);

        let user = fornecedor.userId ? await prisma.user.findUnique({ where: { id: fornecedor.userId } }) : null;
        if (!user) user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (user) {
          user = await prisma.user.update({ where: { id: user.id }, data: { password: hashed, status: 'active' } });
        } else {
          user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              password: hashed,
              name: fornecedor.nome || 'Fornecedor',
              role: 'externo',
              organization: fornecedor.nome || null,
              department: 'Fornecedor',
              position: 'Fornecedor Externo',
              status: 'active',
            },
          });
        }

        await prisma.fornecedor.update({ where: { id: fornecedor.id }, data: { userId: user.id } });

        await emailService.sendEmail({
          to: normalizedEmail,
          subject: 'As suas credenciais de acesso ao Portal de Fornecedores - FADA',
          html: fornecedorCredentialsEmailHtml(fornecedor.nome || 'Fornecedor', normalizedEmail, tempPassword),
        });

        return res.status(200).json({ success: true, message: 'Credenciais reenviadas por e-mail com sucesso.' });
      } catch (error) {
        next(error);
      }
    });
  }

  if (config.name === 'factura') {
    // Ordem de Compra da factura: a do Procurement de origem ou, para uma
    // factura normal ja validada, a emitida a partir dela (criada aqui se ainda
    // nao existir - cobre facturas validadas antes desta funcionalidade).
    router.post(`${config.path}/:id/ordem-compra`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const ordem = await garantirOrdemCompraDaFactura(req.params.id, (req as any).user);
        if (!ordem) {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'A Ordem de Compra fica disponivel depois de a factura ser validada.',
          });
        }
        return res.status(200).json({ ordem: await montarDocumentoOrdemCompra(ordem) });
      } catch (error) {
        next(error);
      }
    });

    // Gera (ou actualiza) os dados da Ordem de Pagamento associada a uma factura aprovada.
    router.post(`${config.path}/:id/ordem-pagamento`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.factura.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Factura nao encontrada' });
        if (existing.status !== 'aprovado' && !existing.numeroOrdemPagamento) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'A factura precisa estar aprovada para gerar a Ordem de Pagamento' });
        }

        const data = safeParse(existing.data, {});
        // Resolve sempre os dados bancarios mais recentes do fornecedor (conta de utilizador
        // ligada ou registo de Fornecedor) em vez de depender apenas do que ja estava gravado
        // na factura, para que a Ordem de Pagamento nunca mostre dados bancarios estaticos/desactualizados.
        const bancoInfo = await resolveFornecedorBankInfo(existing, data).catch(() => null);
        const numero = existing.numeroOrdemPagamento || `OP/N.º ${1000 + Math.floor(Math.random() * 9000)}/${new Date().getFullYear()}`;
        const ordemPagamento = {
          ...(data.ordem_pagamento || {}),
          numero_despacho: req.body.numero_despacho ?? data.ordem_pagamento?.numero_despacho ?? null,
          conta_debito: req.body.conta_debito ?? data.ordem_pagamento?.conta_debito ?? null,
          banco_destino_cidade: req.body.banco_destino_cidade ?? bancoInfo?.banco_cidade ?? data.banco_cidade ?? data.ordem_pagamento?.banco_destino_cidade ?? null,
          banco_destino_pais: req.body.banco_destino_pais ?? bancoInfo?.banco_pais ?? data.banco_pais ?? data.ordem_pagamento?.banco_destino_pais ?? null,
          gerada_em: new Date().toISOString(),
          gerada_por_id: (req as any).user?.id,
          gerada_por_nome: (req as any).user?.name,
          assinaturas: Array.isArray(data.ordem_pagamento?.assinaturas) ? data.ordem_pagamento.assinaturas : [],
        };

        const updated = await prisma.factura.update({
          where: { id: existing.id },
          data: {
            numeroOrdemPagamento: numero,
            data: stringify({ ...data, ...(bancoInfo || {}), ordem_pagamento: ordemPagamento }),
          }
        });

        return res.status(200).json({ factura: facturaToResource(updated) });
      } catch (error) {
        next(error);
      }
    });

    // Regista a assinatura (Presidente/Administrador) usando a imagem de assinatura guardada no perfil do utilizador.
    router.post(`${config.path}/:id/ordem-pagamento/assinar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const user = (req as any).user;
        const papel = req.body.papel;
        if (!papel || !ALLOWED_SIGNATURE_PAPEIS.ordemPagamento.includes(papel)) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Papel de assinatura invalido (use presidente ou administrador)' });
        }
        if (user?.role !== SIGNATURE_ROLE_MAP[papel]) {
          return res.status(403).json({ error: 'FORBIDDEN', message: `Apenas o utilizador com o cargo de ${papel} pode assinar nesta funcao` });
        }

        const existing = await prisma.factura.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Factura nao encontrada' });
        if (!existing.numeroOrdemPagamento) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Gere a Ordem de Pagamento antes de assinar' });
        }

        const signerUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!signerUser?.signatureImage) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Carregue a sua assinatura no seu perfil antes de assinar' });
        }

        const data = safeParse(existing.data, {});
        const ordemPagamento = data.ordem_pagamento || {};
        const assinaturas = (Array.isArray(ordemPagamento.assinaturas) ? ordemPagamento.assinaturas : [])
          .filter((assinatura: any) => assinatura.papel !== papel);
        assinaturas.push({
          papel,
          user_id: user.id,
          nome: user.name,
          assinatura_url: signerUser.signatureImage,
          assinado_em: new Date().toISOString(),
        });

        const updated = await prisma.factura.update({
          where: { id: existing.id },
          data: { data: stringify({ ...data, ordem_pagamento: { ...ordemPagamento, assinaturas } }) }
        });

        return res.status(200).json({ factura: facturaToResource(updated) });
      } catch (error) {
        next(error);
      }
    });
  }

  if (config.name === 'comunicacao') {
    // Lista de utilizadores da plataforma para delegar uma comunicacao (tem de
    // ser registada antes da rota generica GET /:id, para nao ser interpretada
    // como um id de comunicacao).
    router.get(`${config.path}/utilizadores/departamento`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const currentUser = (req as any).user;
        const users = await prisma.user.findMany({ where: { status: 'active', role: { not: 'externo' } } });
        const utilizadores = users
          .filter((u) => u.id !== currentUser?.id)
          .map((u) => ({ id: u.id, nome: u.name, email: u.email, cargo: u.position || u.role, departamento: u.department || '' }));
        return res.status(200).json({ utilizadores });
      } catch (error) {
        next(error);
      }
    });

    // Responder a uma comunicacao: acrescenta a resposta ao historico
    // (data.respostas), em vez de sobrepor um unico campo.
    router.post(`${config.path}/:id/responder`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.comunicacao.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Comunicacao nao encontrada' });
        const user = (req as any).user;
        const data = safeParse(existing.data, {});
        const respostas = Array.isArray(data.respostas) ? data.respostas : [];
        const novaResposta = {
          id: crypto.randomUUID(),
          comunicacao_id: existing.id,
          comunicacao_numero: data.numero || '',
          texto_resposta: req.body.texto_resposta || '',
          anexos: Array.isArray(req.body.anexos) ? req.body.anexos : [],
          respondido_por_id: user.id,
          respondido_por_nome: user.name,
          respondido_por_cargo: user.role,
          departamento: user.department || '',
          created_at: new Date().toISOString(),
        };
        const updated = await prisma.comunicacao.update({
          where: { id: existing.id },
          data: { data: stringify({ ...data, respostas: [...respostas, novaResposta] }) },
        });
        return res.status(200).json({
          success: true,
          resposta: novaResposta,
          comunicacao_original: recordToResource(updated),
        });
      } catch (error) {
        next(error);
      }
    });

    // Delegar uma comunicacao a outro utilizador da plataforma: acrescenta ao
    // historico (data.delegacoes) e notifica o delegado.
    router.post(`${config.path}/:id/delegar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.comunicacao.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Comunicacao nao encontrada' });
        const delegadoParaId = req.body.delegado_para_id;
        if (!delegadoParaId) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'delegado_para_id e obrigatorio' });
        }
        const delegadoUser = await prisma.user.findUnique({ where: { id: delegadoParaId } });
        if (!delegadoUser) return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador a delegar nao encontrado' });

        const user = (req as any).user;
        const assinatura = await requireSignature(user.id);
        const data = safeParse(existing.data, {});
        const delegacoes = Array.isArray(data.delegacoes) ? data.delegacoes : [];
        const novaDelegacao = {
          id: crypto.randomUUID(),
          comunicacao_id: existing.id,
          comunicacao_numero: data.numero || '',
          delegado_para_id: delegadoUser.id,
          delegado_para_nome: delegadoUser.name,
          delegado_para_cargo: delegadoUser.position || delegadoUser.role,
          motivo: req.body.motivo_delegacao || '',
          delegado_por_id: user.id,
          delegado_por_nome: user.name,
          departamento: user.department || '',
          created_at: new Date().toISOString(),
          assinatura_url: assinatura.assinatura_url,
        };

        if (delegadoUser.email) {
          await notifications.createNotification(
            delegadoUser.email,
            'comunicacao_delegada',
            `${user.name} delegou-lhe a comunicação "${data.assunto || data.titulo || existing.assunto || ''}".`,
            existing.id
          ).catch(() => null);
        }

        // Actualizacao directa (sem passar pelo ModuleRoutesHelper.update generico):
        // essa via corre ValidationService sobre os campos obrigatorios do estado
        // actual, que vivem em colunas reais (titulo/mensagem) e nao no blob
        // "data" isolado que aqui se constroi - a delegacao nao deve exigi-los.
        const updated = await prisma.comunicacao.update({
          where: { id: existing.id },
          data: {
            data: stringify({
              ...data,
              delegacoes: [...delegacoes, novaDelegacao],
              delegado_para_id: delegadoUser.id,
              delegado_para_nome: delegadoUser.name,
            }),
          },
        });
        return res.status(200).json({ success: true, comunicacao: recordToResource(updated) });
      } catch (error) {
        next(error);
      }
    });

    // Despacho: acrescenta ao historico (data.despachos) em vez de sobrepor.
    router.post(`${config.path}/:id/despacho`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.comunicacao.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Comunicacao nao encontrada' });
        const user = (req as any).user;
        const assinatura = await requireSignature(user.id);
        const data = safeParse(existing.data, {});
        const despachos = Array.isArray(data.despachos) ? data.despachos : [];
        const novoDespacho = {
          id: crypto.randomUUID(),
          comunicacao_id: existing.id,
          comunicacao_numero: data.numero || '',
          tipo: req.body.tipo || 'despacho',
          texto_despacho: req.body.texto_despacho || '',
          decisao: req.body.decisao || 'pendente',
          despachado_por_id: user.id,
          despachado_por_nome: user.name,
          despachado_por_cargo: user.role,
          departamento: user.department || '',
          created_at: new Date().toISOString(),
          assinatura_url: assinatura.assinatura_url,
        };
        const updated = await prisma.comunicacao.update({
          where: { id: existing.id },
          data: {
            status: 'despachado',
            data: stringify({
              ...data,
              despachos: [...despachos, novoDespacho],
              despachado_em: novoDespacho.created_at,
              despachado_por_id: user.id,
              despachado_por_nome: user.name,
            }),
          },
        });
        return res.status(200).json({ success: true, comunicacao: recordToResource(updated) });
      } catch (error) {
        next(error);
      }
    });
  }

  if (config.name === 'presentation' || config.name === 'audience') {
    // Delegar (e redelegar - mesmo endpoint, chamado outra vez sobre um item
    // ja delegado) uma carta de apresentacao/pedido de audiencia a outro
    // utilizador da plataforma. Regista-se aqui, antes do fallback generico
    // "/delegate" mais abaixo, para exigir e anexar a assinatura de quem
    // delega - mesmo modelo usado nas Actas/Ordens de Pagamento/Comunicacoes.
    router.post(`${config.path}/:id/delegate`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const model = (prisma as any)[config.model];
        const existing = await model.findUnique({ where: { id: req.params.id } });
        if (!existing) {
          return res.status(404).json({ error: 'NOT_FOUND', message: `${config.displayName} nao encontrado(a)` });
        }

        const delegatedToId = req.body.delegatedTo || req.body.delegado_para_id;
        if (!delegatedToId) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'delegatedTo e obrigatorio' });
        }
        const delegadoUser = await prisma.user.findUnique({ where: { id: delegatedToId } });
        if (!delegadoUser) {
          return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador a delegar nao encontrado' });
        }

        const user = (req as any).user;
        const assinatura = await requireSignature(user.id);
        const data = safeParse(existing.data, {});
        const delegacoes = Array.isArray(data.delegacoes) ? data.delegacoes : [];
        const motivo = req.body.delegationNotes || req.body.motivo_delegacao || '';
        const novaDelegacao = {
          id: crypto.randomUUID(),
          delegado_para_id: delegadoUser.id,
          delegado_para_nome: delegadoUser.name,
          delegado_para_cargo: delegadoUser.position || delegadoUser.role,
          motivo,
          delegado_por_id: user.id,
          delegado_por_nome: user.name,
          assinatura_url: assinatura.assinatura_url,
          created_at: new Date().toISOString(),
        };

        const updated = await model.update({
          where: { id: existing.id },
          data: {
            status: 'delegado',
            data: stringify({
              ...data,
              delegatedTo: delegadoUser.id,
              delegatedToEmail: delegadoUser.email,
              delegatedToName: delegadoUser.name,
              delegationNotes: motivo,
              assigned_to_id: delegadoUser.id,
              assigned_to_name: delegadoUser.name,
              delegado_por_id: user.id,
              delegado_por_nome: user.name,
              delegado_assinatura_url: assinatura.assinatura_url,
              delegacoes: [...delegacoes, novaDelegacao],
            }),
          },
        });

        if (delegadoUser.email) {
          const assunto = config.name === 'presentation' ? 'uma carta de apresentação' : 'um pedido de audiência';
          await notifications.createNotification(
            delegadoUser.email,
            config.name === 'presentation' ? 'presentation_delegada' : 'audience_delegada',
            `${user.name} delegou-lhe ${assunto}.`,
            existing.id
          ).catch(() => null);
        }

        const resource = recordToResource(updated);
        return res.status(200).json({ success: true, data: resource, [config.itemKey]: resource });
      } catch (error) {
        next(error);
      }
    });
  }

  if (config.name === 'acta') {
    // Assinatura digital da acta, com o mesmo modelo usado na Ordem de
    // Pagamento: usa a assinatura carregada no perfil do utilizador (Meu
    // Perfil), gated por papel/cargo, guardada num historico em data.
    router.post(`${config.path}/:id/assinar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const user = (req as any).user;
        const papel = req.body.papel;
        if (!papel || !ALLOWED_SIGNATURE_PAPEIS.acta.includes(papel)) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Papel de assinatura invalido (use presidente ou secretario)' });
        }
        if (user?.role !== SIGNATURE_ROLE_MAP[papel]) {
          return res.status(403).json({ error: 'FORBIDDEN', message: `Apenas o utilizador com o cargo de ${papel} pode assinar nesta funcao` });
        }

        const existing = await prisma.acta.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Acta nao encontrada' });

        const signerUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!signerUser?.signatureImage) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Carregue a sua assinatura em "Meu Perfil" antes de assinar' });
        }

        const data = safeParse(existing.data, {});
        const assinaturas = (Array.isArray(data.assinaturas_reais) ? data.assinaturas_reais : [])
          .filter((assinatura: any) => assinatura.papel !== papel);
        assinaturas.push({
          papel,
          user_id: user.id,
          nome: user.name,
          assinatura_url: signerUser.signatureImage,
          assinado_em: new Date().toISOString(),
        });

        const updated = await prisma.acta.update({
          where: { id: existing.id },
          data: { data: stringify({ ...data, assinaturas_reais: assinaturas }) },
        });
        return res.status(200).json({ success: true, acta: recordToResource(updated) });
      } catch (error) {
        next(error);
      }
    });

    // Finalizar: fecha a edicao do conteudo (resumo/decisoes/tarefas) e liberta a
    // acta para assinatura. Registada aqui (antes da rota generica de "/finalizar"
    // mais abaixo, que so serve outros modulos) para usar o estado real do
    // fluxo de actas em vez do generico STATUS.PENDENTE.
    router.post(`${config.path}/:id/finalizar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.acta.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Acta nao encontrada' });

        if (!['rascunho', 'pendente', 'em_curso'].includes(existing.status)) {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: `Acta com estado "${existing.status}" nao pode ser finalizada.`
          });
        }

        const updated = await prisma.acta.update({ where: { id: existing.id }, data: { status: 'finalizada' } });
        return res.status(200).json({ success: true, acta: recordToResource(updated) });
      } catch (error) {
        next(error);
      }
    });

    // Aprovar: so depois de assinada pelo Presidente e pelo Secretario. Ao
    // aprovar, envia a acta por e-mail a todos os participantes da reuniao de
    // origem (organizador + participantes da reuniao interna ligada).
    router.post(`${config.path}/:id/aprovar`, requireAuth as any, requireLicense as any, async (req, res, next) => {
      try {
        const existing = await prisma.acta.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Acta nao encontrada' });

        if (existing.status !== 'finalizada') {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'A acta tem de estar finalizada antes de ser aprovada.'
          });
        }

        const data = safeParse(existing.data, {});
        const assinaturas = Array.isArray(data.assinaturas_reais) ? data.assinaturas_reais : [];
        const papeisAssinados = new Set(assinaturas.map((assinatura: any) => assinatura.papel));
        if (!papeisAssinados.has('presidente') || !papeisAssinados.has('secretario')) {
          return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'A acta precisa da assinatura do Presidente e do Secretário antes de ser aprovada.'
          });
        }

        const user = (req as any).user;
        const updated = await prisma.acta.update({
          where: { id: existing.id },
          data: {
            status: 'aprovada',
            data: stringify({
              ...data,
              aprovada_por_id: user.id,
              aprovada_por_nome: user.name,
              aprovada_em: new Date().toISOString(),
            }),
          }
        });

        // Reunir destinatarios: organizador da acta + participantes da reuniao
        // interna de origem (o array acta.participantes nao guarda e-mails, so
        // nome/cargo, por isso vamos buscar os e-mails reais a reuniao ligada).
        const destinatarios = new Map<string, string>();
        if (existing.createdById) {
          const organizador = await prisma.user.findUnique({ where: { id: existing.createdById } });
          if (organizador?.email) destinatarios.set(organizador.email.toLowerCase(), organizador.name);
        }
        if (existing.internalMeetingId) {
          const meeting = await prisma.internalMeeting.findUnique({ where: { id: existing.internalMeetingId } });
          if (meeting?.participantId) {
            const participanteDirecto = await prisma.user.findUnique({ where: { id: meeting.participantId } });
            if (participanteDirecto?.email) destinatarios.set(participanteDirecto.email.toLowerCase(), participanteDirecto.name);
          }
          const participantesReuniao = await prisma.internalMeetingParticipant.findMany({
            where: { meetingId: existing.internalMeetingId },
          });
          for (const participante of participantesReuniao) {
            if (participante.email) destinatarios.set(participante.email.toLowerCase(), participante.name);
          }
        }

        const assunto = existing.assunto || 'Reunião';
        const numero = existing.numero || existing.id;
        const resumo = data.resumo || null;

        await Promise.all(
          Array.from(destinatarios.entries()).map(([email, nome]) =>
            emailService.sendEmail({
              to: email,
              subject: `Acta aprovada - ${assunto} (${numero})`,
              html: actaAprovadaEmailHtml(nome, assunto, numero, resumo),
            }).catch((error) => logger.error(`Falha ao enviar acta aprovada a ${email}:`, error))
          )
        );

        return res.status(200).json({
          success: true,
          acta: recordToResource(updated),
          notificados: destinatarios.size,
        });
      } catch (error) {
        next(error);
      }
    });
  }

  router.get(`${config.path}/:id/history`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.history(req, res, next, config));
  router.get(`${config.path}/:id/historico`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.history(req, res, next, config));
  router.get(`${config.path}/:id`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.get(req, res, next, config));
  router.put(`${config.path}/:id`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.put(`${config.path}/:id/status`, requireAuth as any, requireLicense as any, (req, res, next) => {
    req.body = enrichMeetingBody(req.body);
    const isOnline = (req.body.meetingType || req.body.meeting_type) === 'online';
    const hasLink = req.body.meetingLink || req.body.meeting_link;
    if (isOnline && !hasLink) {
      return res.status(422).json({
        error: 'MEETING_PLATFORM_NOT_CONFIGURED',
        message: 'Nenhuma plataforma de reunião está configurada (nem API real, nem link fixo). Peça ao administrador do sistema para configurar em Configurações → Integrações antes de agendar reuniões online.',
      });
    }
    return ModuleRoutesHelper.update(req, res, next, config);
  });
  router.delete(`${config.path}/:id`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.delete(req, res, next, config));

  router.post(`${config.path}/:id/approve`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.APROVADO));
  router.post(`${config.path}/:id/aprovar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.APROVADO));
  router.post(`${config.path}/:id/accept`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'aceite'));
  router.post(`${config.path}/:id/reject`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.REJEITADO));
  router.post(`${config.path}/:id/rejeitar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.REJEITADO));
  router.post(`${config.path}/:id/submit`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PENDENTE));
  router.post(`${config.path}/:id/submeter`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PENDENTE));
  router.post(`${config.path}/:id/finalizar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PENDENTE));
  router.post(`${config.path}/:id/arquivar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.ARQUIVADO));
  router.post(`${config.path}/:id/ativar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.ACTIVO));
  router.post(`${config.path}/:id/desativar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.INACTIVO));
  router.post(`${config.path}/:id/cancel`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.CANCELADO));
  router.post(`${config.path}/:id/cancelar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.CANCELADO));
  router.post(`${config.path}/:id/concluir`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'concluido'));
  router.post(`${config.path}/:id/validate`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'validado'));
  router.post(`${config.path}/:id/validar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'validado'));
  router.post(`${config.path}/:id/pagar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PAGO));
  router.post(`${config.path}/:id/pay`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PAGO));
  router.post(`${config.path}/:id/submit-banco`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'submetido_ao_banco'));
  router.post(`${config.path}/:id/submeter-banco`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'submetido_ao_banco'));
  router.post(`${config.path}/:id/cotacao`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'cotacao'));
  router.post(`${config.path}/:id/enviar-aprovacao`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'aprovacao'));
  router.post(`${config.path}/:id/ordem-compra`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'ordem_compra'));
  router.post(`${config.path}/:id/receber`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'recebida'));
  router.post(`${config.path}/:id/renovar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'renovacao_pendente'));
  router.post(`${config.path}/:id/expirar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'expirado'));
  router.post(`${config.path}/:id/analise`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'em_analise'));
  router.post(`${config.path}/:id/resolucao`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'em_resolucao'));
  router.post(`${config.path}/:id/resolver`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'resolvida'));
  router.post(`${config.path}/:id/fechar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'fechada'));

  router.post(`${config.path}/:id/despachos`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/despacho`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/acao`, requireAuth as any, requireLicense as any, async (req, res, next) => {
    try {
      const existing = await (prisma as any)[config.model].findUnique({ where: { id: req.params.id } });
      const data = existing?.data ? JSON.parse(existing.data) : {};
      const acoes = Array.isArray(data.acoes) ? data.acoes : [];
      const acao = {
        id: crypto.randomUUID(),
        descricao: req.body.descricao || req.body.mensagem || req.body.conteudo || '',
        tipo_acao: req.body.tipo_acao || req.body.tipoAcao || 'comentario',
        autor_id: (req as any).user?.id,
        autor_nome: (req as any).user?.name,
        created_at: new Date().toISOString(),
      };
      req.body = {
        ...req.body,
        acoes: [...acoes, acao],
        ultima_acao: acao,
      };
      return ModuleRoutesHelper.update(req, res, next, config);
    } catch (error) {
      next(error);
    }
  });
  router.post(`${config.path}/:id/compartilhar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/atribuir`, requireAuth as any, requireLicense as any, (req, res, next) => {
    req.body = {
      ...req.body,
      responsavel_id: req.body.responsavel_id || req.body.responsavelId,
      responsavel_nome: req.body.responsavel_nome || req.body.responsavelNome,
      atribuido_em: new Date().toISOString(),
    };
    return ModuleRoutesHelper.update(req, res, next, config);
  });
  router.post(`${config.path}/:id/delegar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/delegate`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/assign`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/anexos`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/assinar`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/enviar-revisao`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'em_revisao'));
  router.get(`${config.path}/:id/pdf`, requireAuth as any, requireLicense as any, (req, res) => res.status(200).json({ success: true, id: req.params.id, pdfUrl: null, message: 'Exportacao PDF sera gerada no frontend.' }));
  router.post(`${config.path}/:id/responder`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.create(req, res, next, config));
  router.get(`${config.path}/:id/intervencoes`, requireAuth as any, requireLicense as any, (_req, res) => res.status(200).json({ success: true, intervencoes: [] }));
  router.post(`${config.path}/:id/intervencoes`, requireAuth as any, requireLicense as any, (req, res) => res.status(201).json({ success: true, intervencao: { id: crypto.randomUUID(), ...req.body } }));
  router.put(`${config.path}/:id/intervencoes/:intervencaoId`, requireAuth as any, requireLicense as any, (req, res) => res.status(200).json({ success: true, intervencao: { id: req.params.intervencaoId, ...req.body } }));
  router.delete(`${config.path}/:id/intervencoes/:intervencaoId`, requireAuth as any, requireLicense as any, (req, res) => res.status(200).json({ success: true, id: req.params.intervencaoId }));
  router.post(`${config.path}/:id/fechar-publica`, requireAuth as any, requireLicense as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'fechada'));
}

// Categorias de produtos/servicos do Procurement: usadas tanto no cadastro de
// fornecedores (que categorias fornece) como nos pedidos de compra (que
// categoria esta a ser adquirida). Registadas aqui, fora do CRUD generico,
// para que fiquem sempre antes do fallback generico "/procurement/:id".
router.get('/procurement/categorias', requireAuth as any, async (_req, res, next) => {
  try {
    const categorias = await prisma.procurementCategoria.findMany({ orderBy: { nome: 'asc' } });
    res.status(200).json({ success: true, categorias });
  } catch (error) {
    next(error);
  }
});

router.post('/procurement/categorias', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const nome = String(req.body?.nome || '').trim();
    if (!nome) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'O nome da categoria e obrigatorio.' });
    }

    const existente = await prisma.procurementCategoria.findUnique({ where: { nome } });
    if (existente) {
      return res.status(200).json({ success: true, categoria: existente });
    }

    const categoria = await prisma.procurementCategoria.create({
      data: {
        id: crypto.randomUUID(),
        nome,
        createdById: req.user?.id,
      }
    });
    res.status(201).json({ success: true, categoria });
  } catch (error) {
    next(error);
  }
});

modules
  .slice()
  .sort((a, b) => b.path.length - a.path.length)
  .forEach(registerCrud);

export default router;
