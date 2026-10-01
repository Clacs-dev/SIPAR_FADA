/**
 * Serviço de Geração de PDF
 * Utiliza jsPDF para gerar relatórios em PDF
 */

import { jsPDF } from 'jspdf';
// jspdf-autotable v5 deixou de aplicar-se automaticamente ao prototype do
// jsPDF quando este e importado como modulo ES (so o faz se `window.jsPDF`
// existir, o que nunca acontece aqui) - por isso chama-se a funcao
// standalone `autoTable(doc, options)` em vez de `doc.autoTable(options)`.
// Essa funcao continua a gravar `doc.lastAutoTable` internamente.
import autoTable from 'jspdf-autotable';
import { FADA_LOGO_DATA_URI } from '../assets/fada-logo';
import { previewPdf } from '../components/ui/document-preview';
import { apiClient } from './api-client';

// Tipos para autoTable
interface AutoTableOptions {
  head?: any[][];
  body?: any[][];
  startY?: number;
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
  styles?: any;
  headStyles?: any;
  alternateRowStyles?: any;
  theme?: 'striped' | 'grid' | 'plain';
  [key: string]: any;
}

// Estender tipo jsPDF para incluir o resultado gravado por autoTable()
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface PDFHeader {
  title: string;
  subtitle?: string;
  logo?: string;
  organization?: string;
}

interface PDFFooter {
  text?: string;
  pageNumbers?: boolean;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Adiciona cabeçalho ao documento
   */
  addHeader(header: PDFHeader): void {
    // Logo (se fornecida) - respeita a proporção real do logótipo do FADA
    // (738x315px) em vez de o espremer num quadrado, e deteta JPEG/PNG a
    // partir do proprio data URI (o logotipo do FADA e um JPEG).
    if (header.logo) {
      try {
        const logoWidth = 34;
        const logoHeight = logoWidth * (315 / 738);
        const format = /^data:image\/png/i.test(header.logo) ? 'PNG' : 'JPEG';
        this.doc.addImage(header.logo, format, this.margin, 10, logoWidth, logoHeight);
      } catch (error) {
 console.warn('Erro ao adicionar logo:', error);
      }
    }

    // Organização
    if (header.organization) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100);
      this.doc.text(header.organization, this.pageWidth - this.margin, 15, { align: 'right' });
    }

    // Título
    this.doc.setFontSize(18);
    this.doc.setTextColor(0);
    const titleY = header.logo ? 34 : 20;
    this.doc.text(header.title, this.pageWidth / 2, titleY, { align: 'center' });

    // Subtítulo
    if (header.subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100);
      this.doc.text(header.subtitle, this.pageWidth / 2, titleY + 8, { align: 'center' });
    }

    // Linha separadora
    const lineY = header.subtitle ? titleY + 15 : titleY + 10;
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(200);
    this.doc.line(this.margin, lineY, this.pageWidth - this.margin, lineY);
  }

  /**
   * Adiciona rodapé com número de página
   */
  addFooter(footer: PDFFooter = { pageNumbers: true }): void {
    const totalPages = this.doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(9);
      this.doc.setTextColor(128);

      // Texto customizado
      if (footer.text) {
        this.doc.text(footer.text, this.margin, this.pageHeight - 10);
      }

      // Números de página
      if (footer.pageNumbers) {
        const pageText = `Página ${i} de ${totalPages}`;
        this.doc.text(pageText, this.pageWidth - this.margin, this.pageHeight - 10, { align: 'right' });
      }

      // Data de geração
      const dateText = `Gerado em: ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}`;
      this.doc.text(dateText, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
    }
  }

  /**
   * Adiciona texto simples
   */
  addText(text: string, x: number, y: number, options?: any): void {
    this.doc.text(text, x, y, options);
  }

  /**
   * Adiciona parágrafo com quebra automática
   */
  addParagraph(text: string, y: number, maxWidth?: number): number {
    const width = maxWidth || this.pageWidth - (this.margin * 2);
    const lines = this.doc.splitTextToSize(text, width);
    this.doc.text(lines, this.margin, y);
    return y + (lines.length * 6);
  }

  /**
   * Adiciona seção com título
   */
  addSection(title: string, y: number): number {
    this.doc.setFontSize(14);
    this.doc.setTextColor(0);
    this.doc.text(title, this.margin, y);
    return y + 8;
  }

  /**
   * Adiciona campo de informação
   */
  addInfoField(label: string, value: string, y: number): number {
    this.doc.setFontSize(10);
    this.doc.setTextColor(100);
    this.doc.text(label + ':', this.margin, y);
    
    this.doc.setTextColor(0);
    this.doc.text(value, this.margin + 50, y);
    
    return y + 6;
  }

  /**
   * Adiciona tabela
   */
  addTable(headers: string[], data: any[][], y?: number, options?: any): void {
    autoTable(this.doc, {
      head: [headers],
      body: data,
      startY: y || 70,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      ...options,
    });
  }

  /**
   * Adiciona nova página
   */
  addPage(): void {
    this.doc.addPage();
  }

  /**
   * Obtém posição Y atual (após última tabela)
   */
  getCurrentY(): number {
    return this.doc.lastAutoTable?.finalY || 70;
  }

  /**
   * Salva o PDF
   */
  // Mostra a pre-visualizacao; o download e feito a partir dela.
  save(filename: string): void {
    previewPdf(this.doc, filename);
  }

  /**
   * Retorna blob do PDF
   */
  getBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Abre PDF em nova aba
   */
  openInNewTab(): void {
    previewPdf(this.doc, 'documento.pdf');
  }
}

// =====================
// GERADORES ESPECÍFICOS
// =====================

/**
 * Gera PDF de Ofício
 */
