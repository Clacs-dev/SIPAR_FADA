/**
 * Serviço de Geração de PDF
 * Utiliza jsPDF para gerar relatórios em PDF
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FADA_LOGO_DATA_URI } from '../assets/fada-logo';

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

// Estender tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
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
    // Logo (se fornecida)
    if (header.logo) {
      try {
        this.doc.addImage(header.logo, 'PNG', this.margin, 10, 30, 30);
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
    const titleY = header.logo ? 50 : 20;
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
    // Usar autoTable com sintaxe direta
    (this.doc as any).autoTable({
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
  save(filename: string): void {
    this.doc.save(filename);
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
    const blob = this.getBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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
  });

  let y = 80;

  // Informações principais
  y = pdf.addSection('Dados da Factura', y);
  y = pdf.addInfoField('Número', factura.numero, y);
  y = pdf.addInfoField('Fornecedor', factura.fornecedor, y);
  y = pdf.addInfoField('IBAN', factura.iban, y);
  y = pdf.addInfoField('Data de Emissão', new Date(factura.data_emissao).toLocaleDateString('pt-PT'), y);
  y = pdf.addInfoField('Data de Vencimento', new Date(factura.data_vencimento).toLocaleDateString('pt-PT'), y);
  y = pdf.addInfoField('Valor Total', `${factura.valor_total.toLocaleString('pt-PT')} ${factura.moeda}`, y);
  y = pdf.addInfoField('Status', factura.status.toUpperCase(), y);

  y += 10;

  // Itens
  if (factura.itens && factura.itens.length > 0) {
    y = pdf.addSection('Itens da Factura', y);
    
    const itensData = factura.itens.map((item: any) => [
      item.descricao,
      item.quantidade.toString(),
      `${item.valor_unitario.toLocaleString('pt-PT')} ${factura.moeda}`,
      `${item.valor_total.toLocaleString('pt-PT')} ${factura.moeda}`,
    ]);

    pdf.addTable(
      ['Descrição', 'Quantidade', 'Valor Unitário', 'Valor Total'],
      itensData,
      y
    );

    y = pdf.getCurrentY() + 10;
  }

  // Totais
  y = pdf.addSection('Resumo Financeiro', y);
  y = pdf.addInfoField('Subtotal', `${factura.subtotal?.toLocaleString('pt-PT') || factura.valor_total.toLocaleString('pt-PT')} ${factura.moeda}`, y);
  if (factura.impostos) {
    y = pdf.addInfoField('Impostos', `${factura.impostos.toLocaleString('pt-PT')} ${factura.moeda}`, y);
  }
  if (factura.descontos) {
    y = pdf.addInfoField('Descontos', `${factura.descontos.toLocaleString('pt-PT')} ${factura.moeda}`, y);
  }
  y = pdf.addInfoField('TOTAL', `${factura.valor_total.toLocaleString('pt-PT')} ${factura.moeda}`, y);

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
  contaDebito?: string;
  numeroDespacho?: string;
  numeroFacturas?: string; // Ex: "FT FA 2026/1883 e N.º FT FA 2026/1899"
  descricao?: string;
  valor: number;
  moeda?: string;
  fornecedor: string;
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
  doc.text(op.bancoNome ? `Banco ${op.bancoNome}` : 'Banco do Fornecedor', marginRight, y, { align: 'right' });
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
  doc.text('Ordem de Pagamento.', marginLeft + doc.getTextWidth('Assunto: '), y);
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
 * Gera PDF de Acta
 */
export function gerarPDFActa(acta: any): void {
  const pdf = new PDFGenerator('portrait');

  // Cabeçalho
  pdf.addHeader({
    title: 'ACTA DE REUNIÃO',
    subtitle: acta.numero,
    organization: acta.departamento || 'Governo Provincial',
  });

  let y = 80;

  // Informações principais
  y = pdf.addSection('Dados da Reunião', y);
  y = pdf.addInfoField('Número', acta.numero, y);
  y = pdf.addInfoField('Título', acta.titulo, y);
  y = pdf.addInfoField('Data', new Date(acta.data_reuniao).toLocaleDateString('pt-PT'), y);
  y = pdf.addInfoField('Hora', acta.hora_inicio + (acta.hora_fim ? ` - ${acta.hora_fim}` : ''), y);
  y = pdf.addInfoField('Local', acta.local, y);
  y = pdf.addInfoField('Tipo', acta.tipo_reuniao, y);
  y = pdf.addInfoField('Status', acta.status.toUpperCase(), y);

  y += 10;

  // Participantes
  if (acta.participantes && acta.participantes.length > 0) {
    y = pdf.addSection('Participantes', y);
    
    const participantesData = acta.participantes.map((p: any) => [
      p.nome,
      p.cargo || 'N/A',
      p.presente ? 'Presente' : 'Ausente',
    ]);

    pdf.addTable(
      ['Nome', 'Cargo', 'Presença'],
      participantesData,
      y,
      { startY: y }
    );

    y = pdf.getCurrentY() + 10;
  }

  // Ordem do Dia
  if (acta.ordem_dia && acta.ordem_dia.length > 0) {
    y = pdf.addSection('Ordem do Dia', y);
    acta.ordem_dia.forEach((item: string, index: number) => {
      y = pdf.addParagraph(`${index + 1}. ${item}`, y);
      y += 2;
    });
    y += 5;
  }

  // Conteúdo
  y = pdf.addSection('Conteúdo da Reunião', y);
  y = pdf.addParagraph(acta.conteudo, y);

  y += 10;

  // Deliberações
  if (acta.deliberacoes && acta.deliberacoes.length > 0) {
    y = pdf.addSection('Deliberações', y);
    acta.deliberacoes.forEach((delib: string, index: number) => {
      y = pdf.addParagraph(`${index + 1}. ${delib}`, y);
      y += 2;
    });
  }

  // Rodapé
  pdf.addFooter({
    text: 'Documento gerado automaticamente pelo Sistema de Gestão de Livro de Actas',
    pageNumbers: true,
  });

  // Salvar
  const filename = `Acta_${acta.numero.replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
  pdf.save(filename);
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