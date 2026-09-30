import { useEffect, useState } from "react";
import { Input } from "./input";

/**
 * Input numérico com separador de milhares em tempo real (ex: "1.500.000"),
 * usado nos campos de valor/preço (facturas, cotações) - o utilizador digita
 * livremente e o campo formata-se sozinho, em vez de mostrar "1500000" sem
 * qualquer separação. Aceita vírgula para casas decimais (convenção pt-PT/AO:
 * "." separa milhares, "," separa decimais).
 */

function paraNumero(raw: string): number {
  // remove tudo excepto digitos e a ultima virgula (decimal) - trata pontos
  // como separadores de milhar (a formatar-se sozinhos, nunca digitados a
  // representar decimais).
  const semMilhares = raw.replace(/\./g, '');
  const normalizado = semMilhares.replace(',', '.').replace(/[^\d.]/g, '');
  const num = parseFloat(normalizado);
  return Number.isFinite(num) ? num : 0;
}

function paraTexto(valor: number): string {
  if (!Number.isFinite(valor) || valor === 0) return '';
  return valor.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface MoneyInputProps {
  id?: string;
  value: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function MoneyInput({ id, value, onValueChange, placeholder, className, disabled, required }: MoneyInputProps) {
  const [texto, setTexto] = useState(() => paraTexto(value));

  // Sincroniza quando o valor muda por fora (ex: reset do formulário), sem
  // reformatar a cada tecla premida por dentro (o próprio handleChange trata disso).
  useEffect(() => {
    setTexto((atual) => (paraNumero(atual) === value ? atual : paraTexto(value)));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numero = paraNumero(raw);
    setTexto(raw === '' ? '' : numero.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
    onValueChange(numero);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={placeholder || '0'}
      className={className}
      disabled={disabled}
      required={required}
      value={texto}
      onChange={handleChange}
    />
  );
}
