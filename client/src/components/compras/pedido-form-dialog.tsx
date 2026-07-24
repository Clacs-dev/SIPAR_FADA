/**
 * Formulário de Criação de Pedido de Compra
 * Sistema completo com itens detalhados
 */

import { useState } from "react";
import { Save, Plus, Trash2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner@2.0.3";
import type { ItemPedido, PrioridadePedido, TipoItem } from "./types";

interface PedidoFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
}

export function PedidoFormDialog({ open, onClose, onSubmit }: PedidoFormDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Dados do pedido
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [prioridade, setPrioridade] = useState<PrioridadePedido>("normal");
  const [orcamentoEstimado, setOrcamentoEstimado] = useState("");
  const [prazoDesejado, setPrazoDesejado] = useState("");
  const [localEntrega, setLocalEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  
  // Itens do pedido
  const [itens, setItens] = useState<Partial<ItemPedido>[]>([
    {
      descricao: "",
      tipo: "material",
      quantidade: 1,
      unidade: "unidade",
      especificacoes_tecnicas: "",
      caracteristicas: "",
      observacoes: "",
    }
  ]);

  const handleAddItem = () => {
    setItens([...itens, {
      descricao: "",
      tipo: "material",
      quantidade: 1,
      unidade: "unidade",
      especificacoes_tecnicas: "",
      caracteristicas: "",
      observacoes: "",
    }]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length === 1) {
      toast.error("O pedido deve conter pelo menos um item");
      return;
    }
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };
    setItens(novosItens);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    
    if (!descricao.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }
    
    if (!localEntrega.trim()) {
      toast.error("Local de entrega é obrigatório");
      return;
    }
    
    // Validar itens
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      if (!item.descricao?.trim()) {
        toast.error(`Item ${i + 1}: Descrição é obrigatória`);
        return;
      }
      if (!item.quantidade || item.quantidade <= 0) {
        toast.error(`Item ${i + 1}: Quantidade deve ser maior que zero`);
        return;
      }
    }

    setLoading(true);
    
    const data = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      departamento_solicitante: departamento.trim() || undefined,
      prioridade,
      orcamento_estimado: orcamentoEstimado ? parseFloat(orcamentoEstimado) : 0,
      prazo_entrega_desejado: prazoDesejado || undefined,
      local_entrega: localEntrega.trim(),
      observacoes: observacoes.trim() || undefined,
      itens: itens.map(item => ({
        descricao: item.descricao!.trim(),
        tipo: item.tipo || "material",
        quantidade: item.quantidade || 1,
        unidade: item.unidade || "unidade",
        especificacoes_tecnicas: item.especificacoes_tecnicas?.trim() || "",
        caracteristicas: item.caracteristicas?.trim() || "",
        observacoes: item.observacoes?.trim() || "",
      })),
    };

    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
 console.error("Erro ao criar pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setTitulo("");
      setDescricao("");
      setDepartamento("");
      setPrioridade("normal");
      setOrcamentoEstimado("");
      setPrazoDesejado("");
      setLocalEntrega("");
      setObservacoes("");
      setItens([{
        descricao: "",
        tipo: "material",
        quantidade: 1,
        unidade: "unidade",
        especificacoes_tecnicas: "",
        caracteristicas: "",
        observacoes: "",
      }]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Procurement</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo pedido de compra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Gerais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações Gerais</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Pedido *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Aquisição de Material de Escritório"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departamento">Direção</Label>
                <Input
                  id="departamento"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  placeholder="Ex: Administração"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o objetivo deste pedido de compra..."
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="prioridade">Importância</Label>
                <Select value={prioridade} onValueChange={(v) => setPrioridade(v as PrioridadePedido)}>
                  <SelectTrigger id="prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orcamento">Orçamento Estimado (AOA)</Label>
                <Input
                  id="orcamento"
                  type="number"
                  value={orcamentoEstimado}
                  onChange={(e) => setOrcamentoEstimado(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo do Pedido</Label>
                <Input
                  id="prazo"
                  type="date"
                  value={prazoDesejado}
                  onChange={(e) => setPrazoDesejado(e.target.value)}
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais..."
                rows={2}
              />
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Itens do Pedido</h3>
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                  {itens.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}

                  <div className="font-medium text-sm text-muted-foreground">
                    Item {index + 1}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Descrição *</Label>
                      <Input
                        value={item.descricao || ""}
                        onChange={(e) => handleItemChange(index, "descricao", e.target.value)}
                        placeholder="Ex: Papel A4 Branco"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={item.tipo || "material"}
                        onValueChange={(v) => handleItemChange(index, "tipo", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="servico">Serviço</SelectItem>
                          <SelectItem value="equipamento">Equipamento</SelectItem>
                          <SelectItem value="consumivel">Consumível</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          value={item.quantidade || 1}
                          onChange={(e) => handleItemChange(index, "quantidade", parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unidade</Label>
                        <Input
                          value={item.unidade || "unidade"}
                          onChange={(e) => handleItemChange(index, "unidade", e.target.value)}
                          placeholder="Ex: caixa"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Especificações Técnicas</Label>
                      <Textarea
                        value={item.especificacoes_tecnicas || ""}
                        onChange={(e) => handleItemChange(index, "especificacoes_tecnicas", e.target.value)}
                        placeholder="Especificações técnicas do item..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Características</Label>
                      <Textarea
                        value={item.caracteristicas || ""}
                        onChange={(e) => handleItemChange(index, "caracteristicas", e.target.value)}
                        placeholder="Características adicionais..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Avisos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Antes de submeter:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Verifique se todos os itens estão completos e corretos</li>
                <li>O pedido ficará com status "Criado" até ser publicado</li>
                <li>Após publicar, os fornecedores serão notificados por email</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A criar..." : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}