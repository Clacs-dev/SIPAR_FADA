/**
 * Formulário de Criação de Metas e Objetivos
 * Sistema de metas de curto/médio prazo com sub-metas intermediárias
 */

import { useState } from "react";
import { Target, Plus, Trash2, Calendar, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { toast } from "sonner@2.0.3";
import { differenceInDays } from "date-fns";

interface SubMeta {
  id: string;
  titulo: string;
  valor_alvo: number;
  prazo: string;
}

interface MetaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
}

export function MetaForm({ open, onClose, onSubmit }: MetaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados principais da meta
  const [metaData, setMetaData] = useState({
    titulo: "",
    descricao: "",
    tipo: "financeira" as const,
    data_inicio: "",
    data_fim: "",
    valor_alvo: 0,
    unidade_medida: "AOA",
    departamento: "",
    responsavel: "",
    prioridade: "media" as const,
    observacoes: "",
  });

  // Sub-metas intermediárias
  const [subMetas, setSubMetas] = useState<SubMeta[]>([
    {
      id: crypto.randomUUID(),
      titulo: "",
      valor_alvo: 0,
      prazo: "",
    },
  ]);

  // Ações necessárias
  const [acoes, setAcoes] = useState<string[]>([""]);

  // Riscos
  const [riscos, setRiscos] = useState<string[]>([""]);

  // Calcular prazo em dias
  const prazoDias =
    metaData.data_inicio && metaData.data_fim
      ? differenceInDays(new Date(metaData.data_fim), new Date(metaData.data_inicio))
      : 0;

  // Calcular meta diária aproximada
  const metaDiaria = prazoDias > 0 ? metaData.valor_alvo / prazoDias : 0;

  // ========== FUNÇÕES DE SUB-METAS ==========
  const adicionarSubMeta = () => {
    setSubMetas([
      ...subMetas,
      {
        id: crypto.randomUUID(),
        titulo: "",
        valor_alvo: 0,
        prazo: "",
      },
    ]);
  };

  const removerSubMeta = (id: string) => {
    if (subMetas.length <= 1) {
      toast.error("Deve haver pelo menos uma sub-meta");
      return;
    }
    setSubMetas(subMetas.filter((sm) => sm.id !== id));
  };

  const atualizarSubMeta = (id: string, campo: string, valor: any) => {
    setSubMetas(subMetas.map((sm) => (sm.id === id ? { ...sm, [campo]: valor } : sm)));
  };

  // ========== FUNÇÕES DE AÇÕES E RISCOS ==========
  const adicionarAcao = () => setAcoes([...acoes, ""]);
  const removerAcao = (idx: number) => {
    if (acoes.length <= 1) return;
    setAcoes(acoes.filter((_, i) => i !== idx));
  };
  const atualizarAcao = (idx: number, valor: string) => {
    const novasAcoes = [...acoes];
    novasAcoes[idx] = valor;
    setAcoes(novasAcoes);
  };

  const adicionarRisco = () => setRiscos([...riscos, ""]);
  const removerRisco = (idx: number) => {
    if (riscos.length <= 1) return;
    setRiscos(riscos.filter((_, i) => i !== idx));
  };
  const atualizarRisco = (idx: number, valor: string) => {
    const novosRiscos = [...riscos];
    novosRiscos[idx] = valor;
    setRiscos(novosRiscos);
  };

  // ========== VALIDAÇÃO E SUBMIT ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!metaData.titulo.trim()) {
      toast.error("Título da meta é obrigatório");
      return;
    }

    if (!metaData.data_inicio || !metaData.data_fim) {
      toast.error("Data de início e fim são obrigatórias");
      return;
    }

    if (new Date(metaData.data_inicio) >= new Date(metaData.data_fim)) {
      toast.error("Data de início deve ser anterior à data de fim");
      return;
    }

    if (metaData.valor_alvo <= 0) {
      toast.error("Valor alvo deve ser maior que zero");
      return;
    }

    // Validar sub-metas
    const subMetasValidas = subMetas.filter((sm) => sm.titulo.trim() && sm.valor_alvo > 0 && sm.prazo);

    if (subMetasValidas.length === 0) {
      toast.error("Adicione pelo menos uma sub-meta válida");
      return;
    }

    // Verificar se soma das sub-metas não excede meta principal
    const somaSubMetas = subMetasValidas.reduce((sum, sm) => sum + sm.valor_alvo, 0);
    if (somaSubMetas > metaData.valor_alvo) {
      toast.error("Soma das sub-metas não pode exceder o valor alvo principal");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...metaData,
        prazo_dias: prazoDias,
        sub_metas: subMetasValidas.map((sm) => ({
          ...sm,
          atingida: false,
        })),
        acoes_necessarias: acoes.filter((a) => a.trim()),
        riscos: riscos.filter((r) => r.trim()),
      };

      const result = await onSubmit(dataToSubmit);
      if (result) {
        toast.success("Meta criada com sucesso!");
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
            <Target className="h-5 w-5" />
            Criar Meta e Objetivos
          </DialogTitle>
          <DialogDescription>
            Defina metas de curto/médio prazo com sub-metas intermediárias para acompanhamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Informações da Meta
            </h3>

            <div>
              <Label htmlFor="titulo">Título da Meta *</Label>
              <Input
                id="titulo"
                value={metaData.titulo}
                onChange={(e) => setMetaData({ ...metaData, titulo: e.target.value })}
                placeholder="Ex: Atingir 1 milhão em vendas"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição Detalhada</Label>
              <Textarea
                id="descricao"
                value={metaData.descricao}
                onChange={(e) => setMetaData({ ...metaData, descricao: e.target.value })}
                placeholder="Descreva a meta, seu propósito e importância..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Meta *</Label>
                <Select
                  value={metaData.tipo}
                  onValueChange={(value: any) => setMetaData({ ...metaData, tipo: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financeira">Financeira</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                    <SelectItem value="crescimento">Crescimento</SelectItem>
                    <SelectItem value="eficiencia">Eficiência</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prioridade">Importância</Label>
                <Select
                  value={metaData.prioridade}
                  onValueChange={(value) => setMetaData({ ...metaData, prioridade: value as any })}
                >
                  <SelectTrigger id="prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                <Select
                  value={metaData.unidade_medida}
                  onValueChange={(value) => setMetaData({ ...metaData, unidade_medida: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="unidade_medida">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AOA">AOA (Kwanza)</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="contratos">Contratos</SelectItem>
                    <SelectItem value="clientes">Clientes</SelectItem>
                    <SelectItem value="percentual">Percentual (%)</SelectItem>
                    <SelectItem value="horas">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Prazo e Valor Alvo */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prazo e Valor Alvo
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={metaData.data_inicio}
                  onChange={(e) => setMetaData({ ...metaData, data_inicio: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="data_fim">Data de Fim *</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={metaData.data_fim}
                  onChange={(e) => setMetaData({ ...metaData, data_fim: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="valor_alvo">Valor Alvo *</Label>
              <Input
                id="valor_alvo"
                type="number"
                min="0"
                step="0.01"
                value={metaData.valor_alvo || ""}
                onChange={(e) => setMetaData({ ...metaData, valor_alvo: parseFloat(e.target.value) || 0 })}
                disabled={isSubmitting}
              />
            </div>

            {/* Indicadores Calculados */}
            {prazoDias > 0 && metaData.valor_alvo > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold text-blue-900">Indicadores da Meta</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Prazo Total</p>
                    <p className="font-bold text-blue-700">{prazoDias} dias</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Meta Diária Aproximada</p>
                    <p className="font-bold text-blue-700">
                      {metaDiaria.toLocaleString("pt-AO", { maximumFractionDigits: 2 })} {metaData.unidade_medida}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Meta Semanal Aproximada</p>
                    <p className="font-bold text-blue-700">
                      {(metaDiaria * 7).toLocaleString("pt-AO", { maximumFractionDigits: 2 })} {metaData.unidade_medida}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sub-Metas Intermediárias */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Sub-Metas / Marcos Intermediários *</h3>
              <Button type="button" variant="outline" size="sm" onClick={adicionarSubMeta} disabled={isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Sub-Meta
              </Button>
            </div>

            {subMetas.map((sm, idx) => (
              <div key={sm.id} className="border rounded-lg p-3 bg-muted space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Sub-Meta {idx + 1}</Badge>
                  {subMetas.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerSubMeta(sm.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label>Título da Sub-Meta *</Label>
                    <Input
                      value={sm.titulo}
                      onChange={(e) => atualizarSubMeta(sm.id, "titulo", e.target.value)}
                      placeholder="Ex: Atingir 200 mil no primeiro mês"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label>Prazo *</Label>
                    <Input
                      type="date"
                      value={sm.prazo}
                      onChange={(e) => atualizarSubMeta(sm.id, "prazo", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label>Valor Alvo *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sm.valor_alvo || ""}
                    onChange={(e) => atualizarSubMeta(sm.id, "valor_alvo", parseFloat(e.target.value) || 0)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}

            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-green-900">
                Total das Sub-Metas: {subMetas.reduce((sum, sm) => sum + (sm.valor_alvo || 0), 0).toLocaleString("pt-AO")}{" "}
                {metaData.unidade_medida}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {metaData.valor_alvo > 0
                  ? `${((subMetas.reduce((sum, sm) => sum + (sm.valor_alvo || 0), 0) / metaData.valor_alvo) * 100).toFixed(1)}% da meta principal`
                  : ""}
              </p>
            </div>
          </div>

          {/* Responsáveis */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Responsáveis</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departamento">Departamento *</Label>
                <Input
                  id="departamento"
                  value={metaData.departamento}
                  onChange={(e) => setMetaData({ ...metaData, departamento: e.target.value })}
                  placeholder="Ex: Comercial, Vendas..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="responsavel">Responsável Principal *</Label>
                <Input
                  id="responsavel"
                  value={metaData.responsavel}
                  onChange={(e) => setMetaData({ ...metaData, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Ações Necessárias */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Ações Necessárias</h3>
              <Button type="button" variant="outline" size="sm" onClick={adicionarAcao} disabled={isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Ação
              </Button>
            </div>

            {acoes.map((acao, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={acao}
                  onChange={(e) => atualizarAcao(idx, e.target.value)}
                  placeholder="Descreva uma ação necessária..."
                  disabled={isSubmitting}
                />
                {acoes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerAcao(idx)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Riscos */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Riscos Identificados</h3>
              <Button type="button" variant="outline" size="sm" onClick={adicionarRisco} disabled={isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Risco
              </Button>
            </div>

            {riscos.map((risco, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={risco}
                  onChange={(e) => atualizarRisco(idx, e.target.value)}
                  placeholder="Descreva um risco..."
                  disabled={isSubmitting}
                />
                {riscos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerRisco(idx)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações Gerais</Label>
            <Textarea
              id="observacoes"
              value={metaData.observacoes}
              onChange={(e) => setMetaData({ ...metaData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre a meta..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A criar..." : "Criar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}