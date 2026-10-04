/**
 * MAPA DE ACTIVIDADES (DSG)
 *
 * Constroi, a partir das facturas do sistema, o "Mapa de Actividades" no
 * formato exacto do modelo oficial da FADA (server/templates/
 * Mapa_de_Actividades_FADA.xlsx): folhas Resumo, Servicos Adquiridos, Bens
 * Adquiridos, Guia de Preenchimento e Listas. O .xlsx exportado e gerado
 * por cima do proprio modelo (mesmos estilos, formulas, listas pendentes e
 * textos), so com as linhas de dados (8 em diante) e a Identificacao
 * preenchidas.
 *
 * Fonte dos dados: cada item de cada factura (Gestao de Pagamento, incluindo
 * as geradas a partir das Ordens de Compra do Procurement) do periodo. Itens
 * de servico vao para "Servicos Adquiridos"; os restantes para "Bens
 * Adquiridos" (Bem, ou Imobilizado quando o item e do tipo "equipamento").
 *
 * Campos que o sistema nao regista (Codigo do artigo no Primavera, Bem vs
 * Imobilizado, Centro de Custo, Localizacao/Responsavel, Observacoes, etc.)
 * podem ser completados/corrigidos no ecra do Mapa - ficam gravados em
 * factura.data.mapa_actividades[<chave do item>] e passam a prevalecer sobre
 * o valor deduzido automaticamente.
 */

import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import prisma from '../config/database';

export const TEMPLATE_PATH = path.resolve(__dirname, '../../templates/Mapa_de_Actividades_FADA.xlsx');
// Logotipo oficial (o mesmo de client/src/assets/fada-logo.ts), 738x315 px.
export const LOGO_PATH = path.resolve(__dirname, '../../templates/fada-logo.jpg');
const LOGO_PROPORCAO = 738 / 315;

// Valores exactos da folha "Listas" do modelo (usados pelas listas pendentes).
export const CLASSIFICACAO_BEM = 'Bem';
export const CLASSIFICACAO_IMOBILIZADO = 'Imobilizado';
export const TIPO_DOC_VFAP = 'VFAP — Factura Provisória';
export const TIPO_DOC_VFA = 'VFA — Factura';
export const ESTADO_PENDENTE = 'Pendente';
export const ESTADO_APROVADO = 'Aprovado';

export const DIRECCAO_PADRAO = 'DSG — Direcção de Serviços Gerais';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Facturas que nunca entram no mapa (nao correspondem a uma aquisicao efectiva).
const ESTADOS_EXCLUIDOS = ['rejeitado', 'cancelado', 'rascunho'];
// "Aprovado pelo responsavel da DSG" = factura validada (Aprovado-DSG) ou
// qualquer estado posterior do ciclo de pagamento.
const ESTADOS_APROVADOS_DSG = ['validado', 'aprovado', 'submetido_ao_banco', 'pago'];

const PRIMEIRA_LINHA_DADOS = 8;
const ULTIMA_LINHA_MODELO = 57;

/** Campos que o utilizador pode completar/corrigir por item (gravados na factura). */
export const CAMPOS_EDITAVEIS = [
  // 'categoria' ('servico' | 'bem') move a linha entre as folhas Servicos/Bens.
  'categoria',
  'servico', 'local_prestado', 'objectivo',
  'classificacao', 'nome_bem', 'centro_custo', 'localizacao_responsavel',
  'codigo_artigo', 'fornecedor', 'numero_documento', 'tipo_documento', 'observacoes',
] as const;
export type CampoEditavel = typeof CAMPOS_EDITAVEIS[number];

interface LinhaBase {
  /** Identificacao da origem, para o ecra poder editar/abrir a factura. */
  factura_id: string;
  item_key: string;
  factura_status: string;
  editado: CampoEditavel[];
  /** Folha onde a linha aparece: 'servico' (Servicos Adquiridos) ou 'bem' (Bens Adquiridos). */
  categoria: 'servico' | 'bem';

  valor: number;
  quantidade_facturas: number;
  data_documento: string; // dd/mm/aaaa
  data_documento_iso: string; // YYYY-MM-DD (filtros/ordenacao)
  fornecedor: string;
  tipo_documento: string;
  numero_documento: string;
  codigo_artigo: string;
  estado_aprovacao: string;
  data_aprovacao: string;
  numero_np: string;
  data_pagamento: string;
  observacoes: string;
}

export interface LinhaServico extends LinhaBase {
  servico: string;
  local_prestado: string;
  objectivo: string;
}

