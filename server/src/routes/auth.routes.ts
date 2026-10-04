import { Router } from 'express';
import { getUserPermissions } from '../utils/permissions';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requireSystemAdmin } from '../middlewares/auth';
import { multerUpload } from '../controllers/storage.controller';

const router = Router();

// Limite restrito para rotas sensiveis de autenticacao (protecao contra forca bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP a cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Muitas tentativas de autenticacao a partir deste IP, tente novamente em 15 minutos.'
  }
});

// Rotas públicas
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/reset-password/confirm', authLimiter, AuthController.confirmResetPassword);
router.post('/refresh', AuthController.refresh);
router.post('/reset-demo-users', requireAuth as any, requireSystemAdmin as any, (_req, res) => {
  res.status(200).json({ success: true, message: 'Utilizadores demo mantidos pelo seed local.' });
});

// Rotas protegidas
router.get('/me', requireAuth as any, AuthController.me as any);
// Permissoes RBAC efectivas do utilizador autenticado: [{ module, actions }].
// Usado pelo cliente so para mostrar/esconder menus e botoes - o servidor
// continua a validar cada accao.
router.get('/me/permissions', requireAuth as any, async (req: any, res: any, next: any) => {
  try {
    const p = await getUserPermissions(req.user.role, req.user.department, undefined);
    return res.status(200).json({ role: req.user.role, permissions: p.permissions });
  } catch (error) {
    next(error);
  }
});
// Auto-edicao de perfil (nome, telefone, morada, organizacao, e-mail, password).
// Aceita PUT (convencao REST usada no resto da API) e POST (mesma acao).
router.put('/me', requireAuth as any, authLimiter, AuthController.updateProfile as any);
router.post('/me', requireAuth as any, authLimiter, AuthController.updateProfile as any);
router.put('/me/bank-details', requireAuth as any, AuthController.updateBankDetails as any);
// Varias coordenadas bancarias guardadas (fornecedor externo escolhe qual usar por factura).
router.get('/me/bank-accounts', requireAuth as any, AuthController.listBankAccounts as any);
router.post('/me/bank-accounts', requireAuth as any, AuthController.addBankAccount as any);
router.put('/me/bank-accounts/:id/select', requireAuth as any, AuthController.selectBankAccount as any);
router.delete('/me/bank-accounts/:id', requireAuth as any, AuthController.removeBankAccount as any);
// Upload + gravacao da assinatura num unico pedido multipart, em vez de um
// upload seguido de um PUT JSON separado: essa sequencia de dois fetch()
// era interrompida a meio por interferencia do browser (extensoes que
// interceptam fetch/FormData), deixando o ficheiro guardado no servidor mas
// nunca ligado ao utilizador.
router.post('/me/signature', requireAuth as any, multerUpload.single('file'), AuthController.uploadSignature as any);
router.post('/logout', requireAuth as any, AuthController.logout as any);

export default router;
