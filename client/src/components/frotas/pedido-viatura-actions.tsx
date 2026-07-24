import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, CheckCircle, XCircle, Car, User } from "lucide-react";
import { Viatura, Motorista } from "./types";

// Dialog de Aprovação
interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notas?: string) => Promise<void>;
}

export function ApproveDialog({ open, onOpenChange, onConfirm }: ApproveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notas, setNotas] = useState("");

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(notas);
      onOpenChange(false);
      setNotas("");
    } catch (error) {
 console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Aprovar Pedido de Viatura
          </DialogTitle>
          <DialogDescription>
            Confirme a aprovação deste pedido. Após aprovação, o pedido seguirá para atribuição de viatura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Adicione observações sobre a aprovação..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
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
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Aprovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog de Rejeição
interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => Promise<void>;
}

export function RejectDialog({ open, onOpenChange, onConfirm }: RejectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      setError("O motivo da rejeição é obrigatório");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await onConfirm(motivo);
      onOpenChange(false);
      setMotivo("");
    } catch (err: any) {
      setError(err.message || "Erro ao rejeitar pedido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Rejeitar Pedido de Viatura
          </DialogTitle>
          <DialogDescription>
            Indique o motivo da rejeição. O solicitante será notificado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da Rejeição *</Label>
            <Textarea
              id="motivo"
              placeholder="Explique o motivo da rejeição..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              required
            />
          </div>
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
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog de Atribuição
interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viaturas: Viatura[];
  motoristas: Motorista[];
  pedidoNecessitaMotorista: boolean;
  onConfirm: (viaturaId: string, motoristaId?: string) => Promise<void>;
}

export function AssignDialog({ 
  open, 
  onOpenChange, 
  viaturas,
  motoristas,
  pedidoNecessitaMotorista,
  onConfirm 
}: AssignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [viaturaId, setViaturaId] = useState("");
  const [motoristaId, setMotoristaId] = useState("");
  const [error, setError] = useState("");

  const viaturasDisponiveis = viaturas.filter(v => v.status === 'disponivel');

  // DEBUG: Verificar viaturas disponíveis
 console.log('[ASSIGN DIALOG] Viaturas:', {
    total: viaturas.length,
    disponiveis: viaturasDisponiveis.length,
    todasViaturas: viaturas,
    viaturasDisponiveis: viaturasDisponiveis
  });

  const handleConfirm = async () => {
    if (!viaturaId) {
      setError("Selecione uma viatura");
      return;
    }

    if (pedidoNecessitaMotorista && (!motoristaId || motoristaId === 'none')) {
      setError("Selecione um motorista (o pedido necessita de motorista)");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      // Se o valor for "none", não enviar motorista
      const motorista = motoristaId === 'none' ? undefined : motoristaId;
      await onConfirm(viaturaId, motorista || undefined);
      onOpenChange(false);
      setViaturaId("");
      setMotoristaId("");
    } catch (err: any) {
      setError(err.message || "Erro ao atribuir viatura");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Atribuir Viatura e Motorista
          </DialogTitle>
          <DialogDescription>
            Selecione a viatura e motorista para este pedido aprovado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selecionar Viatura */}
          <div className="space-y-2">
            <Label htmlFor="viatura">Viatura *</Label>
            <Select value={viaturaId} onValueChange={setViaturaId}>
              <SelectTrigger id="viatura">
                <SelectValue placeholder="Selecione uma viatura disponível" />
              </SelectTrigger>
              <SelectContent>
                {viaturasDisponiveis.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhuma viatura disponível
                  </div>
                ) : (
                  viaturasDisponiveis.map((viatura) => (
                    <SelectItem key={viatura.id} value={viatura.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{viatura.matricula}</span>
                        <span className="text-xs text-muted-foreground">
                          {viatura.marca} {viatura.modelo} - {viatura.tipo} - {viatura.lugares} lugares
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selecionar Motorista */}
          <div className="space-y-2">
            <Label htmlFor="motorista">
              Motorista {pedidoNecessitaMotorista && "*"}
            </Label>
            <Select value={motoristaId} onValueChange={setMotoristaId}>
              <SelectTrigger id="motorista">
                <SelectValue placeholder={
                  pedidoNecessitaMotorista 
                    ? "Selecione um motorista" 
                    : "Selecione se necessário"
                } />
              </SelectTrigger>
              <SelectContent>
                {!pedidoNecessitaMotorista && (
                  <SelectItem value="none">Nenhum (solicitante conduz)</SelectItem>
                )}
                {motoristas.map((motorista) => (
                  <SelectItem key={motorista.id} value={motorista.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{motorista.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {motorista.departamento} - Carta válida até {
                          new Date(motorista.validade_carta).toLocaleDateString('pt-PT')
                        }
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pedidoNecessitaMotorista && (
              <p className="text-xs text-muted-foreground">
                Este pedido requer motorista da empresa
              </p>
            )}
          </div>

          {/* Info sobre conflitos (TODO: implementar verificação) */}
          <Alert>
            <AlertDescription className="text-sm">
              O sistema verificará conflitos de horário antes de confirmar a atribuição.
            </AlertDescription>
          </Alert>
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
          <Button
            onClick={handleConfirm}
            disabled={isLoading || viaturasDisponiveis.length === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}