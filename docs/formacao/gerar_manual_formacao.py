"""
Gera o Manual de Formacao do SIPAR-FADA (PDF) na raiz do projecto.

    python docs/formacao/gerar_manual_formacao.py

Requisitos: pip install reportlab
O conteudo esta todo neste ficheiro - para actualizar o manual quando a
plataforma mudar, editar as seccoes abaixo e voltar a correr o script.
"""

import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, NextPageTemplate, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SAIDA = os.path.join(RAIZ, 'Manual_de_Formacao_SIPAR-FADA.pdf')
LOGO = os.path.join(RAIZ, 'server', 'templates', 'fada-logo.jpg')
VERSAO = '1.0'

# ---------------------------------------------------------------------------
# Tipografia e cores
# ---------------------------------------------------------------------------
FONTE, FONTE_B, FONTE_I = 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique'
for nome, ficheiro in [('Calibri', 'calibri.ttf'), ('Calibri-Bold', 'calibrib.ttf'), ('Calibri-Italic', 'calibrii.ttf')]:
    caminho = os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', ficheiro)
    if os.path.exists(caminho):
        pdfmetrics.registerFont(TTFont(nome, caminho))
if 'Calibri' in pdfmetrics.getRegisteredFontNames():
    FONTE = 'Calibri'
    FONTE_B = 'Calibri-Bold' if 'Calibri-Bold' in pdfmetrics.getRegisteredFontNames() else FONTE
    FONTE_I = 'Calibri-Italic' if 'Calibri-Italic' in pdfmetrics.getRegisteredFontNames() else FONTE

AZUL = colors.HexColor('#1F3864')
AZUL_CLARO = colors.HexColor('#DCE6F2')
DOURADO = colors.HexColor('#E3A21A')
DOURADO_CLARO = colors.HexColor('#FFF4D6')
VERMELHO = colors.HexColor('#B8322A')
VERMELHO_CLARO = colors.HexColor('#FBE3E1')
VERDE = colors.HexColor('#2E7D32')
VERDE_CLARO = colors.HexColor('#E3F2E5')
CINZA = colors.HexColor('#5F6B7A')
CINZA_CLARO = colors.HexColor('#F2F4F7')

base = getSampleStyleSheet()
S = {
    'corpo': ParagraphStyle('corpo', parent=base['Normal'], fontName=FONTE, fontSize=10.5, leading=15, spaceAfter=6),
    'peq': ParagraphStyle('peq', parent=base['Normal'], fontName=FONTE, fontSize=9, leading=12),
    'celula': ParagraphStyle('celula', parent=base['Normal'], fontName=FONTE, fontSize=9.2, leading=12.2),
    'celula_b': ParagraphStyle('celula_b', parent=base['Normal'], fontName=FONTE_B, fontSize=9.2, leading=12.2, textColor=colors.white),
    'h1': ParagraphStyle('h1', keepWithNext=1, parent=base['Heading1'], fontName=FONTE_B, fontSize=20, leading=24, textColor=AZUL, spaceBefore=4, spaceAfter=10),
    'h2': ParagraphStyle('h2', keepWithNext=1, parent=base['Heading2'], fontName=FONTE_B, fontSize=14, leading=18, textColor=AZUL, spaceBefore=12, spaceAfter=6),
    'h3': ParagraphStyle('h3', keepWithNext=1, parent=base['Heading3'], fontName=FONTE_B, fontSize=11.5, leading=15, textColor=colors.HexColor('#2B4C7E'), spaceBefore=8, spaceAfter=4),
    'lista': ParagraphStyle('lista', parent=base['Normal'], fontName=FONTE, fontSize=10.5, leading=14.5, leftIndent=14, bulletIndent=4, spaceAfter=2),
    'toc1': ParagraphStyle('toc1', fontName=FONTE_B, fontSize=11, leading=17, leftIndent=0),
    'toc2': ParagraphStyle('toc2', fontName=FONTE, fontSize=10, leading=14, leftIndent=16),
}


