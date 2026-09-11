import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DoorOpen, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useMeetingRooms, type MeetingRoom } from "../../hooks/use-meeting-rooms";

const emptyForm = {
  nome: "",
  capacidade: 0,
  localizacao: "",
  recursosText: "",
  ativa: true,
};

export function MeetingRoomsAdmin() {
  const { rooms, loading, createRoom, updateRoom, deleteRoom } = useMeetingRooms(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreateDialog = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (room: MeetingRoom) => {
    setEditingRoom(room);
    setForm({
      nome: room.nome,
      capacidade: room.capacidade,
      localizacao: room.localizacao || "",
      recursosText: (room.recursos || []).join(", "),
      ativa: room.ativa,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("O nome da sala é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        capacidade: Number(form.capacidade) || 0,
        localizacao: form.localizacao.trim() || null,
        recursos: form.recursosText
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        ativa: form.ativa,
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        toast.success("Sala actualizada com sucesso");
      } else {
        await createRoom(payload);
        toast.success("Sala criada com sucesso");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar sala");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: MeetingRoom) => {
    try {
      await deleteRoom(room.id);
      toast.success("Sala removida/desactivada com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao eliminar sala");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <DoorOpen className="h-6 w-6" />
            Gestão de Salas de Reunião
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre as salas disponíveis para agendamento de reuniões internas
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Sala
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salas cadastradas</CardTitle>
          <CardDescription>{rooms.length} sala(s) no total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma sala cadastrada ainda. Clique em "Nova Sala" para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Recursos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.nome}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {room.capacidade}
                      </span>
                    </TableCell>
                    <TableCell>{room.localizacao || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {room.recursos.length === 0
                          ? "-"
                          : room.recursos.map((r) => (
                              <Badge key={r} variant="outline">{r}</Badge>
                            ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={room.ativa ? "bg-tone-success-soft text-tone-success" : "bg-tone-neutral-soft text-tone-neutral"}>
                        {room.ativa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(room)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" style={{ color: 'var(--tone-danger)' }} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar sala</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem a certeza que deseja eliminar a sala <strong>{room.nome}</strong>? Se houver reuniões
                                associadas, a sala é apenas desactivada em vez de eliminada.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(room)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Editar Sala" : "Nova Sala"}</DialogTitle>
            <DialogDescription>
              Preencha os dados da sala de reunião
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Sala *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Sala de Reuniões 1"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacidade">Capacidade (pessoas)</Label>
                <Input
                  id="capacidade"
                  type="number"
                  min="0"
                  value={form.capacidade}
                  onChange={(e) => setForm({ ...form, capacidade: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  value={form.localizacao}
                  onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                  placeholder="Ex: 2º Piso, Ala Norte"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recursos">Recursos (separados por vírgula)</Label>
              <Input
                id="recursos"
                value={form.recursosText}
                onChange={(e) => setForm({ ...form, recursosText: e.target.value })}
                placeholder="Ex: Projector, Videoconferência, Quadro branco"
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label htmlFor="ativa">Sala activa</Label>
                <p className="text-xs text-muted-foreground">Salas inactivas não aparecem para agendamento</p>
              </div>
              <Switch
                id="ativa"
                checked={form.ativa}
                onCheckedChange={(checked) => setForm({ ...form, ativa: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
