/**
 * Campo de NIF com consulta à AGT (Portal do Contribuinte) - digita-se o NIF,
 * clica em "Consultar" e, se encontrado, devolve os dados (nome, tipo,
 * estado, regime de IVA) via onEncontrado. Nunca bloqueia: se a consulta
 * falhar ou não encontrar nada, mostra um aviso e o utilizador continua a
 * preencher manualmente (ver server/src/services/nif-lookup.service.ts).
 */

import { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAuth } from "../auth/auth-context";
import { consultarNif, type DadosNif } from "../../utils/nif-lookup";

interface NifLookupFieldProps {
  value: string;
  onChange: (nif: string) => void;
  onEncontrado: (dados: DadosNif) => void;
  placeholder?: string;
  id?: string;
}

export function NifLookupField({ value, onChange, onEncontrado, placeholder, id }: NifLookupFieldProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensagem?: string } | null>(null);

  const handleConsultar = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setResultado(null);
    try {
      const resposta = await consultarNif(value, accessToken);
      if (resposta.encontrado && resposta.dados) {
        onEncontrado(resposta.dados);
        setResultado({ ok: true, mensagem: resposta.dados.nome });
      } else {
        setResultado({ ok: false, mensagem: resposta.mensagem || 'NIF não encontrado' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          id={id}
          placeholder={placeholder || 'Ex: 5000000000 ou 022405000LA054'}
          value={value}
          onChange={(e) => { onChange(e.target.value); setResultado(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConsultar(); } }}
        />
        <Button type="button" variant="outline" onClick={handleConsultar} disabled={loading || !value.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Consultar</span>
        </Button>
      </div>
      {resultado && (
        <p className={`text-xs flex items-center gap-1 ${resultado.ok ? 'text-tone-success' : 'text-muted-foreground'}`}>
          {resultado.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {resultado.ok ? `Encontrado: ${resultado.mensagem}` : `${resultado.mensagem} — pode preencher manualmente.`}
        </p>
      )}
    </div>
  );
}
