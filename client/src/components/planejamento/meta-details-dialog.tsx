/**
 * Dialog de Detalhes e Acompanhamento de Metas
 * Visualização completa + Registro de Progresso
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import {
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Building,
  Activity,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner@2.0.3";
import type { Meta } from "./types";

interface MetaDetailsDialogProps {
  meta: Meta | null;
  open: boolean;
  onClose: () => void;
  onRegistrarProgresso?: (metaId: string, dados: any) => Promise<any>;
}

export function MetaDetailsDialog({
  meta,
  open,
  onClose,
  onRegistrarProgresso,
}: MetaDetailsDialogProps) {
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressData, setProgressData] = useState({
    data: new Date().toISOString().split("T")[0],
    valor_realizado: 0,
    observacao: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!meta) return null;

  // Cálculos
  const diasRestantes = differenceInDays(new Date(meta.data_fim), new Date());
  const diasDecorridos = meta.prazo_dias - diasRestantes;
  const percentualTempo = (diasDecorridos / meta.prazo_dias) * 100;
  const metaDiariaEsperada = meta.valor_alvo / meta.prazo_dias;
  const valorEsperado = metaDiariaEsperada * diasDecorridos;
  const desvio = meta.valor_atual - valorEsperado;
  const desvioPercentual = valorEsperado > 0 ? (desvio / valorEsperado) * 100 : 0;

  // Status Badges
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      planejada: { label: "Planejada", color: "bg-gray-500" },
      em_andamento: { label: "Em Andamento", color: "bg-blue-500" },
      atrasada: { label: "Atrasada", color: "bg-red-500" },
      atingida: { label: "Atingida", color: "bg-green-500" },
      cancelada: { label: "Cancelada", color: "bg-gray-600" },
    };
    const badge = badges[status] || badges.planejada;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      baixa: { label: "Baixa", color: "bg-gray-400" },
      media: { label: "Média", color: "bg-yellow-500" },
      alta: { label: "Alta", color: "bg-orange-500" },
      critica: { label: "Crítica", color: "bg-red-600" },
    };
    const badge = badges[prioridade] || badges.media;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  // Registrar Progresso
  const handleRegistrarProgresso = async () => {
    if (progressData.valor_realizado <= 0) {
      toast.error("Valor realizado deve ser maior que zero");
      return;
    }

    if (!onRegistrarProgresso) {
      toast.error("Função de registro não disponível");
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegistrarProgresso(meta.id, progressData);
      toast.success("Progresso registrado com sucesso!");
      setShowProgressForm(false);
      setProgressData({
        data: new Date().toISOString().split("T")[0],
        valor_realizado: 0,
        observacao: "",
      });
    } catch (error) {
      toast.error("Erro ao registrar progresso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Detalhes da Meta
          </DialogTitle>
          <DialogDescription>Acompanhamento completo e registro de progresso</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between border-b pb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{meta.titulo}</h3>
                {getStatusBadge(meta.status)}
                {getPrioridadeBadge(meta.prioridade)}
                <Badge variant="outline" className="capitalize">
                  {meta.tipo}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{meta.numero}</p>
              {meta.descricao && <p className="text-sm mt-2">{meta.descricao}</p>}
            </div>
          </div>

          {/* Progresso Geral */}
          <div className="border rounded-lg p-4 space-y-4">
            <h5 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Progresso da Meta
            </h5>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Progresso Atual</p>
                  <p className="text-sm font-bold">{meta.percentual_progresso.toFixed(1)}%</p>
                </div>
                <Progress value={meta.percentual_progresso} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-3 bg-blue-50">
                  <p className="text-xs text-muted-foreground">Valor Alvo</p>
                  <p className="text-lg font-bold text-blue-700">
                    {meta.valor_alvo.toLocaleString("pt-AO")} {meta.unidade_medida}
                  </p>
                </div>
                <div className="border rounded-lg p-3 bg-green-50">
                  <p className="text-xs text-muted-foreground">Valor Atual</p>
                  <p className="text-lg font-bold text-green-700">
                    {meta.valor_atual.toLocaleString("pt-AO")} {meta.unidade_medida}
                  </p>
                </div>
                <div
                  className={`border rounded-lg p-3 ${desvio >= 0 ? "bg-green-50" : "bg-red-50"}`}
                >
                  <p className="text-xs text-muted-foreground">Desvio</p>
                  <p className={`text-lg font-bold ${desvio >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {desvio >= 0 ? "+" : ""}
                    {desvio.toLocaleString("pt-AO")} ({desvioPercentual.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Análise de Tempo */}
          <div className="border rounded-lg p-4 space-y-3">
            <h5 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Análise de Prazo
            </h5>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Prazo Total</p>
                <p className="text-sm font-bold">{meta.prazo_dias} dias</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dias Decorridos</p>
                <p className="text-sm font-bold">{diasDecorridos} dias</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dias Restantes</p>
                <p className={`text-sm font-bold ${diasRestantes < 7 ? "text-red-600" : ""}`}>
                  {diasRestantes} dias
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo Decorrido</p>
                <p className="text-sm font-bold">{percentualTempo.toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="font-medium">
                    {format(new Date(meta.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fim</p>
                  <p className="font-medium">
                    {format(new Date(meta.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Meta Diária</p>
                  <p className="font-bold text-blue-700">
                    {metaDiariaEsperada.toLocaleString("pt-AO", { maximumFractionDigits: 2 })}{" "}
                    {meta.unidade_medida}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Esperado (Hoje)</p>
                  <p className="font-bold text-blue-700">
                    {valorEsperado.toLocaleString("pt-AO", { maximumFractionDigits: 2 })}{" "}
                    {meta.unidade_medida}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Faltam Realizar</p>
                  <p className="font-bold text-blue-700">
                    {(meta.valor_alvo - meta.valor_atual).toLocaleString("pt-AO", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    {meta.unidade_medida}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Metas */}
          {meta.sub_metas && meta.sub_metas.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h5 className="font-semibold">Sub-Metas / Marcos Intermediários</h5>
              <div className="space-y-2">
                {meta.sub_metas.map((sm, idx) => (
                  <div
                    key={sm.id}
                    className={`border rounded-lg p-3 ${sm.atingida ? "bg-green-50 border-green-200" : "bg-muted"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {sm.atingida ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Target className="h-4 w-4 text-muted-foreground" />
                          )}
                          <p className="font-medium">{sm.titulo}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <p>
                            Valor: {sm.valor_alvo.toLocaleString("pt-AO")} {meta.unidade_medida}
                          </p>
                          <p>Prazo: {format(new Date(sm.prazo), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                      </div>
                      {sm.atingida && (
                        <Badge className="bg-green-600 text-white">
                          Atingida {sm.data_conclusao ? `em ${format(new Date(sm.data_conclusao), "dd/MM/yyyy")}` : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted p-2 rounded text-sm">
                <p className="font-semibold">
                  Progresso: {meta.sub_metas.filter((sm) => sm.atingida).length} de {meta.sub_metas.length} sub-metas atingidas
                </p>
              </div>
            </div>
          )}

          {/* Responsáveis */}
          <div className="border rounded-lg p-4">
            <h5 className="font-semibold mb-3">Responsáveis</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Departamento</p>
                  <p className="text-sm font-medium">{meta.departamento}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="text-sm font-medium">{meta.responsavel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Necessárias */}
          {meta.acoes_necessarias && meta.acoes_necessarias.length > 0 && (
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold mb-3">Ações Necessárias</h5>
              <ul className="space-y-2">
                {meta.acoes_necessarias.map((acao, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm">{acao}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Riscos */}
          {meta.riscos && meta.riscos.length > 0 && (
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold mb-3">Riscos Identificados</h5>
              <ul className="space-y-2">
                {meta.riscos.map((risco, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <p className="text-sm">{risco}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Observações */}
          {meta.observacoes && (
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold mb-2">Observações</h5>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{meta.observacoes}</p>
              </div>
            </div>
          )}

          {/* Registro de Progresso */}
          {meta.status === "em_andamento" && !showProgressForm && (
            <div className="border-t pt-4">
              <Button onClick={() => setShowProgressForm(true)} className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Registrar Progresso
              </Button>
            </div>
          )}

          {/* Formulário de Progresso */}
          {showProgressForm && (
            <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
              <h5 className="font-semibold">Registrar Progresso</h5>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_progresso">Data</Label>
                  <Input
                    id="data_progresso"
                    type="date"
                    value={progressData.data}
                    onChange={(e) => setProgressData({ ...progressData, data: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="valor_realizado">
                    Valor Realizado ({meta.unidade_medida})
                  </Label>
                  <Input
                    id="valor_realizado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={progressData.valor_realizado || ""}
                    onChange={(e) =>
                      setProgressData({
                        ...progressData,
                        valor_realizado: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacao_progresso">Observação</Label>
                <Textarea
                  id="observacao_progresso"
                  value={progressData.observacao}
                  onChange={(e) =>
                    setProgressData({ ...progressData, observacao: e.target.value })
                  }
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRegistrarProgresso}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "A registrar..." : "Confirmar Progresso"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowProgressForm(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>Criada por: {meta.criado_por}</p>
            <p>
              Data de criação:{" "}
              {format(new Date(meta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {meta.atualizado_em && (
              <p>
                Última atualização:{" "}
                {format(new Date(meta.atualizado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
            {meta.concluida_em && (
              <p>
                Concluída em:{" "}
                {format(new Date(meta.concluida_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
