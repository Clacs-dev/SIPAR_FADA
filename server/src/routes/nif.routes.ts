import { Router, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import { consultarNif } from '../services/nif-lookup.service';
import logger from '../config/logger';

const router = Router();

// A consulta faz scraping de um portal externo (AGT) - limite apertado para
// nao martelar o portal nem usar isto para outra coisa que nao seja
// preencher um formulario (poucas consultas por minuto chegam sobejamente
// para uso normal: cadastrar um fornecedor, registar uma factura).
const nifLookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Demasiadas consultas de NIF num curto período. Tente novamente dentro de instantes.' },
});

/**
 * Consulta de NIF na AGT (Portal do Contribuinte) - auxiliar de
 * preenchimento, nunca bloqueante: mesmo quando falha ou nao encontra nada,
 * devolve 200 com `encontrado: false` e uma mensagem, para o cliente deixar
 * o utilizador continuar manualmente (ver server/src/services/nif-lookup.service.ts).
 */
router.get('/:numero', requireAuth as any, nifLookupLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const resultado = await consultarNif(req.params.numero);
    return res.status(200).json(resultado);
  } catch (error) {
    logger.warn('Erro inesperado na consulta de NIF:', error);
    return res.status(200).json({ encontrado: false, mensagem: 'Não foi possível consultar a AGT neste momento. Pode continuar manualmente.' });
  }
});

export default router;
