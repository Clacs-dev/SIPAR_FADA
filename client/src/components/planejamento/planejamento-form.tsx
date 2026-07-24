/**
 * Formulários de Planeamento - VERSÃO MELHORADA
 * Com campos detalhados, datas de início/fim, categorias dinâmicas
 */

import { useState } from "react";
import { TrendingUp, FileBarChart, DollarSign, Plus, Trash2, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { toast } from "sonner@2.0.3";

interface CategoriaOrcamental {
  id: string;
  nome: string;
  subcategoria: string;
  valor_previsto: number;
  descricao: string;
}

interface PlanejamentoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitOrcamento: (data: any) => Promise<any>;
  onSubmitRelatorio: (data: any) => Promise<any>;
  onSubmitContaPagar: (data: any) => Promise<any>;
}

export function PlanejamentoForm({
  open,
  onClose,
  onSubmitOrcamento,
  onSubmitRelatorio,
  onSubmitContaPagar,
}: PlanejamentoFormProps) {
  const [activeTab, setActiveTab] = useState("orcamento");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========== ORÇAMENTO MELHORADO ==========
  const [orcData, setOrcData] = useState({
    ano_fiscal: new Date().getFullYear(),
    periodo: "",
    departamento: "",
    data_inicio: "",
    data_fim: "",
    valor_previsto: 0,
    premissas: "",
    observacoes: "",
    incluir_forecast: false,
  });

  const [categorias, setCategorias] = useState<CategoriaOrcamental[]>([
    {
      id: crypto.randomUUID(),
      nome: "",
      subcategoria: "",
      valor_previsto: 0,
      descricao: "",
    },
  ]);

  // Forecast Trimestral
  const [forecastTrimestral, setForecastTrimestral] = useState({
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
  });

  // ========== RELATÓRIO MELHORADO ==========
  const [relData, setRelData] = useState({
    tipo: "consolidado",
    titulo: "",
    periodo_inicio: "",
    periodo_fim: "",
    resumo_executivo: "",
    departamento: "",
    incluir_graficos: true,
    confidencial: false,
  });

  // Dados Financeiros do Relatório
  const [dadosFinanceiros, setDadosFinanceiros] = useState({
    receitas: 0,
    despesas: 0,
    ativos: 0,
    passivos: 0,
    saldo_caixa: 0,
  });

  // ========== CONTA A PAGAR MELHORADA ==========
  const [cpData, setCpData] = useState({
    fornecedor: "",
    fornecedor_nif: "",
    fornecedor_contato: "",
    descricao: "",
    valor: 0,
    data_vencimento: "",
    categoria: "",
    centro_custo: "",
    departamento: "",
    prioridade: "media",
    metodo_pagamento: "transferencia",
    referencia_interna: "",
    numero_fatura: "",
    observacoes: "",
    recorrente: false,
    periodicidade: "mensal",
  });

  // ========== FUNÇÕES DE CATEGORIAS ==========
  const adicionarCategoria = () => {
    setCategorias([
      ...categorias,
      {
        id: crypto.randomUUID(),
        nome: "",
        subcategoria: "",
        valor_previsto: 0,
        descricao: "",
      },
    ]);
  };

  const removerCategoria = (id: string) => {
    if (categorias.length <= 1) {
      toast.error("Deve haver pelo menos uma categoria");
      return;
    }
    setCategorias(categorias.filter((c) => c.id !== id));
  };

  const atualizarCategoria = (id: string, campo: string, valor: any) => {
    setCategorias(
      categorias.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    );
  };

  // Calcular valor total das categorias
  const valorTotalCategorias = categorias.reduce(
    (sum, c) => sum + (c.valor_previsto || 0),
    0
  );

  // ========== HANDLERS DE SUBMIT ==========
  const handleSubmitOrcamento = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!orcData.data_inicio || !orcData.data_fim) {
      toast.error("Data de início e fim são obrigatórias");
      return;
    }

    if (new Date(orcData.data_inicio) >= new Date(orcData.data_fim)) {
      toast.error("Data de início deve ser anterior à data de fim");
      return;
    }

    if (orcData.valor_previsto <= 0 && valorTotalCategorias <= 0) {
      toast.error("Valor previsto deve ser maior que zero");
      return;
    }

    // Validar categorias
    const categoriasValidas = categorias.filter(
      (c) => c.nome.trim() && c.valor_previsto > 0
    );

    if (categoriasValidas.length === 0) {
      toast.error("Adicione pelo menos uma categoria válida");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...orcData,
        valor_previsto: valorTotalCategorias || orcData.valor_previsto,
        categorias: categoriasValidas,
        forecast_trimestral: orcData.incluir_forecast ? forecastTrimestral : undefined,
      };

      const result = await onSubmitOrcamento(dataToSubmit);
      if (result) {
        toast.success("Orçamento criado com sucesso!");
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRelatorio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!relData.titulo.trim() || !relData.periodo_inicio || !relData.periodo_fim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (new Date(relData.periodo_inicio) >= new Date(relData.periodo_fim)) {
      toast.error("Período de início deve ser anterior ao fim");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...relData,
        dados: {
          receitas: dadosFinanceiros.receitas,
          despesas: dadosFinanceiros.despesas,
          resultado: dadosFinanceiros.receitas - dadosFinanceiros.despesas,
          ativos: dadosFinanceiros.ativos,
          passivos: dadosFinanceiros.passivos,
          patrimonio_liquido: dadosFinanceiros.ativos - dadosFinanceiros.passivos,
          saldo_caixa: dadosFinanceiros.saldo_caixa,
        },
      };

      const result = await onSubmitRelatorio(dataToSubmit);
      if (result) {
        toast.success("Relatório criado com sucesso!");
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitContaPagar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !cpData.fornecedor.trim() ||
      !cpData.descricao.trim() ||
      cpData.valor <= 0 ||
      !cpData.data_vencimento
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await onSubmitContaPagar(cpData);
      if (result) {
        toast.success("Conta a pagar criada com sucesso!");
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Planeamento e Gestão Financeira
          </DialogTitle>
          <DialogDescription>
            Criar orçamentos detalhados, relatórios financeiros ou registrar contas a pagar
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orcamento">
              <TrendingUp className="mr-2 h-4 w-4" />
              Orçamento
            </TabsTrigger>
            <TabsTrigger value="relatorio">
              <FileBarChart className="mr-2 h-4 w-4" />
              Relatório
            </TabsTrigger>
            <TabsTrigger value="conta_pagar">
              <DollarSign className="mr-2 h-4 w-4" />
              Conta a Pagar
            </TabsTrigger>
          </TabsList>

          {/* ========== TAB: ORÇAMENTO ========== */}
          <TabsContent value="orcamento" className="space-y-4">
            <form onSubmit={handleSubmitOrcamento} className="space-y-6">
              {/* Informações Básicas */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Informações Básicas
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ano_fiscal">Ano Fiscal *</Label>
                    <Input
                      id="ano_fiscal"
                      type="number"
                      min="2020"
                      max="2035"
                      value={orcData.ano_fiscal}
                      onChange={(e) =>
                        setOrcData({ ...orcData, ano_fiscal: parseInt(e.target.value) })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="periodo">Período *</Label>
                    <Select
                      value={orcData.periodo}
                      onValueChange={(value) => setOrcData({ ...orcData, periodo: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="periodo">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
                        <SelectItem value="q2">Q2 (Abr-Jun)</SelectItem>
                        <SelectItem value="q3">Q3 (Jul-Set)</SelectItem>
                        <SelectItem value="q4">Q4 (Out-Dez)</SelectItem>
                        <SelectItem value="semestral_1">1º Semestre</SelectItem>
                        <SelectItem value="semestral_2">2º Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="departamento">Departamento *</Label>
                    <Input
                      id="departamento"
                      value={orcData.departamento}
                      onChange={(e) => setOrcData({ ...orcData, departamento: e.target.value })}
                      placeholder="Ex: Financeiro, TI..."
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={orcData.data_inicio}
                      onChange={(e) => setOrcData({ ...orcData, data_inicio: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_fim">Data de Fim *</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={orcData.data_fim}
                      onChange={(e) => setOrcData({ ...orcData, data_fim: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Categorias Orçamentais */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Categorias Orçamentais *</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={adicionarCategoria}
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Categoria
                  </Button>
                </div>

                {categorias.map((cat, idx) => (
                  <div key={cat.id} className="border rounded-lg p-3 bg-muted space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Categoria {idx + 1}</Badge>
                      {categorias.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerCategoria(cat.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Nome da Categoria *</Label>
                        <Select
                          value={cat.nome}
                          onValueChange={(value) => atualizarCategoria(cat.id, "nome", value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pessoal">Pessoal</SelectItem>
                            <SelectItem value="operacional">Operacional</SelectItem>
                            <SelectItem value="investimento">Investimento</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="ti">Tecnologia</SelectItem>
                            <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                            <SelectItem value="administrativo">Administrativo</SelectItem>
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Subcategoria</Label>
                        <Input
                          value={cat.subcategoria}
                          onChange={(e) =>
                            atualizarCategoria(cat.id, "subcategoria", e.target.value)
                          }
                          placeholder="Ex: Salários, Software..."
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label>Valor Previsto (AOA) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cat.valor_previsto || ""}
                          onChange={(e) =>
                            atualizarCategoria(
                              cat.id,
                              "valor_previsto",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={cat.descricao}
                        onChange={(e) => atualizarCategoria(cat.id, "descricao", e.target.value)}
                        placeholder="Descrição detalhada..."
                        rows={2}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    Valor Total do Orçamento: {valorTotalCategorias.toLocaleString("pt-AO")} AOA
                  </p>
                </div>
              </div>

              {/* Forecast Trimestral (Opcional) */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Forecast Trimestral</h3>
                    <p className="text-sm text-muted-foreground">
                      Projeção de distribuição por trimestre
                    </p>
                  </div>
                  <Switch
                    checked={orcData.incluir_forecast}
                    onCheckedChange={(checked) =>
                      setOrcData({ ...orcData, incluir_forecast: checked })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                {orcData.incluir_forecast && (
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Q1 (Jan-Mar)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={forecastTrimestral.q1 || ""}
                        onChange={(e) =>
                          setForecastTrimestral({
                            ...forecastTrimestral,
                            q1: parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label>Q2 (Abr-Jun)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={forecastTrimestral.q2 || ""}
                        onChange={(e) =>
                          setForecastTrimestral({
                            ...forecastTrimestral,
                            q2: parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label>Q3 (Jul-Set)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={forecastTrimestral.q3 || ""}
                        onChange={(e) =>
                          setForecastTrimestral({
                            ...forecastTrimestral,
                            q3: parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label>Q4 (Out-Dez)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={forecastTrimestral.q4 || ""}
                        onChange={(e) =>
                          setForecastTrimestral({
                            ...forecastTrimestral,
                            q4: parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Premissas e Observações */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="premissas">Premissas</Label>
                  <Textarea
                    id="premissas"
                    value={orcData.premissas}
                    onChange={(e) => setOrcData({ ...orcData, premissas: e.target.value })}
                    placeholder="Premissas e considerações..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes_orc">Observações</Label>
                  <Textarea
                    id="observacoes_orc"
                    value={orcData.observacoes}
                    onChange={(e) => setOrcData({ ...orcData, observacoes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A criar..." : "Criar Orçamento"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* ========== TAB: RELATÓRIO ========== */}
          <TabsContent value="relatorio" className="space-y-4">
            <form onSubmit={handleSubmitRelatorio} className="space-y-6">
              {/* Informações Básicas */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Informações do Relatório</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_rel">Tipo de Relatório *</Label>
                    <Select
                      value={relData.tipo}
                      onValueChange={(value) => setRelData({ ...relData, tipo: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="tipo_rel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consolidado">Consolidado</SelectItem>
                        <SelectItem value="balanco">Balanço Patrimonial</SelectItem>
                        <SelectItem value="demonstracao_resultados">
                          Demonstração de Resultados
                        </SelectItem>
                        <SelectItem value="fluxo_caixa">Fluxo de Caixa</SelectItem>
                        <SelectItem value="contas_pagar">Contas a Pagar</SelectItem>
                        <SelectItem value="contas_receber">Contas a Receber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="departamento_rel">Departamento</Label>
                    <Input
                      id="departamento_rel"
                      value={relData.departamento}
                      onChange={(e) => setRelData({ ...relData, departamento: e.target.value })}
                      placeholder="Deixe em branco para geral"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="titulo_rel">Título do Relatório *</Label>
                  <Input
                    id="titulo_rel"
                    value={relData.titulo}
                    onChange={(e) => setRelData({ ...relData, titulo: e.target.value })}
                    placeholder="Ex: Relatório Financeiro Q1 2026"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="periodo_inicio">Período Início *</Label>
                    <Input
                      id="periodo_inicio"
                      type="date"
                      value={relData.periodo_inicio}
                      onChange={(e) =>
                        setRelData({ ...relData, periodo_inicio: e.target.value })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodo_fim">Período Fim *</Label>
                    <Input
                      id="periodo_fim"
                      type="date"
                      value={relData.periodo_fim}
                      onChange={(e) => setRelData({ ...relData, periodo_fim: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Dados Financeiros */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Dados Financeiros</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receitas">Receitas (AOA)</Label>
                    <Input
                      id="receitas"
                      type="number"
                      min="0"
                      step="0.01"
                      value={dadosFinanceiros.receitas || ""}
                      onChange={(e) =>
                        setDadosFinanceiros({
                          ...dadosFinanceiros,
                          receitas: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="despesas">Despesas (AOA)</Label>
                    <Input
                      id="despesas"
                      type="number"
                      min="0"
                      step="0.01"
                      value={dadosFinanceiros.despesas || ""}
                      onChange={(e) =>
                        setDadosFinanceiros({
                          ...dadosFinanceiros,
                          despesas: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ativos">Ativos (AOA)</Label>
                    <Input
                      id="ativos"
                      type="number"
                      min="0"
                      step="0.01"
                      value={dadosFinanceiros.ativos || ""}
                      onChange={(e) =>
                        setDadosFinanceiros({
                          ...dadosFinanceiros,
                          ativos: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="passivos">Passivos (AOA)</Label>
                    <Input
                      id="passivos"
                      type="number"
                      min="0"
                      step="0.01"
                      value={dadosFinanceiros.passivos || ""}
                      onChange={(e) =>
                        setDadosFinanceiros({
                          ...dadosFinanceiros,
                          passivos: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="saldo_caixa">Saldo em Caixa (AOA)</Label>
                    <Input
                      id="saldo_caixa"
                      type="number"
                      step="0.01"
                      value={dadosFinanceiros.saldo_caixa || ""}
                      onChange={(e) =>
                        setDadosFinanceiros({
                          ...dadosFinanceiros,
                          saldo_caixa: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex items-center justify-center border rounded-lg bg-green-50 p-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Resultado</p>
                      <p className="text-lg font-bold text-green-700">
                        {(dadosFinanceiros.receitas - dadosFinanceiros.despesas).toLocaleString(
                          "pt-AO"
                        )}{" "}
                        AOA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo e Configurações */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resumo_executivo">Resumo Executivo</Label>
                  <Textarea
                    id="resumo_executivo"
                    value={relData.resumo_executivo}
                    onChange={(e) =>
                      setRelData({ ...relData, resumo_executivo: e.target.value })
                    }
                    placeholder="Resumo dos principais pontos e análises..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <Label>Incluir Gráficos</Label>
                    <p className="text-sm text-muted-foreground">
                      Gerar gráficos automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={relData.incluir_graficos}
                    onCheckedChange={(checked) =>
                      setRelData({ ...relData, incluir_graficos: checked })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <Label>Confidencial</Label>
                    <p className="text-sm text-muted-foreground">Acesso restrito</p>
                  </div>
                  <Switch
                    checked={relData.confidencial}
                    onCheckedChange={(checked) =>
                      setRelData({ ...relData, confidencial: checked })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A criar..." : "Criar Relatório"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* ========== TAB: CONTA A PAGAR ========== */}
          <TabsContent value="conta_pagar" className="space-y-4">
            <form onSubmit={handleSubmitContaPagar} className="space-y-6">
              {/* Informações do Fornecedor */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Informações do Fornecedor</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="fornecedor">Nome do Fornecedor *</Label>
                    <Input
                      id="fornecedor"
                      value={cpData.fornecedor}
                      onChange={(e) => setCpData({ ...cpData, fornecedor: e.target.value })}
                      placeholder="Nome completo ou empresa"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fornecedor_nif">NIF do Fornecedor</Label>
                    <Input
                      id="fornecedor_nif"
                      value={cpData.fornecedor_nif}
                      onChange={(e) => setCpData({ ...cpData, fornecedor_nif: e.target.value })}
                      placeholder="Número de Identificação Fiscal"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fornecedor_contato">Contato</Label>
                    <Input
                      id="fornecedor_contato"
                      value={cpData.fornecedor_contato}
                      onChange={(e) =>
                        setCpData({ ...cpData, fornecedor_contato: e.target.value })
                      }
                      placeholder="Email ou telefone"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes da Conta */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Detalhes da Conta</h3>

                <div>
                  <Label htmlFor="descricao_cp">Descrição *</Label>
                  <Input
                    id="descricao_cp"
                    value={cpData.descricao}
                    onChange={(e) => setCpData({ ...cpData, descricao: e.target.value })}
                    placeholder="Descrição da despesa"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor (AOA) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={cpData.valor || ""}
                      onChange={(e) =>
                        setCpData({ ...cpData, valor: parseFloat(e.target.value) || 0 })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                    <Input
                      id="data_vencimento"
                      type="date"
                      value={cpData.data_vencimento}
                      onChange={(e) => setCpData({ ...cpData, data_vencimento: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="prioridade">Importância</Label>
                    <Select
                      value={cpData.prioridade}
                      onValueChange={(value) => setCpData({ ...cpData, prioridade: value as any })}
                    >
                      <SelectTrigger id="prioridade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="metodo_pagamento">Método de Pagamento</Label>
                    <Select
                      value={cpData.metodo_pagamento}
                      onValueChange={(value) => setCpData({ ...cpData, metodo_pagamento: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="metodo_pagamento">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select
                      value={cpData.categoria}
                      onValueChange={(value) => setCpData({ ...cpData, categoria: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fornecimento">Fornecimento</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="salarios">Salários</SelectItem>
                        <SelectItem value="impostos">Impostos</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="centro_custo">Centro de Custo</Label>
                    <Input
                      id="centro_custo"
                      value={cpData.centro_custo}
                      onChange={(e) => setCpData({ ...cpData, centro_custo: e.target.value })}
                      placeholder="Ex: TI, RH, Financeiro"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="departamento_cp">Departamento</Label>
                    <Input
                      id="departamento_cp"
                      value={cpData.departamento}
                      onChange={(e) => setCpData({ ...cpData, departamento: e.target.value })}
                      placeholder="Departamento solicitante"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_fatura">Número da Fatura</Label>
                    <Input
                      id="numero_fatura"
                      value={cpData.numero_fatura}
                      onChange={(e) => setCpData({ ...cpData, numero_fatura: e.target.value })}
                      placeholder="Ex: FAT-2026-001"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="referencia_interna">Referência Interna</Label>
                    <Input
                      id="referencia_interna"
                      value={cpData.referencia_interna}
                      onChange={(e) =>
                        setCpData({ ...cpData, referencia_interna: e.target.value })
                      }
                      placeholder="Código interno"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Recorrência */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Conta Recorrente</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta despesa se repete periodicamente
                    </p>
                  </div>
                  <Switch
                    checked={cpData.recorrente}
                    onCheckedChange={(checked) => setCpData({ ...cpData, recorrente: checked })}
                    disabled={isSubmitting}
                  />
                </div>

                {cpData.recorrente && (
                  <div>
                    <Label htmlFor="periodicidade">Periodicidade</Label>
                    <Select
                      value={cpData.periodicidade}
                      onValueChange={(value) => setCpData({ ...cpData, periodicidade: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="periodicidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes_cp">Observações</Label>
                <Textarea
                  id="observacoes_cp"
                  value={cpData.observacoes}
                  onChange={(e) => setCpData({ ...cpData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o pagamento..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A criar..." : "Criar Conta a Pagar"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}