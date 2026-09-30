import prisma from '../config/database';

const PREFIX_BY_MODULE: Record<string, { prefix: string; monthly: boolean; field: 'numero' | 'codigo' }> = {
  presentation: { prefix: 'CAP', monthly: true, field: 'numero' },
  audience: { prefix: 'AUD', monthly: true, field: 'numero' },
  pedido: { prefix: 'TKT', monthly: true, field: 'numero' },
  acta: { prefix: 'ACTA', monthly: false, field: 'numero' },
  oficio: { prefix: 'OF', monthly: true, field: 'numero' },
  factura: { prefix: 'FAC', monthly: true, field: 'numero' },
  internalPaymentOrder: { prefix: 'OPI', monthly: true, field: 'numero' },
  contrato: { prefix: 'CONT', monthly: false, field: 'numero' },
  reclamacao: { prefix: 'REC', monthly: true, field: 'codigo' },
  procurement: { prefix: 'PROC', monthly: true, field: 'numero' },
  purchaseOrder: { prefix: 'OC', monthly: true, field: 'numero' },
  budget: { prefix: 'ORC', monthly: false, field: 'numero' },
  accountPayable: { prefix: 'CP', monthly: true, field: 'numero' },
  accountReceivable: { prefix: 'CR', monthly: true, field: 'numero' },
  comunicacao: { prefix: 'COM', monthly: true, field: 'numero' },
  pedidoViatura: { prefix: 'PV', monthly: true, field: 'numero' },
  utilizacaoViatura: { prefix: 'UV', monthly: true, field: 'numero' },
  manutencaoViatura: { prefix: 'MAN', monthly: true, field: 'numero' },
};

function formatNumber(prefix: string, year: number, month: number, current: number) {
  const sequence = String(current).padStart(4, '0');
  if (month > 0) return `${prefix}/${year}/${String(month).padStart(2, '0')}/${sequence}`;
  return `${prefix}/${year}/${sequence}`;
}

export class SequenceService {
  static getConfig(module: string) {
    return PREFIX_BY_MODULE[module];
  }

  static async next(module: string, date = new Date()) {
    const config = this.getConfig(module);
    if (!config) return null;

    const year = date.getFullYear();
    const month = config.monthly ? date.getMonth() + 1 : 0;

    const sequence = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentSequence.findUnique({
        where: {
          module_year_month_prefix: {
            module,
            year,
            month,
            prefix: config.prefix,
          }
        }
      });

      if (!existing) {
        return tx.documentSequence.create({
          data: {
            module,
            year,
            month,
            prefix: config.prefix,
            current: 1,
          }
        });
      }

      return tx.documentSequence.update({
        where: { id: existing.id },
        data: { current: { increment: 1 } },
      });
    });

    return {
      field: config.field,
      value: formatNumber(config.prefix, year, month, sequence.current),
    };
  }
}
