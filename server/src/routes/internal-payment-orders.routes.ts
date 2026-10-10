import { Router, Response, NextFunction } from 'express';
import { requireLicenseModule } from '../middlewares/license';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import prisma from '../config/database';
import { auditService } from '../services/audit.service';
import { SequenceService } from '../services/sequence.service';

const router = Router();
router.use(requireLicenseModule('finance'));

// Mesmos papeis que ja podem gerir a Ordem de Pagamento a Fornecedor (ver
// canApprove/canPay em facturas-main.tsx) - Compras nao gere ordens de
// pagamento, so as valida/cria facturas.
const PODE_GERIR = ['gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao', 'financeiro', 'admin_sistema'];
const PODE_PAGAR = ['financeiro', 'admin_sistema'];

// Mesmo mapa usado para a assinatura da Ordem de Pagamento a Fornecedor (ver
// SIGNATURE_ROLE_MAP em modules.routes.ts) - mantido aqui em duplicado porque
// aquele nao e exportado, para nao arriscar alterar um ficheiro tao grande.
const SIGNATURE_ROLE_MAP: Record<string, string> = {
  presidente: 'gabinete_pca',
  administrador: 'gabinete_administrador',
};

function safeJsonParse(value: any, fallback: any) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function numberValue(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toResource(record: any) {
  const data = safeJsonParse(record?.data, {});
  return {
    id: record.id,
    numero: record.numero,
    status: record.status,
    descricao: record.descricao,
    valor: record.valor,
    moeda: record.moeda,
    destinatario: record.destinatario,
    numero_despacho: record.numeroDespacho,
    conta_debito: record.contaDebito,
    banco_nome: record.bancoNome,
    banco_iban: record.bancoIban,
    banco_numero_conta: record.bancoNumeroConta,
    banco_cidade: record.bancoCidade,
    banco_pais: record.bancoPais,
    paid_at: record.paidAt?.toISOString?.() || record.paidAt,
    assinaturas: Array.isArray(data.assinaturas) ? data.assinaturas : [],
    anexos: Array.isArray(data.anexos) ? data.anexos : [],
    created_by_id: record.createdById,
    created_by_name: record.createdByName,
    created_at: record.createdAt?.toISOString?.() || record.createdAt,
    updated_at: record.updatedAt?.toISOString?.() || record.updatedAt,
  };
}

router.get('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!PODE_GERIR.includes(req.user!.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para ver Ordens de Pagamento Interna' });
    }
    const ordens = await prisma.internalPaymentOrder.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ ordens: ordens.map(toResource) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!PODE_GERIR.includes(req.user!.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para ver Ordens de Pagamento Interna' });
    }
    const ordem = await prisma.internalPaymentOrder.findUnique({ where: { id: req.params.id } });
    if (!ordem) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de Pagamento Interna nao encontrada' });
    return res.status(200).json({ ordem: toResource(ordem) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!PODE_GERIR.includes(user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para criar Ordens de Pagamento Interna' });
    }

    const { descricao, valor, moeda, destinatario, numero_despacho, conta_debito, banco_nome, banco_iban, banco_numero_conta, banco_cidade, banco_pais, anexos } = req.body;
    if (!descricao || !String(descricao).trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Descricao e obrigatoria' });
    }
    if (!destinatario || !String(destinatario).trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Destinatario ("a favor de") e obrigatorio' });
    }
    const valorNumerico = numberValue(valor, 0);
    if (valorNumerico <= 0) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Valor tem de ser maior que zero' });
    }

    const sequencia = await SequenceService.next('internalPaymentOrder');
    const numero = sequencia?.value || `OPI-${Date.now()}`;

    const ordem = await prisma.internalPaymentOrder.create({
      data: {
        numero,
        status: 'rascunho',
        descricao: String(descricao).trim(),
        valor: valorNumerico,
        moeda: moeda || 'AOA',
        destinatario: String(destinatario).trim(),
        numeroDespacho: numero_despacho || null,
        contaDebito: conta_debito || null,
        bancoNome: banco_nome || null,
        bancoIban: banco_iban || null,
        bancoNumeroConta: banco_numero_conta || null,
        bancoCidade: banco_cidade || null,
        bancoPais: banco_pais || null,
        data: JSON.stringify({ assinaturas: [], anexos: Array.isArray(anexos) ? anexos : [] }),
        createdById: user.id,
        createdByName: user.name,
      }
    });

    await auditService.logAction('internal_payment_order_created', 'info', { ordemId: ordem.id, numero: ordem.numero }, {
      userId: user.id, userEmail: user.email, userRole: user.role, resource: 'internal_payment_order', resourceId: ordem.id, success: true,
    });

    return res.status(201).json({ ordem: toResource(ordem) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!PODE_GERIR.includes(user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para editar Ordens de Pagamento Interna' });
    }

    const existing = await prisma.internalPaymentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de Pagamento Interna nao encontrada' });
    if (existing.status !== 'rascunho') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'So e possivel editar enquanto nenhuma assinatura tiver sido registada' });
    }

    const { descricao, valor, moeda, destinatario, numero_despacho, conta_debito, banco_nome, banco_iban, banco_numero_conta, banco_cidade, banco_pais } = req.body;

    const ordem = await prisma.internalPaymentOrder.update({
      where: { id: existing.id },
      data: {
        descricao: descricao !== undefined ? String(descricao).trim() : existing.descricao,
        valor: valor !== undefined ? numberValue(valor, existing.valor) : existing.valor,
        moeda: moeda !== undefined ? moeda : existing.moeda,
        destinatario: destinatario !== undefined ? String(destinatario).trim() : existing.destinatario,
        numeroDespacho: numero_despacho !== undefined ? numero_despacho : existing.numeroDespacho,
        contaDebito: conta_debito !== undefined ? conta_debito : existing.contaDebito,
        bancoNome: banco_nome !== undefined ? banco_nome : existing.bancoNome,
        bancoIban: banco_iban !== undefined ? banco_iban : existing.bancoIban,
        bancoNumeroConta: banco_numero_conta !== undefined ? banco_numero_conta : existing.bancoNumeroConta,
        bancoCidade: banco_cidade !== undefined ? banco_cidade : existing.bancoCidade,
        bancoPais: banco_pais !== undefined ? banco_pais : existing.bancoPais,
      }
    });

    return res.status(200).json({ ordem: toResource(ordem) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!PODE_GERIR.includes(user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para eliminar Ordens de Pagamento Interna' });
    }
    const existing = await prisma.internalPaymentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de Pagamento Interna nao encontrada' });
    if (existing.status !== 'rascunho') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'So e possivel eliminar enquanto nenhuma assinatura tiver sido registada' });
    }
    await prisma.internalPaymentOrder.delete({ where: { id: existing.id } });
    return res.status(200).json({ success: true, message: 'Ordem de Pagamento Interna eliminada' });
  } catch (error) {
    next(error);
  }
});

