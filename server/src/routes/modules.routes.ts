import { Router } from 'express';
import { ModuleRoutesHelper, ModuleConfig, STATUS } from '../utils/module-routes-helper';
import { requireAuth } from '../middlewares/auth';
import { MeetingLinkService } from '../services/meeting-link.service';
import prisma from '../config/database';

const router = Router();

function safeParse(value: any, fallback: any = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
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
    total_cotacoes: cotacoes.length,
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
    submitted_at: record.createdAt?.toISOString?.() || record.createdAt,
    anexos: safeParse(record.anexos, []),
  };
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

function budgetToOrcamento(record: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    numero: record.numero,
    ano_fiscal: record.ano,
    periodo: record.periodo,
    departamento: record.department,
    valor_previsto: record.totalOrcado || data.valor_previsto || 0,
    valor_aprovado: record.totalOrcado || data.valor_aprovado,
    valor_reservado: record.totalComprometido || data.valor_reservado || 0,
    status: record.status,
    categorias: data.categorias || data.lines || [],
    elaborado_por: record.createdByName,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

function payableToConta(record: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    numero: record.numero,
    fornecedor: record.fornecedor,
    descricao: record.descricao,
    valor: record.valor,
    moeda: record.moeda,
    data_vencimento: record.dataVencimento,
    status: record.status === 'pago' ? 'paga' : record.status,
    categoria: data.categoria || record.origemModulo || 'geral',
    centro_custo: data.centro_custo || data.centroCusto,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

function receivableToConta(record: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    numero: record.numero,
    cliente: record.cliente,
    descricao: record.descricao,
    valor: record.valor,
    moeda: record.moeda,
    data_vencimento: record.dataVencimento,
    status: record.status,
    categoria: data.categoria || record.origemModulo || 'geral',
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

function reportToRelatorio(record: any) {
  const payload = safeParse(record?.payload, {});
  return {
    ...safeParse(record?.data, {}),
    id: record.id,
    numero: record.id,
    tipo: record.tipo,
    titulo: record.tipo,
    periodo_inicio: record.periodoInicio,
    periodo_fim: record.periodoFim,
    departamento: record.department,
    dados: payload,
    status: 'rascunho',
    elaborado_por: record.createdByName,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
  };
}

function metaToResource(record: any) {
  const data = safeParse(record?.data, {});
  return {
    ...data,
    id: record.id,
    numero: data.numero || record.id,
    titulo: record.titulo,
    descricao: record.descricao,
    tipo: data.tipo_meta || record.tipo || 'outra',
    valor_alvo: record.valor || data.valor_alvo || 0,
    valor_atual: data.valor_atual || 0,
    percentual_progresso: data.percentual_progresso || 0,
    data_inicio: record.dataInicio || data.data_inicio,
    data_fim: record.dataFim || data.data_fim,
    departamento: data.departamento || record.createdByName || '',
    status: record.status || data.status || 'planejada',
    prioridade: data.prioridade || 'media',
    criado_por: record.createdByName,
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
    name: 'oficio',
    displayName: 'Oficio',
    model: 'oficio',
    path: '/oficios',
    collectionKey: 'oficios',
    itemKey: 'oficio',
    permissionModule: 'oficios',
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
    name: 'viatura',
    displayName: 'Viatura',
    model: 'viatura',
    path: '/frotas',
    collectionKey: 'viaturas',
    itemKey: 'viatura',
    permissionModule: 'fleet',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'utilizacao_viatura',
    displayName: 'Utilizacao de Viatura',
    model: 'utilizacaoViatura',
    path: '/frotas/utilizacoes',
    collectionKey: 'utilizacoes',
    itemKey: 'utilizacao',
    permissionModule: 'fleet',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'manutencao_viatura',
    displayName: 'Manutencao de Viatura',
    model: 'manutencaoViatura',
    path: '/frotas/manutencoes',
    collectionKey: 'manutencoes',
    itemKey: 'manutencao',
    permissionModule: 'fleet',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'contrato',
    displayName: 'Contrato',
    model: 'contrato',
    path: '/contratos',
    collectionKey: 'contratos',
    itemKey: 'contrato',
    permissionModule: 'documents',
    createAction: 'create',
    readAction: 'read_all',
    updateAction: 'update',
    deleteAction: 'delete',
    approveAction: 'approve',
    rejectAction: 'reject'
  },
  {
    name: 'reclamacao',
    displayName: 'Reclamacao',
    model: 'reclamacao',
    path: '/reclamacoes',
    collectionKey: 'reclamacoes',
    itemKey: 'reclamacao',
    permissionModule: 'documents',
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
    name: 'planejamento',
    displayName: 'Planejamento',
    model: 'planejamento',
    path: '/planejamento',
    collectionKey: 'planejamentos',
    itemKey: 'planejamento',
    permissionModule: 'schedule',
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
    name: 'operador',
    displayName: 'Operador',
    model: 'operador',
    path: '/operadores',
    collectionKey: 'operadores',
    itemKey: 'operador',
    permissionModule: 'fleet',
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
  },
  {
    name: 'pedido_viatura',
    displayName: 'Pedido de Viatura',
    model: 'pedidoViatura',
    path: '/frotas/pedidos-viatura',
    collectionKey: 'pedidos',
    itemKey: 'pedido',
    permissionModule: 'fleet',
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

  router.post(config.path, requireAuth as any, (req, res, next) => ModuleRoutesHelper.create(req, res, next, config));
  router.get(config.path, requireAuth as any, (req, res, next) => ModuleRoutesHelper.list(req, res, next, config));
  router.get(`${config.path}/list`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.list(req, res, next, config));
  router.get(`${config.path}/stats/geral`, requireAuth as any, async (req, res, next) => {
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
  router.post(`${config.path}/publica`, (req, res, next) => {
    (req as any).user = { id: 'publico', email: 'publico@sipar20.local', name: 'Publico', role: 'admin' };
    return ModuleRoutesHelper.create(req as any, res, next, config);
  });
  router.get(`${config.path}/rastreio/:codigo`, (req, res, next) => {
    (req as any).user = { id: 'publico', email: 'publico@sipar20.local', name: 'Publico', role: 'admin' };
    return ModuleRoutesHelper.list(req as any, res, next, config);
  });

  if (config.name === 'procurement') {
    router.get(`${config.path}/stats`, requireAuth as any, async (_req, res, next) => {
      try {
        const [pedidos, fornecedores, ordens] = await Promise.all([
          prisma.procurement.findMany(),
          prisma.fornecedor.findMany(),
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

    router.get(`${config.path}/pedidos`, requireAuth as any, async (_req, res, next) => {
      try {
        const records = await prisma.procurement.findMany({ orderBy: { createdAt: 'desc' } });
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

    router.post(`${config.path}/pedidos`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.procurement.create({
          data: {
            id: `procurement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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

    router.get(`${config.path}/pedidos/:pedidoId`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!record) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
        const cotacoes = await prisma.purchaseQuotation.findMany({ where: { procurementId: record.id }, orderBy: { valor: 'asc' } });
        return res.status(200).json({ pedido: procurementToPedido(record, cotacoes.map(cotacaoToResource)) });
      } catch (error) {
        next(error);
      }
    });

    router.put(`${config.path}/pedidos/:pedidoId`, requireAuth as any, async (req, res, next) => {
      try {
        const existing = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
        const data = { ...safeParse(existing.data, {}), ...req.body };
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

    router.delete(`${config.path}/pedidos/:pedidoId`, requireAuth as any, async (req, res, next) => {
      try {
        await prisma.procurement.delete({ where: { id: req.params.pedidoId } });
        return res.status(200).json({ success: true });
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

    router.post(`${config.path}/pedidos/:pedidoId/publicar`, requireAuth as any, setPedidoStatus('aguardando_cotacoes'));
    router.post(`${config.path}/pedidos/:pedidoId/cancelar`, requireAuth as any, setPedidoStatus('cancelado'));
    router.post(`${config.path}/pedidos/:pedidoId/analisar`, requireAuth as any, setPedidoStatus('em_analise'));
    router.post(`${config.path}/pedidos/:pedidoId/confirmar-recebimento`, requireAuth as any, setPedidoStatus('concluido'));

    router.get(`${config.path}/pedidos/:pedidoId/cotacoes`, requireAuth as any, async (req, res, next) => {
      try {
        const cotacoes = await prisma.purchaseQuotation.findMany({ where: { procurementId: req.params.pedidoId }, orderBy: { valor: 'asc' } });
        return res.status(200).json({ cotacoes: cotacoes.map(cotacaoToResource) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/pedidos/:pedidoId/cotacoes`, requireAuth as any, async (req, res, next) => {
      try {
        const cotacao = await prisma.purchaseQuotation.create({
          data: {
            procurementId: req.params.pedidoId,
            fornecedorId: req.body.fornecedor_id || req.body.fornecedorId || null,
            fornecedor: req.body.fornecedor_nome || req.body.fornecedor || 'Fornecedor',
            email: req.body.fornecedor_email || req.body.email || null,
            valor: numberValue(req.body.valor_total || req.body.valor),
            moeda: req.body.moeda || 'AOA',
            anexos: stringify(req.body.anexos, []),
            data: stringify(req.body),
          }
        });
        await prisma.procurement.update({ where: { id: req.params.pedidoId }, data: { status: 'em_cotacao' } }).catch(() => null);
        return res.status(201).json({ cotacao: cotacaoToResource(cotacao) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/pedidos/:pedidoId/aprovar`, requireAuth as any, async (req, res, next) => {
      try {
        const cotacao = req.body.cotacao_id
          ? await prisma.purchaseQuotation.findUnique({ where: { id: req.body.cotacao_id } })
          : null;
        const updated = await prisma.procurement.update({
          where: { id: req.params.pedidoId },
          data: {
            status: 'aprovado',
            fornecedorId: cotacao?.fornecedorId || null,
            fornecedor: cotacao?.fornecedor || null,
            valor: cotacao?.valor || undefined,
          }
        });
        return res.status(200).json({ pedido: procurementToPedido(updated) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/pedidos/:pedidoId/emitir-ordem`, requireAuth as any, async (req, res, next) => {
      try {
        const pedido = await prisma.procurement.findUnique({ where: { id: req.params.pedidoId } });
        if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pedido de compra nao encontrado' });
        const ordem = await prisma.purchaseOrder.create({
          data: {
            numero: `OC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
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
        const updated = await prisma.procurement.update({ where: { id: pedido.id }, data: { status: 'ordem_emitida' } });
        return res.status(201).json({ ordem: ordemToResource(ordem, pedido), pedido: procurementToPedido(updated) });
      } catch (error) {
        next(error);
      }
    });

    router.put(`${config.path}/ordens/:ordemId/status`, requireAuth as any, async (req, res, next) => {
      try {
        const ordem = await prisma.purchaseOrder.update({ where: { id: req.params.ordemId }, data: { status: req.body.status || 'emitida' } });
        return res.status(200).json({ ordem: ordemToResource(ordem) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/fornecedores`, requireAuth as any, async (_req, res, next) => {
      try {
        const records = await prisma.fornecedor.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ fornecedores: records.map(fornecedorToResource) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.create({
          data: {
            id: `fornecedor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
        return res.status(201).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/auto-create`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.create({
          data: {
            id: `fornecedor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
        return res.status(201).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/fornecedores/:fornecedorId`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.findUnique({ where: { id: req.params.fornecedorId } });
        if (!record) return res.status(404).json({ error: 'NOT_FOUND', message: 'Fornecedor nao encontrado' });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.put(`${config.path}/fornecedores/:fornecedorId`, requireAuth as any, async (req, res, next) => {
      try {
        const existing = await prisma.fornecedor.findUnique({ where: { id: req.params.fornecedorId } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Fornecedor nao encontrado' });
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

    router.delete(`${config.path}/fornecedores/:fornecedorId`, requireAuth as any, async (req, res, next) => {
      try {
        await prisma.fornecedor.delete({ where: { id: req.params.fornecedorId } });
        return res.status(200).json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/ativar`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.update({ where: { id: req.params.fornecedorId }, data: { status: 'ativo' } });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/desativar`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.update({ where: { id: req.params.fornecedorId }, data: { status: 'inativo' } });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/bloquear`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.fornecedor.update({ where: { id: req.params.fornecedorId }, data: { status: 'bloqueado' } });
        return res.status(200).json({ fornecedor: fornecedorToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/fornecedores/:fornecedorId/enviar-credenciais`, requireAuth as any, (_req, res) => {
      return res.status(200).json({ success: true, message: 'Credenciais registadas para envio.' });
    });
  }

  if (config.name === 'planejamento') {
    router.get(`${config.path}/orcamentos`, requireAuth as any, async (_req, res, next) => {
      try {
        const records = await prisma.budget.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ orcamentos: records.map(budgetToOrcamento) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/orcamentos`, requireAuth as any, async (req, res, next) => {
      try {
        const categorias = Array.isArray(req.body.categorias) ? req.body.categorias : [];
        const totalOrcado = numberValue(req.body.valor_previsto || req.body.valor_aprovado || req.body.totalOrcado, 0);
        const record = await prisma.budget.create({
          data: {
            numero: req.body.numero || `ORC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            ano: Number(req.body.ano_fiscal || req.body.ano || new Date().getFullYear()),
            periodo: req.body.periodo || String(new Date().getFullYear()),
            department: req.body.departamento || req.body.department || null,
            titulo: req.body.titulo || `Orcamento ${new Date().getFullYear()}`,
            status: req.body.status || 'rascunho',
            totalOrcado,
            data: stringify({ ...req.body, categorias }),
            createdById: (req as any).user?.id,
            createdByName: (req as any).user?.name,
          }
        });
        return res.status(201).json({ orcamento: budgetToOrcamento(record) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/contas-pagar`, requireAuth as any, async (_req, res, next) => {
      try {
        const records = await prisma.accountPayable.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ contas_pagar: records.map(payableToConta) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/contas-pagar`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.accountPayable.create({
          data: {
            numero: req.body.numero || `CP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            fornecedor: req.body.fornecedor || req.body.fornecedor_nome || 'Fornecedor',
            descricao: req.body.descricao || req.body.titulo || '',
            valor: numberValue(req.body.valor),
            moeda: req.body.moeda || 'AOA',
            dataVencimento: req.body.data_vencimento || req.body.dataVencimento || new Date().toISOString().slice(0, 10),
            origemModulo: req.body.categoria || 'planejamento',
            data: stringify(req.body),
            createdById: (req as any).user?.id,
            createdByName: (req as any).user?.name,
          }
        });
        return res.status(201).json({ conta_pagar: payableToConta(record) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/contas-receber`, requireAuth as any, async (_req, res, next) => {
      try {
        const records = await prisma.accountReceivable.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ contas_receber: records.map(receivableToConta) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/relatorios`, requireAuth as any, async (_req, res, next) => {
      try {
        const records = await prisma.financialReport.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ relatorios: records.map(reportToRelatorio) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/relatorios`, requireAuth as any, async (req, res, next) => {
      try {
        const [budgets, payables, receivables] = await Promise.all([
          prisma.budget.findMany(),
          prisma.accountPayable.findMany(),
          prisma.accountReceivable.findMany(),
        ]);
        const payload = {
          orcamentos: budgets.length,
          contas_pagar_total: payables.reduce((sum, item) => sum + item.valor, 0),
          contas_receber_total: receivables.reduce((sum, item) => sum + item.valor, 0),
          ...req.body.dados,
        };
        const record = await prisma.financialReport.create({
          data: {
            tipo: req.body.tipo || 'consolidado',
            periodoInicio: req.body.periodo_inicio || req.body.periodoInicio || null,
            periodoFim: req.body.periodo_fim || req.body.periodoFim || null,
            department: req.body.departamento || req.body.department || null,
            payload: stringify(payload),
            createdById: (req as any).user?.id,
            createdByName: (req as any).user?.name,
          }
        });
        return res.status(201).json({ relatorio: reportToRelatorio(record) });
      } catch (error) {
        next(error);
      }
    });

    router.get(`${config.path}/metas`, requireAuth as any, async (_req, res, next) => {
      try {
        const records = await prisma.planejamento.findMany({ where: { tipo: 'meta' }, orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ metas: records.map(metaToResource) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/metas`, requireAuth as any, async (req, res, next) => {
      try {
        const record = await prisma.planejamento.create({
          data: {
            id: `meta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            tipo: 'meta',
            titulo: req.body.titulo,
            descricao: req.body.descricao || '',
            valor: numberValue(req.body.valor_alvo || req.body.valor),
            dataInicio: req.body.data_inicio || req.body.dataInicio || null,
            dataFim: req.body.data_fim || req.body.dataFim || null,
            status: req.body.status || 'planejada',
            data: stringify(req.body),
            createdById: (req as any).user?.id,
            createdByName: (req as any).user?.name,
          }
        });
        return res.status(201).json({ meta: metaToResource(record) });
      } catch (error) {
        next(error);
      }
    });

    router.post(`${config.path}/metas/:metaId/progresso`, requireAuth as any, async (req, res, next) => {
      try {
        const existing = await prisma.planejamento.findUnique({ where: { id: req.params.metaId } });
        if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Meta nao encontrada' });
        const data = safeParse(existing.data, {});
        const progresso = Array.isArray(data.progresso_diario) ? data.progresso_diario : [];
        const valorAtual = numberValue(req.body.valor_acumulado || req.body.valor_atual || req.body.valor_realizado, data.valor_atual || 0);
        const valorAlvo = numberValue(data.valor_alvo || existing.valor, 0);
        const updated = await prisma.planejamento.update({
          where: { id: existing.id },
          data: {
            data: stringify({
              ...data,
              valor_atual: valorAtual,
              percentual_progresso: valorAlvo > 0 ? Math.min(100, (valorAtual / valorAlvo) * 100) : 0,
              progresso_diario: [...progresso, { ...req.body, data: req.body.data || new Date().toISOString().slice(0, 10) }],
            }),
          }
        });
        return res.status(200).json({ meta: metaToResource(updated) });
      } catch (error) {
        next(error);
      }
    });
  }

  router.get(`${config.path}/:id/history`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.history(req, res, next, config));
  router.get(`${config.path}/:id/historico`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.history(req, res, next, config));
  router.get(`${config.path}/:id`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.get(req, res, next, config));
  router.put(`${config.path}/:id`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.put(`${config.path}/:id/status`, requireAuth as any, (req, res, next) => {
    req.body = enrichMeetingBody(req.body);
    return ModuleRoutesHelper.update(req, res, next, config);
  });
  router.delete(`${config.path}/:id`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.delete(req, res, next, config));

  router.post(`${config.path}/:id/approve`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.APROVADO));
  router.post(`${config.path}/:id/aprovar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.APROVADO));
  router.post(`${config.path}/:id/accept`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'aceite'));
  router.post(`${config.path}/:id/reject`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.REJEITADO));
  router.post(`${config.path}/:id/rejeitar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.REJEITADO));
  router.post(`${config.path}/:id/submit`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PENDENTE));
  router.post(`${config.path}/:id/submeter`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PENDENTE));
  router.post(`${config.path}/:id/finalizar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PENDENTE));
  router.post(`${config.path}/:id/arquivar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.ARQUIVADO));
  router.post(`${config.path}/:id/ativar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.ACTIVO));
  router.post(`${config.path}/:id/desativar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.INACTIVO));
  router.post(`${config.path}/:id/cancel`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.CANCELADO));
  router.post(`${config.path}/:id/cancelar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.CANCELADO));
  router.post(`${config.path}/:id/concluir`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'concluido'));
  router.post(`${config.path}/:id/validate`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'validado'));
  router.post(`${config.path}/:id/validar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'validado'));
  router.post(`${config.path}/:id/pagar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PAGO));
  router.post(`${config.path}/:id/pay`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, STATUS.PAGO));
  router.post(`${config.path}/:id/submit-banco`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'submetido_banco'));
  router.post(`${config.path}/:id/submeter-banco`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'submetido_banco'));
  router.post(`${config.path}/:id/cotacao`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'cotacao'));
  router.post(`${config.path}/:id/enviar-aprovacao`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'aprovacao'));
  router.post(`${config.path}/:id/ordem-compra`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'ordem_compra'));
  router.post(`${config.path}/:id/receber`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'recebida'));
  router.post(`${config.path}/:id/renovar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'renovacao_pendente'));
  router.post(`${config.path}/:id/expirar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'expirado'));
  router.post(`${config.path}/:id/analise`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'em_analise'));
  router.post(`${config.path}/:id/resolucao`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'em_resolucao'));
  router.post(`${config.path}/:id/resolver`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'resolvida'));
  router.post(`${config.path}/:id/fechar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'fechada'));

  router.post(`${config.path}/:id/despachos`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/despacho`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/acao`, requireAuth as any, async (req, res, next) => {
    try {
      const existing = await (prisma as any)[config.model].findUnique({ where: { id: req.params.id } });
      const data = existing?.data ? JSON.parse(existing.data) : {};
      const acoes = Array.isArray(data.acoes) ? data.acoes : [];
      const acao = {
        id: `acao_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
  router.post(`${config.path}/:id/compartilhar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/atribuir`, requireAuth as any, (req, res, next) => {
    req.body = {
      ...req.body,
      responsavel_id: req.body.responsavel_id || req.body.responsavelId,
      responsavel_nome: req.body.responsavel_nome || req.body.responsavelNome,
      atribuido_em: new Date().toISOString(),
    };
    return ModuleRoutesHelper.update(req, res, next, config);
  });
  router.post(`${config.path}/:id/delegar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/delegate`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/assign`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/anexos`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/assinar`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.update(req, res, next, config));
  router.post(`${config.path}/:id/enviar-revisao`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'em_revisao'));
  router.get(`${config.path}/:id/pdf`, requireAuth as any, (req, res) => res.status(200).json({ success: true, id: req.params.id, pdfUrl: null, message: 'Exportacao PDF sera gerada no frontend.' }));
  router.post(`${config.path}/:id/responder`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.create(req, res, next, config));
  router.get(`${config.path}/:id/intervencoes`, requireAuth as any, (_req, res) => res.status(200).json({ success: true, intervencoes: [] }));
  router.post(`${config.path}/:id/intervencoes`, requireAuth as any, (req, res) => res.status(201).json({ success: true, intervencao: { id: `intervencao_${Date.now()}`, ...req.body } }));
  router.put(`${config.path}/:id/intervencoes/:intervencaoId`, requireAuth as any, (req, res) => res.status(200).json({ success: true, intervencao: { id: req.params.intervencaoId, ...req.body } }));
  router.delete(`${config.path}/:id/intervencoes/:intervencaoId`, requireAuth as any, (req, res) => res.status(200).json({ success: true, id: req.params.intervencaoId }));
  router.post(`${config.path}/:id/fechar-publica`, requireAuth as any, (req, res, next) => ModuleRoutesHelper.setStatus(req, res, next, config, 'fechada'));
}

modules
  .slice()
  .sort((a, b) => b.path.length - a.path.length)
  .forEach(registerCrud);

export default router;
