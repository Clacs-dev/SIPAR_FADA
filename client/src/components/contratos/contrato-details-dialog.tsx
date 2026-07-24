/**
 * Dialog de Detalhes do Contrato
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
  Calendar,
  DollarSign,
  User,
  Building,
  Clock,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner@2.0.3";
import type { Contrato, StatusContrato } from "./types";

interface ContratoDetailsDialogProps {
  contrato: Contrato | null;
  open: boolean;
  onClose: () => void;
  onAprovar?: (id: string) => Promise<boolean>;
  onCancelar?: (id: string, motivo: string) => Promise<boolean>;
  onEnviarValidacaoJuridica?: (id: string) => Promise<boolean>;
  onValidarJuridico?: (id: string, observacoes?: string) => Promise<boolean>;
  onRejeitarJuridico?: (id: string, motivo: string) => Promise<boolean>;
  isAdmin?: boolean;
  isJuridico?: boolean;
}

export function ContratoDetailsDialog({
  contrato,
  open,
  onClose,
  onAprovar,
  onCancelar,
  onEnviarValidacaoJuridica,
  onValidarJuridico,
  onRejeitarJuridico,
  isAdmin,
  isJuridico,
}: ContratoDetailsDialogProps) {
  const [showCancelarForm, setShowCancelarForm] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [showRejeitarJuridicoForm, setShowRejeitarJuridicoForm] = useState(false);
  const [motivoRejeicaoJuridica, setMotivoRejeicaoJuridica] = useState("");
  const [observacoesValidacao, setObservacoesValidacao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!contrato) return null;

  const getStatusBadge = (status: StatusContrato) => {
    const badges = {
      rascunho: { label: "Rascunho", color: "bg-gray-500" },
      validacao_juridica: { label: "Em Validação Jurídica", color: "bg-purple-500" },
      validado_juridico: { label: "Validado (Jurídico)", color: "bg-cyan-500" },
      rejeitado_juridico: { label: "Rejeitado (Jurídico)", color: "bg-red-600" },
      em_aprovacao: { label: "Em Aprovação", color: "bg-yellow-500" },
      ativo: { label: "Ativo", color: "bg-green-500" },
      suspenso: { label: "Suspenso", color: "bg-orange-500" },
      renovacao_pendente: { label: "Renovação Pendente", color: "bg-blue-500" },
      expirado: { label: "Expirado", color: "bg-red-500" },
      cancelado: { label: "Cancelado", color: "bg-gray-600" },
    };
    const badge = badges[status] || badges.rascunho;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      prestacao_servicos: "Prestação de Serviços",
      fornecimento: "Fornecimento",
      locacao: "Locação",
      manutencao: "Manutenção",
      consultoria: "Consultoria",
      licenciamento: "Licenciamento",
      outro: "Outro",
    };
    return tipos[tipo] || tipo;
  };

  const handleAprovar = async () => {
    if (!onAprovar) return;
    
    setSubmitting(true);
    try {
      const success = await onAprovar(contrato.id);
      if (success) {
        toast.success("Contrato aprovado e ativado!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async () => {
    if (!onCancelar || !motivoCancelamento.trim()) {
      toast.error("Digite o motivo do cancelamento");
      return;
    }

    setSubmitting(true);
    try {
      const success = await onCancelar(contrato.id, motivoCancelamento);
      if (success) {
        setMotivoCancelamento("");
        setShowCancelarForm(false);
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnviarValidacaoJuridica = async () => {
    if (!onEnviarValidacaoJuridica) return;
    
    setSubmitting(true);
    try {
      const success = await onEnviarValidacaoJuridica(contrato.id);
      if (success) {
        toast.success("Contrato enviado para validação jurídica!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidarJuridico = async () => {
    if (!onValidarJuridico) return;
    
    setSubmitting(true);
    try {
      const success = await onValidarJuridico(contrato.id, observacoesValidacao);
      if (success) {
        toast.success("Contrato validado juridicamente!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejeitarJuridico = async () => {
    if (!onRejeitarJuridico || !motivoRejeicaoJuridica.trim()) {
      toast.error("Digite o motivo da rejeição jurídica");
      return;
    }

    setSubmitting(true);
    try {
      const success = await onRejeitarJuridico(contrato.id, motivoRejeicaoJuridica);
      if (success) {
        setMotivoRejeicaoJuridica("");
        setShowRejeitarJuridicoForm(false);
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Determinar ações disponíveis baseado no status
  const canAprovar = contrato.status === "rascunho" || contrato.status === "em_aprovacao";
  const canCancelar = contrato.status !== "cancelado" && contrato.status !== "expirado";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Contrato
          </DialogTitle>
          <DialogDescription>
            Informações completas do contrato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{contrato.numero}</h3>
                {getStatusBadge(contrato.status)}
                {contrato.alerta_vencimento && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Vencimento Próximo
                  </Badge>
                )}
              </div>
              <h4 className="text-lg font-semibold">{contrato.titulo}</h4>
              {contrato.descricao && (
                <p className="text-sm text-muted-foreground mt-2">{contrato.descricao}</p>
              )}
            </div>
          </div>

          {/* Informações Principais */}
          <div>
            <h5 className="font-semibold mb-3">Informações Principais</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Contrato</p>
                <p className="text-sm font-medium">{getTipoLabel(contrato.tipo)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contratante</p>
                <p className="text-sm font-medium">{contrato.contratante}</p>
              </div>
            </div>
          </div>

          {/* Partes Envolvidas */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Parte Contratada</h5>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nome/Empresa</p>
                  <p className="text-sm font-medium">
                    {contrato.contratado_nome || contrato.fornecedor_nome}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Documento/NIF</p>
                  <p className="text-sm font-medium">
                    {contrato.contratado_documento || contrato.fornecedor_nif}
                  </p>
                </div>
              </div>
              {(contrato.contratado_contato || contrato.fornecedor_contato) && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contato</p>
                    <p className="text-sm font-medium">
                      {contrato.contratado_contato || contrato.fornecedor_contato}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vigência */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Vigência do Contrato</h5>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Início</p>
                  <p className="text-sm font-medium">
                    {format(new Date(contrato.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Término</p>
                  <p className="text-sm font-medium">
                    {format(new Date(contrato.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="text-sm font-medium">{contrato.duracao_meses} meses</p>
                </div>
              </div>
            </div>
            {contrato.dias_para_vencimento !== undefined && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm">
                  <strong>Dias para vencimento:</strong> {contrato.dias_para_vencimento} dias
                </p>
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Renovação Automática</p>
                <p className="text-sm font-medium">
                  {contrato.renovacao_automatica ? "Sim" : "Não"}
                </p>
              </div>
              {contrato.prazo_aviso_renovacao && (
                <div>
                  <p className="text-xs text-muted-foreground">Prazo de Aviso</p>
                  <p className="text-sm font-medium">
                    {contrato.prazo_aviso_renovacao} dias antes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Valores */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Valores</h5>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-bold text-green-600">
                    {contrato.valor_total.toLocaleString('pt-AO')} {contrato.moeda}
                  </p>
                </div>
              </div>
              {contrato.valor_mensal && (
                <div>
                  <p className="text-xs text-muted-foreground">Valor Mensal</p>
                  <p className="text-sm font-medium">
                    {contrato.valor_mensal.toLocaleString('pt-AO')} {contrato.moeda}
                  </p>
                </div>
              )}
              {contrato.forma_pagamento && (
                <div>
                  <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                  <p className="text-sm font-medium capitalize">
                    {contrato.forma_pagamento.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Responsáveis */}
          {(contrato.gestor_contrato_nome || contrato.departamento_responsavel) && (
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Gestão</h5>
              <div className="grid grid-cols-2 gap-4">
                {contrato.gestor_contrato_nome && (
                  <div>
                    <p className="text-xs text-muted-foreground">Gestor do Contrato</p>
                    <p className="text-sm font-medium">{contrato.gestor_contrato_nome}</p>
                  </div>
                )}
                {contrato.departamento_responsavel && (
                  <div>
                    <p className="text-xs text-muted-foreground">Departamento</p>
                    <p className="text-sm font-medium">{contrato.departamento_responsavel}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documentos */}
          {contrato.documentos && contrato.documentos.length > 0 && (
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Documentos ({contrato.documentos.length})</h5>
              <div className="space-y-2">
                {contrato.documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.tamanho / 1024).toFixed(2)} KB • 
                          Enviado em {format(new Date(doc.uploaded_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {contrato.observacoes && (
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-2">Observações</h5>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{contrato.observacoes}</p>
              </div>
            </div>
          )}

          {/* Histórico de Renovações */}
          {contrato.historico_renovacoes && contrato.historico_renovacoes.length > 0 && (
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Histórico de Renovações</h5>
              <div className="space-y-2">
                {contrato.historico_renovacoes.map((renovacao) => (
                  <div key={renovacao.id} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Data:</strong> {format(new Date(renovacao.data_renovacao), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm">
                      <strong>Nova data de término:</strong> {format(new Date(renovacao.nova_data_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm">
                      <strong>Valor:</strong> {renovacao.valor_anterior.toLocaleString('pt-AO')} → {renovacao.valor_novo.toLocaleString('pt-AO')} {contrato.moeda}
                    </p>
                    <p className="text-xs text-muted-foreground">Por: {renovacao.usuario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>Criado por: {contrato.created_by_name}</p>
            <p>Data de criação: {format(new Date(contrato.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            {contrato.updated_at && (
              <p>Última atualização: {format(new Date(contrato.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            )}
          </div>

          {/* BOTÕES DE AÇÃO */}
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
                    {submitting ? "A processar..." : "Aprovar e Ativar"}
                  </Button>
                )}
                {canCancelar && (
                  <Button 
                    onClick={() => setShowCancelarForm(true)} 
                    variant="destructive"
                    disabled={submitting}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar Contrato
                  </Button>
                )}
                {isAdmin && contrato.status === "rascunho" && (
                  <Button 
                    onClick={handleEnviarValidacaoJuridica} 
                    disabled={submitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Enviar para Validação Jurídica
                  </Button>
                )}
                {isJuridico && contrato.status === "validacao_juridica" && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleValidarJuridico} 
                      disabled={submitting}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validar Contrato
                    </Button>
                    <Button 
                      onClick={() => setShowRejeitarJuridicoForm(true)} 
                      variant="destructive"
                      disabled={submitting}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeitar Contrato
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Formulário de Cancelamento */}
            {showCancelarForm && (
              <div className="border rounded-lg p-4 bg-red-50 space-y-4">
                <h5 className="font-semibold text-red-900">Cancelar Contrato</h5>
                <div>
                  <Label>Motivo do Cancelamento *</Label>
                  <Textarea
                    value={motivoCancelamento}
                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                    placeholder="Descreva o motivo do cancelamento..."
                    rows={3}
                  />
                </div>
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
                    onClick={() => {
                      setShowCancelarForm(false);
                      setMotivoCancelamento("");
                    }} 
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Formulário de Rejeição Jurídica */}
            {showRejeitarJuridicoForm && (
              <div className="border rounded-lg p-4 bg-red-50 space-y-4">
                <h5 className="font-semibold text-red-900">Rejeitar Contrato (Jurídico)</h5>
                <div>
                  <Label>Motivo da Rejeição *</Label>
                  <Textarea
                    value={motivoRejeicaoJuridica}
                    onChange={(e) => setMotivoRejeicaoJuridica(e.target.value)}
                    placeholder="Descreva o motivo da rejeição..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRejeitarJuridico} 
                    disabled={submitting}
                    variant="destructive"
                  >
                    {submitting ? "A processar..." : "Confirmar Rejeição"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRejeitarJuridicoForm(false);
                      setMotivoRejeicaoJuridica("");
                    }} 
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Formulário de Validação Jurídica */}
            {isJuridico && contrato.status === "validacao_juridica" && (
              <div className="border rounded-lg p-4 bg-cyan-50 space-y-4">
                <h5 className="font-semibold text-cyan-900">Validar Contrato (Jurídico)</h5>
                <div>
                  <Label>Observações (Opcional)</Label>
                  <Textarea
                    value={observacoesValidacao}
                    onChange={(e) => setObservacoesValidacao(e.target.value)}
                    placeholder="Adicione observações sobre a validação..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleValidarJuridico} 
                    disabled={submitting}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    {submitting ? "A processar..." : "Validar Contrato"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setObservacoesValidacao("");
                    }} 
                    disabled={submitting}
                  >
                    Limpar
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