/**
 * Detalhes da própria cotação submetida por um fornecedor - nunca mostra
 * dados de outros fornecedores (isso fica só no ecrã interno de análise).
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PedidoCompra, CotacaoFornecedor } from "./types";

interface MinhaCotacaoDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoCompra | null;
  cotacao: CotacaoFornecedor | null;
}

export function MinhaCotacaoDetailsDialog({ open, onClose, pedido, cotacao }: MinhaCotacaoDetailsDialogProps) {
  if (!pedido || !cotacao) return null;

  const itensRespondidos = Array.isArray(cotacao.itens_resposta) ? cotacao.itens_resposta : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Minha Cotação - {pedido.numero}
          </DialogTitle>
          <DialogDescription>{pedido.titulo}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor Total:</span>
                  <p className="font-semibold text-lg text-tone-success">
                    {(cotacao.valor_total ?? 0).toLocaleString('pt-AO')} AOA
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submetida em:</span>
                  <p className="font-medium">
                    {cotacao.submitted_at
                      ? format(new Date(cotacao.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : 'N/A'}
                  </p>
                </div>
                {cotacao.prazo_validade_cotacao && (
                  <div>
                    <span className="text-muted-foreground">Válida até:</span>
                    <p className="font-medium">
                      {format(new Date(cotacao.prazo_validade_cotacao), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {cotacao.condicoes_gerais && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Condições Gerais</h4>
                    <p className="text-sm">{cotacao.condicoes_gerais}</p>
                  </div>
                </>
              )}

              {cotacao.observacoes_gerais && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Observações</h4>
                    <p className="text-sm">{cotacao.observacoes_gerais}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold mb-3">Respostas por Item ({itensRespondidos.length})</h3>
            <div className="space-y-2">
              {itensRespondidos.length > 0 ? (
                itensRespondidos.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      item.disponivel === "sim"
                        ? "bg-tone-success-soft border-tone-success/30"
                        : "bg-tone-danger-soft border-tone-danger/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.disponivel === "sim" ? (
                            <CheckCircle2 className="h-4 w-4 inline text-tone-success mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 inline text-tone-danger mr-1" />
                          )}
                          {item.item_descricao}
                        </p>
                        {item.disponivel === "sim" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Qtd: {item.quantidade_disponivel} | Preço Unit.: {item.preco_unitario?.toLocaleString('pt-AO')} AOA
                            {item.iv_percentagem ? ` | IV: ${item.iv_percentagem}%` : ''}
                            {item.prazo_entrega_dias ? ` | Prazo: ${item.prazo_entrega_dias} dias` : ''}
                          </p>
                        )}
                        {item.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.observacoes}</p>
                        )}
                      </div>
                      {item.disponivel === "sim" && item.preco_unitario && item.quantidade_disponivel && (
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="font-semibold">
                            {(item.preco_unitario * item.quantidade_disponivel).toLocaleString('pt-AO')} AOA
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Sem detalhes de itens registados.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
