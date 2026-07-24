import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth, requireIT } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';
import { BusinessRulesService } from '../services/business-rules.service';
import { emailService } from '../services/email.service';
import { HistoryService } from '../services/history.service';
import { SequenceService } from '../services/sequence.service';
import { ValidationService } from '../services/validation.service';
import { WorkflowService } from '../services/workflow.service';
import logger from '../config/logger';

const router = Router();

function toPedido(record: any) {
  const data = record.data ? JSON.parse(record.data) : {};
  return {
    ...data,
    id: record.id,
    numero: record.numero,
    titulo: record.titulo,
    descricao: record.descricao,
    importancia: record.importancia,
    categoria: record.categoria,
    solicitante_id: record.createdById,
    solicitante_nome: record.createdByName,
    direcao: record.direcao,
    funcao: record.funcao,
    status: record.status,
    anexos: JSON.parse(record.anexos || '[]'),
    aberto_em: record.abertoEm?.toISOString?.() || null,
    resolvido_em: record.resolvidoEm?.toISOString?.() || null,
    fechado_em: record.fechadoEm?.toISOString?.() || null,
    solucao: record.solucao ? JSON.parse(record.solucao) : data.solucao,
    created_by_id: record.createdById,
    created_by_name: record.createdByName,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  };
}

router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isAdminOrIT = user.role === 'admin' ||
      user.role === 'tecnologia_informacao' ||
      user.department === 'Tecnologia da Informacao' ||
      user.department === 'Tecnologia da Informação' ||
      user.department === 'tecnologia_informacao';

    const pedidos = await prisma.pedido.findMany({
      where: isAdminOrIT ? {} : { createdById: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ pedidos: pedidos.map(toPedido) });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/geral', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pedidos = await prisma.pedido.findMany();
    const mapped = pedidos.map(toPedido);

    const stats = {
      total: mapped.length,
      pendentes: mapped.filter(t => t.status === 'pendente').length,
      abertos: mapped.filter(t => t.status === 'aberto').length,
      resolvidos: mapped.filter(t => t.status === 'resolvido').length,
      fechados: mapped.filter(t => t.status === 'fechado').length,
      por_importancia: {
        urgente: mapped.filter(t => t.importancia === 'urgente').length,
        alta: mapped.filter(t => t.importancia === 'alta').length,
        normal: mapped.filter(t => t.importancia === 'normal').length,
        baixa: mapped.filter(t => t.importancia === 'baixa').length,
      },
      por_categoria: {} as any,
      tempo_medio_resolucao: 0,
    };

    mapped.forEach(t => {
      if (t.categoria) stats.por_categoria[t.categoria] = (stats.por_categoria[t.categoria] || 0) + 1;
    });

    return res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    const history = await HistoryService.list('pedido', pedido.id);
    const workflows = await WorkflowService.list('pedido', pedido.id);
    return res.status(200).json({ pedido: toPedido(pedido), history, workflows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/history', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    const history = await HistoryService.list('pedido', pedido.id);
    const workflows = await WorkflowService.list('pedido', pedido.id);
    return res.status(200).json({ success: true, history, workflows });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const body = req.body;

    const requiredFields = ['titulo', 'descricao', 'importancia', 'direcao', 'funcao'];
    for (const f of requiredFields) {
      if (!body[f]) return res.status(400).json({ error: 'BAD_REQUEST', message: `Campo obrigatorio ausente: ${f}` });
    }

    const validationErrors = await ValidationService.validate('pedido', body, 'pendente');
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Dados invalidos', errors: validationErrors });
    }

    const sequence = await SequenceService.next('pedido');
    const numero = sequence?.value || `TKT/${Date.now()}`;
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const pedido = await prisma.pedido.create({
      data: {
        id,
        numero,
        titulo: body.titulo,
        descricao: body.descricao,
        importancia: body.importancia,
        categoria: body.categoria || '',
        direcao: body.direcao,
        funcao: body.funcao,
        status: 'pendente',
        anexos: JSON.stringify(body.anexos || []),
        createdById: user.id,
        createdByName: user.name,
        data: JSON.stringify(body),
      }
    });

    await auditService.logAction('ticket_criado', 'info', { numero, titulo: pedido.titulo }, {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      resource: 'pedido',
      resourceId: id,
      success: true
    });

    await HistoryService.record({
      module: 'pedido',
      resourceId: pedido.id,
      action: 'created',
      statusTo: pedido.status,
      user,
      metadata: { numero },
      newValue: toPedido(pedido),
    });

    return res.status(201).json({ pedido: toPedido(pedido) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    if (WorkflowService.isImmutable(existing.status)) return res.status(400).json({ error: 'BAD_REQUEST', message: 'Tickets com este status sao imutaveis' });

    const data = { ...(existing.data ? JSON.parse(existing.data) : {}), ...req.body };
    const validationErrors = await ValidationService.validate('pedido', data, existing.status);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Dados invalidos', errors: validationErrors });
    }

    const updated = await prisma.pedido.update({
      where: { id: req.params.id },
      data: {
        titulo: req.body.titulo ?? existing.titulo,
        descricao: req.body.descricao ?? existing.descricao,
        importancia: req.body.importancia ?? existing.importancia,
        categoria: req.body.categoria ?? existing.categoria,
        direcao: req.body.direcao ?? existing.direcao,
        funcao: req.body.funcao ?? existing.funcao,
        anexos: req.body.anexos ? JSON.stringify(req.body.anexos) : existing.anexos,
        data: JSON.stringify(data),
      }
    });

    await HistoryService.record({
      module: 'pedido',
      resourceId: existing.id,
      action: 'updated',
      statusFrom: existing.status,
      statusTo: updated.status,
      user: req.user!,
      metadata: { changes: req.body },
      oldValue: toPedido(existing),
      newValue: toPedido(updated),
    });

    return res.status(200).json({ pedido: toPedido(updated) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/abrir', requireAuth as any, requireIT as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    const transition = BusinessRulesService.validateTransition('pedido', pedido.status, 'aberto');
    if (!transition.allowed) return res.status(400).json({ error: 'BAD_REQUEST', message: transition.message || 'Apenas tickets pendentes podem ser abertos' });

    const updated = await prisma.pedido.update({
      where: { id: req.params.id },
      data: { status: 'aberto', abertoEm: new Date(), atribuidoAId: user.id, atribuidoANome: user.name }
    });

    await HistoryService.record({
      module: 'pedido',
      resourceId: pedido.id,
      action: 'status_changed',
      statusFrom: pedido.status,
      statusTo: updated.status,
      user,
      metadata: { atribuidoAId: user.id },
      oldValue: toPedido(pedido),
      newValue: toPedido(updated),
    });

    return res.status(200).json({ pedido: toPedido(updated) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/resolver', requireAuth as any, requireIT as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { solucao, anexos } = req.body;
    if (!solucao) return res.status(400).json({ error: 'BAD_REQUEST', message: 'A descricao da solucao e obrigatoria' });

    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    const transition = BusinessRulesService.validateTransition('pedido', pedido.status, 'resolvido');
    if (!transition.allowed) return res.status(400).json({ error: 'BAD_REQUEST', message: transition.message || 'Apenas tickets abertos podem ser resolvidos' });

    const solucaoData = {
      descricao: solucao,
      resolvido_por_id: user.id,
      resolvido_por_nome: user.name,
      resolvido_em: new Date().toISOString(),
      anexos: anexos || [],
    };

    const updated = await prisma.pedido.update({
      where: { id: req.params.id },
      data: { status: 'resolvido', resolvidoEm: new Date(), solucao: JSON.stringify(solucaoData) }
    });

    await HistoryService.record({
      module: 'pedido',
      resourceId: pedido.id,
      action: 'status_changed',
      statusFrom: pedido.status,
      statusTo: updated.status,
      user,
      comment: solucao,
      metadata: solucaoData,
      oldValue: toPedido(pedido),
      newValue: toPedido(updated),
    });

    const owner = pedido.createdById ? await prisma.user.findUnique({ where: { id: pedido.createdById } }) : null;
    if (owner?.email) {
      await emailService.sendEmail({
        to: owner.email,
        subject: `Ticket Resolvido: ${pedido.numero}`,
        html: `<p>O seu ticket ${pedido.numero} foi resolvido.</p><p>${solucao}</p>`
      }).catch(err => logger.error('Falha ao disparar e-mail de ticket resolvido:', err));
    }

    return res.status(200).json({ pedido: toPedido(updated) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/fechar', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    const transition = BusinessRulesService.validateTransition('pedido', pedido.status, 'fechado');
    if (!transition.allowed) return res.status(400).json({ error: 'BAD_REQUEST', message: transition.message || 'Apenas tickets resolvidos podem ser fechados' });
    if (pedido.createdById !== user.id) return res.status(403).json({ error: 'FORBIDDEN', message: 'Apenas o solicitante pode fechar este ticket' });

    const data = { ...(pedido.data ? JSON.parse(pedido.data) : {}), comentario_fechamento: req.body.comentario_fechamento || '' };
    const updated = await prisma.pedido.update({
      where: { id: req.params.id },
      data: { status: 'fechado', fechadoEm: new Date(), data: JSON.stringify(data) }
    });

    await HistoryService.record({
      module: 'pedido',
      resourceId: pedido.id,
      action: 'status_changed',
      statusFrom: pedido.status,
      statusTo: updated.status,
      user,
      comment: req.body.comentario_fechamento || '',
      oldValue: toPedido(pedido),
      newValue: toPedido(updated),
    });

    return res.status(200).json({ pedido: toPedido(updated) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancelar', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    if (pedido.createdById !== user.id && user.role !== 'admin' && user.role !== 'tecnologia_informacao') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso negado' });
    }

    const transition = BusinessRulesService.validateTransition('pedido', pedido.status, 'cancelado');
    if (!transition.allowed) return res.status(400).json({ error: 'BAD_REQUEST', message: transition.message || 'Ticket nao pode ser cancelado neste estado' });

    const data = { ...(pedido.data ? JSON.parse(pedido.data) : {}), motivo_cancelamento: req.body.motivo || req.body.motivo_cancelamento || '' };
    const updated = await prisma.pedido.update({
      where: { id: req.params.id },
      data: { status: 'cancelado', data: JSON.stringify(data) }
    });

    await HistoryService.record({
      module: 'pedido',
      resourceId: pedido.id,
      action: 'status_changed',
      statusFrom: pedido.status,
      statusTo: updated.status,
      user,
      comment: req.body.motivo || req.body.motivo_cancelamento || '',
      oldValue: toPedido(pedido),
      newValue: toPedido(updated),
    });

    return res.status(200).json({ pedido: toPedido(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket nao encontrado' });
    if (user.role !== 'admin' && pedido.createdById !== user.id) return res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso negado' });
    if (pedido.status === 'fechado') return res.status(400).json({ error: 'BAD_REQUEST', message: 'Tickets fechados sao imutaveis e nao podem ser eliminados' });

    await prisma.pedido.delete({ where: { id: req.params.id } });
    await HistoryService.record({
      module: 'pedido',
      resourceId: pedido.id,
      action: 'deleted',
      statusFrom: pedido.status,
      user,
      oldValue: toPedido(pedido),
    });

    return res.status(200).json({ success: true, message: 'Ticket eliminado com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
