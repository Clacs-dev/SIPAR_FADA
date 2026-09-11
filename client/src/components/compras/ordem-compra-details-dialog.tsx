/**
 * Dialog de Detalhes da Ordem de Compra
 * Visível APENAS para departamento de Compras
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  CreditCard,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner@2.0.3";
import type { OrdemCompra } from "./types";

interface OrdemCompraDetailsDialogProps {
  ordemCompra: OrdemCompra | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: string) => Promise<boolean>;
}

export function OrdemCompraDetailsDialog({
  ordemCompra,
  open,
  onClose,
  onUpdateStatus,
}: OrdemCompraDetailsDialogProps) {
  const [showCancelarForm, setShowCancelarForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!ordemCompra) return null;

  const getStatusBadge = (status: string) => {
    const badges = {
      emitida: { label: "Emitida", color: "var(--tone-info)" },
      confirmada: { label: "Confirmada", color: "var(--tone-success)" },
      em_transito: { label: "Em Trânsito", color: "var(--tone-gold)" },
      entregue: { label: "Entregue", color: "var(--tone-success)" },
      cancelada: { label: "Cancelada", color: "var(--tone-neutral)" },
    };
    const badge = badges[status as keyof typeof badges] || badges.emitida;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
  };

  const handleConfirmar = async () => {
    if (!onUpdateStatus) return;
    
    setSubmitting(true);
    try {
      const success = await onUpdateStatus(ordemCompra.id, "confirmada");
      if (success) {
        toast.success("Ordem confirmada pelo fornecedor!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnviar = async () => {
    if (!onUpdateStatus) return;
    
    setSubmitting(true);
    try {
      const success = await onUpdateStatus(ordemCompra.id, "em_transito");
      if (success) {
        toast.success("Ordem marcada como em trânsito!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceber = async () => {
    if (!onUpdateStatus) return;
    
    setSubmitting(true);
    try {
      const success = await onUpdateStatus(ordemCompra.id, "entregue");
      if (success) {
        toast.success("Ordem finalizada - Material recebido!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async () => {
    if (!onUpdateStatus) return;

    setSubmitting(true);
    try {
      const success = await onUpdateStatus(ordemCompra.id, "cancelada");
      if (success) {
        setShowCancelarForm(false);
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Determinar botões disponíveis baseado no status
  const canConfirmar = ordemCompra.status === "emitida";
  const canEnviar = ordemCompra.status === "confirmada";
  const canReceber = ordemCompra.status === "em_transito";
  const canCancelar = ordemCompra.status !== "cancelada" && ordemCompra.status !== "entregue";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Ordem de Compra
          </DialogTitle>
          <DialogDescription>
            Informações completas da ordem de compra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{ordemCompra.numero}</h3>
                {getStatusBadge(ordemCompra.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                Requisição vinculada: {ordemCompra.requisicao_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Emitida em</p>
              <p className="text-sm font-medium">
                {format(new Date(ordemCompra.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Fornecedor */}
          <div>
            <h5 className="font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedor
            </h5>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-lg font-semibold">{ordemCompra.fornecedor_nome}</p>
              <p className="text-sm text-muted-foreground">ID: {ordemCompra.fornecedor_id}</p>
            </div>
          </div>

          {/* Valores */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Valores</h5>
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-tone-success" />
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-tone-success">
                  {ordemCompra.valor_total.toLocaleString('pt-AO')} AOA
                </p>
              </div>
            </div>
          </div>

          {/* Entrega */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Entrega</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Prazo de Entrega</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(ordemCompra.prazo_entrega), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Local de Entrega</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {ordemCompra.local_entrega}
                </p>
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Pagamento</h5>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <strong>Condições:</strong> {ordemCompra.condicoes_pagamento}
              </p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="border-t pt-4 space-y-4">
            {/* Botões de Mudança de Status */}
            {!showCancelarForm && (
              <div className="space-y-3">
                {/* Status: Emitida → Confirmada */}
                {canConfirmar && (
                  <div className="flex items-start gap-3 p-4 bg-tone-info-soft border border-tone-info/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-tone-info mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-tone-info">Aguardando confirmação do fornecedor</p>
                      <p className="text-sm text-tone-info mt-1">
                        Clique abaixo quando o fornecedor confirmar o recebimento da ordem
                      </p>
                      <Button
                        onClick={handleConfirmar}
                        disabled={submitting}
                        style={{ backgroundColor: 'var(--tone-success)' }}
                        className="mt-3 text-white hover:opacity-90"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {submitting ? "A processar..." : "Confirmar Recebimento pelo Fornecedor"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status: Confirmada → Em Trânsito */}
                {canEnviar && (
                  <div className="flex items-start gap-3 p-4 bg-tone-success-soft border border-tone-success/30 rounded-lg">
                    <Truck className="h-5 w-5 text-tone-success mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-tone-success">Ordem confirmada</p>
                      <p className="text-sm text-tone-success mt-1">
                        Marque como "Em Trânsito" quando o fornecedor enviar os produtos
                      </p>
                      <Button
                        onClick={handleEnviar}
                        disabled={submitting}
                        style={{ backgroundColor: 'var(--tone-gold)' }}
                        className="mt-3 text-white hover:opacity-90"
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        {submitting ? "A processar..." : "Marcar como Em Trânsito"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status: Em Trânsito → Entregue */}
                {canReceber && (
                  <div className="flex items-start gap-3 p-4 bg-tone-warn-soft border border-tone-warn/30 rounded-lg">
                    <Package className="h-5 w-5 text-tone-warn mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-tone-warn">Produtos em trânsito</p>
                      <p className="text-sm text-tone-warn mt-1">
                        Confirme o recebimento quando os produtos chegarem
                      </p>
                      <Button
                        onClick={handleReceber}
                        disabled={submitting}
                        style={{ backgroundColor: 'var(--tone-success)' }}
                        className="mt-3 text-white hover:opacity-90"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        {submitting ? "A processar..." : "Confirmar Recebimento"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status: Entregue */}
                {ordemCompra.status === "entregue" && (
                  <div className="flex items-start gap-3 p-4 bg-tone-success-soft border border-tone-success/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-tone-success mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-tone-success">✅ Ordem Finalizada</p>
                      <p className="text-sm text-tone-success mt-1">
                        Produtos recebidos com sucesso
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão Cancelar */}
                {canCancelar && (
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={() => setShowCancelarForm(true)} 
                      variant="destructive"
                      disabled={submitting}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar Ordem de Compra
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Formulário de Cancelamento */}
            {showCancelarForm && (
              <div className="border rounded-lg p-4 bg-tone-danger-soft space-y-4">
                <h5 className="font-semibold text-tone-danger flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Cancelar Ordem de Compra
                </h5>
                <p className="text-sm text-tone-danger">
                  Tem certeza que deseja cancelar esta ordem de compra? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCancelar} 
                    disabled={submitting}
                    variant="destructive"
                  >
                    {submitting ? "A processar..." : "Confirmar Cancelamento"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelarForm(false)} 
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
