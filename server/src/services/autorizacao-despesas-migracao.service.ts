/**
 * Migracao unica: o documento "Ordem de Compra" (numeracao OC/aaaa/mm/nnnn)
 * passou a chamar-se "Autorizacao de Despesas" (AD/aaaa/mm/nnnn).
 *
 *  1. Contadores (DocumentSequence): o do purchaseOrder com prefixo OC passa a
 *     AD, juntando o da antiga sequencia propria "despesaAutorizada" (AD) - fica
 *     com o maior dos dois, para os proximos numeros nunca repetirem.
 *  2. Documentos ja emitidos: OC/... e OC-... passam a AD/... e AD-...; se o
 *     numero novo ja existir (AD emitido pela antiga sequencia), recebe o
 *     proximo numero livre da sequencia.
 *  3. Facturas ligadas: numeroOrdem, e as referencias ao numero antigo nos
 *     dados/descricao (numero_ordem, comentarios de validacao, etc.).
 *
 * Idempotente (marcador em SystemSetting). O historico/auditoria antigos nao
 * sao reescritos - registam o que aconteceu na altura.
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { SequenceService } from './sequence.service';

const MARCADOR = 'migracao.autorizacao_despesas.numeracao_ad.v1';
const NUMERO_OC = /^OC([/-])/;

function substituirTextos(texto: string | null | undefined, mapa: Map<string, string>) {
  if (!texto) return texto;
  let novo = texto;
  for (const [antigo, actual] of mapa) novo = novo.split(antigo).join(actual);
  return novo.split('Ordem de Compra').join('Autorização de Despesas');
}

async function unificarContadores() {
  const linhas = await prisma.documentSequence.findMany({
    where: { OR: [{ module: 'purchaseOrder' }, { module: 'despesaAutorizada' }] },
  });
  const porPeriodo = new Map<string, typeof linhas>();
  for (const l of linhas) {
    const chave = `${l.year}-${l.month}`;
    porPeriodo.set(chave, [...(porPeriodo.get(chave) || []), l]);
  }
  for (const grupo of porPeriodo.values()) {
    const maior = Math.max(...grupo.map((l) => l.current));
    const { year, month } = grupo[0];
    await prisma.$transaction(async (tx) => {
      for (const l of grupo) await tx.documentSequence.delete({ where: { id: l.id } });
      await tx.documentSequence.create({ data: { module: 'purchaseOrder', year, month, prefix: 'AD', current: maior } });
    });
  }
}

export async function migrarNumeracaoAutorizacaoDespesas() {
  const feito = await prisma.systemSetting.findUnique({ where: { key: MARCADOR } });
  if (feito) return;

  await unificarContadores();

  const ordens = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'asc' } });
  const usados = new Set(ordens.map((o) => o.numero).filter((n): n is string => !!n && !NUMERO_OC.test(n)));
  const mapa = new Map<string, string>();

  for (const ordem of ordens) {
    if (!ordem.numero || !NUMERO_OC.test(ordem.numero)) continue;
    let novo = ordem.numero.replace(NUMERO_OC, 'AD$1');
    if (usados.has(novo)) {
      const seq = await SequenceService.next('purchaseOrder', ordem.createdAt);
      novo = seq?.value || `${novo}-${ordem.id.slice(0, 4)}`;
    }
    usados.add(novo);
    mapa.set(ordem.numero, novo);
    await prisma.purchaseOrder.update({
      where: { id: ordem.id },
      data: { numero: novo, data: substituirTextos(ordem.data, mapa) || ordem.data },
    });
  }

  if (mapa.size > 0) {
    const antigos = Array.from(mapa.keys());
    const ids = ordens.filter((o) => o.numero && mapa.has(o.numero)).map((o) => o.id);
    const facturas = await prisma.factura.findMany({
      where: { OR: [{ numeroOrdem: { in: antigos } }, { purchaseOrderId: { in: ids } }] },
    });
    for (const f of facturas) {
      await prisma.factura.update({
        where: { id: f.id },
        data: {
          numeroOrdem: f.numeroOrdem ? (mapa.get(f.numeroOrdem) || f.numeroOrdem) : f.numeroOrdem,
          descricao: substituirTextos(f.descricao, mapa),
          data: substituirTextos(f.data, mapa) || f.data,
        },
      });
    }
  }

  await prisma.systemSetting.create({ data: { key: MARCADOR, value: new Date().toISOString(), updatedByName: 'sistema' } });
  if (mapa.size > 0) logger.info(`[AD] ${mapa.size} documento(s) "Ordem de Compra" renumerados para Autorização de Despesas (AD).`);
}