// Anexa os dossies/documentos que justificam a despesa (ficheiros ja
// carregados via POST /storage/upload). Permitido em qualquer estado excepto
// "pago" - os anexos podem ser juntados depois de assinada, nao so enquanto
// rascunho, ao contrario dos restantes campos (ver PUT acima).
router.post('/:id/anexos', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!PODE_GERIR.includes(user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para anexar documentos a esta ordem' });
    }
    const existing = await prisma.internalPaymentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de Pagamento Interna nao encontrada' });
    if (existing.status === 'pago') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Nao e possivel anexar documentos a uma ordem ja paga' });
    }

    const novosAnexos = Array.isArray(req.body.anexos) ? req.body.anexos : [];
    if (novosAnexos.length === 0) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Nenhum anexo indicado' });
    }

    const data = safeJsonParse(existing.data, {});
    const anexos = [...(Array.isArray(data.anexos) ? data.anexos : []), ...novosAnexos];

    const ordem = await prisma.internalPaymentOrder.update({
      where: { id: existing.id },
      data: { data: JSON.stringify({ ...data, anexos }) }
    });

    return res.status(200).json({ ordem: toResource(ordem) });
  } catch (error) {
    next(error);
  }
});

// Regista a assinatura (Presidente/Administrador) usando a imagem de assinatura
// guardada no perfil do utilizador - identico ao fluxo da Ordem de Pagamento a
// Fornecedor (ver POST /facturas/:id/ordem-pagamento/assinar).
router.post('/:id/assinar', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const papel = req.body.papel;
    if (!papel || !SIGNATURE_ROLE_MAP[papel]) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Papel de assinatura invalido (use presidente ou administrador)' });
    }
    if (user.role !== SIGNATURE_ROLE_MAP[papel]) {
      return res.status(403).json({ error: 'FORBIDDEN', message: `Apenas o utilizador com o cargo de ${papel} pode assinar nesta funcao` });
    }

    const existing = await prisma.internalPaymentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de Pagamento Interna nao encontrada' });

    const signerUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!signerUser?.signatureImage) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Carregue a sua assinatura no seu perfil antes de assinar' });
    }

    const data = safeJsonParse(existing.data, {});
    const assinaturas = (Array.isArray(data.assinaturas) ? data.assinaturas : [])
      .filter((assinatura: any) => assinatura.papel !== papel);
    assinaturas.push({
      papel,
      user_id: user.id,
      nome: user.name,
      assinatura_url: signerUser.signatureImage,
      assinado_em: new Date().toISOString(),
    });

    const totalmenteAssinada = assinaturas.some((a: any) => a.papel === 'presidente') && assinaturas.some((a: any) => a.papel === 'administrador');

    const ordem = await prisma.internalPaymentOrder.update({
      where: { id: existing.id },
      data: {
        data: JSON.stringify({ ...data, assinaturas }),
        status: totalmenteAssinada && existing.status === 'rascunho' ? 'assinado' : existing.status,
      }
    });

    await auditService.logAction('internal_payment_order_signed', 'info', { ordemId: ordem.id, papel }, {
      userId: user.id, userEmail: user.email, userRole: user.role, resource: 'internal_payment_order', resourceId: ordem.id, success: true,
    });

    return res.status(200).json({ ordem: toResource(ordem) });
  } catch (error) {
    next(error);
  }
});

