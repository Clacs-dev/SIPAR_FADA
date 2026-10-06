import { API_BASE_URL } from "@/services/api";

/**
 * Consulta de NIF à AGT (Portal do Contribuinte) - ver
 * server/src/services/nif-lookup.service.ts para o fluxo completo. É um
 * auxiliar de preenchimento, nunca obrigatório: o servidor devolve sempre
 * 200 com `encontrado: false` (nunca um erro HTTP) quando a consulta falha
 * ou o NIF não existe, para nunca bloquear quem está a preencher o formulário.
 */

export interface DadosNif {
  nif: string;
  nome: string;
  tipo: string;
  estado: string;
  inadimplente: string;
  regime_iva: string;
  residente: string;
}

export interface ResultadoConsultaNif {
  encontrado: boolean;
  dados?: DadosNif;
  mensagem?: string;
}

export async function consultarNif(numero: string, accessToken?: string | null): Promise<ResultadoConsultaNif> {
  const limpo = numero.trim();
  if (!limpo) return { encontrado: false, mensagem: 'NIF vazio' };

  try {
    const resposta = await fetch(`${API_BASE_URL}/nif/${encodeURIComponent(limpo)}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => ({}));
      return { encontrado: false, mensagem: corpo.message || `Não foi possível consultar a AGT (o servidor do SIPAR respondeu ${resposta.status})` };
    }
    return await resposta.json();
  } catch {
    return { encontrado: false, mensagem: 'Sem ligação ao servidor do SIPAR para consultar a AGT' };
  }
}
