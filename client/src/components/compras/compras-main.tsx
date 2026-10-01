/**
 * Componente Principal - Procurement (Sistema de Aquisições)
 * Sistema profissional de pedidos de compra com cotações de fornecedores
 */

import { useState, useEffect } from "react";
import {
  Package, Plus, Eye, FileText, Clock,
  CheckCircle2, XCircle, TrendingUp, AlertCircle,
  DollarSign, Building2, ShoppingBag, Calendar, Send
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProcurement } from "../../hooks/use-procurement";
import { useFornecedores } from "../../hooks/use-fornecedores";
import { toast } from "sonner@2.0.3";
import { visualizarOrdemCompra } from "../../utils/pdf-generator";
import { PedidoFormDialog } from "./pedido-form-dialog";
import { PedidoDetailsDialog } from "./pedido-details-dialog";
import { FornecedoresGestao } from "./fornecedores-gestao";
import { useClientPagination } from "../../hooks/use-client-pagination";
import { PaginationBar } from "../common/pagination-bar";
import type { PedidoCompra, StatusPedidoCompra } from "./types";

export function ComprasMain() {
  const [activeTab, setActiveTab] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [fornecedoresView, setFornecedoresView] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompra | null>(null);

  const {
    pedidos,
    stats,
    loading,
    fetchPedidos,
    fetchStats,
    createPedido,
    publicarPedido,
    analisarCotacoes,
    aprovarCotacao,
    ordensCompra,
    fetchOrdens,
    updateStatusOrdem,
  } = useProcurement();

  const { fornecedores, fetchFornecedores } = useFornecedores();

  useEffect(() => {
    fetchPedidos();
    fetchStats();
    fetchFornecedores();
    fetchOrdens();
  }, [fetchPedidos, fetchStats, fetchFornecedores, fetchOrdens]);

  const getStatusBadge = (status: StatusPedidoCompra) => {
    const badges: Record<StatusPedidoCompra, { label: string; color: string; icon: any }> = {
      criado: { label: "Criado", color: "var(--tone-neutral)", icon: FileText },
      aguardando_cotacoes: { label: "Aguardando Cotações", color: "var(--tone-info)", icon: Clock },
      em_cotacao: { label: "Em Cotação", color: "var(--tone-gold)", icon: TrendingUp },
      em_analise: { label: "Em Análise", color: "var(--tone-accent)", icon: AlertCircle },
      aprovado: { label: "Aprovado", color: "var(--tone-success)", icon: CheckCircle2 },
      ordem_emitida: { label: "Ordem Emitida", color: "var(--tone-accent)", icon: FileText },
      em_entrega: { label: "Em Entrega", color: "var(--tone-warn)", icon: Package },
      concluido: { label: "Concluído", color: "var(--tone-success)", icon: CheckCircle2 },
      cancelado: { label: "Cancelado", color: "var(--tone-danger)", icon: AlertCircle },
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

  const getPrioridadeBadge = (prioridade: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      urgente: { label: "Urgente", color: "var(--tone-danger)" },
      alta: { label: "Alta", color: "var(--tone-warn)" },
      normal: { label: "Normal", color: "var(--tone-info)" },
      baixa: { label: "Baixa", color: "var(--tone-neutral)" },
    };
    const badge = badges[prioridade] || badges.normal;
    return (
      <Badge variant="outline" className="text-white border-0" style={{ backgroundColor: badge.color }}>
        {badge.label}
      </Badge>
    );
  };

  const handleCreatePedido = async (data: any) => {
    const pedido = await createPedido(data);
    if (pedido) {
      setFormOpen(false);
      fetchStats();
    }
    return pedido;
  };

  const handlePublicarPedido = async (pedidoId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar trigger do click do card
    const sucesso = await publicarPedido(pedidoId);
    if (sucesso) {
      await fetchPedidos();
      await fetchStats();
    }
  };

  const handleAnalisar = async (pedidoId: string) => {
    const sucesso = await analisarCotacoes(pedidoId);
    if (sucesso) {
      await fetchPedidos();
      await fetchStats();
    }
  };

  const handleAprovar = async (pedidoId: string, cotacaoId: string) => {
    const sucesso = await aprovarCotacao(pedidoId, cotacaoId, "Cotação aprovada após análise");
    if (sucesso) {
      await fetchPedidos();
      await fetchStats();
      await fetchOrdens();
    }
  };

  // Confirmar a rececao da ordem de compra: e este passo que gera a factura
  // (ja como "validado") em Gestao de Pagamento - aprovar a cotacao so emite a ordem.
  const handleConfirmarRececao = async (ordemId: string) => {
    const sucesso = await updateStatusOrdem(ordemId, "recebida");
    if (sucesso) {
      toast.success("Receção confirmada. A factura foi enviada para Gestão de Pagamento (Validados).");
      await fetchOrdens();
    }
  };

  // Filtrar pedidos por tab
  const getFilteredPedidos = () => {
    let filtered = pedidos;

    // Filtrar por tab
    switch (activeTab) {
      case "aguardando":
        filtered = pedidos.filter(p => p.status === "aguardando_cotacoes");
        break;
      case "cotacao":
        filtered = pedidos.filter(p => p.status === "em_cotacao");
        break;
      case "analise":
        filtered = pedidos.filter(p => p.status === "em_analise");
        break;
      case "concluidos":
        filtered = pedidos.filter(p => p.status === "concluido");
        break;
      default:
        // "todos" - não filtrar
        break;
    }

    return filtered;
  };

  const pedidosFiltrados = getFilteredPedidos();
  const pedidosPag = useClientPagination(pedidosFiltrados);
  useEffect(() => { pedidosPag.setPage(1); }, [activeTab]);

  // Se está na view de fornecedores, mostrar apenas isso
  if (fornecedoresView) {
    return <FornecedoresGestao onBack={() => setFornecedoresView(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Procurement - Sistema de Aquisições
          </h1>
          <p className="text-muted-foreground">
            Gestão completa de pedidos de compra, cotações de fornecedores e análise automática
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFornecedoresView(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Fornecedores ({fornecedores.length})
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_pedidos}</div>
              <p className="text-xs text-muted-foreground">Total Pedidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" style={{ color: 'var(--tone-info)' }}>{stats.aguardando_cotacoes}</div>
              <p className="text-xs text-muted-foreground">Aguardando Cotações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" style={{ color: 'var(--tone-gold)' }}>{stats.em_cotacao}</div>
              <p className="text-xs text-muted-foreground">Em Cotação</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" style={{ color: 'var(--tone-accent)' }}>{stats.em_analise}</div>
              <p className="text-xs text-muted-foreground">Em Análise</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" style={{ color: 'var(--tone-success)' }}>{stats.concluidos}</div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" style={{ color: 'var(--tone-success)' }} />
                <div className="text-lg font-bold">{(stats.valor_total_mes / 1000000).toFixed(1)}M</div>
              </div>
              <p className="text-xs text-muted-foreground">Valor Total Mês</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">
            Todos ({pedidos.length})
          </TabsTrigger>
          <TabsTrigger value="aguardando">
            Aguardando Cotações ({pedidos.filter(p => p.status === "aguardando_cotacoes").length})
          </TabsTrigger>
          <TabsTrigger value="cotacao">
            Em Cotação ({pedidos.filter(p => p.status === "em_cotacao").length})
          </TabsTrigger>
          <TabsTrigger value="analise">
            Em Análise ({pedidos.filter(p => p.status === "em_analise").length})
          </TabsTrigger>
          <TabsTrigger value="concluidos">
            Concluídos ({pedidos.filter(p => p.status === "concluido").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && pedidosFiltrados.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum pedido de compra encontrado</p>
                <Button className="mt-4" variant="outline" onClick={() => setFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Pedido
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lista de Pedidos */}
          {!loading && pedidosPag.pageItems.map((pedido) => (
            <Card 
              key={pedido.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Cabeçalho */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold">{pedido.numero}</h3>
                      {getStatusBadge(pedido.status)}
                      {getPrioridadeBadge(pedido.prioridade)}
                      {pedido.total_cotacoes > 0 && (
                        <Badge variant="outline" style={{ backgroundColor: 'var(--tone-info-soft)', color: 'var(--tone-info)', borderColor: 'var(--tone-info)' }}>
                          {pedido.total_cotacoes} cotação(ões)
                        </Badge>
                      )}
                    </div>

                    {/* Título e Descrição */}
                    <h4 className="font-medium mb-1">{pedido.titulo}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {pedido.descricao}
                    </p>

                    {/* Metadados */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {pedido.departamento_solicitante && (
                        <>
                          <span>{pedido.departamento_solicitante}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{pedido.created_by_name}</span>
                      <span>•</span>
                      <span>{pedido.itens?.length || 0} item(ns)</span>
                      <span>•</span>
                      <span>
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Informações adicionais para pedidos em andamento */}
                    {pedido.valor_aprovado && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline" style={{ backgroundColor: 'var(--tone-success-soft)', color: 'var(--tone-success)', borderColor: 'var(--tone-success)' }}>
                          Valor Aprovado: {pedido.valor_aprovado.toLocaleString('pt-AO')} AOA
                        </Badge>
                        {pedido.fornecedor_vencedor_nome && (
                          <Badge variant="outline" style={{ backgroundColor: 'var(--tone-accent-soft)', color: 'var(--tone-accent)', borderColor: 'var(--tone-accent)' }}>
                            Fornecedor: {pedido.fornecedor_vencedor_nome}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Valor e Ações */}
                  <div className="flex flex-col items-end gap-2">
                    {pedido.orcamento_estimado > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Orçamento Est.</div>
                        <div className="font-semibold">
                          {pedido.orcamento_estimado.toLocaleString('pt-AO')} AOA
                        </div>
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setSelectedPedido(pedido); setDetailsOpen(true); }}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    {pedido.status === "criado" && (
                      <Button size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-info)' }} onClick={(e) => handlePublicarPedido(pedido.id, e)}>
                        <Send className="h-4 w-4 mr-1" />
                        Publicar para Fornecedores
                      </Button>
                    )}
                    {pedido.status === "em_cotacao" && (
                      <Button size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-accent)' }} onClick={() => handleAnalisar(pedido.id)}>
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Analisar Cotações
                      </Button>
                    )}
                    {pedido.status === "concluido" && ordensCompra
                      .filter(o => o.pedido_id === pedido.id)
                      .map(ordem => (
                        <Button key={`ver-${ordem.id}`} size="sm" variant="outline" onClick={() => visualizarOrdemCompra({ ordemId: ordem.id }).catch((err) => toast.error(err?.message || "Erro ao abrir a Ordem de Compra"))}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ordem de Compra ({ordem.numero})
                        </Button>
                      ))}
                    {pedido.status === "concluido" && ordensCompra
                      .filter(o => o.pedido_id === pedido.id && o.status !== "recebida")
                      .map(ordem => (
                        <Button key={ordem.id} size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-success)' }} onClick={() => handleConfirmarRececao(ordem.id)}>
                          <Package className="h-4 w-4 mr-1" />
                          Confirmar Receção ({ordem.numero})
                        </Button>
                      ))}
                    {pedido.status === "em_analise" && (
                      <Button size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-success)' }} onClick={() => handleAprovar(pedido.id, pedido.cotacao_vencedora_id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Aprovar Cotação
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <PaginationBar pagination={pedidosPag.pagination} onPageChange={pedidosPag.setPage} />
        </TabsContent>
      </Tabs>

      {/* Dialog de Formulário */}
      <PedidoFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreatePedido}
      />

      {/* Dialog de Detalhes */}
      <PedidoDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        pedido={selectedPedido}
        onAnalisar={handleAnalisar}
        onAprovar={handleAprovar}
      />
    </div>
  );
}