// Submete a Ordem de Pagamento Interna ao banco - so Financeiro, mesmo passo
// obrigatorio que a Ordem de Pagamento a Fornecedor tem antes de poder ser
// paga (ver module-routes-helper.ts:setStatus, transicao "submetido_ao_banco").
router.post('/:id/submeter-banco', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!PODE_PAGAR.includes(user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Apenas o Financeiro pode submeter ao banco' });
    }
    const existing = await prisma.internalPaymentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de Pagamento Interna nao encontrada' });
    if (existing.status !== 'assinado') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'A ordem precisa das duas assinaturas antes de ser submetida ao banco' });
    }

    const ordem = await prisma.internalPaymentOrder.update({
      where: { id: existing.id },
      data: { status: 'submetido_ao_banco' }
    });

    await auditService.logAction('internal_payment_order_submitted_bank', 'info', { ordemId: ordem.id }, {
      userId: user.id, userEmail: user.email, userRole: user.role, resource: 'internal_payment_order', resourceId: ordem.id, success: true,
    });

    return res.status(200).json({ ordem: toResource(ordem) });
  } catch (error) {
    next(error);
  }
});

// Marca a Ordem de Pagamento Interna como paga - so Financeiro, tal como na
// Ordem de Pagamento a Fornecedor (canPay).
router.post('/:id/pagar', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!PODE_PAGAR.includes(user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Apenas o Financeiro pode marcar como paga' });
    }
    const existing = await prisma.internalPaymentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Ordem de Pagamento Interna nao encontrada' });
    if (existing.status !== 'submetido_ao_banco') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'A ordem precisa de ser submetida ao banco antes de ser marcada como paga' });
    }

    const ordem = await prisma.internalPaymentOrder.update({
      where: { id: existing.id },
      data: { status: 'pago', paidAt: new Date() }
    });

    await auditService.logAction('internal_payment_order_paid', 'info', { ordemId: ordem.id }, {
      userId: user.id, userEmail: user.email, userRole: user.role, resource: 'internal_payment_order', resourceId: ordem.id, success: true,
    });

    return res.status(200).json({ ordem: toResource(ordem) });
  } catch (error) {
    next(error);
  }
});

export default router;
