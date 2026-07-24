/**
 * Dialog de Detalhes do Ticket - Pedido e Helpdesk
 */

import { useState } from "react";
import { X, Clock, CheckCircle, XCircle, User, Building, Briefcase, Calendar, Paperclip, MessageSquare, AlertCircle, ImageIcon, File } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Ticket, StatusTicket } from "./types";

interface TicketDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  onAbrir: (ticketId: string) => Promise<void>;
  onResolver: (ticketId: string, solucao: string, anexos?: any[]) => Promise<void>;
  onFechar: (ticketId: string, comentario?: string) => Promise<void>;
  isIT: boolean;
  isAdmin: boolean;
}

export function TicketDetailsDialog({
  open,
  onClose,
  ticket,
  onAbrir,
  onResolver,
  onFechar,
  isIT,
  isAdmin,
}: TicketDetailsDialogProps) {
  const [solucao, setSolucao] = useState("");
  const [comentarioFechamento, setComentarioFechamento] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAbrir = async () => {
    setLoading(true);
    try {
      await onAbrir(ticket.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = async () => {
    if (!solucao.trim()) {
      alert("Por favor, descreva a solução implementada");
      return;
    }

    setLoading(true);
    try {
      await onResolver(ticket.id, solucao);
      setSolucao("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleFechar = async () => {
    setLoading(true);
    try {
      await onFechar(ticket.id, comentarioFechamento);
      setComentarioFechamento("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: StatusTicket) => {
    const badges = {
      pendente: { label: "Aberto", color: "bg-yellow-500", icon: Clock },
      aberto: { label: "Em Resolução", color: "bg-blue-500", icon: AlertCircle },
      resolvido: { label: "Resolvido", color: "bg-green-500", icon: CheckCircle },
      fechado: { label: "Fechado", color: "bg-gray-500", icon: XCircle },
    };
    const badge = badges[status] || badges.pendente;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const getImportanciaBadge = (importancia: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      urgente: { label: "Urgente", color: "bg-red-600" },
      alta: { label: "Alta", color: "bg-orange-500" },
      normal: { label: "Normal", color: "bg-yellow-500" },
      baixa: { label: "Baixa", color: "bg-green-500" },
    };
    const badge = badges[importancia] || badges.normal;
    return <Badge className={`${badge.color} text-white border-0`}>{badge.label}</Badge>;
  };

  const podeAbrir = isIT && ticket.status === "pendente";
  const podeResolver = isIT && ticket.status === "aberto";
  const podeFechar = ticket.status === "resolvido" && ticket.solicitante_id === ticket.created_by_id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Detalhes do Ticket
              <span className="text-muted-foreground font-normal">{ticket.numero}</span>
            </span>
            {getStatusBadge(ticket.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho do Ticket */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{ticket.titulo}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {getImportanciaBadge(ticket.importancia)}
                  {ticket.categoria && (
                    <Badge variant="secondary">
                      {ticket.categoria}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações do Solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Solicitante</p>
                <p className="font-medium">{ticket.solicitante_nome}</p>
              </div>
            </div>

            {ticket.direcao && (
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Direção</p>
                  <p className="font-medium">{ticket.direcao}</p>
                </div>
              </div>
            )}

            {ticket.funcao && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Função</p>
                  <p className="font-medium">{ticket.funcao}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Descrição do Problema */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Descrição do Problema</Label>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{ticket.descricao}</p>
            </div>
          </div>

          {/* Anexos */}
          {ticket.anexos && ticket.anexos.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos ({ticket.anexos.length})
              </Label>
              <div className="border rounded-lg divide-y">
                {ticket.anexos.map((anexo) => (
                  <div key={anexo.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {anexo.tipo?.startsWith('image/') ? (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{anexo.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {anexo.tamanho ? `${(anexo.tamanho / 1024).toFixed(2)} KB` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {anexo.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={anexo.url} target="_blank" rel="noopener noreferrer">
                          Abrir
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solução (se resolvido) */}
          {ticket.solucao && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-base font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Solução Implementada
                </Label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap mb-3">{ticket.solucao.descricao}</p>
                  <div className="flex items-center gap-3 text-xs text-green-700">
                    <User className="h-3 w-3" />
                    <span>{ticket.solucao.resolvido_por_nome}</span>
                    <span>•</span>
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(ticket.solucao.resolvido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Comentário de Fechamento */}
          {ticket.comentario_fechamento && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentário de Fechamento
                </Label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap mb-3">{ticket.comentario_fechamento}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{ticket.fechado_por_nome}</span>
                    <span>•</span>
                    <Calendar className="h-3 w-3" />
                    <span>{ticket.fechado_em ? format(new Date(ticket.fechado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Timeline */}
          <Separator />
          <div className="space-y-2">
            <Label className="text-base font-semibold">Histórico</Label>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-blue-500 p-2">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="w-px h-full bg-border mt-2" />
                </div>
                <div className="pb-4">
                  <p className="font-medium text-sm">Ticket Criado</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {ticket.aberto_em && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-blue-600 p-2">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    {(ticket.resolvido_em || ticket.fechado_em) && <div className="w-px h-full bg-border mt-2" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">Ticket Aberto pela TI</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.aberto_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {ticket.resolvido_em && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-green-500 p-2">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    {ticket.fechado_em && <div className="w-px h-full bg-border mt-2" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">Problema Resolvido</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.resolvido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {ticket.fechado_em && (
                <div className="flex gap-3">
                  <div className="rounded-full bg-gray-500 p-2">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ticket Fechado</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.fechado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          {(podeAbrir || podeResolver || podeFechar) && (
            <>
              <Separator />
              
              {/* Abrir Ticket (IT) */}
              {podeAbrir && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 mb-3">
                      <strong>Ação da TI:</strong> Altere o status para "Em Resolução" para começar a trabalhar neste ticket.
                    </p>
                    <Button onClick={handleAbrir} disabled={loading} className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      {loading ? "Resolvendo..." : "Resolver Ticket"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Resolver Ticket (IT) */}
              {podeResolver && (
                <div className="space-y-3">
                  <Label htmlFor="solucao">Descreva a Solução Implementada *</Label>
                  <Textarea
                    id="solucao"
                    value={solucao}
                    onChange={(e) => setSolucao(e.target.value)}
                    placeholder="Descreva em detalhes como o problema foi resolvido..."
                    rows={4}
                  />
                  <Button onClick={handleResolver} disabled={loading || !solucao.trim()} className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {loading ? "Resolvendo..." : "Marcar como Resolvido"}
                  </Button>
                </div>
              )}

              {/* Fechar Ticket (Solicitante) */}
              {podeFechar && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                    <p className="text-sm text-green-900">
                      <strong>Confirmar Fechamento:</strong> Verifique se a solução apresentada resolveu o seu problema e confirme o fechamento do ticket.
                    </p>
                  </div>
                  <Label htmlFor="comentario">Comentário (opcional)</Label>
                  <Textarea
                    id="comentario"
                    value={comentarioFechamento}
                    onChange={(e) => setComentarioFechamento(e.target.value)}
                    placeholder="Adicione um comentário sobre a solução recebida..."
                    rows={3}
                  />
                  <Button onClick={handleFechar} disabled={loading} className="w-full">
                    <XCircle className="mr-2 h-4 w-4" />
                    {loading ? "Fechando..." : "Confirmar Fechamento"}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Botão Fechar Dialog */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}