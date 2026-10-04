/**
 * Validacao de IBAN/NIB angolanos - mesmas regras de client/src/utils/bank-format.ts:
 *   IBAN: exactamente 25 caracteres = 2 letras do pais (AO) + 23 digitos
 *   NIB:  exactamente 21 digitos
 * Espacos sao ignorados (o ecra agrupa em blocos de 4). Vazio = nao preenchido.
 */

const IBAN_REGEX = /^[A-Z]{2}\d{23}$/;
const NIB_REGEX = /^\d{21}$/;

export function validarIban(valor?: string | null): string | null {
  const limpo = String(valor || '').replace(/\s/g, '').toUpperCase();
  if (!limpo) return null;
  if (limpo.length !== 25) return `IBAN deve ter exactamente 25 caracteres (tem ${limpo.length})`;
  if (!IBAN_REGEX.test(limpo)) return 'IBAN invalido: 2 letras do pais (ex: AO) seguidas de 23 digitos';
  return null;
}

export function validarNib(valor?: string | null): string | null {
  const limpo = String(valor || '').replace(/\s/g, '');
  if (!limpo) return null;
  if (limpo.length !== 21) return `NIB deve ter exactamente 21 digitos (tem ${limpo.length})`;
  if (!NIB_REGEX.test(limpo)) return 'NIB invalido: deve conter apenas numeros';
  return null;
}

/** Primeiro erro de IBAN/NIB encontrado nos campos indicados (ou null). */
export function erroCoordenadas(dados: Record<string, any> | null | undefined, campoIban = 'banco_iban', campoNib = 'banco_nib') {
  if (!dados) return null;
  return validarIban(dados[campoIban]) || validarNib(dados[campoNib]);
}
