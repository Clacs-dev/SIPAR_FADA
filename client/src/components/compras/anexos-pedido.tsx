/**
 * Lista de anexos (imagens/documentos) de um pedido de procurement - usada no
 * detalhe do pedido e no Portal de Fornecedores. Clicar abre a
 * pre-visualizacao do ficheiro.
 */

import { FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { previewDocument } from "../ui/document-preview";
import type { AnexoPedido } from "./types";

export function formatarTamanhoAnexo(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnexosPedidoLista({ anexos, titulo = "Anexos do pedido" }: { anexos?: AnexoPedido[]; titulo?: string }) {
  if (!Array.isArray(anexos) || anexos.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
        <Paperclip className="h-3.5 w-3.5" /> {titulo} ({anexos.length})
      </h4>
      <div className="flex flex-wrap gap-2">
        {anexos.map((anexo, idx) => {
          const imagem = (anexo.tipo || "").startsWith("image/");
          const Icone = imagem ? ImageIcon : FileText;
          return (
            <button
              key={anexo.id || idx}
              type="button"
              onClick={() => previewDocument({ url: anexo.url, nome: anexo.nome, tipo: anexo.tipo })}
              className="flex items-center gap-2 border rounded-lg px-3 py-2 text-left hover:bg-accent transition-colors"
              title="Abrir anexo"
            >
              <Icone className="h-4 w-4 shrink-0" style={{ color: "var(--tone-info)" }} />
              <span className="text-sm font-medium truncate max-w-[220px]">{anexo.nome}</span>
              {anexo.tamanho ? <span className="text-xs text-muted-foreground">{formatarTamanhoAnexo(anexo.tamanho)}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
