/**
 * Componente Principal - Pedido e Helpdesk
 * Sistema de Tickets de Suporte Técnico
 */

import { useState, useEffect } from "react";
import { Headphones, Plus, Search, Clock, CheckCircle, XCircle, AlertCircle, Monitor, Laptop, Wifi, Mail, Phone, Lock, Settings, FileText, User, Building, Briefcase, Calendar, Paperclip } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { usePedidos } from "../../hooks/use-pedidos";
import { TicketForm } from "./pedido-form";
import { TicketDetailsDialog } from "./pedido-details-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Ticket, StatusTicket } from "./types";
import { useAuth } from "../auth/auth-context";

export function PedidosMain() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { user } = useAuth();
  const {
    pedidos: tickets,
    stats,
    loading,
    fetchPedidos: fetchTickets,
    fetchStats,
    createPedido: createTicket,
    abrirTicket,
    resolverTicket,
    fecharTicket,
  } = usePedidos();

  // Verificar se usuário é IT ou Admin
  const isIT = user?.role === 'tecnologia_informacao' || 
               user?.department === 'Tecnologia da Informação' ||
               user?.department === 'tecnologia_informacao';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailsOpen(true);
  };

  const handleAbrir = async (ticketId: string) => {
    const success = await abrirTicket(ticketId);
    if (success) {
      fetchTickets();
      fetchStats();
    }
  };

  const handleResolver = async (ticketId: string, solucao: string, anexos?: any[]) => {
    const success = await resolverTicket(ticketId, solucao, anexos);
    if (success) {
      fetchTickets();
      fetchStats();
    }
  };

  const handleFechar = async (ticketId: string, comentario?: string) => {
    const success = await fecharTicket(ticketId, comentario);
    if (success) {
      fetchTickets();
      fetchStats();
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
    return <Badge variant="outline" className={`${badge.color} text-white border-0`}>{badge.label}</Badge>;
  };

  const getCategoriaLabel = (categoria: string) => {
    const categorias: Record<string, { label: string; icon: any }> = {
      hardware: { label: "Hardware", icon: Monitor },
      software: { label: "Software", icon: Laptop },
      rede: { label: "Rede", icon: Wifi },
      email: { label: "Email", icon: Mail },
      telefonia: { label: "Telefonia", icon: Phone },
      acesso: { label: "Acesso", icon: Lock },
      sistema: { label: "Sistema", icon: Settings },
      outro: { label: "Outro", icon: FileText },
    };
    const cat = categorias[categoria];
    if (!cat) return categoria;
    const Icon = cat.icon;
    return (
      <span className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {cat.label}
      </span>
    );
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Filtro de pesquisa
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matches = 
        ticket.titulo?.toLowerCase().includes(searchLower) ||
        ticket.numero?.toLowerCase().includes(searchLower) ||
        ticket.solicitante_nome?.toLowerCase().includes(searchLower) ||
        ticket.descricao?.toLowerCase().includes(searchLower);
      if (!matches) return false;
    }
    
    // Filtro de tabs
    if (activeTab === "pendentes" && ticket.status !== "pendente") return false;
    if (activeTab === "abertos" && ticket.status !== "aberto") return false;
    if (activeTab === "resolvidos" && ticket.status !== "resolvido") return false;
    if (activeTab === "fechados" && ticket.status !== "fechado") return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            Pedido e Helpdesk
          </h1>
          <p className="text-muted-foreground">
            Sistema de suporte técnico para comunicação com a equipe de TI
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ticket de Suporte
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-700">{stats.pendentes}</div>
              </div>
              <p className="text-xs text-yellow-600 font-medium mt-1">Abertos</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div className="text-2xl font-bold text-blue-700">{stats.abertos || 0}</div>
              </div>
              <p className="text-xs text-blue-600 font-medium mt-1">Em Resolução</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-2xl font-bold text-green-700">{stats.resolvidos || 0}</div>
              </div>
              <p className="text-xs text-green-600 font-medium mt-1">Resolvidos</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-gray-600" />
                <div className="text-2xl font-bold text-gray-700">{stats.fechados || 0}</div>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-1">Fechados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por título, número ou solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos">
            Todos ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Abertos ({tickets.filter(t => t.status === "pendente").length})
          </TabsTrigger>
          <TabsTrigger value="abertos">
            Em Resolução ({tickets.filter(t => t.status === "aberto").length})
          </TabsTrigger>
          <TabsTrigger value="resolvidos">
            Resolvidos ({tickets.filter(t => t.status === "resolvido").length})
          </TabsTrigger>
          <TabsTrigger value="fechados">
            Fechados ({tickets.filter(t => t.status === "fechado").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading && <p className="text-center text-muted-foreground py-8">A carregar tickets...</p>}
          
          {!loading && filteredTickets.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum ticket encontrado</p>
                <p className="text-sm mt-1">
                  {searchTerm ? "Tente ajustar os filtros de pesquisa" : "Crie um novo ticket para começar"}
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => handleTicketClick(ticket)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-base">{ticket.numero}</h3>
                          {getStatusBadge(ticket.status)}
                          {getImportanciaBadge(ticket.importancia || 'normal')}
                          {ticket.categoria && (
                            <Badge variant="secondary" className="text-xs">
                              {getCategoriaLabel(ticket.categoria)}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm mb-1 truncate">{ticket.titulo}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <User className="h-3 w-3" />
                          <span>{ticket.solicitante_nome}</span>
                          {ticket.direcao && (
                            <>
                              <span>•</span>
                              <Building className="h-3 w-3" />
                              <span>{ticket.direcao}</span>
                            </>
                          )}
                          {ticket.funcao && (
                            <>
                              <span>•</span>
                              <Briefcase className="h-3 w-3" />
                              <span>{ticket.funcao}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {ticket.descricao}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      {ticket.anexos && ticket.anexos.length > 0 && (
                        <>
                          <span>•</span>
                          <Paperclip className="h-3 w-3" />
                          <span>{ticket.anexos.length} anexo(s)</span>
                        </>
                      )}
                      {ticket.atribuido_a_nome && (
                        <>
                          <span>•</span>
                          <User className="h-3 w-3" />
                          <span>Atribuído: {ticket.atribuido_a_nome}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {ticket.resolvido_em && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span>Resolvido</span>
                      </div>
                    )}
                    {ticket.fechado_em && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <XCircle className="h-3 w-3" />
                        <span>Fechado</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Formulário de Ticket */}
      {formOpen && (
        <TicketForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={createTicket}
          userProfile={user}
        />
      )}

      {/* Detalhes do Ticket */}
      {detailsOpen && selectedTicket && (
        <TicketDetailsDialog
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
          onAbrir={handleAbrir}
          onResolver={handleResolver}
          onFechar={handleFechar}
          isIT={isIT}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}