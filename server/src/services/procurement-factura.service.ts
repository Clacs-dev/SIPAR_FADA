import prisma from '../config/database';
import { normalizeAnexos, resolveFornecedorBankInfo } from '../utils/module-routes-helper';
import { calcularFiscal, classificarTipoOperacao, somarFiscal, type LinhaFiscal } from '../utils/fiscal';

function safeParse(value: any, fallback: any) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const NOME_GENERICO = 'Fornecedor';

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Monta todos os dados da factura gerada na confirmacao de rececao de uma
 * Ordem de Compra, a partir do pedido de origem, da cotacao aprovada e do
 * registo do fornecedor. Antes a factura ficava so com numero/valor/itens do
 * pedido (sem precos, IVA, NIF, contactos, validacao nem anexos), e o card e o
 * detalhe em Gestao de Pagamento mostravam quase tudo vazio.
 */
export async function montarFacturaDaOrdem(ordem: any, user: { id?: string; name?: string } | null) {
  const [pedido, cotacao] = await Promise.all([
    ordem.procurementId ? prisma.procurement.findUnique({ where: { id: ordem.procurementId } }) : null,
    ordem.quotationId ? prisma.purchaseQuotation.findUnique({ where: { id: ordem.quotationId } }) : null,
  ]);

  const fornecedorId = ordem.fornecedorId || cotacao?.fornecedorId || pedido?.fornecedorId || null;
  const fornecedorRegisto = fornecedorId
    ? await prisma.fornecedor.findUnique({ where: { id: fornecedorId } }).catch(() => null)
    : null;
  const fornecedorData = safeParse(fornecedorRegisto?.data, {});

  const pedidoData = safeParse(pedido?.data, {});
  const cotacaoData = safeParse(cotacao?.data, {});

  const nomeFornecedor = [fornecedorRegisto?.nome, cotacao?.fornecedor, ordem.fornecedor, pedido?.fornecedor]
    .find((nome) => nome && nome !== NOME_GENERICO) || ordem.fornecedor || NOME_GENERICO;

  // Itens: descricao/quantidade/unidade vem do pedido; preco e IVA vem da
  // resposta do fornecedor na cotacao aprovada (casada por descricao, ou pela
  // mesma posicao quando a descricao nao bate).
  const itensOrdem = safeParse(ordem.itens, []);
  const itensPedido: any[] = Array.isArray(itensOrdem) && itensOrdem.length > 0
    ? itensOrdem
    : (pedidoData.itens || pedidoData.items || []);
  const respostas: any[] = Array.isArray(cotacaoData.itens_resposta) ? cotacaoData.itens_resposta : [];
  const itens = itensPedido.map((item: any, index: number) => {
    const descricao = item.descricao || item.nome || '';
    const resposta = respostas.find((r) => r.item_id && r.item_id === item.id)
      || respostas.find((r) => r.item_descricao && r.item_descricao === descricao)
      || respostas[index]
      || {};
    const quantidade = Number(resposta.quantidade_disponivel ?? item.quantidade ?? 1) || 0;
    const precoUnitario = Number(resposta.preco_unitario ?? item.preco_unitario ?? 0) || 0;
    const subtotal = round2(quantidade * precoUnitario);
    // IVA (produtos, 14/7/5/2%) ou Retenção na Fonte (serviços, 6,5%) - ver server/src/utils/fiscal.ts.
    const tipoOperacao = classificarTipoOperacao(item.tipo);
    const taxaIvaEscolhida = Number(resposta.iv_percentagem ?? resposta.taxa_iva ?? resposta.iva ?? item.iva);
    const aplicaRetencao = tipoOperacao === 'servico';
    const fiscal = calcularFiscal(subtotal, taxaIvaEscolhida, aplicaRetencao);
    return {
      id: item.id || `item-${index + 1}`,
      descricao,
      tipo: item.tipo,
      tipo_operacao: tipoOperacao,
      aplica_retencao: aplicaRetencao,
      unidade: item.unidade,
      especificacoes_tecnicas: item.especificacoes_tecnicas || undefined,
      quantidade,
      preco_unitario: precoUnitario,
      iva: fiscal.taxa_iva,
      taxa_iva: fiscal.taxa_iva,
      valor_iva: fiscal.valor_iva,
      taxa_retencao: fiscal.taxa_retencao,
      valor_retencao: fiscal.valor_retencao,
      subtotal,
      total: fiscal.valor_final,
      prazo_entrega_dias: resposta.prazo_entrega_dias,
      condicoes_pagamento: resposta.condicoes_pagamento || undefined,
      observacoes: resposta.observacoes || item.observacoes || undefined,
    };
  });

  const somatorioFiscal: LinhaFiscal = somarFiscal(itens.map((item) => ({
    valor_bruto: item.subtotal,
    taxa_iva: item.taxa_iva,
    valor_iva: item.valor_iva,
    taxa_retencao: item.taxa_retencao,
    valor_retencao: item.valor_retencao,
    valor_final: item.total,
  })));
  const subtotal = somatorioFiscal.valor_bruto;
  const ivaTotal = somatorioFiscal.valor_iva;
  const retencaoTotal = somatorioFiscal.valor_retencao;
  // "total" mantém o significado já existente (valor da factura emitida pelo
  // fornecedor: bruto + IVA, o que consta do documento) - nem o IVA cativo
  // nem a retenção reduzem o valor da factura, só o que a organização
  // efectivamente desembolsa (ver "valorFinal" abaixo, já somado por item).
  const totalItens = round2(subtotal + ivaTotal);
  const total = ordem.valor || cotacao?.valor || totalItens;
  const valorFinal = somatorioFiscal.valor_final;

  const tiposItens = new Set(itens.map((item) => item.tipo).filter(Boolean));
  const tipo = tiposItens.size > 1 ? 'ambos' : tiposItens.has('servico') ? 'servico' : 'mercadoria';

  const condicoesPagamento = cotacaoData.condicoes_gerais
    || respostas.map((r) => r.condicoes_pagamento).find(Boolean)
    || undefined;

  // Todos os anexos do processo: os da cotacao aprovada (proposta do
  // fornecedor), os do pedido de compra e os da propria ordem.
  const anexos = [
    ...normalizeAnexos(safeParse(cotacao?.anexos, [])).map((a) => ({ ...a, origem: 'cotacao' })),
    ...normalizeAnexos(pedidoData.anexos || []).map((a) => ({ ...a, origem: 'pedido' })),
    ...normalizeAnexos(safeParse(ordem.anexos, [])).map((a) => ({ ...a, origem: 'ordem_compra' })),
  ];
  const vistos = new Set<string>();
  const anexosUnicos = anexos.filter((anexo) => {
    const chave = anexo.url || anexo.nome;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });

  const bancoInfo = await resolveFornecedorBankInfo(
    { purchaseOrderId: ordem.id, fornecedor: nomeFornecedor },
    { fornecedor_id: fornecedorId }
  ).catch(() => null);

  const agora = new Date().toISOString();
  const titulo = pedidoData.titulo || pedido?.descricao || '';
  const descricaoItens = itens.map((item) => item.descricao).filter(Boolean).join(', ');
  const descricao = [titulo, descricaoItens && descricaoItens !== titulo ? descricaoItens : '']
    .filter(Boolean).join(' - ')
    || `Factura referente a Ordem de Compra ${ordem.numero || ordem.id}`;

  const comentarioValidacao = `Validada automaticamente na confirmacao de rececao da Ordem de Compra ${ordem.numero || ''}`.trim();

  const data = {
    origem: 'procurement',
    tipo,
    tipo_documento: 'factura',
    titulo,
    categoria: pedidoData.categoria,
    departamento_solicitante: pedidoData.departamento_solicitante,
    local_entrega: pedidoData.local_entrega || ordem.localEntrega || undefined,
    prazo_entrega_desejado: pedidoData.prazo_entrega_desejado,
    observacoes: [pedidoData.observacoes, cotacaoData.observacoes_gerais].filter(Boolean).join('\n') || undefined,
    condicoes_pagamento: condicoesPagamento,
    prazo_validade_cotacao: cotacaoData.prazo_validade_cotacao,

    fornecedor_id: fornecedorId,
    fornecedor_nome: nomeFornecedor,
    fornecedor_nif: fornecedorRegisto?.nif || fornecedorData.nif || undefined,
    fornecedor_email: fornecedorRegisto?.email || cotacao?.email || undefined,
    fornecedor_telefone: fornecedorRegisto?.telefone || fornecedorData.telefone || undefined,
    fornecedor_morada: fornecedorRegisto?.endereco || fornecedorData.endereco || undefined,

    itens,
    subtotal: subtotal || total,
    iva_total: ivaTotal,
    total,
    // Retenção na fonte de serviços (6,5%) e valor efectivamente a pagar
    // (total - retenção) - ver server/src/utils/fiscal.ts.
    retencao_total: retencaoTotal,
    valor_final: valorFinal,

    pedido_id: pedido?.id,
    pedido_numero: pedido?.numero,
    cotacao_id: cotacao?.id,
    purchase_order_id: ordem.id,
    numero_ordem: ordem.numero,

    data_emissao: agora.slice(0, 10),
    data_recebimento: agora,
    recebido_por_id: user?.id,
    recebido_por_nome: user?.name,

    validado_por_id: user?.id,
    validado_por_nome: user?.name,
    validado_at: agora,
    validacao_comentario: comentarioValidacao,

    ...(bancoInfo || {}),
  };

  return {
    comentarioValidacao,
    historicoCriacao: `Gerada a partir da Ordem de Compra ${ordem.numero || ''} (Pedido ${pedido?.numero || '-'})`,
    columns: {
      fornecedor: nomeFornecedor,
      nif: data.fornecedor_nif || null,
      valor: total,
      moeda: ordem.moeda || cotacao?.moeda || 'AOA',
      dataEmissao: data.data_emissao,
      descricao,
      anexos: JSON.stringify(anexosUnicos),
      purchaseOrderId: ordem.id,
      numeroOrdem: ordem.numero,
    },
    data,
  };
}

