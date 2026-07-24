/**
 * Dialog de Detalhes da Reclamação com Ações
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  CheckCircle2,
  XCircle,
  UserPlus,
  MessageSquare,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle,
  Star,
  FileText,
  Paperclip,
  UserCircle,
  Package,
  Globe,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner@2.0.3";
import type { Reclamacao, StatusReclamacao } from "./types";
import { Separator } from "../ui/separator";

interface ReclamacaoDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  reclamacao: Reclamacao;
  onAtribuir: (id: string, responsavelId: string, responsavelNome: string) => Promise<boolean>;
  onAdicionarAcao: (id: string, descricao: string) => Promise<boolean>;
  onResolver: (id: string, solucao: string, acoes: string[]) => Promise<boolean>;
  currentUserId: string;
  currentUserName: string;
}

export function ReclamacaoDetailsDialog({
  reclamacao,
  open,
  onClose,
  onAtribuir,
  onAdicionarAcao,
  onResolver,
  currentUserId,
  currentUserName,
}: ReclamacaoDetailsDialogProps) {
  const [showAtribuirForm, setShowAtribuirForm] = useState(false);
  const [showAcaoForm, setShowAcaoForm] = useState(false);
  const [showResolverForm, setShowResolverForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados dos formulários
  const [novaAcao, setNovaAcao] = useState("");
  const [solucao, setSolucao] = useState("");
  const [acoes, setAcoes] = useState<string[]>([""]);

  const getStatusBadge = (status: StatusReclamacao) => {
    const badges = {
      registrado: { label: "Registado", color: "bg-blue-500", icon: FileText },
      em_resolucao: { label: "Em Resolução", color: "bg-orange-500", icon: AlertCircle },
      resolvido: { label: "Resolvido", color: "bg-green-500", icon: CheckCircle2 },
      fechado: { label: "Fechado", color: "bg-gray-600", icon: XCircle },
    };
    const badge = badges[status] || badges.registrado;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      baixa: { label: "Baixa", color: "bg-green-500" },
      media: { label: "Média", color: "bg-yellow-500" },
      alta: { label: "Alta", color: "bg-orange-500" },
      urgente: { label: "Urgente", color: "bg-red-600" },
    };
    const badge = badges[prioridade] || badges.media;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const handleAtribuir = async () => {
    setSubmitting(true);
    try {
      const success = await onAtribuir(reclamacao.id, currentUserId, currentUserName);
      if (success) {
        setShowAtribuirForm(false);
        toast.success("Reclamação colocada em resolução com sucesso!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdicionarAcao = async () => {
    if (!novaAcao.trim()) {
      toast.error("Digite a descrição da ação");
      return;
    }
    setSubmitting(true);
    try {
      const success = await onAdicionarAcao(reclamacao.id, novaAcao);
      if (success) {
        setNovaAcao("");
        setShowAcaoForm(false);
        toast.success("Ação adicionada com sucesso!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolver = async () => {
    if (!solucao.trim()) {
      toast.error("Digite a solução da reclamação");
      return;
    }
    setSubmitting(true);
    try {
      const acoesValidas = acoes.filter(a => a.trim());
      const success = await onResolver(reclamacao.id, solucao, acoesValidas);
      if (success) {
        setSolucao("");
        setAcoes([""]);
        setShowResolverForm(false);
        toast.success("Reclamação resolvida com sucesso!");
        onClose();
      }
    } catch (error) {
 console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const addAcaoField = () => {
    setAcoes([...acoes, ""]);
  };

  const updateAcao = (index: number, value: string) => {
    const newAcoes = [...acoes];
    newAcoes[index] = value;
    setAcoes(newAcoes);
  };

  // Determinar ações disponíveis baseado no novo workflow
  const isCreator = reclamacao.created_by_id === currentUserId;
  const isAdmin = true; // Como estamos no contexto de admin, sempre pode realizar todas as ações
  const canIniciarResolucao = reclamacao.status === "registrado"; // Botão "Resolver" para iniciar
  const canMarcarResolvido = reclamacao.status === "em_resolucao"; // Botão "Marcar como Resolvido" 
  const canAdicionarAcao = reclamacao.status !== "fechado";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Detalhes da Reclamação
          </DialogTitle>
          <DialogDescription>
            Informações completas da reclamação e ações disponíveis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{reclamacao.numero}</h3>
                {getStatusBadge(reclamacao.status)}
                {getPrioridadeBadge(reclamacao.prioridade)}
              </div>
              <h4 className="text-lg font-semibold">{reclamacao.assunto}</h4>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h5 className="font-semibold mb-2">Descrição</h5>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{reclamacao.descricao}</p>
            </div>
          </div>

          {/* Informações do Reclamante */}
          <div>
            <h5 className="font-semibold mb-3">Informações do Reclamante</h5>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{reclamacao.reclamante_email}</p>
              </div>
            </div>
          </div>

          {/* Responsável */}
          {reclamacao.responsavel_nome && (
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-2">Responsável</h5>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm"><strong>Atribuído a:</strong> {reclamacao.responsavel_nome}</p>
                {reclamacao.atribuido_em && (
                  <p className="text-sm text-muted-foreground">
                    Data: {format(new Date(reclamacao.atribuido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Solução */}
          {reclamacao.status === "resolvido" && reclamacao.solucao && (
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-2">Solução</h5>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm">{reclamacao.solucao}</p>
                {reclamacao.data_resolucao && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Resolvida em: {format(new Date(reclamacao.data_resolucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
                {reclamacao.acoes_tomadas && reclamacao.acoes_tomadas.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Ações Tomadas:</p>
                    <ul className="list-disc list-inside text-sm">
                      {reclamacao.acoes_tomadas.map((acao, idx) => (
                        <li key={idx}>{acao}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Abertura</p>
                  <p className="font-medium">
                    {format(new Date(reclamacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              {reclamacao.prazo_resolucao && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Prazo de Resolução</p>
                    <p className="font-medium">
                      {format(new Date(reclamacao.prazo_resolucao), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FORMULÁRIOS DE AÇÃO */}
          <div className="border-t pt-4 space-y-4">
            {/* Botões de Ação */}
            {!showAtribuirForm && !showAcaoForm && !showResolverForm && (
              <div className="flex gap-2 flex-wrap">
                {canIniciarResolucao && (
                  <Button onClick={() => setShowAtribuirForm(true)} className="bg-orange-600 hover:bg-orange-700">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Resolver
                  </Button>
                )}
                {canAdicionarAcao && (
                  <Button onClick={() => setShowAcaoForm(true)} variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Adicionar Ação
                  </Button>
                )}
                {canMarcarResolvido && (
                  <Button onClick={() => setShowResolverForm(true)} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Resolvido
                  </Button>
                )}
              </div>
            )}

            {/* Formulário de Atribuição */}
            {showAtribuirForm && (
              <div className="border rounded-lg p-4 bg-orange-50 space-y-4">
                <h5 className="font-semibold">Iniciar Resolução</h5>
                <p className="text-sm">Deseja colocar esta reclamação em resolução e atribuí-la a você ({currentUserName})?</p>
                <div className="flex gap-2">
                  <Button onClick={handleAtribuir} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                    {submitting ? "A processar..." : "Confirmar"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAtribuirForm(false)} disabled={submitting}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Formulário de Adicionar Ação */}
            {showAcaoForm && (
              <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
                <h5 className="font-semibold">Adicionar Ação</h5>
                <div>
                  <Label>Descrição da Ação *</Label>
                  <Textarea
                    value={novaAcao}
                    onChange={(e) => setNovaAcao(e.target.value)}
                    placeholder="Descreva a ação realizada..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdicionarAcao} disabled={submitting}>
                    {submitting ? "A processar..." : "Adicionar"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAcaoForm(false)} disabled={submitting}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Formulário de Resolução */}
            {showResolverForm && (
              <div className="border rounded-lg p-4 bg-green-50 space-y-4">
                <h5 className="font-semibold">Resolver Reclamação</h5>
                <div>
                  <Label>Solução *</Label>
                  <Textarea
                    value={solucao}
                    onChange={(e) => setSolucao(e.target.value)}
                    placeholder="Descreva a solução aplicada..."
                    rows={3}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Ações Tomadas (opcional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAcaoField}>
                      + Adicionar
                    </Button>
                  </div>
                  {acoes.map((acao, idx) => (
                    <Input
                      key={idx}
                      value={acao}
                      onChange={(e) => updateAcao(idx, e.target.value)}
                      placeholder={`Ação ${idx + 1}`}
                      className="mb-2"
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleResolver} disabled={submitting}>
                    {submitting ? "A processar..." : "Confirmar Resolução"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowResolverForm(false)} disabled={submitting}>
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