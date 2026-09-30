/**
 * Dialog Simplificado para Criar Ordem de Compra a partir de Requisição Aprovada
 * Dados da requisição já vêm preenchidos automaticamente
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
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Package, Building2, Mail, MapPin } from "lucide-react";
import { toast } from "sonner@2.0.3";
import type { Requisicao, Fornecedor } from "./types";

interface CriarOrdemDialogProps {
  open: boolean;
  onClose: () => void;
  requisicao: Requisicao;
  fornecedores: Fornecedor[];
  onSubmit: (data: any) => Promise<boolean>;
}

export function CriarOrdemDialog({
  open,
  onClose,
  requisicao,
  fornecedores,
  onSubmit,
}: CriarOrdemDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [fornecedorId, setFornecedorId] = useState("");
  const [valorTotal, setValorTotal] = useState(requisicao.orcamento_estimado.toString());
  const [prazoEntrega, setPrazoEntrega] = useState<Date | undefined>(undefined);
  const [localEntrega, setLocalEntrega] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const fornecedorSelecionado = fornecedores.find(f => f.id === fornecedorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fornecedorId) {
      toast.error("Selecione um fornecedor");
      return;
    }

    if (!prazoEntrega) {
      toast.error("Defina o prazo de entrega");
      return;
    }

    if (!localEntrega.trim()) {
      toast.error("Informe o local de entrega");
      return;
    }

    setSubmitting(true);

    const ordemData = {
      requisicao_id: requisicao.id,
      fornecedor_id: fornecedorId,
      fornecedor_nome: fornecedorSelecionado?.nome || "",
      valor_total: parseFloat(valorTotal),
      prazo_entrega: prazoEntrega.toISOString(),
      local_entrega: localEntrega,
      condicoes_pagamento: condicoesPagamento,
      observacoes,
      itens: requisicao.itens, // Herda os itens da requisição
    };

    const success = await onSubmit(ordemData);
    
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Criar Ordem de Compra
          </DialogTitle>
          <DialogDescription>
            Requisição: <strong>{requisicao.numero}</strong> - {requisicao.descricao}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Requisição (Read-only) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 mb-2">Dados da Requisição</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Tipo:</span>{" "}
                <span className="text-blue-900">{requisicao.tipo}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Solicitante:</span>{" "}
                <span className="text-blue-900">{requisicao.solicitante_nome}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Departamento:</span>{" "}
                <span className="text-blue-900">{requisicao.departamento_solicitante}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Orçamento Estimado:</span>{" "}
                <span className="text-blue-900 font-bold">
                  {requisicao.orcamento_estimado.toLocaleString('pt-AO')} AOA
                </span>
              </div>
            </div>

            {/* Itens da Requisição */}
            <div className="mt-3">
              <p className="text-blue-700 font-medium mb-1">Itens ({requisicao.itens.length}):</p>
              <div className="space-y-1">
                {requisicao.itens.map((item, idx) => (
                  <div key={idx} className="text-sm bg-white p-2 rounded border border-blue-100">
                    • {item.descricao} - <strong>{item.quantidade} {item.unidade}</strong>
                    {item.especificacoes && (
                      <span className="text-muted-foreground ml-2">
                        ({item.especificacoes})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seleção de Fornecedor */}
          <div className="space-y-2">
            <Label htmlFor="fornecedor" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Fornecedor *
            </Label>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome} - {f.telefone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fornecedorSelecionado && (
              <p className="text-xs text-muted-foreground">
                <Mail className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />{fornecedorSelecionado.email} • <MapPin className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />{fornecedorSelecionado.endereco}
              </p>
            )}
          </div>

          {/* Valor Total */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor Total da Ordem (AOA) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder="Ex: 150000.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Orçamento estimado: {requisicao.orcamento_estimado.toLocaleString('pt-AO')} AOA
            </p>
          </div>

          {/* Prazo de Entrega */}
          <div className="space-y-2">
            <Label>Prazo de Entrega *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {prazoEntrega ? (
                    format(prazoEntrega, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={prazoEntrega}
                  onSelect={setPrazoEntrega}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Local de Entrega */}
          <div className="space-y-2">
            <Label htmlFor="local">Local de Entrega *</Label>
            <Input
              id="local"
              value={localEntrega}
              onChange={(e) => setLocalEntrega(e.target.value)}
              placeholder="Ex: Sede Principal - Luanda"
              required
            />
          </div>

          {/* Condições de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="pagamento">Condições de Pagamento</Label>
            <Input
              id="pagamento"
              value={condicoesPagamento}
              onChange={(e) => setCondicoesPagamento(e.target.value)}
              placeholder="Ex: 50% adiantado, 50% na entrega"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a ordem de compra"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "A criar..." : "Criar Ordem de Compra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
