/**
 * Formulários de Requisição e Ordem de Compra
 */

import { useState, useEffect } from "react";
import { ShoppingBag, FileText, Plus, Trash2, Pencil, Mail, Phone, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner@2.0.3";
import { useFornecedores } from "../../hooks/use-fornecedores";
import type { Fornecedor } from "./types";

interface CompraFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitRequisicao: (data: any) => Promise<any>;
  onSubmitOrdemCompra: (data: any) => Promise<any>;
}

export function CompraForm({ open, onClose, onSubmitRequisicao, onSubmitOrdemCompra }: CompraFormProps) {
  const [activeTab, setActiveTab] = useState("requisicao");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);

  // Hook de fornecedores
  const { fornecedores, fetchFornecedores } = useFornecedores();

  // Carregar fornecedores ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchFornecedores();
    }
  }, [open, fetchFornecedores]);

  // Requisição
  const [reqData, setReqData] = useState({
    tipo: "bem",
    descricao: "",
    justificativa: "",
    prioridade: "normal",
    orcamento_estimado: 0,
    solicitante: "",
    prazo_desejado: "",
  });
  const [reqItens, setReqItens] = useState([{ descricao: "", quantidade: 1, especificacoes: "" }]);

  // Ordem de Compra
  const [ocData, setOcData] = useState({
    fornecedor_id: "",
    fornecedor_nome: "",
    valor_total: 0,
    prazo_entrega: "",
    local_entrega: "",
    condicoes_pagamento: "",
    observacoes: "",
    prazo_validade: "",
  });
  const [ocItens, setOcItens] = useState([{ descricao: "", quantidade: 1, valor_unitario: 0 }]);

  const handleSubmitRequisicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqData.descricao.trim() || !reqData.justificativa.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmitRequisicao({ ...reqData, itens: reqItens });
      if (result) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocData.fornecedor_nome.trim() || ocData.valor_total <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmitOrdemCompra({ ...ocData, itens: ocItens });
      if (result) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Procurement
          </DialogTitle>
          <DialogDescription>
            Escolha uma aba: <strong>Requisição de Compra</strong> ou <strong>Ordem de Compra</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requisicao">
              <FileText className="mr-2 h-4 w-4" />
              Requisição de Compra
            </TabsTrigger>
            <TabsTrigger value="ordem">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ordem de Compra
            </TabsTrigger>
          </TabsList>

          {/* REQUISIÇÃO */}
          <TabsContent value="requisicao">
            <form onSubmit={handleSubmitRequisicao} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={reqData.tipo}
                    onValueChange={(value) => setReqData({ ...reqData, tipo: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bem">Bem</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                      <SelectItem value="obra">Obra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prioridade">Importância *</Label>
                  <Select
                    value={reqData.prioridade}
                    onValueChange={(value) => setReqData({ ...reqData, prioridade: value })}
                    disabled={isSubmitting}
                  >
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

                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={reqData.descricao}
                    onChange={(e) => setReqData({ ...reqData, descricao: e.target.value })}
                    placeholder="Descreva o que precisa ser adquirido..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="justificativa">Justificativa *</Label>
                  <Textarea
                    id="justificativa"
                    value={reqData.justificativa}
                    onChange={(e) => setReqData({ ...reqData, justificativa: e.target.value })}
                    placeholder="Justifique a necessidade..."
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="orcamento_estimado">Orçamento Estimado (AOA)</Label>
                  <Input
                    id="orcamento_estimado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={reqData.orcamento_estimado}
                    onChange={(e) => setReqData({ ...reqData, orcamento_estimado: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="solicitante">Solicitante</Label>
                  <Input
                    id="solicitante"
                    value={reqData.solicitante}
                    onChange={(e) => setReqData({ ...reqData, solicitante: e.target.value })}
                    placeholder="Nome do solicitante"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="prazo_desejado">Prazo Desejado</Label>
                  <Input
                    id="prazo_desejado"
                    type="date"
                    value={reqData.prazo_desejado}
                    onChange={(e) => setReqData({ ...reqData, prazo_desejado: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Itens */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Itens</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setReqItens([...reqItens, { descricao: "", quantidade: 1, especificacoes: "" }])}
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
                {reqItens.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-6">
                      <Input
                        placeholder="Descrição"
                        value={item.descricao}
                        onChange={(e) => {
                          const newItens = [...reqItens];
                          newItens[index].descricao = e.target.value;
                          setReqItens(newItens);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qtd"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => {
                          const newItens = [...reqItens];
                          newItens[index].quantidade = parseInt(e.target.value) || 1;
                          setReqItens(newItens);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Especificações"
                        value={item.especificacoes}
                        onChange={(e) => {
                          const newItens = [...reqItens];
                          newItens[index].especificacoes = e.target.value;
                          setReqItens(newItens);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    {reqItens.length > 1 && (
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setReqItens(reqItens.filter((_, i) => i !== index))}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A criar..." : "Criar Requisição"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* ORDEM DE COMPRA */}
          <TabsContent value="ordem">
            <form onSubmit={handleSubmitOC} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Dropdown de Fornecedores */}
                <div className="col-span-2">
                  <Label htmlFor="fornecedor_select">Selecionar Fornecedor *</Label>
                  <Select
                    value={fornecedorSelecionado?.id || "manual"}
                    onValueChange={(value) => {
                      if (value === "manual") {
                        setFornecedorSelecionado(null);
                        setOcData({
                          ...ocData,
                          fornecedor_id: "",
                          fornecedor_nome: "",
                          condicoes_pagamento: "",
                        });
                      } else {
                        const fornecedor = fornecedores.find((f) => f.id === value);
                        if (fornecedor) {
                          setFornecedorSelecionado(fornecedor);
                          setOcData({
                            ...ocData,
                            fornecedor_id: fornecedor.id,
                            fornecedor_nome: fornecedor.nome,
                            condicoes_pagamento: fornecedor.condicoes_pagamento || "",
                          });
                          toast.success(`Fornecedor ${fornecedor.nome} selecionado!`);
                        }
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="fornecedor_select">
                      <SelectValue placeholder="Escolha um fornecedor cadastrado ou digite manualmente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual"><Pencil className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Digitar Manualmente</SelectItem>
                      {fornecedores.length === 0 && (
                        <SelectItem value="none" disabled>
                          Nenhum fornecedor cadastrado
                        </SelectItem>
                      )}
                      {fornecedores
                        .filter((f) => f.situacao === "ativo")
                        .map((fornecedor) => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome} - NIF: {fornecedor.nif}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {fornecedorSelecionado && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Mail className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />{fornecedorSelecionado.email} | <Phone className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />{fornecedorSelecionado.telefone || "N/A"}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="fornecedor_nome">Nome do Fornecedor *</Label>
                  <Input
                    id="fornecedor_nome"
                    value={ocData.fornecedor_nome}
                    onChange={(e) => setOcData({ ...ocData, fornecedor_nome: e.target.value })}
                    placeholder="Nome do fornecedor"
                    disabled={isSubmitting || !!fornecedorSelecionado}
                  />
                  {fornecedorSelecionado && (
                    <p className="text-xs text-green-600 mt-1">
                      <Check className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Auto-preenchido do cadastro
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="valor_total">Valor Total (AOA) *</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={ocData.valor_total}
                    onChange={(e) => setOcData({ ...ocData, valor_total: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="prazo_entrega">Prazo de Entrega *</Label>
                  <Input
                    id="prazo_entrega"
                    type="date"
                    value={ocData.prazo_entrega}
                    onChange={(e) => setOcData({ ...ocData, prazo_entrega: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="local_entrega">Local de Entrega *</Label>
                  <Input
                    id="local_entrega"
                    value={ocData.local_entrega}
                    onChange={(e) => setOcData({ ...ocData, local_entrega: e.target.value })}
                    placeholder="Endereço de entrega"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
                  <Textarea
                    id="condicoes_pagamento"
                    value={ocData.condicoes_pagamento}
                    onChange={(e) => setOcData({ ...ocData, condicoes_pagamento: e.target.value })}
                    placeholder="Ex: 50% antecipado, 50% na entrega"
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={ocData.observacoes}
                    onChange={(e) => setOcData({ ...ocData, observacoes: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="prazo_validade">Prazo de Validade</Label>
                  <Input
                    id="prazo_validade"
                    type="date"
                    value={ocData.prazo_validade}
                    onChange={(e) => setOcData({ ...ocData, prazo_validade: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Itens da Ordem de Compra */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Itens da Ordem de Compra *</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setOcItens([...ocItens, { descricao: "", quantidade: 1, valor_unitario: 0 }])}
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>
                {ocItens.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-7">
                      <Input
                        placeholder="Descrição do item"
                        value={item.descricao}
                        onChange={(e) => {
                          const newItens = [...ocItens];
                          newItens[index].descricao = e.target.value;
                          setOcItens(newItens);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qtd"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => {
                          const newItens = [...ocItens];
                          newItens[index].quantidade = parseInt(e.target.value) || 1;
                          setOcItens(newItens);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Valor Unit."
                        min="0"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => {
                          const newItens = [...ocItens];
                          newItens[index].valor_unitario = parseFloat(e.target.value) || 0;
                          setOcItens(newItens);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    {ocItens.length > 1 && (
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setOcItens(ocItens.filter((_, i) => i !== index))}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A criar..." : "Emitir Ordem de Compra"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}