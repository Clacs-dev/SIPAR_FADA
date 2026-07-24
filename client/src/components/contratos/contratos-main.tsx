/**
 * Componente Principal - Gestão de Contratos
 */

import { useState, useEffect } from "react";
import { FileKey, Plus, Search, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useContratos } from "../../hooks/use-contratos";
import { useAuth } from "../auth/auth-context";
import { ContratoForm } from "./contrato-form";
import { ContratoDetailsDialog } from "./contrato-details-dialog";
import { toast } from "sonner@2.0.3";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Contrato, StatusContrato } from "./types";

export function ContratosMain() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ativos");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  
  // Verificar permissões
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isJuridico = user?.role === 'juridico';
  
  const {
    contratos,
    stats,
    alertas,
    loading,
    fetchContratos,
    fetchStats,
    fetchAlertas,
    createContrato,
    aprovarContrato,
    enviarParaValidacaoJuridica,
    validarJuridico,
    rejeitarJuridico,
    cancelarContrato,
  } = useContratos();

  useEffect(() => {
    fetchContratos();
    fetchStats();
    fetchAlertas();
  }, [fetchContratos, fetchStats, fetchAlertas]);

  const handleAprovar = async (id: string) => {
    const success = await aprovarContrato(id);
    if (success) {
      fetchContratos();
      fetchStats();
    }
    return success;
  };

  const handleCancelar = async (id: string, motivo: string) => {
    const success = await cancelarContrato(id, motivo);
    if (success) {
      fetchContratos();
      fetchStats();
    }
    return success;
  };

  const handleEnviarValidacaoJuridica = async (id: string) => {
    const success = await enviarParaValidacaoJuridica(id);
    if (success) {
      fetchContratos();
      fetchStats();
    }
    return success;
  };

  const handleValidarJuridico = async (id: string, observacoes?: string) => {
    const success = await validarJuridico(id, observacoes);
    if (success) {
      fetchContratos();
      fetchStats();
    }
    return success;
  };

  const handleRejeitarJuridico = async (id: string, motivo: string) => {
    const success = await rejeitarJuridico(id, motivo);
    if (success) {
      fetchContratos();
      fetchStats();
    }
    return success;
  };

  const getStatusBadge = (status: StatusContrato) => {
    const badges = {
      rascunho: { label: "Rascunho", color: "bg-gray-500" },
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

  const filteredContratos = contratos.filter((contrato) => {
    if (searchTerm && !contrato.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !contrato.numero.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (activeTab === "ativos" && contrato.status !== "ativo") return false;
    if (activeTab === "expirando" && (!contrato.alerta_vencimento || contrato.status !== "ativo")) return false;
    if (activeTab === "expirados" && contrato.status !== "expirado") return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <FileKey className="h-6 w-6" />
            Gestão de Contratos
          </h1>
          <p className="text-muted-foreground">
            Controle de vigências, renovações e alertas de vencimento
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Alertas de Vencimento */}
      {alertas.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {alertas.length} Contrato(s) Próximo(s) do Vencimento
                </h3>
                <div className="mt-2 space-y-1">
                  {alertas.slice(0, 3).map((alerta) => (
                    <p key={alerta.id} className="text-sm text-yellow-800 dark:text-yellow-200">
                      • {alerta.contrato_numero} - {alerta.contrato_titulo} ({alerta.mensagem})
                    </p>
                  ))}
                  {alertas.length > 3 && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      + {alertas.length - 3} outro(s)...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.expirando_30_dias}</div>
              <p className="text-xs text-muted-foreground">Expirando (30d)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.expirados}</div>
              <p className="text-xs text-muted-foreground">Expirados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div className="text-lg font-bold">
                  {(stats.valor_total_contratos_ativos / 1000000).toFixed(1)}M
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Valor Total Ativos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar por título ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">
            Todos ({contratos.length})
          </TabsTrigger>
          <TabsTrigger value="ativos">
            Ativos ({contratos.filter(c => c.status === "ativo").length})
          </TabsTrigger>
          <TabsTrigger value="expirando">
            Por prescrição ({contratos.filter(c => c.alerta_vencimento).length})
          </TabsTrigger>
          <TabsTrigger value="expirados">
            Prescrito ({contratos.filter(c => c.status === "expirado").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && filteredContratos.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum contrato encontrado
              </CardContent>
            </Card>
          )}

          {!loading && filteredContratos.map((contrato) => (
            <Card
              key={contrato.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                contrato.alerta_vencimento ? 'border-yellow-500' : ''
              }`}
              onClick={() => {
                setSelectedContrato(contrato);
                setDetailsOpen(true);
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{contrato.numero}</h3>
                          <Badge variant="outline">{contrato.tipo}</Badge>
                          {contrato.alerta_vencimento && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Vence em {contrato.dias_para_vencimento}d
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{contrato.titulo}</p>
                        <p className="text-xs text-muted-foreground">Contratado: {contrato.contratado_nome || contrato.fornecedor_nome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <span>Início: {format(new Date(contrato.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>Fim: {format(new Date(contrato.data_fim), "dd/MM/yyyy", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>Valor: {contrato.valor_total.toLocaleString('pt-AO')} {contrato.moeda}</span>
                      <span>•</span>
                      <span>Duração: {contrato.duracao_meses} meses</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(contrato.status)}
                    {contrato.renovacao_automatica && (
                      <Badge variant="outline" className="text-xs">Renov. Automática</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Formulário de Contrato */}
      {formOpen && (
        <ContratoForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          mode={formMode}
          contrato={selectedContrato}
          onSubmit={createContrato}
        />
      )}

      {/* Detalhes do Contrato */}
      {detailsOpen && (
        <ContratoDetailsDialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          contrato={selectedContrato}
          onAprovar={handleAprovar}
          onCancelar={handleCancelar}
          onEnviarValidacaoJuridica={handleEnviarValidacaoJuridica}
          onValidarJuridico={handleValidarJuridico}
          onRejeitarJuridico={handleRejeitarJuridico}
          isAdmin={isAdmin}
          isJuridico={isJuridico}
        />
      )}
    </div>
  );
}