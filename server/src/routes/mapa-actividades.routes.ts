import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import { requireLicenseModule } from '../middlewares/license';
import { licenseService } from '../services/license.service';
import * as permissions from '../utils/permissions';
import { auditService } from '../services/audit.service';
import {
  CAMPOS_EDITAVEIS,
  construirMapa,
  descreverPeriodo,
  gerarXlsx,
  lerFiltros,
  guardarAjustesItem,
} from '../services/mapa-actividades.service';

/**
 * Mapa de Actividades (DSG) - visivel em Procurement/Compras e em Financas.
 * Mesmo publico que le todas as facturas (Gestao de Pagamento) ou o
 * Procurement: invoices:read_all ou finance:read_all.
 */
const router = Router();
router.use(requireAuth as any);
// Cruza Facturas e Compras - basta um dos dois modulos estar licenciado
// (mesma regra do item de menu, ver MENU_ITEM_LICENSE_MODULE no cliente).
router.use(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await licenseService.getCachedValidation();
    if (licenseService.isRestricted(result.status) || licenseService.moduleIncluded(result, 'invoices')) {
      // Estados restritos: o gate normal (leitura/exportacao sempre permitidas, escrita bloqueada).
      return requireLicenseModule('invoices')(req, res, next);
    }
    return requireLicenseModule('finance')(req, res, next);
  } catch (error) {
    next(error);
  }
});

async function permissoesDe(req: AuthenticatedRequest) {
  const user = req.user!;
  return permissions.getUserPermissions(user.role as any, user.department, undefined);
}

// Permissao propria do Mapa (modulo activity_map), concedida por role no
// ecra "Roles e Permissoes": read_all = ver, export = descarregar, update =
// completar/corrigir linhas. (Os roles que ja viam o mapa pela regra antiga
// receberam-na automaticamente - ver services/rbac-sync.service.ts.)
async function podeLer(req: AuthenticatedRequest) {
  return permissions.hasPermission(await permissoesDe(req), permissions.MODULES.ACTIVITY_MAP, permissions.ACTIONS.READ_ALL);
}

async function podeExportar(req: AuthenticatedRequest) {
  return permissions.hasPermission(await permissoesDe(req), permissions.MODULES.ACTIVITY_MAP, permissions.ACTIONS.EXPORT);
}

async function podeEditar(req: AuthenticatedRequest) {
  return permissions.hasPermission(await permissoesDe(req), permissions.MODULES.ACTIVITY_MAP, permissions.ACTIONS.UPDATE);
}

function lerPeriodo(query: any) {
  const agora = new Date();
  const ano = Number(query.ano) || agora.getFullYear();
  // mes=0 (ou "todos") = ano inteiro.
  const mesRaw = query.mes;
  const mes = mesRaw === '0' || mesRaw === 'todos' ? 0 : (Number(mesRaw) || agora.getMonth() + 1);
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100 || !Number.isInteger(mes) || mes < 0 || mes > 12) return null;
  return { ano, mes };
}

function construirDoPedido(req: AuthenticatedRequest, periodo: { ano: number; mes: number }) {
  return construirMapa({
    ...periodo,
    elaboradoPor: (req.query.elaborado_por as string) || req.user!.name,
    aprovadoPor: req.query.aprovado_por as string,
    direccao: req.query.direccao as string,
    filtros: lerFiltros(req.query as any),
  });
}

/** Regista na Auditoria do sistema o periodo e os filtros usados (consulta ou exportacao). */
function auditar(req: AuthenticatedRequest, acao: string, mapa: Awaited<ReturnType<typeof construirMapa>>, extra: Record<string, any> = {}) {
  return auditService.logAction(acao, 'info', {
    periodo: descreverPeriodo(mapa.ano, mapa.mes),
    ano: mapa.ano,
    mes: mapa.mes,
    filtros: mapa.filtros,
    filtros_descricao: mapa.filtros_descricao.length ? mapa.filtros_descricao : ['Sem filtros'],
    linhas_servicos: mapa.servicos.length,
    linhas_bens: mapa.bens.length,
    linhas_sem_filtros: mapa.total_sem_filtros,
    valor_total: mapa.total_geral.valor,
    ...extra,
  }, {
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    resource: 'mapa_actividades',
    ipAddress: req.ip || 'unknown',
    userAgent: req.get('user-agent') || undefined,
    success: true,
  }).catch(() => null);
}

const negar = (res: Response) => res.status(403).json({ error: 'FORBIDDEN', message: 'Sem permissao para aceder ao Mapa de Actividades' });

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!(await podeLer(req))) return negar(res);
    const periodo = lerPeriodo(req.query);
    if (!periodo) return res.status(400).json({ error: 'BAD_REQUEST', message: 'Periodo invalido (ano/mes)' });
    const mapa = await construirDoPedido(req, periodo);
    await auditar(req, mapa.filtros_descricao.length ? 'MAPA_ACTIVIDADES_FILTRADO' : 'MAPA_ACTIVIDADES_CONSULTADO', mapa);
    return res.status(200).json({ mapa, pode_editar: await podeEditar(req), pode_exportar: await podeExportar(req) });
  } catch (error) {
    next(error);
  }
});

router.get('/export', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!(await podeLer(req)) || !(await podeExportar(req))) return negar(res);
    const periodo = lerPeriodo(req.query);
    if (!periodo) return res.status(400).json({ error: 'BAD_REQUEST', message: 'Periodo invalido (ano/mes)' });
    const mapa = await construirDoPedido(req, periodo);
    const buffer = await gerarXlsx(mapa);
    const sufixo = periodo.mes ? `${periodo.ano}-${String(periodo.mes).padStart(2, '0')}` : `${periodo.ano}`;
    const nome = `Mapa_de_Actividades_FADA_${sufixo}${mapa.filtros_descricao.length ? '_filtrado' : ''}.xlsx`;

    await auditar(req, 'MAPA_ACTIVIDADES_EXPORTADO_XLSX', mapa, {
      ficheiro: nome,
      elaborado_por: mapa.identificacao.elaborado_por,
      aprovado_por: mapa.identificacao.aprovado_por || null,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.setHeader('Content-Length', String(buffer.length));
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
});

// Completa/corrige os campos de uma linha (item de uma factura). Valor vazio
// repoe o valor deduzido automaticamente pelo sistema.
router.put('/facturas/:facturaId/itens/:itemKey', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!(await podeEditar(req))) return negar(res);
    const campos: Record<string, string> = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (req.body && campo in req.body) campos[campo] = req.body[campo] == null ? '' : String(req.body[campo]);
    }
    const resultado = await guardarAjustesItem(req.params.facturaId, req.params.itemKey, campos);
    if (resultado === null) return res.status(404).json({ error: 'NOT_FOUND', message: 'Factura nao encontrada' });

    await auditService.logAction('MAPA_ACTIVIDADES_LINHA_EDITADA', 'info', { facturaId: req.params.facturaId, itemKey: req.params.itemKey, campos }, {
      userId: req.user?.id, userEmail: req.user?.email, userRole: req.user?.role, resource: 'mapa_actividades',
      resourceId: req.params.facturaId, ipAddress: req.ip || 'unknown', success: true,
    }).catch(() => null);

    return res.status(200).json({ ajustes: resultado });
  } catch (error) {
    next(error);
  }
});

export default router;