export interface LinhaBem extends LinhaBase {
  classificacao: string; // Bem | Imobilizado
  nome_bem: string;
  quantidade: number;
  centro_custo: string;
  localizacao_responsavel: string;
}

export interface Identificacao {
  direccao: string;
  periodo: string;
  elaborado_por: string;
  data_elaboracao: string;
  aprovado_por: string;
}

export interface ResumoLinha {
  categoria: string;
  registos: number;
  quantidade_bens: number | null; // null = "—" (servicos)
  valor: number;
  quantidade_facturas: number;
}

/**
 * Filtros do Mapa (todos opcionais). Aplicados no servidor, para o ecra e o
 * .xlsx exportado mostrarem exactamente as mesmas linhas e totais.
 */
export interface FiltrosMapa {
  /** 'servicos' | 'bens' | 'imobilizados' (vazio = todas as categorias). */
  categoria?: string;
  fornecedor?: string;
  centro_custo?: string;
  /** 'Pendente' | 'Aprovado'. */
  estado_aprovacao?: string;
  /** 'VFA' | 'VFAP'. */
  tipo_documento?: string;
  /** 'pago' | 'por_pagar'. */
  pagamento?: string;
  /** Data do documento, YYYY-MM-DD (dentro do periodo). */
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  /** Texto livre: servico/bem, objectivo, fornecedor, n.º documento, codigo do artigo, observacoes. */
  pesquisa?: string;
}

const ROTULOS_FILTROS: Record<keyof FiltrosMapa, string> = {
  categoria: 'Categoria',
  fornecedor: 'Fornecedor',
  centro_custo: 'Centro de Custo',
  estado_aprovacao: 'Estado da aprovação',
  tipo_documento: 'Tipo de documento',
  pagamento: 'Pagamento',
  data_inicio: 'Data do documento desde',
  data_fim: 'Data do documento até',
  valor_min: 'Valor mínimo (Kz)',
  valor_max: 'Valor máximo (Kz)',
  pesquisa: 'Pesquisa',
};

const ROTULOS_VALORES: Record<string, string> = {
  servicos: 'Serviços adquiridos',
  bens: 'Bens adquiridos',
  imobilizados: 'Imobilizados adquiridos',
  pago: 'Pagos',
  por_pagar: 'Por pagar',
  VFA: TIPO_DOC_VFA,
  VFAP: TIPO_DOC_VFAP,
};

/** Le os filtros de um objecto de query string, ignorando valores vazios/invalidos. */
export function lerFiltros(query: Record<string, any>): FiltrosMapa {
  const filtros: FiltrosMapa = {};
  const str = (k: string, max = 200) => {
    const v = texto(query[k]).slice(0, max);
    return v || undefined;
  };
  const data = (k: string) => {
    const v = str(k, 10);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
  };
  const numero = (k: string) => {
    const v = str(k, 30);
    if (v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const categoria = str('categoria');
  if (categoria && ['servicos', 'bens', 'imobilizados'].includes(categoria)) filtros.categoria = categoria;
  const estado = str('estado_aprovacao');
  if (estado === ESTADO_PENDENTE || estado === ESTADO_APROVADO) filtros.estado_aprovacao = estado;
  const tipo = str('tipo_documento');
  if (tipo === 'VFA' || tipo === 'VFAP') filtros.tipo_documento = tipo;
  const pagamento = str('pagamento');
  if (pagamento === 'pago' || pagamento === 'por_pagar') filtros.pagamento = pagamento;
  filtros.fornecedor = str('fornecedor');
  filtros.centro_custo = str('centro_custo');
  filtros.pesquisa = str('pesquisa');
  filtros.data_inicio = data('data_inicio');
  filtros.data_fim = data('data_fim');
  filtros.valor_min = numero('valor_min');
  filtros.valor_max = numero('valor_max');
  for (const k of Object.keys(filtros) as (keyof FiltrosMapa)[]) {
    if (filtros[k] === undefined) delete filtros[k];
  }
  return filtros;
}

/** Descricao legivel dos filtros activos (ecra, auditoria e folha Resumo do .xlsx). */
export function descreverFiltros(filtros: FiltrosMapa): string[] {
  return (Object.keys(filtros) as (keyof FiltrosMapa)[])
    .filter((k) => filtros[k] !== undefined && filtros[k] !== '')
    .map((k) => {
      const v = filtros[k] as any;
      let valor = ROTULOS_VALORES[String(v)] || String(v);
      if (k === 'data_inicio' || k === 'data_fim') valor = formatarData(v);
      if (k === 'valor_min' || k === 'valor_max') valor = Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2 });
      return `${ROTULOS_FILTROS[k]}: ${valor}`;
    });
}

