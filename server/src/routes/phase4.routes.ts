import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import prisma from '../config/database';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import { SequenceService } from '../services/sequence.service';
import { HistoryService } from '../services/history.service';
import logger from '../config/logger';

const router = Router();
router.use(requireLicenseModule('finance'));

function parse(value: any, fallback: any = {}) {
  if (!value) return fallback;
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

function toRecord(record: any) {
  if (!record) return null;
  return {
    ...record,
    data: parse(record.data, {}),
    itens: parse(record.itens, undefined),
    anexos: parse(record.anexos, undefined),
    payload: parse(record.payload, undefined),
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
    recebido_em: record.recebidoEm?.toISOString?.() || record.recebidoEm,
    pago_em: record.pagoEm?.toISOString?.() || record.pagoEm,
    recebidoEm: record.recebidoEm?.toISOString?.() || record.recebidoEm,
    pagoEm: record.pagoEm?.toISOString?.() || record.pagoEm,
  };
}

async function nextNumber(module: string) {
  const sequence = await SequenceService.next(module);
  return sequence?.value || `${module.toUpperCase()}-${Date.now()}`;
}

async function recalcBudget(budgetId: string) {
  const [lines, executions] = await Promise.all([
    prisma.budgetLine.findMany({ where: { budgetId } }),
    prisma.budgetExecution.findMany({ where: { budgetId } }),
  ]);

  const totalOrcado = lines.reduce((sum, line) => sum + line.valorOrcado, 0);
  const totalComprometido = executions
    .filter((item) => item.tipo === 'comprometido')
    .reduce((sum, item) => sum + item.valor, 0);
  const totalRealizado = executions
    .filter((item) => item.tipo === 'realizado')
    .reduce((sum, item) => sum + item.valor, 0);

  await prisma.budget.update({
    where: { id: budgetId },
    data: { totalOrcado, totalComprometido, totalRealizado },
  });

  for (const line of lines) {
    const lineExecutions = executions.filter((item) => item.budgetLineId === line.id);
    await prisma.budgetLine.update({
      where: { id: line.id },
      data: {
        valorComprometido: lineExecutions.filter((item) => item.tipo === 'comprometido').reduce((sum, item) => sum + item.valor, 0),
        valorRealizado: lineExecutions.filter((item) => item.tipo === 'realizado').reduce((sum, item) => sum + item.valor, 0),
      }
    });
  }

  return { totalOrcado, totalComprometido, totalRealizado, saldoDisponivel: totalOrcado - totalComprometido - totalRealizado };
}

router.post('/procurements/:id/quotations', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const quotation = await prisma.purchaseQuotation.create({
      data: {
        procurementId: req.params.id,
        fornecedorId: req.body.fornecedorId || req.body.fornecedor_id || null,
        fornecedor: req.body.fornecedor,
        email: req.body.email || null,
        valor: numberValue(req.body.valor),
        moeda: req.body.moeda || 'AOA',
        prazoEntrega: req.body.prazoEntrega || req.body.prazo_entrega || null,
        validade: req.body.validade || null,
        anexos: stringify(req.body.anexos, []),
        data: stringify(req.body),
      }
    });

    await prisma.procurement.update({
      where: { id: req.params.id },
      data: { status: 'cotacao' },
    }).catch((error) => logger.warn(`Falha ao sincronizar status do procurement ${req.params.id} para "cotacao":`, error));

    await HistoryService.record({
      module: 'procurement',
      resourceId: req.params.id,
      action: 'quotation_received',
      user: req.user!,
      metadata: { quotationId: quotation.id, fornecedor: quotation.fornecedor, valor: quotation.valor },
    });

    res.status(201).json({ success: true, quotation: toRecord(quotation) });
  } catch (error) {
    next(error);
  }
});

router.get('/procurements/:id/quotations', requireAuth as any, async (req, res, next) => {
  try {
    const quotations = await prisma.purchaseQuotation.findMany({ where: { procurementId: req.params.id }, orderBy: { valor: 'asc' } });
    res.status(200).json({ success: true, quotations: quotations.map(toRecord) });
  } catch (error) {
    next(error);
  }
});

