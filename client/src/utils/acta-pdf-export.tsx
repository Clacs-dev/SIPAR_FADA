/**
 * SERVIÇO DE EXPORTAÇÃO DE ACTAS PARA PDF
 * Usando html2pdf.js para conversão de HTML para PDF
 * SOLUÇÃO: HTML STRING PURO + ZERO OKLCH
 */

import { toast } from "sonner@2.0.3";

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
    await html2pdf()
      .set(pdfOptions)
      .from(htmlString)
      .save();
    
    toast.success('PDF gerado com sucesso!');
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
 * Gera o HTML formal de uma acta directamente a partir dos dados (sem
 * depender do DOM ao vivo, que na tela de detalhes tem inputs/botoes de
 * edicao misturados). Usado pelo botao real "Baixar PDF" da acta.
 * Inclui sempre as assinaturas reais (imagem carregada em "Meu Perfil" pelo
 * Presidente/Secretario) quando existirem, para que o documento gerado
 * reflicta o mesmo estado assinado que aparece no ecra.
 */
function buildActaDocumentHtml(acta: any): string {
  const esc = (value: any) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c
  ));

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const participantes: any[] = Array.isArray(acta?.participantes) ? acta.participantes : [];
  const pontos: any[] = Array.isArray(acta?.pontos_agenda) ? acta.pontos_agenda : [];
  const decisoes: any[] = Array.isArray(acta?.decisoes) ? acta.decisoes : [];
  const recomendacoes: string[] = Array.isArray(acta?.recomendacoes) ? acta.recomendacoes : [];
  const assinaturasReais: any[] = Array.isArray(acta?.assinaturas_reais) ? acta.assinaturas_reais : [];

  const participantesHtml = participantes.length
    ? `<table><tr><th>Nome</th><th>Cargo</th><th>Presente</th></tr>${participantes.map((p) => `
        <tr>
          <td>${esc(p.nome)}${p.externo ? ' (externo)' : ''}</td>
          <td>${esc(p.role || '')}</td>
          <td>${p.presente ? 'Sim' : 'Não'}</td>
        </tr>`).join('')}</table>`
    : '<p>Nenhum participante registado.</p>';

  const pontosHtml = pontos.length
    ? pontos.map((ponto) => `
        <div style="margin-bottom:16px;">
          <h3>${esc(ponto.ordem)}. ${esc(ponto.titulo)}</h3>
          ${ponto.descricao ? `<p>${esc(ponto.descricao)}</p>` : ''}
          ${ponto.discussao ? `<p><strong>Discussão:</strong> ${esc(ponto.discussao)}</p>` : ''}
          ${Array.isArray(ponto.intervencoes) && ponto.intervencoes.length ? `
            <p><strong>Intervenções:</strong></p>
            <ul>${ponto.intervencoes.map((i: any) => `<li>${esc(i.participante_nome)} (${esc(i.participante_cargo || '')}): ${esc(i.texto)}</li>`).join('')}</ul>
          ` : ''}
          ${ponto.decisao ? `<p><strong>Decisão:</strong> ${esc(ponto.decisao)}</p>` : ''}
          ${ponto.tipo_votacao && ponto.tipo_votacao !== 'sem_votacao' ? `
            <p><strong>Votação (${esc(ponto.tipo_votacao)}):</strong> ${esc(ponto.resultado_votacao || '')}
            ${ponto.votos_favor != null ? ` — A favor: ${esc(ponto.votos_favor)}, Contra: ${esc(ponto.votos_contra || 0)}, Abstenções: ${esc(ponto.abstencoes || 0)}` : ''}</p>
          ` : ''}
        </div>`).join('')
    : '<p>Nenhum ponto de agenda registado.</p>';

  const decisoesHtml = decisoes.length
    ? `<ul>${decisoes.map((d) => `<li>${esc(d.descricao)}${d.responsavel ? ` — Responsável: ${esc(d.responsavel)}` : ''}${d.prazo ? ` — Prazo: ${formatDate(d.prazo)}` : ''}</li>`).join('')}</ul>`
    : '';

  const recomendacoesHtml = recomendacoes.length
    ? `<ul>${recomendacoes.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
    : '';

  const assinaturaFor = (papel: string) => assinaturasReais.find((a) => a.papel === papel);
  const presidenteAssinatura = assinaturaFor('presidente');
  const secretarioAssinatura = assinaturaFor('secretario');

  const signatureBlockHtml = (label: string, nomeFallback: string, cargoFallback: string, assinatura: any) => `
    <td style="width:50%; text-align:center; padding:12px; vertical-align:bottom;">
      ${assinatura?.assinatura_url
        ? `<img src="${esc(assinatura.assinatura_url)}" style="height:60px; object-fit:contain; margin-bottom:4px;" />`
        : `<div style="height:60px; border-bottom:1px solid #000; margin-bottom:4px;"></div>`}
      <p style="margin:0; border-top:1px solid #000; padding-top:4px;"><strong>${esc(assinatura?.nome || nomeFallback || `[${label}]`)}</strong></p>
      <p style="margin:0; font-size:12px;">${esc(cargoFallback)}</p>
      <p style="margin:0; font-size:11px; color:#555;">${label}${assinatura?.assinado_em ? ` — Assinado em ${formatDateTime(assinatura.assinado_em)}` : ' — Aguarda assinatura'}</p>
    </td>`;

  return `
    <div>
      <h1 style="text-align:center;">ACTA ${esc(acta?.numero || '')}</h1>
      <h2 style="text-align:center;">${esc(acta?.titulo || '')}</h2>
      <p style="text-align:center;">${esc(acta?.entidade || '')}${acta?.cidade ? `, ${esc(acta.cidade)}` : ''}</p>
      <table>
        <tr><td><strong>Data</strong></td><td>${formatDate(acta?.data_reuniao)}</td><td><strong>Horário</strong></td><td>${esc(acta?.hora_inicio || '')} - ${esc(acta?.hora_fim || '')}</td></tr>
        <tr><td><strong>Local</strong></td><td colspan="3">${acta?.tipo === 'online' ? 'Reunião Online' : esc(acta?.local || '')}</td></tr>
        <tr><td><strong>Presidente</strong></td><td>${esc(acta?.presidente || acta?.organizador_nome || '')}</td><td><strong>Secretário(a)</strong></td><td>${esc(acta?.secretario || '')}</td></tr>
      </table>

      <h2>Participantes</h2>
      ${participantesHtml}

      <h2>Agenda e Deliberações</h2>
      ${pontosHtml}

      ${decisoesHtml ? `<h2>Decisões Tomadas</h2>${decisoesHtml}` : ''}
      ${recomendacoesHtml ? `<h2>Recomendações</h2>${recomendacoesHtml}` : ''}
      ${acta?.observacoes ? `<h2>Observações</h2><p>${esc(acta.observacoes)}</p>` : ''}

      <h2 style="margin-top:32px;">Assinaturas</h2>
      <table style="border:none;">
        <tr>
          ${signatureBlockHtml('Presidente', acta?.presidente || acta?.organizador_nome, acta?.cargo_presidente, presidenteAssinatura)}
          ${signatureBlockHtml('Secretário(a)', acta?.secretario, acta?.cargo_secretario, secretarioAssinatura)}
        </tr>
      </table>
    </div>
  `;
}

/**
 * Gera e faz o download do PDF oficial da acta directamente a partir dos
 * dados guardados (inclui sempre as assinaturas reais quando existirem).
 * Substitui a antiga dependencia do endpoint "/actas/:id/pdf", que e apenas
 * um stub no backend (nao devolve um PDF real).
 */
export async function downloadActaPDF(acta: any, options: ActaPDFOptions = {}): Promise<void> {
  try {
    toast.info('A gerar PDF...');
    const html2pdf = await loadHtml2Pdf();

    const filename = options.filename || `Acta_${acta?.numero || 'documento'}_${new Date().toISOString().split('T')[0]}.pdf`;
    const bodyHtml = buildActaDocumentHtml(acta);

    const htmlString = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #000; background: #fff; padding: 20mm; width: 210mm; margin: 0; }
    * { box-sizing: border-box; }
    h1 { font-size: 22px; margin: 0 0 4px 0; }
    h2 { font-size: 16px; margin: 20px 0 8px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 14px; margin: 0 0 6px 0; }
    p { margin: 0 0 8px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
    table, th, td { border: 1px solid #ddd; }
    th, td { padding: 6px 8px; text-align: left; }
    ul { margin: 0 0 8px 20px; font-size: 13px; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

    await html2pdf()
      .set({
        margin: options.margin || [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: options.format || 'a4', orientation: options.orientation || 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(htmlString)
      .save();

    toast.success('PDF gerado com sucesso!');
  } catch (error: any) {
 console.error('Erro ao gerar PDF da acta:', error);
    toast.error('Erro ao gerar PDF: ' + (error?.message || 'erro desconhecido'));
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Acta_${acta?.numero || 'documento'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Arquivo de texto gerado com sucesso!');
  } catch (error: any) {
 console.error('Erro ao gerar arquivo de texto:', error);
    toast.error('Erro ao gerar arquivo de texto');
  }
}
