/**
 * Regra "documento proprio, ainda sem accao".
 *
 * Roles com as accoes update_own / delete_own (ex: DSG Tecnico) podem editar,
 * anular ou eliminar um documento so quando:
 *   - foram eles que o submeteram (createdById / registado_por_id), e
 *   - ninguem actuou ainda sobre ele (nao foi validado, aprovado, rejeitado,
 *     analisado, nao tem ordem de compra/pagamento, etc.).
 * Quem tem a permissao "cheia" (update/delete) continua a seguir as regras
 * normais de cada modulo.
 */

import { AuthenticatedRequest } from '../middlewares/auth';
import * as permissions from './permissions';

export type ResultadoAutorizacao = 'total' | 'proprio' | null;

function safeParse(value: any, fallback: any = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function permissoesDoUtilizador(req: AuthenticatedRequest) {
  const user = req.user!;
  return permissions.getUserPermissions(user.role as any, user.department, undefined);
}

export async function temPermissao(req: AuthenticatedRequest, module: string, action: string) {
  if (!req.user) return false;
  return permissions.hasPermission(await permissoesDoUtilizador(req), module, action);
}

/**
 * 'total' se o utilizador tem a accao completa; 'proprio' se so tem a
 * variante *_own (o chamador tem ainda de confirmar autoria e "sem accao");
 * null se nao tem nenhuma.
 */
export async function nivelDeAcesso(req: AuthenticatedRequest, module: string, acaoTotal: string, acaoPropria: string): Promise<ResultadoAutorizacao> {
  if (!req.user) return null;
  const perms = await permissoesDoUtilizador(req);
  if (permissions.hasPermission(perms, module, acaoTotal)) return 'total';
  if (permissions.hasPermission(perms, module, acaoPropria)) return 'proprio';
  return null;
}

// Estados iniciais em que ainda ninguem actuou sobre a factura.
const ESTADOS_INICIAIS_FACTURA = ['rascunho', 'registada', 'pendente'];

export function facturaSemAccao(factura: any): boolean {
  if (!factura || !ESTADOS_INICIAIS_FACTURA.includes(factura.status)) return false;
  if (factura.numeroOrdemPagamento || factura.paidAt) return false;
  const data = safeParse(factura.data, {});
  return !(data.validado_at || data.aprovado_at || data.rejeitado_at || data.ordem_pagamento);
}

/** Pedido de compra ainda sem cotacoes e por publicar (ou publicado sem respostas). */
export function pedidoSemAccao(pedido: any, nCotacoes: number): boolean {
  if (!pedido) return false;
  if (pedido.status === 'criado' || pedido.status === 'rascunho') return true;
  return pedido.status === 'aguardando_cotacoes' && nCotacoes === 0;
}

/** Cotacao ainda nao analisada/seleccionada e sem ordem de compra. */
export function cotacaoSemAccao(cotacao: any, pedido: any, nOrdens: number): boolean {
  if (!cotacao || !pedido) return false;
  if (cotacao.selected || nOrdens > 0) return false;
  if (!['recebida', 'submetida'].includes(cotacao.status)) return false;
  return ['aguardando_cotacoes', 'em_cotacao'].includes(pedido.status);
}

/** Quem registou a cotacao (gravado em data.registado_por_id desde esta versao). */
export function autorDaCotacao(cotacao: any): string | null {
  const data = safeParse(cotacao?.data, {});
  return data.registado_por_id || null;
}

/** Fornecedor ainda sem qualquer documento associado (cotacoes, ordens, pedidos ou facturas). */
export function fornecedorSemAccao(contagens: { cotacoes: number; ordens: number; pedidos: number; facturas: number }): boolean {
  return contagens.cotacoes === 0 && contagens.ordens === 0 && contagens.pedidos === 0 && contagens.facturas === 0;
}

export const MENSAGEM_SEM_ACCAO =
  'So pode editar, anular ou eliminar documentos submetidos por si e enquanto ninguem actuou sobre eles.';