export interface MapaActividades {
  ano: number;
  /** 1-12, ou 0 para o ano inteiro. */
  mes: number;
  identificacao: Identificacao;
  servicos: LinhaServico[];
  bens: LinhaBem[];
  resumo: ResumoLinha[];
  total_geral: ResumoLinha;
  filtros: FiltrosMapa;
  filtros_descricao: string[];
  /** Valores existentes no periodo (antes dos filtros), para as listas do ecra. */
  opcoes: { fornecedores: string[]; centros_custo: string[] };
  /** N.º de linhas do periodo antes de aplicar os filtros. */
  total_sem_filtros: number;
}

function safeParse(value: any, fallback: any = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function num(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function texto(value: any): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

/** Converte "2026-09-15", ISO ou Date para "15/09/2026" (formato do modelo). */
export function formatarData(value: any): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const str = value instanceof Date ? value.toISOString() : String(value);
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Data do documento (YYYY-MM-DD) usada para decidir a que periodo a factura pertence. */
function dataDocumentoISO(factura: any, data: any): string {
  const raw = data.data_emissao || factura.dataEmissao || factura.createdAt;
  if (!raw) return '';
  const str = raw instanceof Date ? raw.toISOString() : String(raw);
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function descreverPeriodo(ano: number, mes: number) {
  return mes >= 1 && mes <= 12 ? `${MESES[mes - 1]} de ${ano}` : `Ano de ${ano}`;
}

/** Valor total do item em Kz: base (quantidade x preco) + IVA. */
function valorItem(item: any): number {
  const quantidade = num(item.quantidade) || (item.quantidade === 0 ? 0 : 1);
  const base = item.subtotal !== undefined && item.subtotal !== null
    ? num(item.subtotal)
    : quantidade * num(item.preco_unitario);
  const taxa = num(item.taxa_iva ?? item.iva);
  const iva = item.valor_iva !== undefined && item.valor_iva !== null ? num(item.valor_iva) : (base * taxa) / 100;
  const total = base + iva;
  return total || num(item.total);
}

// So usado quando nem o item nem a factura dizem se e servico ou produto
// (ex: facturas submetidas pelo portal externo sem tipo por item).
const PALAVRAS_SERVICO = /servi[cç]o|consultoria|manuten[cç][aã]o|suporte|assist[eê]ncia|forma[cç][aã]o|repara[cç][aã]o|limpeza|transporte|aluguer|honor[aá]rio|instala[cç][aã]o/i;

function eServico(item: any, tipoFactura: string): boolean {
  if (item?.tipo_operacao === 'servico' || item?.tipo === 'servico') return true;
  if (item?.tipo_operacao === 'produto' || (item?.tipo && item.tipo !== 'servico')) return false;
  if (tipoFactura === 'servico') return true;
  if (tipoFactura === 'mercadoria' || tipoFactura === 'produto') return false;
  return PALAVRAS_SERVICO.test(texto(item?.descricao));
}

function classificacaoPadrao(item: any): string {
  return item?.tipo === 'equipamento' || item?.classificacao === 'imobilizado'
    ? CLASSIFICACAO_IMOBILIZADO
    : CLASSIFICACAO_BEM;
}

function normalizarClassificacao(value: string) {
  return value.toLowerCase().startsWith('imob') ? CLASSIFICACAO_IMOBILIZADO : CLASSIFICACAO_BEM;
}

function normalizarTipoDocumento(value: string) {
  return value.toUpperCase().startsWith('VFAP') ? TIPO_DOC_VFAP : TIPO_DOC_VFA;
}

async function nomesDepartamentos(): Promise<Map<string, string>> {
  const deps = await prisma.department.findMany({ select: { slug: true, nome: true } });
  return new Map(deps.map((d) => [d.slug, d.nome]));
}

/** Facturas (nao apagadas, nao rejeitadas/canceladas) cuja data do documento cai no mes indicado. */
async function facturasDoPeriodo(ano: number, mes: number) {
  // mes = 0: ano inteiro.
  const prefixo = mes >= 1 && mes <= 12 ? `${ano}-${String(mes).padStart(2, '0')}` : `${ano}-`;
  const facturas = await prisma.factura.findMany({
    where: { deletedAt: null, status: { notIn: ESTADOS_EXCLUIDOS } },
    include: { createdBy: { select: { department: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return facturas
    .map((f) => ({ factura: f, data: safeParse(f.data, {}) }))
    .filter(({ factura, data }) => dataDocumentoISO(factura, data).startsWith(prefixo))
    .sort((a, b) => dataDocumentoISO(a.factura, a.data).localeCompare(dataDocumentoISO(b.factura, b.data)));
}

export async function construirMapa(params: {
  ano: number;
  mes: number;
  elaboradoPor?: string;
  aprovadoPor?: string;
  direccao?: string;
  filtros?: FiltrosMapa;
}): Promise<MapaActividades> {
  const { ano, mes } = params;
  const [registos, departamentos] = await Promise.all([facturasDoPeriodo(ano, mes), nomesDepartamentos()]);

  const servicos: LinhaServico[] = [];
  const bens: LinhaBem[] = [];

  for (const { factura, data } of registos) {
    const tipoFactura = texto(data.tipo);
    const overrides = (data.mapa_actividades && typeof data.mapa_actividades === 'object') ? data.mapa_actividades : {};
    const aprovadoDSG = ESTADOS_APROVADOS_DSG.includes(factura.status);

    const comum = {
      factura_id: factura.id,
      factura_status: factura.status,
      data_documento: formatarData(dataDocumentoISO(factura, data)),
      data_documento_iso: dataDocumentoISO(factura, data),
      fornecedor: texto(data.fornecedor_nome || factura.fornecedor || data.fornecedor),
      tipo_documento: data.tipo_documento === 'factura_proforma' ? TIPO_DOC_VFAP : TIPO_DOC_VFA,
      numero_documento: texto(factura.numero || data.numero || data.numero_fornecedor),
      codigo_artigo: '',
      estado_aprovacao: aprovadoDSG ? ESTADO_APROVADO : ESTADO_PENDENTE,
      // Aprovacao pela DSG = validacao da factura (Aprovado-DSG); facturas
      // antigas sem data de validacao usam a data de aprovacao final.
      data_aprovacao: aprovadoDSG ? formatarData(data.validado_at || data.aprovado_at) : '',
      numero_np: texto(factura.numeroOrdemPagamento),
      data_pagamento: formatarData(factura.paidAt || data.pago_at || data.data_pagamento),
      observacoes: texto(data.observacoes),
    };

    // Centro de custo = departamento que pediu a compra; na falta dele, o
    // departamento de quem registou a factura (nunca o de um fornecedor externo).
    const departamentoCriador = factura.createdBy && factura.createdBy.role !== 'externo'
      ? (departamentos.get(texto(factura.createdBy.department)) || texto(factura.createdBy.department))
      : '';
    const departamentoSolicitante = texto(data.departamento_solicitante) || departamentoCriador;
    const localizacaoResponsavel = [texto(data.local_entrega), texto(data.recebido_por_nome)].filter(Boolean).join(' / ');
    const objectivo = texto(data.titulo) || texto(factura.descricao) || texto(data.descricao);

    let itens: any[] = Array.isArray(data.itens) ? data.itens.filter(Boolean) : [];
    if (itens.length === 0) {
      // Factura sem itens estruturados: uma linha com o valor total.
      itens = [{
        descricao: texto(factura.descricao) || texto(data.descricao) || 'Factura',
        quantidade: 1,
        total: num(data.total ?? factura.valor),
        subtotal: num(data.total ?? factura.valor),
        tipo_operacao: tipoFactura === 'servico' ? 'servico' : (tipoFactura ? 'produto' : undefined),
      }];
    }

    // "Quantidade de facturas": a factura conta uma vez em cada folha onde
    // aparece (na primeira linha dela), para os totais baterem certo.
    let jaContouServico = false;
    let jaContouBem = false;

    itens.forEach((item, index) => {
      const itemKey = texto(item.id) || String(index);
      const ov: Record<string, any> = overrides[itemKey] || {};
      const editado = CAMPOS_EDITAVEIS.filter((c) => ov[c] !== undefined && ov[c] !== null && ov[c] !== '');
      const pick = (campo: CampoEditavel, padrao: string) => (editado.includes(campo) ? texto(ov[campo]) : padrao);

      const base = {
        ...comum,
        item_key: itemKey,
        editado,
        valor: Math.round(valorItem(item) * 100) / 100,
        fornecedor: pick('fornecedor', comum.fornecedor),
        tipo_documento: editado.includes('tipo_documento') ? normalizarTipoDocumento(texto(ov.tipo_documento)) : comum.tipo_documento,
        numero_documento: pick('numero_documento', comum.numero_documento),
        codigo_artigo: pick('codigo_artigo', texto(item.codigo_artigo || item.codigo)),
        observacoes: pick('observacoes', [comum.observacoes, texto(item.observacoes)].filter(Boolean).join(' - ')),
      };

      const categoria = editado.includes('categoria')
        ? (texto(ov.categoria).toLowerCase().startsWith('serv') ? 'servico' : 'bem')
        : (eServico(item, tipoFactura) ? 'servico' : 'bem');

      if (categoria === 'servico') {
        servicos.push({
          ...base,
          categoria,
          quantidade_facturas: jaContouServico ? 0 : 1,
          servico: pick('servico', texto(item.descricao) || objectivo),
          local_prestado: pick('local_prestado', texto(data.local_entrega)),
          objectivo: pick('objectivo', objectivo),
        });
        jaContouServico = true;
      } else {
        bens.push({
          ...base,
          categoria,
          quantidade_facturas: jaContouBem ? 0 : 1,
          classificacao: editado.includes('classificacao') ? normalizarClassificacao(texto(ov.classificacao)) : classificacaoPadrao(item),
          nome_bem: pick('nome_bem', texto(item.descricao) || objectivo),
          quantidade: num(item.quantidade) || 1,
          centro_custo: pick('centro_custo', departamentoSolicitante),
          localizacao_responsavel: pick('localizacao_responsavel', localizacaoResponsavel),
        });
        jaContouBem = true;
      }
    });
  }

  const opcoes = {
    fornecedores: Array.from(new Set([...servicos, ...bens].map((l) => l.fornecedor).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt')),
    centros_custo: Array.from(new Set(bens.map((l) => l.centro_custo).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt')),
  };
  const totalSemFiltros = servicos.length + bens.length;

  const filtros = params.filtros || {};
  const servicosFiltrados = servicos.filter((l) => passaFiltros(l, filtros));
  const bensFiltrados = bens.filter((l) => passaFiltros(l, filtros));
  // Depois de filtrar, a "Quantidade de facturas" volta a contar cada factura
  // uma vez por folha (na primeira linha que ficou), senao uma factura cuja
  // primeira linha foi filtrada deixava de contar.
  recontarFacturas(servicosFiltrados);
  recontarFacturas(bensFiltrados);

  const soma = <T>(linhas: T[], f: (l: T) => number) => linhas.reduce((acc, l) => acc + f(l), 0);
  const bensSo = bensFiltrados.filter((b) => b.classificacao === CLASSIFICACAO_BEM);
  const imobilizados = bensFiltrados.filter((b) => b.classificacao === CLASSIFICACAO_IMOBILIZADO);

  const resumo: ResumoLinha[] = [
    {
      categoria: 'Serviços adquiridos',
      registos: servicosFiltrados.length,
      quantidade_bens: null,
      valor: soma(servicosFiltrados, (l) => l.valor),
      quantidade_facturas: soma(servicosFiltrados, (l) => l.quantidade_facturas),
    },
    {
      categoria: 'Bens adquiridos',
      registos: bensSo.length,
      quantidade_bens: soma(bensSo, (l) => l.quantidade),
      valor: soma(bensSo, (l) => l.valor),
      quantidade_facturas: soma(bensSo, (l) => l.quantidade_facturas),
    },
    {
      categoria: 'Imobilizados adquiridos',
      registos: imobilizados.length,
      quantidade_bens: soma(imobilizados, (l) => l.quantidade),
      valor: soma(imobilizados, (l) => l.valor),
      quantidade_facturas: soma(imobilizados, (l) => l.quantidade_facturas),
    },
  ];
  const total_geral: ResumoLinha = {
    categoria: 'TOTAL GERAL',
    registos: soma(resumo, (r) => r.registos),
    quantidade_bens: soma(resumo, (r) => r.quantidade_bens || 0),
    valor: soma(resumo, (r) => r.valor),
    quantidade_facturas: soma(resumo, (r) => r.quantidade_facturas),
  };

  return {
    ano,
    mes,
    identificacao: {
      direccao: texto(params.direccao) || DIRECCAO_PADRAO,
      periodo: descreverPeriodo(ano, mes),
      elaborado_por: texto(params.elaboradoPor),
      data_elaboracao: formatarData(new Date()),
      aprovado_por: texto(params.aprovadoPor),
    },
    servicos: servicosFiltrados,
    bens: bensFiltrados,
    resumo,
    total_geral,
    filtros,
    filtros_descricao: descreverFiltros(filtros),
    opcoes,
    total_sem_filtros: totalSemFiltros,
  };
}

function contem(alvo: string, termo: string) {
  // Sem acentos e sem distinguir maiusculas ("servico" encontra "Serviço").
  const norm = (v: string) => v.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return norm(alvo).includes(norm(termo));
}

function passaFiltros(l: LinhaServico | LinhaBem, f: FiltrosMapa): boolean {
  const bem = l.categoria === 'bem' ? (l as LinhaBem) : null;
  if (f.categoria === 'servicos' && bem) return false;
  if (f.categoria === 'bens' && (!bem || bem.classificacao !== CLASSIFICACAO_BEM)) return false;
  if (f.categoria === 'imobilizados' && (!bem || bem.classificacao !== CLASSIFICACAO_IMOBILIZADO)) return false;
  if (f.fornecedor && !contem(l.fornecedor, f.fornecedor)) return false;
  // Centro de Custo so existe na folha de Bens: este filtro exclui os servicos.
  if (f.centro_custo && (!bem || !contem(bem.centro_custo, f.centro_custo))) return false;
  if (f.estado_aprovacao && l.estado_aprovacao !== f.estado_aprovacao) return false;
  if (f.tipo_documento === 'VFAP' && l.tipo_documento !== TIPO_DOC_VFAP) return false;
  if (f.tipo_documento === 'VFA' && l.tipo_documento !== TIPO_DOC_VFA) return false;
  if (f.pagamento === 'pago' && !l.data_pagamento) return false;
  if (f.pagamento === 'por_pagar' && l.data_pagamento) return false;
  if (f.data_inicio && (!l.data_documento_iso || l.data_documento_iso < f.data_inicio)) return false;
  if (f.data_fim && (!l.data_documento_iso || l.data_documento_iso > f.data_fim)) return false;
  if (f.valor_min !== undefined && l.valor < f.valor_min) return false;
  if (f.valor_max !== undefined && l.valor > f.valor_max) return false;
  if (f.pesquisa) {
    const campos = bem
      ? [bem.nome_bem, bem.centro_custo, bem.localizacao_responsavel]
      : [(l as LinhaServico).servico, (l as LinhaServico).objectivo, (l as LinhaServico).local_prestado];
    const alvo = [...campos, l.fornecedor, l.numero_documento, l.codigo_artigo, l.numero_np, l.observacoes].join(' ');
    if (!contem(alvo, f.pesquisa)) return false;
  }
  return true;
}

function recontarFacturas(linhas: (LinhaServico | LinhaBem)[]) {
  const vistas = new Set<string>();
  for (const l of linhas) {
    l.quantidade_facturas = vistas.has(l.factura_id) ? 0 : 1;
    vistas.add(l.factura_id);
  }
}

/** Grava (ou limpa, com valor vazio) os campos completados manualmente de um item. */
export async function guardarAjustesItem(facturaId: string, itemKey: string, campos: Partial<Record<CampoEditavel, string>>) {
  const factura = await prisma.factura.findUnique({ where: { id: facturaId } });
  if (!factura || factura.deletedAt) return null;
  const data = safeParse(factura.data, {});
  const mapa = (data.mapa_actividades && typeof data.mapa_actividades === 'object') ? { ...data.mapa_actividades } : {};
  const actual: Record<string, string> = { ...(mapa[itemKey] || {}) };
  for (const campo of CAMPOS_EDITAVEIS) {
    if (!(campo in campos)) continue;
    const valor = texto((campos as any)[campo]);
    if (valor) actual[campo] = valor.slice(0, 500);
    else delete actual[campo];
  }
  if (Object.keys(actual).length) mapa[itemKey] = actual;
  else delete mapa[itemKey];
  data.mapa_actividades = mapa;
  await prisma.factura.update({ where: { id: facturaId }, data: { data: JSON.stringify(data) } });
  return actual;
}

// ---------------------------------------------------------------------------
// Exportacao .xlsx (sobre o modelo oficial)
// ---------------------------------------------------------------------------

type Celula = string | number | null;

function copiarEstiloLinha(ws: ExcelJS.Worksheet, origem: number, destino: number, ultimaColuna: number) {
  const src = ws.getRow(origem);
  const dst = ws.getRow(destino);
  dst.height = src.height;
  for (let c = 1; c <= ultimaColuna; c += 1) {
    dst.getCell(c).style = JSON.parse(JSON.stringify(src.getCell(c).style || {}));
  }
}

/**
 * Preenche as linhas de dados de uma folha a partir da linha 8, mantendo a
 * formula de numeracao "N.º" do modelo e estendendo estilos/listas pendentes
 * se houver mais linhas do que as 50 formatadas no modelo.
 */
function preencherFolha(
  ws: ExcelJS.Worksheet,
  linhas: Celula[][],
  ultimaColuna: number,
  listas: Record<string, string>,
) {
  const ultimaLinha = Math.max(ULTIMA_LINHA_MODELO, PRIMEIRA_LINHA_DADOS + linhas.length - 1);

  // Linhas alem das formatadas no modelo: mesmo estilo e mesma formula "N.º".
  for (let r = ULTIMA_LINHA_MODELO + 1; r <= ultimaLinha; r += 1) {
    copiarEstiloLinha(ws, ULTIMA_LINHA_MODELO, r, ultimaColuna);
    ws.getCell(r, 1).value = { formula: `IF(B${r}="","",ROW()-7)` } as any;
  }

  linhas.forEach((valores, i) => {
    const r = PRIMEIRA_LINHA_DADOS + i;
    ws.getCell(r, 1).value = { formula: `IF(B${r}="","",ROW()-7)`, result: i + 1 } as any;
    valores.forEach((valor, j) => {
      ws.getCell(r, j + 2).value = valor === null || valor === '' ? null : valor;
    });
  });

  // Listas pendentes (Bem/Imobilizado, VFAP/VFA, Pendente/Aprovado): com
  // uma validacao por celula, o exceljs ordena os enderecos como texto
  // ("I10" antes de "I8") e grava intervalos sobrepostos (I8:I57 + I10:I57),
  // que o Excel manda "reparar". Grava-se um unico intervalo por coluna,
  // tal como no modelo (I8:I57), estendido se houver mais linhas.
  const model: Record<string, any> = {};
  for (const [coluna, intervalo] of Object.entries(listas)) {
    model[`${coluna}${PRIMEIRA_LINHA_DADOS}:${coluna}${ultimaLinha}`] = {
      type: 'list',
      allowBlank: true,
      formulae: [intervalo],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Valor inválido',
      error: 'Seleccione um valor da lista.',
    };
  }
  (ws as any).dataValidations.model = model;
}

function formulaComResultado(ws: ExcelJS.Worksheet, endereco: string, result: number | string) {
  const atual: any = ws.getCell(endereco).value;
  if (atual && typeof atual === 'object' && typeof atual.formula === 'string') {
    ws.getCell(endereco).value = { formula: atual.formula, result } as any;
  }
}

/**
 * Coloca o logotipo do FADA no canto superior esquerdo da linha de titulo de
 * cada folha (a linha 1 passa a ter a altura do logo; o titulo continua
 * centrado na mesma linha, por isso nao se sobrepoe).
 */
function inserirLogo(wb: ExcelJS.Workbook, folhas: { ws?: ExcelJS.Worksheet; col: number; altura: number }[]) {
  if (!fs.existsSync(LOGO_PATH)) return;
  const imageId = wb.addImage({ buffer: fs.readFileSync(LOGO_PATH) as any, extension: 'jpeg' });
  for (const { ws, col, altura } of folhas) {
    if (!ws) continue;
    const alturaPx = Math.round(altura * 4 / 3) - 4; // pontos -> pixels, com margem
    const linha = ws.getRow(1);
    if (!linha.height || linha.height < altura) linha.height = altura;
    ws.addImage(imageId, {
      tl: { col: col + 0.05, row: 0.06 } as any,
      ext: { width: Math.round(alturaPx * LOGO_PROPORCAO), height: alturaPx },
      editAs: 'oneCell',
    });
  }
}

export async function gerarXlsx(mapa: MapaActividades): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Modelo do Mapa de Actividades nao encontrado em ${TEMPLATE_PATH}`);
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE_PATH);

  const resumo = wb.getWorksheet('Resumo')!;
  const wsServicos = wb.getWorksheet('Serviços Adquiridos')!;
  const wsBens = wb.getWorksheet('Bens Adquiridos')!;

  // Identificacao (celulas amarelas do modelo).
  const id = mapa.identificacao;
  resumo.getCell('C5').value = id.direccao;
  resumo.getCell('C6').value = id.periodo;
  resumo.getCell('C7').value = id.elaborado_por || null;
  resumo.getCell('C8').value = id.data_elaboracao || null;
  resumo.getCell('C9').value = id.aprovado_por || null;

  // Filtros aplicados: registados no proprio documento (abaixo da nota do
  // modelo), para quem o receber saber que nao e o mapa completo do periodo.
  if (mapa.filtros_descricao.length > 0) {
    const nota = resumo.getCell('B21');
    nota.value = `Filtros aplicados: ${mapa.filtros_descricao.join('; ')}. Linhas incluídas: ${mapa.servicos.length + mapa.bens.length} de ${mapa.total_sem_filtros}.`;
    nota.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFC00000' } };
    nota.alignment = { wrapText: true, vertical: 'top' };
    resumo.mergeCells('B21:F22');
  }

  inserirLogo(wb, [
    { ws: resumo, col: 1, altura: 40 },
    { ws: wsServicos, col: 0, altura: 40 },
    { ws: wsBens, col: 0, altura: 40 },
    { ws: wb.getWorksheet('Guia de Preenchimento'), col: 0, altura: 40 },
  ]);

  // Serviços Adquiridos: colunas B..P (ordem exacta do modelo).
  preencherFolha(wsServicos, mapa.servicos.map((l) => [
    l.servico, l.local_prestado, l.objectivo, l.valor, l.quantidade_facturas,
    l.data_documento, l.fornecedor, l.tipo_documento, l.numero_documento, l.codigo_artigo,
    l.estado_aprovacao, l.data_aprovacao, l.numero_np, l.data_pagamento, l.observacoes,
  ]), 16, { I: 'Listas!$B$2:$B$3', L: 'Listas!$C$2:$C$3' });

  // Bens Adquiridos: colunas B..R (ordem exacta do modelo).
  preencherFolha(wsBens, mapa.bens.map((l) => [
    l.classificacao, l.nome_bem, l.quantidade, l.centro_custo, l.valor, l.quantidade_facturas,
    l.data_documento, l.fornecedor, l.tipo_documento, l.numero_documento, l.codigo_artigo,
    l.estado_aprovacao, l.data_aprovacao, l.numero_np, l.data_pagamento,
    l.localizacao_responsavel, l.observacoes,
  ]), 18, { B: 'Listas!$A$2:$A$3', J: 'Listas!$B$2:$B$3', M: 'Listas!$C$2:$C$3' });

  // As formulas do modelo vao ate a linha 1000; acima disso estende-se o intervalo.
  const fimServicos = PRIMEIRA_LINHA_DADOS + mapa.servicos.length - 1;
  const fimBens = PRIMEIRA_LINHA_DADOS + mapa.bens.length - 1;
  if (fimServicos > 1000 || fimBens > 1000) {
    const fim = Math.max(fimServicos, fimBens);
    for (const ws of [resumo, wsServicos, wsBens]) {
      ws.eachRow((row) => row.eachCell((cell) => {
        const v: any = cell.value;
        if (v && typeof v === 'object' && typeof v.formula === 'string' && v.formula.includes('1000')) {
          cell.value = { formula: v.formula.replace(/1000/g, String(fim)) } as any;
        }
      }));
    }
  }

  // Resultados em cache das formulas (para pre-visualizadores que nao
  // recalculam); o Excel recalcula tudo ao abrir (fullCalcOnLoad).
  const [rServ, rBem, rImob] = mapa.resumo;
  const t = mapa.total_geral;
  formulaComResultado(resumo, 'C13', rServ.registos);
  formulaComResultado(resumo, 'E13', rServ.valor);
  formulaComResultado(resumo, 'F13', rServ.quantidade_facturas);
  formulaComResultado(resumo, 'C14', rBem.registos);
  formulaComResultado(resumo, 'D14', rBem.quantidade_bens || 0);
  formulaComResultado(resumo, 'E14', rBem.valor);
  formulaComResultado(resumo, 'F14', rBem.quantidade_facturas);
  formulaComResultado(resumo, 'C15', rImob.registos);
  formulaComResultado(resumo, 'D15', rImob.quantidade_bens || 0);
  formulaComResultado(resumo, 'E15', rImob.valor);
  formulaComResultado(resumo, 'F15', rImob.quantidade_facturas);
  formulaComResultado(resumo, 'C16', t.registos);
  formulaComResultado(resumo, 'D16', t.quantidade_bens || 0);
  formulaComResultado(resumo, 'E16', t.valor);
  formulaComResultado(resumo, 'F16', t.quantidade_facturas);
  formulaComResultado(wsServicos, 'E4', rServ.valor);
  formulaComResultado(wsServicos, 'F4', rServ.quantidade_facturas);
  formulaComResultado(wsBens, 'D4', mapa.bens.reduce((a, b) => a + b.quantidade, 0));
  formulaComResultado(wsBens, 'F4', mapa.bens.reduce((a, b) => a + b.valor, 0));
  formulaComResultado(wsBens, 'G4', mapa.bens.reduce((a, b) => a + b.quantidade_facturas, 0));
  const subtitulo = `FADA — Fundo de Apoio ao Desenvolvimento Agrário   |   Direcção: ${id.direccao}   |   Período: ${id.periodo}`;
  formulaComResultado(wsServicos, 'A2', subtitulo);
  formulaComResultado(wsBens, 'A2', subtitulo);

  wb.calcProperties.fullCalcOnLoad = true;
  wb.creator = 'SIPAR-FADA';
  wb.modified = new Date();

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