export function gerarPDFOficio(oficio: any): void {
  const pdf = new PDFGenerator('portrait');

  // Cabeçalho
  pdf.addHeader({
    title: 'OFÍCIO',
    subtitle: oficio.numero,
    organization: oficio.departamento_origem || 'Governo Provincial',
    logo: FADA_LOGO_DATA_URI,
  });

  let y = 80;

  // Informações principais
  y = pdf.addSection('Informações do Ofício', y);
  y = pdf.addInfoField('Número', oficio.numero, y);
  y = pdf.addInfoField('Tipo', oficio.tipo === 'entrada' ? 'Entrada' : 'Saída', y);
  y = pdf.addInfoField('Assunto', oficio.assunto, y);
  y = pdf.addInfoField('Status', oficio.status.toUpperCase(), y);
  y = pdf.addInfoField('Prioridade', oficio.prioridade.toUpperCase(), y);
  
  if (oficio.tipo === 'entrada' && oficio.remetente) {
    y = pdf.addInfoField('Remetente', oficio.remetente, y);
  }
  if (oficio.tipo === 'saida' && oficio.destinatario) {
    y = pdf.addInfoField('Destinatário', oficio.destinatario, y);
  }
  if (oficio.prazo_resposta) {
    y = pdf.addInfoField('Prazo de Resposta', new Date(oficio.prazo_resposta).toLocaleDateString('pt-PT'), y);
  }

  y += 10;

  // Conteúdo
  y = pdf.addSection('Conteúdo', y);
  y = pdf.addParagraph(oficio.conteudo, y);

  y += 10;

  // Despachos
  if (oficio.despachos && oficio.despachos.length > 0) {
    y = pdf.addSection('Despachos', y);
    
    const despachoData = oficio.despachos.map((d: any) => [
      new Date(d.created_at).toLocaleDateString('pt-PT'),
      d.autor_nome,
      d.descricao,
    ]);

    pdf.addTable(
      ['Data', 'Autor', 'Despacho'],
      despachoData,
      y
    );
  }

  // Rodapé
  pdf.addFooter({
    text: 'Documento gerado automaticamente pelo Sistema de Gestão',
    pageNumbers: true,
  });

  // Salvar
  const filename = `Oficio_${oficio.numero.replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
  pdf.save(filename);
}

/**
 * Gera PDF de Factura
 */
export function gerarPDFFactura(factura: any): void {
  const pdf = new PDFGenerator('portrait');

  // Cabeçalho
  pdf.addHeader({
    title: 'FACTURA',
    subtitle: factura.numero,
    organization: factura.fornecedor,
    logo: FADA_LOGO_DATA_URI,
  });

  let y = 80;

  const moeda = factura.moeda || 'AOA';
  const fornecedorNome = typeof factura.fornecedor === 'object' && factura.fornecedor
    ? factura.fornecedor.nome
    : (factura.fornecedor || factura.fornecedor_nome || '-');
  // "total" (valor da factura, bruto+IVA) e "valor" (coluna real, usada
  // quando a factura nao tem itens estruturados) sao os campos reais do
  // objecto Factura - "valor_total"/"valor_unitario" nunca existiram nele.
  const valorTotal = factura.total ?? factura.valor ?? 0;
  const retencaoTotal = factura.retencao_total ?? 0;
  const ivaTotal = factura.iva_total ?? 0;
  // Bruto menos IVA cativo (retido na totalidade) e/ou retenção - nunca soma.
  const valorFinal = factura.valor_final ?? ((factura.subtotal ?? valorTotal) - ivaTotal - retencaoTotal);

  // Informações principais
  y = pdf.addSection('Dados da Factura', y);
  y = pdf.addInfoField('Número', factura.numero, y);
  y = pdf.addInfoField('Fornecedor', fornecedorNome, y);
  if (factura.banco_iban) y = pdf.addInfoField('IBAN', factura.banco_iban, y);
  if (factura.data_emissao) y = pdf.addInfoField('Data de Emissão', new Date(factura.data_emissao).toLocaleDateString('pt-PT'), y);
  if (factura.data_vencimento) y = pdf.addInfoField('Data de Vencimento', new Date(factura.data_vencimento).toLocaleDateString('pt-PT'), y);
  y = pdf.addInfoField('Valor Total', `${valorTotal.toLocaleString('pt-PT')} ${moeda}`, y);
  y = pdf.addInfoField('Status', String(factura.status || '').toUpperCase(), y);

  y += 10;

  // Itens
  if (factura.itens && factura.itens.length > 0) {
    y = pdf.addSection('Itens da Factura', y);

    const itensData = factura.itens.map((item: any) => [
      item.descricao,
      String(item.quantidade),
      `${(item.preco_unitario || 0).toLocaleString('pt-PT')} ${moeda}`,
      [
        (item.iva || 0) > 0 ? `IVA ${item.iva}%` : null,
        (item.valor_retencao || 0) > 0 ? `Retenção ${item.taxa_retencao || 6.5}%` : null,
      ].filter(Boolean).join(' + ') || '—',
      `${(item.total || 0).toLocaleString('pt-PT')} ${moeda}`,
    ]);

    pdf.addTable(
      ['Descrição', 'Quantidade', 'Valor Unitário', 'IVA/Retenção', 'Valor Total'],
      itensData,
      y
    );

    y = pdf.getCurrentY() + 10;
  }

  // Totais - Mapa de Impostos (Angola: IVA 14/7/5/2% produtos, Retenção 6,5% serviços)
  y = pdf.addSection('Resumo Financeiro', y);
  y = pdf.addInfoField('Valor Bruto', `${(factura.subtotal ?? valorTotal).toLocaleString('pt-PT')} ${moeda}`, y);
  y = pdf.addInfoField('Valor IVA (Cativo)', `-${ivaTotal.toLocaleString('pt-PT')} ${moeda}`, y);
  y = pdf.addInfoField('Valor Retenção na Fonte', `-${retencaoTotal.toLocaleString('pt-PT')} ${moeda}`, y);
  y = pdf.addInfoField('VALOR FINAL A PAGAR', `${valorFinal.toLocaleString('pt-PT')} ${moeda}`, y);

  // Rodapé
  pdf.addFooter({
    text: 'Documento gerado automaticamente pelo Sistema de Gestão Financeira',
    pageNumbers: true,
  });

  // Salvar
  const filename = `Factura_${factura.numero.replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
  pdf.save(filename);
}

/**
 * Converte a imagem apontada por uma URL (ex: /uploads/assinatura.png) para data URL base64,
 * necessário para embutir a imagem no PDF via jsPDF.addImage().
 */
export async function urlParaDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converte um valor numérico para a sua forma por extenso, em português.
 * Ex: 125340 -> "cento e vinte e cinco mil, trezentos e quarenta"
 */
function numeroPorExtenso(valor: number): string {
  const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const DEZ_A_DEZANOVE = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove'];
  const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function grupoPorExtenso(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const resto = n % 100;
    const partes: string[] = [];
    if (c > 0) partes.push(CENTENAS[c]);
    if (resto > 0) {
      if (resto < 10) partes.push(UNIDADES[resto]);
      else if (resto < 20) partes.push(DEZ_A_DEZANOVE[resto - 10]);
      else {
        const d = Math.floor(resto / 10);
        const u = resto % 10;
        partes.push(u > 0 ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
      }
    }
    return partes.join(' e ');
  }

  const inteiro = Math.floor(Math.abs(valor));
  if (inteiro === 0) return 'zero';

  const ESCALAS: [number, string, string][] = [
    [1000000000, 'mil milhões', 'mil milhões'],
    [1000000, 'milhão', 'milhões'],
    [1000, 'mil', 'mil'],
  ];

  let restante = inteiro;
  const segmentos: string[] = [];
  for (const [valorEscala, singular, plural] of ESCALAS) {
    const qtd = Math.floor(restante / valorEscala);
    if (qtd > 0) {
      if (valorEscala === 1000 && qtd === 1) {
        segmentos.push('mil');
      } else {
        segmentos.push(`${grupoPorExtenso(qtd)} ${qtd === 1 ? singular : plural}`);
      }
      restante %= valorEscala;
    }
  }
  if (restante > 0 || segmentos.length === 0) {
    segmentos.push(grupoPorExtenso(restante));
  }

  return segmentos.filter(Boolean).join(', ');
}

interface AssinaturaOrdemPagamento {
  papel: 'presidente' | 'administrador';
  nome: string;
  assinatura_url?: string;
}

interface OrdemPagamentoData {
  numero: string; // Nº da Ordem de Pagamento (ex: OP/N.º 1261/2026)
  // 'fornecedor' (default) = gerada automaticamente a partir de uma factura aprovada;
  // 'interna' = preenchida manualmente, sem factura associada (ver internal-payment-orders).
  tipo?: 'fornecedor' | 'interna';
  contaDebito?: string;
  numeroDespacho?: string;
  numeroFacturas?: string; // Ex: "FT FA 2026/1883 e N.º FT FA 2026/1899"
  descricao?: string;
  valor: number;
  moeda?: string;
  fornecedor: string; // Nome do beneficiario ("a favor de") - fornecedor externo ou destinatario interno
  bancoNome?: string;
  bancoIban?: string;
  bancoCidade?: string;
  bancoPais?: string;
  data?: string; // ISO
  assinaturas?: AssinaturaOrdemPagamento[];
}

const FADA_CONTACTOS = {
  morada: ['Rua dos Enganos - Kinaxixi', 'Edifício Zimbo Tower 2º e 3º Andar', 'Ingombota - Luanda'],
  telefone: '+244 222 706 699',
  email: 'correspondencia@fada.gov.ao',
  website: 'www.fada.gov.ao',
  nif: '5000336793',
};

/**
 * Gera o PDF da Ordem de Pagamento (documento oficial dirigido ao banco),
 * replicando o modelo oficial do FADA. Aceita imagens de assinatura (Presidente/Administrador)
 * já convertidas para data URL — quando ausentes, é deixado o espaço para assinatura manual.
 */
export function gerarPDFOrdemPagamento(op: OrdemPagamentoData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 22;
  const marginRight = pageWidth - 22;
  const textWidth = marginRight - marginLeft;

  // Logótipo oficial do FADA (centrado horizontalmente na página)
  try {
    const logoLargura = 58;
    const logoAltura = logoLargura * (315 / 738);
    const logoX = (pageWidth - logoLargura) / 2;
    doc.addImage(FADA_LOGO_DATA_URI, 'JPEG', logoX, 10, logoLargura, logoAltura);
  } catch (error) {
 console.warn('Não foi possível inserir o logótipo do FADA:', error);
  }

  // Bloco do destinatário (Ao / Banco / Cidade) alinhado à direita, como no ofício oficial.
  let y = 55;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Ao', marginRight, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(op.bancoNome ? `Banco ${op.bancoNome}` : (op.tipo === 'interna' ? 'Banco do Destinatário' : 'Banco do Fornecedor'), marginRight, y, { align: 'right' });
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const cidadeDestino = (op.bancoCidade || 'LUANDA').toUpperCase();
  doc.text(cidadeDestino, marginRight, y, { align: 'right' });
  doc.setLineWidth(0.3);
  const cidadeDestinoWidth = doc.getTextWidth(cidadeDestino);
  doc.line(marginRight - cidadeDestinoWidth, y + 1, marginRight, y + 1);
  y += 14;

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.text(`N/Ref.ª: ${op.numero}`, marginLeft, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.text('Assunto: ', marginLeft, y);
  doc.setFont('helvetica', 'bolditalic');
  doc.text(op.tipo === 'interna' ? 'Ordem de Pagamento Interna.' : 'Ordem de Pagamento a Fornecedor.', marginLeft + doc.getTextWidth('Assunto: '), y);
  y += 10;

  const valorExtenso = numeroPorExtenso(op.valor);
  const moeda = op.moeda || 'AOA';
  const valorFormatado = op.valor.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const paragrafo1 = `Por débito na nossa conta n.º ${op.contaDebito || '[conta a debitar]'} domiciliada no vosso Banco, queiram executar o pagamento do montante total de KZ ${valorFormatado} (${valorExtenso} kwanzas), referente a: ${op.descricao || '[descrição da despesa]'}, conforme Despacho N.º ${op.numeroDespacho || '[nº despacho]'}${op.numeroFacturas ? ` e Factura N.º ${op.numeroFacturas}` : ''}, a favor de ${op.fornecedor}, cujas coordenadas bancárias indicamos abaixo:`;
  const linhas1 = doc.splitTextToSize(paragrafo1, textWidth);
  doc.text(linhas1, marginLeft, y);
  y += linhas1.length * 5.5 + 4;

  const bullets = [
    `Banco: ${op.bancoNome || '—'};`,
    `IBAN: ${op.bancoIban || '—'};`,
    `Cidade/País: ${op.bancoCidade || '—'} / ${op.bancoPais || '—'}.`,
  ];
  for (const bullet of bullets) {
    doc.text('•', marginLeft + 2, y);
    doc.text(bullet, marginLeft + 8, y);
    y += 6;
  }
  y += 6;

  doc.setFont('helvetica', 'bold');
  const dataDoc = op.data ? new Date(op.data) : new Date();
  const fecho = `O Conselho de Administração do Fundo de Apoio ao Desenvolvimento Agrário, Luanda, ${dataDoc.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}.`;
  const linhasFecho = doc.splitTextToSize(fecho, textWidth);
  doc.text(linhasFecho, marginLeft, y);
  y += linhasFecho.length * 5.5 + 14;

  const assinaturas = op.assinaturas || [];
  const presidente = assinaturas.find((a) => a.papel === 'presidente');
  const administrador = assinaturas.find((a) => a.papel === 'administrador');

  const desenharAssinatura = (label: string, assinatura?: AssinaturaOrdemPagamento) => {
    const centerX = pageWidth / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(label, centerX, y, { align: 'center' });
    y += 14;
    if (assinatura?.assinatura_url) {
      try {
        doc.addImage(assinatura.assinatura_url, 'PNG', centerX - 30, y - 13, 60, 14);
      } catch (error) {
 console.warn('Não foi possível inserir a imagem de assinatura:', error);
        doc.line(centerX - 40, y, centerX + 40, y);
      }
    } else {
      doc.line(centerX - 40, y, centerX + 40, y);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(assinatura?.nome || '', centerX, y + 5, { align: 'center' });
    y += 16;
  };

  desenharAssinatura('Presidente', presidente);
  desenharAssinatura('Administrador', administrador);

  // Rodapé com dados de contacto do FADA
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.setFont('helvetica', 'normal');
  FADA_CONTACTOS.morada.forEach((linha, i) => doc.text(linha, marginLeft, footerY + i * 4));
  doc.text(`Telefone: ${FADA_CONTACTOS.telefone}`, pageWidth / 2 + 10, footerY);
  doc.text(`E-mail: ${FADA_CONTACTOS.email}`, pageWidth / 2 + 10, footerY + 4);
  doc.text(`Website: ${FADA_CONTACTOS.website}`, pageWidth / 2 + 10, footerY + 8);
  doc.text(`NIF: ${FADA_CONTACTOS.nif}`, marginLeft, footerY + 12);

  return doc;
}

export interface OrdemCompraDocumento {
  numero: string;
  status?: string;
  origem?: 'procurement' | 'factura';
  data_emissao?: string;
  emitida_por_nome?: string;
  recebido_em?: string | null;
  recebido_por_nome?: string | null;
  moeda?: string;
  fornecedor_nome?: string;
  fornecedor_nif?: string;
  fornecedor_email?: string;
  fornecedor_telefone?: string;
  fornecedor_morada?: string;
  banco_nome?: string;
  banco_iban?: string;
  pedido_numero?: string;
  titulo?: string;
  categoria?: string;
  departamento_solicitante?: string;
  local_entrega?: string;
  prazo_entrega?: string;
  condicoes_pagamento?: string;
  observacoes?: string;
  factura_numero?: string;
  numero_factura_fornecedor?: string;
  itens: Array<{ descricao: string; unidade?: string; quantidade: number; preco_unitario: number; tipo_operacao?: 'produto' | 'servico'; iva: number; taxa_retencao?: number; valor_retencao?: number; total: number }>;
  subtotal: number;
  iva_total: number;
  total: number;
  // Retenção na fonte de serviços (6,5%) e valor efectivamente a pagar.
  retencao_total?: number;
  valor_final?: number;
}

/**
 * Gera o PDF oficial da Ordem de Compra (mesmo cabecalho/rodape FADA da Ordem
 * de Pagamento): fornecedor, origem (pedido de compra ou factura), itens com
 * preco e IVA, totais com valor por extenso e espacos de assinatura.
 */
export function gerarPDFOrdemCompra(oc: OrdemCompraDocumento): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 18;
  const marginRight = pageWidth - 18;
  const moeda = oc.moeda || 'AOA';
  const fmt = (v: number) => `${(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moeda}`;
  const fmtData = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-PT') : '—');

  try {
    const logoLargura = 48;
    doc.addImage(FADA_LOGO_DATA_URI, 'JPEG', marginLeft, 10, logoLargura, logoLargura * (315 / 738));
  } catch (error) {
 console.warn('Não foi possível inserir o logótipo do FADA:', error);
  }

  // O mesmo documento serve dois fluxos com nomes diferentes: quando emitido
  // pelo Procurement (para um fornecedor externo) continua "Ordem de Compra";
  // quando gerado a partir de uma factura validada directamente em Gestão de
  // Pagamento (uso interno), passa a chamar-se "Liberação de Despesa_DSG".
  const tituloDocumento = oc.origem === 'factura' ? 'LIBERAÇÃO DE DESPESA_DSG' : 'ORDEM DE COMPRA';
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(tituloDocumento, marginRight, 18, { align: 'right' });
  doc.setFontSize(11);
  doc.text(`N.º ${oc.numero}`, marginRight, 25, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Data de emissão: ${fmtData(oc.data_emissao)}`, marginRight, 31, { align: 'right' });
  if (oc.recebido_em) doc.text(`Recebida em: ${fmtData(oc.recebido_em)}`, marginRight, 36, { align: 'right' });

  let y = 44;
  doc.setDrawColor(180, 180, 180);
  doc.line(marginLeft, y, marginRight, y);
  y += 6;

  // Fornecedor (esquerda) e origem/entrega (direita)
  const colunaDireita = pageWidth / 2 + 4;
  const bloco = (titulo: string, linhas: string[], x: number, yInicio: number, largura: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titulo, x, yInicio);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let yy = yInicio + 5;
    for (const linha of linhas.filter(Boolean)) {
      const partes = doc.splitTextToSize(linha, largura);
      doc.text(partes, x, yy);
      yy += partes.length * 4.5;
    }
    return yy;
  };
  const larguraColuna = pageWidth / 2 - marginLeft - 6;
  const yFornecedor = bloco('Fornecedor', [
    oc.fornecedor_nome || '—',
    oc.fornecedor_nif ? `NIF: ${oc.fornecedor_nif}` : '',
    oc.fornecedor_morada || '',
    oc.fornecedor_telefone ? `Tel: ${oc.fornecedor_telefone}` : '',
    oc.fornecedor_email ? `E-mail: ${oc.fornecedor_email}` : '',
    oc.banco_nome || oc.banco_iban ? `Banco: ${oc.banco_nome || '—'}${oc.banco_iban ? ` • IBAN: ${oc.banco_iban}` : ''}` : '',
  ], marginLeft, y, larguraColuna);
  const yOrigem = bloco(oc.origem === 'factura' ? 'Origem: Factura' : 'Origem: Pedido de Compra', [
    oc.origem === 'factura'
      ? `Factura: ${oc.factura_numero || '—'}${oc.numero_factura_fornecedor ? ` (fornecedor: ${oc.numero_factura_fornecedor})` : ''}`
      : `Pedido: ${oc.pedido_numero || '—'}`,
    oc.titulo ? `Assunto: ${oc.titulo}` : '',
    oc.departamento_solicitante ? `Departamento: ${oc.departamento_solicitante}` : '',
    oc.categoria ? `Categoria: ${oc.categoria}` : '',
    oc.local_entrega ? `Local de entrega: ${oc.local_entrega}` : '',
    oc.prazo_entrega ? `Prazo de entrega: ${fmtData(oc.prazo_entrega)}` : '',
    oc.origem !== 'factura' && oc.factura_numero ? `Factura gerada: ${oc.factura_numero}` : '',
  ], colunaDireita, y, marginRight - colunaDireita);
  y = Math.max(yFornecedor, yOrigem) + 4;

  autoTable(doc, {
    head: [['#', 'Descrição', 'Qtd', 'Unid.', 'Preço unit.', 'IVA/Retenção', 'Total']],
    body: (oc.itens || []).map((item, i) => [
      String(i + 1),
      item.descricao || '—',
      String(item.quantidade ?? ''),
      item.unidade || '—',
      fmt(item.preco_unitario),
      [
        (item.iva || 0) > 0 ? `IVA ${item.iva}%` : null,
        (item.valor_retencao || 0) > 0 ? `Ret. ${item.taxa_retencao || 6.5}%` : null,
      ].filter(Boolean).join(' + ') || '—',
      fmt(item.total),
    ]),
    startY: y,
    margin: { left: marginLeft, right: 18 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [33, 37, 41], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 8 },
      2: { halign: 'right', cellWidth: 12 },
      3: { cellWidth: 16 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 32 },
    },
  } as any);
  y = (doc.lastAutoTable?.finalY || y) + 6;

  const linhaTotal = (rotulo: string, valor: string, negrito = false) => {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setFontSize(negrito ? 11 : 9.5);
    doc.text(rotulo, marginRight - 60, y);
    doc.text(valor, marginRight, y, { align: 'right' });
    y += negrito ? 7 : 5.5;
  };
  linhaTotal('Valor Bruto:', fmt(oc.subtotal));
  if (oc.iva_total) linhaTotal('Valor IVA (Cativo):', `-${fmt(oc.iva_total)}`);
  if (oc.retencao_total) linhaTotal('Valor Retenção na Fonte:', `-${fmt(oc.retencao_total)}`);
  linhaTotal('Valor Final a Pagar:', fmt(oc.valor_final ?? oc.total), true);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const extenso = doc.splitTextToSize(`Valor por extenso: ${numeroPorExtenso(oc.valor_final ?? oc.total)} ${moeda === 'AOA' ? 'kwanzas' : moeda}.`, marginRight - marginLeft);
  doc.text(extenso, marginLeft, y);
  y += extenso.length * 4.5 + 4;

  for (const [rotulo, valor] of [['Condições de pagamento', oc.condicoes_pagamento], ['Observações', oc.observacoes]] as const) {
    if (!valor) continue;
    doc.setFont('helvetica', 'bold');
    doc.text(`${rotulo}:`, marginLeft, y);
    doc.setFont('helvetica', 'normal');
    const partes = doc.splitTextToSize(String(valor), marginRight - marginLeft);
    doc.text(partes, marginLeft, y + 4.5);
    y += partes.length * 4.5 + 7;
  }

  // Assinaturas: emitente e aprovacao
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 30;
  }
  y = Math.max(y + 10, pageHeight - 62);
  const larguraAssinatura = 62;
  const assinatura = (x: number, rotulo: string, nome?: string) => {
    doc.line(x, y, x + larguraAssinatura, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(rotulo, x + larguraAssinatura / 2, y + 5, { align: 'center' });
    if (nome) {
      doc.setFont('helvetica', 'bold');
      doc.text(nome, x + larguraAssinatura / 2, y + 10, { align: 'center' });
    }
  };
  assinatura(marginLeft, 'Emitido por (Compras)', oc.emitida_por_nome);
  assinatura(marginRight - larguraAssinatura, 'Aprovado por');

  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.setFont('helvetica', 'normal');
  FADA_CONTACTOS.morada.forEach((linha, i) => doc.text(linha, marginLeft, footerY + i * 4));
  doc.text(`Telefone: ${FADA_CONTACTOS.telefone}`, pageWidth / 2 + 10, footerY);
  doc.text(`E-mail: ${FADA_CONTACTOS.email}`, pageWidth / 2 + 10, footerY + 4);
  doc.text(`Website: ${FADA_CONTACTOS.website}`, pageWidth / 2 + 10, footerY + 8);
  doc.text(`NIF: ${FADA_CONTACTOS.nif}`, marginLeft, footerY + 12);

  return doc;
}

/**
 * Busca os dados da Ordem de Compra ao servidor e abre o PDF na
 * pre-visualizacao (de onde pode ser descarregado). Com facturaId, garante que
 * a factura validada tem a sua ordem (emitida no servidor se ainda nao existir).
 */
export async function visualizarOrdemCompra(alvo: { ordemId?: string; facturaId?: string }) {
  const response = alvo.ordemId
    ? await apiClient.get<{ ordem: OrdemCompraDocumento }>(`/procurement/ordens/${alvo.ordemId}/documento`)
    : await apiClient.post<{ ordem: OrdemCompraDocumento }>(`/facturas/${alvo.facturaId}/ordem-compra`, {});
  const doc = gerarPDFOrdemCompra(response.ordem);
  previewPdf(doc, `Ordem_Compra_${response.ordem.numero.replace(/[\/\s]/g, '-')}.pdf`);
  return response.ordem;
}

/**
 * Gera PDF de Viatura (Frota)
 */
export function gerarPDFViatura(viatura: any): void {
  const pdf = new PDFGenerator('portrait');

  // Cabeçalho
  pdf.addHeader({
    title: 'FICHA DE VIATURA',
    subtitle: `${viatura.marca} ${viatura.modelo} - ${viatura.matricula}`,
    organization: 'Gestão de Frotas',
    logo: FADA_LOGO_DATA_URI,
  });

  let y = 80;

  // Informações principais
  y = pdf.addSection('Dados da Viatura', y);
  y = pdf.addInfoField('Matrícula', viatura.matricula, y);
  y = pdf.addInfoField('Marca', viatura.marca, y);
  y = pdf.addInfoField('Modelo', viatura.modelo, y);
  y = pdf.addInfoField('Ano', viatura.ano.toString(), y);
  y = pdf.addInfoField('Tipo', viatura.tipo, y);
  y = pdf.addInfoField('Status', viatura.status.toUpperCase(), y);
  y = pdf.addInfoField('Departamento', viatura.departamento || 'N/A', y);
  y = pdf.addInfoField('Quilometragem', `${viatura.quilometragem.toLocaleString('pt-PT')} km`, y);

  y += 10;

  // Histórico de manutenções
  if (viatura.manutencoes && viatura.manutencoes.length > 0) {
    y = pdf.addSection('Histórico de Manutenções', y);
    
    const manutencoesData = viatura.manutencoes.map((m: any) => [
      new Date(m.data).toLocaleDateString('pt-PT'),
      m.tipo,
      m.descricao,
      `${m.custo?.toLocaleString('pt-PT') || 'N/A'} Kz`,
    ]);

    pdf.addTable(
      ['Data', 'Tipo', 'Descrição', 'Custo'],
      manutencoesData,
      y
    );

    y = pdf.getCurrentY() + 10;
  }

  // Histórico de abastecimentos
  if (viatura.abastecimentos && viatura.abastecimentos.length > 0) {
    y = pdf.addSection('Histórico de Abastecimentos', y);
    
    const abastecimentosData = viatura.abastecimentos.slice(0, 10).map((a: any) => [
      new Date(a.data).toLocaleDateString('pt-PT'),
      `${a.litros} L`,
      `${a.custo.toLocaleString('pt-PT')} Kz`,
      `${a.quilometragem.toLocaleString('pt-PT')} km`,
    ]);

    pdf.addTable(
      ['Data', 'Litros', 'Custo', 'Quilometragem'],
      abastecimentosData,
      y
    );
  }

  // Rodapé
  pdf.addFooter({
    text: 'Documento gerado automaticamente pelo Sistema de Gestão de Frotas',
    pageNumbers: true,
  });

  // Salvar
  const filename = `Viatura_${viatura.matricula.replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
  pdf.save(filename);
}

/**
 * Gera o PDF oficial de uma Acta como documento narrativo formal (texto
 * corrido, sem tabelas nem campos "rótulo: valor" à parte) - hora, local,
 * participantes e demais dados da reunião ficam escritos no próprio texto,
 * seguindo a estrutura de uma acta institucional real (título simples,
 * parágrafo de abertura, Ordem de Trabalhos, Discussões e Deliberações por
 * ponto, Recomendações, Encerramento, assinaturas e Lista de Presenças).
 * Por ser um layout bespoke (não um relatório com cabeçalho/tabela), usa
 * jsPDF diretamente em vez da classe PDFGenerator, tal como
 * gerarPDFOrdemPagamento. Inclui sempre a assinatura real (imagem carregada
 * em "Meu Perfil") quando existir.
 */
export function gerarPDFActa(acta: any): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const textWidth = pageWidth - marginLeft * 2;
  const bottomLimit = pageHeight - 20;

  let y = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = 20;
    }
  };

  const paragraph = (text: string, options: { size?: number; indent?: number; gapAfter?: number } = {}) => {
    if (!text) return;
    const indent = options.indent || 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(options.size || 11);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, textWidth - indent);
    checkPageBreak(lines.length * 5.5 + 4);
    doc.text(lines, marginLeft + indent, y);
    y += lines.length * 5.5 + (options.gapAfter ?? 6);
  };

  const heading = (text: string) => {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text(text, marginLeft, y);
    y += 9;
  };

  const subheading = (text: string) => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(text, marginLeft + 4, y);
    y += 7;
  };

  // --- Formatação em português ---
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const ORDINAIS = ['Zero', 'Um', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez', 'Onze', 'Doze', 'Treze', 'Catorze', 'Quinze', 'Dezasseis', 'Dezassete', 'Dezoito', 'Dezanove', 'Vinte'];
  const ordinalPonto = (n: number) => ORDINAIS[n] || String(n);
  // "dois mil, vinte e seis" (formato monetário de numeroPorExtenso) -> "dois mil e vinte e seis" (formato de ano)
  const anoPorExtenso = (ano: number) => numeroPorExtenso(ano).replace(/, ([^,]*)$/, ' e $1');
  const listaComE = (nomes: string[]) => {
    const validos = nomes.filter(Boolean);
    if (validos.length === 0) return '';
    if (validos.length === 1) return validos[0];
    return `${validos.slice(0, -1).join(', ')} e ${validos[validos.length - 1]}`;
  };
  // Mesmos rótulos do campo "Órgão" em internal-meeting-form.tsx, para o texto
  // da acta bater com o nome usado no resto do sistema.
  const ORGAO_LABELS: Record<string, string> = {
    conselho_administracao: 'Conselho de Administração',
    direcao: 'Direcção', gabinete_pca: 'Gabinete do PCA', gabinete_pce: 'Gabinete do PCE',
    gabinete_administrador: 'Gabinete do Administrador', gabinete_director: 'Gabinete do Director',
    gestao: 'Gestão', compras: 'Compras', financeiro: 'Financeiro', recursos_humanos: 'Recursos Humanos',
    ti: 'Tecnologias de Informação', comercial: 'Comercial', marketing: 'Marketing', juridico: 'Jurídico',
    operacoes: 'Operações', logistica: 'Logística',
  };
  const orgaoLabel = (valor?: string) => (valor ? (ORGAO_LABELS[valor] || valor) : 'Conselho de Administração');
  const tipoReuniaoLabel = acta.tipo_reuniao === 'extraordinaria' ? 'extraordinária' : 'ordinária';

  const participantes: any[] = Array.isArray(acta.participantes) ? acta.participantes : [];
  // O presidente e o secretario ja sao nomeados a parte na abertura, por isso
  // nao entram de novo na lista "contando com a presenca de".
  const outrosParticipantes = participantes.filter((p) => p?.nome && p.nome !== acta.presidente && p.nome !== acta.secretario);

  // === Logótipo (canto superior direito, não interfere no fluxo do texto) ===
  try {
    const logoWidth = 30;
    const logoHeight = logoWidth * (315 / 738);
    doc.addImage(FADA_LOGO_DATA_URI, 'JPEG', pageWidth - marginLeft - logoWidth, 12, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Não foi possível inserir o logótipo do FADA:', error);
  }

  // === Título ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(acta.numero || 'ACTA', marginLeft, y);
  y += 14;

  // === Parágrafo de abertura ===
  const dataReuniao = acta.data_reuniao ? new Date(`${acta.data_reuniao}T00:00:00`) : null;
  const numeroReuniao = String(parseInt(acta.numero_reuniao, 10) || 1).padStart(3, '0');
  const participantesTexto = listaComE(
    outrosParticipantes.map((p) => `${p.nome}${p.role || p.cargo ? ` (${p.role || p.cargo})` : ''}`)
  );

  const abertura = [
    dataReuniao ? `Aos ${dataReuniao.getDate()} dias do mês de ${MESES[dataReuniao.getMonth()]} do ano de ${anoPorExtenso(dataReuniao.getFullYear())},` : '',
    acta.hora_inicio ? `pelas ${acta.hora_inicio},` : '',
    acta.entidade ? `nas instalações de ${acta.entidade},` : '',
    acta.cidade ? `sitas em ${acta.cidade},` : '',
    `realizou-se a ${numeroReuniao}ª reunião ${tipoReuniaoLabel} de ${orgaoLabel(acta.orgao)}, devidamente convocada nos termos legais e estatutários aplicáveis,`,
    acta.presidente ? `sob a presidência de ${acta.presidente},` : '',
    participantesTexto ? `contando com a presença de ${participantesTexto},` : '',
    'conforme lista de presenças,',
    acta.secretario ? `tendo sido designado(a) ${acta.secretario} para secretariar os trabalhos.` : '',
  ].filter(Boolean).join(' ');

  paragraph(abertura);
  paragraph('Verificada a existência de quórum legal, o Senhor(a) Presidente declarou aberta a sessão.');

  const pontos: any[] = Array.isArray(acta.pontos_agenda)
    ? [...acta.pontos_agenda].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    : [];

  // === Ordem de Trabalhos ===
  if (pontos.length > 0) {
    heading('Ordem de Trabalhos');
    paragraph('A reunião decorreu de acordo com a seguinte agenda:', { gapAfter: 3 });
    pontos.forEach((ponto) => {
      checkPageBreak(7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(ponto.titulo || '', marginLeft + 6, y);
      y += 6.5;
    });
    y += 4;
  }

  // === Discussões ===
  if (pontos.length > 0) {
    heading('Discussões');
    pontos.forEach((ponto, index) => {
      const ordinal = ordinalPonto(ponto.ordem || index + 1);
      subheading(`PONTO ${ordinal.toUpperCase()}`);
      paragraph(ponto.titulo || '', { size: 10, gapAfter: 3 });

      const intervencoes: any[] = Array.isArray(ponto.intervencoes) ? ponto.intervencoes : [];
      const intervencoesTexto = intervencoes
        .map((i) => `${i.participante_nome}${i.participante_cargo ? ` (${i.participante_cargo})` : ''} referiu que ${i.texto}`)
        .join('; ');

      const frase = [
        `No âmbito do Ponto ${ordinal}, referente a ${ponto.titulo || ''}, foram apresentadas e discutidas as matérias relacionadas com o assunto${ponto.descricao ? `: ${ponto.descricao}` : ''}.`,
        ponto.discussao ? `Da discussão, destaca-se o seguinte: ${ponto.discussao}.` : '',
        intervencoesTexto ? `Tendo os membros manifestado as seguintes posições: ${intervencoesTexto}.` : '',
      ].filter(Boolean).join(' ');

      paragraph(frase);
    });
  }

  // === Resumo geral (texto livre, quando preenchido) ===
  const resumoGeral = acta.resumo || acta.discussoes;
  if (resumoGeral) {
    heading('Resumo da Reunião');
    paragraph(resumoGeral);
  }

  // === Deliberações (resultado da votação de cada ponto com decisão registada) ===
  const pontosComDecisao = pontos.filter((p) => p.decisao);
  if (pontosComDecisao.length > 0) {
    heading('Deliberações');
    pontosComDecisao.forEach((ponto) => {
      const ordinal = ordinalPonto(ponto.ordem || pontos.indexOf(ponto) + 1);
      subheading(`PONTO ${ordinal.toUpperCase()}`);
      paragraph(ponto.titulo || '', { size: 10, gapAfter: 3 });

      let frase: string;
      if (ponto.tipo_votacao === 'unanimidade') {
        frase = `Foi deliberado ${ponto.decisao}, com o seguinte resultado: aprovada por unanimidade.`;
      } else if (ponto.tipo_votacao === 'maioria' && ponto.votos_favor != null) {
        frase = `Foi deliberado ${ponto.decisao}, tendo a deliberação sido aprovada por maioria, com ${ponto.votos_favor} votos a favor, ${ponto.votos_contra || 0} votos contra e ${ponto.abstencoes || 0} abstenções.`;
      } else {
        frase = `Foi deliberado ${ponto.decisao}.`;
      }
      paragraph(frase);
    });
  }

  // Decisões formais adicionais (com responsável/prazo) - distintas da
  // deliberação de cada ponto de agenda, ver DecisaoTomada em acta-types.ts.
  const decisoes: any[] = Array.isArray(acta.decisoes) ? acta.decisoes : [];
  if (decisoes.length > 0) {
    heading('Outras Deliberações');
    decisoes.forEach((decisao: any) => {
      const partes = [`Foi ainda deliberado que ${decisao.descricao}`];
      if (decisao.responsavel) partes.push(`sob a responsabilidade de ${decisao.responsavel}`);
      if (decisao.prazo) partes.push(`com prazo até ${new Date(decisao.prazo).toLocaleDateString('pt-AO')}`);
      paragraph(`${partes.join(', ')}.`);
    });
  }

  // === Recomendações ===
  const recomendacoes: string[] = Array.isArray(acta.recomendacoes) ? acta.recomendacoes : [];
  if (recomendacoes.length > 0) {
    heading('Recomendações');
    recomendacoes.forEach((recomendacao) => paragraph(recomendacao, { indent: 6, gapAfter: 2 }));
    y += 2;
    paragraph('As recomendações acima deverão ser consideradas para implementação ou acompanhamento nos termos definidos pelos órgãos competentes.');
  }

  // === Tarefas Atribuídas (funcionalidade nossa, além do modelo de referência) ===
  const tarefas: any[] = Array.isArray(acta.tarefas) ? acta.tarefas : [];
  if (tarefas.length > 0) {
    heading('Tarefas Atribuídas');
    tarefas.forEach((tarefa: any) => {
      const partes = [tarefa.descricao || ''];
      const responsavel = tarefa.responsavel_nome || tarefa.responsavel;
      if (responsavel) partes.push(`responsável: ${responsavel}`);
      if (tarefa.prazo) partes.push(`prazo: ${new Date(tarefa.prazo).toLocaleDateString('pt-AO')}`);
      if (tarefa.status) partes.push(`estado: ${tarefa.status}`);
      paragraph(`${partes.join(' — ')}.`);
    });
  }

  // === Observações ===
  if (acta.observacoes) {
    heading('Observações');
    paragraph(acta.observacoes);
  }

  // === Encerramento ===
  heading('Encerramento');
  paragraph([
    `Nada mais havendo a tratar, o Senhor(a) Presidente deu por encerrada a sessão${acta.hora_fim ? ` pelas ${acta.hora_fim}` : ''},`,
    'da qual se lavrou a presente acta que, após leitura e aprovação, vai ser assinada por mim,',
    acta.secretario ? `${acta.secretario},` : '',
    'e pelo Senhor(a) Presidente.',
  ].filter(Boolean).join(' '));

  if (dataReuniao) {
    paragraph(`${acta.cidade || 'Luanda'}, ${dataReuniao.getDate()} de ${MESES[dataReuniao.getMonth()]} de ${dataReuniao.getFullYear()}`);
  }

  // === Assinaturas - usa sempre a assinatura real carregada em "Meu Perfil"
  // pelo Presidente/Secretário quando já existir, para o documento gerado
  // refletir o mesmo estado assinado que aparece no ecrã. ===
  const assinaturasReais: any[] = Array.isArray(acta.assinaturas_reais) ? acta.assinaturas_reais : [];
  const assinaturaFor = (papel: string) => assinaturasReais.find((a: any) => a.papel === papel);

  const desenharAssinatura = (label: string, nome: string | undefined, cargo: string | undefined, assinatura: any) => {
    checkPageBreak(38);
    if (assinatura?.assinatura_url) {
      try {
        doc.addImage(assinatura.assinatura_url, 'PNG', marginLeft, y, 55, 14);
        y += 16;
      } catch (error) {
        console.warn('Não foi possível inserir a imagem de assinatura:', error);
      }
    }
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, marginLeft + 75, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(label, marginLeft, y);
    y += 6;
    if (nome) { doc.text(nome, marginLeft, y); y += 6; }
    if (cargo) { doc.text(cargo, marginLeft, y); y += 6; }
    y += 8;
  };

  checkPageBreak(80);
  desenharAssinatura('O/A Presidente', acta.presidente, acta.cargo_presidente, assinaturaFor('presidente'));
  desenharAssinatura('O/A Secretário(a)', acta.secretario, acta.cargo_secretario, assinaturaFor('secretario'));

  // === Lista de Presenças ===
  if (participantes.length > 0) {
    heading('Lista de Presenças');
    participantes.forEach((p: any) => {
      const linha = `${p.nome || ''}${p.role || p.cargo ? ` - ${p.role || p.cargo}` : ''} - ${p.presente === false ? 'Ausente' : 'Presente'}`;
      paragraph(linha, { gapAfter: 2 });
    });
  }

  const filename = `Acta_${(acta.numero || 'documento').replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
  previewPdf(doc, filename);
}

/**
 * Gera relatório consolidado
 */
export function gerarRelatorioConsolidado(
  tipo: 'oficios' | 'facturas' | 'frotas' | 'actas',
  dados: any[],
  filtros?: any
): void {
  const pdf = new PDFGenerator('landscape');

  const titulos = {
    oficios: 'RELATÓRIO DE OFÍCIOS',
    facturas: 'RELATÓRIO DE FACTURAS',
    frotas: 'RELATÓRIO DE FROTAS',
    actas: 'RELATÓRIO DE ACTAS',
  };

  // Cabeçalho
  pdf.addHeader({
    title: titulos[tipo],
    subtitle: `Total de registos: ${dados.length}`,
    organization: 'Sistema de Gestão Provincial',
    logo: FADA_LOGO_DATA_URI,
  });

  let y = 80;

  // Filtros aplicados
  if (filtros) {
    y = pdf.addSection('Filtros Aplicados', y);
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        y = pdf.addInfoField(key, String(value), y);
      }
    });
    y += 10;
  }

  // Tabela de dados
  y = pdf.addSection('Dados', y);

  let headers: string[] = [];
  let tableData: any[][] = [];

  switch (tipo) {
    case 'oficios':
      headers = ['Número', 'Tipo', 'Assunto', 'Status', 'Data'];
      tableData = dados.map(d => [
        d.numero,
        d.tipo === 'entrada' ? 'Entrada' : 'Saída',
        d.assunto.substring(0, 40) + '...',
        d.status,
        new Date(d.created_at).toLocaleDateString('pt-PT'),
      ]);
      break;

    case 'facturas':
      headers = ['Número', 'Fornecedor', 'Valor', 'Vencimento', 'Status'];
      tableData = dados.map(d => [
        d.numero,
        d.fornecedor,
        `${d.valor_total.toLocaleString('pt-PT')} ${d.moeda}`,
        new Date(d.data_vencimento).toLocaleDateString('pt-PT'),
        d.status,
      ]);
      break;

    case 'frotas':
      headers = ['Matrícula', 'Marca/Modelo', 'Tipo', 'Km', 'Status'];
      tableData = dados.map(d => [
        d.matricula,
        `${d.marca} ${d.modelo}`,
        d.tipo,
        `${d.quilometragem.toLocaleString('pt-PT')} km`,
        d.status,
      ]);
      break;

    case 'actas':
      headers = ['Número', 'Título', 'Data', 'Local', 'Status'];
      tableData = dados.map(d => [
        d.numero,
        d.titulo.substring(0, 30) + '...',
        new Date(d.data_reuniao).toLocaleDateString('pt-PT'),
        d.local,
        d.status,
      ]);
      break;
  }

  pdf.addTable(headers, tableData, y);

  // Rodapé
  pdf.addFooter({
    text: 'Relatório Consolidado - Sistema de Gestão',
    pageNumbers: true,
  });

  // Salvar
  const filename = `Relatorio_${tipo}_${new Date().getTime()}.pdf`;
  pdf.save(filename);
}