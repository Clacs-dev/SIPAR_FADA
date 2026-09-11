import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
import { Layers, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAreas, type Area } from "../../hooks/use-areas";
import { useDepartments } from "../../hooks/use-departments";

const emptyForm = {
  nome: "",
  departmentId: "",
  descricao: "",
  activo: true,
};

export function AreasAdmin() {
  const { departments } = useDepartments(true);
  const [filterDepartmentId, setFilterDepartmentId] = useState("todos");
  const { areas, loading, createArea, updateArea, deleteArea } = useAreas(
    filterDepartmentId === "todos" ? undefined : filterDepartmentId,
    true
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreateDialog = () => {
    setEditing(null);
    setForm({ ...emptyForm, departmentId: filterDepartmentId === "todos" ? "" : filterDepartmentId });
    setDialogOpen(true);
  };

  const openEditDialog = (area: Area) => {
    setEditing(area);
    setForm({
      nome: area.nome,
      departmentId: area.departamento_id,
      descricao: area.descricao || "",
      activo: area.activo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("O nome da área é obrigatório");
      return;
    }
    if (!form.departmentId) {
      toast.error("Selecione o departamento da área");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        departmentId: form.departmentId,
        descricao: form.descricao.trim() || null,
        activo: form.activo,
      };

      if (editing) {
        await updateArea(editing.id, payload);
        toast.success("Área actualizada com sucesso");
      } else {
        await createArea(payload);
        toast.success("Área criada com sucesso");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar área");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (area: Area) => {
    try {
      await deleteArea(area.id);
      toast.success("Área movida para a lixeira");
    } catch (error: any) {
      toast.error(error.message || "Erro ao eliminar área");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
            Administração
          </div>
          <h1 className="flex items-center gap-2 font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>
            <Layers className="h-6 w-6" />
            Gestão de Áreas
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
            Sub-divisões dentro de cada departamento (ex.: Gabinete Executivo → Área Jurídica)
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Área
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Label className="text-sm text-muted-foreground">Filtrar por departamento</Label>
        <Select value={filterDepartmentId} onValueChange={setFilterDepartmentId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os departamentos</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Áreas cadastradas</CardTitle>
          <CardDescription>{areas.length} área(s) no total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
          ) : areas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma área cadastrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Utilizadores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.nome}</TableCell>
                    <TableCell>{area.departamento_nome || '-'}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {area.total_utilizadores ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="text-white"
                        style={{ backgroundColor: area.activo ? 'var(--tone-success)' : 'var(--tone-neutral)' }}
                      >
                        {area.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(area)}>
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
                              <AlertDialogTitle>Eliminar área</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem a certeza que deseja eliminar a área <strong>{area.nome}</strong>? O registo é movido
                                para a lixeira e pode ser restaurado por um administrador do sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(area)}
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
            <DialogTitle>{editing ? "Editar Área" : "Nova Área"}</DialogTitle>
            <DialogDescription>Preencha os dados da área</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento *</Label>
              <Select value={form.departmentId} onValueChange={(value) => setForm({ ...form, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Área *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Área Jurídica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label htmlFor="activo">Área activa</Label>
                <p className="text-xs text-muted-foreground">Áreas inactivas não aparecem para atribuição</p>
              </div>
              <Switch
                id="activo"
                checked={form.activo}
                onCheckedChange={(checked) => setForm({ ...form, activo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "A guardar..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