const ESTADOS_COM_ORDEM_COMPRA = ['validado', 'aprovado', 'submetido_ao_banco', 'pago'];

/**
 * Factura "normal" (registada directamente em Gestao de Pagamento, sem passar
 * pelo Procurement): ao ser validada passa a ter a sua propria Ordem de Compra
 * oficial (numeracao da sequencia purchaseOrder), para poder ser visualizada e
 * descarregada tal como a de um processo de Procurement concluido. Idempotente:
 * se a factura ja tiver ordem, devolve-a.
 */
export async function garantirOrdemCompraDaFactura(facturaId: string, user: { id?: string; name?: string } | null) {
  const factura = await prisma.factura.findUnique({ where: { id: facturaId } });
  if (!factura) return null;

  if (factura.purchaseOrderId) {
    const existente = await prisma.purchaseOrder.findUnique({ where: { id: factura.purchaseOrderId } });
    if (existente) return existente;
  }

  if (!ESTADOS_COM_ORDEM_COMPRA.includes(factura.status)) return null;

  const data = safeParse(factura.data, {});
  // data.fornecedor_id so e um Fornecedor.id valido quando a factura veio do
  // Procurement; facturas submetidas directamente pelo fornecedor externo
  // (ver client/src/components/external/submit-factura-form.tsx) gravam ali
  // o User.id de quem submeteu, que nao existe na tabela Fornecedor - usa-lo
  // directamente como chave estrangeira rebenta o purchaseOrder.create()
  // abaixo (Foreign key constraint violated). Resolve para o Fornecedor
  // ligado a essa conta, se existir; caso contrario fica sem fornecedor
  // associado (o campo e opcional).
  let fornecedorId: string | null = data.fornecedor_id || null;
  if (fornecedorId) {
    const fornecedorValido = await prisma.fornecedor.findUnique({ where: { id: fornecedorId } });
    if (!fornecedorValido) {
      const porConta = await prisma.fornecedor.findFirst({ where: { userId: fornecedorId } });
      fornecedorId = porConta?.id || null;
    }
  }
  const itensFactura: any[] = Array.isArray(data.itens) ? data.itens : [];
  const itens = itensFactura.length > 0
    ? itensFactura
    : [{ descricao: factura.descricao || 'Fornecimento conforme factura', quantidade: 1, preco_unitario: factura.valor || 0, iva: 0, total: factura.valor || 0 }];

  // Sequência própria (prefixo AD) - este documento é a "Autorização de
  // Despesas", não uma Ordem de Compra real do Procurement.
  const { SequenceService } = await import('./sequence.service');
  const sequencia = await SequenceService.next('despesaAutorizada');

  return prisma.$transaction(async (tx) => {
    const ordem = await tx.purchaseOrder.create({
      data: {
        numero: sequencia?.value || `AD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        fornecedorId,
        fornecedor: factura.fornecedor || data.fornecedor_nome || NOME_GENERICO,
        valor: factura.valor || data.total || 0,
        moeda: factura.moeda || 'AOA',
        status: 'emitida',
        itens: JSON.stringify(itens),
        anexos: factura.anexos || '[]',
        data: JSON.stringify({
          origem: 'factura',
          factura_id: factura.id,
          factura_numero: factura.numero,
          numero_fornecedor: data.numero_fornecedor,
          descricao: factura.descricao,
          condicoes_pagamento: data.condicoes_pagamento,
          observacoes: data.observacoes,
        }),
        createdById: user?.id || factura.createdById,
        createdByName: user?.name || factura.createdByName,
      },
    });
    await tx.factura.update({
      where: { id: factura.id },
      data: { purchaseOrderId: ordem.id, numeroOrdem: ordem.numero },
    });
    return ordem;
  });
}

/**
 * Dados completos para o documento (PDF) da Ordem de Compra: fornecedor com
 * contactos, pedido/factura de origem, itens com preco e IVA, totais e
 * condicoes - tanto para ordens do Procurement como para as emitidas a partir
 * de uma factura validada.
 */
export async function montarDocumentoOrdemCompra(ordem: any) {
  const ordemData = safeParse(ordem.data, {});
  const base = await montarFacturaDaOrdem(ordem, null);
  const d: any = base.data;

  // Ordem emitida a partir de uma factura: os itens ja tem preco/IVA proprios.
  let itens = d.itens;
  if (ordemData.origem === 'factura') {
    const itensOrdem: any[] = safeParse(ordem.itens, []);
    itens = itensOrdem.map((item: any, index: number) => {
      const quantidade = Number(item.quantidade ?? 1) || 0;
      const preco = Number(item.preco_unitario ?? 0) || 0;
      const subtotal = round2(quantidade * preco);
      // tipo_operacao vem do item da factura (produto/servico), só para
      // reporting. "aplica_retencao" vem directamente do item quando
      // presente (formulário novo); para itens gravados antes desta
      // feature, cai no antigo comportamento (servico implicava retenção).
      const tipoOperacao = classificarTipoOperacao(item.tipo_operacao || item.tipo);
      const aplicaRetencao = typeof item.aplica_retencao === 'boolean' ? item.aplica_retencao : tipoOperacao === 'servico';
      const fiscal = calcularFiscal(subtotal, Number(item.taxa_iva ?? item.iva), aplicaRetencao);
      return {
        id: item.id || `item-${index + 1}`,
        descricao: item.descricao || '',
        unidade: item.unidade,
        quantidade,
        preco_unitario: preco,
        tipo_operacao: tipoOperacao,
        aplica_retencao: aplicaRetencao,
        iva: fiscal.taxa_iva,
        taxa_iva: fiscal.taxa_iva,
        valor_iva: fiscal.valor_iva,
        taxa_retencao: fiscal.taxa_retencao,
        valor_retencao: fiscal.valor_retencao,
        subtotal,
        total: Number(item.total) || fiscal.valor_final,
      };
    });
  }
  const somatorioFiscal: LinhaFiscal = somarFiscal(itens.map((item: any) => ({
    valor_bruto: item.subtotal || 0,
    taxa_iva: item.taxa_iva || 0,
    valor_iva: item.valor_iva || 0,
    taxa_retencao: item.taxa_retencao || 0,
    valor_retencao: item.valor_retencao || 0,
    valor_final: item.total || 0,
  })));
  const subtotal = somatorioFiscal.valor_bruto;
  const ivaTotal = somatorioFiscal.valor_iva;
  const retencaoTotal = somatorioFiscal.valor_retencao;

  const factura = await prisma.factura.findFirst({ where: { purchaseOrderId: ordem.id } });

  return {
    id: ordem.id,
    numero: ordem.numero,
    status: ordem.status,
    origem: ordemData.origem === 'factura' ? 'factura' : 'procurement',
    data_emissao: ordem.createdAt?.toISOString?.() || ordem.createdAt,
    emitida_por_nome: ordem.createdByName,
    recebido_em: ordem.recebidoEm?.toISOString?.() || ordem.recebidoEm || null,
    recebido_por_nome: ordem.recebidoPorNome || null,
    moeda: ordem.moeda || 'AOA',

    fornecedor_nome: d.fornecedor_nome,
    fornecedor_nif: d.fornecedor_nif,
    fornecedor_email: d.fornecedor_email,
    fornecedor_telefone: d.fornecedor_telefone,
    fornecedor_morada: d.fornecedor_morada,
    banco_nome: d.banco_nome,
    banco_iban: d.banco_iban,

    pedido_numero: d.pedido_numero,
    titulo: d.titulo || ordemData.descricao,
    categoria: d.categoria,
    departamento_solicitante: d.departamento_solicitante,
    local_entrega: d.local_entrega,
    prazo_entrega: d.prazo_entrega_desejado,
    condicoes_pagamento: d.condicoes_pagamento || ordemData.condicoes_pagamento,
    observacoes: d.observacoes || ordemData.observacoes,

    factura_numero: factura?.numero || ordemData.factura_numero,
    numero_factura_fornecedor: ordemData.numero_fornecedor,

    // Assinaturas automáticas (DSG ao validar, PCA ao autorizar a despesa) -
    // ver assinarAutorizacaoDespesasAutomaticamente em module-routes-helper.
    assinaturas: Array.isArray(ordemData.assinaturas) ? ordemData.assinaturas : [],

    itens,
    subtotal: subtotal || ordem.valor,
    iva_total: ivaTotal,
    total: ordem.valor || round2(subtotal + ivaTotal),
    retencao_total: retencaoTotal,
    // Já somado por item (bruto menos IVA cativo e/ou retenção) - não
    // recalcular aqui para não desalinhar.
    valor_final: somatorioFiscal.valor_final,
  };
}
