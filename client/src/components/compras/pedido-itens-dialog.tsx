/**
 * Detalhes de um Pedido de Compra para o Fornecedor (só o que é dele ver:
 * o pedido e os seus itens - nunca cotações de outros fornecedores).
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
import { Package, Clock, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PedidoCompra } from "./types";

interface PedidoItensDialogProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoCompra | null;
}

export function PedidoItensDialog({ open, onClose, pedido }: PedidoItensDialogProps) {
  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {pedido.numero}
          </DialogTitle>
          <DialogDescription>{pedido.titulo}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Descrição</h4>
                <p className="text-sm">{pedido.descricao}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Orçamento Estimado:</span>
                  <p className="font-medium">
                    <DollarSign className="h-3.5 w-3.5 inline" />
                    {pedido.orcamento_estimado ? `${pedido.orcamento_estimado.toLocaleString('pt-AO')} AOA` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prazo Desejado:</span>
                  <p className="font-medium">
                    <Clock className="h-3.5 w-3.5 inline mr-1" />
                    {pedido.prazo_entrega_desejado
                      ? format(new Date(pedido.prazo_entrega_desejado), "dd/MM/yyyy", { locale: ptBR })
                      : 'Não especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Local de Entrega:</span>
                  <p className="font-medium">
                    <MapPin className="h-3.5 w-3.5 inline mr-1" />
                    {pedido.local_entrega || 'N/A'}
                  </p>
                </div>
              </div>

              {pedido.observacoes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Observações</h4>
                    <p className="text-sm">{pedido.observacoes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold mb-3">Itens Solicitados ({pedido.itens?.length || 0})</h3>
            <div className="space-y-3">
              {pedido.itens && pedido.itens.length > 0 ? (
                pedido.itens.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">Item {index + 1}: {item.descricao}</h4>
                          <Badge variant="outline" className="mt-1">{item.tipo}</Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Quantidade</p>
                          <p className="font-semibold">{item.quantidade} {item.unidade}</p>
                        </div>
                      </div>

                      {item.especificacoes_tecnicas && (
                        <div className="mt-2 text-sm">
                          <span className="font-semibold text-muted-foreground">Especificações Técnicas: </span>
                          {item.especificacoes_tecnicas}
                        </div>
                      )}
                      {item.caracteristicas && (
                        <div className="mt-1 text-sm">
                          <span className="font-semibold text-muted-foreground">Características: </span>
                          {item.caracteristicas}
                        </div>
                      )}
                      {item.observacoes && (
                        <div className="mt-1 text-sm">
                          <span className="font-semibold text-muted-foreground">Observações: </span>
                          {item.observacoes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum item cadastrado</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
