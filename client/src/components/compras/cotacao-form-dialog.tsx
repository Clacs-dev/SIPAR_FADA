/**
 * Formulário de Submissão de Cotação - Fornecedor Externo
 * Permite responder item por item do pedido
 */

import { useState } from "react";
import { Send, AlertCircle, CheckCircle2, XCircle, Upload, X, FileText, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { toast } from "sonner@2.0.3";
import type { PedidoCompra, RespostaItemFornecedor } from "./types";

interface Prestacao {
  id: string;
  descricao: string;
  percentagem: number;
}

interface CotacaoFormDialogProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoCompra;
  fornecedorId: string;
  onSubmit: (data: any) => Promise<any>;
}

export function CotacaoFormDialog({ 
  open, 
  onClose, 
  pedido, 
  fornecedorId,
  onSubmit 
}: CotacaoFormDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Inicializar respostas para cada item
  const [respostas, setRespostas] = useState<Partial<RespostaItemFornecedor>[]>(
    pedido.itens.map(item => ({
      item_id: item.id,
      item_descricao: item.descricao,
      disponivel: undefined,
      quantidade_disponivel: item.quantidade,
      preco_unitario: undefined,
      iv_percentagem: 0, // IV padrão é 0%
      condicoes_pagamento: "",
      prazo_entrega_dias: undefined,
      observacoes: "",
    }))
  );

  // Informações gerais da cotação
  const [condicoesGerais, setCondicoesGerais] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState<string[]>([]);
  const [prestacoes, setPrestacoes] = useState<Prestacao[]>([]);
  const [prazoValidade, setPrazoValidade] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  
  // Anexos/Documentos
  const [anexos, setAnexos] = useState<File[]>([]);

  // Condições de pagamento disponíveis
  const condicoesPagamentoDisponiveis = [
    { value: "pronto_pagamento", label: "Pronto Pagamento" },
    { value: "7_dias", label: "7 Dias" },
    { value: "14_dias", label: "14 Dias" },
    { value: "30_dias", label: "30 Dias" },
    { value: "60_dias", label: "60 Dias" },
    { value: "prestacoes", label: "Prestações" }
  ];

  const handleCondicaoPagamentoToggle = (value: string) => {
    setCondicoesPagamento(prev => {
      if (prev.includes(value)) {
        // Remover condição
        if (value === "prestacoes") {
          setPrestacoes([]); // Limpar prestações se desmarcar
        }
        return prev.filter(c => c !== value);
      } else {
        // Adicionar condição
        return [...prev, value];
      }
    });
  };

  const handleAddPrestacao = () => {
    const novaPrestacao: Prestacao = {
      id: `prestacao-${Date.now()}`,
      descricao: "",
      percentagem: 0
    };
    setPrestacoes([...prestacoes, novaPrestacao]);
  };

  const handleRemovePrestacao = (id: string) => {
    setPrestacoes(prestacoes.filter(p => p.id !== id));
  };

  const handlePrestacaoChange = (id: string, field: 'descricao' | 'percentagem', value: string | number) => {
    setPrestacoes(prestacoes.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const totalPrestacoes = prestacoes.reduce((sum, p) => sum + (p.percentagem || 0), 0);

  const handleRespostaChange = (index: number, field: string, value: any) => {
    const novasRespostas = [...respostas];
    novasRespostas[index] = { ...novasRespostas[index], [field]: value };
    
    // Se marcar como "não disponível", limpar outros campos
    if (field === "disponivel" && value === "nao") {
      novasRespostas[index].quantidade_disponivel = undefined;
      novasRespostas[index].preco_unitario = undefined;
      novasRespostas[index].prazo_entrega_dias = undefined;
    }
    
    setRespostas(novasRespostas);
  };

  const calcularValorTotal = () => {
    return respostas.reduce((total, resposta) => {
      if (resposta.disponivel === "sim" && resposta.preco_unitario && resposta.quantidade_disponivel) {
        const subtotal = resposta.preco_unitario * resposta.quantidade_disponivel;
        const iv = subtotal * ((resposta.iv_percentagem || 0) / 100);
        return total + subtotal + iv;
      }
      return total;
    }, 0);
  };

  const calcularItensDisponiveis = () => {
    return respostas.filter(r => r.disponivel === "sim").length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
 console.log(' [CotacaoForm] Iniciando submissão...', {
      fornecedorId,
      totalRespostas: respostas.length
    });
    
    // Validações
    const todasRespondidas = respostas.every(r => r.disponivel !== undefined);
    if (!todasRespondidas) {
      toast.error("Por favor, responda a disponibilidade de todos os itens");
      return;
    }

    // Verificar se pelo menos um item está disponível
    const algumDisponivel = respostas.some(r => r.disponivel === "sim");
    if (!algumDisponivel) {
      toast.error("É necessário ter pelo menos um item disponível para submeter a cotação");
      return;
    }

    // Validar itens disponíveis
    for (let i = 0; i < respostas.length; i++) {
      const resposta = respostas[i];
      if (resposta.disponivel === "sim") {
        if (!resposta.preco_unitario || resposta.preco_unitario <= 0) {
          toast.error(`Item ${i + 1}: Preço unitário é obrigatório`);
          return;
        }
        if (!resposta.quantidade_disponivel || resposta.quantidade_disponivel <= 0) {
          toast.error(`Item ${i + 1}: Quantidade disponível deve ser maior que zero`);
          return;
        }
      }
    }

    setLoading(true);
    
    const data = {
      fornecedor_id: fornecedorId,
      itens_resposta: respostas.map(r => ({
        item_id: r.item_id,
        item_descricao: r.item_descricao,
        disponivel: r.disponivel,
        quantidade_disponivel: r.disponivel === "sim" ? r.quantidade_disponivel : undefined,
        preco_unitario: r.disponivel === "sim" ? r.preco_unitario : undefined,
        iv_percentagem: r.disponivel === "sim" ? r.iv_percentagem : undefined,
        condicoes_pagamento: r.condicoes_pagamento || "",
        prazo_entrega_dias: r.disponivel === "sim" ? r.prazo_entrega_dias : undefined,
        observacoes: r.observacoes || "",
      })),
      condicoes_gerais: condicoesGerais.trim() || undefined,
      prazo_validade_cotacao: prazoValidade || undefined,
      observacoes_gerais: observacoesGerais.trim() || undefined,
      anexos: anexos.map(anexo => anexo.name),
    };
    
 console.log(' [CotacaoForm] Dados da cotação:', {
      fornecedor_id: data.fornecedor_id,
      total_itens: data.itens_resposta.length,
      itens_disponiveis: data.itens_resposta.filter(i => i.disponivel === 'sim').length,
      tem_anexos: anexos.length > 0
    });

    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
 console.error(" [CotacaoForm] Erro ao submeter cotação:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar tamanho máximo de 10MB por arquivo
    const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("Alguns arquivos excedem 10MB e não podem ser anexados");
      return;
    }
    
    setAnexos([...anexos, ...files]);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };
  
  const handleRemoveAnexo = (index: number) => {
    setAnexos(anexos.filter((_, i) => i !== index));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const valorTotal = calcularValorTotal();
  const itensDisponiveis = calcularItensDisponiveis();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary font-bold">{pedido.departamento_solicitante}</span>
            <span className="text-muted-foreground font-normal">- {pedido.numero}</span>
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da sua cotação para cada item solicitado. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumo do Pedido */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Informações do Pedido</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total de Itens:</span>
                <p className="font-medium">{pedido.itens.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Prazo Desejado:</span>
                <p className="font-medium">
                  {pedido.prazo_entrega_desejado || "Não especificado"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Local Entrega:</span>
                <p className="font-medium">{pedido.local_entrega}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Orçamento Est.:</span>
                <p className="font-medium">
                  {pedido.orcamento_estimado > 0 
                    ? `${pedido.orcamento_estimado.toLocaleString('pt-AO')} AOA` 
                    : "N/A"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Resumo da Cotação */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Resumo da Sua Cotação</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground text-sm">Itens Disponíveis:</span>
                <p className="font-semibold text-lg">
                  {itensDisponiveis} de {pedido.itens.length}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Valor Total Estimado:</span>
                <p className="font-semibold text-lg text-green-700">
                  {valorTotal.toLocaleString('pt-AO')} AOA
                </p>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="space-y-4">
            <h3 className="font-semibold">Responder por Item</h3>
            
            {pedido.itens.map((item, index) => {
              const resposta = respostas[index];
              const itemOriginal = pedido.itens[index];
              
              return (
                <div key={item.id} className="border rounded-lg p-4 space-y-4">
                  {/* Cabeçalho do Item */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium mb-1">Item {index + 1}</div>
                      <h4 className="font-semibold text-lg">{item.descricao}</h4>
                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        <p><strong>Tipo:</strong> {item.tipo}</p>
                        <p><strong>Quantidade Solicitada:</strong> {item.quantidade} {item.unidade}</p>
                        {item.especificacoes_tecnicas && (
                          <p><strong>Especificações:</strong> {item.especificacoes_tecnicas}</p>
                        )}
                        {item.caracteristicas && (
                          <p><strong>Características:</strong> {item.caracteristicas}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Disponibilidade */}
                  <div className="space-y-2">
                    <Label className="text-base">Você possui este item? *</Label>
                    <RadioGroup
                      value={resposta.disponivel || ""}
                      onValueChange={(value) => handleRespostaChange(index, "disponivel", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id={`${item.id}-sim`} />
                        <Label htmlFor={`${item.id}-sim`} className="cursor-pointer">
                          <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                          Sim, tenho disponível
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id={`${item.id}-nao`} />
                        <Label htmlFor={`${item.id}-nao`} className="cursor-pointer">
                          <XCircle className="h-4 w-4 inline mr-1 text-red-600" />
                          Não, não possuo
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campos adicionais se disponível */}
                  {resposta.disponivel === "sim" && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Quantidade Disponível *</Label>
                          <Input
                            type="number"
                            value={resposta.quantidade_disponivel || ""}
                            onChange={(e) => handleRespostaChange(index, "quantidade_disponivel", parseFloat(e.target.value))}
                            placeholder={`Máx: ${item.quantidade}`}
                            min="0"
                            max={item.quantidade}
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Preço Unitário (AOA) *</Label>
                          <Input
                            type="number"
                            value={resposta.preco_unitario || ""}
                            onChange={(e) => handleRespostaChange(index, "preco_unitario", parseFloat(e.target.value))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>IV (%) - Imposto</Label>
                          <Input
                            type="number"
                            value={resposta.iv_percentagem || 0}
                            onChange={(e) => handleRespostaChange(index, "iv_percentagem", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <p className="text-xs text-muted-foreground">Se não tem IV, deixe em 0</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Prazo de Entrega (dias) *</Label>
                          <Input
                            type="number"
                            value={resposta.prazo_entrega_dias || ""}
                            onChange={(e) => handleRespostaChange(index, "prazo_entrega_dias", parseInt(e.target.value))}
                            placeholder="Ex: 15"
                            min="1"
                            required
                          />
                        </div>
                      </div>


                      <div className="space-y-2">
                        <Label>Observações do Item</Label>
                        <Textarea
                          value={resposta.observacoes || ""}
                          onChange={(e) => handleRespostaChange(index, "observacoes", e.target.value)}
                          placeholder="Informações adicionais sobre este item..."
                          rows={2}
                        />
                      </div>

                      {/* Subtotal */}
                      {resposta.preco_unitario && resposta.quantidade_disponivel && (
                        <div className="bg-green-50 p-3 rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Subtotal (sem IV):</span>
                              <p className="font-medium text-green-700">
                                {(resposta.preco_unitario * resposta.quantidade_disponivel).toLocaleString('pt-AO')} AOA
                              </p>
                            </div>
                            {resposta.iv_percentagem && resposta.iv_percentagem > 0 && (
                              <div>
                                <span className="text-muted-foreground">IV ({resposta.iv_percentagem}%):</span>
                                <p className="font-medium text-orange-700">
                                  {((resposta.preco_unitario * resposta.quantidade_disponivel) * (resposta.iv_percentagem / 100)).toLocaleString('pt-AO')} AOA
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="pt-2 border-t border-green-200">
                            <span className="text-sm text-muted-foreground">Total do Item (com IV):</span>
                            <p className="font-semibold text-lg text-green-700">
                              {(() => {
                                const subtotal = resposta.preco_unitario * resposta.quantidade_disponivel;
                                const iv = subtotal * ((resposta.iv_percentagem || 0) / 100);
                                return (subtotal + iv).toLocaleString('pt-AO');
                              })()} AOA
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Informações Gerais da Cotação */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informações Gerais da Cotação</h3>
            
            {/* Condições de Pagamento - Checklist */}
            <div className="space-y-3">
              <Label>Condições de Pagamento Oferecidas</Label>
              <p className="text-sm text-muted-foreground">
                Selecione todas as opções de pagamento que você pode oferecer
              </p>
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                {condicoesPagamentoDisponiveis.map(condicao => (
                  <div key={condicao.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`condicao-${condicao.value}`}
                      checked={condicoesPagamento.includes(condicao.value)}
                      onCheckedChange={() => handleCondicaoPagamentoToggle(condicao.value)}
                    />
                    <label
                      htmlFor={`condicao-${condicao.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {condicao.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-formulário de Prestações */}
            {condicoesPagamento.includes("prestacoes") && (
              <div className="border border-purple-200 rounded-lg p-4 space-y-3 bg-purple-50">
                <div className="flex items-center justify-between">
                  <Label className="text-purple-900">Detalhes das Prestações</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddPrestacao}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Prestação
                  </Button>
                </div>

                {prestacoes.length === 0 ? (
                  <p className="text-sm text-purple-700 italic">
                    Nenhuma prestação adicionada. Clique em "Adicionar Prestação" para especificar o plano de pagamento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prestacoes.map((prestacao, index) => (
                      <div key={prestacao.id} className="flex gap-2 items-start bg-white p-3 rounded border">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Descrição</Label>
                            <Input
                              value={prestacao.descricao}
                              onChange={(e) => handlePrestacaoChange(prestacao.id, 'descricao', e.target.value)}
                              placeholder="Ex: Entrada 40%"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Percentagem (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={prestacao.percentagem}
                              onChange={(e) => handlePrestacaoChange(prestacao.id, 'percentagem', parseFloat(e.target.value) || 0)}
                              placeholder="Ex: 40"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemovePrestacao(prestacao.id)}
                          className="h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Total das Prestações */}
                    <div className={`text-sm font-medium p-2 rounded ${
                      totalPrestacoes === 100 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Total: {totalPrestacoes.toFixed(2)}% 
                      {totalPrestacoes !== 100 && ` (Faltam ${(100 - totalPrestacoes).toFixed(2)}% para completar 100%)`}
                      {totalPrestacoes === 100 && ' ✓ Completo'}
                    </div>
                  </div>
                )}
              </div>
            )}

            

            <div className="space-y-2">
              <Label htmlFor="validade">Prazo de Validade da Cotação</Label>
              <Input
                id="validade"
                type="date"
                value={prazoValidade}
                onChange={(e) => setPrazoValidade(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações Gerais</Label>
              <Textarea
                id="obs"
                value={observacoesGerais}
                onChange={(e) => setObservacoesGerais(e.target.value)}
                placeholder="Informações adicionais sobre a cotação..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Anexos/Documentos (opcional)</Label>
              <p className="text-sm text-muted-foreground">
                Anexe catálogos, fichas técnicas, certificados ou outros documentos relevantes (máx. 10MB por arquivo)
              </p>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">
                        Clique para escolher arquivos
                      </span>
                      <span className="text-sm text-muted-foreground"> ou arraste aqui</span>
                    </label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, Excel, Imagens (máx. 10MB cada)
                  </p>
                </div>
              </div>
              
              {anexos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {anexos.length} arquivo(s) anexado(s):
                  </Label>
                  <div className="space-y-2">
                    {anexos.map((anexo, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 border rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{anexo.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(anexo.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAnexo(idx)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Avisos */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-1">Antes de submeter:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Verifique todos os preços e quantidades</li>
                <li>A cotação será analisada junto com outras submissões</li>
                <li>Você receberá notificação por email sobre o resultado</li>
                <li>Após submissão, não será possível editar a cotação</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <strong>Valor Total:</strong> {valorTotal.toLocaleString('pt-AO')} AOA
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || itensDisponiveis === 0}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? "A submeter..." : "Submeter Cotação"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}