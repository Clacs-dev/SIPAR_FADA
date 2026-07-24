import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import prisma from '../config/database';

const router = Router();

router.get('/stats', requireAuth as any, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      presentations,
      audiences,
      pedidos,
      meetings,
      actas,
      facturas,
      notifications,
      users,
    ] = await Promise.all([
      prisma.presentation.count(),
      prisma.audience.count(),
      prisma.pedido.count(),
      prisma.internalMeeting.count(),
      prisma.acta.count(),
      prisma.factura.count(),
      prisma.notification.count(),
      prisma.user.count(),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        presentations,
        audiences,
        pedidos,
        meetings,
        actas,
        facturas,
        notifications,
        users,
        total_requests: presentations + audiences + pedidos,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
