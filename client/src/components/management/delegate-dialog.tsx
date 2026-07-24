import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { UserCheck } from "lucide-react";

interface DelegateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  type: 'presentation' | 'audience';
  onSuccess: () => void;
}

export function DelegateDialog({ open, onOpenChange, request, type, onSuccess }: DelegateDialogProps) {
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [notes, setNotes] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAdmins();
    }
  }, [open]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_BASE_URL}/users`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas administradores
        const adminUsers = data.users?.filter((u: any) => u.role === 'admin') || [];
        setAdmins(adminUsers);
      }
    } catch (error) {
 console.error('Error fetching admins:', error);
    }
  };

  const handleDelegate = async () => {
    if (!selectedAdmin) {
      toast.error("Selecione um administrador");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const selectedAdminData = admins.find(a => a.id === selectedAdmin);

      const endpoint = type === 'presentation' ? 'presentations' : 'audiences';
      
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}/${request.id}/delegate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            delegatedTo: selectedAdmin,
            delegatedToEmail: selectedAdminData.email,
            delegatedToName: selectedAdminData.name,
            delegationNotes: notes
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao delegar');
      }

      toast.success(`Solicitação delegada para ${selectedAdminData.name}`);
      onSuccess();
      onOpenChange(false);
      setSelectedAdmin("");
      setNotes("");

    } catch (error) {
 console.error('Delegation error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao delegar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Delegar Solicitação
          </DialogTitle>
          <DialogDescription>
            Transferir esta solicitação para outro administrador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Empresa/Requerente</Label>
            <p className="text-sm">{request?.company || 'N/A'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin">Delegar para *</Label>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger id="admin">
                <SelectValue placeholder="Selecione um administrador" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name} ({admin.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Motivo da delegação ou instruções adicionais..."
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
          <Button onClick={handleDelegate} disabled={loading || !selectedAdmin}>
            {loading ? "Delegando..." : "Delegar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
