/**
 * Registo automatico de facturas (Nova Factura): seletor de modo, zona para
 * largar/escolher/colar o PDF e painel de revisao do que foi extraido.
 * O servidor (POST /extraccao-facturas/extrair) le o documento e devolve os
 * campos; NADA e gravado ate o utilizador clicar em Registar no formulario.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, Keyboard, Loader2, Search, Sparkles, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { API_BASE_URL } from "@/services/api";
import { useAuth } from "../auth/auth-context";

export type ModoRegisto = 'manual' | 'agt' | 'automatico';

export interface EstadoExtraccao {
  modo_servidor: 'off' | 'regras' | 'hibrido' | 'ia';
  regras: boolean;
  ia: boolean;
  ia_permitida: boolean;
  ia_configurada: boolean;
  limite: number | null;
  periodo: 'mensal' | 'total';
  usadas: number;
  restantes: number | null;
  motivo_ia_indisponivel?: string;
}

export interface DocumentoExtraido {
  motor: 'regras' | 'ia';
  tipo_original: string;
  paginas: string;
  campos: {
    fornecedor_nif: string; fornecedor_nome: string; cliente_nif: string; cliente_nome: string;
    numero_fornecedor: string; tipo_documento: 'factura' | 'factura_proforma' | 'outro';
    tipo: '' | 'mercadoria' | 'servico' | 'ambos'; data_emissao: string; data_vencimento: string;
    moeda: 'AOA' | 'USD' | 'EUR'; condicoes_pagamento: string; descricao: string;
  };
  itens: { descricao: string; quantidade: number; preco_unitario: number; desconto_percentagem: number; iva: number; total: number }[];
  totais: { subtotal: number; iva: number; total: number };
  banco: { banco_nome: string; banco_titular: string; banco_iban: string; banco_nib: string; banco_swift: string };
  confianca: Record<string, 'alta' | 'media' | 'baixa'>;
  avisos: string[];
  completo: boolean;
}

export interface RespostaExtraccao {
  motor: 'regras' | 'ia' | null;
  resultado: 'sucesso' | 'parcial' | 'falha';
  documentos: DocumentoExtraido[];
  principal: number;
  fornecedor: { id: string; nome: string | null } | null;
  agt: { encontrado: boolean; dados?: any; mensagem?: string } | null;
  duplicados: { id: string; numero: string | null; status: string; numero_fornecedor: string }[];
  anexo: { id: string; nome: string; url: string; tamanho: number; tipo: string; uploaded_at: string };
  avisos_motor: string[];
  estado: EstadoExtraccao;
}

export const NOME_TIPO_DOCUMENTO: Record<string, string> = {
  factura: 'Factura', factura_recibo: 'Factura/Recibo', factura_proforma: 'Pró-forma', nota_credito: 'Nota de Crédito',
  nota_debito: 'Nota de Débito', nota_entrega: 'Nota de Entrega', recibo: 'Recibo', outro: 'Outro documento',
};
const REGISTAVEIS = ['factura', 'factura_recibo', 'factura_proforma'];

export function useEstadoExtraccao() {
  const { accessToken } = useAuth();
  const [estado, setEstado] = useState<EstadoExtraccao | null>(null);
  const recarregar = useCallback(() => {
    if (!accessToken) return;
    fetch(`${API_BASE_URL}/extraccao-facturas/estado`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => setEstado(body))
      .catch(() => setEstado(null));
  }, [accessToken]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { estado, setEstado, recarregar };
}

function textoRestantes(e: EstadoExtraccao | null): string {
  if (!e?.ia) return '';
  if (e.restantes === null) return 'com IA disponível';
  return `${e.restantes} extracção(ões) com IA ${e.periodo === 'total' ? 'restante(s)' : 'restante(s) este mês'}`;
}

// ------------------------------------------------------------ seletor de modo

export function SeletorModoRegisto({ modo, onChange, estado }: { modo: ModoRegisto; onChange: (m: ModoRegisto) => void; estado: EstadoExtraccao | null }) {
  const automaticoDisponivel = !!estado && (estado.regras || estado.ia);
  const opcoes: { id: ModoRegisto; titulo: string; texto: string; icone: JSX.Element; visivel: boolean }[] = [
    { id: 'manual', titulo: 'Manual', texto: 'Preencher todos os campos', icone: <Keyboard className="h-4 w-4" />, visivel: true },
    { id: 'agt', titulo: 'Pesquisa AGT', texto: 'Dados do fornecedor pelo NIF', icone: <Search className="h-4 w-4" />, visivel: true },
    {
      id: 'automatico',
      titulo: 'Automático (PDF)',
      texto: estado?.ia ? `Ler o PDF · ${textoRestantes(estado)}` : 'Ler os dados do PDF da factura',
      icone: <FileSearch className="h-4 w-4" />,
      visivel: automaticoDisponivel,
    },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Modo de registo">
      {opcoes.filter((o) => o.visivel).map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={modo === o.id}
          onClick={() => onChange(o.id)}
          className={`text-left rounded-lg border p-3 transition-colors ${modo === o.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
        >
          <span className="flex items-center gap-2 font-medium text-sm">{o.icone}{o.titulo}</span>
          <span className="block text-xs text-muted-foreground mt-1">{o.texto}</span>
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ zona do PDF

const ACEITES = ['application/pdf', 'image/png', 'image/jpeg'];

/** Envia o ficheiro ao servidor para extraccao (motor "auto" = regras e, se preciso, IA). */
export async function extrairFicheiro(accessToken: string | null | undefined, ficheiro: File, motor: 'auto' | 'ia' = 'auto'): Promise<RespostaExtraccao> {
  const fd = new FormData();
  fd.append('file', ficheiro);
  const res = await fetch(`${API_BASE_URL}/extraccao-facturas/extrair?motor=${motor}`, {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: fd,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Não foi possível ler o documento (erro ${res.status}).`);
  return body as RespostaExtraccao;
}

export function ZonaPdf({
  onExtraido, estado, desactivado,
}: {
  onExtraido: (resposta: RespostaExtraccao, ficheiro: File) => void;
  estado: EstadoExtraccao | null;
  desactivado?: boolean;
}) {
  const { accessToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aLer, setALer] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastar, setArrastar] = useState(false);

  const enviar = useCallback(async (ficheiro: File, motor: 'auto' | 'ia' = 'auto') => {
    setErro(null);
    if (!ACEITES.includes(ficheiro.type)) { setErro('Só são aceites ficheiros PDF, JPG ou PNG.'); return; }
    if (ficheiro.size > 10 * 1024 * 1024) { setErro('O ficheiro tem mais de 10 MB.'); return; }
    setALer(ficheiro.name);
    try {
      onExtraido(await extrairFicheiro(accessToken, ficheiro, motor), ficheiro);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler o documento.');
    } finally {
      setALer(null);
    }
  }, [accessToken, onExtraido]);

  // Colar (Ctrl+V) um ficheiro copiado no explorador ou um print.
  useEffect(() => {
    if (desactivado) return;
    const aoColar = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0];
      if (f && !aLer) { e.preventDefault(); enviar(f); }
    };
    window.addEventListener('paste', aoColar);
    return () => window.removeEventListener('paste', aoColar);
  }, [enviar, aLer, desactivado]);

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastar(true); }}
        onDragLeave={() => setArrastar(false)}
        onDrop={(e) => { e.preventDefault(); setArrastar(false); const f = e.dataTransfer.files?.[0]; if (f && !aLer) enviar(f); }}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${arrastar ? 'border-primary bg-primary/5' : 'border-border'}`}
      >
        {aLer ? (
          <p className="text-sm flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> A ler {aLer}... (pode demorar até 30 s em documentos digitalizados)
          </p>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Largue aqui o PDF da factura, cole-o (Ctrl+V) ou</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => inputRef.current?.click()} disabled={desactivado}>
              Escolher ficheiro
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              PDF, JPG ou PNG até 10 MB. Nada é registado: os dados aparecem no formulário para rever.
              {estado?.ia ? ` ${textoRestantes(estado)}.` : estado?.motivo_ia_indisponivel ? ` Sem IA: ${estado.motivo_ia_indisponivel}` : ''}
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) enviar(f); e.target.value = ''; }}
        />
      </div>
      {erro && (
        <p className="text-sm flex items-center gap-1" style={{ color: 'var(--tone-danger)' }}>
          <AlertTriangle className="h-4 w-4" /> {erro} Pode continuar no modo Manual.
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------ revisao

export function PainelRevisaoExtraccao({
  resposta, indice, onEscolherDocumento, onTentarComIa, aTentarIa,
}: {
  resposta: RespostaExtraccao;
  indice: number;
  onEscolherDocumento: (i: number) => void;
  onTentarComIa?: () => void;
  aTentarIa?: boolean;
}) {
  const doc = resposta.documentos[indice];
  const avisos = [...resposta.avisos_motor, ...(doc?.avisos || [])];
  const naoRegistavel = doc && !REGISTAVEIS.includes(doc.tipo_original);
  const corEstado = !doc ? 'var(--tone-danger)' : doc.completo && !naoRegistavel ? 'var(--tone-success)' : 'var(--tone-warn)';

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium flex items-center gap-2" style={{ color: corEstado }}>
          {doc?.completo && !naoRegistavel ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {!doc
            ? 'Não foi possível ler os dados deste documento - preencha manualmente (o PDF já está anexado).'
            : doc.completo && !naoRegistavel
              ? 'Dados lidos. Reveja os campos destacados e clique em Registar.'
              : 'Dados lidos parcialmente. Complete e corrija os campos destacados.'}
        </p>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {resposta.motor === 'ia' ? <><Sparkles className="h-3 w-3" /> Lido com IA</> : resposta.motor === 'regras' ? 'Lido sem IA (regras locais)' : ''}
        </span>
      </div>

      {resposta.documentos.length > 1 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Este ficheiro tem {resposta.documentos.length} documentos — escolha o que vai registar:</p>
          <div className="flex flex-wrap gap-2">
            {resposta.documentos.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onEscolherDocumento(i)}
                className={`text-xs rounded-md border px-2 py-1 ${i === indice ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-muted'}`}
              >
                {NOME_TIPO_DOCUMENTO[d.tipo_original] || d.tipo_original} {d.campos.numero_fornecedor}
                {d.paginas ? ` · pág. ${d.paginas}` : ''}
                {!REGISTAVEIS.includes(d.tipo_original) ? ' · não registável' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {resposta.duplicados.length > 0 && (
        <p className="text-sm flex items-start gap-1" style={{ color: 'var(--tone-danger)' }}>
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          Já existe {resposta.duplicados.length === 1 ? 'a factura' : 'as facturas'} {resposta.duplicados.map((d) => d.numero || d.id).join(', ')} com
          o mesmo NIF e número do fornecedor. Registar outra vez pode levar a pagar duas vezes.
        </p>
      )}

      {avisos.length > 0 && (
        <ul className="text-xs space-y-1 list-disc pl-5">
          {avisos.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      )}

      {onTentarComIa && (
        <Button type="button" size="sm" variant="outline" onClick={onTentarComIa} disabled={aTentarIa}>
          {aTentarIa ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Ler outra vez com IA {textoRestantes(resposta.estado) ? `(${textoRestantes(resposta.estado)})` : ''}
        </Button>
      )}
    </div>
  );
}
