import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import prisma from '../config/database';

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/stats', requireAuth as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      presentations,
      audiences,
      pedidos,
      internalMeetings,
      comunicacoes,
      actas,
      facturas,
      notifications,
      users,
    ] = await Promise.all([
      prisma.presentation.count(),
      prisma.audience.count(),
      prisma.pedido.count(),
      prisma.internalMeeting.findMany({ select: { status: true, meetingDate: true, meetingType: true } }),
      prisma.comunicacao.findMany({ where: { deletedAt: null }, select: { status: true, prioridade: true } }),
      prisma.acta.findMany({ select: { tipoReuniao: true, createdAt: true } }),
      prisma.factura.findMany({ select: { status: true } }),
      prisma.notification.count(),
      prisma.user.count(),
    ]);

    const hoje = todayStr();
    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Comunicacoes: fluxo pendente -> em_analise -> despachado (ou arquivado).
    // Ver Comunicacao em client/src/components/comunicacoes/types.ts.
    const comunicacoesStats = {
      total: comunicacoes.length,
      pendentes: comunicacoes.filter((c) => c.status === 'pendente' || c.status === 'em_analise').length,
      enviadas: comunicacoes.filter((c) => c.status !== 'arquivado').length,
      comDespacho: comunicacoes.filter((c) => c.status === 'despachado').length,
      urgentes: comunicacoes.filter((c) => c.prioridade === 'urgente').length,
    };

    const actasStats = {
      total: actas.length,
      ordinarias: actas.filter((a) => a.tipoReuniao === 'ordinaria').length,
      extraordinarias: actas.filter((a) => a.tipoReuniao === 'extraordinaria').length,
      recentes: actas.filter((a) => a.createdAt >= trintaDiasAtras).length,
    };

    // Reunioes internas: sem estado de "em curso"/"concluida" explicito no
    // schema, por isso deriva-se da data (ver InternalMeeting em schema.prisma).
    const reunioesAtivas = internalMeetings.filter((m) => m.status !== 'cancelado' && m.status !== 'rejeitado');
    const reunioesStats = {
      total: internalMeetings.length,
      proximas: reunioesAtivas.filter((m) => m.meetingDate > hoje).length,
      emAndamento: reunioesAtivas.filter((m) => m.meetingDate === hoje).length,
      concluidas: reunioesAtivas.filter((m) => m.meetingDate < hoje).length,
      online: internalMeetings.filter((m) => m.meetingType === 'online').length,
    };

    // Facturas: ver fluxo completo de status em business-rules.service.ts (RULES.factura).
    const facturasStats = {
      total: facturas.length,
      pendentes: facturas.filter((f) => f.status === 'pendente' || f.status === 'rascunho').length,
      emValidacao: facturas.filter((f) => f.status === 'validado').length,
      aprovadas: facturas.filter((f) => f.status === 'aprovado' || f.status === 'submetido_ao_banco').length,
      pagas: facturas.filter((f) => f.status === 'pago').length,
      rejeitadas: facturas.filter((f) => f.status === 'rejeitado' || f.status === 'cancelado').length,
    };

    res.status(200).json({
      success: true,
      stats: {
        presentations,
        audiences,
        pedidos,
        meetings: internalMeetings.length,
        notifications,
        users,
        total_requests: presentations + audiences + pedidos,
        comunicacoes: comunicacoesStats,
        actas: actasStats,
        reunioes: reunioesStats,
        facturas: facturasStats,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
