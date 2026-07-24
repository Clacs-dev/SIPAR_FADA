import { useState } from "react";
import { Receipt, Upload, X, Save, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Factura, ItemFactura, Fornecedor, FacturaTipo } from "./types";
import { FileUpload } from "../ui/file-upload";
import { useFileUpload } from "../../hooks/use-file-upload";

interface FacturaFormProps {
  factura?: Factura;
  fornecedores: Fornecedor[];
  onSave: (factura: Partial<Factura>) => void;
  onCancel: () => void;
}

export function FacturaForm({ factura, fornecedores, onSave, onCancel }: FacturaFormProps) {
  const [formData, setFormData] = useState({
    fornecedor_id: factura?.fornecedor_id || '',
    numero_fornecedor: factura?.numero_fornecedor || '',
    tipo: factura?.tipo || '' as FacturaTipo | '',
    data_emissao: factura?.data_emissao || '',
    data_vencimento: factura?.data_vencimento || '',
    data_recebimento: factura?.data_recebimento || new Date().toISOString().split('T')[0],
    descricao: factura?.descricao || '',
    observacoes: factura?.observacoes || '',
    condicoes_pagamento: factura?.condicoes_pagamento || '',
    moeda: factura?.moeda || 'AOA',
  });

  const [itens, setItens] = useState<ItemFactura[]>(
    factura?.itens || [
      {
        id: '1',
        descricao: '',
        quantidade: 1,
        preco_unitario: 0,
        iva: 14,
        total: 0,
      }
    ]
  );

  const {
    files,
    uploading,
    uploadFiles,
    removeFile,
    formatFileSize,
  } = useFileUpload('make-8b82752b-facturas');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof ItemFactura, value: any) => {
    const newItens = [...itens];
    newItens[index] = {
      ...newItens[index],
      [field]: value,
    };

    // Recalcular total do item
    if (field === 'quantidade' || field === 'preco_unitario' || field === 'iva') {
      const item = newItens[index];
      const subtotal = item.quantidade * item.preco_unitario;
      const valorIva = subtotal * (item.iva / 100);
      item.total = subtotal + valorIva;
    }

    setItens(newItens);
  };

  const addItem = () => {
    setItens([
      ...itens,
      {
        id: Date.now().toString(),
        descricao: '',
        quantidade: 1,
        preco_unitario: 0,
        iva: 14,
        total: 0,
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = itens.reduce((sum, item) => {
      return sum + (item.quantidade * item.preco_unitario);
    }, 0);

    const iva_total = itens.reduce((sum, item) => {
      const itemSubtotal = item.quantidade * item.preco_unitario;
      return sum + (itemSubtotal * (item.iva / 100));
    }, 0);

    const total = subtotal + iva_total;

    return { subtotal, iva_total, total };
  };

  const handleSave = () => {
    const totals = calculateTotals();
    
 console.log('=== DEBUG FACTURA SAVE ===');
 console.log(' Estado atual dos ficheiros:', files);
 console.log(' Número de ficheiros:', files.length);
 console.log(' Upload em curso?', uploading);
    
    // Criar array de anexos corretamente
    const anexos = files.length > 0 
      ? files.map(f => {
 console.log(' Processando ficheiro:', { id: f.id, nome: f.name, url: f.url, tamanho: f.size });
          return { 
            id: f.id,
            nome: f.name, 
            url: f.url, 
            tamanho: f.size,
            tipo: f.tipo 
          };
        })
      : [];
    
 console.log(' Array final de anexos a enviar:', anexos);
 console.log('=== FIM DEBUG ===');
    
    onSave({
      ...formData,
      itens,
      subtotal: totals.subtotal,
      iva_total: totals.iva_total,
      total: totals.total,
      anexos: anexos,
      status: 'pendente', // Status correto do sistema
    });
  };

  const handleUpload = async (fileList: FileList) => {
    try {
      await uploadFiles(fileList);
    } catch (err) {
 console.error('Erro ao fazer upload:', err);
    }
  };

  const handleRemove = async (fileId: string) => {
    try {
      await removeFile(fileId);
    } catch (err) {
 console.error('Erro ao remover ficheiro:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: formData.moeda,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            {factura ? 'Editar Factura' : 'Nova Factura'}
          </h1>
          <p className="text-muted-foreground">
            {factura ? `Factura ${factura.numero}` : 'Registar nova factura de fornecedor'}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      {/* Informações do Fornecedor */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fornecedor_id">Fornecedor *</Label>
              <select
                id="fornecedor_id"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.fornecedor_id}
                onChange={(e) => handleChange('fornecedor_id', e.target.value)}
              >
                <option value="">Selecione o fornecedor...</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nome} - NIF: {f.nif}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_fornecedor">Nº Factura Fornecedor *</Label>
              <Input
                id="numero_fornecedor"
                placeholder="Ex: FT2026/001"
                value={formData.numero_fornecedor}
                onChange={(e) => handleChange('numero_fornecedor', e.target.value)}
              />
            </div>
          </div>

          {formData.fornecedor_id && (
            <div className="p-3 bg-accent rounded-lg">
              {(() => {
                const fornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);
                if (!fornecedor) return null;
                return (
                  <div className="grid gap-2 text-sm">
                    <p><strong>Email:</strong> {fornecedor.email}</p>
                    <p><strong>Telefone:</strong> {fornecedor.telefone}</p>
                    <p><strong>Morada:</strong> {fornecedor.morada}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipo de Factura */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <select
              id="tipo"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              required
            >
              <option value="">Selecione o tipo...</option>
              <option value="mercadoria">Mercadoria</option>
              <option value="servico">Serviço</option>
              <option value="ambos">Ambos</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Selecione se a factura é de mercadoria, serviço ou ambos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Datas e Condições */}
      <Card>
        <CardHeader>
          <CardTitle>Datas e Condições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão *</Label>
              <Input
                id="data_emissao"
                type="date"
                value={formData.data_emissao}
                onChange={(e) => handleChange('data_emissao', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => handleChange('data_vencimento', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_recebimento">Data de Recebimento *</Label>
              <Input
                id="data_recebimento"
                type="date"
                value={formData.data_recebimento}
                onChange={(e) => handleChange('data_recebimento', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda *</Label>
              <select
                id="moeda"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.moeda}
                onChange={(e) => handleChange('moeda', e.target.value)}
              >
                <option value="AOA">Kwanza (AOA)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
              <Input
                id="condicoes_pagamento"
                placeholder="Ex: 30 dias"
                value={formData.condicoes_pagamento}
                onChange={(e) => handleChange('condicoes_pagamento', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens da Factura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itens da Factura</CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {itens.map((item, index) => (
            <div key={item.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Item {index + 1}</span>
                {itens.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-5">
                <div className="md:col-span-2 space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Descrição do item"
                    value={item.descricao}
                    onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preço Unit. *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.preco_unitario}
                    onChange={(e) => handleItemChange(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>IVA (%)</Label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={item.iva}
                    onChange={(e) => handleItemChange(index, 'iva', parseFloat(e.target.value))}
                  >
                    <option value="0">0%</option>
                    <option value="7">7%</option>
                    <option value="14">14%</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold">{formatCurrency(item.total)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Totais */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA Total:</span>
              <span className="font-medium">{formatCurrency(totals.iva_total)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descrição e Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              placeholder="Descrição geral da factura"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações ou notas adicionais..."
              rows={3}
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Anexos */}
      <Card>
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            files={files}
            uploading={uploading}
            onUpload={handleUpload}
            onRemove={handleRemove}
            formatFileSize={formatFileSize}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={uploading}>
          <Save className="mr-2 h-4 w-4" />
          {uploading ? 'Aguarde o upload...' : 'Registar Factura'}
        </Button>
      </div>
    </div>
  );
}