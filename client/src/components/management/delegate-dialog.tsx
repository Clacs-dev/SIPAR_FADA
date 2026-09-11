import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL } from '@/services/api';
import { UserCheck, Search } from "lucide-react";

interface DelegateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  type: 'presentation' | 'audience';
  onSuccess: () => void;
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function DelegateDialog({ open, onOpenChange, request, type, onSuccess }: DelegateDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUserId("");
      setSearch("");
      setNotes("");
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch (error) {
 console.error('Error fetching users:', error);
      toast.error('Erro ao carregar a lista de utilizadores');
    }
  };

  // Só mostra resultados depois de o utilizador pesquisar - não lista todos os
  // utilizadores da plataforma por defeito.
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.trim().toLowerCase();
    return users.filter((u) =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  }, [users, search]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleDelegate = async () => {
    if (!selectedUserId || !selectedUser) {
      toast.error("Selecione um utilizador para delegar");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
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
            status: 'delegado',
            delegatedTo: selectedUser.id,
            delegatedToEmail: selectedUser.email,
            delegatedToName: selectedUser.name,
            delegationNotes: notes,
            // A reunião passa a ser do utilizador delegado: passa a aparecer na
            // agenda dele assim que for agendada.
            assigned_to_id: selectedUser.id,
            assigned_to_name: selectedUser.name,
          })
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error || 'Erro ao delegar');
      }

      toast.success(`Solicitação delegada para ${selectedUser.name}`);
      onSuccess();
      onOpenChange(false);
      setSelectedUserId("");
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
            Transferir esta solicitação para outro utilizador da plataforma. A reunião passará a
            constar na agenda dele assim que for agendada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Empresa/Requerente</Label>
            <p className="text-sm">{request?.company || request?.organization || 'N/A'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-search">Delegar para *</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-search"
                placeholder="Pesquisar por nome, e-mail ou cargo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
              {!search.trim() ? (
                <p className="text-sm text-muted-foreground p-3 text-center">Digite para pesquisar um utilizador...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">Nenhum utilizador encontrado</p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-left p-2 text-sm hover:bg-muted/60 transition-colors ${selectedUserId === u.id ? 'bg-muted' : ''}`}
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-muted-foreground"> — {u.email} ({u.role})</span>
                  </button>
                ))
              )}
            </div>
            {selectedUser && (
              <p className="text-sm text-muted-foreground">Seleccionado: <span className="font-medium text-foreground">{selectedUser.name}</span></p>
            )}
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
          <Button onClick={handleDelegate} disabled={loading || !selectedUserId}>
            {loading ? "Delegando..." : "Delegar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
