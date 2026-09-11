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
import { Building, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useDepartments, type Department } from "../../hooks/use-departments";

const CATEGORIAS = [
  { value: 'gabinetes_executivos', label: 'Gabinetes Executivos' },
  { value: 'gabinetes_governamentais', label: 'Gabinetes Governamentais' },
  { value: 'operacionais', label: 'Departamentos Operacionais' },
  { value: 'apoio', label: 'Departamentos de Apoio' },
  { value: 'estrategicos', label: 'Departamentos Estratégicos' },
];

const emptyForm = {
  nome: "",
  categoria: "",
  descricao: "",
  cor: "",
  activo: true,
};

export function DepartmentsAdmin() {
  const { departments, loading, createDepartment, updateDepartment, deleteDepartment } = useDepartments(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreateDialog = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (dept: Department) => {
    setEditing(dept);
    setForm({
      nome: dept.nome,
      categoria: dept.categoria || "",
      descricao: dept.descricao || "",
      cor: dept.cor || "",
      activo: dept.activo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("O nome do departamento é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria || null,
        descricao: form.descricao.trim() || null,
        cor: form.cor || null,
        activo: form.activo,
      };

      if (editing) {
        await updateDepartment(editing.id, payload);
        toast.success("Departamento actualizado com sucesso");
      } else {
        await createDepartment(payload);
        toast.success("Departamento criado com sucesso");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar departamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    try {
      await deleteDepartment(dept.id);
      toast.success("Departamento movido para a lixeira");
    } catch (error: any) {
      toast.error(error.message || "Erro ao eliminar departamento");
    }
  };

  const categoriaLabel = (value: string | null) => CATEGORIAS.find((c) => c.value === value)?.label || value || '-';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
            Administração
          </div>
          <h1 className="flex items-center gap-2 font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>
            <Building className="h-6 w-6" />
            Gestão de Departamentos
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
            Cadastre e organize os departamentos da instituição
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Departamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departamentos cadastrados</CardTitle>
          <CardDescription>{departments.length} departamento(s) no total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum departamento cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Utilizadores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.nome}</TableCell>
                    <TableCell>{categoriaLabel(dept.categoria)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {dept.total_utilizadores ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="text-white"
                        style={{ backgroundColor: dept.activo ? 'var(--tone-success)' : 'var(--tone-neutral)' }}
                      >
                        {dept.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(dept)}>
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
                              <AlertDialogTitle>Eliminar departamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem a certeza que deseja eliminar o departamento <strong>{dept.nome}</strong>? O registo é
                                movido para a lixeira e pode ser restaurado por um administrador do sistema. Só é possível
                                eliminar departamentos sem utilizadores associados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(dept)}
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
            <DialogTitle>{editing ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
            <DialogDescription>Preencha os dados do departamento</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Departamento *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Departamento de Planeamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={form.categoria} onValueChange={(value) => setForm({ ...form, categoria: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label htmlFor="activo">Departamento activo</Label>
                <p className="text-xs text-muted-foreground">Departamentos inactivos não aparecem para atribuição</p>
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
