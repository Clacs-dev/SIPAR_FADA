// Templates de e-mail (HTML) usados pelos modulos de negocio. Extraidos de
// modules.routes.ts para separar geracao de conteudo de e-mail da logica de
// rota (ARCH-08 da auditoria de producao).

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

export function cotacaoConviteEmailHtml(nomeFornecedor: string, descricao: string, numero: string, valorEstimado?: number, categoria?: string | null) {
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
