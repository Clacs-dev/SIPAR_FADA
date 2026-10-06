/**
 * Extraccao dos dados de uma factura a partir do PDF (ou imagem) - registo
 * automatico da Nova Factura. NUNCA cria a factura: devolve os campos para o
 * utilizador rever e registar.
 *
 * Dois motores com a mesma saida (ResultadoExtraccao):
 *   - regras: texto do PDF (unpdf) + regras para o formato das facturas
 *     angolanas certificadas (Primavera, PHC, Sage...). Nada sai do servidor.
 *   - ia: o documento e enviado a Claude API, que devolve JSON num esquema fixo.
 *     Serve tambem para PDFs digitalizados e fotografias (JPG/PNG).
 * O modo hibrido (rota) usa as regras e so recorre a IA quando faltam dados.
 */

import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';
import { extractText, getDocumentProxy } from 'unpdf';

export type Confianca = 'alta' | 'media' | 'baixa';
export type TipoDocumento = 'factura' | 'factura_proforma' | 'outro';

export interface ItemExtraido {
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  desconto_percentagem: number;
  iva: number; // taxa em %
  total: number; // valor da linha sem IVA (como impresso no documento)
}

export type TipoOriginal = 'factura' | 'factura_recibo' | 'factura_proforma' | 'nota_credito' | 'nota_debito' | 'nota_entrega' | 'recibo' | 'outro';

/** So estes sao registados como factura; os restantes servem de contexto. */
export const TIPOS_REGISTAVEIS: TipoOriginal[] = ['factura', 'factura_recibo', 'factura_proforma'];

export const NOME_TIPO: Record<TipoOriginal, string> = {
  factura: 'Factura', factura_recibo: 'Factura/Recibo', factura_proforma: 'Pró-forma', nota_credito: 'Nota de Crédito',
  nota_debito: 'Nota de Débito', nota_entrega: 'Nota de Entrega', recibo: 'Recibo', outro: 'Outro documento',
};

export interface ResultadoExtraccao {
  motor: 'regras' | 'ia';
  tipo_original: TipoOriginal;
  paginas: string; // ex: "2" ou "1-2"; vazio quando desconhecido
  campos: {
    fornecedor_nif: string;
    fornecedor_nome: string;
    cliente_nif: string;
    cliente_nome: string;
    numero_fornecedor: string;
    tipo_documento: TipoDocumento;
    tipo: '' | 'mercadoria' | 'servico' | 'ambos';
    data_emissao: string; // YYYY-MM-DD
    data_vencimento: string;
    moeda: 'AOA' | 'USD' | 'EUR';
    condicoes_pagamento: string;
    descricao: string;
  };
  itens: ItemExtraido[];
  totais: { subtotal: number; iva: number; total: number };
  banco: { banco_nome: string; banco_titular: string; banco_iban: string; banco_nib: string; banco_swift: string };
  confianca: Record<string, Confianca>;
  avisos: string[];
  completo: boolean; // tem o essencial e os totais batem
}

export const TAXAS_IVA_ACEITES = [0, 2, 5, 7, 14];

// ---------------------------------------------------------------- utilitarios

