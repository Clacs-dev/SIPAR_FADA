import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, MapPin, User, Calendar, Clock, Fuel } from "lucide-react";
import { Motorista, Viatura } from "./types";

interface UtilizacaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viatura: Viatura | null;
  motoristas: Motorista[];
  onSubmit: (data: UtilizacaoFormData) => Promise<void>;
}

export interface UtilizacaoFormData {
  motorista_id: string;
  data_saida: string;
  hora_saida: string;
  km_saida: number;
  destino: string;
  finalidade: string;
  passageiros?: string;
  observacoes?: string;
}

export function UtilizacaoForm({ 
  open, 
  onOpenChange, 
  viatura,
  motoristas,
  onSubmit 
}: UtilizacaoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<UtilizacaoFormData>({
    motorista_id: "",
    data_saida: new Date().toISOString().split('T')[0],
    hora_saida: new Date().toTimeString().slice(0, 5),
    km_saida: viatura?.km_atual || 0,
    destino: "",
    finalidade: "",
    passageiros: "",
    observacoes: ""
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open && viatura) {
      setFormData({
        motorista_id: "",
        data_saida: new Date().toISOString().split('T')[0],
        hora_saida: new Date().toTimeString().slice(0, 5),
        km_saida: viatura.km_atual || 0,
        destino: "",
        finalidade: "",
        passageiros: "",
        observacoes: ""
      });
      setError("");
    }
  }, [open, viatura]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validação de viatura
    if (!viatura) {
      setError("Nenhuma viatura selecionada");
      return;
    }
    
    // Validações
    if (!formData.motorista_id) {
      setError("Selecione um motorista");
      return;
    }
    if (!formData.destino.trim()) {
      setError("O destino é obrigatório");
      return;
    }
    if (!formData.finalidade.trim()) {
      setError("A finalidade é obrigatória");
      return;
    }
    if (formData.km_saida < viatura.km_atual) {
      setError(`A kilometragem de saída não pode ser inferior à kilometragem actual (${viatura.km_atual} km)`);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao criar utilização");
    } finally {
      setIsLoading(false);
    }
  };

  // Se não houver viatura, não renderizar o diálogo
  if (!viatura) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nova Utilização - {viatura?.matricula}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para registar uma nova utilização da viatura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Motorista */}
          <div className="space-y-2">
            <Label htmlFor="motorista" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Motorista *
            </Label>
            <Select
              value={formData.motorista_id}
              onValueChange={(value) => setFormData({ ...formData, motorista_id: value })}
            >
              <SelectTrigger id="motorista">
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent>
                {motoristas.map((motorista) => (
                  <SelectItem key={motorista.id} value={motorista.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{motorista.nome}</span>
                      {motorista.departamento && (
                        <span className="text-xs text-muted-foreground">
                          {motorista.departamento}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora de Saída */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data_saida" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Saída *
              </Label>
              <Input
                id="data_saida"
                type="date"
                value={formData.data_saida}
                onChange={(e) => setFormData({ ...formData, data_saida: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_saida" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora de Saída *
              </Label>
              <Input
                id="hora_saida"
                type="time"
                value={formData.hora_saida}
                onChange={(e) => setFormData({ ...formData, hora_saida: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Kilometragem de Saída */}
          <div className="space-y-2">
            <Label htmlFor="km_saida">
              Kilometragem de Saída *
            </Label>
            <Input
              id="km_saida"
              type="number"
              min={viatura.km_atual}
              value={formData.km_saida}
              onChange={(e) => setFormData({ ...formData, km_saida: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Kilometragem actual: {(viatura.km_atual ?? 0).toLocaleString('pt-PT')} km
            </p>
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <Label htmlFor="destino" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Destino *
            </Label>
            <Input
              id="destino"
              placeholder="Ex: Ministério das Finanças"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              required
            />
          </div>

          {/* Finalidade */}
          <div className="space-y-2">
            <Label htmlFor="finalidade">
              Finalidade da Viagem *
            </Label>
            <Textarea
              id="finalidade"
              placeholder="Descreva a finalidade da viagem..."
              value={formData.finalidade}
              onChange={(e) => setFormData({ ...formData, finalidade: e.target.value })}
              rows={3}
              required
            />
          </div>

          {/* Passageiros */}
          <div className="space-y-2">
            <Label htmlFor="passageiros">
              Passageiros (opcional)
            </Label>
            <Textarea
              id="passageiros"
              placeholder="Liste os nomes dos passageiros..."
              value={formData.passageiros}
              onChange={(e) => setFormData({ ...formData, passageiros: e.target.value })}
              rows={2}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">
              Observações (opcional)
            </Label>
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
              Iniciar Utilização
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
