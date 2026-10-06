import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import { estadoExtraccao } from '../services/extraccao-regras.service';

const router = Router();

/**
 * O que o utilizador pode usar no registo automatico de facturas: extraccao
 * sem IA, com IA, e quantas extraccoes com IA ainda lhe restam (limite do role).
 * O cliente usa isto para mostrar/esconder as opcoes da Nova Factura.
 */
router.get('/estado', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({ success: true, ...(await estadoExtraccao({ id: req.user!.id, role: req.user!.role })) });
  } catch (error) {
    next(error);
  }
});

export default router;
