/**
 * SERVIÇO DE EXPORTAÇÃO DE ACTAS PARA PDF
 * Usando html2pdf.js para conversão de HTML para PDF
 * SOLUÇÃO: HTML STRING PURO + ZERO OKLCH
 */

import { toast } from "sonner@2.0.3";
import { previewDocument } from '../components/ui/document-preview';

interface ActaPDFOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number | [number, number, number, number];
}

/**
 * Carrega a biblioteca html2pdf.js dinamicamente via CDN
 */
async function loadHtml2Pdf(): Promise<any> {
  if ((window as any).html2pdf) {
    return (window as any).html2pdf;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
      } else {
        reject(new Error('html2pdf não foi carregado corretamente'));
      }
    };
    script.onerror = () => reject(new Error('Falha ao carregar html2pdf'));
    document.head.appendChild(script);
  });
}

/**
 * ✅ NOVA FUNÇÃO: sanitizeElementForPdf
 * Substitui convertOklchToRgb - Remove classes e aplica estilos inline HEX puros
 */
function sanitizeElementForPdf(element: HTMLElement): void {
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))];

  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;

    // REMOVER TODAS AS CLASSES (zero oklch)
    htmlEl.className = '';

    // ESTILOS INLINE PADRONIZADOS
    htmlEl.style.fontFamily = "Arial, sans-serif";
    htmlEl.style.lineHeight = "1.6";
    htmlEl.style.padding = "4px";
    htmlEl.style.margin = "0";
    htmlEl.style.boxSizing = "border-box";
    htmlEl.style.color = '#000000';
    htmlEl.style.backgroundColor = '#ffffff';
    htmlEl.style.border = 'none';

    // CONFIGURAÇÃO POR TAG HTML
    const tagName = htmlEl.tagName.toLowerCase();

    if (tagName === 'h1') {
      htmlEl.style.fontSize = '24px';
      htmlEl.style.fontWeight = 'bold';
      htmlEl.style.marginBottom = '16px';
      htmlEl.style.color = '#000000';
    } else if (tagName === 'h2') {
      htmlEl.style.fontSize = '20px';
      htmlEl.style.fontWeight = 'bold';
      htmlEl.style.marginBottom = '12px';
      htmlEl.style.color = '#000000';
    } else if (tagName === 'h3') {
      htmlEl.style.fontSize = '18px';
      htmlEl.style.fontWeight = '600';
      htmlEl.style.marginBottom = '10px';
      htmlEl.style.color = '#000000';
    } else if (tagName === 'p') {
      htmlEl.style.marginBottom = '8px';
      htmlEl.style.color = '#000000';
    } else if (tagName === 'table') {
      htmlEl.style.width = '100%';
      htmlEl.style.borderCollapse = 'collapse';
      htmlEl.style.marginBottom = '16px';
    } else if (tagName === 'th') {
      htmlEl.style.backgroundColor = '#f3f4f6';
      htmlEl.style.padding = '8px';
      htmlEl.style.textAlign = 'left';
      htmlEl.style.fontWeight = 'bold';
      htmlEl.style.borderBottom = '2px solid #e5e7eb';
      htmlEl.style.color = '#000000';
    } else if (tagName === 'td') {
      htmlEl.style.padding = '8px';
      htmlEl.style.borderBottom = '1px solid #e5e7eb';
      htmlEl.style.color = '#000000';
      htmlEl.style.backgroundColor = '#ffffff';
    } else if (tagName === 'ul' || tagName === 'ol') {
      htmlEl.style.marginLeft = '20px';
      htmlEl.style.marginBottom = '12px';
    } else if (tagName === 'li') {
      htmlEl.style.marginBottom = '4px';
      htmlEl.style.color = '#000000';
    } else if (tagName === 'strong' || tagName === 'b') {
      htmlEl.style.fontWeight = 'bold';
      htmlEl.style.color = '#000000';
    } else if (tagName === 'button') {
      htmlEl.style.display = 'none';
    } else if (tagName === 'div') {
      htmlEl.style.backgroundColor = '#ffffff';
    }
  });
}

/**
 * ✅ SOLUÇÃO DEFINITIVA: Gera e faz download de PDF da acta
 * USA HTML STRING EM VEZ DO DOM VIVO
 */