# ---------------------------------------------------------------------------
# Ajudas de composicao
# ---------------------------------------------------------------------------
class Manual(BaseDocTemplate):
    """Documento com capa, indice automatico e cabecalho/rodape nas paginas de conteudo."""

    def __init__(self, ficheiro):
        super().__init__(
            ficheiro, pagesize=A4, leftMargin=2.1 * cm, rightMargin=2.1 * cm, topMargin=2.4 * cm, bottomMargin=2 * cm,
            title='Manual de Formação — SIPAR-FADA', author='FADA — Fundo de Apoio ao Desenvolvimento Agrário',
            subject='Formação de utilizadores da plataforma SIPAR-FADA',
        )
        quadro = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id='normal')
        self.addPageTemplates([
            PageTemplate(id='capa', frames=[quadro], onPage=self._capa),
            PageTemplate(id='conteudo', frames=[quadro], onPage=self._cabecalho),
        ])

    def afterFlowable(self, flowable):
        # Regista os titulos no indice
        if isinstance(flowable, Paragraph) and flowable.style.name in ('h1', 'h2'):
            nivel = 0 if flowable.style.name == 'h1' else 1
            texto = flowable.getPlainText()
            chave = 'sec-%d' % id(flowable)
            self.canv.bookmarkPage(chave)
            self.canv.addOutlineEntry(texto, chave, level=nivel, closed=nivel > 0)
            self.notify('TOCEntry', (nivel, texto, self.page, chave))

    def _capa(self, canv, doc):
        largura, altura = A4
        canv.saveState()
        canv.setFillColor(AZUL)
        canv.rect(0, 0, largura, altura * 0.38, stroke=0, fill=1)
        canv.setFillColor(DOURADO)
        canv.rect(0, altura * 0.38, largura, 0.25 * cm, stroke=0, fill=1)
        if os.path.exists(LOGO):
            canv.drawImage(LOGO, (largura - 9 * cm) / 2, altura - 9.2 * cm, width=9 * cm, height=9 * cm * 315 / 738, mask='auto')
        canv.setFillColor(AZUL)
        canv.setFont(FONTE_B, 30)
        canv.drawCentredString(largura / 2, altura * 0.58, 'Manual de Formação')
        canv.setFont(FONTE, 16)
        canv.setFillColor(CINZA)
        canv.drawCentredString(largura / 2, altura * 0.58 - 1.0 * cm, 'Plataforma SIPAR-FADA')
        canv.setFont(FONTE, 11.5)
        canv.drawCentredString(largura / 2, altura * 0.58 - 1.8 * cm,
                               'Sistema Integrado de Processos, Aprovações & Registos')
        canv.setFillColor(colors.white)
        canv.setFont(FONTE_B, 13)
        canv.drawString(2.1 * cm, altura * 0.38 - 2.2 * cm, 'Guia do formador e dos utilizadores')
        canv.setFont(FONTE, 10.5)
        linhas = [
            'Para quem: formadores e novos utilizadores de todas as áreas da FADA',
            'Conteúdo: acesso, perfis, módulos passo a passo, exercícios, perguntas frequentes',
            'Versão %s  ·  %s' % (VERSAO, date.today().strftime('%d/%m/%Y')),
        ]
        for i, linha in enumerate(linhas):
            canv.drawString(2.1 * cm, altura * 0.38 - 3.1 * cm - i * 0.6 * cm, linha)
        canv.setFont(FONTE, 8.5)
        canv.drawString(2.1 * cm, 1.4 * cm, 'FADA — Fundo de Apoio ao Desenvolvimento Agrário')
        canv.restoreState()

    def _cabecalho(self, canv, doc):
        largura, altura = A4
        canv.saveState()
        if os.path.exists(LOGO):
            canv.drawImage(LOGO, 2.1 * cm, altura - 1.6 * cm, width=2.3 * cm, height=2.3 * cm * 315 / 738, mask='auto')
        canv.setFont(FONTE, 8.5)
        canv.setFillColor(CINZA)
        canv.drawRightString(largura - 2.1 * cm, altura - 1.25 * cm, 'Manual de Formação · SIPAR-FADA')
        canv.setStrokeColor(DOURADO)
        canv.setLineWidth(1.2)
        canv.line(2.1 * cm, altura - 1.75 * cm, largura - 2.1 * cm, altura - 1.75 * cm)
        canv.setStrokeColor(AZUL_CLARO)
        canv.setLineWidth(0.6)
        canv.line(2.1 * cm, 1.45 * cm, largura - 2.1 * cm, 1.45 * cm)
        canv.drawString(2.1 * cm, 1.0 * cm, 'FADA — Fundo de Apoio ao Desenvolvimento Agrário')
        canv.drawRightString(largura - 2.1 * cm, 1.0 * cm, 'Página %d' % doc.page)
        canv.restoreState()


def p(texto, estilo='corpo'):
    return Paragraph(texto, S[estilo])


def lista(itens):
    return [Paragraph(i, S['lista'], bulletText='•') for i in itens]


def passos(itens):
    return [Paragraph(i, S['lista'], bulletText='%d.' % (n + 1)) for n, i in enumerate(itens)]


def caixa(titulo, texto, tipo='dica'):
    """Caixa de destaque: dica (verde), atencao (vermelho), formador (dourado), nota (azul)."""
    cores = {
        'dica': (VERDE, VERDE_CLARO, 'Dica'),
        'atencao': (VERMELHO, VERMELHO_CLARO, 'Atenção'),
        'formador': (DOURADO, DOURADO_CLARO, 'Para o formador'),
        'nota': (AZUL, AZUL_CLARO, 'Nota'),
    }
    borda, fundo, rotulo = cores[tipo]
    conteudo = [Paragraph('<b>%s%s</b>' % (rotulo, (' — ' + titulo) if titulo else ''),
                          ParagraphStyle('cx_t', parent=S['celula'], textColor=borda, fontSize=10, leading=13))]
    textos = texto if isinstance(texto, list) else [texto]
    for t in textos:
        conteudo.append(Paragraph(t, ParagraphStyle('cx', parent=S['celula'], fontSize=9.8, leading=13.5, spaceBefore=2)))
    tabela = Table([[conteudo]], colWidths=[16.8 * cm])
    tabela.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), fundo),
        ('LINEBEFORE', (0, 0), (0, -1), 3, borda),
        ('LEFTPADDING', (0, 0), (-1, -1), 9), ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return KeepTogether([Spacer(1, 3), tabela, Spacer(1, 6)])


