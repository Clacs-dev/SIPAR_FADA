import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, MapPin, Calendar, Clock, Users, FileText } from "lucide-react";
import { PedidoViatura } from "./pedidos-viatura-types";

interface PedidoViaturaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido?: PedidoViatura;
  onSubmit: (data: PedidoViaturaFormData) => Promise<void>;
  userDepartment: string;
}

export interface PedidoViaturaFormData {
  origem: string;
  destino: string;
  data_inicio_pretendida: string;
  hora_inicio_pretendida: string;
  data_fim_pretendida: string;
  hora_fim_pretendida: string;
  finalidade: string;
  numero_passageiros: number;
  lista_passageiros?: string;
  precisa_motorista: boolean;
  pode_conduzir: boolean;
  aceita_partilha: boolean;
  tipo_viatura_pretendida?: string;
  observacoes?: string;
}

export function PedidoViaturaForm({ 
  open, 
  onOpenChange, 
  pedido,
  onSubmit,
  userDepartment
}: PedidoViaturaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<PedidoViaturaFormData>({
    origem: "",
    destino: "",
    data_inicio_pretendida: "",
    hora_inicio_pretendida: "08:00",
    data_fim_pretendida: "",
    hora_fim_pretendida: "18:00",
    finalidade: "",
    numero_passageiros: 1,
    lista_passageiros: "",
    precisa_motorista: true,
    pode_conduzir: false,
    aceita_partilha: false,
    tipo_viatura_pretendida: "",
    observacoes: ""
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (pedido) {
        // Editar pedido existente (apenas se estiver em rascunho)
        setFormData({
          origem: pedido.itinerario?.split(' -> ')[0] || "",
          destino: pedido.destino,
          data_inicio_pretendida: pedido.data_inicio_pretendida,
          hora_inicio_pretendida: pedido.hora_inicio_pretendida,
          data_fim_pretendida: pedido.data_fim_pretendida,
          hora_fim_pretendida: pedido.hora_fim_pretendida,
          finalidade: pedido.finalidade,
          numero_passageiros: pedido.numero_passageiros,
          lista_passageiros: pedido.lista_passageiros?.join('\n') || "",
          precisa_motorista: !!pedido.motorista_pretendido_id,
          pode_conduzir: !pedido.motorista_pretendido_id,
          aceita_partilha: false, // TODO: adicionar campo no tipo
          tipo_viatura_pretendida: pedido.tipo_viatura_pretendida || "",
          observacoes: pedido.observacoes || ""
        });
      } else {
        // Novo pedido
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        
        setFormData({
          origem: "",
          destino: "",
          data_inicio_pretendida: amanha.toISOString().split('T')[0],
          hora_inicio_pretendida: "08:00",
          data_fim_pretendida: amanha.toISOString().split('T')[0],
          hora_fim_pretendida: "18:00",
          finalidade: "",
          numero_passageiros: 1,
          lista_passageiros: "",
          precisa_motorista: true,
          pode_conduzir: false,
          aceita_partilha: false,
          tipo_viatura_pretendida: "",
          observacoes: ""
        });
      }
      setError("");
    }
  }, [open, pedido]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validações
    if (!formData.origem.trim()) {
      setError("A origem é obrigatória");
      return;
    }
    if (!formData.destino.trim()) {
      setError("O destino é obrigatório");
      return;
    }
    if (!formData.finalidade.trim()) {
      setError("O motivo da viagem é obrigatório");
      return;
    }
    if (!formData.data_inicio_pretendida || !formData.hora_inicio_pretendida) {
      setError("Data e hora de saída são obrigatórias");
      return;
    }
    if (!formData.data_fim_pretendida || !formData.hora_fim_pretendida) {
      setError("Data e hora de retorno são obrigatórias");
      return;
    }

    // Validar que data de início não é no passado
    const dataInicio = new Date(`${formData.data_inicio_pretendida}T${formData.hora_inicio_pretendida}`);
    const agora = new Date();
    if (dataInicio < agora) {
      setError("A data e hora de saída não podem ser no passado");
      return;
    }

    // Validar que data de fim é depois da data de início
    const dataFim = new Date(`${formData.data_fim_pretendida}T${formData.hora_fim_pretendida}`);
    if (dataFim <= dataInicio) {
      setError("A data de retorno deve ser posterior à data de saída");
      return;
    }

    // Validar motorista
    if (formData.precisa_motorista && formData.pode_conduzir) {
      setError("Escolha apenas uma opção: precisa de motorista OU pode conduzir");
      return;
    }
    if (!formData.precisa_motorista && !formData.pode_conduzir) {
      setError("Indique se precisa de motorista ou se pode conduzir");
      return;
    }

    if (formData.numero_passageiros < 1) {
      setError("O número de passageiros deve ser pelo menos 1");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao criar pedido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {pedido ? "Editar Pedido de Viatura" : "Novo Pedido de Viatura"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da viagem que necessita. O pedido será analisado pela gestão.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Origem e Destino */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Trajeto
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origem">Origem *</Label>
                <Input
                  id="origem"
                  placeholder="Ex: Sede do Ministério"
                  value={formData.origem}
                  onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destino">Destino *</Label>
                <Input
                  id="destino"
                  placeholder="Ex: Ministério das Finanças"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Datas e Horas */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Quando
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_saida">Data de Saída *</Label>
                <Input
                  id="data_saida"
                  type="date"
                  value={formData.data_inicio_pretendida}
                  onChange={(e) => setFormData({ ...formData, data_inicio_pretendida: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_saida">Hora de Saída *</Label>
                <Input
                  id="hora_saida"
                  type="time"
                  value={formData.hora_inicio_pretendida}
                  onChange={(e) => setFormData({ ...formData, hora_inicio_pretendida: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_retorno">Data de Retorno *</Label>
                <Input
                  id="data_retorno"
                  type="date"
                  value={formData.data_fim_pretendida}
                  onChange={(e) => setFormData({ ...formData, data_fim_pretendida: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_retorno">Hora de Retorno *</Label>
                <Input
                  id="hora_retorno"
                  type="time"
                  value={formData.hora_fim_pretendida}
                  onChange={(e) => setFormData({ ...formData, hora_fim_pretendida: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Motivo da Viagem */}
          <div className="space-y-2">
            <Label htmlFor="finalidade" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Motivo da Viagem *
            </Label>
            <Textarea
              id="finalidade"
              placeholder="Descreva detalhadamente o motivo da viagem..."
              value={formData.finalidade}
              onChange={(e) => setFormData({ ...formData, finalidade: e.target.value })}
              rows={3}
              required
            />
          </div>

          {/* Passageiros */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Passageiros
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numero_passageiros">Número de Passageiros *</Label>
                <Input
                  id="numero_passageiros"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.numero_passageiros}
                  onChange={(e) => setFormData({ ...formData, numero_passageiros: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lista_passageiros">
                Lista de Passageiros (opcional)
              </Label>
              <Textarea
                id="lista_passageiros"
                placeholder="Um nome por linha..."
                value={formData.lista_passageiros}
                onChange={(e) => setFormData({ ...formData, lista_passageiros: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Inclua-se na lista se for viajar
              </p>
            </div>
          </div>

          {/* Opções de Motorista */}
          <div className="space-y-4">
            <h3 className="font-semibold">Motorista</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="precisa_motorista"
                  checked={formData.precisa_motorista}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      precisa_motorista: !!checked,
                      pode_conduzir: !checked 
                    })
                  }
                />
                <Label htmlFor="precisa_motorista" className="cursor-pointer">
                  Preciso de motorista da empresa
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pode_conduzir"
                  checked={formData.pode_conduzir}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      pode_conduzir: !!checked,
                      precisa_motorista: !checked 
                    })
                  }
                />
                <Label htmlFor="pode_conduzir" className="cursor-pointer">
                  Posso conduzir a viatura (tenho carta de condução válida)
                </Label>
              </div>
            </div>
          </div>

          {/* Partilha de Viagem */}
          <div className="space-y-4">
            <h3 className="font-semibold">Partilha de Viagem</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aceita_partilha"
                checked={formData.aceita_partilha}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, aceita_partilha: !!checked })
                }
              />
              <Label htmlFor="aceita_partilha" className="cursor-pointer">
                Aceito partilhar a viatura com outros colegas (se houver pedidos compatíveis)
              </Label>
            </div>
            {formData.aceita_partilha && (
              <Alert>
                <AlertDescription className="text-sm">
                  Ao aceitar partilha, outros funcionários com viagens semelhantes poderão solicitar 
                  lugar na mesma viatura, otimizando recursos.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preferências */}
          <div className="space-y-4">
            <h3 className="font-semibold">Preferências (opcional)</h3>
            <div className="space-y-2">
              <Label htmlFor="tipo_viatura">Tipo de Viatura Preferida</Label>
              <select
                id="tipo_viatura"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.tipo_viatura_pretendida}
                onChange={(e) => setFormData({ ...formData, tipo_viatura_pretendida: e.target.value })}
              >
                <option value="">Sem preferência</option>
                <option value="Ligeiro">Ligeiro</option>
                <option value="SUV">SUV</option>
                <option value="Carrinha">Carrinha</option>
                <option value="Pick-up">Pick-up</option>
                <option value="Autocarro">Autocarro</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Outras informações relevantes..."
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
              {pedido ? "Actualizar Rascunho" : "Criar Rascunho"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