/** "65.000,00" | "65 000,00" | "65,000.00" | "65000" -> 65000 */
export function numeroPt(bruto: string | undefined | null): number {
  if (!bruto) return 0;
  let s = String(bruto).replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  if (s.includes(',') && s.includes('.')) {
    // o ultimo separador e o decimal
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ''); // "65.000" = milhares
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function tipoDocumentoDoSistema(tipo: TipoOriginal): TipoDocumento {
  if (tipo === 'factura' || tipo === 'factura_recibo') return 'factura';
  if (tipo === 'factura_proforma') return 'factura_proforma';
  return 'outro';
}

function dataIso(bruto: string): string {
  const m1 = bruto.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  const m2 = bruto.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  return '';
}

function moedaNormalizada(bruto: string): 'AOA' | 'USD' | 'EUR' {
  const s = (bruto || '').toUpperCase();
  if (/USD|US\$|D[OÓ]LAR/.test(s)) return 'USD';
  if (/EUR|€/.test(s)) return 'EUR';
  return 'AOA';
}

export function ibanAngola(bruto: string): string {
  const digitos = (bruto || '').toUpperCase().replace(/^AO/, '').replace(/\D/g, '');
  return digitos.length >= 23 ? `AO${digitos.slice(0, 23)}` : '';
}

function taxaIvaMaisProxima(taxa: number): number {
  return TAXAS_IVA_ACEITES.reduce((melhor, t) => (Math.abs(t - taxa) < Math.abs(melhor - taxa) ? t : melhor), 14);
}

function vazio(): ResultadoExtraccao {
  return {
    motor: 'regras',
    tipo_original: 'factura',
    paginas: '',
    campos: {
      fornecedor_nif: '', fornecedor_nome: '', cliente_nif: '', cliente_nome: '', numero_fornecedor: '',
      tipo_documento: 'factura', tipo: '', data_emissao: '', data_vencimento: '', moeda: 'AOA',
      condicoes_pagamento: '', descricao: '',
    },
    itens: [],
    totais: { subtotal: 0, iva: 0, total: 0 },
    banco: { banco_nome: '', banco_titular: '', banco_iban: '', banco_nib: '', banco_swift: '' },
    confianca: {},
    avisos: [],
    completo: false,
  };
}

// ------------------------------------------------------------ texto do PDF

export async function textoDoPdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join('\n') : text;
}

// ------------------------------------------------------------ motor de regras

const RE_NUMERO_DOC = /\b((?:FT|FR|FP|FA|PP|NC|ND|VD|FS|GR|GT|OR)[ .]?(?:[A-Z0-9]{1,6}[ .])?\d{2,4}\/\d{1,7})\b/;
const RE_VALOR = /\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d+,\d{2}/g;

