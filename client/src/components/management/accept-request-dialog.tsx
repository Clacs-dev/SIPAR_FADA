import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

interface AcceptRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  type: 'presentation' | 'audience';
  onSuccess: () => void;
}

export function AcceptRequestDialog({ open, onOpenChange, request, type, onSuccess }: AcceptRequestDialogProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        toast.error("Sessão expirada");
        return;
      }

      const endpoint = type === 'presentation' ? 'presentations' : 'audiences';
      
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}/${request.id}/accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            acceptedBy: user.id,
            acceptedByEmail: user.email,
            acceptedByName: user.name,
            adminNotes: notes
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aceitar');
      }

      toast.success("Solicitação aceite! A Secretaria foi notificada para fazer o agendamento.");
      onSuccess();
      onOpenChange(false);
      setNotes("");

    } catch (error) {
 console.error('Accept error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao aceitar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Aceitar Solicitação
          </DialogTitle>
          <DialogDescription>
            Confirme que deseja aceitar esta solicitação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ao aceitar, você assume a responsabilidade por esta solicitação. 
              A <strong>Secretaria</strong> será notificada automaticamente para realizar o agendamento.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Empresa/Requerente</Label>
            <p className="text-sm">{request?.company || 'N/A'}</p>
          </div>

          <div className="space-y-2">
            <Label>Contacto</Label>
            <p className="text-sm">{request?.contact || request?.contactPerson || 'N/A'}</p>
          </div>

          {type === 'presentation' && (
            <>
              <div className="space-y-2">
                <Label>Área</Label>
                <p className="text-sm">{request?.area || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label>Propósito</Label>
                <p className="text-sm">{request?.purpose || 'N/A'}</p>
              </div>
            </>
          )}

          {type === 'audience' && (
            <>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <p className="text-sm">{request?.reason || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <p className="text-sm">{request?.description || 'N/A'}</p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações ou instruções para a Secretaria..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleAccept} disabled={loading}>
            {loading ? "Aceitando..." : "Aceitar Solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
