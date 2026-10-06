import prisma from '../config/database';

/** "FT 2026/12", "FT2026/12", "ft.2026/12" -> "FT2026/12" */
export function normalizarNumeroDocumento(numero: string): string {
  return (numero || '').toUpperCase().replace(/[\s.\-_]/g, '');
}

export interface FacturaDuplicada {
  id: string;
  numero: string | null;
  status: string;
  numero_fornecedor: string;
}

/**
 * Facturas (nao eliminadas nem anuladas) do mesmo fornecedor (NIF) com o mesmo
 * numero de documento do fornecedor - registar outra seria pagar duas vezes.
 */
export async function procurarFacturasDuplicadas(nif: string, numeroFornecedor: string, excluirId?: string): Promise<FacturaDuplicada[]> {
  const nifLimpo = (nif || '').trim();
  const alvo = normalizarNumeroDocumento(numeroFornecedor);
  if (!nifLimpo || !alvo) return [];
  const candidatas = await prisma.factura.findMany({
    where: { nif: nifLimpo, deletedAt: null, ...(excluirId ? { id: { not: excluirId } } : {}) },
    select: { id: true, numero: true, status: true, data: true },
  });
  return candidatas
    .map((f) => {
      let data: any = {};
      try { data = JSON.parse(f.data || '{}'); } catch { /* registo antigo */ }
      return { id: f.id, numero: f.numero, status: f.status, numero_fornecedor: String(data.numero_fornecedor || '') };
    })
    .filter((f) => f.status !== 'cancelado' && f.status !== 'anulado' && normalizarNumeroDocumento(f.numero_fornecedor) === alvo);
}