export function extrairPorRegras(texto: string): ResultadoExtraccao {
  const r = vazio();
  r.motor = 'regras';
  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const c = r.campos;

  // Emitente vs cliente: o bloco do cliente comeca em "Exmo(s)" / "Cliente".
  const iCliente = linhas.findIndex((l) => /^(exmo|cliente\b|exm\.?)/i.test(l));
  const cabecalho = iCliente >= 0 ? linhas.slice(0, iCliente) : linhas.slice(0, 15);

  const reNif = /(?:contribuinte|NIF|N\.?\s*I\.?\s*F\.?)[^\d]{0,15}(\d{9}[A-Z]{2}\d{3}|\d{9,10})/i;
  const nifEmitente = cabecalho.map((l) => l.match(reNif)?.[1]).find(Boolean);
  if (nifEmitente) { c.fornecedor_nif = nifEmitente; r.confianca.fornecedor_nif = 'alta'; }

  const reEmpresa = /\b(LDA|L\.D\.A|LIMITADA|S\.?A\.?|SA|\(SU\)|SGPS|E\.P\.?|EP)\b\.?$/i;
  const nomeEmitente = cabecalho.find((l) => reEmpresa.test(l) && !/@|www\./i.test(l));
  if (nomeEmitente) { c.fornecedor_nome = nomeEmitente; r.confianca.fornecedor_nome = 'media'; }

  if (iCliente >= 0) {
    const nomeCliente = linhas.slice(iCliente + 1, iCliente + 4).find((l) => /[A-Z]{3}/.test(l));
    if (nomeCliente) c.cliente_nome = nomeCliente;
  }
  const iContribCliente = linhas.findIndex((l) => /V\/?\s*N\.?\s*º?\s*Contrib|NIF\s+do\s+cliente|Contribuinte\s+do\s+cliente/i.test(l));
  if (iContribCliente >= 0) {
    const nif = linhas.slice(iContribCliente, iContribCliente + 3).join(' ').match(/\b(\d{9}[A-Z]{2}\d{3}|\d{9,10})\b/);
    if (nif && nif[1] !== c.fornecedor_nif) c.cliente_nif = nif[1];
  }

  // Tipo e numero do documento.
  r.tipo_original = /nota\s+de\s+cr[eé]dito/i.test(texto) ? 'nota_credito'
    : /nota\s+de\s+d[eé]bito/i.test(texto) ? 'nota_debito'
    : /pr[oó][\s-]?forma/i.test(texto) ? 'factura_proforma'
    : /fa(c)?tura\s*[\/-]?\s*recibo/i.test(texto) ? 'factura_recibo'
    : /fa(c)?tura/i.test(texto) ? 'factura'
    : /nota\s+de\s+entrega|guia\s+de\s+remessa/i.test(texto) ? 'nota_entrega'
    : /recibo/i.test(texto) ? 'recibo' : 'outro';
  c.tipo_documento = tipoDocumentoDoSistema(r.tipo_original);
  let numero = texto.match(RE_NUMERO_DOC)?.[1];
  // "PP FP.2026/22": o primeiro codigo e a serie interna do programa, o numero e o resto.
  const resto = numero?.split(/\s+/).slice(1).join(' ');
  if (resto && new RegExp(`^${RE_NUMERO_DOC.source}$`).test(resto)) numero = resto;
  if (numero) { c.numero_fornecedor = numero.replace(/\s+/g, ' ').trim(); r.confianca.numero_fornecedor = 'alta'; }

  // Datas: a primeira e a emissao; a de vencimento vem junto de "Vencimento".
  const datas = Array.from(texto.matchAll(/\b(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})\b/g)).map((m) => dataIso(m[1])).filter(Boolean);
  if (datas.length) { c.data_emissao = datas[0]; r.confianca.data_emissao = 'media'; }
  const iVenc = linhas.findIndex((l) => /vencimento|data\s+limite|v[aá]lid[oa]\s+at[eé]/i.test(l));
  const vencNaLinha = iVenc >= 0 ? linhas.slice(iVenc, iVenc + 4).join(' ').match(/(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})/) : null;
  const vencimento = vencNaLinha ? dataIso(vencNaLinha[1]) : datas.find((d) => d >= c.data_emissao && d !== c.data_emissao) || '';
  if (vencimento) { c.data_vencimento = vencimento >= c.data_emissao ? vencimento : c.data_emissao; r.confianca.data_vencimento = 'media'; }
  else if (c.data_emissao) { c.data_vencimento = c.data_emissao; r.confianca.data_vencimento = 'baixa'; }

  const moeda = texto.match(/\b(AKZ|AOA|KZ|USD|EUR)\b/i)?.[1];
  c.moeda = moedaNormalizada(moeda || 'AOA');
  r.confianca.moeda = moeda ? 'alta' : 'baixa';

  const cond = texto.match(/(pronto\s+pagamento|a\s+pronto|\d+\s*dias(?:\s+(?:da\s+data|ap[oó]s)[^\n]{0,25})?)/i)?.[1];
  if (cond) c.condicoes_pagamento = cond.trim();

  // Itens - formato Primavera/PHC: Descricao Qtd Un PrecoUnit Desc% IVA% Valor
  const reItemCompleto = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z]{1,5})\s+(\d[\d.\s]*,\d{2})\s+(\d+,\d{2})\s+(\d+,\d{2})\s+(\d[\d.\s]*,\d{2})(?:\s*\(\d+\))?$/;
  // Descricao Qtd PrecoUnit [IVA%] Total
  const reItemSimples = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s+(\d[\d.\s]*,\d{2})\s+(?:(\d{1,2}(?:,\d{1,2})?)\s*%?\s+)?(\d[\d.\s]*,\d{2})$/;
  for (const linha of linhas) {
    if (/total|subtotal|incid[eê]ncia|resumo|desconto|adiantamento|portes|acerto|iva\s*\(|taxa/i.test(linha)) continue;
    let m = linha.match(reItemCompleto);
    if (m) {
      r.itens.push({
        descricao: m[1].trim(),
        quantidade: numeroPt(m[2]),
        preco_unitario: numeroPt(m[4]),
        desconto_percentagem: numeroPt(m[5]),
        iva: numeroPt(m[6]),
        total: numeroPt(m[7]),
      });
      continue;
    }
    m = linha.match(reItemSimples);
    if (m && !/^\d/.test(m[1]) && m[1].length >= 3) {
      const qtd = numeroPt(m[2]);
      const preco = numeroPt(m[3]);
      const total = numeroPt(m[5]);
      if (qtd > 0 && preco > 0 && Math.abs(qtd * preco - total) <= Math.max(1, total * 0.2)) {
        r.itens.push({ descricao: m[1].trim(), quantidade: qtd, preco_unitario: preco, desconto_percentagem: 0, iva: m[4] ? numeroPt(m[4]) : 14, total });
      }
    }
  }
  if (r.itens.length) r.confianca.itens = 'media';

  // Totais.
  const valorDaLinha = (re: RegExp): number | null => {
    for (const linha of linhas) {
      if (!re.test(linha)) continue;
      const valores = linha.match(RE_VALOR);
      if (valores?.length) return numeroPt(valores[valores.length - 1]);
    }
    return null;
  };
  const total = valorDaLinha(/total\s*(\(\s*(akz|aoa|kz|usd|eur)\s*\)|a\s+pagar|documento|geral|l[ií]quido)/i) ?? valorDaLinha(/^total\b/i);
  const ivaTotal = valorDaLinha(/^(total\s+)?iva\b(?!\s*\()/i);
  const incidencia = valorDaLinha(/^(mercadoria\/servi[cç]os|total\s+il[ií]quido|subtotal|incid[eê]ncia|valor\s+sem\s+iva)/i)
    ?? valorDaLinha(/(mercadoria\/servi[cç]os|total\s+il[ií]quido|subtotal)/i);
  r.totais.total = total ?? 0;
  r.totais.iva = ivaTotal ?? 0;
  r.totais.subtotal = incidencia ?? (total !== null && ivaTotal !== null ? r2(total - ivaTotal) : 0);
  if (total !== null) r.confianca.total = 'alta';

  // Sem linhas reconheciveis: uma linha unica com o valor do documento.
  if (!r.itens.length && r.totais.subtotal > 0) {
    const taxa = r.totais.subtotal > 0 ? (r.totais.iva / r.totais.subtotal) * 100 : 0;
    r.itens.push({
      descricao: c.numero_fornecedor ? `Conforme documento ${c.numero_fornecedor}` : 'Conforme documento',
      quantidade: 1, preco_unitario: r.totais.subtotal, desconto_percentagem: 0, iva: taxaIvaMaisProxima(taxa), total: r.totais.subtotal,
    });
    r.confianca.itens = 'baixa';
    r.avisos.push('Não foi possível ler as linhas da factura: foi criada uma linha única com o valor total. Confirme os itens.');
  }

  // Tipo (mercadoria/servico): "Mercadoria/Serviços" e o quadro generico do
  // Primavera - so se decide quando o documento o diz claramente.
  if (/presta[cç][aã]o\s+de\s+servi[cç]os|servi[cç]os?\s+prestados|honor[aá]rios|avença/i.test(r.itens.map((i) => i.descricao).join(' '))) c.tipo = 'servico';

  // Dados bancarios do emitente.
  const iban = texto.match(/IBAN\s*[:;]?\s*(AO[\d .]{23,40})/i)?.[1] || texto.match(/\b(AO\s?06[\d .]{21,36})/)?.[1];
  if (iban) { r.banco.banco_iban = ibanAngola(iban); r.confianca.banco_iban = r.banco.banco_iban ? 'alta' : 'baixa'; }
  const nib = texto.match(/NIB\s*[:;]?\s*([\d .]{21,30})/i)?.[1]
    // "BAI: 0040.0000.0274.1936.1016.8" - 21 digitos com separadores, sem a palavra NIB
    || (!iban ? texto.match(/(\d{4}[ .]\d{4}[ .]\d{4}[ .]\d{4}[ .]\d{4}[ .]\d)/)?.[1] : undefined);
  if (nib && nib.replace(/\D/g, '').length >= 21) r.banco.banco_nib = nib.replace(/\D/g, '').slice(0, 21);
  const banco = texto.match(/Banco\s*[:;]\s*([A-Za-zÀ-ú][A-Za-zÀ-ú .&-]{1,40}?)(?:\s{2,}|\s*$|\s+Conta|\s+IBAN|\n)/im)?.[1];
  if (banco) r.banco.banco_nome = banco.trim();
  const swift = texto.match(/SWIFT(?:\/BIC)?\s*[:;]?\s*([A-Z]{6}[A-Z0-9]{2,5})/i)?.[1];
  if (swift) r.banco.banco_swift = swift.toUpperCase();
  const titular = texto.match(/Coordenadas\s+Banc[aá]rias\s*[:;]?\s*([^\n]{3,60})/i)?.[1];
  if (titular && !/banco|iban|conta/i.test(titular)) r.banco.banco_titular = titular.trim();

  c.descricao = r.itens[0]?.descricao && !/^Conforme documento/.test(r.itens[0].descricao)
    ? r.itens.map((i) => i.descricao).slice(0, 3).join('; ')
    : `${c.tipo_documento === 'factura_proforma' ? 'Pró-forma' : 'Factura'} ${c.numero_fornecedor}`.trim();

  return validarResultado(r);
}

// ---------------------------------------------------------------- validacao

/** Confere os totais e decide se o resultado esta completo. Usado pelos dois motores. */
export function validarResultado(r: ResultadoExtraccao): ResultadoExtraccao {
  const avisos = new Set(r.avisos);
  r.itens = r.itens
    .filter((i) => i && i.descricao && i.quantidade > 0)
    .map((i) => {
      const taxa = TAXAS_IVA_ACEITES.includes(i.iva) ? i.iva : taxaIvaMaisProxima(i.iva);
      if (taxa !== i.iva) avisos.add(`Taxa de IVA ${i.iva}% em "${i.descricao}" não é uma taxa angolana válida; foi usada ${taxa}%.`);
      // O sistema regista o preco ja com o desconto da linha aplicado.
      const desconto = Math.min(Math.max(i.desconto_percentagem || 0, 0), 100);
      const preco = desconto > 0 ? r2(i.preco_unitario * (1 - desconto / 100)) : i.preco_unitario;
      return { ...i, iva: taxa, preco_unitario: preco, desconto_percentagem: desconto };
    });

  const somaLinhas = r2(r.itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0));
  const ivaLinhas = r2(r.itens.reduce((s, i) => s + i.quantidade * i.preco_unitario * (i.iva / 100), 0));
  if (r.totais.subtotal > 0 && Math.abs(somaLinhas - r.totais.subtotal) > 1) {
    avisos.add(`A soma dos itens (${somaLinhas.toFixed(2)}) difere do valor sem IVA do documento (${r.totais.subtotal.toFixed(2)}). Confirme os itens.`);
    r.confianca.itens = 'baixa';
  }
  if (r.totais.total > 0 && Math.abs(r2(somaLinhas + ivaLinhas) - r.totais.total) > 1) {
    avisos.add(`O total recalculado (${(somaLinhas + ivaLinhas).toFixed(2)}) difere do total do documento (${r.totais.total.toFixed(2)}).`);
    r.confianca.total = 'baixa';
  }
  if (!TIPOS_REGISTAVEIS.includes(r.tipo_original)) {
    avisos.add(`Este documento é uma ${NOME_TIPO[r.tipo_original]}, não uma factura - não deve ser registado como factura.`);
  }
  if (!r.campos.fornecedor_nif) avisos.add('NIF do fornecedor não encontrado no documento.');
  if (!r.campos.numero_fornecedor) avisos.add('Número da factura do fornecedor não encontrado.');
  if (!r.campos.data_emissao) avisos.add('Data de emissão não encontrada.');
  if (!r.campos.tipo) avisos.add('Indique se a factura é de mercadoria, serviço ou ambos.');
  if (r.banco.banco_iban && r.banco.banco_iban.length !== 25) {
    avisos.add('O IBAN lido não tem 25 caracteres - confirme-o.');
    r.confianca.banco_iban = 'baixa';
  }

  const totaisBatem = r.totais.total > 0 && Math.abs(r2(somaLinhas + ivaLinhas) - r.totais.total) <= 1;
  r.completo = !!(TIPOS_REGISTAVEIS.includes(r.tipo_original) && r.campos.fornecedor_nif && r.campos.numero_fornecedor && r.campos.data_emissao && r.itens.length && totaisBatem);
  r.avisos = Array.from(avisos);
  return r;
}

