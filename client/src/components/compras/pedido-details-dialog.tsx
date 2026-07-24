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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PedidoCompra, Cotacao } from "./types";
import { apiClient } from "../../utils/api-client";

interface PedidoDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoCompra | null;
  onAnalisar?: (pedidoId: string) => Promise<void>;
  onAprovar?: (pedidoId: string, cotacaoId: string) => Promise<void>;
}

export function PedidoDetailsDialog({
  open,
  onClose,
  pedido,
  onAnalisar,
  onAprovar,
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
  }, [open, pedido]);

  // Se não há pedido, não renderizar o conteúdo
  if (!pedido) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      criado: { label: "Criado", color: "bg-gray-500", icon: FileText },
      aguardando_cotacoes: { label: "Aguardando Cotações", color: "bg-blue-500", icon: Clock },
      em_cotacao: { label: "Em Cotação", color: "bg-yellow-500", icon: TrendingUp },
      em_analise: { label: "Em Análise", color: "bg-purple-500", icon: AlertCircle },
      aprovado: { label: "Aprovado", color: "bg-green-500", icon: CheckCircle2 },
      ordem_emitida: { label: "Ordem Emitida", color: "bg-indigo-500", icon: FileText },
      em_entrega: { label: "Em Entrega", color: "bg-orange-500", icon: Package },
      concluido: { label: "Concluído", color: "bg-green-600", icon: CheckCircle2 },
      cancelado: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
    };
    const badge = badges[status] || badges.criado;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} text-white flex items-center gap-1`}>
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
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
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
                    <p className="font-semibold text-lg text-green-700">
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
              </CardContent>
            </Card>

            {/* Ações */}
            {pedido.status === "em_cotacao" && cotacoes.length > 0 && onAnalisar && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Pedido pronto para análise</h4>
                      <p className="text-sm text-blue-700">
                        {cotacoes.length} cotação(ões) recebida(s). Inicie a análise comparativa.
                      </p>
                    </div>
                    <Button onClick={handleAnalisar} className="bg-blue-600 hover:bg-blue-700">
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
                      selectedCotacao === cotacao.id ? "ring-2 ring-blue-500" : ""
                    } cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setSelectedCotacao(cotacao.id)}
                  >
                    <CardContent className="pt-6 space-y-4">
                      {/* Cabeçalho da Cotação */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                            {cotacao.fornecedor_nome}
                          </h4>
                          <p className="text-sm text-muted-foreground">{cotacao.fornecedor_email}</p>
                          {cotacao.fornecedor_telefone && (
                            <p className="text-sm text-muted-foreground">{cotacao.fornecedor_telefone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="text-2xl font-bold text-green-700">
                            {cotacao.valor_total.toLocaleString('pt-AO')} AOA
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Scores de Análise */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Score Total</p>
                          <div className="text-xl font-bold text-blue-700">
                            {cotacao.score_total?.toFixed(1) || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Preço</p>
                          <div className="text-xl font-bold text-green-700">
                            {cotacao.score_preco?.toFixed(1) || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Disponibilidade</p>
                          <div className="text-xl font-bold text-purple-700">
                            {cotacao.percentual_atendimento?.toFixed(0) || 0}%
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Prazo</p>
                          <div className="text-xl font-bold text-orange-700">
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
                                  ? "bg-green-50 border-green-200"
                                  : "bg-red-50 border-red-200"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {item.disponivel === "sim" ? (
                                      <CheckCircle2 className="h-4 w-4 inline text-green-600 mr-1" />
                                    ) : (
                                      <XCircle className="h-4 w-4 inline text-red-600 mr-1" />
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
                                    <p className="font-semibold text-green-700">
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
                        {pedido.status === "em_analise" && onAprovar && (
                          <Button
                            size="sm"
                            onClick={() => handleAprovar(cotacao.id)}
                            className="bg-green-600 hover:bg-green-700"
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