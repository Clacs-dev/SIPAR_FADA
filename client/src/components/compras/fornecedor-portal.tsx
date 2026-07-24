/**
 * Portal do Fornecedor - Interface Externa
 * Permite fornecedores externos visualizarem pedidos e submeterem cotações
 */

import { useState, useEffect } from "react";
import { 
  Package, Eye, Send, CheckCircle2, Clock, 
  FileText, TrendingUp, DollarSign, Calendar,
  Building2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProcurement } from "../../hooks/use-procurement";
import { CotacaoFormDialog } from "./cotacao-form-dialog";
import type { PedidoCompra } from "./types";
import { toast } from "sonner";

interface FornecedorPortalProps {
  fornecedorId: string;
  fornecedorNome: string;
}

export function FornecedorPortal({ fornecedorId, fornecedorNome }: FornecedorPortalProps) {
  const [activeTab, setActiveTab] = useState("disponiveis");
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompra | null>(null);
  const [cotacaoDialogOpen, setCotacaoDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    pedidos,
    loading,
    fetchPedidos,
    submitCotacao,
  } = useProcurement();

  useEffect(() => {
    let mounted = true;
    
    const loadPedidos = async () => {
      try {
        setLoadError(null);
 console.log(' FornecedorPortal: Carregando pedidos para fornecedor:', fornecedorId);
        await fetchPedidos();
        if (mounted) {
 console.log(' FornecedorPortal: Pedidos carregados com sucesso');
        }
      } catch (error) {
        if (mounted) {
 console.error(' FornecedorPortal: Erro ao carregar pedidos:', error);
          setLoadError(error instanceof Error ? error.message : 'Erro ao carregar pedidos');
          // Não mostrar toast aqui, apenas logar
        }
      }
    };

    loadPedidos();
    
    // Cleanup para evitar atualizações em componente desmontado
    return () => {
      mounted = false;
    };
  }, [fornecedorId]); // Removida dependência fetchPedidos para evitar loops

  // Se houver erro de carregamento mas não crítico, mostrar o portal mesmo assim
  if (loadError && pedidos.length === 0 && !loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle className="text-orange-900">Bem-vindo, {fornecedorNome}</CardTitle>
                  <p className="text-sm text-orange-700 mt-1">
                    Não foi possível carregar os pedidos no momento.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-600 mb-4">{loadError}</p>
              <Button 
                onClick={() => {
                  setLoadError(null);
                  fetchPedidos();
                }}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Filtrar pedidos disponíveis (aguardando ou em cotação)
  const pedidosDisponiveis = pedidos.filter(p => 
    p.status === "aguardando_cotacoes" || p.status === "em_cotacao"
  );

  // Pedidos onde já submeti cotação
  const minhasCotacoes = pedidos.filter(p => 
    p.cotacoes?.some(c => c.fornecedor_id === fornecedorId)
  );

  // Pedidos onde fui vencedor
  const pedidosVencidos = pedidos.filter(p => 
    p.fornecedor_vencedor_id === fornecedorId
  );

  const handleSubmitCotacao = async (data: any) => {
    if (!selectedPedido) return null;

    const success = await submitCotacao(selectedPedido.id, {
      ...data,
      fornecedor_id: fornecedorId,
    });

    if (success) {
      setCotacaoDialogOpen(false);
      setSelectedPedido(null);
      fetchPedidos(); // Recarregar lista
    }

    return success;
  };

  const handleCotarPedido = (pedido: PedidoCompra) => {
    // Verificar se já cotou
    const jaCotou = pedido.cotacoes?.some(c => c.fornecedor_id === fornecedorId);
    
    if (jaCotou) {
      // Mostrar mensagem
      return;
    }

    setSelectedPedido(pedido);
    setCotacaoDialogOpen(true);
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      urgente: { label: "Urgente", color: "bg-red-600" },
      alta: { label: "Alta", color: "bg-orange-500" },
      normal: { label: "Normal", color: "bg-blue-500" },
      baixa: { label: "Baixa", color: "bg-gray-500" },
    };
    const badge = badges[prioridade] || badges.normal;
    return (
      <Badge variant="outline" className={`${badge.color} text-white border-0`}>
        {badge.label}
      </Badge>
    );
  };

  // Estatísticas do fornecedor
  const minhasStats = {
    disponiveis: pedidosDisponiveis.length,
    cotacoes_submetidas: minhasCotacoes.length,
    vencidas: pedidosVencidos.length,
    aguardando_resultado: minhasCotacoes.filter(p => 
      p.status === "em_analise" || p.status === "em_cotacao"
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Portal do Fornecedor
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo, <strong>{fornecedorNome}</strong>. Visualize pedidos e submeta suas cotações.
        </p>
      </div>

      {/* Stats Cards - Skeleton durante carregamento */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{minhasStats.disponiveis}</div>
              <p className="text-xs text-muted-foreground">Pedidos Disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{minhasStats.cotacoes_submetidas}</div>
              <p className="text-xs text-muted-foreground">Cotações Submetidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{minhasStats.aguardando_resultado}</div>
              <p className="text-xs text-muted-foreground">Aguardando Resultado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{minhasStats.vencidas}</div>
              <p className="text-xs text-muted-foreground">Cotações Vencidas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="disponiveis">
            <Package className="h-4 w-4 mr-2" />
            Pedidos Disponíveis ({minhasStats.disponiveis})
          </TabsTrigger>
          <TabsTrigger value="minhas-cotacoes">
            <FileText className="h-4 w-4 mr-2" />
            Minhas Cotações ({minhasStats.cotacoes_submetidas})
          </TabsTrigger>
          <TabsTrigger value="vencidas">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Cotações Vencidas ({minhasStats.vencidas})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Pedidos Disponíveis */}
        <TabsContent value="disponiveis" className="space-y-4 mt-6">
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && pedidosDisponiveis.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum pedido disponível no momento</p>
                <p className="text-xs mt-2">Novos pedidos aparecerão aqui quando forem publicados</p>
              </CardContent>
            </Card>
          )}

          {!loading && pedidosDisponiveis.map((pedido) => {
            const jaCotou = pedido.cotacoes?.some(c => c.fornecedor_id === fornecedorId);
            
            return (
              <Card key={pedido.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Cabeçalho */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{pedido.numero}</h3>
                        {getPrioridadeBadge(pedido.prioridade)}
                        {jaCotou && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Cotação Submetida
                          </Badge>
                        )}
                        {pedido.cotacoes && pedido.cotacoes.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {pedido.cotacoes.length} cotação(ões) recebidas
                          </Badge>
                        )}
                      </div>

                      {/* Título */}
                      <h4 className="font-medium text-lg mb-2">{pedido.titulo}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {pedido.descricao}
                      </p>

                      {/* Informações */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Departamento:</span>
                          <p className="font-medium">{pedido.departamento_solicitante || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Itens:</span>
                          <p className="font-medium">{pedido.itens?.length || 0} item(ns)</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prazo Desejado:</span>
                          <p className="font-medium">
                            {pedido.prazo_entrega_desejado 
                              ? format(new Date(pedido.prazo_entrega_desejado), "dd/MM/yyyy", { locale: ptBR })
                              : "Não especificado"
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Publicado em:</span>
                          <p className="font-medium">
                            {format(new Date(pedido.publicado_em || pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {/* Local de Entrega */}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                        <span className="text-muted-foreground">Local de Entrega:</span>
                        <p className="font-medium">{pedido.local_entrega}</p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // TODO: Abrir dialog de detalhes
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Itens
                      </Button>
                      
                      {!jaCotou && (
                        <Button 
                          size="sm"
                          onClick={() => handleCotarPedido(pedido)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Submeter Cotação
                        </Button>
                      )}
                      
                      {jaCotou && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Minha Cotação
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab: Minhas Cotações */}
        <TabsContent value="minhas-cotacoes" className="space-y-4 mt-6">
          {!loading && minhasCotacoes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Ainda não submeteu nenhuma cotação</p>
              </CardContent>
            </Card>
          )}

          {!loading && minhasCotacoes.map((pedido) => {
            const minhaCotacao = pedido.cotacoes?.find(c => c.fornecedor_id === fornecedorId);
            
            if (!minhaCotacao) return null;

            return (
              <Card key={pedido.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{pedido.numero}</h3>
                        {pedido.status === "em_analise" && (
                          <Badge className="bg-purple-500 text-white">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Em Análise
                          </Badge>
                        )}
                        {pedido.status === "aprovado" && pedido.fornecedor_vencedor_id === fornecedorId && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Cotação Aprovada!
                          </Badge>
                        )}
                        {pedido.status === "aprovado" && pedido.fornecedor_vencedor_id !== fornecedorId && (
                          <Badge variant="outline" className="text-gray-500">
                            Outro fornecedor venceu
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-medium mb-2">{pedido.titulo}</h4>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <p className="font-semibold text-green-600">
                            {minhaCotacao.valor_total.toLocaleString('pt-AO')} AOA
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Atendimento:</span>
                          <p className="font-medium">
                            {minhaCotacao.percentual_atendimento.toFixed(0)}% dos itens
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submetida em:</span>
                          <p className="font-medium">
                            {format(new Date(minhaCotacao.submitted_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {minhaCotacao.score_total !== undefined && minhaCotacao.score_total > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Score de Competitividade:</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${minhaCotacao.score_total}%` }}
                              />
                            </div>
                            <span className="font-semibold">{minhaCotacao.score_total.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab: Cotações Vencidas */}
        <TabsContent value="vencidas" className="space-y-4 mt-6">
          {!loading && pedidosVencidos.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma cotação vencida ainda</p>
                <p className="text-xs mt-2">Continue submetendo cotações competitivas!</p>
              </CardContent>
            </Card>
          )}

          {!loading && pedidosVencidos.map((pedido) => (
            <Card key={pedido.id} className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{pedido.numero}</h3>
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Vencedor
                      </Badge>
                      {pedido.ordem_compra_numero && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          OC: {pedido.ordem_compra_numero}
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-lg mb-2">{pedido.titulo}</h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valor Aprovado:</span>
                        <p className="font-semibold text-green-700 text-lg">
                          {pedido.valor_aprovado?.toLocaleString('pt-AO')} AOA
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="font-medium">
                          {pedido.status === "ordem_emitida" && "Ordem de Compra Emitida"}
                          {pedido.status === "em_entrega" && "Em Entrega"}
                          {pedido.status === "concluido" && "Concluído"}
                        </p>
                      </div>
                    </div>

                    {pedido.ordem_compra_emitida_em && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Ordem emitida em {format(new Date(pedido.ordem_compra_emitida_em), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                  </div>

                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Ordem de Compra
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog de Submissão de Cotação */}
      {selectedPedido && (
        <CotacaoFormDialog
          open={cotacaoDialogOpen}
          onClose={() => {
            setCotacaoDialogOpen(false);
            setSelectedPedido(null);
          }}
          pedido={selectedPedido}
          fornecedorId={fornecedorId}
          onSubmit={handleSubmitCotacao}
        />
      )}
    </div>
  );
}