// ------------------------------------------------------------------ motor IA

const ESQUEMA_DOCUMENTO = {
  type: 'object',
  properties: {
    tipo: {
      type: 'string',
      enum: ['factura', 'factura_recibo', 'factura_proforma', 'nota_credito', 'nota_debito', 'nota_entrega', 'recibo', 'outro'],
      description: 'Tipo do documento, pelo titulo impresso (ex: "Factura/Recibo" = factura_recibo, "Nota de credito" = nota_credito).',
    },
    paginas: { type: 'string', description: 'Paginas do ficheiro onde esta este documento, ex: "2" ou "1-2".' },
    fornecedor_nif: { type: 'string', description: 'NIF do EMITENTE (quem vende/presta o servico). Vazio se nao existir.' },
    fornecedor_nome: { type: 'string', description: 'Nome do emitente, como no documento.' },
    cliente_nif: { type: 'string', description: 'NIF do cliente (destinatario).' },
    cliente_nome: { type: 'string' },
    numero_documento: { type: 'string', description: 'Numero do documento, ex: "FT 2026/123", "FR FR5026S21420N/7", "NC 2026/118".' },
    documento_referenciado: { type: 'string', description: 'Numero do documento que este referencia (ex: a factura anulada por uma nota de credito). Vazio se nenhum.' },
    natureza: { type: 'string', enum: ['mercadoria', 'servico', 'ambos', 'indefinido'], description: 'Se os itens sao bens, servicos ou ambos.' },
    data_emissao: { type: 'string', description: 'YYYY-MM-DD, vazio se nao existir.' },
    data_vencimento: { type: 'string', description: 'YYYY-MM-DD, vazio se nao existir.' },
    moeda: { type: 'string', enum: ['AOA', 'USD', 'EUR'], description: 'AKZ/Kz = AOA.' },
    condicoes_pagamento: { type: 'string' },
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          descricao: { type: 'string' },
          quantidade: { type: 'number' },
          preco_unitario: { type: 'number', description: 'Preco unitario sem IVA, antes do desconto.' },
          desconto_percentagem: { type: 'number' },
          taxa_iva: { type: 'number', description: 'Taxa de IVA da linha em % (0, 2, 5, 7 ou 14 em Angola).' },
          valor_linha: { type: 'number', description: 'Valor da linha como impresso.' },
        },
        required: ['descricao', 'quantidade', 'preco_unitario', 'desconto_percentagem', 'taxa_iva', 'valor_linha'],
      },
    },
    total_sem_iva: { type: 'number' },
    total_iva: { type: 'number' },
    total_documento: { type: 'number', description: 'Total final do documento (com IVA).' },
    banco_nome: { type: 'string' },
    banco_titular: { type: 'string' },
    iban: { type: 'string', description: 'IBAN completo (comeca por AO06), sem espacos nem pontos. Vazio se o documento so tiver NIB.' },
    nib: { type: 'string', description: 'NIB de 21 digitos, sem espacos nem pontos.' },
    swift: { type: 'string' },
    anulado: { type: 'boolean', description: 'true se o documento tiver carimbo/marca de anulacao.' },
    campos_incertos: { type: 'array', items: { type: 'string' }, description: 'Nomes dos campos lidos com pouca certeza.' },
  },
  required: [
    'tipo', 'paginas', 'fornecedor_nif', 'fornecedor_nome', 'cliente_nif', 'cliente_nome', 'numero_documento', 'documento_referenciado',
    'natureza', 'data_emissao', 'data_vencimento', 'moeda', 'condicoes_pagamento', 'itens', 'total_sem_iva', 'total_iva',
    'total_documento', 'banco_nome', 'banco_titular', 'iban', 'nib', 'swift', 'anulado', 'campos_incertos',
  ],
} as const;

