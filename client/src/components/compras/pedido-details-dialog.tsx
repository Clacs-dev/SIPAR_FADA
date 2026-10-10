/**
 * Dialog de Detalhes do Pedido de Compra com Visualização de Cotações
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import {
  Package,
  Calendar,
  User,
  Building2,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Clock,
  Eye,
  Award,
  BarChart3,
  Plus,
  Pencil,
  Ban,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PedidoCompra, Cotacao } from "./types";
import { AnexosPedidoLista } from "./anexos-pedido";
import { apiClient } from "../../utils/api-client";

interface PedidoDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoCompra | null;
  onAnalisar?: (pedidoId: string) => Promise<void>;
  onAprovar?: (pedidoId: string, cotacaoId: string) => Promise<void>;
  /** Registo de cotacao em nome de um fornecedor (ex: DSG Tecnico) - so com permissao. */
  onRegistarCotacao?: () => void;
  /** O que o utilizador pode fazer a cada cotacao (regra "propria e sem accao"). */
  permissoesCotacao?: (cotacao: Cotacao) => { editar: boolean; eliminar: boolean };
  onEditarCotacao?: (cotacao: Cotacao) => void;
  onAnularCotacao?: (cotacao: Cotacao) => Promise<void> | void;
  onEliminarCotacao?: (cotacao: Cotacao) => Promise<void> | void;
  /** Muda quando as cotacoes foram alteradas fora do dialogo, para as recarregar. */
  versaoCotacoes?: number;
}

