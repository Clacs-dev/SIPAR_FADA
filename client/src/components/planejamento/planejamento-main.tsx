/**
 * Componente Principal - Planeamento e Gestão (Consolidado)
 */

import { useState, useEffect } from "react";
import { TrendingUp, Plus, DollarSign, FileBarChart, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { usePlanejamento } from "../../hooks/use-planejamento";
import { PlanejamentoForm } from "./planejamento-form";
import { PlanejamentoDetailsDialog } from "./planejamento-details-dialog";
import { MetaForm } from "./meta-form";
import { MetaDetailsDialog } from "./meta-details-dialog";
import { toast } from "sonner@2.0.3";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Orcamento, RelatorioFinanceiro, ContaPagar, Meta } from "./types";

export function PlanejamentoMain() {
  const [activeTab, setActiveTab] = useState("metas");
  const [formOpen, setFormOpen] = useState(false);
  const [metaFormOpen, setMetaFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [metaDetailsOpen, setMetaDetailsOpen] = useState(false);
  const [detailsType, setDetailsType] = useState<"orcamento" | "relatorio" | "conta_pagar">("orcamento");
  const [selectedItem, setSelectedItem] = useState<Orcamento | RelatorioFinanceiro | ContaPagar | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);
  
  const {
    orcamentos,
    relatorios,
    contasPagar,
    contasReceber,
    metas,
    stats,
    loading,
    fetchOrcamentos,
    fetchRelatorios,
    fetchContasPagar,
    fetchContasReceber,
    fetchMetas,
    fetchStats,
    createOrcamento,
    createRelatorio,
    createContaPagar,
    createMeta,
    registrarProgressoMeta,
  } = usePlanejamento();

  useEffect(() => {
    fetchOrcamentos();
    fetchRelatorios();
    fetchContasPagar();
    fetchContasReceber();
    fetchMetas();
    fetchStats();
  }, [fetchOrcamentos, fetchRelatorios, fetchContasPagar, fetchContasReceber, fetchMetas, fetchStats]);

  const handleOpenDetails = (tipo: "orcamento" | "relatorio" | "conta_pagar", item: any) => {
    setDetailsType(tipo);
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const handleOpenMetaDetails = (meta: Meta) => {
    setSelectedMeta(meta);
    setMetaDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Planeamento e Gestão
          </h1>
          <p className="text-muted-foreground">
            Metas, orçamentos, relatórios e controlo financeiro
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div className="text-lg font-bold">
                  {(stats.orcamento_aprovado_ano / 1000000).toFixed(1)}M
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Orçamento Aprovado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-600" />
                <div className="text-lg font-bold text-red-600">
                  {(stats.contas_pagar_total / 1000000).toFixed(1)}M
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Contas a Pagar ({stats.contas_pagar_vencidas} vencidas)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div className="text-lg font-bold text-green-600">
                  {(stats.contas_receber_total / 1000000).toFixed(1)}M
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Contas a Receber ({stats.contas_receber_vencidas} vencidas)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileBarChart className="h-4 w-4" />
                <div className="text-lg font-bold">{stats.total_orcamentos}</div>
              </div>
              <p className="text-xs text-muted-foreground">Orçamentos Criados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="metas">
            Metas ({metas?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="orcamentos">
            Orçamentos ({orcamentos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="relatorios">
            Relatórios ({relatorios?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contas_pagar">
            Contas a Pagar ({contasPagar?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contas_receber">
            Contas a Receber ({contasReceber?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Metas */}
        <TabsContent value="metas" className="space-y-4 mt-6">
          {(!metas || metas.length === 0) && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma meta encontrada
              </CardContent>
            </Card>
          )}

          {metas && metas.map((meta) => (
            <Card 
              key={meta.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenMetaDetails(meta)}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold">{meta.titulo}</h3>
                        <Badge className={
                          meta.status === 'planejada' ? 'bg-gray-500' :
                          meta.status === 'em_andamento' ? 'bg-blue-500' :
                          meta.status === 'atrasada' ? 'bg-red-500' :
                          meta.status === 'atingida' ? 'bg-green-500' : 'bg-gray-600'
                        }>
                          {meta.status === 'em_andamento' ? 'Em Andamento' : 
                           meta.status === 'planejada' ? 'Planejada' :
                           meta.status === 'atrasada' ? 'Atrasada' :
                           meta.status === 'atingida' ? 'Atingida' : 'Cancelada'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{meta.tipo}</Badge>
                      </div>
                      {meta.descricao && <p className="text-sm text-muted-foreground mb-2">{meta.descricao}</p>}
                      <p className="text-xs text-muted-foreground">
                        Período: {format(new Date(meta.data_inicio), "dd/MM/yyyy", { locale: ptBR })} a {format(new Date(meta.data_fim), "dd/MM/yyyy", { locale: ptBR })} • {meta.prazo_dias} dias
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-muted-foreground">Valor Alvo</div>
                      <div className="text-xl font-bold text-blue-600">
                        {meta.valor_alvo.toLocaleString('pt-AO')}
                      </div>
                      <div className="text-xs text-muted-foreground">{meta.unidade_medida}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{meta.percentual_progresso.toFixed(1)}%</span>
                    </div>
                    <Progress value={meta.percentual_progresso} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{meta.valor_atual.toLocaleString('pt-AO')} {meta.unidade_medida}</span>
                      <span>Faltam: {(meta.valor_alvo - meta.valor_atual).toLocaleString('pt-AO')}</span>
                    </div>
                  </div>
                  {meta.sub_metas && meta.sub_metas.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Sub-metas: {meta.sub_metas.filter(sm => sm.atingida).length} de {meta.sub_metas.length} atingidas
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Orçamentos */}
        <TabsContent value="orcamentos" className="space-y-4 mt-6">
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && orcamentos.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum orçamento encontrado
              </CardContent>
            </Card>
          )}

          {!loading && orcamentos.map((orc) => (
            <Card 
              key={orc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenDetails("orcamento", orc)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{orc.numero}</h3>
                      <Badge className={
                        orc.status === 'rascunho' ? 'bg-gray-500' :
                        orc.status === 'aprovado' ? 'bg-green-500' : 'bg-blue-500'
                      }>
                        {orc.status}
                      </Badge>
                    </div>
                    <p className="text-sm">Ano Fiscal: {orc.ano_fiscal} • Departamento: {orc.departamento}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {orc.categorias.length} categoria(s) • Elaborado por: {orc.elaborado_por}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {(orc.valor_previsto / 1000000).toFixed(2)}M AOA
                    </div>
                    <p className="text-xs text-muted-foreground">Previsto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="relatorios" className="space-y-4 mt-6">
          {relatorios.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum relatório encontrado
              </CardContent>
            </Card>
          )}

          {relatorios.map((rel) => (
            <Card 
              key={rel.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenDetails("relatorio", rel)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{rel.numero}</h3>
                      <Badge variant="outline">{rel.tipo}</Badge>
                      <Badge className={
                        rel.status === 'rascunho' ? 'bg-gray-500' :
                        rel.status === 'publicado' ? 'bg-green-500' : 'bg-blue-500'
                      }>
                        {rel.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{rel.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Período: {format(new Date(rel.periodo_inicio), "dd/MM/yyyy", { locale: ptBR })} a {format(new Date(rel.periodo_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Contas a Pagar */}
        <TabsContent value="contas_pagar" className="space-y-4 mt-6">
          {contasPagar.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma conta a pagar encontrada
              </CardContent>
            </Card>
          )}

          {contasPagar.map((cp) => (
            <Card 
              key={cp.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${cp.status === 'vencida' ? 'border-red-500' : ''}`}
              onClick={() => handleOpenDetails("conta_pagar", cp)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{cp.numero}</h3>
                      <Badge className={
                        cp.status === 'pendente' ? 'bg-yellow-500' :
                        cp.status === 'vencida' ? 'bg-red-500' :
                        cp.status === 'paga' ? 'bg-green-500' : 'bg-gray-500'
                      }>
                        {cp.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{cp.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      Fornecedor: {cp.fornecedor} • Vencimento: {format(new Date(cp.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-red-600">
                      {cp.valor.toLocaleString('pt-AO')} AOA
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Contas a Receber */}
        <TabsContent value="contas_receber" className="space-y-4 mt-6">
          {contasReceber.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma conta a receber encontrada
              </CardContent>
            </Card>
          )}

          {contasReceber.map((cr) => (
            <Card key={cr.id} className={cr.status === 'vencida' ? 'border-yellow-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{cr.numero}</h3>
                      <Badge className={
                        cr.status === 'pendente' ? 'bg-yellow-500' :
                        cr.status === 'vencida' ? 'bg-red-500' :
                        cr.status === 'recebida' ? 'bg-green-500' : 'bg-gray-500'
                      }>
                        {cr.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{cr.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      Cliente: {cr.cliente} • Vencimento: {format(new Date(cr.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {cr.valor.toLocaleString('pt-AO')} AOA
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Formulário de Planejamento */}
      {formOpen && (
        <PlanejamentoForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmitOrcamento={createOrcamento}
          onSubmitRelatorio={createRelatorio}
          onSubmitContaPagar={createContaPagar}
        />
      )}

      {/* Detalhes de Planejamento */}
      {detailsOpen && (
        <PlanejamentoDetailsDialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          tipo={detailsType}
          item={selectedItem}
        />
      )}

      {/* Formulário de Metas */}
      {metaFormOpen && (
        <MetaForm
          open={metaFormOpen}
          onClose={() => setMetaFormOpen(false)}
          onSubmit={createMeta}
        />
      )}

      {/* Detalhes de Metas */}
      {metaDetailsOpen && (
        <MetaDetailsDialog
          open={metaDetailsOpen}
          onClose={() => setMetaDetailsOpen(false)}
          meta={selectedMeta}
          onRegistrarProgresso={registrarProgressoMeta}
        />
      )}
    </div>
  );
}