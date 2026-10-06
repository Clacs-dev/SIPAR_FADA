/**
 * Regras de acesso ao registo automatico de facturas (extraccao do PDF).
 *
 * Na matriz "Roles e Permissoes" (accao "Criar" = pode usar):
 *   - invoice_extraction_rules : extraccao SEM IA (regras locais, nada sai do servidor)
 *   - invoice_extraction_ai    : extraccao COM IA (Claude API, paga por uso)
 *
 * Limite de extraccoes com IA definido UTILIZADOR a UTILIZADOR (SystemSetting
 * "extraccao_ia.limites_utilizadores"): { [userId]: { limite: number | null, periodo } }.
 *   limite null -> sem limite · 0 -> nenhuma · N -> N extraccoes por periodo
 *   periodo "mensal" (conta desde o dia 1 do mes) | "total" (para sempre)
 * Ex.: limite 1 + periodo "total" = esse utilizador so usa a IA uma vez.
 * Utilizador sem limite definido = sem limite (a matriz decide se pode usar).
 *
 * Cada extraccao com IA bem-sucedida fica na Auditoria (FACTURA_EXTRAIDA_IA):
 * e essa contagem que decide o que resta, por isso o limite tambem e auditavel.
 */

import prisma from '../config/database';
import { getUserPermissions, hasPermission, MODULES, ACTIONS } from '../utils/permissions';
import { auditService } from './audit.service';

export const ACCAO_AUDITORIA_IA = 'FACTURA_EXTRAIDA_IA';
const CHAVE_LIMITES = 'extraccao_ia.limites_utilizadores';

export type PeriodoLimite = 'mensal' | 'total';
export interface LimiteExtraccaoIa {
  limite: number | null;
  periodo: PeriodoLimite;
}

export const LIMITE_POR_OMISSAO: LimiteExtraccaoIa = { limite: null, periodo: 'mensal' };

async function lerTodosLimites(): Promise<Record<string, LimiteExtraccaoIa>> {
  const registo = await prisma.systemSetting.findUnique({ where: { key: CHAVE_LIMITES } });
  if (!registo) return {};
  try {
    const valor = JSON.parse(registo.value);
    return valor && typeof valor === 'object' ? valor : {};
  } catch {
    return {};
  }
}

export function normalizarLimite(entrada: any): LimiteExtraccaoIa {
  const periodo: PeriodoLimite = entrada?.periodo === 'total' ? 'total' : 'mensal';
  const bruto = entrada?.limite;
  if (bruto === null || bruto === undefined || bruto === '') return { limite: null, periodo };
  const n = Math.floor(Number(bruto));
  if (!Number.isFinite(n) || n < 0) return { limite: null, periodo };
  return { limite: n, periodo };
}

export async function obterLimiteDoUtilizador(userId: string): Promise<LimiteExtraccaoIa> {
  const todos = await lerTodosLimites();
  return todos[userId] ? normalizarLimite(todos[userId]) : LIMITE_POR_OMISSAO;
}

export async function definirLimiteDoUtilizador(userId: string, entrada: any, autor: { id?: string; name?: string }) {
  const todos = await lerTodosLimites();
  const limite = normalizarLimite(entrada);
  todos[userId] = limite;
  await prisma.systemSetting.upsert({
    where: { key: CHAVE_LIMITES },
    update: { value: JSON.stringify(todos), updatedById: autor.id, updatedByName: autor.name },
    create: { key: CHAVE_LIMITES, value: JSON.stringify(todos), updatedById: autor.id, updatedByName: autor.name },
  });
  return limite;
}

function inicioDoPeriodo(periodo: PeriodoLimite): Date | undefined {
  if (periodo === 'total') return undefined;
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

export async function contarExtraccoesIa(userId: string, periodo: PeriodoLimite): Promise<number> {
  const desde = inicioDoPeriodo(periodo);
  return prisma.auditLog.count({
    where: {
      userId,
      action: ACCAO_AUDITORIA_IA,
      success: true,
      ...(desde ? { createdAt: { gte: desde } } : {}),
    },
  });
}

/** Modo configurado no servidor: off | regras | hibrido | ia. */
export function modoDoServidor(): 'off' | 'regras' | 'hibrido' | 'ia' {
  const modo = (process.env.INVOICE_EXTRACTION_MODE || 'hibrido').trim().toLowerCase();
  return (['off', 'regras', 'hibrido', 'ia'] as const).find((m) => m === modo) || 'hibrido';
}

export function iaConfigurada(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || '').trim() && ['hibrido', 'ia'].includes(modoDoServidor());
}

export interface EstadoExtraccao {
  modo_servidor: ReturnType<typeof modoDoServidor>;
  regras: boolean; // pode extrair sem IA
  ia: boolean; // pode extrair com IA agora (permissao + IA configurada + dentro do limite)
  ia_permitida: boolean; // tem a permissao na matriz
  ia_configurada: boolean;
  limite: number | null;
  periodo: PeriodoLimite;
  usadas: number;
  restantes: number | null; // null = sem limite
  motivo_ia_indisponivel?: string;
}

export async function estadoExtraccao(user: { id: string; role: string }): Promise<EstadoExtraccao> {
  const modo = modoDoServidor();
  const configurada = iaConfigurada();
  const admin = user.role === 'admin_sistema';
  const perms = admin ? null : await getUserPermissions(user.role as any);
  const pode = (module: string) => admin || hasPermission(perms!, module, ACTIONS.CREATE);

  const regras = modo !== 'off' && pode(MODULES.EXTRACCAO_FACTURA_REGRAS);
  const iaPermitida = pode(MODULES.EXTRACCAO_FACTURA_IA);
  const { limite, periodo } = await obterLimiteDoUtilizador(user.id);
  const usadas = await contarExtraccoesIa(user.id, periodo);
  const restantes = limite === null ? null : Math.max(0, limite - usadas);

  let motivo: string | undefined;
  if (modo === 'off') motivo = 'O registo automático está desligado no servidor (INVOICE_EXTRACTION_MODE=off).';
  else if (!iaPermitida) motivo = 'O seu perfil não tem permissão para a extracção com IA.';
  else if (!configurada) motivo = 'A extracção com IA não está configurada no servidor.';
  else if (restantes === 0) {
    motivo = periodo === 'total'
      ? `Já usou as ${limite} extracção(ões) com IA que lhe foram atribuídas.`
      : `Já usou as ${limite} extracção(ões) com IA que lhe foram atribuídas para este mês.`;
  }

  return {
    modo_servidor: modo,
    regras,
    ia: !motivo,
    ia_permitida: iaPermitida,
    ia_configurada: configurada,
    limite,
    periodo,
    usadas,
    restantes,
    ...(motivo ? { motivo_ia_indisponivel: motivo } : {}),
  };
}

/** Regista (na Auditoria) uma extraccao com IA bem-sucedida - conta para o limite. */
export async function registarExtraccaoIa(
  user: { id: string; email?: string; role: string },
  detalhes: Record<string, unknown>
) {
  await auditService.logAction(ACCAO_AUDITORIA_IA, 'info', detalhes, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    resource: 'factura',
    success: true,
  });
}
