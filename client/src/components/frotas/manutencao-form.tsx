import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent } from "../ui/card";
import { Loader2, Wrench, Plus, Trash2, Calendar, Upload, FileText, Receipt } from "lucide-react";
import { Viatura, TipoManutencao } from "./types";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface ManutencaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viatura: Viatura;
  onSubmit: (data: ManutencaoFormData) => Promise<void>;
}

export interface ManutencaoFormData {
  tipo: TipoManutencao;
  data_entrada: string;
  data_prevista_saida?: string;
  km_manutencao: number;
  descricao: string;
  oficina: string;
  responsavel_oficina?: string;
  telefone_oficina?: string;
  servicos: {
    descricao: string;
    custo: number;
  }[];
  custo_mao_obra: number;
  custo_pecas: number;
  factura_id?: string;
  factura_numero?: string;
  observacoes?: string;
  anexos: File[];
}

export function ManutencaoForm({ 
  open, 
  onOpenChange, 
  viatura,
  onSubmit 
}: ManutencaoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  
  const [formData, setFormData] = useState<ManutencaoFormData>({
    tipo: "preventiva",
    data_entrada: new Date().toISOString().split('T')[0],
    data_prevista_saida: "",
    km_manutencao: viatura?.km_atual || 0,
    descricao: "",
    oficina: "",
    responsavel_oficina: "",
    telefone_oficina: "",
    servicos: [],
    custo_mao_obra: 0,
    custo_pecas: 0,
    observacoes: "",
    anexos: []
  });

  const [novoServico, setNovoServico] = useState({ descricao: "", custo: 0 });

  // Carregar facturas aprovadas
  useEffect(() => {
    const fetchFacturas = async () => {
      setLoadingFacturas(true);
      try {
        const token = localStorage.getItem("session_token");
        const response = await fetch(
          `${API_BASE_URL}/facturas`,
          {
            headers: {
              ...getAuthHeaders(false),
              "X-Session-Token": token || "",
            },
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          // Filtrar apenas facturas aprovadas
          const facturasAprovadas = (result.data || []).filter((f: any) => f.status === 'aprovada');
          setFacturas(facturasAprovadas);
        }
      } catch (err) {
 console.error("Erro ao carregar facturas:", err);
      } finally {
        setLoadingFacturas(false);
      }
    };

    if (open) {
      fetchFacturas();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && viatura) {
      setFormData({
        tipo: "preventiva",
        data_entrada: new Date().toISOString().split('T')[0],
        data_prevista_saida: "",
        km_manutencao: viatura.km_atual || 0,
        descricao: "",
        oficina: "",
        responsavel_oficina: "",
        telefone_oficina: "",
        servicos: [],
        custo_mao_obra: 0,
        custo_pecas: 0,
        observacoes: "",
        anexos: []
      });
      setNovoServico({ descricao: "", custo: 0 });
      setError("");
    }
  }, [open, viatura]);

  const handleAddServico = () => {
    if (!novoServico.descricao.trim()) {
      setError("Digite a descrição do serviço");
      return;
    }
    if (novoServico.custo <= 0) {
      setError("O custo do serviço deve ser maior que zero");
      return;
    }

    setFormData({
      ...formData,
      servicos: [...formData.servicos, { ...novoServico }]
    });
    setNovoServico({ descricao: "", custo: 0 });
    setError("");
  };

  const handleRemoveServico = (index: number) => {
    setFormData({
      ...formData,
      servicos: formData.servicos.filter((_, i) => i !== index)
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData({
        ...formData,
        anexos: [...formData.anexos, ...newFiles]
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData({
      ...formData,
      anexos: formData.anexos.filter((_, i) => i !== index)
    });
  };

  const calcularCustoTotal = () => {
    const custoServicos = formData.servicos.reduce((sum, s) => sum + s.custo, 0);
    return formData.custo_mao_obra + formData.custo_pecas + custoServicos;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!viatura) {
      setError("Viatura não encontrada");
      return;
    }
    
    // Validações
    if (!formData.descricao.trim()) {
      setError("A descrição é obrigatória");
      return;
    }
    if (!formData.oficina.trim()) {
      setError("O nome da oficina é obrigatório");
      return;
    }
    if (formData.km_manutencao < viatura.km_atual) {
      setError(`A kilometragem não pode ser inferior à kilometragem actual (${viatura.km_atual} km)`);
      return;
    }
    if (formData.data_prevista_saida && formData.data_prevista_saida < formData.data_entrada) {
      setError("A data prevista de saída não pode ser anterior à data de entrada");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao criar manutenção");
    } finally {
      setIsLoading(false);
    }
  };

  // Se não há viatura, não renderizar o formulário
  if (!viatura) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Nova Manutenção - {viatura.matricula}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para registar uma nova manutenção para a viatura {viatura.matricula}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tipo de Manutenção */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Manutenção *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: TipoManutencao) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preventiva">Preventiva</SelectItem>
                <SelectItem value="corretiva">Corretiva</SelectItem>
                <SelectItem value="revisao">Revisão</SelectItem>
                <SelectItem value="inspecao">Inspecção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data_entrada" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Entrada *
              </Label>
              <Input
                id="data_entrada"
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_prevista_saida" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data Prevista de Saída
              </Label>
              <Input
                id="data_prevista_saida"
                type="date"
                value={formData.data_prevista_saida}
                onChange={(e) => setFormData({ ...formData, data_prevista_saida: e.target.value })}
              />
            </div>
          </div>

          {/* Kilometragem */}
          <div className="space-y-2">
            <Label htmlFor="km_manutencao">
              Kilometragem da Manutenção *
            </Label>
            <Input
              id="km_manutencao"
              type="number"
              min={viatura.km_atual}
              value={formData.km_manutencao}
              onChange={(e) => setFormData({ ...formData, km_manutencao: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Kilometragem actual: {(viatura.km_atual ?? 0).toLocaleString('pt-PT')} km
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">
              Descrição da Manutenção *
            </Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o tipo de manutenção a ser realizada..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              required
            />
          </div>

          {/* Oficina */}
          <div className="space-y-2">
            <Label htmlFor="oficina">Nome da Oficina *</Label>
            <Input
              id="oficina"
              placeholder="Ex: Auto Mecânica Central"
              value={formData.oficina}
              onChange={(e) => setFormData({ ...formData, oficina: e.target.value })}
              required
            />
          </div>

          {/* Responsável e Telefone */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsavel_oficina">Responsável na Oficina</Label>
              <Input
                id="responsavel_oficina"
                placeholder="Nome do responsável"
                value={formData.responsavel_oficina}
                onChange={(e) => setFormData({ ...formData, responsavel_oficina: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone_oficina">Telefone da Oficina</Label>
              <Input
                id="telefone_oficina"
                type="tel"
                placeholder="+244 923 456 789"
                value={formData.telefone_oficina}
                onChange={(e) => setFormData({ ...formData, telefone_oficina: e.target.value })}
              />
            </div>
          </div>

          {/* Serviços */}
          <div className="space-y-3">
            <Label>Serviços a Realizar</Label>
            
            {/* Lista de Serviços */}
            {formData.servicos.length > 0 && (
              <div className="space-y-2">
                {formData.servicos.map((servico, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{servico.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(servico.custo)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveServico(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Adicionar Novo Serviço */}
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="servico_descricao">Descrição do Serviço</Label>
                    <Input
                      id="servico_descricao"
                      placeholder="Ex: Mudança de óleo e filtros"
                      value={novoServico.descricao}
                      onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servico_custo">Custo (AOA)</Label>
                    <Input
                      id="servico_custo"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={novoServico.custo || ""}
                      onChange={(e) => setNovoServico({ ...novoServico, custo: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddServico}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Serviço
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custos */}
          <div className="space-y-3">
            <Label>Custos</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custo_mao_obra">Mão de Obra (AOA)</Label>
                <Input
                  id="custo_mao_obra"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.custo_mao_obra || ""}
                  onChange={(e) => setFormData({ ...formData, custo_mao_obra: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custo_pecas">Peças (AOA)</Label>
                <Input
                  id="custo_pecas"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.custo_pecas || ""}
                  onChange={(e) => setFormData({ ...formData, custo_pecas: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="p-3 bg-accent rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Custo Total Estimado:</span>
                <span className="text-xl font-bold">{formatCurrency(calcularCustoTotal())}</span>
              </div>
            </div>
          </div>

          {/* Factura Associada */}
          <div className="space-y-3">
            <Label htmlFor="factura_id" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Factura Associada (Opcional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Associe uma factura aprovada a esta manutenção para controlo financeiro
            </p>
            
            {loadingFacturas ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">A carregar facturas...</span>
              </div>
            ) : (
              <Select
                value={formData.factura_id || ""}
                onValueChange={(value) => {
                  const factura = facturas.find(f => f.id === value);
                  setFormData({ 
                    ...formData, 
                    factura_id: value,
                    factura_numero: factura?.numero 
                  });
                }}
              >
                <SelectTrigger id="factura_id">
                  <SelectValue placeholder="Selecione uma factura (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem factura</SelectItem>
                  {facturas.map((factura) => (
                    <SelectItem key={factura.id} value={factura.id}>
                      {factura.numero} - {factura.fornecedor?.nome || 'Fornecedor'} - {formatCurrency(factura.total || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {formData.factura_id && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Factura {formData.factura_numero} será associada a esta manutenção
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Anexos */}
          <div className="space-y-3">
            <Label htmlFor="anexos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Anexos (Orçamentos, Notas, etc.)
            </Label>
            
            {formData.anexos.length > 0 && (
              <div className="space-y-2">
                {formData.anexos.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste ficheiros ou clique para selecionar
              </p>
              <Input
                id="anexos"
                type="file"
                multiple
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registar Manutenção
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
