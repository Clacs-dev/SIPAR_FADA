/**
 * Campo de NIF com consulta à AGT (Portal do Contribuinte) - digita-se o NIF,
 * clica em "Consultar" e, se encontrado, devolve os dados (nome, tipo,
 * estado, regime de IVA) via onEncontrado. Nunca bloqueia: se a consulta
 * falhar ou não encontrar nada, mostra um aviso e o utilizador continua a
 * preencher manualmente (ver server/src/services/nif-lookup.service.ts).
 */

import { useEffect, useState } from "react";
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
  const [dadosAgt, setDadosAgt] = useState<DadosNif | null>(null);

  const handleConsultar = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setResultado(null);
    setDadosAgt(null);
    try {
      const resposta = await consultarNif(value, accessToken);
      if (resposta.encontrado && resposta.dados) {
        onEncontrado(resposta.dados);
        setDadosAgt(resposta.dados);
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
          onChange={(e) => { onChange(e.target.value); setResultado(null); setDadosAgt(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConsultar(); } }}
        />
        <Button type="button" variant="outline" onClick={handleConsultar} disabled={loading || !value.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Consultar</span>
        </Button>
      </div>
      {resultado?.ok && dadosAgt ? (
        <DadosAgtPainel dados={dadosAgt} />
      ) : resultado && (
        <p className={`text-xs flex items-center gap-1 ${resultado.ok ? 'text-tone-success' : 'text-muted-foreground'}`}>
          {resultado.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {resultado.ok ? `Encontrado: ${resultado.mensagem}` : `${resultado.mensagem} — pode preencher manualmente.`}
        </p>
      )}
    </div>
  );
}

const CAMPOS_AGT: Array<{ chave: keyof DadosNif; rotulo: string }> = [
  { chave: 'nif', rotulo: 'NIF' },
  { chave: 'nome', rotulo: 'Nome' },
  { chave: 'tipo', rotulo: 'Tipo' },
  { chave: 'estado', rotulo: 'Estado' },
  { chave: 'inadimplente', rotulo: 'Inadimplente' },
  { chave: 'regime_iva', rotulo: 'Regime de IVA' },
  { chave: 'residente', rotulo: 'Residência fiscal' },
];

/** Todos os campos devolvidos pela AGT (Portal do Contribuinte) para um NIF. */
export function DadosAgtPainel({ dados }: { dados: DadosNif }) {
  const alerta = (chave: keyof DadosNif, valor: string) =>
    (chave === 'estado' && valor && !/^activ/i.test(valor)) || (chave === 'inadimplente' && /^sim/i.test(valor));
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1.5">
      <p className="flex items-center gap-1 font-medium text-tone-success">
        <CheckCircle2 className="h-3 w-3" /> Dados da AGT (Portal do Contribuinte)
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {CAMPOS_AGT.map(({ chave, rotulo }) => {
          const valor = (dados[chave] || '').trim();
          return (
            <div key={chave} className="contents">
              <dt className="text-muted-foreground">{rotulo}:</dt>
              <dd className={`break-words ${alerta(chave, valor) ? 'font-semibold' : ''}`} style={alerta(chave, valor) ? { color: 'var(--tone-warn)' } : undefined}>
                {valor || 'Indisponível'}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/**
 * Consulta automaticamente na AGT um NIF ja conhecido (ex: fornecedor
 * escolhido da lista) e mostra todos os dados devolvidos. Nunca bloqueia.
 */
export function DadosAgtDoNif({ nif }: { nif?: string | null }) {
  const { accessToken } = useAuth();
  const [estado, setEstado] = useState<{ loading: boolean; dados?: DadosNif; mensagem?: string }>({ loading: false });

  useEffect(() => {
    const limpo = (nif || '').trim();
    if (!limpo) { setEstado({ loading: false }); return; }
    let cancelado = false;
    setEstado({ loading: true });
    consultarNif(limpo, accessToken).then((resposta) => {
      if (cancelado) return;
      setEstado(resposta.encontrado && resposta.dados
        ? { loading: false, dados: resposta.dados }
        : { loading: false, mensagem: resposta.mensagem || 'NIF não encontrado na AGT' });
    });
    return () => { cancelado = true; };
  }, [nif, accessToken]);

  if (!nif) return null;
  if (estado.loading) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> A consultar o NIF {nif} na AGT...
      </p>
    );
  }
  if (estado.dados) return <DadosAgtPainel dados={estado.dados} />;
  if (estado.mensagem) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> AGT: {estado.mensagem}
      </p>
    );
  }
  return null;
}
