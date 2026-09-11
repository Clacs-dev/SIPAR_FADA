import { useState } from "react";
import { Upload, X, Plus, FileText, AlertCircle, Landmark, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface FacturaItem {
  id: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  iva: number;
}

interface SubmitFacturaFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export function SubmitFacturaForm({ onCancel, onSuccess }: SubmitFacturaFormProps) {
  const { user, accessToken, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Dados do formulário
  const [formData, setFormData] = useState({
    numero_fornecedor: '',
    data_emissao: '',
    data_vencimento: '',
    data_recebimento: new Date().toISOString().split('T')[0],
    moeda: 'AOA',
    condicoes_pagamento: '30 dias',
    descricao: '',
    observacoes: '',
    tipo: '',
    tipo_documento: 'factura',
  });

  // Dados bancários - carregados do perfil (reutilizáveis) e editáveis aqui
  const [dadosBancarios, setDadosBancarios] = useState({
    bankName: user?.bankName || '',
    bankAccountHolder: user?.bankAccountHolder || user?.name || '',
    bankIban: user?.bankIban || '',
    bankNib: user?.bankNib || '',
    bankSwift: user?.bankSwift || '',
    bankCity: user?.bankCity || '',
    bankCountry: user?.bankCountry || 'Angola',
  });
  const [savingBankDetails, setSavingBankDetails] = useState(false);
  const [bankDetailsSaved, setBankDetailsSaved] = useState(false);

  const handleSaveBankDetails = async () => {
    setSavingBankDetails(true);
    setBankDetailsSaved(false);
    try {
      await fetch(`${API_BASE_URL}/auth/me/bank-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(dadosBancarios),
      });
      await refreshUser();
      setBankDetailsSaved(true);
      setTimeout(() => setBankDetailsSaved(false), 3000);
    } catch (err) {
 console.error('Erro ao guardar dados bancários:', err);
    } finally {
      setSavingBankDetails(false);
    }
  };

  // Itens da factura
  const [itens, setItens] = useState<FacturaItem[]>([
    {
      id: '1',
      descricao: '',
      quantidade: 1,
      preco_unitario: 0,
      iva: 14,
    },
  ]);

  // Anexos
  const [anexos, setAnexos] = useState<File[]>([]);

  // Cálculos automáticos
  const calcularTotais = () => {
    let subtotal = 0;
    let ivaTotal = 0;

    itens.forEach((item) => {
      const itemSubtotal = item.quantidade * item.preco_unitario;
      const itemIva = itemSubtotal * (item.iva / 100);
      subtotal += itemSubtotal;
      ivaTotal += itemIva;
    });

    return {
      subtotal,
      ivaTotal,
      total: subtotal + ivaTotal,
    };
  };

  const totais = calcularTotais();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: formData.moeda,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        id: Date.now().toString(),
        descricao: '',
        quantidade: 1,
        preco_unitario: 0,
        iva: 14,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (itens.length > 1) {
      setItens(itens.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof FacturaItem, value: any) => {
    setItens(
      itens.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isValid = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValid && isValidSize;
    });

    setAnexos([...anexos, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setAnexos(anexos.filter((_, i) => i !== index));
  };

  const uploadAnexos = async (facturaId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of anexos) {
      const fileName = `${facturaId}/${Date.now()}-${file.name}`;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(
          `${API_BASE_URL}/storage/upload`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || 'Erro ao fazer upload do ficheiro');
        }

        const data = await response.json();
        uploadedUrls.push(data.file?.url);
      } catch (err) {
 console.error('Erro no upload:', err);
        throw err;
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validações
      if (!formData.numero_fornecedor || !formData.data_emissao || !formData.data_vencimento) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      if (itens.some((item) => !item.descricao || item.quantidade <= 0 || item.preco_unitario <= 0)) {
        throw new Error('Por favor, preencha todos os itens corretamente');
      }

      if (anexos.length === 0) {
        throw new Error('Por favor, anexe pelo menos um ficheiro (PDF da factura)');
      }

      if (!dadosBancarios.bankIban && !dadosBancarios.bankNib) {
        throw new Error('Por favor, indique o IBAN ou o NIB para recebimento do pagamento');
      }

      // Gerar número da factura automaticamente
      const dataAtual = new Date();
      const ano = dataAtual.getFullYear();
      const numeroSequencial = Math.floor(Math.random() * 1000) + 1; // Em produção, buscar do backend
      const numeroFactura = `FT/${String(numeroSequencial).padStart(3, '0')}/${ano}`;

      // Criar factura
      const facturaData = {
        numero: numeroFactura, // Número interno do sistema
        numero_fornecedor: formData.numero_fornecedor, // Número da factura do fornecedor
        ...formData,
        fornecedor_id: user?.id, // O utilizador externo é o fornecedor
        fornecedor_nome: user?.name,
        fornecedor_email: user?.email,
        itens: itens.map((item, index) => ({
          ...item,
          total: item.quantidade * item.preco_unitario * (1 + item.iva / 100),
        })),
        subtotal: totais.subtotal,
        iva_total: totais.ivaTotal,
        total: totais.total,
        banco_nome: dadosBancarios.bankName,
        banco_titular: dadosBancarios.bankAccountHolder,
        banco_iban: dadosBancarios.bankIban,
        banco_nib: dadosBancarios.bankNib,
        banco_swift: dadosBancarios.bankSwift,
        banco_cidade: dadosBancarios.bankCity,
        banco_pais: dadosBancarios.bankCountry,
        status: 'pendente', // Status inicial - facturas externas entram diretamente como pendente para validação de Compras
      };

      const response = await fetch(
        `${API_BASE_URL}/facturas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(facturaData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao submeter factura');
      }

      const { factura } = await response.json();

      // Upload de anexos
      if (anexos.length > 0) {
        setUploadProgress(50);
        const anexoUrls = await uploadAnexos(factura.id);
        
        // Atualizar factura com anexos
        await fetch(
          `${API_BASE_URL}/facturas/${factura.id}/anexos`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ anexos: anexoUrls }),
          }
        );
      }

      setUploadProgress(100);
      setSuccess(true);
      
      // Chamar callback de sucesso
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
 console.error('Erro ao submeter factura:', err);
      setError(err instanceof Error ? err.message : 'Erro ao submeter factura');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tone-success-soft)' }}>
                <svg
                  className="w-6 h-6"
                  style={{ color: 'var(--tone-success)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Factura Submetida com Sucesso!</h2>
            <p className="text-muted-foreground mb-4">
              A sua factura foi registada e será validada pela equipa financeira.
              Receberá uma notificação por email quando o estado for actualizado.
            </p>
            <Button onClick={onCancel}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <FileText className="h-6 w-6" />
              Nova Factura
            </h1>
            <p className="text-muted-foreground mt-1">
              Registar nova factura de fornecedor
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Informações do Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fornecedor *</Label>
              <Input value={user?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_fornecedor">Nº Factura Fornecedor *</Label>
              <Input
                id="numero_fornecedor"
                placeholder="Ex: FT2026/001"
                value={formData.numero_fornecedor}
                onChange={(e) =>
                  setFormData({ ...formData, numero_fornecedor: e.target.value })
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Dados Bancários para Pagamento
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveBankDetails}
                disabled={savingBankDetails}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingBankDetails ? 'A guardar...' : bankDetailsSaved ? 'Guardado!' : 'Guardar como meus dados'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Estes dados ficam guardados no seu perfil e são reutilizados automaticamente nas próximas facturas. Pode alterá-los aqui sempre que necessário.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankAccountHolder">Titular da Conta</Label>
              <Input
                id="bankAccountHolder"
                placeholder="Nome do titular da conta"
                value={dadosBancarios.bankAccountHolder}
                onChange={(e) => setDadosBancarios({ ...dadosBancarios, bankAccountHolder: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Banco</Label>
              <Input
                id="bankName"
                placeholder="Nome do banco"
                value={dadosBancarios.bankName}
                onChange={(e) => setDadosBancarios({ ...dadosBancarios, bankName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankIban">IBAN</Label>
              <Input
                id="bankIban"
                placeholder="AO06 0000 0000 0000 0000 0000 0"
                value={dadosBancarios.bankIban}
                onChange={(e) => setDadosBancarios({ ...dadosBancarios, bankIban: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankNib">NIB</Label>
              <Input
                id="bankNib"
                placeholder="0000 0000 0000 0000 0000 0"
                value={dadosBancarios.bankNib}
                onChange={(e) => setDadosBancarios({ ...dadosBancarios, bankNib: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankSwift">Código SWIFT/BIC</Label>
              <Input
                id="bankSwift"
                placeholder="Ex: BAOAAOLU"
                value={dadosBancarios.bankSwift}
                onChange={(e) => setDadosBancarios({ ...dadosBancarios, bankSwift: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankCity">Cidade</Label>
              <Input
                id="bankCity"
                placeholder="Ex: Luanda"
                value={dadosBancarios.bankCity}
                onChange={(e) => setDadosBancarios({ ...dadosBancarios, bankCity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankCountry">País</Label>
              <Input
                id="bankCountry"
                placeholder="Ex: Angola"
                value={dadosBancarios.bankCountry}
                onChange={(e) => setDadosBancarios({ ...dadosBancarios, bankCountry: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tipo de Documento e Factura */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Documento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Documento *</Label>
              <Select
                value={formData.tipo_documento || 'factura'}
                onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
              >
                <SelectTrigger id="tipo_documento">
                  <SelectValue placeholder="Selecione o documento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factura">Factura</SelectItem>
                  <SelectItem value="factura_proforma">Factura Proforma</SelectItem>
                  <SelectItem value="outro">Outro Documento</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Facturas proforma são aceites para efeitos de cotação/aprovação prévia
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Natureza *</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mercadoria">Mercadoria</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Datas e Condições */}
        <Card>
          <CardHeader>
            <CardTitle>Datas e Condições</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão *</Label>
              <Input
                id="data_emissao"
                type="date"
                value={formData.data_emissao}
                onChange={(e) =>
                  setFormData({ ...formData, data_emissao: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) =>
                  setFormData({ ...formData, data_vencimento: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_recebimento">Data de Recebimento *</Label>
              <Input
                id="data_recebimento"
                type="date"
                value={formData.data_recebimento}
                onChange={(e) =>
                  setFormData({ ...formData, data_recebimento: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda *</Label>
              <Select
                value={formData.moeda}
                onValueChange={(value) => setFormData({ ...formData, moeda: value })}
              >
                <SelectTrigger id="moeda">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AOA">AOA - Kwanza</SelectItem>
                  <SelectItem value="USD">USD - Dólar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="condicoes">Condições de Pagamento</Label>
              <Input
                id="condicoes"
                placeholder="Ex: 30 dias"
                value={formData.condicoes_pagamento}
                onChange={(e) =>
                  setFormData({ ...formData, condicoes_pagamento: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Itens da Factura */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Itens da Factura</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {itens.map((item, index) => (
              <div key={item.id} className="space-y-4 pb-4 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {itens.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Descrição *</Label>
                    <Input
                      placeholder="Descrição do item"
                      value={item.descricao}
                      onChange={(e) =>
                        handleItemChange(item.id, 'descricao', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantidade}
                      onChange={(e) =>
                        handleItemChange(item.id, 'quantidade', parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Unit. *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.preco_unitario}
                      onChange={(e) =>
                        handleItemChange(item.id, 'preco_unitario', parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IVA (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={item.iva}
                      onChange={(e) =>
                        handleItemChange(item.id, 'iva', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-3 flex items-end">
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(item.quantidade * item.preco_unitario * (1 + item.iva / 100))}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Totais */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(totais.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA Total:</span>
                <span>{formatCurrency(totais.ivaTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(totais.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição geral da factura"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações ou notas adicionais..."
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Anexos */}
        <Card>
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste ficheiros ou clique para fazer upload
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Tamanho máximo: 5MB por ficheiro
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="application/pdf,image/*"
                multiple
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="secondary" asChild>
                  <span>Seleccionar Ficheiros</span>
                </Button>
              </label>
            </div>

            {anexos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ficheiros anexados:</p>
                {anexos.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'A submeter...' : 'Registar Factura'}
          </Button>
        </div>
      </form>
    </div>
  );
}