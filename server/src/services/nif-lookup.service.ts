import { Agent, fetch } from 'undici';
import logger from '../config/logger';

/**
 * Consulta o NIF de um contribuinte no Portal do Contribuinte da AGT
 * (portaldocontribuinte.minfin.gov.ao). NÃO é uma API REST/JSON - é uma
 * aplicação JSF/PrimeFaces antiga, sem endpoint oficial documentado. O fluxo
 * (validado manualmente contra o portal real):
 *
 *   1. GET à página de consulta -> devolve cookies de sessão (JSESSIONID) e
 *      um token "javax.faces.ViewState" (obrigatório, muda a cada sessão).
 *   2. POST (form-urlencoded, pedido AJAX do JSF) ao endpoint de consulta,
 *      com os mesmos cookies + o ViewState obtido, e o NIF no campo
 *      "j_id_2x:txtNIFNumber". Os restantes nomes de campos são fixos
 *      (identificadores do componente JSF, confirmados estáveis entre
 *      sessões distintas).
 *   3. A resposta é XML (formato "partial-response" do JSF/PrimeFaces) com
 *      um fragmento HTML lá dentro (painel de resultado, ou uma mensagem
 *      "NIF não encontrado" quando não existe).
 *
 * Isto é scraping de um portal público do governo, não uma integração
 * oficial - por isso NUNCA deve bloquear o resto do sistema: qualquer falha
 * (portal em baixo, formato mudou, timeout, NIF não encontrado) devolve
 * `encontrado: false` com uma mensagem, e quem chama despacha para
 * preenchimento manual.
 */

const BASE_URL = 'https://portaldocontribuinte.minfin.gov.ao';
const PAGINA_CONSULTA = `${BASE_URL}/consultar-nif-do-contribuinte`;
const ENDPOINT_AJAX = `${BASE_URL}/consultar-headNifId-do-contribuinte`;
const TIMEOUT_MS = 15000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

// Alguns ambientes (incluindo, por vezes, o próprio portal da AGT) falham a
// verificação da cadeia de certificado TLS ("unable to verify the first
// certificate") mesmo sendo o site legítimo - problema conhecido em
// infraestrutura .gov.ao, e reproduzido neste projecto atrás de um proxy que
// intercepta HTTPS. Por omissão a verificação fica ligada (seguro); só é
// desligada, e só para este pedido especifico (nunca globalmente), quando
// AGT_TLS_INSECURE=true estiver definido no ambiente do servidor.
const dispatcher = process.env.AGT_TLS_INSECURE === 'true'
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

export interface DadosNif {
  nif: string;
  nome: string;
  tipo: string; // "SINGULAR" | "COLECTIVO" | ...
  estado: string; // "Activo" | ...
  inadimplente: string;
  regime_iva: string;
  residente: string;
}

export interface ResultadoConsultaNif {
  encontrado: boolean;
  dados?: DadosNif;
  mensagem?: string;
}

async function obterSessaoEViewState(): Promise<{ cookies: string; viewState: string } | null> {
  const resposta = await fetch(PAGINA_CONSULTA, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...(dispatcher ? { dispatcher } as any : {}),
  });
  if (!resposta.ok) return null;

  const cookiesBrutos = typeof (resposta.headers as any).getSetCookie === 'function'
    ? (resposta.headers as any).getSetCookie()
    : [resposta.headers.get('set-cookie')].filter(Boolean);
  const cookies = cookiesBrutos.map((c: string) => c.split(';')[0]).join('; ');

  const html = await resposta.text();
  const viewState = html.match(/javax\.faces\.ViewState[^>]*value="([^"]*)"/)?.[1];

  if (!cookies || !viewState) return null;
  return { cookies, viewState };
}

/** Extrai, por ordem de aparição, os valores do painel de resultado (7 campos fixos: NIF, Nome, Tipo, Estado, Inadimplente, Regime de IVA, Residente). */
function extrairValores(html: string): string[] {
  const valores: string[] = [];
  const regex = /<div class="col-sm-6"><label[^>]*>([^<]*)<\/label>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    valores.push(m[1].trim());
  }
  return valores;
}

export async function consultarNif(nifBruto: string): Promise<ResultadoConsultaNif> {
  const nif = (nifBruto || '').trim().toUpperCase();
  if (!nif) return { encontrado: false, mensagem: 'NIF vazio' };

  try {
    const sessao = await obterSessaoEViewState();
    if (!sessao) {
      return { encontrado: false, mensagem: 'Não foi possível iniciar sessão no Portal do Contribuinte (AGT)' };
    }

    const corpo = new URLSearchParams({
      'javax.faces.partial.ajax': 'true',
      'javax.faces.source': 'j_id_2x:j_id_34',
      'javax.faces.partial.execute': 'j_id_2x',
      'javax.faces.partial.render': 'showpanelNIF',
      'j_id_2x:j_id_34': 'j_id_2x:j_id_34',
      'j_id_2x:txtNIFNumber': nif,
      j_id_2x_SUBMIT: '1',
      'javax.faces.ViewState': sessao.viewState,
    });

    const resposta = await fetch(ENDPOINT_AJAX, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Faces-Request': 'partial/ajax',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: PAGINA_CONSULTA,
        Cookie: sessao.cookies,
        'User-Agent': USER_AGENT,
      },
      body: corpo.toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(dispatcher ? { dispatcher } as any : {}),
    });

    if (!resposta.ok) {
      return { encontrado: false, mensagem: `AGT respondeu com estado ${resposta.status}` };
    }

    const xml = await resposta.text();
    const valores = extrairValores(xml);

    if (valores.length < 7) {
      // "NIF não encontrado" (ou outro aviso) vem como mensagem "Growl" do PrimeFaces.
      const mensagemErro = xml.match(/detail:"([^"]*)"/)?.[1];
      return { encontrado: false, mensagem: mensagemErro || 'NIF não encontrado' };
    }

    const [nifDevolvido, nome, tipo, estado, inadimplente, regimeIva, residente] = valores;
    return {
      encontrado: true,
      dados: { nif: nifDevolvido || nif, nome, tipo, estado, inadimplente, regime_iva: regimeIva, residente },
    };
  } catch (error) {
    logger.warn('Falha na consulta de NIF à AGT (não bloqueante, o utilizador pode preencher manualmente):', error);
    return { encontrado: false, mensagem: 'Não foi possível consultar a AGT neste momento. Pode continuar manualmente.' };
  }
}
