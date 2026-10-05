/**
 * Pre-visualizacao de documentos - usada em todo o sistema antes de descarregar.
 *
 * Qualquer ecra chama previewDocument({ url | blob, nome }) (ou previewPdf(doc,
 * nome) para PDFs gerados com jsPDF) e o <DocumentPreviewHost /> montado uma
 * unica vez na raiz da aplicacao mostra o documento num dialogo, com os botoes
 * "Descarregar" e "Abrir em nova aba".
 *
 * Os ficheiros do servidor sao lidos por fetch() e mostrados a partir de um
 * blob local: o servidor envia X-Frame-Options: SAMEORIGIN, por isso um iframe
 * apontado directamente para o URL de /uploads seria bloqueado pelo browser.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, ExternalLink, FileWarning, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { urlPublica } from "@/services/api";

export interface PreviewRequest {
  url?: string;
  blob?: Blob;
  nome?: string;
  tipo?: string;
}

type Listener = () => void;
let atual: PreviewRequest | null = null;
const listeners = new Set<Listener>();

function emitir(proximo: PreviewRequest | null) {
  atual = proximo;
  listeners.forEach((listener) => listener());
}

function subscrever(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Abre a pre-visualizacao de um documento (URL do servidor ou blob local). */
export function previewDocument(request: PreviewRequest) {
  if (!request.url && !request.blob) return;
  // Ficheiros do servidor gravados com http:// seriam bloqueados numa pagina
  // https ("Failed to fetch"): pede-os sempre pelo endereco publico (https).
  emitir(request.url ? { ...request, url: urlPublica(request.url) } : request);
}

/** Pre-visualiza um PDF gerado com jsPDF em vez de o descarregar directamente. */
export function previewPdf(doc: { output: (type: "blob") => Blob }, nome: string) {
  previewDocument({ blob: doc.output("blob"), nome, tipo: "application/pdf" });
}

const MIME_POR_EXTENSAO: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
  txt: "text/plain", csv: "text/csv", json: "application/json", xml: "application/xml", md: "text/plain", log: "text/plain",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
};

