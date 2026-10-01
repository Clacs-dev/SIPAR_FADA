/**
 * Regras fiscais angolanas (IVA e Retenção na Fonte) aplicadas a facturas e
 * ordens de compra. Fonte: Código do Imposto sobre o Valor Acrescentado
 * (CIVA, Lei n.o 14/23 de 28 de Dezembro e alterações do OGE 2026) e regras
 * de retenção na fonte de Imposto Industrial aplicáveis a serviços.
 *
 * - IVA (bens/produtos): 14% (taxa geral), 7% (regime simplificado /
 *   hotelaria e restauração), 5% (bens alimentares e agrícolas dos Anexos
 *   I/II, ou equipamento industrial mediante pedido e aprovação da AGT), 2%.
 *   É "IVA cativo": retido na totalidade por quem paga (substituto
 *   tributário) e entregue directamente à AGT, em vez de ser pago ao
 *   fornecedor - por isso reduz o valor efectivamente desembolsado.
 * - Retenção na fonte (serviços): 6,5% sobre o valor dos serviços prestados
 *   por sujeitos passivos dos Grupos B/C, retida por quem paga no momento do
 *   pagamento. Tal como o IVA cativo, não reduz o valor da factura emitida
 *   pelo fornecedor (esse continua bruto + IVA, é o que consta do
 *   documento), mas reduz o valor efectivamente desembolsado (ver `valor_final`).
 *
 * Mantido em sincronia manual com client/src/utils/fiscal.ts (mesma lógica,
 * duplicada por não existir pacote partilhado entre client e server).
 */

export const TAXAS_IVA_PRODUTOS = [14, 7, 5, 2, 0] as const;
export const TAXA_IVA_PADRAO = 14;
export const TAXA_RETENCAO_SERVICOS = 6.5;
/** Serviços de valor bruto igual ou inferior a este limiar nunca sofrem retenção na fonte. */
export const LIMIAR_RETENCAO_SERVICOS = 20000;

export type TipoOperacaoFiscal = 'produto' | 'servico';

export interface LinhaFiscal {
  valor_bruto: number;
  taxa_iva: number;
  valor_iva: number;
  taxa_retencao: number;
  valor_retencao: number;
  /** Valor efectivamente a pagar ao fornecedor: valor_bruto menos IVA cativo e/ou retenção - os dois podem aplicar-se ao mesmo item. */
  valor_final: number;
}

function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/**
 * Classifica um item (produto vs serviço) a partir do campo `tipo` já usado
 * hoje em ItemPedido/ItemFactura. Só "servico" é tratado como serviço - todos
 * os outros valores (material, equipamento, consumivel, software, outro, ou
 * em branco) são tratados como produto/bem. Usado só para reporting (ex:
 * split Mercadoria/Serviços no Mapa de Impostos) - não decide sozinho que
 * imposto se aplica (ver `calcularFiscal`).
 */
export function classificarTipoOperacao(tipoItem?: string | null): TipoOperacaoFiscal {
  return tipoItem === 'servico' ? 'servico' : 'produto';
}

/** Garante que a taxa de IVA escolhida é uma das taxas legais (incluindo 0%); caso contrário usa a taxa geral (14%). */
export function normalizarTaxaIva(taxa?: number | null): number {
  const valor = Number(taxa);
  return (TAXAS_IVA_PRODUTOS as readonly number[]).includes(valor) ? valor : TAXA_IVA_PADRAO;
}

/**
 * IVA e retenção na fonte são independentes: um item pode ter só IVA, só
 * retenção, os dois ao mesmo tempo (ex: serviço sujeito a IVA reduzido e a
 * retenção de 6,5%), ou nenhum dos dois (taxa de IVA 0%, sem retenção).
 */
export function calcularFiscal(valorBruto: number, taxaIva?: number, aplicarRetencao?: boolean): LinhaFiscal {
  const bruto = round2(valorBruto);
  const taxa = normalizarTaxaIva(taxaIva);
  const valorIva = round2(bruto * taxa / 100);
  // Serviços de valor igual ou inferior a LIMIAR_RETENCAO_SERVICOS (20.000 Kz)
  // nunca sofrem retenção na fonte, mesmo que assinalado no formulário.
  const retencaoAplicavel = !!aplicarRetencao && bruto > LIMIAR_RETENCAO_SERVICOS;
  const valorRetencao = retencaoAplicavel ? round2(bruto * TAXA_RETENCAO_SERVICOS / 100) : 0;

  return {
    valor_bruto: bruto,
    taxa_iva: taxa,
    valor_iva: valorIva,
    taxa_retencao: retencaoAplicavel ? TAXA_RETENCAO_SERVICOS : 0,
    valor_retencao: valorRetencao,
    // IVA cativo e retenção são ambos retidos na totalidade, não pagos ao fornecedor.
    valor_final: round2(bruto - valorIva - valorRetencao),
  };
}

/** Agrega várias linhas fiscais (itens de uma factura/ordem) num único total. */
export function somarFiscal(linhas: LinhaFiscal[]): LinhaFiscal {
  const somado = linhas.reduce(
    (acc, linha) => ({
      valor_bruto: acc.valor_bruto + (linha.valor_bruto || 0),
      valor_iva: acc.valor_iva + (linha.valor_iva || 0),
      valor_retencao: acc.valor_retencao + (linha.valor_retencao || 0),
      valor_final: acc.valor_final + (linha.valor_final || 0),
    }),
    { valor_bruto: 0, valor_iva: 0, valor_retencao: 0, valor_final: 0 }
  );

  return {
    valor_bruto: round2(somado.valor_bruto),
    taxa_iva: 0, // não faz sentido uma taxa única agregada quando há itens mistos
    valor_iva: round2(somado.valor_iva),
    taxa_retencao: 0,
    valor_retencao: round2(somado.valor_retencao),
    valor_final: round2(somado.valor_final),
  };
}
