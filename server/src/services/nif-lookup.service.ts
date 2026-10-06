import tls from 'tls';
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

// O portal da AGT envia o certificado intermedio errado ("DigiCert SHA2
// Secure Server CA") em vez do que emitiu o seu certificado ("DigiCert Global
// G2 TLS RSA SHA256 2020 CA1"). Os browsers e o curl vao buscar o intermedio
// em falta (AIA); o Node nao, e falhava sempre com "unable to verify the
// first certificate" - tambem em producao. Juntamos esse intermedio publico
// (descarregado de cacerts.digicert.com, valido ate 2031-03-29, emitido pela
// raiz DigiCert Global Root G2 ja confiada pelo Node) as raizes do Node: a
// verificacao TLS continua completa, so a cadeia fica completa.
const DIGICERT_GLOBAL_G2_TLS_RSA_SHA256_2020_CA1 = `-----BEGIN CERTIFICATE-----
MIIEyDCCA7CgAwIBAgIQDPW9BitWAvR6uFAsI8zwZjANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0yMTAzMzAwMDAwMDBaFw0zMTAzMjkyMzU5NTlaMFkxCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxMzAxBgNVBAMTKkRpZ2lDZXJ0IEdsb2Jh
bCBHMiBUTFMgUlNBIFNIQTI1NiAyMDIwIENBMTCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBAMz3EGJPprtjb+2QUlbFbSd7ehJWivH0+dbn4Y+9lavyYEEV
cNsSAPonCrVXOFt9slGTcZUOakGUWzUb+nv6u8W+JDD+Vu/E832X4xT1FE3LpxDy
FuqrIvAxIhFhaZAmunjZlx/jfWardUSVc8is/+9dCopZQ+GssjoP80j812s3wWPc
3kbW20X+fSP9kOhRBx5Ro1/tSUZUfyyIxfQTnJcVPAPooTncaQwywa8WV0yUR0J8
osicfebUTVSvQpmowQTCd5zWSOTOEeAqgJnwQ3DPP3Zr0UxJqyRewg2C/Uaoq2yT
zGJSQnWS+Jr6Xl6ysGHlHx+5fwmY6D36g39HaaECAwEAAaOCAYIwggF+MBIGA1Ud
EwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFHSFgMBmx9833s+9KTeqAx2+7c0XMB8G
A1UdIwQYMBaAFE4iVCAYlebjbuYP+vq5Eu0GF485MA4GA1UdDwEB/wQEAwIBhjAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwdgYIKwYBBQUHAQEEajBoMCQG
CCsGAQUFBzABhhhodHRwOi8vb2NzcC5kaWdpY2VydC5jb20wQAYIKwYBBQUHMAKG
NGh0dHA6Ly9jYWNlcnRzLmRpZ2ljZXJ0LmNvbS9EaWdpQ2VydEdsb2JhbFJvb3RH
Mi5jcnQwQgYDVR0fBDswOTA3oDWgM4YxaHR0cDovL2NybDMuZGlnaWNlcnQuY29t
L0RpZ2lDZXJ0R2xvYmFsUm9vdEcyLmNybDA9BgNVHSAENjA0MAsGCWCGSAGG/WwC
ATAHBgVngQwBATAIBgZngQwBAgEwCAYGZ4EMAQICMAgGBmeBDAECAzANBgkqhkiG
9w0BAQsFAAOCAQEAkPFwyyiXaZd8dP3A+iZ7U6utzWX9upwGnIrXWkOH7U1MVl+t
wcW1BSAuWdH/SvWgKtiwla3JLko716f2b4gp/DA/JIS7w7d7kwcsr4drdjPtAFVS
slme5LnQ89/nD/7d+MS5EHKBCQRfz5eeLjJ1js+aWNJXMX43AYGyZm0pGrFmCW3R
bpD0ufovARTFXFZkAdl9h6g4U5+LXUZtXMYnhIHUfoyMo5tS58aI7Dd8KvvwVVo4
chDYABPPTHPbqjc1qCmBaZx2vN4Ye5DUys/vZwP9BFohFrH/6j/f3IL16/RZkiMN
JCqVJUzKoZHm1Lesh3Sz8W2jmdv51b2EQJ8HmA==
-----END CERTIFICATE-----`;

// AGT_TLS_INSECURE=true continua a existir apenas para ambientes atras de um
// proxy que intercepta HTTPS (desliga a verificacao so para este pedido).
const dispatcher = process.env.AGT_TLS_INSECURE === 'true'
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : new Agent({ connect: { ca: [...tls.rootCertificates, DIGICERT_GLOBAL_G2_TLS_RSA_SHA256_2020_CA1] } });

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

async function obterSessaoEViewState(): Promise<{ cookies: string; viewState: string } | { estadoHttp: number } | null> {
  const resposta = await fetch(PAGINA_CONSULTA, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    dispatcher,
  });
  if (!resposta.ok) return { estadoHttp: resposta.status };

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

  // O portal da AGT corta ligacoes de vez em quando (ECONNRESET): uma
  // segunda tentativa resolve quase sempre.
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await consultarNifUmaVez(nif);
    } catch (error) {
      if (tentativa < 2) continue;
      logger.warn('Falha na consulta de NIF à AGT (não bloqueante, o utilizador pode preencher manualmente):', error);
      return { encontrado: false, mensagem: `Não foi possível consultar a AGT a partir do servidor (${motivoTecnico(error)}). Pode continuar manualmente` };
    }
  }
}

/** Motivo curto da falha de rede (ex: ECONNRESET, timeout, certificado) para o utilizador/suporte. */
function motivoTecnico(error: any): string {
  const causa = error?.cause || error;
  const codigo = causa?.code || error?.code || error?.name || '';
  if (codigo === 'TimeoutError' || codigo === 'UND_ERR_CONNECT_TIMEOUT' || codigo === 'ABORT_ERR') return 'sem resposta do portal - tempo esgotado';
  if (/CERT|SIGNATURE|SELF_SIGNED/i.test(codigo)) return `certificado ${codigo}`;
  return codigo || causa?.message || 'erro de rede';
}

async function consultarNifUmaVez(nif: string): Promise<ResultadoConsultaNif> {
  {
    const sessao = await obterSessaoEViewState();
    if (!sessao) {
      return { encontrado: false, mensagem: 'Não foi possível iniciar sessão no Portal do Contribuinte (AGT)' };
    }
    if ('estadoHttp' in sessao) {
      return {
        encontrado: false,
        mensagem: sessao.estadoHttp >= 500
          ? `O Portal do Contribuinte (AGT) está indisponível neste momento (erro ${sessao.estadoHttp}). Tente mais tarde`
          : `O Portal do Contribuinte (AGT) respondeu com estado ${sessao.estadoHttp}`,
      };
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
      dispatcher,
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
  }
}