router.post('/quotations/:id/select', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const quotation = await prisma.purchaseQuotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) return res.status(404).json({ error: 'NOT_FOUND', message: 'Cotacao nao encontrada' });

    await prisma.purchaseQuotation.updateMany({ where: { procurementId: quotation.procurementId }, data: { selected: false } });
    const selected = await prisma.purchaseQuotation.update({ where: { id: quotation.id }, data: { selected: true, status: 'selecionada' } });

    if (quotation.procurementId) {
      await prisma.procurement.update({
        where: { id: quotation.procurementId },
        data: {
          status: 'aprovacao',
          fornecedorId: quotation.fornecedorId,
          fornecedor: quotation.fornecedor,
          valor: quotation.valor,
        }
      }).catch((error) => logger.warn(`Falha ao sincronizar procurement ${quotation.procurementId} apos selecionar cotacao ${quotation.id}:`, error));

      await HistoryService.record({
        module: 'procurement',
        resourceId: quotation.procurementId,
        action: 'quotation_selected',
        user: req.user!,
        metadata: { quotationId: quotation.id, fornecedor: quotation.fornecedor, valor: quotation.valor },
      });
    }

    res.status(200).json({ success: true, quotation: toRecord(selected) });
  } catch (error) {
    next(error);
  }
});

router.post('/procurements/:id/purchase-order', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const procurement = await prisma.procurement.findUnique({ where: { id: req.params.id } });
    if (!procurement) return res.status(404).json({ error: 'NOT_FOUND', message: 'Processo de compras nao encontrado' });

    const selectedQuotation = await prisma.purchaseQuotation.findFirst({ where: { procurementId: procurement.id, selected: true } });
    const numero = await nextNumber('purchaseOrder');
    const order = await prisma.purchaseOrder.create({
      data: {
        numero,
        procurementId: procurement.id,
        quotationId: selectedQuotation?.id || req.body.quotationId || null,
        fornecedorId: selectedQuotation?.fornecedorId || procurement.fornecedorId || null,
        fornecedor: selectedQuotation?.fornecedor || procurement.fornecedor || req.body.fornecedor,
        valor: selectedQuotation?.valor || numberValue(procurement.valor || req.body.valor),
        moeda: req.body.moeda || selectedQuotation?.moeda || 'AOA',
        prazoEntrega: req.body.prazoEntrega || req.body.prazo_entrega || selectedQuotation?.prazoEntrega || null,
        localEntrega: req.body.localEntrega || req.body.local_entrega || null,
        itens: stringify(req.body.itens, []),
        anexos: stringify(req.body.anexos, []),
        data: stringify(req.body),
        createdById: req.user?.id,
        createdByName: req.user?.name,
      }
    });

    await prisma.procurement.update({ where: { id: procurement.id }, data: { status: 'ordem_compra' } });
    await HistoryService.record({
      module: 'procurement',
      resourceId: procurement.id,
      action: 'purchase_order_created',
      statusFrom: procurement.status,
      statusTo: 'ordem_compra',
      user: req.user!,
      metadata: { orderId: order.id, numero },
    });

    res.status(201).json({ success: true, purchaseOrder: toRecord(order) });
  } catch (error) {
    next(error);
  }
});

router.get('/purchase-orders', requireAuth as any, async (_req, res, next) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, purchaseOrders: orders.map(toRecord) });
  } catch (error) {
    next(error);
  }
});

router.post('/purchase-orders/:id/receive', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de compra nao encontrada' });

    const updated = await prisma.purchaseOrder.update({
      where: { id: existing.id },
      data: {
        status: 'recebida',
        recebidoEm: new Date(),
        recebidoPorId: req.user?.id,
        recebidoPorNome: req.user?.name,
        data: stringify({ ...parse(existing.data, {}), recebimento: req.body }),
      }
    });

    if (existing.procurementId) {
      await prisma.procurement.update({ where: { id: existing.procurementId }, data: { status: 'recebida' } })
        .catch((error) => logger.warn(`Falha ao sincronizar procurement ${existing.procurementId} para "recebida":`, error));
    }

    res.status(200).json({ success: true, purchaseOrder: toRecord(updated) });
  } catch (error) {
    next(error);
  }
});

router.post('/budgets', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const budget = await prisma.budget.create({
      data: {
        numero: await nextNumber('budget'),
        ano: Number(req.body.ano || new Date().getFullYear()),
        periodo: req.body.periodo || 'anual',
        department: req.body.department || req.body.departamento || null,
        titulo: req.body.titulo,
        status: req.body.status || 'rascunho',
        data: stringify(req.body),
        createdById: req.user?.id,
        createdByName: req.user?.name,
      }
    });
    res.status(201).json({ success: true, budget: toRecord(budget) });
  } catch (error) {
    next(error);
  }
});

