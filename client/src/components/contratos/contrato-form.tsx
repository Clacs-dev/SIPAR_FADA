/**
 * Formulário de Criação/Edição de Contratos
 */

import { useState, useEffect } from "react";
import { FileKey, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner@2.0.3";
import type { Contrato, TipoContrato } from "./types";

interface ContratoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Contrato>) => Promise<Contrato | null>;
  contrato?: Contrato;
  mode: "create" | "edit";
}

export function ContratoForm({ open, onClose, onSubmit, contrato, mode }: ContratoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "prestacao_servicos" as TipoContrato,
    fornecedor_nome: "",
    fornecedor_nif: "",
    fornecedor_contato: "",
    data_inicio: "",
    data_fim: "",
    valor_total: 0,
    moeda: "AOA",
    renovacao_automatica: false,
    observacoes: "",
  });
  
  const [prestacoes, setPrestacoes] = useState<Array<{ numero: number; percentual: number }>>([
    { numero: 1, percentual: 100 }
  ]);

  // Funções para gerenciar prestações
  const adicionarPrestacao = () => {
    const novaPrestacao = {
      numero: prestacoes.length + 1,
      percentual: 0
    };
    setPrestacoes([...prestacoes, novaPrestacao]);
  };

  const removerPrestacao = (numero: number) => {
    if (prestacoes.length === 1) {
      toast.error("Deve haver pelo menos uma prestação");
      return;
    }
    setPrestacoes(prestacoes.filter(p => p.numero !== numero));
  };

  const atualizarPercentual = (numero: number, percentual: number) => {
    setPrestacoes(prestacoes.map(p => 
      p.numero === numero ? { ...p, percentual } : p
    ));
  };

  const calcularTotalPercentual = () => {
    return prestacoes.reduce((total, p) => total + p.percentual, 0);
  };

  useEffect(() => {
    if (mode === "edit" && contrato) {
      setFormData({
        titulo: contrato.titulo,
        descricao: contrato.descricao,
        tipo: contrato.tipo,
        fornecedor_nome: contrato.contratado_nome || contrato.fornecedor_nome || '',
        fornecedor_nif: contrato.contratado_documento || contrato.fornecedor_nif || '',
        fornecedor_contato: contrato.contratado_contato || contrato.fornecedor_contato || '',
        data_inicio: contrato.data_inicio.split("T")[0],
        data_fim: contrato.data_fim.split("T")[0],
        valor_total: contrato.valor_total,
        moeda: contrato.moeda,
        renovacao_automatica: contrato.renovacao_automatica || false,
        observacoes: contrato.observacoes || "",
      });
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "prestacao_servicos",
        fornecedor_nome: "",
        fornecedor_nif: "",
        fornecedor_contato: "",
        data_inicio: "",
        data_fim: "",
        valor_total: 0,
        moeda: "AOA",
        renovacao_automatica: false,
        observacoes: "",
      });
    }
  }, [mode, contrato, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!formData.fornecedor_nome.trim()) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }
    if (!formData.data_inicio || !formData.data_fim) {
      toast.error("Datas de início e fim são obrigatórias");
      return;
    }
    if (new Date(formData.data_fim) <= new Date(formData.data_inicio)) {
      toast.error("Data de fim deve ser posterior à data de início");
      return;
    }
    if (formData.valor_total <= 0) {
      toast.error("Valor total deve ser maior que zero");
      return;
    }

    // Validar prestações
    const totalPercentual = calcularTotalPercentual();
    if (totalPercentual !== 100) {
      toast.error(`Total das prestações deve ser 100% (atual: ${totalPercentual.toFixed(2)}%)`);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Preparar dados com prestações
      const dataComPrestacoes = {
        ...formData,
        prestacoes: prestacoes.map(p => ({
          numero: p.numero,
          percentual: p.percentual,
          valor: (formData.valor_total * p.percentual) / 100
        }))
      };
      
      const result = await onSubmit(dataComPrestacoes);
      if (result) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileKey className="h-5 w-5" />
            {mode === "create" ? "Novo Contrato" : "Editar Contrato"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do contrato. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="titulo">Título do Contrato *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Contrato de Prestação de Serviços de TI"
                disabled={isSubmitting}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="descricao">Objectivo do Contrato</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada do contrato..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Contrato *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoContrato })}
                disabled={isSubmitting}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prestacao_servicos">Prestação de Serviços</SelectItem>
                  <SelectItem value="fornecimento">Fornecimento</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="consultoria">Consultoria</SelectItem>
                  <SelectItem value="licenciamento">Licenciamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fornecedor_nome">Fornecedor/Prestador *</Label>
              <Input
                id="fornecedor_nome"
                value={formData.fornecedor_nome}
                onChange={(e) => setFormData({ ...formData, fornecedor_nome: e.target.value })}
                placeholder="Nome da empresa"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="fornecedor_nif">NIF do Fornecedor</Label>
              <Input
                id="fornecedor_nif"
                value={formData.fornecedor_nif}
                onChange={(e) => setFormData({ ...formData, fornecedor_nif: e.target.value })}
                placeholder="000000000"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="fornecedor_contato">Contato do Fornecedor</Label>
              <Input
                id="fornecedor_contato"
                value={formData.fornecedor_contato}
                onChange={(e) => setFormData({ ...formData, fornecedor_contato: e.target.value })}
                placeholder="+244 900 000 000"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data de Fim *</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="valor_total">Valor Total *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="moeda">Moeda *</Label>
              <Select
                value={formData.moeda}
                onValueChange={(value) => setFormData({ ...formData, moeda: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger id="moeda">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AOA">AOA (Kwanza)</SelectItem>
                  <SelectItem value="USD">USD (Dólar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SEÇÃO DE PRESTAÇÕES */}
            <div className="col-span-2 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Prestações de Pagamento</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarPrestacao}
                  disabled={isSubmitting}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {prestacoes.map((prestacao, index) => (
                  <div key={prestacao.numero} className="flex items-center gap-2">
                    <span className="text-sm font-medium">Prestação {prestacao.numero}:</span>
                    <Input
                      id={`prestacao-${prestacao.numero}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={prestacao.percentual}
                      onChange={(e) => atualizarPercentual(prestacao.numero, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      disabled={isSubmitting}
                      className="w-20"
                    />
                    <span className="text-sm">%</span>
                    {prestacoes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerPrestacao(prestacao.numero)}
                        disabled={isSubmitting}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {index < prestacoes.length - 1 && <span className="text-muted-foreground">,</span>}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm p-2 bg-muted rounded">
                <span className="font-medium">Total:</span>
                <span className={`font-semibold ${calcularTotalPercentual() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {calcularTotalPercentual().toFixed(2)}%
                  {calcularTotalPercentual() !== 100 && (
                    <span className="ml-2 text-xs">(deve somar 100%)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Checkbox
                id="renovacao_automatica"
                checked={formData.renovacao_automatica}
                onCheckedChange={(checked) => setFormData({ ...formData, renovacao_automatica: checked as boolean })}
                disabled={isSubmitting}
              />
              <Label htmlFor="renovacao_automatica" className="cursor-pointer">
                Renovação automática
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A gravar..." : mode === "create" ? "Criar Contrato" : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}