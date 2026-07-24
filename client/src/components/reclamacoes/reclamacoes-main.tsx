/**
 * Componente Principal - Gestão de Reclamações
 * SISTEMA PROFISSIONAL DE GESTÃO DE RECLAMAÇÕES
 * Workflow: Registada → Em Resolução → Resolvida → Fechada
 */

import { useState, useEffect } from "react";
import { 
  MessageSquareWarning, Plus, Search, AlertCircle, CheckCircle2, 
  XCircle, Clock, User, Building, Calendar, Paperclip, Star,
  FileText, Phone, Mail, Globe, UserCircle, Package, Shield, Users
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useReclamacoes } from "../../hooks/use-reclamacoes";
import { ReclamacaoForm } from "./reclamacao-form";
import { ReclamacaoDetailsDialog } from "./reclamacao-details-dialog";
import { OperadoresPage } from "./operadores-page";
import { toast } from "sonner@2.0.3";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Reclamacao, StatusReclamacao, TipoReclamacao } from "./types";
import { useAuth } from "../auth/auth-context";

export function ReclamacoesMain() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedReclamacao, setSelectedReclamacao] = useState<Reclamacao | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [showOperadoresPage, setShowOperadoresPage] = useState(false);
  
  const { user } = useAuth();
  const {
    reclamacoes,
    stats,
    loading,
    fetchReclamacoes,
    fetchStats,
    createReclamacao,
    atribuirReclamacao,
    adicionarAcao,
    resolverReclamacao,
  } = useReclamacoes();

  useEffect(() => {
    fetchReclamacoes();
    fetchStats();
  }, [fetchReclamacoes, fetchStats]);

  const handleReclamacaoClick = (reclamacao: Reclamacao) => {
    setSelectedReclamacao(reclamacao);
    setDetailsOpen(true);
  };

  const handleAtribuir = async (id: string, responsavelId: string, responsavelNome: string) => {
    const success = await atribuirReclamacao(id, responsavelId, responsavelNome);
    if (success) {
      fetchReclamacoes();
      fetchStats();
    }
    return success;
  };

  const handleAdicionarAcao = async (id: string, descricao: string) => {
    const success = await adicionarAcao(id, descricao);
    if (success) {
      fetchReclamacoes();
      fetchStats();
    }
    return success;
  };

  const handleResolver = async (id: string, solucao: string, acoes: string[]) => {
    const success = await resolverReclamacao(id, solucao, acoes);
    if (success) {
      fetchReclamacoes();
      fetchStats();
    }
    return success;
  };

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
      urgente: { label: "Urgente", color: "bg-red-600" },
      alta: { label: "Alta", color: "bg-orange-500" },
      media: { label: "Média", color: "bg-yellow-500" },
      baixa: { label: "Baixa", color: "bg-green-500" },
    };
    const badge = badges[prioridade] || badges.media;
    return <Badge variant="outline" className={`${badge.color} text-white border-0`}>{badge.label}</Badge>;
  };

  const getTipoIcon = (tipo: TipoReclamacao) => {
    const icons: Record<TipoReclamacao, any> = {
      cliente: UserCircle,
      fornecedor: Building,
      interno: User,
      qualidade: Star,
      servico: FileText,
      produto: Package,
      outro: AlertCircle,
    };
    return icons[tipo] || AlertCircle;
  };

  const getTipoLabel = (tipo: TipoReclamacao) => {
    const labels: Record<TipoReclamacao, string> = {
      cliente: "Cliente",
      fornecedor: "Fornecedor",
      interno: "Interno",
      qualidade: "Qualidade",
      servico: "Serviço",
      produto: "Produto",
      outro: "Outro",
    };
    return labels[tipo] || tipo;
  };

  const filteredReclamacoes = reclamacoes.filter((rec) => {
    if (searchTerm && !rec.assunto.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !rec.numero.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !rec.reclamante_email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (activeTab === "registadas" && rec.status !== "registrado") return false;
    if (activeTab === "em_resolucao" && rec.status !== "em_resolucao") return false;
    if (activeTab === "resolvidas" && rec.status !== "resolvido") return false;
    if (activeTab === "fechadas" && rec.status !== "fechado") return false;
    
    return true;
  });

  // Calcular estatísticas por tipo
  const statsByTipo = {
    cliente: reclamacoes.filter(r => r.tipo === "cliente").length,
    fornecedor: reclamacoes.filter(r => r.tipo === "fornecedor").length,
    interno: reclamacoes.filter(r => r.tipo === "interno").length,
    qualidade: reclamacoes.filter(r => r.tipo === "qualidade").length,
    servico: reclamacoes.filter(r => r.tipo === "servico").length,
    produto: reclamacoes.filter(r => r.tipo === "produto").length,
    outro: reclamacoes.filter(r => r.tipo === "outro").length,
  };

  // Se estiver mostrando página de operadores, renderizar apenas ela
  if (showOperadoresPage) {
    return <OperadoresPage onBack={() => setShowOperadoresPage(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <MessageSquareWarning className="h-6 w-6" />
            Gestão de Reclamações
          </h1>
          <p className="text-muted-foreground">
            Sistema completo de registro e acompanhamento de reclamações
          </p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setShowOperadoresPage(true)}>
          <Users className="mr-2 h-4 w-4" />
          Operadores
        </Button>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Reclamação
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.registadas}</div>
              <p className="text-xs text-muted-foreground">Registadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.em_resolucao}</div>
              <p className="text-xs text-muted-foreground">Em Resolução</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.resolvidas}</div>
              <p className="text-xs text-muted-foreground">Resolvidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1">
                <div className="text-2xl font-bold">{stats.avaliacao_media}</div>
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground">Avaliação Média</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard - Reclamações por Tipo */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Reclamações por Tipo</h2>
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{statsByTipo.cliente}</div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{statsByTipo.fornecedor}</div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-gray-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-2xl font-bold">{statsByTipo.interno}</div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Interno</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold">{statsByTipo.qualidade}</div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Qualidade</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{statsByTipo.servico}</div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Serviço</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold">{statsByTipo.produto}</div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Produto</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold">{statsByTipo.outro}</div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Outro</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros e Pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por assunto, nmero ou reclamante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todas">
            Todas ({reclamacoes.length})
          </TabsTrigger>
          <TabsTrigger value="registadas">
            Registadas ({reclamacoes.filter(r => r.status === "registrado").length})
          </TabsTrigger>
          <TabsTrigger value="em_resolucao">
            Em Resolução ({reclamacoes.filter(r => r.status === "em_resolucao").length})
          </TabsTrigger>
          <TabsTrigger value="resolvidas">
            Resolvidas ({reclamacoes.filter(r => r.status === "resolvido").length})
          </TabsTrigger>
          <TabsTrigger value="fechadas">
            Fechadas ({reclamacoes.filter(r => r.status === "fechado").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && filteredReclamacoes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma reclamação encontrada</p>
              </CardContent>
            </Card>
          )}

          {!loading && filteredReclamacoes.map((reclamacao) => {
            const TipoIcon = getTipoIcon(reclamacao.tipo);
            
            return (
              <Card
                key={reclamacao.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{
                  borderLeftColor: 
                    reclamacao.prioridade === 'urgente' ? '#dc2626' :
                    reclamacao.prioridade === 'alta' ? '#f97316' :
                    reclamacao.prioridade === 'media' ? '#eab308' : '#22c55e'
                }}
                onClick={() => handleReclamacaoClick(reclamacao)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg">{reclamacao.numero}</h3>
                        {getStatusBadge(reclamacao.status)}
                        {getPrioridadeBadge(reclamacao.prioridade)}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <TipoIcon className="h-3 w-3" />
                          {getTipoLabel(reclamacao.tipo)}
                        </Badge>
                      </div>

                      {/* Assunto */}
                      <p className="font-medium text-sm">{reclamacao.assunto}</p>

                      {/* Informações do Reclamante */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {reclamacao.reclamante_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{reclamacao.reclamante_email}</span>
                          </div>
                        )}
                      </div>

                      {/* Metadados */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(reclamacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        {reclamacao.anexos && reclamacao.anexos.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              <span>{reclamacao.anexos.length} anexo(s)</span>
                            </div>
                          </>
                        )}
                        {reclamacao.responsavel_nome && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Responsável: {reclamacao.responsavel_nome}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Indicadores à Direita */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {reclamacao.tempo_resolucao && (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Clock className="h-3 w-3" />
                          <span>{reclamacao.tempo_resolucao}h</span>
                        </div>
                      )}
                      {reclamacao.satisfacao_cliente && reclamacao.satisfacao_cliente > 0 && (
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>{reclamacao.satisfacao_cliente}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Reclamação Form */}
      {formOpen && (
        <ReclamacaoForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setSelectedReclamacao(null);
            setFormMode("create");
          }}
          onSubmit={createReclamacao}
          mode={formMode}
          reclamacao={selectedReclamacao}
        />
      )}

      {/* Reclamação Details Dialog */}
      {detailsOpen && selectedReclamacao && (
        <ReclamacaoDetailsDialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          reclamacao={selectedReclamacao}
          onAtribuir={handleAtribuir}
          onAdicionarAcao={handleAdicionarAcao}
          onResolver={handleResolver}
          currentUserId={user?.id || ""}
          currentUserName={user?.name || ""}
        />
      )}
    </div>
  );
}