import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';
import { notifications } from '../services/notification.service';
import { MeetingLinkService } from '../services/meeting-link.service';
import { emailService } from '../services/email.service';
import logger from '../config/logger';

const router = Router();
router.use(requireLicenseModule('internal_meetings'));

function convitedadoExternoEmailHtml(nomeParticipante: string, organizadorNome: string, meeting: any) {
  const quando = meeting.meetingDate
    ? `${meeting.meetingDate}${meeting.startTime ? ` às ${meeting.startTime}` : ''}`
    : 'data a confirmar';
  const onde = meeting.meetingType === 'online'
    ? (meeting.meetingLink ? `Online: ${meeting.meetingLink}` : 'Reunião online (link a enviar)')
    : (meeting.location || 'Local a confirmar');
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Convite para reunião - FADA</h2>
      <p>Olá <strong>${nomeParticipante || 'Convidado'}</strong>,</p>
      <p>
        <strong>${organizadorNome}</strong> convidou-o(a) para a reunião "<strong>${meeting.title}</strong>",
        no Fundo de Apoio ao Desenvolvimento Agrário (FADA).
      </p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Quando:</strong> ${quando}</p>
        <p style="margin: 4px 0;"><strong>Onde:</strong> ${onde}</p>
      </div>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">
        Este convite foi enviado porque foi indicado como participante externo desta reunião.
      </p>
    </div>
  `;
}

function safeJsonParse(value: any, fallback: any) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toMinutes(time: string): number {
  const [h, m] = String(time).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function hasOverlap(startA: string, endA: string, startB: string, endB: string) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

/**
 * Verifica se a sala escolhida ja esta ocupada nesse dia/horario por outra reuniao.
 */
async function findRoomConflict(roomId: string, meetingDate: string, startTime: string, endTime: string, excludeMeetingId?: string) {
  const meetings = await prisma.internalMeeting.findMany({
    where: {
      roomId,
      meetingDate,
      status: { notIn: ['cancelado', 'rejeitado'] },
      ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
    },
    select: { id: true, title: true, startTime: true, endTime: true },
  });

  return meetings.find((m) => hasOverlap(startTime, endTime, m.startTime, m.endTime)) || null;
}

/**
 * Helper para criar acta automaticamente a partir de uma reunião interna
 */
async function createActaForMeeting(meeting: any, userId: string, userName: string, participantes: any[]) {
  try {
    logger.info(`[InternalMeetings] Criando acta automaticamente para reuniao: ${meeting.id}`);
    
    const organizerProfile = await prisma.user.findUnique({ where: { id: meeting.organizerId } });
    
    if (!organizerProfile) {
      logger.error('Organizador nao encontrado');
      return null;
    }
    
    const actaId = `acta_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const numero = `ACTA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const participantesActa = [
      {
        nome: organizerProfile.name,
        cargo: organizerProfile.position || '',
        departamento: organizerProfile.department || '',
        presente: false,
      }
    ];
    
    for (const p of participantes) {
      participantesActa.push({
        nome: p.nome || p.name,
        cargo: p.cargo || '',
        departamento: p.department || p.departamento || '',
        presente: false,
      });
    }
    
    const pontosAgenda = safeJsonParse(meeting.pontosAgenda, []);
    
    const acta = {
      id: actaId,
      numero,
      assunto: meeting.title,
      data_reuniao: meeting.meetingDate,
      hora_inicio: meeting.startTime || null,
      hora_fim: meeting.endTime || null,
      local: meeting.location || null,
      tipo_reuniao: meeting.tipoReuniao || 'ordinaria',
      status: 'rascunho',
      modalidade: meeting.meetingType === 'online' ? 'online' : 'presencial',
      plataforma: meeting.platform || null,
      link_reuniao: meeting.meetingLink || null,
      prioridade: meeting.priority || 'normal',
      orgao: meeting.orgao || null,
      pontos_agenda: pontosAgenda,
      reuniao_interna_id: meeting.id,
      pauta: meeting.description || null,
      conteudo: null,
      decisoes: null,
      participantes: participantesActa,
      departamento: organizerProfile.department || null,
      anexos: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_id: userId,
      created_by_name: userName,
    };
    
    await prisma.acta.create({
      data: {
        id: actaId,
        numero: acta.numero,
        assunto: acta.assunto,
        dataReuniao: acta.data_reuniao,
        horaInicio: acta.hora_inicio,
        horaFim: acta.hora_fim,
        local: acta.local,
        tipoReuniao: acta.tipo_reuniao,
        modalidade: acta.modalidade,
        departamento: acta.departamento,
        status: acta.status,
        internalMeetingId: meeting.id,
        createdById: userId,
        createdByName: userName,
        participantes: JSON.stringify(participantesActa),
        pontosAgenda: JSON.stringify(pontosAgenda),
        anexos: '[]',
        data: JSON.stringify(acta),
      }
    });
    
    logger.info(`[InternalMeetings] Acta criada com sucesso: ${numero}`);
    
    // Auditoria
    await auditService.logAction(
      'acta_criada_automatica',
      'info',
      {
        actaId,
        numero: acta.numero,
        reuniaoId: meeting.id,
        status: acta.status,
        assunto: acta.assunto,
        totalParticipantes: participantesActa.length
      },
      {
        userId,
        userEmail: organizerProfile.email,
        userRole: organizerProfile.role,
        resource: 'acta',
        resourceId: actaId
      }
    );
    
    // Notificar organizador
    await notifications.createNotification(
      organizerProfile.email,
      'acta_created_automatic',
      `Uma acta foi criada automaticamente para a reunião "${meeting.title}". Número da acta: ${numero}`,
      actaId
    );
    
    // Notificar demais participantes
    for (const p of participantes) {
      if (p.user_id || p.id) {
        const participantId = p.user_id || p.id;
        const pProfile = await prisma.user.findUnique({ where: { id: participantId } });
        if (pProfile && pProfile.email) {
          await notifications.createNotification(
            pProfile.email,
            'acta_created_automatic',
            `Uma acta foi criada para a reunião "${meeting.title}" com ${organizerProfile.name}. Número da acta: ${numero}`,
            actaId
          );
        }
      }
    }
    
    return acta;
  } catch (error) {
    logger.error('Erro ao criar acta automaticamente:', error);
    return null;
  }
}

// LISTAR REUNIÕES INTERNAS
router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    // Buscar reuniões no banco usando o Prisma
    const meetings = await prisma.internalMeeting.findMany({
      where: {
        OR: [
          { organizerId: user.id },
          { participantId: user.id },
          { participantes: { some: { userId: user.id } } },
        ]
      },
      include: {
        organizer: true,
        participant: true
      },
      orderBy: [
        { meetingDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Enriquecer reuniões com dados dos organizadores, participantes e lista de participantes adicionais do KV
    const enrichedMeetings = await Promise.all(
      meetings.map(async (m) => {
        const participantes = await prisma.internalMeetingParticipant.findMany({ where: { meetingId: m.id } });
        
        // Mapear para snake_case esperado no frontend
        return {
          id: m.id,
          organizer_id: m.organizerId,
          participant_id: m.participantId,
          title: m.title,
          description: m.description,
          meeting_date: m.meetingDate,
          start_time: m.startTime,
          end_time: m.endTime,
          meeting_type: m.meetingType,
          location: m.location,
          room_id: m.roomId,
          platform: m.platform,
          meeting_link: m.meetingLink,
          priority: m.priority,
          status: m.status,
          tipo_reuniao: m.tipoReuniao,
          orgao: m.orgao,
          pontos_agenda: safeJsonParse(m.pontosAgenda, []),
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
          organizer: m.organizer ? {
            id: m.organizer.id,
            name: m.organizer.name,
            email: m.organizer.email,
            role: m.organizer.role
          } : null,
          participant: m.participant ? {
            id: m.participant.id,
            name: m.participant.name,
            email: m.participant.email,
            role: m.participant.role
          } : null,
          participantes: participantes.map((p) => ({
            id: p.id,
            user_id: p.userId,
            nome: p.name,
            name: p.name,
            email: p.email,
            cargo: p.cargo,
            department: p.department,
            presente: p.presente,
          }))
        };
      })
    );

    return res.status(200).json({ meetings: enrichedMeetings });
  } catch (error) {
    next(error);
  }
});

// CRIAR REUNIÃO INTERNA
router.post('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const body = req.body;
    
    const participantes = Array.isArray(body.participantes) ? body.participantes : [];
    const pontosAgenda = body.pontos_agenda || body.agendaPoints || [];
    const meetingType = body.meeting_type || body.meetingType;
    const platform = body.platform || null;
    const roomId = body.room_id || body.roomId || null;
    const meetingDate = body.meeting_date || body.meetingDate;
    const startTime = body.start_time || body.startTime;
    const endTime = body.end_time || body.endTime;

    if (roomId) {
      const conflict = await findRoomConflict(roomId, meetingDate, startTime, endTime);
      if (conflict) {
        return res.status(409).json({
          error: 'ROOM_CONFLICT',
          message: `A sala ja esta reservada nesse horario pela reuniao "${conflict.title}" (${conflict.startTime}-${conflict.endTime})`,
        });
      }
    }
    const meetingLink = body.meeting_link || body.meetingLink || (
      meetingType === 'online'
        ? await MeetingLinkService.create({
            title: body.title,
            description: body.description,
            date: meetingDate,
            time: startTime,
            endTime,
            platform,
            organizerEmail: user.email,
            attendees: participantes.map((p: any) => p.email).filter(Boolean),
          })
        : null
    );

    if (meetingType === 'online' && !meetingLink) {
      return res.status(422).json({
        error: 'MEETING_PLATFORM_NOT_CONFIGURED',
        message: 'Nenhuma plataforma de reunião está configurada (nem API real, nem link fixo). Peça ao administrador do sistema para configurar em Configurações → Integrações antes de agendar reuniões online.',
      });
    }

    // Preparar dados para o banco
    const meeting = await prisma.internalMeeting.create({
      data: {
        organizerId: user.id,
        participantId: body.participant_id || body.participantId || null,
        title: body.title,
        description: body.description || null,
        meetingDate,
        startTime,
        endTime,
        meetingType,
        location: body.location || null,
        roomId,
        platform,
        meetingLink,
        priority: body.priority || 'normal',
        status: 'pendente',
        tipoReuniao: body.tipo_reuniao || body.tipoReuniao || 'ordinaria',
        orgao: body.orgao || null,
        pontosAgenda: JSON.stringify(pontosAgenda)
      }
    });

    logger.info(`Reuniao interna criada com sucesso: ${meeting.id}`);

    const participantUserIds = participantes
      .map((p: any) => p.user_id || p.usuario_id || p.userId || p.id)
      .filter(Boolean)
      .map(String);
    const existingParticipantUsers = participantUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: participantUserIds } },
          select: { id: true },
        })
      : [];
    const validParticipantUserIds = new Set(existingParticipantUsers.map((participant) => participant.id));

    if (participantes.length > 0) {
      await prisma.internalMeetingParticipant.createMany({
        data: participantes.map((p: any) => ({
          meetingId: meeting.id,
          userId: validParticipantUserIds.has(String(p.user_id || p.usuario_id || p.userId || p.id))
            ? String(p.user_id || p.usuario_id || p.userId || p.id)
            : null,
          name: p.nome || p.name || 'Participante',
          email: p.email || null,
          role: p.role || null,
          cargo: p.cargo || null,
          department: p.department || p.departamento || null,
          data: JSON.stringify(p),
        }))
      });
    }

    // Notificar participantes: utilizadores reais recebem notificacao interna,
    // participantes externos (sem conta na plataforma) recebem um convite por
    // e-mail, ja que nunca vao fazer login para ver notificacoes internas.
    for (const p of participantes) {
      const pId = String(p.user_id || p.usuario_id || p.userId || p.id || '');
      if (validParticipantUserIds.has(pId)) {
        const pProfile = await prisma.user.findUnique({ where: { id: pId } });
        if (pProfile && pProfile.email) {
          await notifications.createNotification(
            pProfile.email,
            'meeting_scheduled',
            `${user.name} agendou uma reunião: "${meeting.title}" para ${meeting.meetingDate}`,
            meeting.id
          );
        }
      } else if (p.email) {
        await emailService.sendEmail({
          to: p.email,
          subject: `Convite para reunião: ${meeting.title}`,
          html: convitedadoExternoEmailHtml(p.nome || p.name, user.name, meeting),
        }).catch((error) => logger.error(`Falha ao enviar convite de reuniao a ${p.email}:`, error));
      }
    }

    // Criar acta automaticamente
    const acta = await createActaForMeeting(meeting, user.id, user.name, participantes);

    // Auditoria
    await auditService.logAction(
      'internal_meeting_created',
      'info',
      {
        title: meeting.title,
        totalParticipantes: participantes.length,
        meetingDate: meeting.meetingDate,
        actaCreated: !!acta
      },
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        resource: 'internal_meeting',
        resourceId: meeting.id,
        success: true
      }
    );

    // Mapear de volta para o formato snake_case esperado pelo front
    const responseMeeting = {
      id: meeting.id,
      organizer_id: meeting.organizerId,
      participant_id: meeting.participantId,
      title: meeting.title,
      description: meeting.description,
      meeting_date: meeting.meetingDate,
      start_time: meeting.startTime,
      end_time: meeting.endTime,
      meeting_type: meeting.meetingType,
      location: meeting.location,
      room_id: meeting.roomId,
      platform: meeting.platform,
      meeting_link: meeting.meetingLink,
      priority: meeting.priority,
      status: meeting.status,
      tipo_reuniao: meeting.tipoReuniao,
      orgao: meeting.orgao,
      pontos_agenda: pontosAgenda,
      created_at: meeting.createdAt.toISOString(),
      updated_at: meeting.updatedAt.toISOString(),
    };

    return res.status(201).json({
      meeting: responseMeeting,
      acta,
      participantes,
      message: acta ? 'Reunião e acta criadas com sucesso!' : 'Reunião criada com sucesso!'
    });

  } catch (error) {
    next(error);
  }
});

// ATUALIZAR STATUS DA REUNIÃO
router.put('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const meetingId = req.params.id;
    const body = req.body;

    const existingMeeting = await prisma.internalMeeting.findUnique({
      where: { id: meetingId }
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Reunião não encontrada' });
    }

    // Apenas organizador ou participante pode alterar status
    if (existingMeeting.organizerId !== user.id && existingMeeting.participantId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso negado' });
    }

    // Se estiver em formato camelCase ou snake_case
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.meeting_date !== undefined) updateData.meetingDate = body.meeting_date;
    if (body.meetingDate !== undefined) updateData.meetingDate = body.meetingDate;
    if (body.start_time !== undefined) updateData.startTime = body.start_time;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.end_time !== undefined) updateData.endTime = body.end_time;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.pontos_agenda !== undefined) updateData.pontosAgenda = JSON.stringify(body.pontos_agenda);
    if (body.room_id !== undefined) updateData.roomId = body.room_id || null;
    if (body.roomId !== undefined) updateData.roomId = body.roomId || null;

    const nextRoomId = updateData.roomId !== undefined ? updateData.roomId : existingMeeting.roomId;
    if (nextRoomId) {
      const nextDate = updateData.meetingDate || existingMeeting.meetingDate;
      const nextStart = updateData.startTime || existingMeeting.startTime;
      const nextEnd = updateData.endTime || existingMeeting.endTime;
      const conflict = await findRoomConflict(nextRoomId, nextDate, nextStart, nextEnd, meetingId);
      if (conflict) {
        return res.status(409).json({
          error: 'ROOM_CONFLICT',
          message: `A sala ja esta reservada nesse horario pela reuniao "${conflict.title}" (${conflict.startTime}-${conflict.endTime})`,
        });
      }
    }

    const updated = await prisma.internalMeeting.update({
      where: { id: meetingId },
      data: updateData
    });

    // Mapear de volta para o formato snake_case esperado pelo front
    const responseMeeting = {
      id: updated.id,
      organizer_id: updated.organizerId,
      participant_id: updated.participantId,
      title: updated.title,
      description: updated.description,
      meeting_date: updated.meetingDate,
      start_time: updated.startTime,
      end_time: updated.endTime,
      meeting_type: updated.meetingType,
      location: updated.location,
      room_id: updated.roomId,
      platform: updated.platform,
      meeting_link: updated.meetingLink,
      priority: updated.priority,
      status: updated.status,
      tipo_reuniao: updated.tipoReuniao,
      orgao: updated.orgao,
      pontos_agenda: safeJsonParse(updated.pontosAgenda, []),
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    };

    // Auditoria
    await auditService.logAction(
      'internal_meeting_updated',
      'info',
      { changes: updateData },
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        resource: 'internal_meeting',
        resourceId: meetingId,
        success: true
      }
    );

    return res.status(200).json({ meeting: responseMeeting });
  } catch (error) {
    next(error);
  }
});

// CANCELAR / ELIMINAR REUNIÃO
router.delete('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const meetingId = req.params.id;

    const existingMeeting = await prisma.internalMeeting.findUnique({
      where: { id: meetingId }
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Reunião não encontrada' });
    }

    if (existingMeeting.organizerId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Apenas o organizador pode cancelar esta reunião' });
    }

    await prisma.internalMeeting.delete({
      where: { id: meetingId }
    });

    // Auditoria
    await auditService.logAction(
      'internal_meeting_cancelled',
      'warning',
      { title: existingMeeting.title, date: existingMeeting.meetingDate },
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        resource: 'internal_meeting',
        resourceId: meetingId,
        success: true
      }
    );

    return res.status(200).json({ success: true, message: 'Reunião interna cancelada com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