const ESQUEMA_IA = {
  type: 'object',
  properties: {
    documentos: { type: 'array', items: ESQUEMA_DOCUMENTO, description: 'Um elemento por documento fiscal encontrado no ficheiro, pela ordem das paginas.' },
  },
  required: ['documentos'],
} as const;

const INSTRUCOES_IA = `Extrai os dados dos documentos fiscais angolanos deste ficheiro, para registo de contas a pagar.
O ficheiro pode ter VARIOS documentos (ex: factura, nota de credito, nota de entrega, recibo): devolve um elemento por documento.
O fornecedor e o EMITENTE do documento (quem cobra); o cliente e o destinatario.
Copia os valores exactamente como estao impressos; nao inventes dados: deixa vazio ("" ou 0) o que nao existir.
Numeros sem separadores de milhares (11400000.23). Datas em YYYY-MM-DD.
Em "campos_incertos" indica os campos lidos com pouca certeza (ex: digitalizacao com pouca qualidade).`;

function documentoIaParaResultado(d: any): ResultadoExtraccao {
  const r = vazio();
  r.motor = 'ia';
  const tipos: TipoOriginal[] = ['factura', 'factura_recibo', 'factura_proforma', 'nota_credito', 'nota_debito', 'nota_entrega', 'recibo', 'outro'];
  r.tipo_original = tipos.includes(d.tipo) ? d.tipo : 'outro';
  r.paginas = String(d.paginas || '');
  r.campos = {
    fornecedor_nif: String(d.fornecedor_nif || '').replace(/\s/g, ''),
    fornecedor_nome: d.fornecedor_nome || '',
    cliente_nif: String(d.cliente_nif || '').replace(/\s/g, ''),
    cliente_nome: d.cliente_nome || '',
    numero_fornecedor: d.numero_documento || '',
    tipo_documento: tipoDocumentoDoSistema(r.tipo_original),
    tipo: ['mercadoria', 'servico', 'ambos'].includes(d.natureza) ? d.natureza : '',
    data_emissao: dataIso(d.data_emissao || ''),
    data_vencimento: dataIso(d.data_vencimento || '') || dataIso(d.data_emissao || ''),
    moeda: moedaNormalizada(d.moeda),
    condicoes_pagamento: d.condicoes_pagamento || '',
    descricao: '',
  };
  r.itens = (Array.isArray(d.itens) ? d.itens : []).map((i: any) => ({
    descricao: String(i.descricao || '').trim(),
    quantidade: Number(i.quantidade) || 0,
    preco_unitario: Number(i.preco_unitario) || 0,
    desconto_percentagem: Number(i.desconto_percentagem) || 0,
    iva: Number(i.taxa_iva) || 0,
    total: Number(i.valor_linha) || 0,
  }));
  r.totais = { subtotal: Number(d.total_sem_iva) || 0, iva: Number(d.total_iva) || 0, total: Number(d.total_documento) || 0 };
  const nib = String(d.nib || '').replace(/\D/g, '');
  r.banco = {
    banco_nome: d.banco_nome || '',
    banco_titular: d.banco_titular || '',
    banco_iban: d.iban ? ibanAngola(d.iban) || String(d.iban).replace(/[\s.]/g, '').toUpperCase() : '',
    banco_nib: nib.length >= 21 ? nib.slice(0, 21) : '',
    banco_swift: (d.swift || '').toUpperCase(),
  };
  r.campos.descricao = r.itens.map((i) => i.descricao).filter(Boolean).slice(0, 3).join('; ');
  for (const campo of Object.keys(r.campos)) if ((r.campos as any)[campo]) r.confianca[campo] = 'alta';
  if (r.itens.length) r.confianca.itens = 'alta';
  if (r.totais.total) r.confianca.total = 'alta';
  if (r.banco.banco_iban) r.confianca.banco_iban = 'alta';
  for (const campo of Array.isArray(d.campos_incertos) ? d.campos_incertos : []) r.confianca[String(campo)] = 'baixa';
  if (d.anulado) r.avisos.push('O documento tem uma marca de ANULAÇÃO.');
  if (d.documento_referenciado) r.avisos.push(`Refere o documento ${d.documento_referenciado}.`);
  return validarResultado(r);
}