export async function exportActaToPDF(
  actaElement: HTMLElement,
  acta: any,
  options: ActaPDFOptions = {}
): Promise<void> {
  try {
    const html2pdf = await loadHtml2Pdf();

    const defaultFilename = `Acta_${acta.numero || 'documento'}_${new Date().toISOString().split('T')[0]}.pdf`;

    const pdfOptions = {
      margin: options.margin || [10, 10, 10, 10],
      filename: options.filename || defaultFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: options.format || 'a4',
        orientation: options.orientation || 'portrait',
        compress: true,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
      },
    };

    // Clonar e sanitizar elemento
    const clonedElement = actaElement.cloneNode(true) as HTMLElement;

    // Aplicar estilos base
    clonedElement.style.width = '100%';
    clonedElement.style.maxWidth = '800px';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.color = '#000000';
    clonedElement.style.padding = '20px';
    clonedElement.style.fontFamily = 'Arial, sans-serif';
    clonedElement.style.fontSize = '14px';

    // ✅ SANITIZAR (remove classes, aplica inline styles)
    sanitizeElementForPdf(clonedElement);

    // ✅ GERAÇÃO DO HTML LIMPO (NOVO BLOCO)
    const cleanHTML = clonedElement.outerHTML;

    const htmlString = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      padding: 20mm;
      width: 210mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${cleanHTML}
</body>
</html>
`;

    // ✅ USO DO HTML STRING (NÃO DO DOM VIVO)
    const blob: Blob = await html2pdf()
      .set(pdfOptions)
      .from(htmlString)
      .output('blob');

    previewDocument({ blob, nome: pdfOptions.filename, tipo: 'application/pdf' });
  } catch (error: any) {
 console.error(' Erro ao gerar PDF:', error);
    toast.error('Erro ao gerar PDF: ' + error.message);
    throw error;
  }
}

/**
 * ✅ Gera PDF e retorna como Blob (para preview ou upload)
 * USA .output('blob') EM VEZ DE .outputPdf('blob')
 */
export async function generateActaPDFBlob(
  actaElement: HTMLElement,
  options: ActaPDFOptions = {}
): Promise<Blob> {
  try {
    const html2pdf = await loadHtml2Pdf();

    const pdfOptions = {
      margin: options.margin || [10, 10, 10, 10],
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: options.format || 'a4',
        orientation: options.orientation || 'portrait',
      },
    };

    const clonedElement = actaElement.cloneNode(true) as HTMLElement;
    clonedElement.style.width = '100%';
    clonedElement.style.maxWidth = '800px';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.color = '#000000';
    clonedElement.style.padding = '20px';

    sanitizeElementForPdf(clonedElement);

    const cleanHTML = clonedElement.outerHTML;

    const htmlString = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      padding: 20mm;
      width: 210mm;
      margin: 0;
    }
  </style>
</head>
<body>
  ${cleanHTML}
</body>
</html>
`;

    // ✅ USA .output('blob') CORRETAMENTE
    const blob = await html2pdf()
      .set(pdfOptions)
      .from(htmlString)
      .output('blob');

    return blob;
  } catch (error: any) {
 console.error('Erro ao gerar PDF Blob:', error);
    throw error;
  }
}

/**
 * Formata documento HTML para impressão otimizada
 */
export function prepareActaForPrint(actaElement: HTMLElement): void {
  actaElement.classList.add('print-optimized');

  const noPrintElements = actaElement.querySelectorAll('.no-print, button');
  noPrintElements.forEach(el => {
    el.classList.add('print-hidden');
  });

  const sections = actaElement.querySelectorAll('section');
  sections.forEach(section => {
    (section as HTMLElement).style.pageBreakInside = 'avoid';
  });
}

/**
 * ✅ VALIDAÇÃO DEFENSIVA: Gera versão em texto puro da acta
 */
export function exportActaToText(acta: any): string {
  let text = '';

  text += `${acta?.numero || 'ACTA'}\n`;
  text += `${acta?.tipo_reuniao === 'ordinaria' ? 'REUNIÃO ORDINÁRIA' : 'REUNIÃO EXTRAORDINÁRIA'}\n`;
  text += `\n`;

  if (acta?.data_reuniao) {
    text += `Reunião realizada em ${new Date(acta.data_reuniao).toLocaleDateString('pt-AO')}\n`;
  }
  text += `Horário: ${acta?.hora_inicio || '00:00'} - ${acta?.hora_fim || '00:00'}\n`;
  text += `\n`;

  // ✅ VALIDAÇÃO DEFENSIVA
  if (Array.isArray(acta?.agenda?.pontos)) {
    text += `AGENDA:\n`;
    acta.agenda.pontos.forEach((ponto: any) => {
      text += `${ponto.ordem}. ${ponto.titulo}\n`;
    });
    text += `\n`;
  }

  // ✅ VALIDAÇÃO DEFENSIVA
  if (Array.isArray(acta?.discussoes)) {
    text += `DISCUSSÕES:\n`;
    acta.discussoes.forEach((discussao: any) => {
      text += `\nPonto ${discussao.ponto_ordem}: ${discussao.ponto_titulo}\n`;
      if (Array.isArray(discussao?.intervencoes)) {
        discussao.intervencoes.forEach((interv: any) => {
          text += `  - ${interv.participante_nome}: ${interv.texto}\n`;
        });
      }
    });
    text += `\n`;
  }

  // ✅ VALIDAÇÃO DEFENSIVA
  if (Array.isArray(acta?.deliberacoes)) {
    text += `DELIBERAÇÕES:\n`;
    acta.deliberacoes.forEach((delib: any) => {
      if (delib?.decisao) {
        text += `Ponto ${delib.ponto_ordem}: ${delib.decisao}\n`;
      }
    });
    text += `\n`;
  }

  // ✅ VALIDAÇÃO DEFENSIVA
  if (Array.isArray(acta?.participantes)) {
    text += `PARTICIPANTES:\n`;
    acta.participantes.forEach((p: any) => {
      text += `- ${p?.nome || 'N/A'} (${p?.cargo || 'N/A'})${p?.presente ? ' - Presente' : ''}\n`;
    });
  }

  return text;
}

/**
 * Faz download de texto puro
 */
export function downloadActaAsText(acta: any): void {
  try {
    const text = exportActaToText(acta);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    previewDocument({ blob, nome: `Acta_${acta?.numero || 'documento'}_${new Date().toISOString().split('T')[0]}.txt`, tipo: 'text/plain' });
  } catch (error: any) {
 console.error('Erro ao gerar arquivo de texto:', error);
    toast.error('Erro ao gerar arquivo de texto');
  }
}