export function PedidoDetailsDialog({
  open,
  onClose,
  pedido,
  onAnalisar,
  onAprovar,
  onRegistarCotacao,
  permissoesCotacao,
  onEditarCotacao,
  onAnularCotacao,
  onEliminarCotacao,
  versaoCotacoes = 0,
}: PedidoDetailsDialogProps) {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [loadingCotacoes, setLoadingCotacoes] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<string | null>(null);

  // Função fetchCotacoes PRECISA estar antes do useEffect
  const fetchCotacoes = async () => {
    if (!pedido) return;
    
    setLoadingCotacoes(true);
    try {
 console.log(' Buscando cotações para pedido:', pedido.id);
      const data = await apiClient.get<{ cotacoes: Cotacao[] }>(
        `/procurement/pedidos/${pedido.id}/cotacoes`
      );

 console.log(' Cotações recebidas:', data.cotacoes?.length || 0);
      setCotacoes(data.cotacoes || []);
    } catch (error) {
 console.error(" Erro ao buscar cotações:", error);
      setCotacoes([]);
    } finally {
      setLoadingCotacoes(false);
    }
  };

  useEffect(() => {
    if (open && pedido) {
 console.log(' Dialog aberto, buscando cotações...');
      fetchCotacoes();
    }
  }, [open, pedido, versaoCotacoes]);

  // Se não há pedido, não renderizar o conteúdo
  if (!pedido) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      criado: { label: "Criado", color: "var(--tone-neutral)", icon: FileText },
      aguardando_cotacoes: { label: "Aguardando Cotações", color: "var(--tone-info)", icon: Clock },
      em_cotacao: { label: "Em Cotação", color: "var(--tone-gold)", icon: TrendingUp },
      em_analise: { label: "Em Análise", color: "var(--tone-accent)", icon: AlertCircle },
      aprovado: { label: "Aprovado", color: "var(--tone-success)", icon: CheckCircle2 },
      ordem_emitida: { label: "Ordem Emitida", color: "var(--tone-accent)", icon: FileText },
      em_entrega: { label: "Em Entrega", color: "var(--tone-warn)", icon: Package },
      concluido: { label: "Concluído", color: "var(--tone-success)", icon: CheckCircle2 },
      cancelado: { label: "Cancelado", color: "var(--tone-danger)", icon: XCircle },
    };
    const badge = badges[status] || badges.criado;
    const Icon = badge.icon;
    return (
      <Badge className="text-white flex items-center gap-1" style={{ backgroundColor: badge.color }}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const handleAnalisar = async () => {
    if (onAnalisar) {
      await onAnalisar(pedido.id);
      onClose();
    }
  };

  const handleAprovar = async (cotacaoId: string) => {
    if (onAprovar) {
      await onAprovar(pedido.id, cotacaoId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            Detalhes do Pedido - {pedido.numero}
          </DialogTitle>
          <DialogDescription>
            Visualize os detalhes completos do pedido e cotações recebidas
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detalhes">Detalhes do Pedido</TabsTrigger>
            <TabsTrigger value="itens">
              Itens ({pedido.itens?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="cotacoes">
              Cotações ({cotacoes.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DETALHES DO PEDIDO */}
          <TabsContent value="detalhes" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Status e Prioridade */}
                <div className="flex items-center gap-2">
                  {getStatusBadge(pedido.status)}
                  <Badge variant="outline" className="bg-tone-warn-soft text-tone-warn border-tone-warn/30">
                    Prioridade: {pedido.prioridade}
                  </Badge>
                </div>

                <Separator />

                {/* Informações Principais */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Título</h4>
                    <p className="font-medium">{pedido.titulo}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Departamento</h4>
                    <p className="font-medium">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      {pedido.departamento_solicitante}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Descrição</h4>
                  <p className="text-sm">{pedido.descricao}</p>
                </div>

                <Separator />

                {/* Valores e Prazos */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Orçamento Estimado</h4>
                    <p className="font-semibold text-lg text-tone-success">
                      <DollarSign className="h-4 w-4 inline" />
                      {pedido.orcamento_estimado?.toLocaleString('pt-AO') || '0'} AOA
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Prazo de Entrega</h4>
                    <p className="font-medium">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {pedido.prazo_entrega_desejado || 'Não especificado'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Local de Entrega</h4>
                    <p className="font-medium">{pedido.local_entrega}</p>
                  </div>
                </div>

                <Separator />

                {/* Criador e Datas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Criado por</h4>
                    <p>
                      <User className="h-3 w-3 inline mr-1" />
                      {pedido.created_by_name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Data de Criação</h4>
                    <p>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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

                {Array.isArray(pedido.anexos) && pedido.anexos.length > 0 && (
                  <>
                    <Separator />
                    <AnexosPedidoLista anexos={pedido.anexos} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            {pedido.status === "em_cotacao" && cotacoes.length > 0 && onAnalisar && (
              <Card style={{ backgroundColor: 'var(--tone-info-soft)', borderColor: 'var(--tone-info)' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-tone-info">Pedido pronto para análise</h4>
                      <p className="text-sm text-tone-info">
                        {cotacoes.length} cotação(ões) recebida(s). Inicie a análise comparativa.
                      </p>
                    </div>
                    <Button onClick={handleAnalisar} style={{ backgroundColor: 'var(--tone-info)' }} className="text-white hover:opacity-90">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Iniciar Análise
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: ITENS DO PEDIDO */}
          <TabsContent value="itens" className="space-y-4">
            {pedido.itens && pedido.itens.length > 0 ? (
              pedido.itens.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">Item {index + 1}: {item.descricao}</h4>
                        <Badge variant="outline" className="mt-1">
                          {item.tipo}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Quantidade</p>
                        <p className="text-lg font-semibold">{item.quantidade} {item.unidade}</p>
                      </div>
                    </div>

                    {item.especificacoes_tecnicas && (
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-muted-foreground">Especificações Técnicas:</p>
                        <p className="text-sm">{item.especificacoes_tecnicas}</p>
                      </div>
                    )}

                    {item.caracteristicas && (
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-muted-foreground">Características:</p>
                        <p className="text-sm">{item.caracteristicas}</p>
                      </div>
                    )}

                    {item.observacoes && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Observações:</p>
                        <p className="text-sm">{item.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum item cadastrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: COTAÇÕES */}
          <TabsContent value="cotacoes" className="space-y-4">
            {onRegistarCotacao && ["aguardando_cotacoes", "em_cotacao"].includes(pedido.status) && (
              <div className="flex justify-end">
                <Button size="sm" onClick={onRegistarCotacao}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registar cotação em nome do fornecedor
                </Button>
              </div>
            )}
            {loadingCotacoes && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">A carregar cotações...</p>
                </CardContent>
              </Card>
            )}

            {!loadingCotacoes && cotacoes.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma cotação recebida ainda</p>
                  {pedido.status === "aguardando_cotacoes" && (
                    <p className="text-sm mt-2">Aguardando fornecedores submeterem cotações</p>
                  )}
                </CardContent>
              </Card>
            )}

            {!loadingCotacoes && cotacoes.length > 0 && (
              <div className="space-y-4">
                {cotacoes.map((cotacao, index) => (
                  <Card
                    key={cotacao.id}
                    className={`${
                      selectedCotacao === cotacao.id ? "ring-2 ring-tone-info" : ""
                    } cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setSelectedCotacao(cotacao.id)}
                  >
                    <CardContent className="pt-6 space-y-4">
                      {/* Cabeçalho da Cotação */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {index === 0 && <Award className="h-5 w-5 text-tone-gold" />}
                            {cotacao.fornecedor_nome}
                          </h4>
                          <p className="text-sm text-muted-foreground">{cotacao.fornecedor_email}</p>
                          {(cotacao as any).em_nome_do_fornecedor && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Registada por {(cotacao as any).registado_por_nome || "utilizador interno"} em nome do fornecedor
                            </Badge>
                          )}
                          {cotacao.fornecedor_telefone && (
                            <p className="text-sm text-muted-foreground">{cotacao.fornecedor_telefone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="text-2xl font-bold text-tone-success">
                            {cotacao.valor_total.toLocaleString('pt-AO')} AOA
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Scores de Análise */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Score Total</p>
                          <div className="text-xl font-bold text-tone-info">
                            {cotacao.score_total?.toFixed(1) || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Preço</p>
                          <div className="text-xl font-bold text-tone-success">
                            {cotacao.score_preco?.toFixed(1) || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Disponibilidade</p>
                          <div className="text-xl font-bold text-tone-accent">
                            {cotacao.percentual_atendimento?.toFixed(0) || 0}%
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Prazo</p>
                          <div className="text-xl font-bold text-tone-warn">
                            {cotacao.score_prazo?.toFixed(1) || 0}
                          </div>
                        </div>
                      </div>

                      {/* Status dos Itens */}
                      <div>
                        <p className="text-sm font-semibold mb-2">Itens da Cotação:</p>
                        <div className="space-y-2">
                          {cotacao.itens_resposta?.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                item.disponivel === "sim"
                                  ? "bg-tone-success-soft border-tone-success/30"
                                  : "bg-tone-danger-soft border-tone-danger/30"
                              }`}
                            >
                              <div className="flex items-start justify-between">
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
                                      Qtd: {item.quantidade_disponivel} | Preço Unit: {item.preco_unitario?.toLocaleString('pt-AO')} AOA
                                      {item.prazo_entrega_dias && ` | Prazo: ${item.prazo_entrega_dias} dias`}
                                    </p>
                                  )}
                                </div>
                                {item.disponivel === "sim" && item.preco_unitario && (
                                  <div className="text-right ml-4">
                                    <p className="font-semibold text-tone-success">
                                      {(item.preco_unitario * item.quantidade_disponivel).toLocaleString('pt-AO')} AOA
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {cotacao.observacoes_gerais && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Observações:</p>
                            <p className="text-sm">{cotacao.observacoes_gerais}</p>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Submetida em: {format(new Date(cotacao.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                        {(() => {
                          const p = permissoesCotacao?.(cotacao) || { editar: false, eliminar: false };
                          if (!p.editar && !p.eliminar) return null;
                          return (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              {p.editar && onEditarCotacao && (
                                <Button size="sm" variant="outline" onClick={() => onEditarCotacao(cotacao)}>
                                  <Pencil className="mr-1 h-4 w-4" /> Editar
                                </Button>
                              )}
                              {p.editar && onAnularCotacao && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { if (window.confirm(`Anular a cotação de ${cotacao.fornecedor_nome}? Deixa de contar para a análise.`)) onAnularCotacao(cotacao); }}
                                >
                                  <Ban className="mr-1 h-4 w-4" /> Anular
                                </Button>
                              )}
                              {p.eliminar && onEliminarCotacao && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => { if (window.confirm(`Eliminar a cotação de ${cotacao.fornecedor_nome}?`)) onEliminarCotacao(cotacao); }}
                                >
                                  <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                        {pedido.status === "em_analise" && onAprovar && (
                          <Button
                            size="sm"
                            onClick={() => handleAprovar(cotacao.id)}
                            style={{ backgroundColor: 'var(--tone-success)' }}
                            className="text-white hover:opacity-90"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aprovar Esta Cotação
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}