/** Um resultado por documento encontrado no ficheiro (pela ordem das paginas). */
export async function extrairPorIa(buffer: Buffer, mimetype: string): Promise<ResultadoExtraccao[]> {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) throw Object.assign(new Error('A extracção com IA não está configurada no servidor.'), { status: 503 });
  const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
  const base64 = buffer.toString('base64');
  const documento = mimetype === 'application/pdf'
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: (mimetype === 'image/png' ? 'image/png' : 'image/jpeg') as 'image/png' | 'image/jpeg', data: base64 } };

  const resposta = await client.messages.parse({
    model: (process.env.INVOICE_EXTRACTION_MODEL || 'claude-sonnet-5-5').trim(),
    max_tokens: 8192,
    messages: [{ role: 'user', content: [documento, { type: 'text', text: INSTRUCOES_IA }] }],
    output_config: { format: jsonSchemaOutputFormat(ESQUEMA_IA) },
  });
  const documentos: any[] = (resposta.parsed_output as any)?.documentos || [];
  if (!documentos.length) throw new Error('A IA não encontrou nenhum documento fiscal legível neste ficheiro.');
  return documentos.map(documentoIaParaResultado);
}

/** O documento a propor para registo: a primeira factura nao anulada, senao a primeira registavel. */
export function documentoPrincipal(resultados: ResultadoExtraccao[]): number {
  const anulado = (r: ResultadoExtraccao) => r.avisos.some((a) => a.includes('ANULAÇÃO'));
  const i = resultados.findIndex((r) => TIPOS_REGISTAVEIS.includes(r.tipo_original) && !anulado(r));
  if (i >= 0) return i;
  const j = resultados.findIndex((r) => TIPOS_REGISTAVEIS.includes(r.tipo_original));
  return j >= 0 ? j : 0;
}

// ------------------------------------------------------------ ficheiro

export type TipoFicheiro = 'application/pdf' | 'image/png' | 'image/jpeg';

/** Tipo real pelo conteudo (assinatura do ficheiro), nao pela extensao. */
export function tipoPeloConteudo(buffer: Buffer): TipoFicheiro | null {
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buffer[0] === 0x89 && buffer.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}

/** PDFs com JavaScript ou cifrados sao recusados. */
export function motivoPdfRecusado(buffer: Buffer): string | null {
  const s = buffer.toString('latin1');
  if (/\/(JavaScript|JS)\b/.test(s)) return 'O PDF contém JavaScript e foi recusado por segurança.';
  if (/\/Encrypt\b/.test(s)) return 'O PDF está protegido/cifrado - não é possível ler os dados. Use o modo Manual.';
  return null;
}
