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
      emitida: { label: "Emitida", color: "bg-blue-500" },
      confirmada: { label: "Confirmada", color: "bg-green-500" },
      em_transito: { label: "Em Trânsito", color: "bg-yellow-500" },
      entregue: { label: "Entregue", color: "bg-green-600" },
      cancelada: { label: "Cancelada", color: "bg-gray-500" },
    };
    const badge = badges[status as keyof typeof badges] || badges.emitida;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
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
              <DollarSign className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
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
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Aguardando confirmação do fornecedor</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Clique abaixo quando o fornecedor confirmar o recebimento da ordem
                      </p>
                      <Button 
                        onClick={handleConfirmar} 
                        disabled={submitting}
                        className="mt-3 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {submitting ? "A processar..." : "Confirmar Recebimento pelo Fornecedor"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status: Confirmada → Em Trânsito */}
                {canEnviar && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">Ordem confirmada</p>
                      <p className="text-sm text-green-700 mt-1">
                        Marque como "Em Trânsito" quando o fornecedor enviar os produtos
                      </p>
                      <Button 
                        onClick={handleEnviar} 
                        disabled={submitting}
                        className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        {submitting ? "A processar..." : "Marcar como Em Trânsito"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status: Em Trânsito → Entregue */}
                {canReceber && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Package className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">Produtos em trânsito</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Confirme o recebimento quando os produtos chegarem
                      </p>
                      <Button 
                        onClick={handleReceber} 
                        disabled={submitting}
                        className="mt-3 bg-green-600 hover:bg-green-700"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        {submitting ? "A processar..." : "Confirmar Recebimento"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status: Entregue */}
                {ordemCompra.status === "entregue" && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">✅ Ordem Finalizada</p>
                      <p className="text-sm text-green-700 mt-1">
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
              <div className="border rounded-lg p-4 bg-red-50 space-y-4">
                <h5 className="font-semibold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Cancelar Ordem de Compra
                </h5>
                <p className="text-sm text-red-800">
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