function extensao(nome?: string) {
  const limpo = (nome || "").split(/[?#]/)[0];
  return limpo.includes(".") ? limpo.split(".").pop()!.toLowerCase() : "";
}

function nomeDoUrl(url?: string) {
  if (!url) return "documento";
  const ultimo = url.split(/[?#]/)[0].split("/").pop() || "documento";
  try {
    return decodeURIComponent(ultimo);
  } catch {
    return ultimo;
  }
}

/** Tipo efectivo: o declarado, o do blob (se nao for generico) ou o da extensao. */
function resolverTipo(request: PreviewRequest, blob?: Blob) {
  const genericos = ["", "application/octet-stream", "binary/octet-stream"];
  if (request.tipo && !genericos.includes(request.tipo)) return request.tipo;
  const porExtensao = MIME_POR_EXTENSAO[extensao(request.nome)] || MIME_POR_EXTENSAO[extensao(request.url)];
  if (porExtensao) return porExtensao;
  if (blob?.type && !genericos.includes(blob.type) && !blob.type.startsWith("text/plain")) return blob.type;
  return blob?.type || "";
}

type Modo = "pdf" | "imagem" | "texto" | "video" | "audio" | "outro";

function modoPara(tipo: string): Modo {
  if (tipo === "application/pdf") return "pdf";
  if (tipo.startsWith("image/")) return "imagem";
  if (tipo.startsWith("video/")) return "video";
  if (tipo.startsWith("audio/")) return "audio";
  if (tipo.startsWith("text/") || tipo === "application/json" || tipo === "application/xml") return "texto";
  return "outro";
}

function descarregarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DocumentPreviewHost() {
  const request = useSyncExternalStore(subscrever, () => atual, () => null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [texto, setTexto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nome = request?.nome || nomeDoUrl(request?.url);

  useEffect(() => {
    setBlob(null);
    setObjectUrl(null);
    setTexto(null);
    setErro(null);
    if (!request) return;

    let cancelado = false;
    let urlCriado: string | null = null;

    const carregar = async () => {
      setCarregando(true);
      try {
        let conteudo = request.blob;
        if (!conteudo && request.url) {
          let resposta: Response;
          try {
            resposta = await fetch(request.url, { cache: "no-store" });
          } catch {
            throw new Error("Não foi possível ligar ao servidor para ler o ficheiro. Verifique a ligação e tente de novo.");
          }
          if (resposta.status === 404) throw new Error("O ficheiro já não existe no servidor.");
          if (!resposta.ok) throw new Error(`O servidor respondeu ${resposta.status}`);
          conteudo = await resposta.blob();
        }
        if (cancelado || !conteudo) return;

        const tipo = resolverTipo(request, conteudo);
        // Reetiqueta o blob com o tipo efectivo: o servidor pode devolver um
        // Content-Type generico e o iframe/img precisam do tipo certo.
        const tipado = conteudo.type === tipo ? conteudo : new Blob([conteudo], { type: tipo });
        setBlob(tipado);

        if (modoPara(tipo) === "texto") {
          setTexto(await tipado.text());
        } else {
          urlCriado = URL.createObjectURL(tipado);
          setObjectUrl(urlCriado);
        }
      } catch (error: any) {
 console.error("Erro ao carregar pre-visualizacao:", error);
        if (!cancelado) setErro(error?.message || "Nao foi possivel carregar o documento");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    carregar();
    return () => {
      cancelado = true;
      if (urlCriado) URL.revokeObjectURL(urlCriado);
    };
  }, [request]);

  const fechar = () => emitir(null);
  const tipo = request ? resolverTipo(request, blob || undefined) : "";
  const modo = modoPara(tipo);

  const handleDescarregar = () => {
    if (blob) {
      descarregarBlob(blob, nome);
    } else if (request?.url) {
      window.open(request.url, "_blank", "noopener");
    }
  };

  const handleNovaAba = () => {
    const alvo = objectUrl || (blob ? URL.createObjectURL(blob) : request?.url);
    if (alvo) window.open(alvo, "_blank", "noopener");
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => { if (!open) fechar(); }}>
      <DialogContent className="sm:max-w-5xl w-[calc(100%-2rem)] h-[90vh] flex flex-col gap-3 p-4">
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate" title={nome}>{nome}</DialogTitle>
          <DialogDescription>Pré-visualização do documento</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-md border border-border bg-muted/30 overflow-auto flex items-center justify-center">
          {carregando && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">A carregar documento...</span>
            </div>
          )}

          {!carregando && erro && (
            <div className="flex flex-col items-center gap-2 text-center p-6 text-muted-foreground">
              <FileWarning className="h-10 w-10" />
              <p className="text-sm">Não foi possível pré-visualizar este documento.</p>
              <p className="text-xs">{erro}</p>
            </div>
          )}

          {!carregando && !erro && modo === "pdf" && objectUrl && (
            <iframe src={objectUrl} title={nome} className="w-full h-full border-0 bg-white" />
          )}
          {!carregando && !erro && modo === "imagem" && objectUrl && (
            <img src={objectUrl} alt={nome} className="max-w-full max-h-full object-contain" />
          )}
          {!carregando && !erro && modo === "video" && objectUrl && (
            <video src={objectUrl} controls className="max-w-full max-h-full" />
          )}
          {!carregando && !erro && modo === "audio" && objectUrl && (
            <audio src={objectUrl} controls />
          )}
          {!carregando && !erro && modo === "texto" && texto !== null && (
            <pre className="w-full h-full p-4 text-xs whitespace-pre-wrap break-words self-start">{texto}</pre>
          )}
          {!carregando && !erro && modo === "outro" && blob && (
            <div className="flex flex-col items-center gap-2 text-center p-6 text-muted-foreground">
              <FileWarning className="h-10 w-10" />
              <p className="text-sm">Este tipo de ficheiro ({extensao(nome).toUpperCase() || tipo || "desconhecido"}) não pode ser pré-visualizado no browser.</p>
              <p className="text-xs">Descarregue o ficheiro para o abrir.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleNovaAba} disabled={carregando || (!objectUrl && !blob && !request?.url)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir em nova aba
          </Button>
          <Button onClick={handleDescarregar} disabled={carregando || (!blob && !request?.url)}>
            <Download className="mr-2 h-4 w-4" />
            Descarregar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
