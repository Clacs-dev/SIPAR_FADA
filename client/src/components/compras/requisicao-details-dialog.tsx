/**
 * Dialog de Detalhes da Requisição
 * Visível para TODOS os usuários
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
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  FileText,
  CheckCircle,
  XCircle,
  Package,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner@2.0.3";
import type { Requisicao, StatusCompra } from "./types";

interface RequisicaoDetailsDialogProps {
  requisicao: Requisicao | null;
  open: boolean;
  onClose: () => void;
  onAprovar?: (id: string) => Promise<boolean>;
  onCancelar?: (id: string) => Promise<boolean>;
  onCriarOrdem?: (requisicao: Requisicao) => void; // Nova função para abrir dialog de criar ordem
  canManage?: boolean; // Apenas departamento de Compras pode aprovar/cancelar
}

export function RequisicaoDetailsDialog({
  requisicao,
  open,
  onClose,
  onAprovar,
  onCancelar,
  onCriarOrdem,
  canManage = false,
}: RequisicaoDetailsDialogProps) {
  const [showCancelarForm, setShowCancelarForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // DEBUG
 console.log(' RequisicaoDetailsDialog - Props:', { 
    requisicao: requisicao?.numero, 
    open, 
    canManage 
  });

  if (!requisicao) {
 console.log(' RequisicaoDetailsDialog - Requisicao é null');
    return null;
  }

  const getStatusBadge = (status: StatusCompra) => {
    const badges = {
      requisicao: { label: "Pendente", color: "bg-yellow-500" },
      cotacao: { label: "Em Cotação", color: "bg-blue-500" },
      aprovacao: { label: "Aprovada", color: "bg-green-500" },
      ordem_compra: { label: "Em Compra", color: "bg-blue-600" },
      entrega: { label: "Em Entrega", color: "bg-orange-500" },
      recebida: { label: "Recebida", color: "bg-green-600" },
      cancelada: { label: "Cancelada", color: "bg-gray-500" },
    };
    const badge = badges[status] || badges.requisicao;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      material: "Material",
      servico: "Serviço",
      equipamento: "Equipamento",
      consumivel: "Consumível",
    };
    return tipos[tipo] || tipo;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges = {
      baixa: { label: "Baixa", color: "bg-gray-500" },
      normal: { label: "Normal", color: "bg-blue-500" },
      alta: { label: "Alta", color: "bg-orange-500" },
      urgente: { label: "Urgente", color: "bg-red-500" },
    };
    const badge = badges[prioridade as keyof typeof badges] || badges.normal;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const handleAprovar = async () => {
    if (!onAprovar) return;
    
    setSubmitting(true);
    try {
      const success = await onAprovar(requisicao.id);
      if (success) {
        toast.success("Requisição aprovada!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async () => {
    if (!onCancelar) return;

    setSubmitting(true);
    try {
      const success = await onCancelar(requisicao.id);
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

  // Determinar ações disponíveis baseado no status
  const canAprovar = requisicao.status === "requisicao" && canManage;
  const canCancelar = requisicao.status !== "cancelada" && requisicao.status !== "recebida" && canManage;
  const canCriarOrdem = requisicao.status === "aprovacao" && canManage && onCriarOrdem;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Requisição
          </DialogTitle>
          <DialogDescription>
            Informações completas da requisição de compra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{requisicao.numero}</h3>
                {getStatusBadge(requisicao.status)}
                {getPrioridadeBadge(requisicao.prioridade)}
              </div>
              <p className="text-sm text-muted-foreground">{requisicao.descricao}</p>
            </div>
          </div>

          {/* Informações Principais */}
          <div>
            <h5 className="font-semibold mb-3">Informações da Requisição</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium">{getTipoLabel(requisicao.tipo)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Departamento Solicitante</p>
                <p className="text-sm font-medium">{requisicao.departamento_solicitante}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Solicitante</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {requisicao.solicitante_nome}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de Criação</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(requisicao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Itens Solicitados */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens Solicitados ({requisicao.itens.length})
            </h5>
            <div className="space-y-2">
              {requisicao.itens.map((item, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.descricao}</p>
                      {item.especificacoes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Especificações: {item.especificacoes}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">
                        {item.quantidade} {item.unidade}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Justificativa */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-2">Justificativa</h5>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{requisicao.justificativa}</p>
            </div>
          </div>

          {/* Orçamento */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Orçamento</h5>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Valor Estimado</p>
                <p className="text-lg font-bold text-green-600">
                  {requisicao.orcamento_estimado.toLocaleString('pt-AO')} AOA
                </p>
              </div>
            </div>
          </div>

          {/* Ordem de Compra Vinculada */}
          {requisicao.status === 'ordem_compra' && requisicao.ordem_compra_numero && (
            <div className="border-t pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">Ordem de Compra Gerada</h5>
                <p className="text-sm text-blue-800">
                  <strong>Número:</strong> {requisicao.ordem_compra_numero}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Uma ordem de compra foi criada para esta requisição. 
                  {canManage && " Acesse a aba 'Ordens de Compra' para ver mais detalhes."}
                </p>
              </div>
            </div>
          )}

          {/* BOTÕES DE AÇÃO (Apenas para departamento de Compras) */}
          {canManage && (
            <div className="border-t pt-4 space-y-4">
              {/* Botões de Ação */}
              {!showCancelarForm && (
                <div className="flex gap-2 flex-wrap">
                  {canAprovar && (
                    <Button 
                      onClick={handleAprovar} 
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {submitting ? "A processar..." : "Aprovar Requisição"}
                    </Button>
                  )}
                  {canCancelar && (
                    <Button 
                      onClick={() => setShowCancelarForm(true)} 
                      variant="destructive"
                      disabled={submitting}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar Requisição
                    </Button>
                  )}
                  {canCriarOrdem && (
                    <Button 
                      onClick={() => onCriarOrdem(requisicao)} 
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Criar Ordem de Compra
                    </Button>
                  )}
                </div>
              )}

              {/* Formulário de Cancelamento */}
              {showCancelarForm && (
                <div className="border rounded-lg p-4 bg-red-50 space-y-4">
                  <h5 className="font-semibold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Cancelar Requisição
                  </h5>
                  <p className="text-sm text-red-800">
                    Tem certeza que deseja cancelar esta requisição? Esta ação não pode ser desfeita.
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
          )}

          {/* Aviso para usuários que não são de Compras */}
          {!canManage && requisicao.status === "requisicao" && (
            <div className="border-t pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Aguardando aprovação do Departamento de Compras</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}