router.get('/budgets', requireAuth as any, async (_req, res, next) => {
  try {
    const budgets = await prisma.budget.findMany({ include: { lines: true }, orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, budgets: budgets.map(toRecord) });
  } catch (error) {
    next(error);
  }
});

router.post('/budgets/:id/lines', requireAuth as any, async (req, res, next) => {
  try {
    const line = await prisma.budgetLine.create({
      data: {
        budgetId: req.params.id,
        categoria: req.body.categoria,
        subcategoria: req.body.subcategoria || null,
        descricao: req.body.descricao || null,
        valorOrcado: numberValue(req.body.valorOrcado || req.body.valor_orcado),
        data: stringify(req.body),
      }
    });
    await recalcBudget(req.params.id);
    res.status(201).json({ success: true, line: toRecord(line) });
  } catch (error) {
    next(error);
  }
});

router.post('/budgets/:id/approve', requireAuth as any, async (req: AuthenticatedRequest, res, next) => {
  try {
    const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Orcamento nao encontrado' });
    const budget = await prisma.budget.update({ where: { id: existing.id }, data: { status: 'aprovado' } });
    await HistoryService.record({
      module: 'budget',
      resourceId: budget.id,
      action: 'approved',
      statusFrom: existing.status,
      statusTo: budget.status,
      user: req.user!,
    });
    res.status(200).json({ success: true, budget: toRecord(budget) });
  } catch (error) {
    next(error);
  }
});

router.post('/budgets/:id/executions', requireAuth as any, async (req: AuthenticatedRequest, res, next) => {
  try {
    const execution = await prisma.budgetExecution.create({
      data: {
        budgetId: req.params.id,
        budgetLineId: req.body.budgetLineId || req.body.budget_line_id || null,
        tipo: req.body.tipo || 'realizado',
        valor: numberValue(req.body.valor),
        descricao: req.body.descricao || null,
        origemModulo: req.body.origemModulo || req.body.origem_modulo || null,
        origemId: req.body.origemId || req.body.origem_id || null,
        dataMovimento: req.body.dataMovimento || req.body.data_movimento || new Date().toISOString().slice(0, 10),
        createdById: req.user?.id,
        createdByName: req.user?.name,
        data: stringify(req.body),
      }
    });
    const summary = await recalcBudget(req.params.id);
    res.status(201).json({ success: true, execution: toRecord(execution), summary });
  } catch (error) {
    next(error);
  }
});

router.get('/budgets/:id/summary', requireAuth as any, async (req, res, next) => {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id }, include: { lines: true, executions: true } });
    if (!budget) return res.status(404).json({ error: 'NOT_FOUND', message: 'Orcamento nao encontrado' });
    const summary = await recalcBudget(req.params.id);
    res.status(200).json({ success: true, budget: toRecord(budget), summary });
  } catch (error) {
    next(error);
  }
});

router.post('/accounts-payable', requireAuth as any, async (req: AuthenticatedRequest, res, next) => {
  try {
    const payable = await prisma.accountPayable.create({
      data: {
        numero: await nextNumber('accountPayable'),
        fornecedor: req.body.fornecedor,
        descricao: req.body.descricao,
        valor: numberValue(req.body.valor),
        moeda: req.body.moeda || 'AOA',
        dataVencimento: req.body.dataVencimento || req.body.data_vencimento,
        origemModulo: req.body.origemModulo || req.body.origem_modulo || null,
        origemId: req.body.origemId || req.body.origem_id || null,
        data: stringify(req.body),
        createdById: req.user?.id,
        createdByName: req.user?.name,
      }
    });
    res.status(201).json({ success: true, payable: toRecord(payable) });
  } catch (error) {
    next(error);
  }
});

router.get('/accounts-payable', requireAuth as any, async (_req, res, next) => {
  try {
    const payables = await prisma.accountPayable.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, payables: payables.map(toRecord) });
  } catch (error) {
    next(error);
  }
});

router.post('/accounts-payable/:id/pay', requireAuth as any, async (req, res, next) => {
  try {
    const payable = await prisma.accountPayable.update({ where: { id: req.params.id }, data: { status: 'pago', pagoEm: new Date() } });
    res.status(200).json({ success: true, payable: toRecord(payable) });
  } catch (error) {
    next(error);
  }
});

