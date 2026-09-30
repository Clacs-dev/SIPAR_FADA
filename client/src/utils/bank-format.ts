/**
 * Formatação e validação de IBAN/NIB angolanos.
 *
 * Estrutura (Angola):
 *   Código do país   2 letras   "AO"
 *   Dígitos de controlo   2 números   "06"
 *   NIB   21 dígitos numéricos   "0055 0000 2159 9539 1019 3"
 *   IBAN completo   25 caracteres   "AO06 0055 0000 2159 9539 1019 3"
 *
 * O NIB sozinho (sem "AO" + dígitos de controlo) tem sempre 21 dígitos; o
 * IBAN completo tem sempre 25 caracteres (2 letras + 23 dígitos). Um valor
 * mais curto ou mais longo do que isto é inválido - nunca "quase certo".
 */

const IBAN_TAMANHO = 25;
const NIB_TAMANHO = 21;
const IBAN_REGEX = /^[A-Z]{2}\d{23}$/;
const NIB_REGEX = /^\d{21}$/;

function agruparDe4(valor: string): string {
  return valor.replace(/(.{4})(?=.)/g, '$1 ');
}

/** Formata em blocos de 4 enquanto o utilizador escreve (maiúsculas, só letras/números, limitado a 25 caracteres). */
export function formatarIban(valor: string): string {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, IBAN_TAMANHO);
  return agruparDe4(limpo);
}

/** Formata em blocos de 4 enquanto o utilizador escreve (só dígitos, limitado a 21 caracteres). */
export function formatarNib(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, NIB_TAMANHO);
  return agruparDe4(limpo);
}

/** Devolve a mensagem de erro (ou null se válido/vazio - campo vazio não é erro aqui, é só "por preencher"). */
export function validarIban(valor: string): string | null {
  const limpo = valor.replace(/\s/g, '');
  if (!limpo) return null;
  if (limpo.length !== IBAN_TAMANHO) {
    return `IBAN deve ter exactamente ${IBAN_TAMANHO} caracteres (tem ${limpo.length})`;
  }
  if (!IBAN_REGEX.test(limpo)) {
    return 'IBAN inválido: 2 letras do país (ex: AO) seguidas de 23 dígitos';
  }
  return null;
}

export function validarNib(valor: string): string | null {
  const limpo = valor.replace(/\s/g, '');
  if (!limpo) return null;
  if (limpo.length !== NIB_TAMANHO) {
    return `NIB deve ter exactamente ${NIB_TAMANHO} dígitos (tem ${limpo.length})`;
  }
  if (!NIB_REGEX.test(limpo)) {
    return 'NIB inválido: deve conter apenas números';
  }
  return null;
}