def tabela(cabecalho, linhas, larguras, zebra=True):
    dados = [[Paragraph(c, S['celula_b']) for c in cabecalho]]
    for linha in linhas:
        dados.append([Paragraph(str(c), S['celula']) for c in linha])
    t = Table(dados, colWidths=[l * cm for l in larguras], repeatRows=1)
    estilo = [
        ('BACKGROUND', (0, 0), (-1, 0), AZUL),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#C9D3E0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    if zebra:
        for i in range(1, len(dados)):
            if i % 2 == 0:
                estilo.append(('BACKGROUND', (0, i), (-1, i), CINZA_CLARO))
    t.setStyle(TableStyle(estilo))
    return t


def fluxo(etapas):
    """Fluxo horizontal de etapas (caixas ligadas por setas »)."""
    celulas = []
    for i, (titulo, quem) in enumerate(etapas):
        celulas.append(Paragraph('<b>%s</b><br/><font size="7.8" color="#5F6B7A">%s</font>' % (titulo, quem),
                                 ParagraphStyle('fx', parent=S['celula'], alignment=TA_CENTER, fontSize=8.6, leading=10.5)))
        if i < len(etapas) - 1:
            celulas.append(Paragraph('<font color="#E3A21A" size="13"><b>»</b></font>',
                                     ParagraphStyle('sx', parent=S['celula'], alignment=TA_CENTER)))
    n = len(etapas)
    largura_seta = 0.55
    largura_etapa = (16.8 - largura_seta * (n - 1)) / n
    larguras = []
    for i in range(len(celulas)):
        larguras.append((largura_etapa if i % 2 == 0 else largura_seta) * cm)
    t = Table([celulas], colWidths=larguras)
    estilo = [('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 3), ('RIGHTPADDING', (0, 0), (-1, -1), 3)]
    for i in range(0, len(celulas), 2):
        estilo += [('BACKGROUND', (i, 0), (i, 0), AZUL_CLARO), ('BOX', (i, 0), (i, 0), 0.6, AZUL),
                   ('TOPPADDING', (i, 0), (i, 0), 6), ('BOTTOMPADDING', (i, 0), (i, 0), 6)]
    t.setStyle(TableStyle(estilo))
    return KeepTogether([Spacer(1, 4), t, Spacer(1, 8)])


# ---------------------------------------------------------------------------
# Conteudo
# ---------------------------------------------------------------------------
def conteudo():
    h = []

    # ---- Indice
    h.append(NextPageTemplate('conteudo'))
    h.append(PageBreak())
    h.append(Paragraph('Índice', ParagraphStyle('titulo_indice', parent=S['h1'])))  # fora do proprio indice
    indice = TableOfContents()
    indice.levelStyles = [S['toc1'], S['toc2']]
    indice.dotsMinLevel = 0
    h.append(indice)
    h.append(PageBreak())

    # =====================================================================
    h.append(p('1. Como usar este manual', 'h1'))
    h.append(p('Este manual serve dois públicos: o <b>formador</b>, que o usa para preparar e conduzir as sessões, '
               'e os <b>utilizadores</b>, que o podem consultar depois da formação. Cada módulo da plataforma é '
               'explicado com o objectivo, quem o usa e os passos a seguir, seguidos de exercícios práticos.'))
    h.append(p('Objectivos da formação', 'h2'))
    h += lista([
        'Entrar na plataforma com segurança e personalizar o perfil (dados pessoais, password, assinatura).',
        'Perceber o que cada perfil vê e porquê — o menu depende das permissões atribuídas a cada role.',
        'Executar, sem ajuda, as tarefas do dia-a-dia do seu perfil (submeter, aprovar, autorizar, pagar, registar).',
        'Saber onde procurar quando algo não aparece ou não funciona (perguntas frequentes no fim do manual).',
    ])
    h.append(p('Plano de sessões sugerido', 'h2'))
    h.append(tabela(
        ['Sessão', 'Público', 'Conteúdo', 'Duração'],
        [
            ['1. Introdução comum', 'Todos', 'Acesso, menu, perfil, mensagens, notificações, agenda (capítulos 2 a 4)', '1h'],
            ['2. Atendimento e gabinetes', 'Secretaria, Administrativo, Gabinetes', 'Solicitações, reuniões internas, salas, actas, comunicação interna (5 a 8)', '2h'],
            ['3. Compras e DSG', 'Compras, DSG Técnico', 'Fornecedores, pedidos de Procurement, cotações, Autorização de Despesas (9)', '2h'],
            ['4. Pagamentos', 'Financeiro, Gabinetes, Compras, DSG', 'Gestão de Pagamento, Ordens de Pagamento, Mapa de Impostos e de Actividades (10 a 12)', '2h'],
            ['5. Fornecedores externos', 'Fornecedores', 'Portal do fornecedor: cotações, facturas, coordenadas bancárias (13)', '45 min'],
            ['6. Administração', 'Administrador do Sistema / TI', 'Utilizadores, roles e permissões, auditoria, licença, cópias de segurança (14)', '2h'],
        ],
        [3.6, 3.8, 7.6, 1.8],
    ))
    h.append(Spacer(1, 6))
    h.append(caixa('preparação', [
        'Antes da sessão, crie uma conta de formação para cada participante com o <b>perfil real</b> que vai usar, '
        'e uma conta "fornecedor de teste" para simular o portal externo.',
        'Use um ambiente de formação (cópia da base de dados) sempre que possível: os exercícios criam pedidos, '
        'facturas e aprovações que ficam registados na Auditoria.',
        'Projecte o ecrã e peça a cada participante que repita o passo no seu computador antes de avançar.',
    ], 'formador'))

    # =====================================================================
    h.append(p('2. Primeiros passos', 'h1'))
    h.append(p('2.1 Aceder à plataforma', 'h2'))
    h.append(p('O SIPAR-FADA funciona no navegador (Chrome, Edge ou Firefox actualizados). O endereço é indicado '
               'pela equipa de TI. Também pode ser instalado como aplicação (PWA): no Chrome/Edge, use o ícone '
               '"Instalar aplicação" na barra de endereço.'))
    h += passos([
        'Abra o endereço da plataforma.',
        'Introduza o <b>e-mail</b> e a <b>password</b> fornecidos pelo Administrador do Sistema.',
        'Clique em <b>Entrar</b>. A primeira página é o <b>Dashboard</b>, com o resumo do seu trabalho.',
    ])
    h.append(caixa('', 'No primeiro acesso, mude a password em <b>Meu Perfil</b>. Nunca partilhe a sua conta: '
                       'todas as acções ficam registadas na Auditoria em seu nome.', 'atencao'))
    h.append(p('2.2 Recuperar a password', 'h2'))
    h += passos([
        'No ecrã de entrada, clique em <b>Esqueceu a senha?</b>.',
        'Introduza o seu e-mail e siga a ligação recebida por e-mail.',
        'Se não receber o e-mail, contacte o Administrador do Sistema.',
    ])
    h.append(p('2.3 O ecrã principal', 'h2'))
    h += lista([
        '<b>Menu lateral</b> (à esquerda): os módulos a que o seu perfil tem acesso. Só aparece o que pode usar.',
        '<b>Pesquisa</b> (topo): procura em todo o sistema.',
        '<b>Sino</b> (topo direito): notificações — pedidos para aprovar, documentos recebidos, prazos.',
        '<b>O seu nome</b> (topo do menu): abre <b>Meu Perfil</b>.',
        '<b>Sair</b> (fundo do menu): termina a sessão. Use-o sempre em computadores partilhados.',
    ])
    h.append(p('2.4 Meu Perfil', 'h2'))
    h.append(tabela(
        ['Secção', 'Para que serve'],
        [
            ['Dados pessoais', 'Nome, telefone e organização/departamento.'],
            ['Assinatura digitalizada', 'Presidente, Administrador e outros signatários carregam a imagem da assinatura, usada automaticamente em actas, Autorizações de Despesas e Ordens de Pagamento.'],
            ['Trocar Password', 'Indique a password actual e a nova (mínimo 6 caracteres), duas vezes.'],
        ],
        [4.5, 12.3],
    ))
    h.append(p('As <b>coordenadas bancárias</b> dos fornecedores gerem-se no cadastro do fornecedor (Procurement) ou, '
               'no caso do fornecedor externo, no próprio formulário da factura. O IBAN tem exactamente 25 caracteres '
               '(AO + 23 dígitos) e o NIB 21 dígitos: o sistema não aceita mais nem menos.'))

    # =====================================================================
    h.append(p('3. Perfis e o que cada um vê', 'h1'))
    h.append(p('Cada utilizador tem um <b>role</b> (perfil). O Administrador do Sistema define, no ecrã '
               '<b>Roles e Permissões</b>, o que cada role pode ver e fazer. Por isso dois colegas podem ver menus '
               'diferentes. A tabela mostra a configuração habitual.'))
    h.append(tabela(
        ['Perfil', 'Exemplos de role', 'Menu habitual'],
        [
            ['Gabinetes executivos', 'PCA, PCE, Administrador, Director, Ministro', 'Dashboard, Gestão de Solicitações, Agenda, Reuniões Internas, Salas de Reunião, Livro de Actas, Comunicação Interna, Procurement (DSG), Gestão de Pagamento, Mapa de Impostos, Mapa de Actividades, Relatórios Departamentais'],
            ['Gestão / Operacional', 'Gestão, Compras, RH, Jurídico, TI, Operações', 'Dashboard, Gestão de Solicitações, Agenda, Livro de Actas, Comunicação Interna, Procurement (DSG), Gestão de Pagamento, Mapas'],
            ['Financeiro', 'Financeiro', 'Dashboard, Agenda, Gestão de Pagamento, Mapa de Impostos, Mapa de Actividades'],
            ['Atendimento', 'Secretaria, Administrativo, Segurança', 'Dashboard, Gestão de Solicitações, Agenda, Reuniões Internas, Salas de Reunião'],
            ['DSG Técnico', 'DSG Técnico', 'Dashboard, Agenda, Procurement (DSG), Gestão de Pagamento, Mapas (conforme permissões)'],
            ['Utilizador externo / Fornecedor', 'Externo', 'Nova Carta de Apresentação, Nova Audiência, Minhas Solicitações, Agenda, Minhas Facturas, Cotações'],
            ['Administrador do Sistema', 'admin_sistema', 'Utilizadores, Departamentos, Áreas, Roles e Permissões, Auditoria, E-mail, Licença, Lixeira, Base de Dados, Diagnóstico, Configurações'],
        ],
        [3.6, 4.4, 8.8],
    ))
    h.append(Spacer(1, 6))
    h.append(caixa('', 'Se um utilizador diz que "falta um botão" ou "falta um menu", a causa quase sempre é a '
                       'permissão do role. O Administrador do Sistema corrige em <b>Roles e Permissões</b> e o utilizador '
                       'tem de sair e voltar a entrar.', 'formador'))

    # =====================================================================
    h.append(p('4. Funções comuns', 'h1'))
    h.append(p('4.1 Dashboard', 'h2'))
    h.append(p('Mostra os indicadores do seu perfil: pedidos pendentes, facturas por aprovar, reuniões próximas, '
               'atalhos para os módulos que usa. Clique num indicador para ir directamente à lista.'))
    h.append(p('4.2 Agenda', 'h2'))
    h.append(p('Calendário com audiências agendadas, reuniões internas e prazos. Clique num evento para ver os '
               'detalhes ou abrir a acta associada.'))
    h.append(p('4.3 Mensagens', 'h2'))
    h.append(p('Mensagens internas entre utilizadores da plataforma. Escolha o destinatário, escreva e envie; '
               'as respostas aparecem na mesma conversa.'))
    h.append(p('4.4 Notificações Push', 'h2'))
    h.append(p('Active as notificações para ser avisado mesmo com a plataforma fechada (o navegador pede '
               'autorização). Recomendado para quem aprova ou autoriza documentos.'))

    # =====================================================================
    h.append(p('5. Solicitações: Cartas de Apresentação e Audiências', 'h1'))
    h.append(p('Entidades externas apresentam-se à FADA (Carta de Apresentação) ou pedem para ser recebidas '
               '(Pedido de Audiência). O atendimento e os gabinetes tratam estes pedidos em '
               '<b>Gestão de Solicitações</b>.'))
    h.append(fluxo([('Submissão', 'Utilizador externo'), ('Análise', 'Secretaria / Gabinete'),
                    ('Agendar, delegar ou rejeitar', 'Secretaria / Gabinete'), ('Agenda e resposta', 'Automático')]))
    h.append(p('5.1 Submeter (utilizador externo)', 'h2'))
    h += passos([
        'No menu, clique em <b>Nova Carta de Apresentação</b> ou <b>Nova Audiência</b>.',
        'Preencha a organização, o assunto, a pessoa a contactar e anexe documentos, se houver.',
        'Clique em <b>Submeter</b>. O estado do pedido fica visível em <b>Minhas Solicitações</b>.',
    ])
    h.append(p('5.2 Tratar (secretaria e gabinetes)', 'h2'))
    h += passos([
        'Abra <b>Gestão de Solicitações</b> e seleccione o pedido.',
        'Leia os detalhes e os anexos.',
        'Escolha a acção: <b>Agendar Reunião</b> (marca data, hora e sala — aparece na Agenda), '
        '<b>Delegar</b> (envia a outro departamento/pessoa) ou <b>Rejeitar</b> (indique o motivo).',
        'O requerente é notificado da decisão.',
    ])

    # =====================================================================
    h.append(p('6. Reuniões Internas e Salas de Reunião', 'h1'))
    h += passos([
        'Em <b>Reuniões Internas</b>, clique em <b>Nova reunião</b>.',
        'Defina título, data, hora, duração, participantes (internos ou externos, por e-mail) e a sala.',
        'Se a reunião for online, gere o link da plataforma de videoconferência configurada.',
        'Os participantes recebem convite e a reunião aparece na Agenda.',
    ])
    h.append(p('Em <b>Salas de Reunião</b> o atendimento gere as salas disponíveis e vê a ocupação; o sistema avisa '
               'quando uma sala já está ocupada no mesmo horário.'))

    # =====================================================================
    h.append(p('7. Livro de Actas', 'h1'))
    h += passos([
        'Em <b>Livro de Actas</b>, clique em <b>Nova acta</b> e escolha o tipo de reunião (ordinária ou extraordinária).',
        'Registe participantes, ordem de trabalhos, deliberações e anexos.',
        'Grave como rascunho enquanto edita.',
        'Cada participante com assinatura digitalizada <b>assina</b> a acta.',
        'Depois de todas as assinaturas, <b>finalize</b>: a acta fica fechada e pode ser descarregada em PDF.',
    ])
    h.append(caixa('', 'Uma acta finalizada não pode ser alterada. Confirme o conteúdo antes de finalizar.', 'atencao'))

    # =====================================================================
    h.append(p('8. Comunicação Interna', 'h1'))
    h.append(p('Circula ofícios e comunicações entre departamentos, com prioridade (Normal, Alta, Urgente).'))
    h.append(fluxo([('Pendente', 'Remetente envia'), ('Em Análise', 'Destinatário abre'),
                    ('Despachado', 'Responsável despacha'), ('Arquivado', 'Fecho')]))
    h += passos([
        'Crie a comunicação: destinatário, assunto, prioridade, texto e anexos.',
        'O destinatário analisa e, quem tem competência, escreve o <b>despacho</b> e clica em <b>Despachar</b>.',
        'Quando o assunto está encerrado, a comunicação é arquivada.',
    ])

    # =====================================================================
    h.append(PageBreak())
    h.append(p('9. Procurement (DSG): compras com cotações', 'h1'))
    h.append(p('O módulo <b>Procurement (DSG)</b> trata as compras da FADA desde o pedido até à recepção, com '
               'comparação de cotações de vários fornecedores.'))
    h.append(fluxo([('Pedido', 'Departamento / DSG'), ('Publicação', 'Compras / DSG'), ('Cotações', 'Fornecedores ou DSG'),
                    ('Análise', 'Compras'), ('Aprovação', 'Compras'), ('Recepção', 'Compras')]))
    h.append(p('9.1 Fornecedores', 'h2'))
    h += passos([
        'Em Procurement, clique em <b>Fornecedores</b> e depois em <b>Novo Fornecedor</b>.',
        'Introduza o <b>NIF</b>: o sistema consulta a AGT e preenche o nome oficial.',
        'Indique contactos, categorias de produtos/serviços que fornece e as coordenadas bancárias '
        '(IBAN com 25 caracteres, NIB com 21 dígitos).',
        'Grave. O fornecedor recebe por e-mail as credenciais para o portal de fornecedores.',
    ])
    h.append(p('9.2 Criar e publicar um pedido', 'h2'))
    h += passos([
        'Clique em <b>Novo Pedido</b>: título, descrição, categoria, departamento solicitante, prioridade, '
        'orçamento estimado, prazo e local de entrega.',
        'Acrescente os <b>itens</b> (descrição, tipo — material, serviço, equipamento, ... — quantidade e unidade).',
        'Grave. O pedido fica <b>Criado</b>; enquanto ninguém actuou sobre ele pode ser editado, anulado ou eliminado.',
        'Clique em <b>Publicar para Fornecedores</b>: os fornecedores da categoria recebem o convite por e-mail. '
        'O pedido passa a <b>Aguardando Cotações</b>.',
    ])
    h.append(p('9.3 Cotações', 'h2'))
    h += lista([
        'Os fornecedores respondem no seu portal, item a item (disponibilidade, quantidade, preço, IVA, prazo, condições).',
        'A DSG pode <b>Registar Cotação</b> em nome de um fornecedor (por exemplo, proposta recebida em papel): '
        'escolhe o fornecedor e preenche o mesmo formulário.',
        '<b>Cada fornecedor só pode ter uma cotação por pedido.</b> Para corrigir, edite ou anule a existente.',
        'Quem registou uma cotação pode editá-la, anulá-la ou eliminá-la enquanto o pedido não for analisado.',
    ])
    h.append(p('9.4 Análise, aprovação e Autorização de Despesas', 'h2'))
    h += passos([
        'Com cotações recebidas, Compras clica em <b>Analisar Cotações</b>: o sistema ordena por preço e mostra '
        'pontuações (preço, prazo, disponibilidade).',
        'Compras escolhe a melhor proposta e clica em <b>Aprovar Esta Cotação</b>.',
        'É emitida automaticamente a <b>Autorização de Despesas</b> (número <b>AD/ano/mês/nnnn</b>), que pode ser '
        'visualizada e descarregada em PDF.',
        'Quando os bens/serviços chegam, Compras clica em <b>Confirmar Receção</b>: a factura é criada '
        'automaticamente na Gestão de Pagamento, já aprovada pela DSG.',
    ])
    h.append(caixa('', 'O botão <b>Registar Cotação</b> só aparece em pedidos publicados ("Aguardando Cotações" ou '
                       '"Em Cotação"). Se não houver nenhum pedido aberto, o sistema mostra um aviso a explicar.', 'dica'))

    # =====================================================================
    h.append(p('10. Gestão de Pagamento', 'h1'))
    h.append(p('Concentra todas as facturas — as geradas pelo Procurement e as registadas directamente — e '
               'acompanha-as até ao pagamento. Cada separador e cada passo do fluxo depende das permissões do seu role.'))
    h.append(fluxo([('Pendente', 'Factura registada'), ('Aprovado-DSG', 'Aprovar factura pendente'),
                    ('Autorização de Despesas', 'Autorizar despesa'), ('Ordem de Pagamento', 'Pagamento + assinaturas'),
                    ('Submetido ao Banco', 'Pagamento'), ('Pago', 'Pagamento')]))
    h.append(p('10.1 Separadores', 'h2'))
    h.append(tabela(
        ['Separador', 'O que mostra'],
        [
            ['Dashboard', 'Totais por estado e valores.'],
            ['Todas', 'Todas as facturas, com pesquisa e filtros.'],
            ['Pendentes', 'Facturas à espera da aprovação da DSG.'],
            ['Aprovados-DSG', 'Facturas aprovadas pela DSG, à espera da autorização da despesa.'],
            ['Autorização de Despesas', 'Despesas autorizadas, à espera da Ordem de Pagamento.'],
            ['Ordens de Pagamento Fornecedor', 'Ordens geradas, com o estado das assinaturas.'],
            ['Ordens de Pagamento Interna', 'Pagamentos internos (a pessoas, departamentos ou entidades).'],
            ['Submetido ao Banco', 'Ordens enviadas ao banco, à espera da confirmação.'],
            ['Pagos', 'Facturas pagas, com comprovativo.'],
            ['Mapa de Impostos / Mapa de Actividades', 'Relatórios (capítulos 11 e 12).'],
        ],
        [5.2, 11.6],
    ))
    h.append(p('10.2 Registar uma factura ou proforma', 'h2'))
    h += passos([
        'Clique em <b>Nova Factura</b>.',
        'Escolha o fornecedor da lista. Se não estiver cadastrado, use "O fornecedor não está na lista?" e '
        'introduza o NIF (consulta à AGT).',
        'Se o fornecedor não tiver coordenadas bancárias, clique para as adicionar (IBAN 25 caracteres, NIB 21 dígitos).',
        'Indique o tipo (Mercadoria, Serviço ou Ambos) e o <b>Documento</b>: Factura ou <b>Factura Proforma</b>.',
        'Preencha datas, itens (quantidade, preço, produto ou serviço, IVA) — o sistema calcula IVA, '
        'retenção na fonte e valor final.',
        'Anexe a factura digitalizada (PDF, JPG ou PNG, até 10 MB) e clique em <b>Registar Factura</b>.',
    ])
    h.append(caixa('', 'Enquanto ninguém actuou sobre a factura, quem a registou pode <b>Editar</b>, <b>Anular</b> '
                       'ou <b>Eliminar</b> nos detalhes. Depois da aprovação da DSG, só o fluxo normal continua.', 'nota'))
    h.append(p('10.3 Aprovar, autorizar e pagar', 'h2'))
    h.append(tabela(
        ['Passo', 'Onde', 'Botão', 'Quem (configurável)'],
        [
            ['Aprovar factura pendente', 'Pendentes', 'Aprovar-DSG', 'Compras / DSG'],
            ['Autorizar despesa', 'Aprovados-DSG', 'Autorizar / Rejeitar', 'Gabinetes (PCA, PCE, Administrador, Director, Gestão)'],
            ['Gerar Ordem de Pagamento', 'Autorização de Despesas', 'Gerar Ordem de Pagamento', 'Financeiro'],
            ['Assinar a Ordem de Pagamento', 'Ordens de Pagamento', 'Assinar', 'Presidente e Administrador'],
            ['Submeter ao banco', 'Ordens de Pagamento', 'Submeter ao Banco', 'Financeiro'],
            ['Marcar como pago', 'Submetido ao Banco', 'Marcar como Pago (anexar comprovativo)', 'Financeiro'],
        ],
        [4.0, 3.5, 4.3, 5.0],
    ))
    h.append(Spacer(1, 6))
    h.append(caixa('', 'A Ordem de Pagamento só pode ser submetida ao banco depois de assinada pelo Presidente '
                       '<b>e</b> pelo Administrador.', 'atencao'))

    # =====================================================================
    h.append(p('11. Mapa de Impostos', 'h1'))
    h.append(p('Relatório do IVA cativo e da retenção na fonte de todas as facturas, com filtros por datas, tipo, '
               'origem e estado, e exportação em CSV.'))
    h.append(tabela(
        ['Imposto', 'Aplica-se a', 'Taxas'],
        [
            ['IVA cativo', 'Produtos / mercadorias', '14% (geral), 7%, 5% e 2% — retido e entregue à AGT, não é pago ao fornecedor'],
            ['Retenção na fonte', 'Serviços', '6,5%'],
        ],
        [3.5, 4.0, 9.3],
    ))
    h.append(p('Valor Final a Pagar = valor bruto menos IVA cativo e menos retenção. Clique numa linha para '
               'abrir a factura.'))

    h.append(p('12. Mapa de Actividades (DSG)', 'h1'))
    h.append(p('Reproduz o modelo oficial da DSG — folhas Resumo, Serviços Adquiridos, Bens Adquiridos, Guia de '
               'Preenchimento e Listas — preenchido automaticamente a partir das facturas.'))
    h += passos([
        'Escolha o mês (ou "Todo o ano") e o ano; complete a identificação (Direcção, Elaborado por, Aprovado por).',
        'Use o ícone de <b>filtro</b> para filtrar por categoria, fornecedor, centro de custo, estado, tipo de '
        'documento (VFA/VFAP), pagamento, datas, valores ou pesquisa livre.',
        'Com permissão de edição, complete o que o sistema não sabe (por exemplo, Código do artigo DSG0001 ou '
        'Bem / Imobilizado) no lápis de cada linha.',
        'Clique em <b>Descarregar .xlsx</b>: o ficheiro sai no modelo oficial, com o logótipo do FADA. Consultas e '
        'exportações ficam registadas na Auditoria.',
    ])

    # =====================================================================
    h.append(p('13. Portal do Fornecedor', 'h1'))
    h.append(p('Os fornecedores entram com as credenciais recebidas por e-mail e vêem um menu próprio.'))
    h += lista([
        '<b>Cotações</b>: pedidos abertos da sua categoria. Clique em <b>Submeter Cotação</b>, responda item a item e anexe a proforma. '
        'Só é possível uma cotação por pedido.',
        '<b>Minhas Facturas</b>: submeter facturas ou proformas e acompanhar o estado até ao pagamento.',
        '<b>Coordenadas bancárias</b>: ao submeter uma factura, escolha a conta onde quer receber — pode guardar várias e escolher a usar em cada factura.',
    ])

    # =====================================================================
    h.append(p('14. Administração do Sistema', 'h1'))
    h.append(p('Exclusivo do role <b>Administrador do Sistema</b> (TI).'))
    h.append(tabela(
        ['Menu', 'O que se faz'],
        [
            ['Utilizadores', 'Criar, editar, activar/desactivar contas e atribuir o role (incluindo "Perfis especiais", como DSG Técnico).'],
            ['Gestão de Departamentos / Áreas', 'Estrutura orgânica usada nos pedidos, centros de custo e relatórios.'],
            ['Roles e Permissões', 'Matriz de permissões por role: módulos, separadores visíveis da Gestão de Pagamento e passos do fluxo da factura.'],
            ['Auditoria & Segurança', 'Registo de todas as acções (quem, quando, o quê, IP), incluindo tentativas sem permissão.'],
            ['Gerenciamento Email', 'Configuração do servidor de e-mail e modelos de mensagens.'],
            ['Gestão de Licença', 'Activação e estado da licença da instalação.'],
            ['Lixeira', 'Registos eliminados, que podem ser restaurados ou apagados definitivamente.'],
            ['Gestão do Banco de Dados', 'Cópias de segurança (criar e descarregar).'],
            ['Diagnóstico do Sistema', 'Estado do servidor, da base de dados e das integrações.'],
        ],
        [4.8, 12.0],
    ))
    h.append(p('14.1 Roles e Permissões', 'h2'))
    h += passos([
        'Escolha o role na lista.',
        'Marque as acções por módulo: Criar, Ler (todos), Ler (próprios), Editar, Eliminar, Aprovar, Rejeitar, Gerir, '
        'Exportar, Editar/anular próprios (sem acção), Eliminar próprios (sem acção).',
        'Na secção <b>Gestão de Pagamento — separadores visíveis</b>, marque "Ler" nos separadores que o role deve ver.',
        'Na secção <b>acções no fluxo da factura</b>, marque "Aprovar" em: Aprovar factura pendente, Autorizar despesa, Pagamento.',
        'Clique em <b>Guardar</b>. O utilizador tem de sair e voltar a entrar para ver as alterações.',
    ])
    h.append(caixa('', 'Atribua apenas o necessário. Por segurança, evite que o mesmo role aprove a factura pendente '
                       'e autorize a despesa.', 'atencao'))

    # =====================================================================
    h.append(PageBreak())
    h.append(p('15. Exercícios práticos', 'h1'))
    h.append(p('Cada exercício indica o perfil, os passos e o resultado esperado. Faça-os por ordem: os exercícios '
               '3 a 6 seguem o mesmo processo de compra até ao pagamento.'))
    exercicios = [
        ('1. Primeiro acesso', 'Todos', 'Entrar, trocar a password em Meu Perfil, activar notificações, sair e voltar a entrar.',
         'Entra com a nova password e recebe notificações.'),
        ('2. Pedido de audiência', 'Externo + Secretaria', 'O externo submete uma audiência; a secretaria agenda-a com data e sala.',
         'A audiência aparece na Agenda e o externo vê o estado "agendado".'),
        ('3. Fornecedor e pedido', 'Compras / DSG', 'Cadastrar um fornecedor (consulta de NIF), criar um pedido com 2 itens e publicá-lo.',
         'Pedido em "Aguardando Cotações"; fornecedor recebe o convite.'),
        ('4. Cotações', 'Fornecedor + DSG', 'O fornecedor cota no portal; a DSG regista a cotação de um 2.º fornecedor. Tente registar outra para o mesmo fornecedor.',
         'Duas cotações no pedido; a 3.ª é recusada ("já tem uma cotação").'),
        ('5. Aprovação e AD', 'Compras', 'Analisar, aprovar a melhor cotação, abrir a Autorização de Despesas (PDF) e confirmar a recepção.',
         'AD com número AD/...; factura criada em Aprovados-DSG.'),
        ('6. Autorizar e pagar', 'Gabinete + Financeiro + Presidente/Administrador', 'Autorizar a despesa, gerar a Ordem de Pagamento, assinar, submeter ao banco e marcar como pago.',
         'Factura no separador "Pagos" com comprovativo.'),
        ('7. Factura directa', 'DSG / Financeiro', 'Registar uma proforma com anexo; editá-la; anulá-la. Registar outra e eliminá-la.',
         'Edição, anulação e eliminação só possíveis enquanto ninguém actuou.'),
        ('8. Relatórios', 'Compras / Financeiro', 'Filtrar o Mapa de Actividades do mês por fornecedor e descarregar o .xlsx; abrir o Mapa de Impostos.',
         'Ficheiro com só as linhas filtradas e o logótipo; registo na Auditoria.'),
        ('9. Permissões', 'Administrador do Sistema', 'Retirar ao DSG Técnico o separador "Pagos"; entrar como DSG e confirmar; repor.',
         'O separador desaparece e volta a aparecer.'),
    ]
    h.append(tabela(['Exercício', 'Perfil', 'Passos', 'Resultado esperado'],
                    [list(e) for e in exercicios], [3.2, 3.0, 6.0, 4.6]))

    # =====================================================================
    h.append(p('16. Perguntas frequentes', 'h1'))
    faq = [
        ('Não vejo um menu, separador ou botão.', 'O seu role não tem essa permissão. Peça ao Administrador do Sistema para a atribuir em Roles e Permissões e depois saia e volte a entrar.'),
        ('O sistema diz que o IBAN ou o NIB é inválido.', 'O IBAN tem exactamente 25 caracteres (AO + 23 dígitos) e o NIB 21 dígitos. Os espaços são colocados automaticamente.'),
        ('Não consigo trocar o IBAN de um fornecedor.', 'Se o fornecedor já tem coordenadas, só quem gere fornecedores (Compras) as pode alterar.'),
        ('O botão "Registar Cotação" não aparece.', 'O pedido tem de estar publicado ("Aguardando Cotações" ou "Em Cotação").'),
        ('"O fornecedor já tem uma cotação neste pedido".', 'Cada fornecedor só pode ter uma cotação por pedido. Edite ou anule a existente.'),
        ('Não consigo editar ou eliminar a minha factura.', 'Só é possível enquanto está pendente e ninguém actuou sobre ela. Depois disso segue o fluxo normal.'),
        ('Não consigo submeter a Ordem de Pagamento ao banco.', 'Faltam assinaturas: a ordem precisa da assinatura do Presidente e do Administrador.'),
        ('A sessão terminou sozinha.', 'Por segurança, as sessões expiram. Volte a entrar; o trabalho gravado não se perde.'),
        ('Não recebo e-mails da plataforma.', 'Verifique a pasta de spam e confirme o e-mail em Meu Perfil; se persistir, contacte a TI.'),
    ]
    h.append(tabela(['Situação', 'O que fazer'], [list(f) for f in faq], [6.0, 10.8]))

    h.append(p('17. Boas práticas e segurança', 'h1'))
    h += lista([
        'Use uma password forte e pessoal; nunca a partilhe nem a escreva em papel.',
        'Saia sempre (botão <b>Sair</b>) em computadores partilhados.',
        'Confirme valores, NIF e IBAN antes de aprovar ou pagar: as decisões ficam registadas em seu nome.',
        'Anexe sempre o documento original (factura, proforma, comprovativo) — facilita auditorias.',
        'Em caso de erro, anule em vez de criar um documento duplicado.',
    ])

    # =====================================================================
    h.append(p('18. Glossário', 'h1'))
    glossario = [
        ('AD', 'Autorização de Despesas — documento emitido ao aprovar uma cotação no Procurement, ou quando a DSG aprova uma factura registada directamente (numeração AD/ano/mês/nnnn).'),
        ('Aprovado-DSG', 'Factura verificada e aprovada pela DSG (Direcção de Serviços Gerais).'),
        ('Cotação', 'Proposta de preço de um fornecedor para um pedido de Procurement.'),
        ('DSG', 'Direcção de Serviços Gerais.'),
        ('IVA cativo', 'IVA retido pela FADA e entregue directamente à AGT.'),
        ('NIF', 'Número de Identificação Fiscal; consultado automaticamente na AGT.'),
        ('IBAN / NIB', 'Identificação da conta bancária: IBAN com 25 caracteres, NIB com 21 dígitos.'),
        ('OP', 'Ordem de Pagamento — documento assinado pelo Presidente e pelo Administrador antes de ir ao banco.'),
        ('Proforma (VFAP)', 'Factura provisória, aceite para cotação/aprovação prévia; VFA é a factura definitiva.'),
        ('Retenção na fonte', '6,5% retido sobre facturas de serviços.'),
        ('Role', 'Perfil de acesso de um utilizador; define menus, separadores e acções permitidas.'),
    ]
    h.append(tabela(['Termo', 'Significado'], [list(g) for g in glossario], [3.6, 13.2]))

    # =====================================================================
    h.append(PageBreak())
    h.append(p('19. Registo da formação', 'h1'))
    h.append(p('Sessão: ______________________________  Data: ____/____/______  Formador: ______________________________'))
    h.append(Spacer(1, 6))
    presencas = [['%d' % i, '', '', '', ''] for i in range(1, 16)]
    t = tabela(['N.º', 'Nome', 'Departamento / Perfil', 'E-mail', 'Assinatura'], presencas, [1.0, 4.6, 3.8, 4.0, 3.4], zebra=False)
    h.append(t)
    h.append(Spacer(1, 14))
    h.append(p('Avaliação da sessão (1 = fraco, 5 = excelente)', 'h2'))
    avaliacao = [[q, '1', '2', '3', '4', '5'] for q in [
        'Clareza das explicações', 'Utilidade para o meu trabalho', 'Tempo para praticar',
        'Material de apoio (este manual)', 'Confiança para usar a plataforma sozinho(a)',
    ]]
    h.append(tabela(['Aspecto', '1', '2', '3', '4', '5'], avaliacao, [9.3, 1.5, 1.5, 1.5, 1.5, 1.5], zebra=False))
    h.append(Spacer(1, 10))
    h.append(p('Comentários e sugestões: ________________________________________________________________________'))
    h.append(p('______________________________________________________________________________________________'))
    return h


def main():
    doc = Manual(SAIDA)
    historia = [Spacer(1, 1)] + conteudo()
    doc.multiBuild(historia)
    print('Manual gerado:', SAIDA)


if __name__ == '__main__':
    main()
