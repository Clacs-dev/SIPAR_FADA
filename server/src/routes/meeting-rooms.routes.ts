import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';

const router = Router();
router.use(requireLicenseModule('internal_meetings'));

function safeJsonParse(value: any, fallback: any) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function roomToResource(room: any) {
  return {
    id: room.id,
    nome: room.nome,
    capacidade: room.capacidade,
    localizacao: room.localizacao,
    recursos: safeJsonParse(room.recursos, []),
    ativa: room.ativa,
    created_at: room.createdAt?.toISOString?.() || room.createdAt,
    updated_at: room.updatedAt?.toISOString?.() || room.updatedAt,
  };
}

function toMinutes(time: string): number {
  const [h, m] = String(time).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Verifica se ha conflito de horario entre dois intervalos no mesmo dia.
 */
function hasOverlap(startA: string, endA: string, startB: string, endB: string) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

// LISTAR SALAS (todos os utilizadores autenticados)
router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.all === 'true';
    const rooms = await prisma.meetingRoom.findMany({
      where: includeInactive ? {} : { ativa: true },
      orderBy: { nome: 'asc' },
    });
    return res.status(200).json({ success: true, salas: rooms.map(roomToResource) });
  } catch (error) {
    next(error);
  }
});

// VERIFICAR DISPONIBILIDADE DE UMA SALA NUM HORARIO
router.get('/disponibilidade', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { roomId, data, horaInicio, horaFim, excludeMeetingId } = req.query as Record<string, string>;

    if (!roomId || !data || !horaInicio || !horaFim) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'roomId, data, horaInicio e horaFim sao obrigatorios' });
    }

    const meetings = await prisma.internalMeeting.findMany({
      where: {
        roomId,
        meetingDate: data,
        status: { notIn: ['cancelado', 'rejeitado'] },
        ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
      },
      select: { id: true, title: true, startTime: true, endTime: true },
    });

    const conflitos = meetings.filter((m) => hasOverlap(horaInicio, horaFim, m.startTime, m.endTime));

    return res.status(200).json({
      success: true,
      disponivel: conflitos.length === 0,
      conflitos: conflitos.map((c) => ({ id: c.id, titulo: c.title, hora_inicio: c.startTime, hora_fim: c.endTime })),
    });
  } catch (error) {
    next(error);
  }
});

// CRIAR SALA (admin)
router.post('/', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { nome, capacidade, localizacao, recursos, ativa } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'O nome da sala e obrigatorio' });
    }

    const room = await prisma.meetingRoom.create({
      data: {
        nome,
        capacidade: Number(capacidade) || 0,
        localizacao: localizacao || null,
        recursos: JSON.stringify(Array.isArray(recursos) ? recursos : []),
        ativa: ativa !== undefined ? Boolean(ativa) : true,
      },
    });

    await auditService.logAction('meeting_room_created', 'info', { roomId: room.id, nome: room.nome }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      resource: 'meeting_room',
      resourceId: room.id,
      success: true,
    });

    return res.status(201).json({ success: true, sala: roomToResource(room) });
  } catch (error) {
    next(error);
  }
});

// ACTUALIZAR SALA (admin)
router.put('/:id', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.meetingRoom.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Sala nao encontrada' });
    }

    const { nome, capacidade, localizacao, recursos, ativa } = req.body;

    const room = await prisma.meetingRoom.update({
      where: { id: req.params.id },
      data: {
        nome: nome !== undefined ? nome : existing.nome,
        capacidade: capacidade !== undefined ? Number(capacidade) || 0 : existing.capacidade,
        localizacao: localizacao !== undefined ? localizacao : existing.localizacao,
        recursos: recursos !== undefined ? JSON.stringify(Array.isArray(recursos) ? recursos : []) : existing.recursos,
        ativa: ativa !== undefined ? Boolean(ativa) : existing.ativa,
      },
    });

    await auditService.logAction('meeting_room_updated', 'info', { roomId: room.id, changes: req.body }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      resource: 'meeting_room',
      resourceId: room.id,
      success: true,
    });

    return res.status(200).json({ success: true, sala: roomToResource(room) });
  } catch (error) {
    next(error);
  }
});

// ELIMINAR SALA (admin)
router.delete('/:id', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.meetingRoom.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Sala nao encontrada' });
    }

    const futureMeetings = await prisma.internalMeeting.count({
      where: { roomId: req.params.id, status: { notIn: ['cancelado', 'rejeitado'] } },
    });

    if (futureMeetings > 0) {
      // Nao eliminar salas com reunioes associadas: apenas desactivar
      const room = await prisma.meetingRoom.update({ where: { id: req.params.id }, data: { ativa: false } });
      return res.status(200).json({
        success: true,
        sala: roomToResource(room),
        message: 'Sala tem reunioes associadas e foi apenas desactivada, nao eliminada.',
      });
    }

    await prisma.meetingRoom.delete({ where: { id: req.params.id } });

    await auditService.logAction('meeting_room_deleted', 'warning', { roomId: req.params.id, nome: existing.nome }, {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      resource: 'meeting_room',
      resourceId: req.params.id,
      success: true,
    });

    return res.status(200).json({ success: true, message: 'Sala eliminada com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
