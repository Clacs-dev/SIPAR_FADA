// Templates de e-mail (HTML) usados pelos modulos de negocio. Extraidos de
// modules.routes.ts para separar geracao de conteudo de e-mail da logica de
// rota (ARCH-08 da auditoria de producao).

export interface ContactoResponsavel {
  nome: string;
  email: string;
}

function escaparHtml(valor: string) {
  return String(valor).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/**
 * Aviso acrescentado aos e-mails enviados a fornecedores: a mensagem e gerada
 * pelo sistema (nao se responde para o remetente) e a factura/cotacao ou
 * qualquer duvida seguem para o utilizador responsavel (quem publicou o
 * pedido ou executou a accao).
 */
export function avisoContactoResponsavelHtml(contacto: ContactoResponsavel) {
  const nome = escaparHtml(contacto.nome);
  const email = escaparHtml(contacto.email);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 24px auto 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 14px;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #9a3412;">
          <strong>Este e-mail é gerado automaticamente pelo sistema SIPAR-FADA.</strong>
          Não responda para o endereço de envio deste e-mail.
        </p>
        <p style="margin: 0 0 10px; font-size: 13px; color: #1e293b;">
          Submeta ou envie a sua factura/cotação e qualquer esclarecimento <strong>apenas</strong> para o
          responsável por este pedido:
          <br /><strong>${nome}</strong> — <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
        </p>
        <p style="margin: 0; font-size: 13px; color: #b91c1c; background: #fee2e2; border-radius: 6px; padding: 8px;">
          <strong>Atenção:</strong> cotações ou facturas enviadas em resposta ao e-mail do sistema, ou para
          qualquer outro endereço que não o do responsável acima, <strong>não serão consideradas válidas</strong>.
        </p>
      </div>
    </div>
  `;
}

export function fornecedorCredentialsEmailHtml(nome: string, email: string, password: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Bem-vindo(a) ao Portal de Fornecedores do FADA</h2>
      <p>Olá <strong>${nome}</strong>,</p>
      <p>
        O seu cadastro como fornecedor foi registado com sucesso no sistema SIPAR do
        Fundo de Apoio ao Desenvolvimento Agrário (FADA). Já pode aceder ao sistema para
        <strong>submeter as suas facturas e responder a pedidos de cotação</strong>.
      </p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>E-mail de acesso:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Password temporária:</strong> <code style="background:#fff; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
      </div>
      <p>
        Por segurança, recomendamos que altere esta password assim que efectuar o primeiro login.
      </p>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">
        Se não reconhece este pedido, ignore este e-mail ou contacte o FADA.
      </p>
    </div>
  `;
}

export interface AnexoEmail {
  nome: string;
  url?: string;
  /** false = demasiado grande para seguir no e-mail (vai so a ligacao). */
  anexado: boolean;
}

export function cotacaoConviteEmailHtml(nomeFornecedor: string, descricao: string, numero: string, valorEstimado?: number, categoria?: string | null, anexos: AnexoEmail[] = []) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Novo pedido de cotação - FADA</h2>
      <p>Olá <strong>${nomeFornecedor}</strong>,</p>
      <p>
        O Fundo de Apoio ao Desenvolvimento Agrário (FADA) abriu um novo pedido de compra na
        categoria em que está cadastrado e gostaria de receber a sua cotação.
      </p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Referência:</strong> ${numero}</p>
        ${categoria ? `<p style="margin: 4px 0;"><strong>Categoria:</strong> ${categoria}</p>` : ''}
        <p style="margin: 4px 0;"><strong>Descrição:</strong> ${descricao}</p>
        ${valorEstimado ? `<p style="margin: 4px 0;"><strong>Valor estimado:</strong> ${valorEstimado.toLocaleString('pt-PT')} AOA</p>` : ''}
      </div>
      ${anexos.length ? `
      <div style="margin: 0 0 20px;">
        <p style="margin: 0 0 6px;"><strong>Documentos do pedido:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          ${anexos.map((a) => `<li>${escaparHtml(a.nome)}${a.anexado ? ' <span style="color:#64748b;">(em anexo)</span>' : a.url ? ` — <a href="${escaparHtml(a.url)}" style="color:#2563eb;">descarregar</a>` : ''}</li>`).join('')}
        </ul>
      </div>` : ''}
      <p>
        Aceda ao Portal de Fornecedores com as suas credenciais habituais para submeter a sua
        proposta de cotação para este pedido.
      </p>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">
        Se não reconhece este pedido, ignore este e-mail ou contacte o FADA.
      </p>
    </div>
  `;
}

export function actaAprovadaEmailHtml(nomeParticipante: string, assunto: string, numero: string, resumo?: string | null) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Acta aprovada - FADA</h2>
      <p>Olá <strong>${nomeParticipante || 'Participante'}</strong>,</p>
      <p>
        A acta da reunião <strong>${assunto}</strong> (${numero}) foi assinada pelo Presidente e
        pelo Secretário e encontra-se agora aprovada.
      </p>
      ${resumo ? `
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Resumo:</strong></p>
        <p style="margin: 4px 0; white-space: pre-wrap;">${resumo}</p>
      </div>` : ''}
      <p>
        Pode consultar o documento completo, incluindo decisões e tarefas atribuídas, no
        Livro de Actas do sistema SIPAR.
      </p>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">
        Este é um e-mail automático do sistema SIPAR do Fundo de Apoio ao Desenvolvimento Agrário (FADA).
      </p>
    </div>
  `;
}