router.post('/accounts-receivable', requireAuth as any, async (req: AuthenticatedRequest, res, next) => {
  try {
    const receivable = await prisma.accountReceivable.create({
      data: {
        numero: await nextNumber('accountReceivable'),
        cliente: req.body.cliente,
        descricao: req.body.descricao,
        valor: numberValue(req.body.valor),
        moeda: req.body.moeda || 'AOA',
        dataVencimento: req.body.dataVencimento || req.body.data_vencimento,
        origemModulo: req.body.origemModulo || req.body.origem_modulo || null,
        origemId: req.body.origemId || req.body.origem_id || null,
        data: stringify(req.body),
        createdById: req.user?.id,
        createdByName: req.user?.name,
      }
    });
    res.status(201).json({ success: true, receivable: toRecord(receivable) });
  } catch (error) {
    next(error);
  }
});

router.get('/accounts-receivable', requireAuth as any, async (_req, res, next) => {
  try {
    const receivables = await prisma.accountReceivable.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, receivables: receivables.map(toRecord) });
  } catch (error) {
    next(error);
  }
});

router.post('/accounts-receivable/:id/receive', requireAuth as any, async (req, res, next) => {
  try {
    const receivable = await prisma.accountReceivable.update({ where: { id: req.params.id }, data: { status: 'recebido', recebidoEm: new Date() } });
    res.status(200).json({ success: true, receivable: toRecord(receivable) });
  } catch (error) {
    next(error);
  }
});

router.get('/cash-flow', requireAuth as any, async (_req, res, next) => {
  try {
    const [payables, receivables] = await Promise.all([
      prisma.accountPayable.findMany(),
      prisma.accountReceivable.findMany(),
    ]);
    const totalPagar = payables.filter((item) => item.status !== 'pago').reduce((sum, item) => sum + item.valor, 0);
    const totalReceber = receivables.filter((item) => item.status !== 'recebido').reduce((sum, item) => sum + item.valor, 0);
    const pago = payables.filter((item) => item.status === 'pago').reduce((sum, item) => sum + item.valor, 0);
    const recebido = receivables.filter((item) => item.status === 'recebido').reduce((sum, item) => sum + item.valor, 0);
    res.status(200).json({ success: true, cashFlow: { totalPagar, totalReceber, pago, recebido, saldoProjetado: totalReceber - totalPagar, saldoRealizado: recebido - pago } });
  } catch (error) {
    next(error);
  }
});

router.post('/reports/generate', requireAuth as any, async (req: AuthenticatedRequest, res, next) => {
  try {
    const [budgets, payables, receivables, orders] = await Promise.all([
      prisma.budget.findMany(),
      prisma.accountPayable.findMany(),
      prisma.accountReceivable.findMany(),
      prisma.purchaseOrder.findMany(),
    ]);
    const payload = {
      budgets: {
        total: budgets.length,
        totalOrcado: budgets.reduce((sum, item) => sum + item.totalOrcado, 0),
        totalRealizado: budgets.reduce((sum, item) => sum + item.totalRealizado, 0),
      },
      payables: {
        total: payables.length,
        pendente: payables.filter((item) => item.status !== 'pago').reduce((sum, item) => sum + item.valor, 0),
        pago: payables.filter((item) => item.status === 'pago').reduce((sum, item) => sum + item.valor, 0),
      },
      receivables: {
        total: receivables.length,
        pendente: receivables.filter((item) => item.status !== 'recebido').reduce((sum, item) => sum + item.valor, 0),
        recebido: receivables.filter((item) => item.status === 'recebido').reduce((sum, item) => sum + item.valor, 0),
      },
      purchaseOrders: {
        total: orders.length,
        valorTotal: orders.reduce((sum, item) => sum + item.valor, 0),
      }
    };
    const report = await prisma.financialReport.create({
      data: {
        tipo: req.body.tipo || 'financeiro',
        periodoInicio: req.body.periodoInicio || req.body.periodo_inicio || null,
        periodoFim: req.body.periodoFim || req.body.periodo_fim || null,
        department: req.body.department || req.body.departamento || null,
        payload: stringify(payload),
        createdById: req.user?.id,
        createdByName: req.user?.name,
      }
    });
    res.status(201).json({ success: true, report: toRecord(report), payload });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', requireAuth as any, async (_req, res, next) => {
  try {
    const reports = await prisma.financialReport.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, reports: reports.map(toRecord) });
  } catch (error) {
    next(error);
  }
});

export default router;
